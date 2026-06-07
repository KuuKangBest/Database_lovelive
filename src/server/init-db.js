// 初始化数据库
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

function tick(msg) { console.log(`  ✓ ${msg}`); }

async function init() {
  const started = Date.now();

  // 1. 连接 MySQL
  console.log('\n[1/4] 连接 MySQL...');
  const conn = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  // 2. 解析 SQL
  console.log('[2/4] 解析 SQL 脚本...');
  let sql = fs.readFileSync(path.join(__dirname, 'sql', 'init.sql'), 'utf8');
  sql = sql.replace(/DELIMITER\s+\/\/\s*/gi, '');
  sql = sql.replace(/DELIMITER\s+;\s*/gi, '');

  // 分离 DDL+数据 和 触发器
  const triggerPattern = /CREATE\s+TRIGGER\s+[\s\S]*?END\s*\/\//gi;
  const triggers = sql.match(triggerPattern) || [];
  sql = sql.replace(triggerPattern, '');

  // 3. 建库 → 建表 → 插数据 → 建视图
  console.log('[3/4] 执行 DDL + 数据插入...');
  // 先单独删库重建
  await conn.query(`DROP DATABASE IF EXISTS ${config.db.database}`);
  await conn.query(`CREATE DATABASE ${config.db.database} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ${config.db.database}`);
  await conn.query(sql);
  tick('表结构、视图、数据');

  // 4. 触发器
  console.log('[4/4] 创建触发器...');
  for (const trigger of triggers) {
    const clean = trigger.replace(/\/\/\s*$/, '').trim();
    await conn.query(clean);
  }
  tick(`${triggers.length} 个触发器`);

  await conn.end();

  // 验证
  const ver = await mysql.createConnection({ ...config.db });
  const [[s]] = await ver.query(
    `SELECT (SELECT COUNT(*) FROM project) AS p, (SELECT COUNT(*) FROM anime_group) AS g,
            (SELECT COUNT(*) FROM \`character\`) AS c, (SELECT COUNT(*) FROM cv) AS v`);
  await ver.end();

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n  初始化完成！(${elapsed}s)`);
  console.log(`  企划:${s.p}  团体:${s.g}  角色:${s.c}  声优:${s.v}`);
  console.log('');
}

init().catch(e => {
  console.error('\n  初始化失败:', e.message);
  if (e.sql) console.error('  SQL:', e.sql.slice(0, 300));
  process.exit(1);
});
