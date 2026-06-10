// 单独加载排练测试数据
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'sql', 'test-data.sql'), 'utf8');
  const conn = await mysql.createConnection({ ...config.db, multipleStatements: true });

  console.log('插入排练测试数据...');
  // 先清空再插入
  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  await conn.query('TRUNCATE rehearsal_participation');
  await conn.query('TRUNCATE rehearsal');
  await conn.query('TRUNCATE dancer');
  await conn.query('TRUNCATE dance_group');
  await conn.query('SET FOREIGN_KEY_CHECKS=1');
  await conn.query(sql);

  const [[{dg}]] = await conn.query('SELECT COUNT(*) AS dg FROM dance_group');
  const [[{d}]] = await conn.query('SELECT COUNT(*) AS d FROM dancer');
  const [[{r}]] = await conn.query('SELECT COUNT(*) AS r FROM rehearsal');
  const [[{rp}]] = await conn.query('SELECT COUNT(*) AS rp FROM rehearsal_participation');
  console.log(`  ✓ 舞团:${dg}  舞见:${d}  排练:${r}  参与记录:${rp}`);
  await conn.end();
})().catch(e => { console.error('失败:', e.message); process.exit(1); });
