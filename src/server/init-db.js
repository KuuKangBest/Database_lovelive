// 初始化数据库 — 分层执行 SQL
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const SQL_DIR = path.join(__dirname, 'sql');

function read(name) {
  return fs.readFileSync(path.join(SQL_DIR, name), 'utf8');
}

function tick(msg) { console.log(`  ✓ ${msg}`); }

async function init() {
  const started = Date.now();
  console.log('\n[init-db] 开始初始化...\n');

  const conn = await mysql.createConnection({
    host: config.db.host, user: config.db.user, password: config.db.password,
    multipleStatements: true,
  });

  // 删库重建
  await conn.query(`DROP DATABASE IF EXISTS ${config.db.database}`);
  await conn.query(`CREATE DATABASE ${config.db.database} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ${config.db.database}`);

  // Layer 1 ── DDL
  console.log('[1/4] DDL (表·视图·触发器) ...');
  let schema = read('schema.sql');
  schema = schema.replace(/DELIMITER\s+\/\/\s*/gi, '').replace(/DELIMITER\s+;\s*/gi, '');
  const trigRe = /CREATE\s+TRIGGER\s+[\s\S]*?END\s*\/\//gi;
  const triggers = schema.match(trigRe) || [];
  schema = schema.replace(trigRe, '');
  await conn.query(schema);
  for (const t of triggers) await conn.query(t.replace(/\/\/\s*$/, '').trim());
  tick('8 表 · 1 视图 · ' + triggers.length + ' 触发器');

  // Layer 2 ── 基础数据
  console.log('[2/4] 基础数据 (企划·团体·角色·声优) ...');
  await conn.query(read('seed-data.sql'));
  tick('5 企划 · 8 团体 · 48 角色 · 50 声优');

  // Layer 3 ── 角色描述
  console.log('[3/6] 角色描述与互动词 ...');
  try { await conn.query(read('character-descriptions.sql')); tick('描述已加载'); } catch(e){ console.log('  - 跳过'); }
  try { await conn.query(read('character-call-response.sql')); tick('互动词已加载'); } catch(e){ console.log('  - 跳过'); }

  // Layer 4 ── 演唱会
  console.log('[4/6] 演唱会数据 ...');
  try { await conn.query(read('concerts.sql')); tick('演唱会已加载'); } catch(e){ console.log('  - 跳过'); }

  // Layer 5 ── 曲目 & 演出
  console.log('[5/6] 曲目 & 演出 ...');
  try {
    var songs = read('songs.sql');
    await conn.query(songs);
    tick('曲目+演出已加载');
  } catch(e) { console.log('  - 跳过'); }

  // Layer 6 ── 排练测试数据
  console.log('[6/6] 排练测试数据 ...');
  try {
    await conn.query(read('test-data.sql'));
    tick('舞团 · 舞见 · 排练已加载');
  } catch (e) { console.log('  - 跳过'); }

  await conn.end();

  // 验证
  const ver = await mysql.createConnection({ ...config.db });
  const [[s]] = await ver.query(
    `SELECT (SELECT COUNT(*) FROM project) AS p, (SELECT COUNT(*) FROM anime_group) AS g,
            (SELECT COUNT(*) FROM \`character\`) AS c, (SELECT COUNT(*) FROM cv) AS v,
            (SELECT COUNT(*) FROM rehearsal) AS r`);
  await ver.end();

  console.log(`\n  完成 (${((Date.now()-started)/1000).toFixed(1)}s) → 企划:${s.p} 团:${s.g} 角色:${s.c} CV:${s.v} 排练:${s.r}\n`);
}

init().catch(e => {
  console.error('\n  初始化失败:', e.message);
  if (e.sql) console.error('  SQL:', e.sql.slice(0, 300));
  process.exit(1);
});
