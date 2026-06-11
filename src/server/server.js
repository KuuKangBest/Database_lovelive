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
  if (search) { sql += ' AND (c.name LIKE ? OR c.hobby LIKE ? OR c.description LIKE ?)'; params.push('%'+search+'%', '%'+search+'%', '%'+search+'%'); }
  if (cv_age_min) { sql += ' AND TIMESTAMPDIFF(YEAR, cv.birth_date, CURDATE()) >= ?'; params.push(parseInt(cv_age_min)); }
  if (cv_age_max) { sql += ' AND TIMESTAMPDIFF(YEAR, cv.birth_date, CURDATE()) <= ?'; params.push(parseInt(cv_age_max)); }
  sql += ' ORDER BY c.character_id';
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
     WHERE d.cn_name LIKE ? ORDER BY d.cn_name LIMIT 10`,
    ['%'+q+'%']);
  res.json(rows);
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
  res.json(rows);
});

app.get('/api/dancers', async (req, res) => {
  const { dance_group_id } = req.query;
  let sql = 'SELECT * FROM dancer';
  const params = [];
  if (dance_group_id) { sql += ' WHERE dance_group_id = ?'; params.push(dance_group_id); }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.post('/api/dancers', async (req, res) => {
  const { dance_group_id, cn_name, qq, contact_info } = req.body;
  if (!cn_name || !cn_name.trim()) return res.status(400).json({ error: 'CN名不能为空' });
  if (qq) {
    // 检查同一QQ+CN+舞团是否已存在
    const [dup] = await pool.query(
      'SELECT * FROM dancer WHERE qq=? AND cn_name=? AND (dance_group_id=? OR (dance_group_id IS NULL AND ? IS NULL))',
      [qq, cn_name.trim(), dance_group_id || null, dance_group_id || null]);
    if (dup.length) return res.json(dup[0]);
  }
  const [result] = await pool.query(
    'INSERT INTO dancer (dance_group_id, cn_name, qq, contact_info) VALUES (?, ?, ?, ?)',
    [dance_group_id || null, cn_name.trim(), qq || null, contact_info || null]);
  res.json({ dancer_id: result.insertId, cn_name: cn_name.trim(), qq: qq || null, dance_group_id: dance_group_id || null });
});

app.put('/api/dancers/:id', async (req, res) => {
  const { dance_group_id, cn_name, qq, contact_info } = req.body;
  const [[d]] = await pool.query('SELECT * FROM dancer WHERE dancer_id=?', [req.params.id]);
  if (!d) return res.status(404).json({ error: '舞见不存在' });
  await pool.query(
    'UPDATE dancer SET dance_group_id=?, cn_name=?, qq=?, contact_info=? WHERE dancer_id=?',
    [dance_group_id !== undefined ? (dance_group_id || null) : d.dance_group_id,
     cn_name || d.cn_name,
     qq !== undefined ? (qq || null) : d.qq,
     contact_info !== undefined ? (contact_info || null) : d.contact_info,
     req.params.id]);
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
    const { dance_group_id, rehearsal_date, start_time, end_time, location, max_participants, content_summary } = req.body;
    const [result] = await conn.query(
      'INSERT INTO rehearsal (dance_group_id, rehearsal_date, start_time, end_time, location, max_participants, content_summary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dance_group_id, rehearsal_date, start_time, end_time, location, max_participants || 0, content_summary || null]);
    await conn.commit();
    res.json({ rehearsal_id: result.insertId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

app.put('/api/rehearsals/:id', async (req, res) => {
  const { dance_group_id, rehearsal_date, start_time, end_time, location, max_participants, content_summary, excluded_chars } = req.body;
  await pool.query(
    'UPDATE rehearsal SET dance_group_id=?, rehearsal_date=?, start_time=?, end_time=?, location=?, max_participants=?, content_summary=?, excluded_chars=? WHERE rehearsal_id=?',
    [dance_group_id, rehearsal_date, start_time, end_time, location, max_participants, content_summary, excluded_chars||null, req.params.id]);
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

// 简化版：传 character_id + (cn_name 或 qq)，优先QQ搜索，自动创建舞见
app.post('/api/rehearsals/:id/participants/simple', async (req, res) => {
  try {
    const { character_id, cn_name, qq } = req.body;
    if (!character_id || (!cn_name && !qq)) return res.status(400).json({error:'缺少参数'});
    const [[reh]] = await pool.query('SELECT dance_group_id FROM rehearsal WHERE rehearsal_id=?', [req.params.id]);
    if (!reh) return res.status(404).json({error:'排练未找到'});
    let dancerId;
    // 优先QQ搜索
    if (qq) {
      const [byQQ] = await pool.query('SELECT dancer_id FROM dancer WHERE qq=?', [qq]);
      if (byQQ.length) { dancerId = byQQ[0].dancer_id; }
    }
    // 其次按CN搜索同舞团
    if (!dancerId && cn_name) {
      const [byCN] = await pool.query('SELECT dancer_id FROM dancer WHERE dance_group_id=? AND cn_name=?', [reh.dance_group_id, cn_name]);
      if (byCN.length) { dancerId = byCN[0].dancer_id; }
    }
    // 新建
    if (!dancerId) {
      const [result] = await pool.query('INSERT INTO dancer (dance_group_id, cn_name, qq) VALUES (?, ?, ?)',
        [reh.dance_group_id, cn_name||null, qq||null]);
      dancerId = result.insertId;
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
