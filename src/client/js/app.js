const API = 'http://localhost:3000/api';
let dgCache = {};
let svgMap = null;
let pageFilter = null;
const groupSvg = { 1:'images/honoka.svg', 2:'images/chika.svg', 3:'images/ayumu.svg', 4:'images/kanon.svg' };

// ── utils
function occupantStatus(cur, max) {
  if (max === 0) return 'unlimited';
  if (cur >= max) return 'full';
  if (cur / max >= 0.8) return 'near_full';
  return 'available';
}
function statusLabel(s) { return {available:'有空位',near_full:'将满',full:'已满',unlimited:'不限'}[s]||s; }
function fmtDate(d) { return d ? d.slice(0,10) : '?'; }
async function loadSvgMap() {
  if (svgMap) return svgMap;
  try { var r = await fetch('images/chars/index.json'); svgMap = await r.json(); } catch(e) { svgMap = {}; }
  return svgMap;
}
async function loadDGCache() {
  if (Object.keys(dgCache).length) return;
  var r = await fetch(API + '/dance-groups'); var dgs = await r.json();
  dgs.forEach(function(d) { dgCache[d.dance_group_id] = d.name; });
}

// ── page nav
function showPage(name, filterVal) {
  pageFilter = filterVal || null;
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-links button').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById(name).classList.add('active');
  document.querySelectorAll('.nav-links button').forEach(function(b) {
    if (b.getAttribute('data-page') === name) b.classList.add('active');
  });
  if (name === 'projects') loadProjects();
  if (name === 'groups') loadGroups();
  if (name === 'characters') loadCharacters();
  if (name === 'rehearsal') loadRehearsals();
  if (name === 'home') loadHome();
}

// ── home
async function loadHome() {
  await loadDGCache();
  var r = await fetch(API + '/stats'); var stats = await r.json();
  document.getElementById('stat-projects').textContent = stats.projectCount;
  document.getElementById('stat-groups').textContent = stats.groupCount;
  document.getElementById('stat-chars').textContent = stats.charCount;
  document.getElementById('stat-seiyuu').textContent = stats.cvCount;
  var rr = await fetch(API + '/rehearsals'); var list = await rr.json();
  var el = document.getElementById('home-rehearsals');
  var recent = list.slice(-4).reverse();
  if (!recent.length) { el.innerHTML = '<p style="color:#999;">暂无排练记录</p>'; return; }
  el.innerHTML = recent.map(function(r) {
    var cur = r.current_participants, st = r.occupancy_status;
    return '<div class="rehearsal-item"><div class="info"><strong>' + (dgCache[r.dance_group_id]||'未知舞团') + '</strong> · ' + fmtDate(r.rehearsal_date) + ' ' + (r.start_time||'').slice(0,5) + '-' + (r.end_time||'').slice(0,5) + ' @' + r.location + '<br><small>' + (r.content_summary||'') + '</small></div><span class="count ' + st + '">' + cur + '/' + (r.max_participants===0?'∞':r.max_participants) + ' ' + statusLabel(st) + '</span></div>';
  }).join('');
}

// ── projects
async function loadProjects() {
  var r = await fetch(API + '/projects'); var projects = await r.json();
  var gr = await fetch(API + '/groups'); var allGroups = await gr.json();
  document.getElementById('project-grid').innerHTML = projects.map(function(p) {
    var cnt = allGroups.filter(function(g) { return g.project_id === p.project_id; }).length;
    return '<div class="card" onclick="showPage(\'groups\',{pid:' + p.project_id + '})"><h3>' + p.name + '</h3><p style="margin-top:8px;font-size:0.9em;">' + (p.description||'').slice(0,60) + '</p><span class="tag">' + (p.start_date||'?') + ' ~ ' + (p.end_date||'至今') + '</span><span class="tag blue">' + cnt + ' 个团体 →</span></div>';
  }).join('');
}

// ── groups
async function loadGroups() {
  var pr = await fetch(API + '/projects'); var projects = await pr.json();
  var selP = document.getElementById('group-filter-project');
  selP.innerHTML = '<option value="">全部企划</option>' + projects.map(function(p) { return '<option value="' + p.project_id + '">' + p.name + '</option>'; }).join('');
  if (pageFilter && pageFilter.pid) { selP.value = pageFilter.pid; }
  var gr = await fetch(API + '/groups'); var groups = await gr.json();
  var selC = document.getElementById('char-filter-group');
  selC.innerHTML = '<option value="">全部动漫团</option>' + groups.map(function(g) { return '<option value="' + g.group_id + '">' + g.name + '</option>'; }).join('');
  var pid = selP.value;
  var gs = pid ? groups.filter(function(g) { return g.project_id === parseInt(pid); }) : groups;
  document.getElementById('group-grid').innerHTML = gs.map(function(g) {
    var cnt = g.members ? g.members.length : '?';
    return '<div class="card" onclick="showPage(\'characters\',{gid:' + g.group_id + '})"><h3>' + g.name + '</h3><small style="color:#999">' + (g.project_name||'') + '</small><p style="margin-top:6px;font-size:0.9em;">' + (g.description||'').slice(0,80) + '</p><span class="tag">成立 ' + (g.founding_date||'?') + '</span>' + (g.disband_date ? '<span class="tag orange">解散 ' + g.disband_date + '</span>' : '') + '<span class="tag blue">' + cnt + ' 个角色 →</span></div>';
  }).join('');
}

// ── characters
async function loadCharacters() {
  if (pageFilter && pageFilter.gid) { document.getElementById('char-filter-group').value = pageFilter.gid; pageFilter = null; }
  var gid = document.getElementById('char-filter-group').value;
  var search = document.getElementById('char-search').value;
  var ageRange = document.getElementById('char-filter-age').value;
  var url = API + '/characters?';
  if (gid) url += 'group_id=' + gid + '&';
  if (search) url += 'search=' + encodeURIComponent(search) + '&';
  if (ageRange) { var parts = ageRange.split('-'); url += 'cv_age_min=' + parts[0] + '&cv_age_max=' + parts[1] + '&'; }
  var r = await fetch(url); var chars = await r.json();
  await loadSvgMap();

  var groups = {};
  chars.forEach(function(c) { var gn = c.group_name || '其他'; if (!groups[gn]) groups[gn] = []; groups[gn].push(c); });

  document.getElementById('char-grid').innerHTML = Object.entries(groups).map(function(entry) {
    var gname = entry[0], members = entry[1];
    return '<div style="grid-column:1/-1;margin-top:12px;"><h3 style="color:var(--pink);font-size:1.1em;padding-bottom:6px;border-bottom:2px solid var(--pink-light);">' + gname + ' <span style="font-weight:400;font-size:0.8em;color:#999;">(' + members.length + '人)</span></h3></div>' + members.map(function(c) {
      var age = c.birth_date ? Math.floor((new Date() - new Date(c.birth_date)) / 31557600000) : null;
      var raw = svgMap[c.character_id];
      var svg = raw ? 'images/chars/' + encodeURIComponent(raw).replace(/%2F/g, '/') : '';
      var cheerDot = c.cheering_color ? ' <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + c.cheering_color + ';border:1px solid #ddd;vertical-align:middle;"></span>' : '';
      return '<div class="card" onclick="showCharDetail(' + c.character_id + ')">' + (svg ? '<div class="card-char-bg" style="background-image:url(' + svg + ')"></div>' : '') + '<h3>' + c.name + cheerDot + '</h3><span class="tag blue">' + (c.birthday||'?') + ' · ' + (c.blood_type||'?') + '型 · ' + (c.height||'?') + 'cm</span><div class="cv">CV: ' + (c.cv_name||'?') + (age ? ' (' + age + '岁)' : '') + '</div>' + (c.hobby ? '<div style="margin-top:6px;font-size:0.82em;color:#888;">爱好: ' + c.hobby + '</div>' : '') + '<div style="margin-top:4px;font-size:0.75em;color:var(--pink);">点击查看详情 →</div></div>';
    }).join('');
  }).join('');
}

// ── char detail
async function showCharDetail(charId) {
  await loadSvgMap();
  var r = await fetch(API + '/characters/' + charId); var c = await r.json();
  var age = c.birth_date ? Math.floor((new Date() - new Date(c.birth_date)) / 31557600000) : null;
  var pngPath = 'images/chars/char-' + charId + '.png';
  document.getElementById('char-detail-content').innerHTML =
    '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
    '<div style="flex:0 0 200px;text-align:center;">' +
    '<img src="' + pngPath + '" style="width:180px;object-fit:contain;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);" onerror="this.style.display=\'none\'">' +
    '<div style="width:180px;height:210px;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);display:flex;align-items:center;justify-content:center;color:#ccc;font-size:3em;">' + (c.name||'?')[0] + '</div></div>' +
    '<div style="flex:1;min-width:280px;"><h2 style="color:var(--pink);margin-bottom:4px;">' + c.name + '</h2><p style="color:#999;margin-bottom:12px;">' + (c.group_name||'?') + '</p>' +
    '<table style="width:100%;font-size:0.9em;border-collapse:collapse;">' +
    '<tr><td style="padding:4px 8px;color:#999;width:80px;">CV</td><td>' + (c.cv_name||'?') + (age ? ' (' + age + '岁)' : '') + '</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">生日</td><td>' + (c.birthday||'?') + '</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">血型</td><td>' + (c.blood_type||'?') + '型</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">身高</td><td>' + (c.height||'?') + ' cm</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">爱好</td><td>' + (c.hobby||'?') + '</td></tr>' +
    (c.cheering_color ? '<tr><td style="padding:4px 8px;color:#999;">应援色</td><td><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:' + c.cheering_color + ';border:1px solid #ddd;vertical-align:middle;"></span> ' + c.cheering_color + '</td></tr>' : '') +
    (c.call_response ? '<tr><td style="padding:4px 8px;color:#999;">互动词</td><td style="font-size:0.85em;">' + c.call_response + '</td></tr>' : '') +
    '</table>' +
    (c.description ? '<div style="margin-top:12px;padding:12px;background:#fff5f8;border-radius:8px;font-size:0.9em;line-height:1.6;">' + c.description + '</div>' : '') +
    (c.rehearsals && c.rehearsals.length ? '<div style="margin-top:12px;"><h4 style="color:var(--pink);margin-bottom:6px;">近期排练记录</h4>' + c.rehearsals.slice(0,5).map(function(rh) { return '<div style="font-size:0.82em;padding:4px 0;border-bottom:1px solid #f0f0f0;">' + rh.cn_name + ' · ' + fmtDate(rh.rehearsal_date) + ' · ' + rh.dance_group_name + '</div>'; }).join('') + '</div>' : '') +
    '</div></div><div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('modal-char').classList.add('show');
}

// ── rehearsals
async function loadRehearsals() {
  await loadDGCache();
  var statusFilter = document.getElementById('reh-filter-status').value;
  var dateFrom = document.getElementById('reh-date-from').value;
  var dateTo = document.getElementById('reh-date-to').value;
  var url = API + '/rehearsals?';
  if (statusFilter !== 'all') url += 'status=' + statusFilter + '&';
  if (dateFrom) url += 'date_from=' + dateFrom + '&';
  if (dateTo) url += 'date_to=' + dateTo + '&';
  var r = await fetch(url); var list = await r.json();
  document.getElementById('rehearsal-list').innerHTML = list.map(function(r) {
    var cur = r.current_participants, max = r.max_participants, st = r.occupancy_status, pct = max === 0 ? 0 : Math.round(cur/max*100);
    return '<div class="rehearsal-item" id="reh-' + r.rehearsal_id + '"><div class="info"><strong>' + (dgCache[r.dance_group_id]||'未知舞团') + '</strong> ' + fmtDate(r.rehearsal_date) + ' ' + (r.start_time||'').slice(0,5) + '-' + (r.end_time||'').slice(0,5) + ' @' + r.location + '<br><small style="color:#888;">' + (r.content_summary||'') + '</small><div style="margin-top:6px;" id="reh-part-' + r.rehearsal_id + '"><button class="btn btn-sm" style="background:var(--pink-light);color:var(--pink);" onclick="toggleParticipants(' + r.rehearsal_id + ')">管理成员</button></div></div><div style="display:flex;align-items:center;gap:15px;"><div><div class="bar-wrap"><div class="bar-inner ' + st + '" style="width:' + pct + '%;"></div></div><span class="count ' + st + '" style="display:inline-block;margin-top:4px;font-size:0.85em;">' + cur + '/' + (max===0?'∞':max) + ' ' + statusLabel(st) + '</span></div><button class="btn btn-danger btn-sm" onclick="deleteRehearsal(' + r.rehearsal_id + ')">删除</button></div></div>';
  }).join('');
}

async function toggleParticipants(rehId) {
  var el = document.getElementById('reh-part-' + rehId);
  if (el.dataset.loaded) { el.innerHTML = '<button class="btn btn-sm" style="background:var(--pink-light);color:var(--pink);" onclick="toggleParticipants(' + rehId + ')">管理成员</button>'; el.dataset.loaded = ''; return; }
  var r1 = await fetch(API + '/rehearsals/' + rehId); var reh = await r1.json();
  var parts = reh.participants || [];
  var r2 = await fetch(API + '/characters'); var allChars = await r2.json();
  var rows = parts.map(function(p) {
    return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;"><span class="tag">' + p.cn_name + ' → ' + p.character_name + '</span><button class="btn btn-danger btn-sm" style="padding:2px 10px;font-size:0.7em;" onclick="removeParticipant(' + rehId + ',' + p.participation_id + ')">×</button></div>';
  }).join('');
  el.innerHTML = '<div style="margin-top:6px;">' + (parts.length ? rows : '<span style="color:#999;font-size:0.85em;">暂无参与记录</span>') + '<div style="display:flex;gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap;"><input placeholder="CN名" id="add-cn-' + rehId + '" style="width:90px;padding:5px 8px;border-radius:12px;border:1px solid #ddd;font-size:0.85em;"><select id="add-char-' + rehId + '" style="padding:5px 8px;border-radius:12px;border:1px solid #ddd;font-size:0.85em;max-width:140px;">' + allChars.map(function(c) { return '<option value="' + c.character_id + '">' + c.name + '</option>'; }).join('') + '</select><button class="btn btn-sm" style="background:var(--pink);color:#fff;padding:5px 14px;font-size:0.8em;" onclick="addParticipant(' + rehId + ')">+ 添加</button><button class="btn btn-sm" style="background:var(--pink-light);color:var(--pink);padding:5px 10px;font-size:0.8em;" onclick="toggleParticipants(' + rehId + ')">收起</button></div></div>';
  el.dataset.loaded = '1';
}

async function removeParticipant(rehId, partId) {
  if (!confirm('确定移除此参与记录？')) return;
  await fetch(API + '/rehearsals/' + rehId + '/participants/' + partId, { method:'DELETE' });
  var el = document.getElementById('reh-part-' + rehId); el.dataset.loaded = '';
  toggleParticipants(rehId);
  setTimeout(function() { loadRehearsals(); if (document.getElementById('home').classList.contains('active')) loadHome(); }, 300);
}

async function addParticipant(rehId) {
  var cn = document.getElementById('add-cn-' + rehId).value.trim();
  var charId = parseInt(document.getElementById('add-char-' + rehId).value);
  if (!cn) { alert('请输入舞见CN名'); return; }
  var rh = await fetch(API + '/rehearsals/' + rehId); var reh = await rh.json();
  var dgId = reh.dance_group_id;
  var dancerId;
  var dRes = await fetch(API + '/dancers?dance_group_id=' + dgId); var dancers = await dRes.json();
  var df = dancers.find(function(d) { return d.cn_name === cn; });
  if (df) { dancerId = df.dancer_id; }
  else {
    var cd = await fetch(API + '/dancers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dance_group_id: dgId, cn_name: cn }) });
    var cj = await cd.json();
    if (!cd.ok) { alert('创建舞见失败'); return; }
    dancerId = cj.dancer_id;
  }
  var pr = await fetch(API + '/rehearsals/' + rehId + '/participants', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dancer_id: dancerId, character_id: charId }) });
  if (!pr.ok) { var e = await pr.json(); alert(e.error); return; }
  var el = document.getElementById('reh-part-' + rehId); el.dataset.loaded = '';
  toggleParticipants(rehId);
  setTimeout(function() { loadRehearsals(); if (document.getElementById('home').classList.contains('active')) loadHome(); }, 300);
}

function deleteRehearsal(id) {
  if (!confirm('确定删除该排练记录？')) return;
  fetch(API + '/rehearsals/' + id, { method:'DELETE' }).then(function() { loadRehearsals(); });
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

async function openAddRehearsal() {
  document.getElementById('modal-rehearsal').classList.add('show');
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  var r = await fetch(API + '/characters'); var chars = await r.json();
  var sel = document.getElementById('f-char');
  sel.innerHTML = chars.map(function(c) { return '<option value="' + c.character_id + '">' + c.name + ' (' + (c.group_name||'') + ')</option>'; }).join('');
}

function updateMaxHint() {
  var n = document.getElementById('f-char').selectedOptions.length;
  document.getElementById('f-max').setAttribute('data-hint', '已选 ' + n + ' 个角色');
}

async function addRehearsal(e) {
  e.preventDefault();
  var dgName = document.getElementById('f-dg').value;
  var max = parseInt(document.getElementById('f-max').value) || 0;
  var selChar = document.getElementById('f-char');
  var charIds = Array.from(selChar.selectedOptions).map(function(o) { return parseInt(o.value); });
  var cns = (document.getElementById('f-cns').value || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  if (charIds.length > 0 && cns.length !== charIds.length) { alert('角色选了' + charIds.length + '个，舞见CN填了' + cns.length + '个，请一一对应！'); return; }

  var dgId;
  var dgRes = await fetch(API + '/dance-groups'); var dgs = await dgRes.json();
  var found = dgs.find(function(d) { return d.name === dgName; });
  if (found) { dgId = found.dance_group_id; }
  else {
    var createRes = await fetch(API + '/dance-groups', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: dgName }) });
    var created = await createRes.json(); dgId = created.dance_group_id;
  }
  var rehRes = await fetch(API + '/rehearsals', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ dance_group_id: dgId, rehearsal_date: document.getElementById('f-date').value, start_time: document.getElementById('f-start').value, end_time: document.getElementById('f-end').value, location: document.getElementById('f-loc').value, max_participants: max, content_summary: document.getElementById('f-desc').value })
  });
  if (!rehRes.ok) { var err = await rehRes.json(); alert(err.error); return; }
  var reh = await rehRes.json();

  for (var i = 0; i < charIds.length; i++) {
    var cn = cns[i] || ('舞见' + (i+1));
    var dancerId;
    var dRes = await fetch(API + '/dancers?dance_group_id=' + dgId); var dancers = await dRes.json();
    var df = dancers.find(function(d) { return d.cn_name === cn; });
    if (df) { dancerId = df.dancer_id; }
    else {
      var createD = await fetch(API + '/dancers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dance_group_id: dgId, cn_name: cn }) });
      var cd = await createD.json(); dancerId = cd.dancer_id;
    }
    var partRes = await fetch(API + '/rehearsals/' + reh.rehearsal_id + '/participants', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dancer_id: dancerId, character_id: charIds[i] }) });
    if (!partRes.ok) { var pe = await partRes.json(); alert(cn + ' 添加失败: ' + pe.error); }
  }
  closeModal('modal-rehearsal');
  document.getElementById('form-rehearsal').reset();
  loadRehearsals();
}

// ── event bindings
function safeOn(id, event, fn) { var el = document.getElementById(id); if (el) el.addEventListener(event, fn); }
safeOn('group-filter-project','change',loadGroups);
safeOn('char-filter-group','change',loadCharacters);
safeOn('char-search','input',loadCharacters);
safeOn('char-filter-age','change',loadCharacters);
safeOn('reh-filter-status','change',loadRehearsals);
safeOn('reh-date-from','change',loadRehearsals);
safeOn('reh-date-to','change',loadRehearsals);
['modal-rehearsal','modal-char'].forEach(function(id) { var el = document.getElementById(id); if (el) el.addEventListener('click', function(e) { if (e.target === this) closeModal(id); }); });

// ── init
loadHome();
