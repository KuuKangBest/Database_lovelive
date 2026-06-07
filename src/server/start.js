// 一键启动：检查 → 初始化 → 杀旧进程 → 启动 → 打开浏览器
const { execSync, spawn } = require('child_process');
const config = require('../../config');

const log = (msg) => console.log(`  ${msg}`);
const fail = (msg) => { console.log(`  ✗ ${msg}`); process.exit(1); };

console.log('\n  LoveLive! 综合管理系统');
console.log('');

// ── 1. MySQL ──
process.stdout.write('[1/4] MySQL ... ');
try {
  execSync(`mysql -u ${config.db.user} -p${config.db.password} -e "SELECT 1"`, { stdio: 'pipe' });
  console.log('ok');
} catch { fail('无法连接，请启动 MySQL 服务'); }

// ── 2. Database ──
process.stdout.write('[2/4] 数据库 ... ');
let dbReady = false;
try {
  const r = execSync(
    `mysql -u ${config.db.user} -p${config.db.password} -N -e "SELECT COUNT(*) FROM project" ${config.db.database}`,
    { stdio: 'pipe' }
  ).toString().trim();
  if (parseInt(r) > 0) { console.log(`ok (${r} 企划)`); dbReady = true; }
} catch { /* DB doesn't exist yet */ }

if (!dbReady) {
  console.log('需要初始化');
  log('正在初始化...');
  try {
    execSync('node init-db.js', { stdio: 'inherit', cwd: __dirname });
    console.log('');
  } catch { fail('初始化失败'); }
}

// ── 3. Port ──
function freePort(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync(`netstat -ano`, { stdio: 'pipe' }).toString();
      const lines = out.split('\n').filter(l => l.includes(`:${port}`) && l.includes('LISTENING'));
      const pids = [...new Set(lines.map(l => l.trim().split(/\s+/).pop()))];
      for (const pid of pids) { execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' }); }
      return pids.length > 0;
    } catch { return false; }
  } else {
    try { execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'pipe' }); return true; }
    catch { return false; }
  }
}

process.stdout.write(`[3/4] 端口 ${config.server.port} ... `);
if (freePort(config.server.port)) console.log('已释放旧进程');
else console.log('ok');

// ── 4. Start ──
console.log('[4/4] 启动服务 ...');
console.log('');

const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});

// Graceful shutdown
process.on('SIGINT', () => { server.kill(); process.exit(); });
process.on('SIGTERM', () => { server.kill(); process.exit(); });

// Open browser after a short delay
setTimeout(() => {
  const url = `http://localhost:${config.server.port}`;
  if (process.platform === 'win32') execSync(`start ${url}`, { stdio: 'pipe' });
  else if (process.platform === 'darwin') execSync(`open ${url}`, { stdio: 'pipe' });
  else execSync(`xdg-open ${url}`, { stdio: 'pipe' });
}, 1500);
