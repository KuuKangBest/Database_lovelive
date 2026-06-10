const API = 'http://localhost:3000/api';
let dgCache = {};
let pageFilter = null;
const groupLogo = { 1:'images/logos/muse.png', 2:'images/logos/aqours.png', 3:'images/logos/nijigasaki.png', 4:'images/logos/liella.png', 5:'images/logos/hasunosora.png', 7:'images/logos/saintsnow.png', 8:'images/logos/sunnypassion.png', 9:'images/logos/bluebird.png' };

// ── utils
function occupantStatus(cur, max) {
  if (max === 0) return 'unlimited';
  if (cur >= max) return 'full';
  if (cur / max >= 0.8) return 'near_full';
  return 'available';
}
function statusLabel(s) { return {available:'有空位',near_full:'将满',full:'已满',unlimited:'不限'}[s]||s; }
function fmtDate(d) { if (!d) return '至今'; return d.slice(0,10); }
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
    return '<div class="rehearsal-item"><div class="info"><strong>' + (dgCache[r.dance_group_id]||'未知舞团') + '</strong> · ' + fmtDate(r.rehearsal_date) + ' ' + (r.start_time||'').slice(0,5) + '-' + (r.end_time||'').slice(0,5) + ' @' + r.location + '<br><small>' + (r.content_summary||'') + '</small></div><span class="count ' + st + '">' + cur + '人</span></div>';
  }).join('');
}

// ── projects
async function loadProjects() {
  var r = await fetch(API + '/projects'); var projects = await r.json();
  var gr = await fetch(API + '/groups'); var allGroups = await gr.json();
  document.getElementById('project-grid').innerHTML = projects.map(function(p) {
    var cnt = allGroups.filter(function(g) { return g.project_id === p.project_id; }).length;
    var start = fmtDate(p.start_date), end = p.end_date ? fmtDate(p.end_date) : '至今';
    return '<div class="card" onclick="showPage(\'groups\',{pid:' + p.project_id + '})"><h3>' + p.name + '</h3><p style="margin-top:8px;font-size:0.9em;">' + (p.description||'').slice(0,60) + '</p><span class="tag">' + start + ' ~ ' + end + '</span><span class="tag blue">' + cnt + ' 个团体 →</span><button class="btn btn-sm" style="margin-top:10px;background:var(--purple);color:#fff;" onclick="event.stopPropagation();showTimeline(' + p.project_id + ')">演唱会时间轴</button></div>';
  }).join('');
  // 拼盘入口
  var jointHtml = '<div class="card" onclick="showTimeline(0)" style="border:2px dashed var(--pink-light);"><h3>系列联合 & 拼盘演出</h3><p style="margin-top:8px;font-size:0.9em;color:#999;">LoveLive! FES · 异次元FES · Unit甲子园 · Asia Tour · COUNTDOWN</p><span class="tag purple">全系列跨团</span><span class="tag blue">点击查看 →</span></div>';
  document.getElementById('project-grid').innerHTML += jointHtml;
}

// ── groups
async function loadGroups() {
  var pr = await fetch(API + '/projects'); var projects = await pr.json();
  var selP = document.getElementById('group-filter-project');
  selP.innerHTML = '<option value="">全部企划</option>' + projects.map(function(p) { return '<option value="' + p.project_id + '">' + p.name + '</option>'; }).join('');
  if (pageFilter && pageFilter.pid) { selP.value = pageFilter.pid; }
  var gr = await fetch(API + '/groups'); var groups = await gr.json();
  var pid = selP.value;
  var gs = pid ? groups.filter(function(g) { return g.project_id === parseInt(pid); }) : groups;
  document.getElementById('group-grid').innerHTML = gs.map(function(g) {
    var cnt = g.char_count || 0;
    var logo = groupLogo[g.group_id] || '';
    return '<div class="card" onclick="showPage(\'characters\',{gid:' + g.group_id + '})">' + (logo ? '<div class="card-logo-bg" style="background-image:url(' + logo + ')"></div>' : '') + '<h3>' + g.name + '</h3><small style="color:#999">' + (g.project_name||'') + '</small><p style="margin-top:6px;font-size:0.9em;">' + (g.description||'').slice(0,80) + '</p><span class="tag">' + fmtDate(g.founding_date) + (g.disband_date ? ' ~ ' + fmtDate(g.disband_date) : ' ~') + '</span>' + (g.disband_date ? '<span class="tag orange">已结束</span>' : '<span class="tag blue">活动中</span>') + '<span class="tag blue">' + cnt + ' 个角色 →</span></div>';
  }).join('');
}

deselectAllGroups = function() {
  document.querySelectorAll('.group-mini-card').forEach(function(c) { c.classList.remove('active'); });
  selectedGroups = [];
  loadCharacters();
};
selectAllGroups = function() {
  var cards = document.querySelectorAll('.group-mini-card');
  cards.forEach(function(c) { c.classList.add('active'); });
  selectedGroups = Array.from(cards).map(function(c) { return c.dataset.gid; });
  loadCharacters();
};

// ── 动漫团迷你卡片选择
var selectedGroups = [];
function buildGroupMiniCards(groups) {
  var wrap = document.getElementById('group-mini-cards');
  wrap.innerHTML = groups.map(function(g) {
    var logo = groupLogo[g.group_id] || '';
    return '<div class="group-mini-card" data-gid="' + g.group_id + '" onclick="toggleGroupCard(this)">' +
      (logo ? '<div class="gmc-logo" style="background-image:url(' + logo + ')"></div>' : '') +
      '<span class="gmc-name">' + g.name + '</span></div>';
  }).join('');
}
function toggleGroupCard(el) {
  var gid = el.dataset.gid;
  el.classList.toggle('active');
  selectedGroups = Array.from(document.querySelectorAll('.group-mini-card.active')).map(function(c) { return c.dataset.gid; });
  loadCharacters();
}

// ── characters
async function loadCharacters() {
  var cardsWrap = document.getElementById('group-mini-cards');
  if (cardsWrap.children.length === 0) {
    var gr = await fetch(API + '/groups'); var groups = await gr.json();
    buildGroupMiniCards(groups);
    if (pageFilter && pageFilter.gid) {
      selectedGroups = [String(pageFilter.gid)];
      pageFilter = null;
      setTimeout(function() {
        document.querySelectorAll('.group-mini-card').forEach(function(c) { c.classList.toggle('active', c.dataset.gid === selectedGroups[0]); });
        loadCharacters();
      }, 100);
      return;
    }
    // 默认全选
    document.querySelectorAll('.group-mini-card').forEach(function(c) { c.classList.add('active'); });
    selectedGroups = groups.map(function(g) { return String(g.group_id); });
  }
  var search = document.getElementById('char-search').value;
  var ageRange = document.getElementById('char-filter-age').value;
  var url = API + '/characters?';
  if (selectedGroups.length === 1) { url += 'group_id=' + selectedGroups[0] + '&'; }
  if (search) url += 'search=' + encodeURIComponent(search) + '&';
  if (ageRange) { var parts = ageRange.split('-'); url += 'cv_age_min=' + parts[0] + '&cv_age_max=' + parts[1] + '&'; }
  var r = await fetch(url); var chars = await r.json();
  if (selectedGroups.length > 1) { chars = chars.filter(function(c) { return selectedGroups.indexOf(String(c.group_id)) >= 0; }); }

  if (selectedGroups.length === 0) {
    document.getElementById('char-grid').innerHTML = '<p style="color:#999;text-align:center;grid-column:1/-1;padding:40px;">点击上方团体卡片查看角色</p>';
    return;
  }

  var groups = {};
  chars.forEach(function(c) { var gn = c.group_name || '其他'; if (!groups[gn]) groups[gn] = []; groups[gn].push(c); });

  document.getElementById('char-grid').innerHTML = Object.entries(groups).map(function(entry) {
    var gname = entry[0], members = entry[1];
    return '<div style="grid-column:1/-1;margin-top:12px;"><h3 style="color:var(--pink);font-size:1.1em;padding-bottom:6px;border-bottom:2px solid var(--pink-light);">' + gname + ' <span style="font-weight:400;font-size:0.8em;color:#999;">(' + members.length + '人)</span></h3></div>' + members.map(function(c) {
      var age = c.birth_date ? Math.floor((new Date() - new Date(c.birth_date)) / 31557600000) : null;
      var cheerDot = c.cheering_color ? ' <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + c.cheering_color + ';border:1px solid #ddd;vertical-align:middle;"></span>' : '';
      var png = 'images/chars/char-' + c.character_id + '.png';
      return '<div class="card" onclick="showCharDetail(' + c.character_id + ')">' +
        '<div class="card-render-bg" style="background-image:url(' + png + ')"></div>' +
        '<h3>' + c.name + cheerDot + '</h3><span class="tag blue">' + (c.birthday||'?') + ' · ' + (c.blood_type||'?') + '型 · ' + (c.height||'?') + 'cm</span><div class="cv">CV: ' + (c.cv_name||'?') + (age ? ' (' + age + '岁)' : '') + '</div>' + (c.hobby ? '<div style="margin-top:6px;font-size:0.82em;color:#888;">爱好: ' + c.hobby + '</div>' : '') + '<div style="margin-top:4px;font-size:0.75em;color:var(--pink);">点击查看详情 →</div></div>';
    }).join('');
  }).join('');
}

// ── char detail
async function showCharDetail(charId) {
  var r = await fetch(API + '/characters/' + charId); var c = await r.json();
  var age = c.birth_date ? Math.floor((new Date() - new Date(c.birth_date)) / 31557600000) : null;
  var pngPath = 'images/chars/char-' + charId + '.png';
  document.getElementById('char-detail-content').innerHTML =
    '<div style="display:flex;gap:24px;flex-wrap:wrap;">' +
    '<div style="flex:0 0 200px;text-align:center;">' +
    '<img src="' + pngPath + '" style="width:180px;object-fit:contain;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
    '<div style="display:none;width:180px;height:210px;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);align-items:center;justify-content:center;color:var(--pink);font-size:3em;">' + (c.name||'?')[0] + '</div></div>' +
    '<div style="flex:1;min-width:280px;"><h2 style="color:var(--pink);margin-bottom:4px;">' + c.name + '</h2><p style="color:#999;margin-bottom:12px;">' + (c.group_name||'?') + '</p>' +
    '<table style="width:100%;font-size:0.9em;border-collapse:collapse;">' +
    '<tr><td style="padding:4px 8px;color:#999;width:80px;">CV</td><td>' + (c.cv_name||'?') + (age ? ' (' + age + '岁)' : '') + '</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">生日</td><td>' + (c.birthday||'?') + '</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">血型</td><td>' + (c.blood_type||'?') + '型</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">身高</td><td>' + (c.height||'?') + ' cm</td></tr>' +
    '<tr><td style="padding:4px 8px;color:#999;">爱好</td><td>' + (c.hobby||'?') + '</td></tr>' +
    (c.cheering_color ? '<tr><td style="padding:4px 8px;color:#999;">应援色</td><td><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:' + c.cheering_color + ';border:1px solid #ddd;vertical-align:middle;"></span> ' + c.cheering_color + '</td></tr>' : '') +
    (c.eye_color ? '<tr><td style="padding:4px 8px;color:#999;">瞳色</td><td>' + c.eye_color + '</td></tr>' : '') +
    (c.call_response ? '<tr><td style="padding:4px 8px;color:#999;">互动词</td><td style="font-size:0.85em;">' + c.call_response + '</td></tr>' : '') +
    '</table>' +
    (c.description ? '<div style="margin-top:12px;padding:12px;background:#fff5f8;border-radius:8px;font-size:0.9em;line-height:1.6;">' + c.description + '</div>' : '') +
    (c.rehearsals && c.rehearsals.length ? '<div style="margin-top:12px;"><h4 style="color:var(--pink);margin-bottom:6px;">近期排练记录</h4>' + c.rehearsals.slice(0,5).map(function(rh) { return '<div style="font-size:0.82em;padding:4px 0;border-bottom:1px solid #f0f0f0;">' + rh.cn_name + ' · ' + fmtDate(rh.rehearsal_date) + ' · ' + rh.dance_group_name + '</div>'; }).join('') + '</div>' : '') +
    '</div></div><div style="margin-top:16px;text-align:right;display:flex;gap:8px;justify-content:flex-end;">' +
    '<button class="btn" style="background:var(--purple);color:#fff;" onclick="showRelationGraph(' + charId + ')">关系图谱</button>' +
    '<button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
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
    return '<div class="rehearsal-item" id="reh-' + r.rehearsal_id + '"><div class="info"><strong>' + (dgCache[r.dance_group_id]||'未知舞团') + '</strong> ' + fmtDate(r.rehearsal_date) + ' ' + (r.start_time||'').slice(0,5) + '-' + (r.end_time||'').slice(0,5) + ' @' + r.location + '<br><small style="color:#888;">' + (r.content_summary||'') + '</small><div style="margin-top:6px;" id="reh-part-' + r.rehearsal_id + '"><button class="btn btn-sm" style="background:var(--pink-light);color:var(--pink);" onclick="toggleParticipants(' + r.rehearsal_id + ')">展开成员</button></div></div><div style="display:flex;align-items:center;gap:15px;"><div><span class="count ' + st + '" style="font-size:0.9em;">' + cur + '人</span></div><button class="btn btn-danger btn-sm" onclick="deleteRehearsal(' + r.rehearsal_id + ')">删除</button></div></div>';
  }).join('');
}

async function toggleParticipants(rehId) {
  var el = document.getElementById('reh-part-' + rehId);
  if (el.dataset.loaded) { el.innerHTML = '<button class="btn btn-sm" style="background:var(--pink-light);color:var(--pink);" onclick="toggleParticipants(' + rehId + ')">展开成员</button>'; el.dataset.loaded = ''; return; }

  // 获取排练信息
  var r1 = await fetch(API + '/rehearsals/' + rehId); var reh = await r1.json();
  var parts = reh.participants || [];
  var excluded = reh.excluded_chars ? reh.excluded_chars.split(',').map(Number) : [];
  // 获取舞团信息 → 对应的动漫团 → 所有角色
  var dgRes = await fetch(API + '/dance-groups/' + reh.dance_group_id); var dg = await dgRes.json();
  var animeGroupId = dg.anime_group_id;
  var allChars = [];
  if (animeGroupId) {
    var grRes = await fetch(API + '/groups/' + animeGroupId); var group = await grRes.json();
    allChars = (group.members || []).filter(function(c) { return excluded.indexOf(c.character_id) === -1; });
  } else {
    // 无关联动漫团：只用当前参与的角色
    var cr = await fetch(API + '/characters'); allChars = await cr.json();
  }

  var partMap = {};
  parts.forEach(function(p) { partMap[p.character_id] = { cn: p.cn_name, pid: p.participation_id }; });

  var cards = allChars.map(function(c) {
    var p = partMap[c.character_id];
    var color = c.cheering_color || '#ccc';
    if (p) {
      return '<div class="reh-part-card filled" style="--card-color:' + color + '" onclick="editDancer(' + rehId + ',' + c.character_id + ',\'' + p.cn + '\',' + p.pid + ')" title="' + p.cn + ' → ' + c.name + '">' +
        '<div class="rpc-char" style="color:' + color + '">' + c.name + '</div>' +
        '<div class="rpc-dancer">' + p.cn + '</div></div>';
    } else {
      return '<div class="reh-part-card missing" data-cid="' + c.character_id + '" onclick="quickAssign(' + rehId + ',' + c.character_id + ')" title="空缺：' + c.name + '">' +
        '<div class="rpc-char">' + c.name + '</div>' +
        '<div class="rpc-status">+ 空缺</div></div>';
    }
  }).join('');

  var filledCount = Object.keys(partMap).length;
  var total = allChars.length;
  el.innerHTML = '<div class="reh-parts-grid" id="reh-grid-' + rehId + '">' + cards + '</div>' +
    '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
    '<button class="btn btn-sm" style="background:var(--pink-light);color:var(--pink);" onclick="toggleParticipants(' + rehId + ')">收起</button>' +
    '<button class="btn btn-sm" style="background:#fff;color:#ef5350;border:1px solid #ef5350;" id="edit-mode-btn-' + rehId + '" onclick="toggleEditMode(' + rehId + ')">✎ 删减角色</button>' +
    '<span style="font-size:0.75em;color:#999;">已填 ' + filledCount + '/' + total + ' · 点击灰卡补充</span></div>';
  el.dataset.loaded = '1';
}

// 点击空缺 → 快速指派舞见
quickAssign = function(rehId, charId) {
  var cn = prompt('为角色指派舞见，请输入CN名：');
  if (!cn) return;
  addParticipantByName(rehId, charId, cn);
};

toggleEditMode = function(rehId) {
  var grid = document.getElementById('reh-grid-' + rehId);
  var btn = document.getElementById('edit-mode-btn-' + rehId);
  if (!grid || !btn) return;
  var isEditing = grid.classList.toggle('editing');
  btn.textContent = isEditing ? '✓ 完成' : '✎ 删减角色';
  btn.style.background = isEditing ? '#ef5350' : '#fff';
  btn.style.color = isEditing ? '#fff' : '#ef5350';
  if (isEditing) {
    grid.querySelectorAll('.reh-part-card.missing').forEach(function(card) {
      card.classList.add('shaking');
      card.onclick = function() {
        var cid = parseInt(card.dataset.cid);
        if (confirm('移除此角色？该角色将不参与本次排练。')) {
          fetch(API + '/rehearsals/' + rehId + '/chars/' + cid, { method:'DELETE' }).then(function() {
            var el = document.getElementById('reh-part-' + rehId);
            el.dataset.loaded = ''; toggleParticipants(rehId);
            setTimeout(function() { loadRehearsals(); }, 300);
          });
        }
      };
    });
  } else {
    grid.querySelectorAll('.reh-part-card.shaking').forEach(function(card) {
      card.classList.remove('shaking');
      card.onclick = function() { quickAssign(rehId, parseInt(card.dataset.cid)); };
    });
  }
};

// 点击已分配 → 修改或删除
editDancer = function(rehId, charId, currentCn, partId) {
  var action = prompt('修改舞见CN（留空删除）：', currentCn);
  if (action === null) return;
  if (action === '') {
    if (confirm('确定移除此舞见？')) {
      fetch(API + '/rehearsals/' + rehId + '/participants/' + partId, { method:'DELETE' }).then(function() {
        var el = document.getElementById('reh-part-' + rehId); el.dataset.loaded = '';
        toggleParticipants(rehId);
        setTimeout(function() { loadRehearsals(); }, 300);
      });
    }
  } else if (action !== currentCn) {
    // 删除旧的，添加新的
    fetch(API + '/rehearsals/' + rehId + '/participants/' + partId, { method:'DELETE' }).then(function() {
      addParticipantByName(rehId, charId, action);
    });
  }
};

async function addParticipantByName(rehId, charId, cn) {
  var rh = await fetch(API + '/rehearsals/' + rehId); var reh = await rh.json();
  var dgId = reh.dance_group_id;
  var dancerId;
  var dRes = await fetch(API + '/dancers?dance_group_id=' + dgId); var dancers = await dRes.json();
  var df = dancers.find(function(d) { return d.cn_name === cn; });
  if (df) { dancerId = df.dancer_id; }
  else {
    var cd = await fetch(API + '/dancers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dance_group_id: dgId, cn_name: cn }) });
    var cj = await cd.json(); dancerId = cj.dancer_id;
  }
  var pr = await fetch(API + '/rehearsals/' + rehId + '/participants', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dancer_id: dancerId, character_id: charId }) });
  if (!pr.ok) { var e = await pr.json(); alert(e.error); return; }
  var el = document.getElementById('reh-part-' + rehId); el.dataset.loaded = '';
  toggleParticipants(rehId);
  setTimeout(function() { loadRehearsals(); }, 300);
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
safeOn('char-search','input',loadCharacters);
safeOn('char-filter-age','change',loadCharacters);
safeOn('reh-filter-status','change',loadRehearsals);
safeOn('reh-date-from','change',loadRehearsals);
safeOn('reh-date-to','change',loadRehearsals);
['modal-rehearsal','modal-char'].forEach(function(id) { var el = document.getElementById(id); if (el) el.addEventListener('click', function(e) { if (e.target === this) closeModal(id); }); });

// ── 演唱会时间轴
var labelColors = {
  '1巡':'#66bb6a','2巡':'#42a5f5','3巡':'#ab47bc','4巡':'#ffa726','5巡':'#ef5350','6巡':'#26c6da','7巡':'#7e57c2',
  'Final':'#e53935','Finale':'#e53935','首演':'#ff7043',
  '拼盘':'#ec407a','联合':'#5c6bc0','Fes':'#ff8a65'
};
async function showTimeline(projectId) {
  var concerts, p;
  if (projectId === 0) {
    var r0 = await fetch(API + '/concerts');
    var all = await r0.json();
    concerts = all.filter(function(c) { return c.project_id === null; });
    p = { name: 'LoveLive! 系列 联合 & 拼盘演出' };
  } else {
    var r1 = await fetch(API + '/concerts?project_id=' + projectId);
    concerts = await r1.json();
    var pr = await fetch(API + '/projects/' + projectId);
    p = await pr.json();
  }
  var html = '<h2 style="color:var(--pink);margin-bottom:12px;">' + p.name + ' 演唱会时间轴</h2>';
  html += '<table style="width:100%;border-collapse:collapse;font-size:0.9em;"><tr style="color:#999;font-size:0.85em;"><td style="padding:6px 8px;width:60px;">标签</td><td style="padding:6px 8px;width:100px;">日期</td><td style="padding:6px 8px;">演唱会名称</td></tr>';
  concerts.forEach(function(c) {
    var lc = labelColors[c.label] || '#999';
    html += '<tr style="border-top:1px solid #f0e0e8;">';
    html += '<td style="padding:8px;"><span style="display:inline-block;padding:3px 10px;border-radius:10px;background:' + lc + ';color:#fff;font-size:0.8em;font-weight:700;">' + c.label + '</span></td>';
    html += '<td style="padding:8px;white-space:nowrap;">' + (c.concert_date||'').slice(0,10) + '</td>';
    html += '<td style="padding:8px;">' + c.name + '</td></tr>';
  });
  html += '</table><div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML = html;
  document.getElementById('modal-char').classList.add('show');
}

// ── 人物关系图谱 (Canvas 动态)
var leaders = {1:1,10:1,19:1,31:1}; // 各团leader
var specialRels = {
  '17,15':'姐妹','15,17':'姐妹','56,57':'姐妹','57,56':'姐妹','39,41':'姐妹','41,39':'姐妹',
  // 幼驯染
  '1,3':'幼驯染','3,1':'幼驯染','1,4':'幼驯染','4,1':'幼驯染','3,4':'幼驯染','4,3':'幼驯染',
  '10,12':'幼驯染','12,10':'幼驯染','10,16':'幼驯染','16,10':'幼驯染',
  '31,33':'幼驯染','33,31':'幼驯染','19,99':'幼驯染',
  // 憧憬
  '10,1':'憧憬','32,58':'崇拜','32,59':'崇拜',
  // 官方CP / 搭档
  '6,9':'搭档','9,6':'搭档','2,7':'搭档','7,2':'搭档','5,8':'搭档','8,5':'搭档',
  '11,12':'搭档','12,11':'搭档','10,11':'搭档','11,10':'搭档','14,15':'搭档','15,14':'搭档',
  '16,17':'搭档','17,16':'搭档','13,18':'搭档','18,13':'搭档',
  '19,25':'搭档','25,19':'搭档','20,21':'搭档','21,20':'搭档',
  '22,23':'搭档','23,22':'搭档','24,26':'搭档','26,24':'搭档',
  '31,32':'搭档','32,31':'搭档','34,35':'搭档','35,34':'搭档',
  '36,39':'搭档','39,36':'搭档','37,38':'搭档','38,37':'搭档',
  // 拌嘴/对手
  '6,9':'斗嘴','9,6':'斗嘴','13,14':'斗嘴','14,13':'斗嘴',
  '20,25':'斗嘴','25,20':'斗嘴','32,34':'斗嘴','34,32':'斗嘴',
};
function getRel(a, b) { return specialRels[a+','+b] || specialRels[b+','+a] || ''; }
function isCross(a, b) {
  var crossPairs = {'10,1':1,'1,10':1,'32,58':1,'58,32':1,'32,59':1,'59,32':1};
  return crossPairs[a+','+b] || crossPairs[b+','+a];
}

async function showRelationGraph(charId) {
  var r = await fetch(API + '/characters/' + charId);
  var c = await r.json();
  var gr = await fetch(API + '/groups/' + c.group_id);
  var group = await gr.json();
  var members = group.members || [];
  // 跨团关系：收集需要引入的外部角色
  var extraIds = [];
  members.forEach(function(m) {
    Object.keys(specialRels).forEach(function(key) {
      var parts = key.split(','); var a = parseInt(parts[0]), b = parseInt(parts[1]);
      if (a === m.character_id && !members.find(function(x){return x.character_id===b})) extraIds.push(b);
      if (b === m.character_id && !members.find(function(x){return x.character_id===a})) extraIds.push(a);
    });
  });
  // 去重并获取外部角色
  extraIds = extraIds.filter(function(v,i,s){return s.indexOf(v)===i;});
  for (var i = 0; i < extraIds.length; i++) {
    var er = await fetch(API + '/characters/' + extraIds[i]);
    var ec = await er.json();
    if (ec && ec.character_id) members.push({character_id:ec.character_id, name:ec.name, cheering_color:ec.cheering_color, cv_name:ec.cv_name});
  }

  if (members.length < 2) { alert('暂无关系统计'); return; }

  var nodes = members.map(function(m) {
    var isLeader = leaders[m.character_id];
    var size = m.character_id === charId ? 'center' : (isLeader ? 'leader' : (extraIds.indexOf(m.character_id)>=0 ? 'cross' : 'normal'));
    return { id: m.character_id, name: m.name, color: m.cheering_color || '#bbb', size: size };
  });

  var W = 600, H = 480;
  var cx = W/2, cy = H/2;
  nodes.forEach(function(n, i) {
    var angle = (i / nodes.length) * 2 * Math.PI - Math.PI/2;
    var dist = n.size === 'center' ? 0 : (n.size === 'cross' ? 200 : 130 + Math.random()*30);
    n.x = cx + dist * Math.cos(angle); n.y = cy + dist * Math.sin(angle);
    n.vx = 0; n.vy = 0;
  });

  var html = '<h3 style="color:var(--pink);margin-bottom:4px;">' + (c.group_name||'') + ' 成员关系 <small style="font-weight:400;color:#999;">(拖动节点 · 点击跳转)</small></h3>';
  html += '<canvas id="rel-canvas" width="' + W + '" height="' + H + '" style="background:#fdf6f8;border-radius:16px;display:block;margin:0 auto;cursor:grab;"></canvas>';
  html += '<div style="margin-top:10px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML = html;
  document.getElementById('modal-char').classList.add('show');

  setTimeout(function() {
    var canvas = document.getElementById('rel-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dragNode = null;

    function drawArrow(ctx, x1, y1, x2, y2, color, size) {
      var angle = Math.atan2(y2 - y1, x2 - x1);
      var dist = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
      var nodeR = 22;
      var px = x2 - (nodeR+2) * Math.cos(angle);
      var py = y2 - (nodeR+2) * Math.sin(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - size * Math.cos(angle - 0.6), py - size * Math.sin(angle - 0.6));
      ctx.lineTo(px - size * Math.cos(angle + 0.6), py - size * Math.sin(angle + 0.6));
      ctx.closePath();
      ctx.fill();
    }

    function step() {
      if (!document.getElementById('rel-canvas')) return;
      nodes.forEach(function(a) {
        nodes.forEach(function(b) {
          if (a===b) return;
          var dx = b.x-a.x, dy = b.y-a.y, dist = Math.sqrt(dx*dx+dy*dy)||1;
          var rel = getRel(a.id,b.id);
          if (a.size==='center' || b.size==='center') {
            var target = a.size==='center' ? 100 : (rel ? 85 : 120);
            var f = (dist-target)*0.004;
            a.vx += dx/dist*f; a.vy += dy/dist*f;
          } else {
            if (dist < 70) { var f2 = (70-dist)*0.015; a.vx -= dx/dist*f2; a.vy -= dy/dist*f2; }
          }
        });
        if (a.size==='center') { a.vx += (cx-a.x)*0.015; a.vy += (cy-a.y)*0.015; }
        a.vx *= 0.9; a.vy *= 0.9; a.x += a.vx; a.y += a.vy;
        a.x = Math.max(20,Math.min(W-20,a.x)); a.y = Math.max(20,Math.min(H-20,a.y));
      });

      ctx.clearRect(0,0,W,H);
      // 连线
      nodes.forEach(function(a) {
        nodes.forEach(function(b) {
          if (a.id >= b.id) return;
          var rel = getRel(a.id, b.id);
          var cross = isCross(a.id, b.id);
          if (rel) {
            ctx.strokeStyle = cross ? '#ff7043' : '#e57373'; ctx.lineWidth = 2.2;
          } else if (a.size==='center' || b.size==='center') {
            ctx.strokeStyle = '#ffc0cb'; ctx.lineWidth = 1;
          } else {
            ctx.strokeStyle = '#f0e0e8'; ctx.lineWidth = 0.4;
          }
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          // 画箭头
          if (rel || a.size==='center' || b.size==='center') {
            var arrowSize = rel ? 7 : 5;
            var isOneWay = rel && (rel === '憧憬' || rel === '崇拜');
            var isMutual = rel && !isOneWay;
            drawArrow(ctx, a.x, a.y, b.x, b.y, ctx.strokeStyle, arrowSize);
            if (isMutual) drawArrow(ctx, b.x, b.y, a.x, a.y, ctx.strokeStyle, arrowSize);
          }
          // 线上写关系名
          if (rel) {
            var mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
            ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 11px Microsoft YaHei';
            var tw = ctx.measureText(rel).width;
            ctx.fillRect(mx-tw/2-6, my-10, tw+12, 20);
            ctx.fillStyle = cross ? '#e64a19' : '#c62828'; ctx.textAlign='center';
            ctx.fillText(rel, mx, my+4);
          }
        });
      });

      // 节点
      nodes.forEach(function(n) {
        var sizes = {center:30, leader:24, normal:18, cross:16};
        var r = sizes[n.size] || 18;
        var alpha = n.size==='cross' ? 0.55 : (n.size==='normal' ? 0.8 : 1);
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2);
        ctx.fillStyle = n.color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = n.size==='center'?3.5:(n.size==='leader'?2.5:1.5);
        ctx.stroke();
        if (n.size==='center') {
          ctx.beginPath(); ctx.arc(n.x,n.y,r+5,0,Math.PI*2);
          ctx.strokeStyle = n.color; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = n.size==='cross'?'#999':'#333'; ctx.font = (n.size==='center'||n.size==='leader'?'bold ':'') + (n.size==='cross'?'10':'11') + 'px Microsoft YaHei';
        ctx.textAlign='center'; ctx.fillText(n.name, n.x, n.y+r+13);
      });

      requestAnimationFrame(step);
    }

    canvas.onmousedown = function(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX-rect.left, my = e.clientY-rect.top;
      for (var i = nodes.length-1; i>=0; i--) {
        var dx=mx-nodes[i].x, dy=my-nodes[i].y, r=nodes[i].size==='center'?30:20;
        if (dx*dx+dy*dy<r*r) { dragNode=nodes[i]; canvas.style.cursor='grabbing'; return; }
      }
    };
    canvas.onmousemove = function(e) {
      if (!dragNode) return;
      var rect = canvas.getBoundingClientRect();
      dragNode.x = e.clientX-rect.left; dragNode.y = e.clientY-rect.top;
    };
    canvas.onmouseup = function() { dragNode=null; canvas.style.cursor='grab'; };
    canvas.onclick = function(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX-rect.left, my = e.clientY-rect.top;
      for (var i=nodes.length-1; i>=0; i--) {
        var dx=mx-nodes[i].x, dy=my-nodes[i].y, r=nodes[i].size==='center'?30:20;
        if (dx*dx+dy*dy<r*r && nodes[i].id!==charId) {
          var id=nodes[i].id;
          closeModal('modal-char');
          setTimeout(function(){showCharDetail(id);setTimeout(function(){showRelationGraph(id)},500);},300);
          return;
        }
      }
    };

    requestAnimationFrame(step);
  },200);
}

// ── 滚动触发动画
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('visible');
        void entry.target.offsetWidth;
        entry.target.classList.add('visible');
        if (entry.target.dataset.done) return;
        entry.target.dataset.done = '1';
      }
    });
  }, { threshold: 0.15 });

  function watch() {
    document.querySelectorAll('.card, .rehearsal-item, .stat-card').forEach(function(el) {
      if (!el.classList.contains('anim-item')) el.classList.add('anim-item');
      observer.observe(el);
    });
  }

  // 页面切换后重新观察新渲染的元素
  var origShow = showPage;
  showPage = function(name, filterVal) {
    origShow(name, filterVal);
    setTimeout(watch, 150);
  };
  watch();
})();

// ── init
loadHome();
