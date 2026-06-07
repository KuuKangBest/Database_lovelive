// 停止服务：杀掉占用 3000 端口的进程
const { execSync } = require('child_process');
const port = 3000;

process.stdout.write(`Stopping port ${port}... `);
if (process.platform === 'win32') {
  const out = execSync('netstat -ano', { stdio: 'pipe' }).toString();
  const lines = out.split('\n').filter(l => l.includes(`:${port}`) && l.includes('LISTENING'));
  const pids = [...new Set(lines.map(l => l.trim().split(/\s+/).pop()))];
  if (pids.length === 0) { console.log('nothing running'); process.exit(0); }
  for (const pid of pids) execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
  console.log(`done (PID ${pids.join(', ')})`);
} else {
  try { execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' }); console.log('done'); }
  catch { console.log('nothing running'); }
}
