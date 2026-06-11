const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const config = require('../../config');
const semantic = require('./semantic-search');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/../client'));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const symbol = res.statusCode < 400 ? '✓' : '✗';
    console.log(`  ${symbol} ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// 数据库连接池
const pool = mysql.createPool({
  ...config.db,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
});

// 辅助：确保舞见-舞团成员关系
async function ensureMembership(pool, dancerId, danceGroupId) {
  if (!dancerId || !danceGroupId) return;
  try {
    await pool.query(
      'INSERT IGNORE INTO dancer_group_membership (dancer_id, dance_group_id) VALUES (?, ?)',
      [dancerId, danceGroupId]);
  } catch(e) { /* 忽略重复 */ }
}

// ========== 企划 API ==========

app.get('/api/projects', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM project ORDER BY project_id');
  res.json(rows);
});

app.get('/api/projects/:id', async (req, res) => {
  const [[row]] = await pool.query('SELECT * FROM project WHERE project_id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: '未找到' });
  res.json(row);
});

// ========== 动漫团 API ==========

app.get('/api/groups', async (req, res) => {
  const { project_id } = req.query;
  let sql = `SELECT g.*, p.name AS project_name,
             (SELECT COUNT(*) FROM \`character\` c WHERE c.group_id = g.group_id) AS char_count
             FROM anime_group g LEFT JOIN project p ON g.project_id = p.project_id`;
  const params = [];
  if (project_id) { sql += ' WHERE g.project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY g.group_id';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get('/api/groups/:id', async (req, res) => {
  const [[group]] = await pool.query(
    `SELECT g.*, p.name AS project_name FROM anime_group g
     LEFT JOIN project p ON g.project_id = p.project_id WHERE g.group_id = ?`,
    [req.params.id]);
  if (!group) return res.status(404).json({ error: '未找到' });
  const [members] = await pool.query(
    `SELECT c.character_id, c.name, c.birthday, c.blood_type, c.height,
            c.cheering_color, cv.name AS cv_name
     FROM \`character\` c LEFT JOIN cv ON c.cv_id = cv.cv_id
     WHERE c.group_id = ? ORDER BY c.character_id`, [req.params.id]);
  res.json({ ...group, members });
});

// ========== 角色 API ==========

app.get('/api/characters', async (req, res) => {
  const { group_id, search, cv_age_min, cv_age_max } = req.query;
  let sql = `SELECT c.*, g.name AS group_name, cv.name AS cv_name, cv.birth_date, c.eye_color
             FROM \`character\` c
             LEFT JOIN anime_group g ON c.group_id = g.group_id
             LEFT JOIN cv ON c.cv_id = cv.cv_id WHERE 1=1`;
  const params = [];
  if (group_id) { sql += ' AND c.group_id = ?'; params.push(group_id); }
  if (cv_age_min) { sql += ' AND TIMESTAMPDIFF(YEAR, cv.birth_date, CURDATE()) >= ?'; params.push(parseInt(cv_age_min)); }
  if (cv_age_max) { sql += ' AND TIMESTAMPDIFF(YEAR, cv.birth_date, CURDATE()) <= ?'; params.push(parseInt(cv_age_max)); }

  // 多关键词模糊搜索
  if (search) {
    var keywords = search.trim().split(/\s+/).filter(Boolean);
    if (keywords.length > 0) {
      var clauses = [];
      var scoreParts = [];
      keywords.forEach(function(kw) {
        var like = '%' + kw + '%';
        // 匹配条件：任意字段命中
        clauses.push('(c.name LIKE ? OR c.hobby LIKE ? OR c.description LIKE ? OR cv.name LIKE ? OR g.name LIKE ? OR c.eye_color LIKE ? OR c.cheering_color LIKE ? OR c.call_response LIKE ? OR c.blood_type LIKE ?)');
        params.push(like, like, like, like, like, like, like, like, like);
        // 相关性评分
        scoreParts.push('(CASE WHEN c.name = ? THEN 20 WHEN c.name LIKE ? THEN 10 ELSE 0 END)');
        params.push(kw, like);
        scoreParts.push('(CASE WHEN c.description LIKE ? OR c.hobby LIKE ? THEN 4 ELSE 0 END)');
        params.push(like, like);
        scoreParts.push('(CASE WHEN cv.name LIKE ? OR g.name LIKE ? THEN 2 ELSE 0 END)');
        params.push(like, like);
        scoreParts.push('(CASE WHEN c.eye_color LIKE ? OR c.cheering_color LIKE ? OR c.call_response LIKE ? OR c.blood_type LIKE ? THEN 1 ELSE 0 END)');
        params.push(like, like, like, like);
      });
      sql += ' AND (' + clauses.join(' AND ') + ') ORDER BY (' + scoreParts.join(' + ') + ') DESC, c.character_id';
    } else {
      sql += ' ORDER BY c.character_id';
    }
  } else {
    sql += ' ORDER BY c.character_id';
  }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// 语义向量搜索角色（TF-IDF + Cosine Similarity）
app.get('/api/characters/semantic', async (req, res) => {
  const { q, top } = req.query;
  if (!q) return res.json([]);
  var scored = semantic.search(q.trim(), parseInt(top) || 20, 0.01);
  var rows = await semantic.getCharactersByIds(pool, scored);
  res.json(rows);
});

app.get('/api/characters/:id', async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT c.*, g.name AS group_name, cv.name AS cv_name, cv.birth_date
     FROM \`character\` c
     LEFT JOIN anime_group g ON c.group_id = g.group_id
     LEFT JOIN cv ON c.cv_id = cv.cv_id WHERE c.character_id = ?`,
    [req.params.id]);
  if (!row) return res.status(404).json({ error: '未找到' });
  const [rehearsals] = await pool.query(
    `SELECT DISTINCT r.rehearsal_id, r.rehearsal_date, r.start_time, r.end_time, r.location,
            dg.name AS dance_group_name, dg.dance_group_id, d.cn_name, d.dancer_id
     FROM rehearsal_participation rp
     JOIN rehearsal r ON rp.rehearsal_id = r.rehearsal_id
     JOIN dance_group dg ON r.dance_group_id = dg.dance_group_id
     JOIN dancer d ON rp.dancer_id = d.dancer_id
     WHERE rp.character_id = ? AND (r.status IS NULL OR r.status != 'cancelled')
     ORDER BY r.rehearsal_date DESC LIMIT 20`,
    [req.params.id]);
  res.json({ ...row, rehearsals });
});

// ========== 声优 API ==========

app.get('/api/seiyuu', async (req, res) => {
  const { age_min, age_max } = req.query;
  let sql = `SELECT cv_id, name, birth_date, agency,
             TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age
             FROM cv WHERE 1=1`;
  const params = [];
  if (age_min) { sql += ' AND TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= ?'; params.push(parseInt(age_min)); }
  if (age_max) { sql += ' AND TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) <= ?'; params.push(parseInt(age_max)); }
  sql += ' ORDER BY age';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get('/api/seiyuu/:id', async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT cv_id, name, birth_date, agency,
     TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) AS age FROM cv WHERE cv_id = ?`,
    [req.params.id]);
  if (!row) return res.status(404).json({ error: '未找到' });
  const [chars] = await pool.query(
    `SELECT c.character_id, c.name, g.name AS group_name
     FROM \`character\` c JOIN anime_group g ON c.group_id = g.group_id
     WHERE c.cv_id = ? ORDER BY c.character_id`, [req.params.id]);
  res.json({ ...row, characters: chars });
});

// ========== 舞团 API ==========

app.get('/api/dance-groups', async (req, res) => {
  const { anime_group_id } = req.query;
  let sql = `SELECT dg.*, ag.name AS anime_group_name
             FROM dance_group dg LEFT JOIN anime_group ag ON dg.anime_group_id = ag.group_id`;
  const params = [];
  if (anime_group_id) { sql += ' WHERE dg.anime_group_id = ?'; params.push(anime_group_id); }
  sql += ' ORDER BY dg.dance_group_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get('/api/dance-groups/:id', async (req, res) => {
  const [[dg]] = await pool.query(
    `SELECT dg.*, ag.name AS anime_group_name
     FROM dance_group dg LEFT JOIN anime_group ag ON dg.anime_group_id = ag.group_id
     WHERE dg.dance_group_id = ?`, [req.params.id]);
  if (!dg) return res.status(404).json({ error: '未找到' });
  const [dancers] = await pool.query('SELECT * FROM dancer WHERE dance_group_id = ?', [req.params.id]);
  const [rehearsals] = await pool.query(
    `SELECT * FROM rehearsal_with_count WHERE dance_group_id = ? AND status = 'active' ORDER BY rehearsal_date DESC`,
    [req.params.id]);
  res.json({ ...dg, dancers, rehearsals });
});

app.post('/api/dance-groups', async (req, res) => {
  const { name, anime_group_id, description } = req.body;
  const [result] = await pool.query(
    'INSERT INTO dance_group (name, anime_group_id, description, created_date) VALUES (?, ?, ?, CURDATE())',
    [name, anime_group_id || null, description || null]);
  res.json({ dance_group_id: result.insertId });
});

app.delete('/api/dance-groups/:id', async (req, res) => {
  const [[dg]] = await pool.query('SELECT * FROM dance_group WHERE dance_group_id = ?', [req.params.id]);
  if (!dg) return res.status(404).json({ error: '舞团不存在' });
  await pool.query('DELETE FROM dance_group WHERE dance_group_id = ?', [req.params.id]);
  res.json({ success: true, name: dg.name });
});

// ========== 舞见 API ==========

app.get('/api/dancers/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const [rows] = await pool.query(
    `SELECT d.*, dg.name AS dance_group_name FROM dancer d
     LEFT JOIN dance_group dg ON d.dance_group_id=dg.dance_group_id
     WHERE d.cn_name LIKE ? OR d.qq LIKE ? ORDER BY d.cn_name LIMIT 10`,
    ['%'+q+'%', '%'+q+'%']);
  res.json(rows);
});

// 推荐舞见：根据舞团+角色的历史出演记录
app.get('/api/dancers/recommend', async (req, res) => {
  const { dance_group_id, character_id } = req.query;
  if (!dance_group_id || !character_id) return res.json({ in_group: [], other_group: [] });
  // 本团推荐：同舞团 + 演过此角色，按次数降序
  const [inGroup] = await pool.query(
    `SELECT d.dancer_id, d.cn_name, d.qq, dg.name AS dance_group_name, COUNT(rp.participation_id) AS play_count
     FROM dancer d
     JOIN rehearsal_participation rp ON d.dancer_id = rp.dancer_id
     JOIN rehearsal r ON rp.rehearsal_id = r.rehearsal_id
     LEFT JOIN dance_group dg ON d.dance_group_id = dg.dance_group_id
     WHERE d.dance_group_id = ? AND rp.character_id = ?
       AND (r.status IS NULL OR r.status != 'cancelled')
     GROUP BY d.dancer_id ORDER BY play_count DESC LIMIT 5`,
    [parseInt(dance_group_id), parseInt(character_id)]);
  // 别团推荐：其他舞团 + 演过此角色，按次数降序
  const [otherGroup] = await pool.query(
    `SELECT d.dancer_id, d.cn_name, d.qq, dg.name AS dance_group_name, COUNT(rp.participation_id) AS play_count
     FROM dancer d
     JOIN rehearsal_participation rp ON d.dancer_id = rp.dancer_id
     JOIN rehearsal r ON rp.rehearsal_id = r.rehearsal_id
     LEFT JOIN dance_group dg ON d.dance_group_id = dg.dance_group_id
     WHERE d.dance_group_id != ? AND rp.character_id = ?
       AND (r.status IS NULL OR r.status != 'cancelled')
     GROUP BY d.dancer_id ORDER BY play_count DESC LIMIT 5`,
    [parseInt(dance_group_id), parseInt(character_id)]);
  res.json({ in_group: inGroup, other_group: otherGroup });
});

// 按角色名搜索舞见（角色偏见，支持逗号分隔多选）
app.get('/api/dancers/by-character', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const chars = q.split(',').map(function(s){return s.trim();}).filter(Boolean);
  if (!chars.length) return res.json([]);
  const likes = chars.map(function(){return 'c.name LIKE ?';}).join(' OR ');
  const params = chars.map(function(c){return '%'+c+'%';});
  const [rows] = await pool.query(
    `SELECT DISTINCT d.*, dg.name AS dance_group_name
     FROM dancer d
     LEFT JOIN dance_group dg ON d.dance_group_id = dg.dance_group_id
     JOIN rehearsal_participation rp ON d.dancer_id = rp.dancer_id
     JOIN \`character\` c ON rp.character_id = c.character_id
     JOIN rehearsal r ON rp.rehearsal_id = r.rehearsal_id
     WHERE (`+likes+`) AND (r.status IS NULL OR r.status != 'cancelled') ORDER BY d.cn_name`,
    params);
  // 附加多团信息
  if (rows.length) {
    const ids = rows.map(r => r.dancer_id).join(',');
    const [mems] = await pool.query('SELECT dgm.dancer_id, dgm.dance_group_id, dg.name AS dance_group_name FROM dancer_group_membership dgm JOIN dance_group dg ON dgm.dance_group_id=dg.dance_group_id WHERE dgm.dancer_id IN ('+ids+')');
    const map = {}; mems.forEach(m => { if(!map[m.dancer_id]) map[m.dancer_id]=[]; map[m.dancer_id].push({dance_group_id:m.dance_group_id, dance_group_name:m.dance_group_name}); });
    rows.forEach(r => { r.groups = map[r.dancer_id] || (r.dance_group_id ? [{dance_group_id:r.dance_group_id, dance_group_name:r.dance_group_name}] : []); });
  }
  res.json(rows);
});

app.get('/api/dancers', async (req, res) => {
  const { dance_group_id } = req.query;
  let sql = 'SELECT DISTINCT d.* FROM dancer d';
  const params = [];
  if (dance_group_id) {
    sql += ' LEFT JOIN dancer_group_membership dgm ON d.dancer_id = dgm.dancer_id';
    sql += ' WHERE d.dance_group_id = ? OR dgm.dance_group_id = ?';
    params.push(dance_group_id, dance_group_id);
  }
  const [rows] = await pool.query(sql, params);
  // 为每个舞见附加所有所属舞团
  if (rows.length) {
    const ids = rows.map(r => r.dancer_id);
    // 取主团名
    const dgIds = [...new Set(rows.filter(r => r.dance_group_id).map(r => r.dance_group_id))];
    const dgNameMap = {};
    if (dgIds.length) {
      const [dgs] = await pool.query('SELECT dance_group_id, name FROM dance_group WHERE dance_group_id IN ('+dgIds.join(',')+')');
      dgs.forEach(dg => { dgNameMap[dg.dance_group_id] = dg.name; });
    }
    // 取关联团
    const [memberships] = await pool.query(
      'SELECT dgm.dancer_id, dgm.dance_group_id, dg.name AS dance_group_name FROM dancer_group_membership dgm JOIN dance_group dg ON dgm.dance_group_id=dg.dance_group_id WHERE dgm.dancer_id IN ('+ids.join(',')+')');
    const groupMap = {};
    rows.forEach(r => {
      groupMap[r.dancer_id] = [];
      if (r.dance_group_id) groupMap[r.dancer_id].push({dance_group_id: r.dance_group_id, dance_group_name: dgNameMap[r.dance_group_id] || ''});
    });
    memberships.forEach(m => {
      if (!groupMap[m.dancer_id]) groupMap[m.dancer_id] = [];
      if (!groupMap[m.dancer_id].find(x => x.dance_group_id === m.dance_group_id))
        groupMap[m.dancer_id].push({dance_group_id: m.dance_group_id, dance_group_name: m.dance_group_name});
    });
    rows.forEach(r => { r.groups = groupMap[r.dancer_id] || []; });
  }
  res.json(rows);
});

app.post('/api/dancers', async (req, res) => {
  const { dance_group_id, cn_name, qq, contact_info } = req.body;
  if (!cn_name || !cn_name.trim()) return res.status(400).json({ error: 'CN名不能为空' });
  if (qq) {
    const [dup] = await pool.query('SELECT * FROM dancer WHERE qq=? AND cn_name=?', [qq, cn_name.trim()]);
    if (dup.length) {
      // 已存在，确保加入该舞团
      if (dance_group_id) await ensureMembership(pool, dup[0].dancer_id, dance_group_id);
      return res.json(dup[0]);
    }
  }
  const dgId = dance_group_id || null;
  const [result] = await pool.query(
    'INSERT INTO dancer (dance_group_id, cn_name, qq, contact_info) VALUES (?, ?, ?, ?)',
    [dgId, cn_name.trim(), qq || null, contact_info || null]);
  if (dance_group_id) await ensureMembership(pool, result.insertId, dance_group_id);
  res.json({ dancer_id: result.insertId, cn_name: cn_name.trim(), qq: qq || null, dance_group_id: dgId });
});

app.put('/api/dancers/:id', async (req, res) => {
  const { dance_group_id, cn_name, qq, contact_info } = req.body;
  const [[d]] = await pool.query('SELECT * FROM dancer WHERE dancer_id=?', [req.params.id]);
  if (!d) return res.status(404).json({ error: '舞见不存在' });
  const oldDgId = d.dance_group_id;
  const newDgId = dance_group_id !== undefined ? (dance_group_id || null) : oldDgId;
  // 如果主团变化，保留旧团在关联表中
  if (oldDgId && newDgId && oldDgId !== newDgId) {
    await pool.query('INSERT IGNORE INTO dancer_group_membership (dancer_id, dance_group_id) VALUES (?, ?)', [parseInt(req.params.id), oldDgId]);
  }
  await pool.query(
    'UPDATE dancer SET dance_group_id=?, cn_name=?, qq=?, contact_info=? WHERE dancer_id=?',
    [newDgId, cn_name || d.cn_name,
     qq !== undefined ? (qq || null) : d.qq,
     contact_info !== undefined ? (contact_info || null) : d.contact_info,
     req.params.id]);
  // 确保新团成员关系
  if (newDgId) await pool.query('INSERT IGNORE INTO dancer_group_membership (dancer_id, dance_group_id) VALUES (?, ?)', [parseInt(req.params.id), newDgId]);
  const [[updated]] = await pool.query('SELECT * FROM dancer WHERE dancer_id=?', [req.params.id]);
  res.json(updated);
});

app.get('/api/dancers/:id/stats', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.name AS character_name, c.character_id, c.cheering_color, COUNT(*) AS play_count
     FROM rehearsal_participation rp
     JOIN \`character\` c ON rp.character_id=c.character_id
     JOIN rehearsal r ON rp.rehearsal_id=r.rehearsal_id
     WHERE rp.dancer_id=? AND (r.status IS NULL OR r.status != 'cancelled')
     GROUP BY c.character_id ORDER BY play_count DESC LIMIT 10`,
    [req.params.id]);
  res.json(rows);
});

// 舞见参与的所有排练（含取消的）
app.get('/api/dancers/:id/rehearsals', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.rehearsal_id, r.rehearsal_date, r.start_time, r.end_time, r.location,
            r.status, r.content_summary, dg.name AS dance_group_name, dg.dance_group_id,
            c.name AS character_name, c.character_id, c.cheering_color
     FROM rehearsal_participation rp
     JOIN rehearsal r ON rp.rehearsal_id = r.rehearsal_id
     JOIN dance_group dg ON r.dance_group_id = dg.dance_group_id
     JOIN \`character\` c ON rp.character_id = c.character_id
     WHERE rp.dancer_id = ?
     ORDER BY r.rehearsal_date DESC, r.start_time DESC`,
    [req.params.id]);
  res.json(rows);
});

// 将舞见从指定舞团中移除（保留排练记录）
app.delete('/api/dancers/:id/groups/:gid', async (req, res) => {
  const did = parseInt(req.params.id);
  const gid = parseInt(req.params.gid);
  // 从关联表删除
  await pool.query('DELETE FROM dancer_group_membership WHERE dancer_id=? AND dance_group_id=?', [did, gid]);
  // 如果主团是这个，切换到另一个团或置空
  const [[d]] = await pool.query('SELECT dance_group_id FROM dancer WHERE dancer_id=?', [did]);
  if (d && d.dance_group_id === gid) {
    const [mems] = await pool.query('SELECT dance_group_id FROM dancer_group_membership WHERE dancer_id=? LIMIT 1', [did]);
    await pool.query('UPDATE dancer SET dance_group_id=? WHERE dancer_id=?', [mems.length ? mems[0].dance_group_id : null, did]);
  }
  res.json({success:true});
});

app.delete('/api/dancers/:id', async (req, res) => {
  await pool.query('DELETE FROM dancer WHERE dancer_id=?', [req.params.id]);
  res.json({success:true});
});

// ========== 排练 API ==========

app.get('/api/rehearsals', async (req, res) => {
  const { date_from, date_to, dance_group_id, status, reh_status } = req.query;
  let sql = 'SELECT * FROM rehearsal_with_count WHERE 1=1';
  const params = [];
  if (date_from) { sql += ' AND rehearsal_date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND rehearsal_date <= ?'; params.push(date_to); }
  if (dance_group_id) { sql += ' AND dance_group_id = ?'; params.push(dance_group_id); }
  if (status && status !== 'all') { sql += ' AND occupancy_status = ?'; params.push(status); }
  if (reh_status === 'active') { sql += ' AND status = \'active\''; }
  else if (reh_status === 'cancelled') { sql += ' AND status = \'cancelled\''; }
  sql += ' ORDER BY rehearsal_date, start_time';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get('/api/rehearsals/:id', async (req, res) => {
  const [[reh]] = await pool.query('SELECT * FROM rehearsal_with_count WHERE rehearsal_id = ?', [req.params.id]);
  if (!reh) return res.status(404).json({ error: '未找到' });
  const [participants] = await pool.query(
    `SELECT rp.*, d.cn_name, c.name AS character_name
     FROM rehearsal_participation rp
     JOIN dancer d ON rp.dancer_id = d.dancer_id
     JOIN \`character\` c ON rp.character_id = c.character_id
     WHERE rp.rehearsal_id = ?`, [req.params.id]);
  res.json({ ...reh, participants });
});

app.post('/api/rehearsals', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { dance_group_id, rehearsal_date, start_time, end_time, location, content_summary, participants } = req.body;
    // 自动计算人数上限 = 舞团对应动漫团的角色数
    const [[dg]] = await conn.query('SELECT anime_group_id FROM dance_group WHERE dance_group_id=?', [dance_group_id]);
    var maxParticipants = 0;
    if (dg && dg.anime_group_id) {
      const [[{cnt}]] = await conn.query('SELECT COUNT(*) AS cnt FROM `character` WHERE group_id=?', [dg.anime_group_id]);
      maxParticipants = cnt;
    }
    const [result] = await conn.query(
      'INSERT INTO rehearsal (dance_group_id, rehearsal_date, start_time, end_time, location, max_participants, content_summary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dance_group_id, rehearsal_date, start_time, end_time, location, maxParticipants, content_summary || null]);
    const rehearsalId = result.insertId;
    // 创建初始舞见参与记录
    if (participants && participants.length) {
      for (const p of participants) {
        if (!p.character_id) continue;
        let dancerId = p.dancer_id || null;
        // 如果前端指定了 dancer_id，信任它；否则按 CN/QQ 查找
        if (!dancerId) {
          if (p.qq) {
            const [byQQ] = await conn.query('SELECT dancer_id, dance_group_id FROM dancer WHERE qq=?', [p.qq]);
            if (byQQ.length) dancerId = byQQ[0].dancer_id;
          }
          if (!dancerId && p.cn_name) {
            const [byCN] = await conn.query('SELECT dancer_id, dance_group_id FROM dancer WHERE cn_name=? LIMIT 1', [p.cn_name]);
            if (byCN.length) dancerId = byCN[0].dancer_id;
          }
          if (!dancerId) {
            const [dr] = await conn.query('INSERT INTO dancer (dance_group_id, cn_name, qq) VALUES (?, ?, ?)',
              [dance_group_id, p.cn_name || null, p.qq || null]);
            dancerId = dr.insertId;
          }
        }
        // 如果舞见不在当前舞团，切换主团并保留旧团在关联表
        const [[dancer]] = await conn.query('SELECT dance_group_id FROM dancer WHERE dancer_id=?', [dancerId]);
        if (dancer) {
          if (!dancer.dance_group_id) {
            await conn.query('UPDATE dancer SET dance_group_id=? WHERE dancer_id=?', [dance_group_id, dancerId]);
          } else if (dancer.dance_group_id !== dance_group_id) {
            // 保留原来的团在关联表中
            await conn.query('INSERT IGNORE INTO dancer_group_membership (dancer_id, dance_group_id) VALUES (?, ?)', [dancerId, dancer.dance_group_id]);
            // 切换到新团为主团
            await conn.query('UPDATE dancer SET dance_group_id=? WHERE dancer_id=?', [dance_group_id, dancerId]);
          }
          await conn.query('INSERT IGNORE INTO dancer_group_membership (dancer_id, dance_group_id) VALUES (?, ?)', [dancerId, dance_group_id]);
        }
        await conn.query('INSERT INTO rehearsal_participation (rehearsal_id, dancer_id, character_id) VALUES (?, ?, ?)',
          [rehearsalId, dancerId, p.character_id]);
      }
    }
    await conn.commit();
    res.json({ rehearsal_id: rehearsalId, max_participants: maxParticipants });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

app.put('/api/rehearsals/:id', async (req, res) => {
  const { dance_group_id, rehearsal_date, start_time, end_time, location, content_summary, excluded_chars } = req.body;
  // 自动重算人数上限（卡片决定）
  const [[dg]] = await pool.query('SELECT anime_group_id FROM dance_group WHERE dance_group_id=?', [dance_group_id]);
  var maxParticipants = 0;
  if (dg && dg.anime_group_id) {
    const [[{cnt}]] = await pool.query('SELECT COUNT(*) AS cnt FROM `character` WHERE group_id=?', [dg.anime_group_id]);
    maxParticipants = cnt;
  }
  await pool.query(
    'UPDATE rehearsal SET dance_group_id=?, rehearsal_date=?, start_time=?, end_time=?, location=?, max_participants=?, content_summary=?, excluded_chars=? WHERE rehearsal_id=?',
    [dance_group_id, rehearsal_date, start_time, end_time, location, maxParticipants, content_summary, excluded_chars||null, req.params.id]);
  res.json({ success: true });
});

// 移除角色卡片（支持excluded和extra两种模式）
app.delete('/api/rehearsals/:id/chars/:charId', async (req, res) => {
  try {
    var [[reh]] = await pool.query('SELECT excluded_chars, extra_chars FROM rehearsal WHERE rehearsal_id=?', [req.params.id]);
    if (!reh) return res.status(404).json({error:'未找到'});
    var cid = parseInt(req.params.charId);
    var excluded = reh.excluded_chars ? reh.excluded_chars.split(',').map(Number) : [];
    var extra = reh.extra_chars ? reh.extra_chars.split(',').map(Number) : [];
    // 删除参与记录
    await pool.query('DELETE FROM rehearsal_participation WHERE rehearsal_id=? AND character_id=?', [req.params.id, cid]);
    if (extra.includes(cid)) {
      extra = extra.filter(function(x) { return x !== cid; });
      await pool.query('UPDATE rehearsal SET extra_chars=?, max_participants=max_participants-1 WHERE rehearsal_id=?',
        [extra.length ? extra.join(',') : null, req.params.id]);
    } else {
      if (!excluded.includes(cid)) excluded.push(cid);
      await pool.query('UPDATE rehearsal SET excluded_chars=?, max_participants=max_participants-1 WHERE rehearsal_id=?',
        [excluded.join(','), req.params.id]);
    }
    res.json({success:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.delete('/api/rehearsals/:id', async (req, res) => {
  await pool.query('DELETE FROM rehearsal WHERE rehearsal_id = ?', [req.params.id]);
  res.json({ success: true });
});

app.put('/api/rehearsals/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active','cancelled'].includes(status)) return res.status(400).json({error:'无效状态'});
  await pool.query('UPDATE rehearsal SET status=? WHERE rehearsal_id=?', [status, req.params.id]);
  res.json({success:true});
});

// 简化版：传 character_id + (cn_name 或 qq)，优先QQ搜索，自动创建舞见，自动拉入舞团
app.post('/api/rehearsals/:id/participants/simple', async (req, res) => {
  try {
    const { character_id, cn_name, qq } = req.body;
    if (!character_id || (!cn_name && !qq)) return res.status(400).json({error:'缺少参数'});
    const [[reh]] = await pool.query('SELECT dance_group_id FROM rehearsal WHERE rehearsal_id=?', [req.params.id]);
    if (!reh) return res.status(404).json({error:'排练未找到'});
    var dancerId;
    // 优先QQ搜索（全局）
    if (qq) {
      const [byQQ] = await pool.query('SELECT dancer_id, dance_group_id FROM dancer WHERE qq=?', [qq]);
      if (byQQ.length) { dancerId = byQQ[0].dancer_id; }
    }
    // 其次按CN搜索（全局，不限舞团）
    if (!dancerId && cn_name) {
      const [byCN] = await pool.query('SELECT dancer_id, dance_group_id FROM dancer WHERE cn_name=? LIMIT 1', [cn_name]);
      if (byCN.length) { dancerId = byCN[0].dancer_id; }
    }
    // 新建舞见
    if (!dancerId) {
      const [result] = await pool.query('INSERT INTO dancer (dance_group_id, cn_name, qq) VALUES (?, ?, ?)',
        [reh.dance_group_id, cn_name||null, qq||null]);
      dancerId = result.insertId;
    }
    // 确保多团成员关系：把舞见拉入当前排练的舞团
    await ensureMembership(pool, dancerId, reh.dance_group_id);
    // 如果舞见没有主团，设当前团为主团
    const [[d]] = await pool.query('SELECT dance_group_id FROM dancer WHERE dancer_id=?', [dancerId]);
    if (d && !d.dance_group_id) {
      await pool.query('UPDATE dancer SET dance_group_id=? WHERE dancer_id=?', [reh.dance_group_id, dancerId]);
    }
    await pool.query('INSERT INTO rehearsal_participation (rehearsal_id, dancer_id, character_id) VALUES (?, ?, ?)',
      [req.params.id, dancerId, character_id]);
    res.json({success:true, dancer_id:dancerId});
  } catch(e) { res.status(500).json({error:e.message}); }
});

app.post('/api/rehearsals/:id/participants', async (req, res) => {
  try {
    const { dancer_id, character_id } = req.body;
    await pool.query(
      'INSERT INTO rehearsal_participation (rehearsal_id, dancer_id, character_id) VALUES (?, ?, ?)',
      [req.params.id, dancer_id, character_id]);
    // 把舞见拉入当前排练的舞团
    const [[reh]] = await pool.query('SELECT dance_group_id FROM rehearsal WHERE rehearsal_id=?', [req.params.id]);
    if (reh) await ensureMembership(pool, dancer_id, reh.dance_group_id);
    // 如果舞见没有主团，设为主团
    const [[d]] = await pool.query('SELECT dance_group_id FROM dancer WHERE dancer_id=?', [dancer_id]);
    if (d && !d.dance_group_id) {
      await pool.query('UPDATE dancer SET dance_group_id=? WHERE dancer_id=?', [reh.dance_group_id, dancer_id]);
    }
    res.json({ success: true });
  } catch(e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: '该舞见已在此排练中扮演其他角色' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/rehearsals/:reh_id/participants/:part_id', async (req, res) => {
  await pool.query('DELETE FROM rehearsal_participation WHERE participation_id = ?', [req.params.part_id]);
  res.json({ success: true });
});

// ========== 排练角色槽位管理 ==========

// 加回已排除角色
app.post('/api/rehearsals/:id/chars', async (req, res) => {
  try {
    var [[reh]] = await pool.query('SELECT excluded_chars FROM rehearsal WHERE rehearsal_id=?', [req.params.id]);
    if (!reh) return res.status(404).json({error:'未找到'});
    var excluded = reh.excluded_chars ? reh.excluded_chars.split(',').map(Number) : [];
    var cid = parseInt(req.body.character_id);
    var idx = excluded.indexOf(cid);
    if (idx === -1) return res.json({success:true});
    excluded.splice(idx, 1);
    await pool.query('UPDATE rehearsal SET excluded_chars=?, max_participants=max_participants+1 WHERE rehearsal_id=?',
      [excluded.length ? excluded.join(',') : null, req.params.id]);
    res.json({success:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// 新增跨团角色槽位
app.post('/api/rehearsals/:id/slots/:charId', async (req, res) => {
  try {
    var [[reh]] = await pool.query('SELECT extra_chars FROM rehearsal WHERE rehearsal_id=?', [req.params.id]);
    var extra = reh.extra_chars ? reh.extra_chars.split(',').map(Number) : [];
    var cid = parseInt(req.params.charId);
    if (!extra.includes(cid)) extra.push(cid);
    await pool.query('UPDATE rehearsal SET extra_chars=?, max_participants=max_participants+1 WHERE rehearsal_id=?',
      [extra.join(','), req.params.id]);
    res.json({success:true});
  } catch(e) { res.status(500).json({error:e.message}); }
});

// ========== 演唱会 ==========

// ========== 角色关系 ==========

// 获取所有关系（可按 group_id 筛选团内关系）
app.get('/api/relationships', async (req, res) => {
  const { group_id } = req.query;
  let sql = `SELECT cr.*,
    c1.name AS char1_name, c1.group_id AS char1_group, c1.cheering_color AS char1_color,
    c2.name AS char2_name, c2.group_id AS char2_group, c2.cheering_color AS char2_color
    FROM character_relationship cr
    JOIN \`character\` c1 ON cr.character_id_1 = c1.character_id
    JOIN \`character\` c2 ON cr.character_id_2 = c2.character_id`;
  const params = [];
  if (group_id) {
    sql += ' WHERE c1.group_id = ? AND c2.group_id = ?';
    params.push(group_id, group_id);
  }
  sql += ' ORDER BY cr.relation_type, cr.character_id_1';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// 获取指定角色的所有关系
app.get('/api/characters/:id/relationships', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cr.*,
      CASE WHEN cr.character_id_1 = ? THEN cr.character_id_2 ELSE cr.character_id_1 END AS related_id,
      CASE WHEN cr.character_id_1 = ? THEN c2.name ELSE c1.name END AS related_name,
      CASE WHEN cr.character_id_1 = ? THEN c2.cheering_color ELSE c1.cheering_color END AS related_color
     FROM character_relationship cr
     JOIN \`character\` c1 ON cr.character_id_1 = c1.character_id
     JOIN \`character\` c2 ON cr.character_id_2 = c2.character_id
     WHERE cr.character_id_1 = ? OR cr.character_id_2 = ?`,
    [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id]);
  res.json(rows);
});

// ========== 演唱会 ==========

app.get('/api/concerts', async (req, res) => {
  const { project_id } = req.query;
  let sql = 'SELECT * FROM concert';
  const params = [];
  if (project_id) { sql += ' WHERE project_id = ?'; params.push(project_id); }
  sql += ' ORDER BY concert_date';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// ========== 统计 ==========

app.get('/api/stats', async (req, res) => {
  const [[{projectCount}]] = await pool.query('SELECT COUNT(*) AS projectCount FROM project');
  const [[{groupCount}]] = await pool.query('SELECT COUNT(*) AS groupCount FROM anime_group');
  const [[{charCount}]] = await pool.query('SELECT COUNT(*) AS charCount FROM `character`');
  const [[{cvCount}]] = await pool.query('SELECT COUNT(*) AS cvCount FROM cv');
  const [[{rehCount}]] = await pool.query('SELECT COUNT(*) AS rehCount FROM rehearsal');
  res.json({ projectCount, groupCount, charCount, cvCount, rehCount });
});

// ========== 启动 ==========

const { port } = config.server;
app.listen(port, async () => {
  // 验证数据库连接
  try {
    await pool.query('SELECT 1');
    const [stats] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM project) AS p, (SELECT COUNT(*) FROM anime_group) AS g,
              (SELECT COUNT(*) FROM \`character\`) AS c, (SELECT COUNT(*) FROM cv) AS v`);
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   LoveLive! 综合管理系统 v1.0           ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`  MySQL : ${config.db.host} / ${config.db.database}`);
    console.log(`  数据  : ${stats[0].p} 企划 · ${stats[0].g} 团体 · ${stats[0].c} 角色 · ${stats[0].v} 声优`);
    var si = await semantic.rebuild(pool);
    console.log(`  语义  : ${si.docCount} 文档 · ${si.termCount} 词项 (TF-IDF + Cosine)`);
    console.log(`  前端  : http://localhost:${port}`);
    console.log(`  API   : http://localhost:${port}/api`);
    console.log('');
    console.log('  按 Ctrl+C 停止服务');
    console.log('');
  } catch (e) {
    console.error('数据库连接失败！请检查 MySQL 是否启动，以及 config.js 中的配置。');
    console.error(e.message);
    process.exit(1);
  }
});
