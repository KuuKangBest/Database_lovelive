const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const config = require('../../config');

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
  if (search) { sql += ' AND c.name LIKE ?'; params.push(`%${search}%`); }
  if (cv_age_min) { sql += ' AND TIMESTAMPDIFF(YEAR, cv.birth_date, CURDATE()) >= ?'; params.push(parseInt(cv_age_min)); }
  if (cv_age_max) { sql += ' AND TIMESTAMPDIFF(YEAR, cv.birth_date, CURDATE()) <= ?'; params.push(parseInt(cv_age_max)); }
  sql += ' ORDER BY c.character_id';
  const [rows] = await pool.query(sql, params);
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
            dg.name AS dance_group_name, d.cn_name
     FROM rehearsal_participation rp
     JOIN rehearsal r ON rp.rehearsal_id = r.rehearsal_id
     JOIN dance_group dg ON r.dance_group_id = dg.dance_group_id
     JOIN dancer d ON rp.dancer_id = d.dancer_id
     WHERE rp.character_id = ? ORDER BY r.rehearsal_date DESC LIMIT 20`,
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
    `SELECT * FROM rehearsal_with_count WHERE dance_group_id = ? ORDER BY rehearsal_date DESC`,
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

// ========== 舞见 API ==========

app.get('/api/dancers', async (req, res) => {
  const { dance_group_id } = req.query;
  let sql = 'SELECT * FROM dancer';
  const params = [];
  if (dance_group_id) { sql += ' WHERE dance_group_id = ?'; params.push(dance_group_id); }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.post('/api/dancers', async (req, res) => {
  const { dance_group_id, cn_name, contact_info } = req.body;
  const [result] = await pool.query(
    'INSERT INTO dancer (dance_group_id, cn_name, contact_info) VALUES (?, ?, ?)',
    [dance_group_id, cn_name, contact_info || null]);
  res.json({ dancer_id: result.insertId });
});

// ========== 排练 API ==========

app.get('/api/rehearsals', async (req, res) => {
  const { date_from, date_to, dance_group_id, status } = req.query;
  let sql = 'SELECT * FROM rehearsal_with_count WHERE 1=1';
  const params = [];
  if (date_from) { sql += ' AND rehearsal_date >= ?'; params.push(date_from); }
  if (date_to) { sql += ' AND rehearsal_date <= ?'; params.push(date_to); }
  if (dance_group_id) { sql += ' AND dance_group_id = ?'; params.push(dance_group_id); }
  if (status && status !== 'all') { sql += ' AND occupancy_status = ?'; params.push(status); }
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

app.post('/api/rehearsals/:id/participants', async (req, res) => {
  const { dancer_id, character_id } = req.body;
  await pool.query(
    'INSERT INTO rehearsal_participation (rehearsal_id, dancer_id, character_id) VALUES (?, ?, ?)',
    [req.params.id, dancer_id, character_id]);
  res.json({ success: true });
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
