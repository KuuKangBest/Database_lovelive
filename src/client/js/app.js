const API = 'http://localhost:3000/api';
let dgCache = {}, pageFilter = null;
const groupLogo = { 1:'images/logos/muse.png', 2:'images/logos/aqours.png', 3:'images/logos/nijigasaki.png', 4:'images/logos/liella.png', 5:'images/logos/hasunosora.png', 6:'images/logos/arise.png', 7:'images/logos/saintsnow.png', 8:'images/logos/sunnypassion.png', 9:'images/logos/bluebird.png' };

function fmtDate(d) { if (!d) return '至今'; return d.slice(0,10); }
function occupantStatus(cur, max) { if (max===0) return 'unlimited'; if (cur>=max) return 'full'; if (cur/max>=0.8) return 'near_full'; return 'available'; }
function statusLabel(s) { return {available:'有空位',near_full:'将满',full:'已满',unlimited:'不限'}[s]||s; }
async function loadDGCache(f) { if (f) dgCache={}; if (Object.keys(dgCache).length) return; var r = await fetch(API+'/dance-groups'); var dgs = await r.json(); dgs.forEach(function(d){dgCache[d.dance_group_id]=d.name;}); }

function showPage(name, filterVal) {
  pageFilter = filterVal||null;
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-links button').forEach(function(b){b.classList.remove('active');});
  document.getElementById(name).classList.add('active');
  document.querySelectorAll('.nav-links button').forEach(function(b){if(b.getAttribute('data-page')===name)b.classList.add('active');});
  if (name==='projects') loadProjects();
  if (name==='groups') loadGroups();
  if (name==='characters'){ document.getElementById('char-filter-age').value=''; if(filterVal){ loadCharacters(); } else { selectedGroups=[]; loadCharacters(); setTimeout(selectAllGroups,100); } }
  if (name==='rehearsal') { renderCalendar(); loadPerfView(); }
  if (name==='dancegroups') { dgCache={}; loadDgMgmt(); }
  if (name==='dancers') { dgCache={}; var dsf=document.getElementById('dancer-dg-filter');if(dsf)dsf.innerHTML=''; loadDancerList(); buildCharBiasCards(); }
  if (name==='home') loadHome();
}

async function loadHome() {
  await loadDGCache();
  var r = await fetch(API+'/stats'); var stats = await r.json();
  document.getElementById('stat-projects').textContent=stats.projectCount;
  document.getElementById('stat-groups').textContent=stats.groupCount;
  document.getElementById('stat-chars').textContent=stats.charCount;
  document.getElementById('stat-seiyuu').textContent=stats.rehCount;
  try{renderHomeCalendar();}catch(e){}
  var dgs=await(await fetch(API+'/dance-groups')).json();document.getElementById('stat-dgs').textContent=dgs.length;
  var dancers=await(await fetch(API+'/dancers')).json();document.getElementById('stat-dancers').textContent=dancers.length;
  var today=new Date().toISOString().slice(0,10);
  var twoWeek=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
  var rr=await fetch(API+'/rehearsals?date_from='+today+'&date_to='+twoWeek+'&reh_status=active');
  var list=await rr.json();
  var el=document.getElementById('home-rehearsals');
  if(!list.length){el.innerHTML='<p style="color:#999;">未来两周暂无排练</p>';return;}
  el.innerHTML=list.map(function(r){
    var cancelled=r.status==='cancelled';
    return '<div class="rehearsal-item'+(cancelled?' cancelled':'')+'" style="cursor:pointer;" onclick="showRehearsalDetail('+r.rehearsal_id+')"><div class="info"><strong>'+(dgCache[r.dance_group_id]||'?')+'</strong> · '+fmtDate(r.rehearsal_date)+' '+(r.start_time||'').slice(0,5)+'-'+(r.end_time||'').slice(0,5)+' @'+r.location+(cancelled?' <span style="color:#c62828;font-weight:700;">[已取消]</span>':'')+'<br><small>'+(r.content_summary||'')+'</small></div><span class="count '+(cancelled?'cancelled':r.occupancy_status)+'">'+(cancelled?'已取消':r.current_participants+'人')+'</span></div>';
  }).join('');
}

async function loadProjects() {
  var r = await fetch(API+'/projects'); var projects = await r.json();
  var gr = await fetch(API+'/groups'); var allGroups = await gr.json();
  document.getElementById('project-grid').innerHTML = projects.map(function(p){
    var cnt = allGroups.filter(function(g){return g.project_id===p.project_id;}).length;
    return '<div class="card" onclick="showPage(\'groups\',{pid:'+p.project_id+'})"><h3>'+p.name+'</h3><p style="margin-top:8px;font-size:0.9em;">'+(p.description||'').slice(0,60)+'</p><span class="tag">'+fmtDate(p.start_date)+' ~ '+fmtDate(p.end_date||'至今')+'</span><span class="tag blue">'+cnt+' 个团体 →</span><button class="btn btn-sm" style="margin-top:10px;background:var(--purple);color:#fff;" onclick="event.stopPropagation();showTimeline('+p.project_id+')">演唱会时间轴</button></div>';
  }).join('');
  document.getElementById('project-grid').innerHTML += '<div class="card" onclick="showTimeline(0)" style="border:2px dashed var(--pink-light);"><h3>系列联合 & 拼盘演出</h3><p style="margin-top:8px;font-size:0.9em;color:#999;">FES · 异次元 · Unit甲子园 · Asia Tour</p><span class="tag purple">跨团</span><span class="tag blue">点击 →</span></div>';
}

async function loadGroups() {
  var pr = await fetch(API+'/projects'); var projects = await pr.json();
  var selP = document.getElementById('group-filter-project');
  selP.innerHTML = '<option value="">全部企划</option>'+projects.map(function(p){return '<option value="'+p.project_id+'">'+p.name+'</option>';}).join('');
  if (pageFilter&&pageFilter.pid) selP.value=pageFilter.pid;
  var gr = await fetch(API+'/groups'); var groups = await gr.json();
  var pid = selP.value;
  var gs = pid?groups.filter(function(g){return g.project_id===parseInt(pid);}):groups;
  document.getElementById('group-grid').innerHTML = gs.map(function(g){
    var cnt = g.char_count||0;
    var logo = groupLogo[g.group_id]||'';
    return '<div class="card" onclick="showPage(\'characters\',{gid:'+g.group_id+'})">'+(logo?'<div class="card-logo-bg" style="background-image:url('+logo+')"></div>':'')+'<h3>'+g.name+'</h3><small style="color:#999;">'+(g.project_name||'')+'</small><p style="margin-top:6px;font-size:0.9em;">'+(g.description||'').slice(0,80)+'</p><span class="tag">'+fmtDate(g.founding_date)+(g.disband_date?' ~ '+fmtDate(g.disband_date):' ~')+'</span>'+(g.disband_date?'<span class="tag orange">已结束</span>':'<span class="tag blue">活动中</span>')+'<span class="tag blue">'+cnt+' 个角色 →</span></div>';
  }).join('');
}

var selectedGroups=[];
function buildGroupMiniCards(groups){
  document.getElementById('group-mini-cards').innerHTML = groups.map(function(g){
    var logo = groupLogo[g.group_id]||'';
    return '<div class="group-mini-card" data-gid="'+g.group_id+'" onclick="toggleGroupCard(this)">'+(logo?'<div class="gmc-logo" style="background-image:url('+logo+')"></div>':'')+'<span class="gmc-name">'+g.name+'</span></div>';
  }).join('');
}
function toggleGroupCard(el){
  el.classList.toggle('active');
  selectedGroups = Array.from(document.querySelectorAll('.group-mini-card.active')).map(function(c){return c.dataset.gid;});
  loadCharacters();
}
selectAllGroups = function(){
  document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.add('active');});
  selectedGroups = Array.from(document.querySelectorAll('.group-mini-card')).map(function(c){return c.dataset.gid;});
  loadCharacters();
};
deselectAllGroups = function(){
  document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.remove('active');});
  selectedGroups = [];
  loadCharacters();
};

// 搜索防抖定时器
var searchTimer = null;
async function loadCharacters(){
  var cardsWrap = document.getElementById('group-mini-cards');
  if (cardsWrap.children.length===0){
    var gr = await fetch(API+'/groups'); var groups = await gr.json();
    buildGroupMiniCards(groups);
    document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.add('active');});
    selectedGroups=groups.map(function(g){return String(g.group_id);});
  }
  if (pageFilter&&pageFilter.gid){
    selectedGroups=[String(pageFilter.gid)]; pageFilter=null;
    document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.toggle('active',c.dataset.gid===selectedGroups[0]);});
  }
  var search = document.getElementById('char-search').value.trim();
  var ageRange = document.getElementById('char-filter-age').value;
  var chars;
  var isSearch = !!search;

  // 构建查询 URL（使用增强版多字段多关键词搜索）
  var url = API+'/characters?';
  if (search) url+='search='+encodeURIComponent(search)+'&';
  if (selectedGroups.length===1) url+='group_id='+selectedGroups[0]+'&';
  if (ageRange){var parts=ageRange.split('-');url+='cv_age_min='+parts[0]+'&cv_age_max='+parts[1]+'&';}
  var r = await fetch(url); chars = await r.json();

  // 客户端叠加多团体筛选和服务端未覆盖的年龄筛选
  if (!isSearch && selectedGroups.length>=1){
    chars=chars.filter(function(c){return selectedGroups.indexOf(String(c.group_id))>=0;});
  }
  if (isSearch && selectedGroups.length>=1){
    chars=chars.filter(function(c){return selectedGroups.indexOf(String(c.group_id))>=0;});
  }

  if (!isSearch && !selectedGroups.length && cardsWrap.children.length>0) {
    document.getElementById('char-grid').innerHTML='<p style="color:#999;text-align:center;padding:40px;">未选择团体，点击上方卡片筛选<br><small>或在上方搜索框中输入关键词进行全局搜索</small></p>'; return;
  }
  if (!chars.length) {
    var hint = search ? ('没有匹配 "'+search+'" 的角色，试试其他关键词'+(search.indexOf(' ')===-1?' 或用空格分隔多个关键词（如"蓝色 钢琴"）':'')) : '没有匹配的角色';
    document.getElementById('char-grid').innerHTML='<p style="color:#999;text-align:center;padding:40px;">'+hint+'</p>'; return;
  }

  // 搜索结果：按相关性平铺展示
  if (isSearch) {
    var kwTags = search.split(/\s+/).filter(Boolean).map(function(k){return '<span class="tag" style="background:#fce4ec;color:var(--pink);">'+k+'</span>';}).join(' ');
    document.getElementById('char-grid').innerHTML =
      '<div style="grid-column:1/-1;margin-bottom:12px;"><h3 style="color:var(--pink);">🔍 搜索 '+kwTags+' <span style="font-weight:400;font-size:0.8em;color:#999;">('+chars.length+'个结果，按相关性排序)</span></h3><p style="font-size:0.75em;color:#999;">搜索范围：角色名、爱好、描述、声优、团体、瞳色、应援色、互动词、血型</p></div>'+
      chars.map(function(c){
        var age = c.birth_date?Math.floor((new Date()-new Date(c.birth_date))/31557600000):null;
        var cheerDot = c.cheering_color?' <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+c.cheering_color+';border:1px solid #ddd;vertical-align:middle;"></span>':'';
        return '<div class="card" onclick="showCharDetail('+c.character_id+')"><div class="card-render-bg" style="background-image:url(images/chars/char-'+c.character_id+'.png)"></div><h3>'+c.name+cheerDot+'</h3><span class="tag blue">'+(c.birthday||'?')+' · '+(c.blood_type||'?')+'型 · '+(c.height||'?')+'cm</span><div class="cv">CV: '+(c.cv_name||'?')+(age?' ('+age+'岁)':'')+' · '+(c.group_name||'')+'</div>'+(c.hobby?'<div style="margin-top:6px;font-size:0.82em;color:#888;">'+c.hobby+'</div>':'')+(c.eye_color?'<div style="font-size:0.75em;color:#999;">瞳色: '+c.eye_color+'</div>':'')+'<div style="margin-top:4px;font-size:0.75em;color:var(--pink);">点击查看详情 →</div></div>';
      }).join('');
  } else {
    // 非搜索：按团体分组展示
    var grp={}; chars.forEach(function(c){var gn=c.group_name||'其他'; if(!grp[gn])grp[gn]=[]; grp[gn].push(c);});
    document.getElementById('char-grid').innerHTML = Object.entries(grp).map(function(e){
      return '<div style="grid-column:1/-1;margin-top:12px;"><h3 style="color:var(--pink);padding-bottom:6px;border-bottom:2px solid var(--pink-light);">'+e[0]+' <span style="font-weight:400;font-size:0.8em;color:#999;">('+e[1].length+'人)</span></h3></div>'+e[1].map(function(c){
        var age = c.birth_date?Math.floor((new Date()-new Date(c.birth_date))/31557600000):null;
        var cheerDot = c.cheering_color?' <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+c.cheering_color+';border:1px solid #ddd;vertical-align:middle;"></span>':'';
        return '<div class="card" onclick="showCharDetail('+c.character_id+')"><div class="card-render-bg" style="background-image:url(images/chars/char-'+c.character_id+'.png)"></div><h3>'+c.name+cheerDot+'</h3><span class="tag blue">'+(c.birthday||'?')+' · '+(c.blood_type||'?')+'型 · '+(c.height||'?')+'cm</span><div class="cv">CV: '+(c.cv_name||'?')+(age?' ('+age+'岁)':'')+'</div>'+(c.hobby?'<div style="margin-top:6px;font-size:0.82em;color:#888;">'+c.hobby+'</div>':'')+(c.eye_color?'<div style="font-size:0.75em;color:#999;">瞳色: '+c.eye_color+'</div>':'')+'<div style="margin-top:4px;font-size:0.75em;color:var(--pink);">点击查看详情 →</div></div>';
      }).join('');
    }).join('');
  }
}

async function showCharDetail(charId){
  var r = await fetch(API+'/characters/'+charId); var c = await r.json();
  var age = c.birth_date?Math.floor((new Date()-new Date(c.birth_date))/31557600000):null;
  var rehItems=c.rehearsals&&c.rehearsals.length?c.rehearsals.map(function(rh){return'<div style="font-size:0.82em;padding:6px 8px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px;"><div style="flex:1;"><span style="color:var(--pink);cursor:pointer;text-decoration:underline;" onclick="event.stopPropagation();closeModal(\'modal-char\');showDancerDetail('+(rh.dancer_id||0)+')">'+rh.cn_name+'</span><span style="color:#999;"> · '+fmtDate(rh.rehearsal_date)+' · </span><span style="color:#42a5f5;cursor:pointer;text-decoration:underline;" onclick="event.stopPropagation();closeModal(\'modal-char\');showDgDetail('+(rh.dance_group_id||0)+')">'+rh.dance_group_name+'</span></div><button class="btn btn-sm" style="padding:2px 10px;font-size:0.75em;background:var(--pink);color:#fff;white-space:nowrap;" onclick="closeModal(\'modal-char\');showRehearsalDetail('+rh.rehearsal_id+')">查看排练</button></div>';}):[];
  var rehHTML='';
  if(rehItems.length){
    rehHTML='<div style="margin-top:12px;"><h4 style="color:var(--pink);">近期排练 ('+rehItems.length+'次)</h4>'+rehItems.slice(0,5).join('');
    if(rehItems.length>5){
      rehHTML+='<div id="char-reh-more-'+charId+'" style="display:none;">'+rehItems.slice(5).join('')+'</div>';
      rehHTML+='<button id="char-reh-btn-'+charId+'" class="btn btn-sm" style="margin-top:8px;width:100%;" onclick="toggleCharRehearsals('+charId+','+rehItems.length+')">展开全部 ('+rehItems.length+'条) ▼</button>';
    }
    rehHTML+='</div>';
  }
  var html = '<div style="display:flex;gap:24px;flex-wrap:wrap;"><div style="flex:0 0 200px;text-align:center;"><img src="images/chars/char-'+charId+'.png" style="width:180px;object-fit:contain;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);" onerror="this.style.display=\'none\'"><div style="display:none;width:180px;height:210px;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);align-items:center;justify-content:center;color:var(--pink);font-size:3em;">'+(c.name||'?')[0]+'</div></div><div style="flex:1;min-width:280px;"><h2 style="color:var(--pink);margin-bottom:4px;">'+c.name+'</h2><p style="color:#999;">'+(c.group_name||'?')+'</p><table style="font-size:0.9em;"><tr><td style="color:#999;width:60px;">CV</td><td>'+(c.cv_name||'?')+(age?' ('+age+'岁)':'')+'</td></tr><tr><td style="color:#999;">生日</td><td>'+(c.birthday||'?')+'</td></tr><tr><td style="color:#999;">血型</td><td>'+(c.blood_type||'?')+'型</td></tr><tr><td style="color:#999;">身高</td><td>'+(c.height||'?')+' cm</td></tr><tr><td style="color:#999;">爱好</td><td>'+(c.hobby||'?')+'</td></tr>'+(c.eye_color?'<tr><td style="color:#999;">瞳色</td><td>'+c.eye_color+'</td></tr>':'')+(c.cheering_color?'<tr><td style="color:#999;">应援色</td><td><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:'+c.cheering_color+';border:1px solid #ddd;"></span> '+c.cheering_color+'</td></tr>':'')+(c.call_response?'<tr><td style="color:#999;">互动词</td><td style="font-size:0.85em;">'+c.call_response+'</td></tr>':'')+'</table>'+(c.description?'<div style="margin-top:12px;padding:12px;background:#fff5f8;border-radius:8px;font-size:0.9em;line-height:1.6;">'+c.description+'</div>':'')+rehHTML+'<div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-sm" style="background:var(--purple);color:#fff;" onclick="showRelationGraph('+charId+')">关系图谱</button></div></div></div><div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML = html;
  document.getElementById('modal-char').classList.add('show');
}

toggleCharRehearsals=function(charId,total){
  var more=document.getElementById('char-reh-more-'+charId);
  var btn=document.getElementById('char-reh-btn-'+charId);
  if(!more||!btn)return;
  if(more.style.display==='none'){more.style.display='block';btn.innerHTML='收起 ▲';}
  else{more.style.display='none';btn.innerHTML='展开全部 ('+total+'条) ▼';}
};

// ── Concert timeline
async function showTimeline(projectId){
  var concerts,p;
  if (projectId===0){var all=await(await fetch(API+'/concerts')).json();concerts=all.filter(function(c){return c.project_id===null});p={name:'系列联合 & 拼盘演出'};}
  else{concerts=await(await fetch(API+'/concerts?project_id='+projectId)).json();p=await(await fetch(API+'/projects/'+projectId)).json();}
  var lc={'1巡':'#66bb6a','2巡':'#42a5f5','3巡':'#ab47bc','4巡':'#ffa726','5巡':'#ef5350','6巡':'#26c6da','7巡':'#7e57c2','Final':'#e53935','Finale':'#e53935','首演':'#ff7043','拼盘':'#ec407a','联合':'#5c6bc0','Fes':'#ff8a65','对手':'#999'};
  var html='<h2 style="color:var(--pink);">'+p.name+' 演唱会时间轴</h2><table style="width:100%;border-collapse:collapse;font-size:0.9em;margin-top:12px;"><tr style="color:#999;font-size:0.85em;"><td style="padding:6px 8px;width:60px;">标签</td><td style="padding:6px 8px;width:100px;">日期</td><td style="padding:6px 8px;">演唱会名称</td></tr>';
  concerts.forEach(function(c){var cl=lc[c.label]||'#999';html+='<tr style="border-top:1px solid #f0e0e8;"><td style="padding:8px;"><span style="padding:3px 10px;border-radius:10px;background:'+cl+';color:#fff;font-size:0.8em;font-weight:700;">'+c.label+'</span></td><td style="padding:8px;">'+(c.concert_date||'').slice(0,10)+'</td><td style="padding:8px;">'+c.name+'</td></tr>';});
  html+='</table><div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
}

// ── Relation graph (从 API 动态加载关系数据)
var relCache = {};
var relColorMap = {'姐妹':'#e91e63','幼驯染':'#ff9800','搭档':'#4caf50','憧憬':'#9c27b0','挚友':'#2196f3','对手':'#f44336','同学':'#607d8b','师徒':'#00bcd4'};
async function loadRels(groupId) {
  if (relCache[groupId]) return relCache[groupId];
  try {
    var r = await fetch(API+'/relationships?group_id='+groupId);
    var rels = await r.json();
    var map = {};
    var order = ['姐妹','幼驯染','搭档','挚友','憧憬','对手','同学','师徒'];
    function pick(a,b){ return order.indexOf(a)<=order.indexOf(b)?a:b; }
    rels.forEach(function(rel){
      var k1 = rel.character_id_1+','+rel.character_id_2;
      var k2 = rel.character_id_2+','+rel.character_id_1;
      if (map[k1]) map[k1] = pick(map[k1], rel.relation_type);
      else map[k1] = rel.relation_type;
      if (map[k2]) map[k2] = pick(map[k2], rel.relation_type);
      else map[k2] = rel.relation_type;
    });
    relCache[groupId] = map;
    return map;
  } catch(e) { return {}; }
}
async function showRelationGraph(charId){
  var c=await(await fetch(API+'/characters/'+charId)).json();
  var group=await(await fetch(API+'/groups/'+c.group_id)).json();
  var members=group.members||[]; if(members.length<2){alert('暂无关系数据');return;}
  var specialRels = await loadRels(c.group_id);
  var nodes=members.map(function(m){return{id:m.character_id,name:m.name,color:m.cheering_color||'#ff6b9d',isCenter:m.character_id===charId};});
  var W=780,H=560,cx=W/2,cy=H/2;
  nodes.forEach(function(n,i){var a=i/nodes.length*2*Math.PI-Math.PI/2;n.x=cx+(n.isCenter?0:220)*Math.cos(a);n.y=cy+(n.isCenter?0:220)*Math.sin(a);n.vx=0;n.vy=0;});
  var html='<canvas id="rel-canvas" width="'+W+'" height="'+H+'" style="background:#fdf6f8;border-radius:16px;cursor:grab;max-width:100%;"></canvas><div style="text-align:right;margin-top:8px;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
  setTimeout(function(){
    var cv=document.getElementById('rel-canvas');if(!cv)return;var ctx=cv.getContext('2d'),drag=null;
    function drawArrow(x1,y1,x2,y2,cl,sz){var a=Math.atan2(y2-y1,x2-x1);var px=x2-26*Math.cos(a),py=y2-26*Math.sin(a);ctx.fillStyle=cl;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-sz*Math.cos(a-0.6),py-sz*Math.sin(a-0.6));ctx.lineTo(px-sz*Math.cos(a+0.6),py-sz*Math.sin(a+0.6));ctx.closePath();ctx.fill();}
    function step(){
      if(!document.getElementById('rel-canvas'))return;
      nodes.forEach(function(a){nodes.forEach(function(b){if(a===b)return;var dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1,rel=specialRels[a.id+','+b.id];if(a.isCenter||b.isCenter){var t=a.isCenter?140:160,f=(d-t)*0.003;a.vx+=dx/d*f;a.vy+=dy/d*f;}else if(d<90){var f2=(90-d)*0.012;a.vx-=dx/d*f2;a.vy-=dy/d*f2;}});if(a.isCenter){a.vx+=(cx-a.x)*0.01;a.vy+=(cy-a.y)*0.01;}a.vx*=0.9;a.vy*=0.9;a.x+=a.vx;a.y+=a.vy;a.x=Math.max(30,Math.min(W-30,a.x));a.y=Math.max(30,Math.min(H-30,a.y));});
      ctx.clearRect(0,0,W,H);
      nodes.forEach(function(a){nodes.forEach(function(b){if(a.id>=b.id)return;var rel=specialRels[a.id+','+b.id];var edgeColor=rel?(relColorMap[rel]||'#e57373'):(a.isCenter||b.isCenter?'#ffc0cb':'#f0e0e8');ctx.strokeStyle=edgeColor;ctx.lineWidth=rel?2.2:(a.isCenter||b.isCenter?1:0.4);ctx.globalAlpha=rel?0.9:(a.isCenter||b.isCenter?0.5:0.2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;if(rel){var arrowColor=relColorMap[rel]||'#e57373';drawArrow(a.x,a.y,b.x,b.y,arrowColor,7);if(rel!=='憧憬'&&rel!=='对手')drawArrow(b.x,b.y,a.x,a.y,arrowColor,7);var mx=(a.x+b.x)/2,my=(a.y+b.y)/2;ctx.fillStyle='rgba(255,255,255,0.88)';ctx.font='bold 11px Microsoft YaHei';var tw=ctx.measureText(rel).width;ctx.fillRect(mx-tw/2-6,my-10,tw+12,20);ctx.fillStyle=arrowColor;ctx.textAlign='center';ctx.fillText(rel,mx,my+4);}});});
      nodes.forEach(function(n){var r=n.isCenter?34:24;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=n.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=n.isCenter?3:2;ctx.stroke();if(n.isCenter){ctx.beginPath();ctx.arc(n.x,n.y,r+5,0,Math.PI*2);ctx.strokeStyle=n.color;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}ctx.fillStyle='#333';ctx.font=(n.isCenter?'bold ':'')+'12px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(n.name,n.x,n.y+r+15);});
      requestAnimationFrame(step);
    }
    cv.onmousedown=function(e){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;for(var i=nodes.length-1;i>=0;i--){var dx=mx-nodes[i].x,dy=my-nodes[i].y;if(dx*dx+dy*dy<30*30){drag=nodes[i];cv.style.cursor='grabbing';return;}}};
    cv.onmousemove=function(e){if(!drag)return;var r=cv.getBoundingClientRect();drag.x=e.clientX-r.left;drag.y=e.clientY-r.top;};
    cv.onmouseup=function(){drag=null;cv.style.cursor='grab';};
    cv.onclick=function(e){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;for(var i=nodes.length-1;i>=0;i--){var dx=mx-nodes[i].x,dy=my-nodes[i].y;if(dx*dx+dy*dy<25*25&&nodes[i].id!==charId){closeModal('modal-char');setTimeout(function(){showCharDetail(nodes[i].id);},300);return;}}};
    requestAnimationFrame(step);
  },200);
}

// ── Rehearsal views
var dgGradients = {1:'#ff8c42,#ffab6e',2:'#42a5f5,#64b5f6',3:'#ab47bc,#ce93d8',4:'#66bb6a,#81c784',5:'#26c6da,#4dd0e1',6:'#e91e63,#f06292',7:'#ef5350,#ff6e6e',8:'#ffa726,#ffb74d',9:'#78909c,#a0aeb8'};
loadRehPage = function(){ loadPerfView(); };
loadPerfView = async function(){
  await loadDGCache();
  var df=document.getElementById('reh-date-from').value;
  var dt=document.getElementById('reh-date-to').value;
  if(!df) df=new Date().toISOString().slice(0,10);
  var url=API+'/rehearsals?reh_status=active&'; if(df)url+='date_from='+df+'&'; if(dt)url+='date_to='+dt+'&';
  var rehs=await(await fetch(url)).json();
  var groups={};
  rehs.forEach(function(r){
    var sn=(r.content_summary||'').replace(/ (初排|复习|队形|合练|带妆|彩排|终排|排练|完整版排练|走位练习|外景排练).*/,'')||'排练';
    var k=r.dance_group_id+'||'+sn;
    if(!groups[k]) groups[k]={dgId:r.dance_group_id,dgName:dgCache[r.dance_group_id]||'?',song:sn,rehs:[]};
    groups[k].rehs.push(r);
  });
  var html='';
  Object.values(groups).forEach(function(g){
    var grad=dgGradients[g.dgId]||'#ff6b9d,#e878a8';
    html+='<div style="margin:20px 0 8px;padding:12px 16px;background:linear-gradient(135deg,'+grad+');border-radius:12px;color:#fff;"><strong style="font-size:1.1em;">曲目: '+g.song+'</strong><span style="margin-left:12px;font-size:0.85em;opacity:0.8;">'+g.dgName+' · '+g.rehs.length+'次</span></div>';
    g.rehs.forEach(function(rh){
      var cancelled=rh.status==='cancelled';
      html+='<div class="rehearsal-item'+(cancelled?' cancelled':'')+'" style="cursor:pointer;margin-left:8px;margin-bottom:4px;border-left-color:'+(cancelled?'#ccc':(dgGradients[g.dgId]||'#ff6b9d').split(',')[0])+';" onclick="showRehearsalDetail('+rh.rehearsal_id+')"><div class="info"><strong>'+(rh.stage_type||'排练')+'</strong> · '+fmtDate(rh.rehearsal_date)+' '+(rh.start_time||'').slice(0,5)+'-'+(rh.end_time||'').slice(0,5)+' @'+rh.location+(cancelled?' <span style="color:#c62828;font-weight:700;">[已取消]</span>':'')+'</div><span class="count '+(cancelled?'cancelled':rh.occupancy_status||'')+'">'+(cancelled?'已取消':rh.current_participants+'/'+rh.max_participants+'人')+'</span></div>';
    });
  });
  document.getElementById('rehearsal-list').innerHTML=html||'<p style="color:#999;">暂无排练</p>';
};

showRehearsalDetail = async function(rehId){await loadDGCache();buildRehModal(rehId);};

async function buildRehModal(rehId){
  var el=document.getElementById('char-detail-content');
  el.innerHTML='<p style="color:#999;">加载中...</p>';
  document.getElementById('modal-char').classList.add('show');
  try{
    var reh=await(await fetch(API+'/rehearsals/'+rehId)).json();
    var parts=reh.participants||[];
    var dgName=dgCache[reh.dance_group_id]||'未知舞团';
    // 获取角色
    var allChars=[];
    try{
      var dg=await(await fetch(API+'/dance-groups/'+reh.dance_group_id)).json();
      dgName=dg.name||dgName;
      if(dg.anime_group_id){
        var group=await(await fetch(API+'/groups/'+dg.anime_group_id)).json();
        allChars=group.members||[];
      }
    }catch(e){}
    // 排除角色
    var excluded=reh.excluded_chars?reh.excluded_chars.split(',').map(Number):[];
    allChars=allChars.filter(function(c){return excluded.indexOf(c.character_id)===-1;});
    if(!allChars.length) allChars=parts.map(function(p){return{character_id:p.character_id,name:p.character_name,cheering_color:'#ccc'};});

    var partMap={};parts.forEach(function(p){partMap[p.character_id]=p;});
    var cards=allChars.map(function(c,idx){
      var p=partMap[c.character_id];
      if(p) return '<div class="reh-part-card filled" data-cid="'+c.character_id+'" style="--card-color:'+(c.cheering_color||'#ccc')+'"><div class="rpc-char" style="color:'+(c.cheering_color||'#666')+';cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();closeModal(\'modal-char\');showCharDetail('+c.character_id+')">'+c.name+'</div><div class="rpc-dancer" style="cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();closeModal(\'modal-char\');showDancerDetail('+p.dancer_id+')">'+p.cn_name+'</div><div class="reh-card-btns"><button onclick="event.stopPropagation();doRehAction(\'editDancer\','+rehId+','+c.character_id+','+p.participation_id+')" title="修改">✎</button><button onclick="event.stopPropagation();doRehAction(\'delDancer\','+rehId+','+c.character_id+','+p.participation_id+')" title="删除">×</button></div></div>';
      return '<div class="reh-part-card missing" data-cid="'+c.character_id+'"><div class="rpc-char" style="cursor:pointer;text-decoration:underline" onclick="event.stopPropagation();closeModal(\'modal-char\');showCharDetail('+c.character_id+')">'+c.name+'</div><div class="rpc-status">空缺</div><button class="add-btn" onclick="event.stopPropagation();doRehAction(\'addDancer\','+rehId+','+c.character_id+',0)">+ 指派</button></div>';
    }).join('');

    var cancelled=reh.status==='cancelled';
    el.innerHTML='<div style="padding:12px 16px;background:linear-gradient(135deg,'+(cancelled?'#999,#b0b0b0':'#ff6b9d,#e878a8')+');border-radius:12px;color:#fff;margin-bottom:14px;"><strong>'+dgName+'</strong> '+fmtDate(reh.rehearsal_date)+(cancelled?' <span style="font-weight:700;">[已取消]</span>':'')+'<br><span style="font-size:0.8em;opacity:0.8;">'+(reh.content_summary||'')+' · '+(reh.start_time||'').slice(0,5)+'-'+(reh.end_time||'').slice(0,5)+' @'+(reh.location||'?')+'</span></div>'+
      '<div class="reh-parts-grid">'+cards+'</div>'+
      '<div style="margin-top:4px;font-size:0.8em;">已填 <strong>'+parts.length+'</strong>/'+allChars.length+' 人</div>'+
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">'+
        (cancelled
          ?'<button class="btn btn-sm" style="background:#66bb6a;color:#fff;" onclick="toggleRehStatus('+rehId+',\'active\')">恢复排练</button>'
          :'<button class="btn btn-sm btn-danger" onclick="toggleRehStatus('+rehId+',\'cancelled\')">取消排练</button>'
        )+
        '<button class="btn btn-sm" style="background:#e53935;color:#fff;" onclick="deleteRehearsal('+rehId+')">删除排练</button>'+
        '<button class="btn btn-sm" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  }catch(e){el.innerHTML='<p style="color:#e53935;">加载失败: '+e.message+'</p>';}
}

toggleRehStatus=async function(rehId,newStatus){
  var label=newStatus==='cancelled'?'取消':'恢复';
  if(!confirm('确定'+label+'此排练？'))return;
  var res=await fetch(API+'/rehearsals/'+rehId+'/status',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});
  if(!res.ok){alert('操作失败');return;}
  buildRehModal(rehId);
  try{loadPerfView();}catch(e){}
  try{loadHome();}catch(e){}
};

// 真正删除排练（级联清除参与记录）
deleteRehearsal=async function(rehId){
  if(!confirm('确定永久删除此排练？\n\n⚠ 这将同时删除所有参与记录，且不可恢复。\n如果只想标记为取消，请使用"取消排练"按钮。'))return;
  var res=await fetch(API+'/rehearsals/'+rehId,{method:'DELETE'});
  if(!res.ok){alert('删除失败');return;}
  closeModal('modal-char');
  try{loadPerfView();}catch(e){}
  try{loadHome();}catch(e){}
};

// ── 指派舞见弹窗（搜索 + 新建）
showAssignPopup=async function(rehId, charId, oldPid){
  var isEdit = (typeof oldPid !== 'undefined' && oldPid > 0);
  // 获取舞团ID用于推荐
  var rehDgId=null;
  try{var reh=await(await fetch(API+'/rehearsals/'+rehId)).json();rehDgId=reh.dance_group_id;}catch(e){}
  var html='<h3>'+(isEdit?'修改舞见':'指派舞见')+'</h3>';
  // 加载推荐
  var recs=[];
  if(rehDgId){
    try{
      var rr=await fetch(API+'/dancers/recommend?dance_group_id='+rehDgId+'&character_id='+charId);
      recs=await rr.json();
    }catch(e){}
  }
  if(recs.in_group&&recs.in_group.length){
    html+='<div style=\"margin-bottom:8px;\"><span style=\"font-size:0.8em;color:#999;\">📌 本团推荐</span></div>';
    html+='<div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;\">';
    recs.in_group.forEach(function(d){
      html+='<div class=\"card\" style=\"width:100px;padding:8px;text-align:center;cursor:pointer;border:2px solid #66bb6a;background:#e8f5e9;\" onclick=\"selectRehAssignDancer('+rehId+','+d.dancer_id+','+charId+','+rehDgId+','+(oldPid||0)+')\"><strong style=\"font-size:0.8em;\">'+d.cn_name+'</strong><br><small style=\"color:#999;\">'+d.play_count+'次</small></div>';
    });
    html+='</div>';
  }
  if(recs.other_group&&recs.other_group.length){
    html+='<div style=\"margin-bottom:8px;\"><span style=\"font-size:0.8em;color:#999;\">🔗 别团演过此角色</span></div>';
    html+='<div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;\">';
    recs.other_group.forEach(function(d){
      html+='<div class=\"card\" style=\"width:100px;padding:8px;text-align:center;cursor:pointer;border:2px solid #ff9800;background:#fff8e1;\" onclick=\"selectRehAssignDancer('+rehId+','+d.dancer_id+','+charId+','+rehDgId+','+(oldPid||0)+')\"><strong style=\"font-size:0.8em;\">'+d.cn_name+'</strong><br><small style=\"color:#999;\">'+(d.dance_group_name||'')+' · '+d.play_count+'次</small></div>';
    });
    html+='</div>';
  }
  html+='<input type="text" id="assign-search" placeholder="搜索舞见CN..." style="width:100%;padding:10px;border-radius:8px;border:2px solid #eee;margin-bottom:8px;" oninput="searchDancers('+rehId+','+charId+','+(oldPid||0)+')">';
  html+='<div id="assign-results" style="max-height:200px;overflow-y:auto;"></div>';
  html+='<div id="assign-new-form" style="display:none;margin-top:10px;padding:10px;background:#fdf6f8;border-radius:8px;">';
  html+='<p style="font-size:0.85em;color:#999;">未找到，新建舞见：</p>';
  html+='<input type="text" id="assign-new-cn" placeholder="CN名（必填）" style="width:100%;padding:8px;border-radius:8px;border:2px solid #eee;margin-bottom:6px;">';
  html+='<input type="text" id="assign-new-qq" placeholder="QQ号（必填）" style="width:100%;padding:8px;border-radius:8px;border:2px solid #eee;margin-bottom:6px;">';
  html+='<button class="btn btn-primary btn-sm" onclick="createAndAssign('+rehId+','+charId+')">新建并指派</button></div>';
  html+='<div style="margin-top:10px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-sub\')">取消</button></div>';
  document.getElementById('modal-sub-content').innerHTML=html;
  document.getElementById('modal-sub').classList.add('show');
  setTimeout(function(){var inp=document.getElementById('assign-search');if(inp)inp.focus();},100);
};

searchDancers=async function(rehId, charId, oldPid){
  var q=document.getElementById('assign-search').value.trim();
  var results=document.getElementById('assign-results');
  var newForm=document.getElementById('assign-new-form');
  if(!q){results.innerHTML='';newForm.style.display='none';return;}
  var dancers=await(await fetch(API+'/dancers/search?q='+encodeURIComponent(q))).json();
  if(!dancers.length){results.innerHTML='<p style="color:#999;font-size:0.85em;">未找到匹配舞见</p>';newForm.style.display='block';return;}
  newForm.style.display='block';
  results.innerHTML=dancers.map(function(d){
    return'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="selectDancerAssign('+rehId+','+charId+','+d.dancer_id+',\''+(d.cn_name||'').replace(/'/g,'')+'\','+(oldPid||0)+')"><div><strong>'+d.cn_name+'</strong><br><small style="color:#999;">'+d.qq+' · '+(d.dance_group_name||'')+'</small></div><span class="tag" style="font-size:0.7em;">选择</span></div>';
  }).join('');
};

// 推荐舞见快速指派（排练详情弹窗用，支持编辑模式替换）
selectRehAssignDancer=async function(rehId, dancerId, charId, dgId, oldPid){
  var reh=await(await fetch(API+'/rehearsals/'+rehId)).json();
  // 检查舞见当前是否已在其他舞团
  var dancers=await(await fetch(API+'/dancers')).json();
  var dd=dancers.find(function(x){return x.dancer_id===dancerId;});
  if(!dd)return;
  var currentlyInGroup=(dd.dance_group_id===reh.dance_group_id);
  if(!currentlyInGroup){
    if(!confirm('⚠ '+dd.cn_name+' 不在当前舞团中。\n\n将她拉入本舞团并指派？'))return;
    await fetch(API+'/dancers/'+dancerId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({dance_group_id:reh.dance_group_id})});
  }
  // 编辑模式：先删除旧参与记录
  if(oldPid&&oldPid>0){await fetch(API+'/rehearsals/'+rehId+'/participants/'+oldPid,{method:'DELETE'});}
  var r=await fetch(API+'/rehearsals/'+rehId+'/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dancer_id:dancerId,character_id:charId})});
  if(!r.ok){var e=await r.json();alert(e.error||'指派失败');return;}
  closeModal('modal-sub');
  buildRehModal(rehId);try{loadPerfView();}catch(e){}
};
selectDancerAssign=async function(rehId, charId, dancerId, cn, oldPid){
  if(!confirm('选择舞见 '+cn+'？'))return;
  // 编辑模式：先删旧的
  if(oldPid>0){await fetch(API+'/rehearsals/'+rehId+'/participants/'+oldPid,{method:'DELETE'});}
  var r=await fetch(API+'/rehearsals/'+rehId+'/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dancer_id:dancerId,character_id:charId})});
  if(!r.ok){var e=await r.json();alert(e.error||'指派失败');return;}
  closeModal('modal-sub');
  buildRehModal(rehId);try{loadPerfView();}catch(e){}
};

createAndAssign=async function(rehId, charId){
  var cn=document.getElementById('assign-new-cn').value.trim();
  var qq=document.getElementById('assign-new-qq').value.trim();
  if(!cn||!qq){alert('CN和QQ均为必填');return;}
	if(!/^\d+$/.test(qq)){alert('QQ号码必须是数字');return;}
  var r=await fetch(API+'/rehearsals/'+rehId+'/participants/simple',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character_id:charId,cn_name:cn,qq:qq})});
  if(!r.ok){alert('指派失败');return;}
  closeModal('modal-sub');
  buildRehModal(rehId);try{loadPerfView();}catch(e){}
};

// 统一操作：addDancer / delDancer
doRehAction=async function(action,rehId,cid,pid){
  if(action==='editDancer'){
    showAssignPopup(rehId, cid, pid); return;
  }else if(action==='addDancer'){
    showAssignPopup(rehId, cid); return;
  }else if(action==='delDancer'){
    if(!confirm('确定删除此舞见？'))return;
    await fetch(API+'/rehearsals/'+rehId+'/participants/'+pid,{method:'DELETE'});
  }
  buildRehModal(rehId);try{loadPerfView();}catch(e){}
};

// ↓ 添加角色弹窗（推荐+搜索）
openAddCharPopup=async function(rehId){
  var rr=await fetch(API+'/rehearsals/'+rehId);var reh=await rr.json();
  var excluded=reh.excluded_chars?reh.excluded_chars.split(',').map(Number):[];
  var dgr=await fetch(API+'/dance-groups/'+reh.dance_group_id);var dg=await dgr.json();
  var allCr=await fetch(API+'/characters');var allChars=await allCr.json();
  var recommended=allChars.filter(function(c){return c.group_id===dg.anime_group_id&&excluded.indexOf(c.character_id)>=0;});
  var others=allChars.filter(function(c){return excluded.indexOf(c.character_id)===-1&&c.group_id!==dg.anime_group_id;});

  var html='<h3>添加角色卡片</h3>';
  if(recommended.length){
    html+='<p style="font-size:0.85em;color:#999;">推荐（同团已排除）：</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
    recommended.forEach(function(c){html+='<div class="card" style="width:90px;padding:8px;text-align:center;cursor:pointer;" onclick="closeModal(\'modal-sub\');fetch(API+\'/rehearsals/'+rehId+'/chars\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({character_id:'+c.character_id+'})}).then(function(){buildRehModal('+rehId+');loadPerfView();})"><h3 style="font-size:0.8em;">'+c.name+'</h3><span class="tag blue">'+(c.group_name||'')+'</span></div>';});
    html+='</div>';
  }
  html+='<input type="text" id="char-search-box" placeholder="搜索其他角色..." style="width:100%;padding:8px;border-radius:20px;border:2px solid #eee;margin-bottom:8px;" oninput="var q=(this.value||\'\').toLowerCase();document.querySelectorAll(\'.char-search-item\').forEach(function(e){e.style.display=e.dataset.name.toLowerCase().includes(q)?\'\':\'none\'})">';
  html+='<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:200px;overflow-y:auto;" id="char-search-results">';
  others.forEach(function(c){html+='<div class="char-search-item card" style="width:90px;padding:8px;text-align:center;cursor:pointer;" data-name="'+c.name+'" onclick="closeModal(\'modal-sub\');fetch(API+\'/rehearsals/'+rehId+'/chars\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({character_id:'+c.character_id+'})}).then(function(){buildRehModal('+rehId+');loadPerfView();})"><h3 style="font-size:0.8em;">'+c.name+'</h3><span class="tag blue">'+(c.group_name||'')+'</span></div>';});
  html+='</div><div style="margin-top:12px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-sub\')">关闭</button></div>';
  document.getElementById('modal-sub-content').innerHTML=html;
  document.getElementById('modal-sub').classList.add('show');
};

editDancerInDetail=function(rehId,charId,cn,partId){var ncn=prompt('修改CN（留空删除）：',cn);if(ncn===null)return;if(ncn===''){if(confirm('删除？')){fetch(API+'/rehearsals/'+rehId+'/participants/'+partId,{method:'DELETE'}).then(function(){buildRehModal(rehId);loadPerfView();});}}else if(ncn!==cn){fetch(API+'/rehearsals/'+rehId+'/participants/'+partId,{method:'DELETE'}).then(function(){assignByName(rehId,charId,ncn);});}};
assignDancerInDetail=function(rehId,charId){var cn=prompt('指派舞见CN：');if(!cn)return;assignByName(rehId,charId,cn);};
assignByName=async function(rehId,charId,cn){
  var reh=await(await fetch(API+'/rehearsals/'+rehId)).json();var dgId=reh.dance_group_id;
  var dancerId;var dancers=await(await fetch(API+'/dancers?dance_group_id='+dgId)).json();
  var df=dancers.find(function(d){return d.cn_name===cn;});
  if(df)dancerId=df.dancer_id;
  else{var cd=await fetch(API+'/dancers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dance_group_id:dgId,cn_name:cn})});dancerId=(await cd.json()).dancer_id;}
  var pr=await fetch(API+'/rehearsals/'+rehId+'/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dancer_id:dancerId,character_id:charId})});
  if(!pr.ok){var e=await pr.json();alert(e.error);}else{buildRehModal(rehId);loadPerfView();}
};
toggleSlotEdit=function(rehId){
  var grid=document.getElementById('reh-detail-grid');if(!grid)return;
  var editing=!grid.classList.contains('editing');
  if(editing){grid.classList.add('editing');}else{grid.classList.remove('editing');}
  grid.querySelectorAll('.reh-part-card').forEach(function(card){
    if(editing){card.classList.add('shaking');}else{card.classList.remove('shaking');}
    // 编辑模式下给每个卡片加删除小按钮
    var cid=card.getAttribute('data-cid');
    if(editing&&cid){
      var btn=document.createElement('span');btn.textContent='×';btn.className='del-btn';
      btn.style.cssText='position:absolute;top:2px;right:4px;color:#ef5350;font-weight:700;font-size:14px;cursor:pointer;z-index:5;';
      btn.onclick=function(e){e.stopPropagation();deleteCharSlot(rehId,parseInt(cid));};
      if(!card.querySelector('.del-btn')) card.appendChild(btn);
    }else{
      var db=card.querySelector('.del-btn');if(db)db.remove();
    }
  });
  if(editing) showExcludedPicker(rehId); else {var pk=document.getElementById('excluded-picker-'+rehId);if(pk)pk.remove();}
};

deleteCharSlot=function(rehId,cid){
  fetch(API+'/rehearsals/'+rehId+'/chars/'+cid,{method:'DELETE'}).then(function(r){
    if(!r.ok){alert('删除失败 HTTP '+r.status);return;}
    try{buildRehModal(rehId);}catch(e){console.error(e);}
    try{loadPerfView();}catch(e){console.error(e);}
  }).catch(function(e){alert('网络错误:'+e.message);});
};

rehCardClick=function(card){
  var cid=parseInt(card.getAttribute('data-cid'));
  var rehId=parseInt(card.getAttribute('data-reh'));
  var grid=document.getElementById('reh-detail-grid');
  if(grid&&grid.classList.contains('editing')){
    fetch(API+'/rehearsals/'+rehId+'/chars/'+cid,{method:'DELETE'}).then(function(r){
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(){
      try{buildRehModal(rehId);}catch(e){}
      try{loadPerfView();}catch(e){}
    }).catch(function(e){alert('删除出错:'+e.message);});
  }else{
    if(card.classList.contains('missing')){assignDancerInDetail(rehId,cid);}
    else{var cn=card.getAttribute('data-cn')||'';var pid=parseInt(card.getAttribute('data-pid'))||0;editDancerInDetail(rehId,cid,cn,pid);}
  }
};

// ── 已移除角色 & 添加角色
showExcludedPicker=async function(rehId){
  var op=document.getElementById('excluded-picker-'+rehId);if(op)op.remove();
  var rr=await fetch(API+'/rehearsals/'+rehId);var reh=await rr.json();
  if(!reh.excluded_chars)return;
  var excluded=reh.excluded_chars.split(',').map(Number);if(!excluded.length)return;
  var cr=await fetch(API+'/characters');var all=await cr.json();
  var list=all.filter(function(c){return excluded.indexOf(c.character_id)>=0;});
  var el=document.getElementById('reh-detail-grid').parentElement;
  var pk=document.createElement('div');pk.id='excluded-picker-'+rehId;
  pk.style.cssText='margin-top:8px;padding:8px;background:#fff5f5;border-radius:8px;font-size:0.8em;';
  pk.innerHTML='<span style="color:#999;">已移除：</span> '+list.map(function(c){return'<span class="tag" style="cursor:pointer;background:#fce4ec;color:#c62828;margin:2px;" onclick="reAddChar('+rehId+','+c.character_id+')" title="点击加回">'+c.name+' ↗</span>';}).join(' ');
  el.appendChild(pk);
};
reAddChar=function(rehId,charId){fetch(API+'/rehearsals/'+rehId+'/chars',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character_id:charId})}).then(function(){buildRehModal(rehId);});};
addNewCharSlot=function(rehId,charId){fetch(API+'/rehearsals/'+rehId+'/slots/'+charId,{method:'POST'}).then(function(){buildRehModal(rehId);});};

openAddCharPopup=async function(rehId){
  var rr=await fetch(API+'/rehearsals/'+rehId);var reh=await rr.json();
  var excluded=reh.excluded_chars?reh.excluded_chars.split(',').map(Number):[];
  var dgr=await fetch(API+'/dance-groups/'+reh.dance_group_id);var dg=await dgr.json();
  var allCr=await fetch(API+'/characters');var allChars=await allCr.json();
  var recommended=allChars.filter(function(c){return c.group_id===dg.anime_group_id&&excluded.indexOf(c.character_id)>=0;});
  var others=allChars.filter(function(c){return excluded.indexOf(c.character_id)===-1&&c.group_id!==dg.anime_group_id;});

  var html='<h3>添加角色卡片</h3>';
  if(recommended.length){
    html+='<p style="font-size:0.85em;color:#999;">推荐（同团已排除角色）：</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
    recommended.forEach(function(c){html+='<div class="card" style="width:90px;padding:8px;text-align:center;cursor:pointer;" onclick="reAddChar('+rehId+','+c.character_id+');closeModal(\'modal-sub\');buildRehModal('+rehId+')"><h3 style="font-size:0.8em;">'+c.name+'</h3><span class="tag blue">'+(c.group_name||'')+'</span></div>';});
    html+='</div>';
  }
  html+='<input type="text" id="char-search-box" placeholder="搜索其他团角色..." style="width:100%;padding:8px;border-radius:20px;border:2px solid #eee;margin-bottom:8px;" oninput="filterCharSearch()">';
  html+='<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:200px;overflow-y:auto;" id="char-search-results">';
  others.forEach(function(c){html+='<div class="char-search-item card" style="width:90px;padding:8px;text-align:center;cursor:pointer;" data-name="'+c.name+'" onclick="addNewCharSlot('+rehId+','+c.character_id+');closeModal(\'modal-sub\');buildRehModal('+rehId+')"><h3 style="font-size:0.8em;">'+c.name+'</h3><span class="tag blue">'+(c.group_name||'')+'</span></div>';});
  html+='</div><div style="margin-top:12px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-sub\')">关闭</button></div>';
  document.getElementById('modal-sub-content').innerHTML=html;
  document.getElementById('modal-sub').classList.add('show');
};
filterCharSearch=function(){var q=(document.getElementById('char-search-box').value||'').toLowerCase();document.querySelectorAll('.char-search-item').forEach(function(el){el.style.display=el.dataset.name.toLowerCase().includes(q)?'':'none';});};

// ── Calendar
var homeSelectedDate=null;
renderCalendar=async function(){renderCal('reh-calendar');};
renderHomeCalendar=async function(){renderCal('home-calendar');if(homeSelectedDate)showHomeDateRehearsals(homeSelectedDate);};
async function renderCal(calId){
  var cal=document.getElementById(calId);if(!cal)return;
  var isHome=calId==='home-calendar';
  var now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var days=new Date(y,m+1,0).getDate(),first=new Date(y,m,1).getDay(),today=now.toISOString().slice(0,10);
  var ms=y+'-'+String(m+1).padStart(2,'0')+'-01',me=y+'-'+String(m+1).padStart(2,'0')+'-'+String(days).padStart(2,'0');
  var rehs=await(await fetch(API+'/rehearsals?reh_status=active&date_from='+ms+'&date_to='+me)).json();
  var rd={},dgCol={1:'#ff8c42',2:'#42a5f5',3:'#ab47bc',4:'#66bb6a',7:'#ef5350',8:'#ffa726',9:'#78909c'};
  rehs.forEach(function(r){var d=r.rehearsal_date.slice(0,10);if(!rd[d])rd[d]=[];rd[d].push(r.dance_group_id);});
  var hd=['日','一','二','三','四','五','六'].map(function(h){return'<div class="cal-hd">'+h+'</div>';}).join('');
  var html=hd;for(var i=0;i<first;i++)html+='<div class="cal-day other"></div>';
  var clickFn=isHome?'showHomeDateRehearsals':'jumpToDate';
  for(var d=1;d<=days;d++){
    var ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),cls='cal-day';
    if(ds===today)cls+=' today';if(rd[ds])cls+=' has-reh';if(isHome&&ds===homeSelectedDate)cls+=' selected';
    var dots=(rd[ds]||[]).map(function(id){return'<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:'+(dgCol[id]||'#ccc')+';margin:0 1px;"></span>';}).join('');
    html+='<div class="'+cls+'" data-date="'+ds+'" onclick="'+clickFn+'(\''+ds+'\')">'+d+(dots?'<br>'+dots:'')+'</div>';
  }
  cal.innerHTML=html;
}
showHomeDateRehearsals=async function(ds){
  homeSelectedDate=ds;
  document.querySelectorAll('#home-calendar .cal-day').forEach(function(el){el.classList.toggle('selected',el.getAttribute('data-date')===ds);});
  await loadDGCache();
  var rehs=await(await fetch(API+'/rehearsals?reh_status=active&date_from='+ds+'&date_to='+ds)).json();
  var el=document.getElementById('home-date-rehearsals');
  if(!rehs.length){el.innerHTML='<p style="color:#999;text-align:center;padding:14px;background:#fff;border-radius:12px;margin-bottom:8px;">📅 '+ds+' — 暂无排练</p>';return;}
  el.innerHTML='<h3 style="color:var(--pink);margin-bottom:10px;display:flex;align-items:center;gap:6px;">📅 '+ds+'<span style="font-weight:400;font-size:0.7em;color:#999;">（'+rehs.length+' 场排练）</span></h3>'+rehs.map(function(r){var cancelled=r.status==='cancelled';return'<div class="rehearsal-item'+(cancelled?' cancelled':'')+'" style="cursor:pointer;" onclick="showRehearsalDetail('+r.rehearsal_id+')"><div class="info"><strong>'+(dgCache[r.dance_group_id]||'?')+'</strong> · '+(r.start_time||'').slice(0,5)+'-'+(r.end_time||'').slice(0,5)+' @'+r.location+(cancelled?' <span style="color:#c62828;font-weight:700;">[已取消]</span>':'')+'<br><small>'+(r.content_summary||'')+'</small></div><span class="count '+(cancelled?'cancelled':r.occupancy_status)+'">'+(cancelled?'已取消':r.current_participants+'人')+'</span></div>';}).join('');
};
jumpToDate=function(ds){
  var df=document.getElementById('reh-date-from');
  if(df){df.value=ds;document.getElementById('reh-date-to').value=ds;loadPerfView();}
  else{showPage('rehearsal');setTimeout(function(){document.getElementById('reh-date-from').value=ds;document.getElementById('reh-date-to').value=ds;loadPerfView();},200);}
};

// ── DG / Dancer management
loadDgMgmt=async function(){
  var dgs=await(await fetch(API+'/dance-groups')).json();var dgList=document.getElementById('dg-mgmt-list');if(!dgList)return;
  var groups=await(await fetch(API+'/groups')).json();
  // 填充新建表单的翻跳团体下拉
  var ngSel=document.getElementById('dg-new-anime-group');
  if(ngSel){
    ngSel.innerHTML='<option value="">请选择翻跳团体</option>'+groups.map(function(g){return'<option value="'+g.group_id+'">'+g.name+'</option>';}).join('');
  }
  dgList.innerHTML=dgs.map(function(d){var logo=groupLogo[d.anime_group_id]||'';return'<div class="card" style="display:flex;align-items:center;gap:12px;padding:16px;cursor:pointer;position:relative;" onclick="showDgDetail('+d.dance_group_id+')">'+(logo?'<div style="width:50px;height:50px;border-radius:10px;background-image:url('+logo+');background-size:contain;background-repeat:no-repeat;background-position:center;opacity:0.3;"></div>':'')+'<div style="flex:1;"><strong>'+d.name+'</strong>'+(d.anime_group_name?'<br><small style="color:#999;">翻跳：'+d.anime_group_name+'</small>':'')+'</div><button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:10px;padding:2px 10px;font-size:0.7em;z-index:2;" onclick="event.stopPropagation();deleteDanceGroup('+d.dance_group_id+',\''+(d.name||'').replace(/'/g,'\\\'')+'\')">解散</button></div>';}).join('');
  var sel=document.getElementById('dancer-dg-filter');if(sel)sel.innerHTML='<option value="">全部舞团</option>'+dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+'</option>';}).join('');
};

showDgDetail=async function(dgId){
  var dg=await(await fetch(API+'/dance-groups/'+dgId)).json();var logo=groupLogo[dg.anime_group_id]||'';
  var html='<div style="padding:12px 16px;background:linear-gradient(135deg,#ff6b9d,#e878a8);border-radius:12px;color:#fff;margin-bottom:14px;"><strong>'+dg.name+'</strong><br><span style="font-size:0.8em;opacity:0.8;">'+(dg.anime_group_name||'综合舞团')+' · '+(dg.created_date||'?')+'</span></div>';
  if(dg.dancers&&dg.dancers.length){html+='<h4>舞见('+dg.dancers.length+'人)</h4><div style="display:flex;flex-wrap:wrap;gap:6px;">';dg.dancers.forEach(function(dr){html+='<span class="tag" style="cursor:pointer;" onclick="showDancerDetail('+dr.dancer_id+')">'+dr.cn_name+'</span>';});html+='</div>';}
  if(dg.rehearsals&&dg.rehearsals.length){html+='<h4 style="margin-top:16px;color:var(--pink);">排练曲目</h4>';
    var sg={};dg.rehearsals.forEach(function(rh){var sn=(rh.content_summary||'').replace(/ (初排|复习|队形|合练|带妆|彩排|终排|排练|完整版排练|走位练习|外景排练).*/,'')||'排练';if(!sg[sn])sg[sn]=[];sg[sn].push(rh);});
    Object.entries(sg).forEach(function(e){html+='<div style="margin:12px 0 4px;padding:8px 12px;background:linear-gradient(135deg,#ff6b9d,#e878a8);border-radius:10px;color:#fff;font-size:0.9em;"><strong>曲目: '+e[0]+'</strong><span style="margin-left:8px;opacity:0.7;">'+e[1].length+'次</span></div>';e[1].forEach(function(rh){var cancelled=rh.status==='cancelled';html+='<div class="rehearsal-item'+(cancelled?' cancelled':'')+'" style="cursor:pointer;margin-left:8px;margin-bottom:3px;border-left-color:'+(cancelled?'#ccc':'#ff6b9d')+';" onclick="closeModal(\'modal-char\');showRehearsalDetail('+rh.rehearsal_id+')"><div class="info"><strong>'+(rh.stage_type||'排练')+'</strong> · '+fmtDate(rh.rehearsal_date)+(cancelled?' <span style="color:#c62828;">[已取消]</span>':'')+' @'+rh.location+'</div><span class="count '+(cancelled?'cancelled':rh.occupancy_status||'')+'">'+(cancelled?'已取消':rh.current_participants+'人')+'</span></div>';});});
  }
  html+='<div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
};

showDancerDetail=async function(dancerId){
  var dancers=await(await fetch(API+'/dancers')).json();var d=dancers.find(function(x){return x.dancer_id===dancerId;});if(!d)return;await loadDGCache();
  var stats=[];try{var sr=await fetch(API+'/dancers/'+dancerId+'/stats');stats=await sr.json();}catch(e){}
  // 展示所有所属舞团（多团支持）
  var groups = d.groups || [];
  if (!groups.length && d.dance_group_id) groups = [{dance_group_id: d.dance_group_id, dance_group_name: dgCache[d.dance_group_id]||''}];
  var dgHtml = groups.length
    ? groups.map(function(g){return '<span class="tag" style="cursor:pointer;background:#e8f5e9;color:#2e7d32;margin:2px;" onclick="closeModal(\'modal-char\');showDgDetail('+g.dance_group_id+')">'+g.dance_group_name+'</span>';}).join(' ')
    : '<span style="color:#999;">未加入舞团</span>';
  var rolesHtml='';if(stats.length){rolesHtml='<h4 style="margin-top:12px;color:var(--pink);">出演角色统计</h4><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">';stats.forEach(function(s){rolesHtml+='<div class="card" style="width:100px;padding:10px;text-align:center;cursor:pointer;border-top:3px solid '+(s.cheering_color||'#ccc')+';" onclick="closeModal(\'modal-char\');showCharDetail('+s.character_id+')"><strong style="font-size:0.85em;color:'+(s.cheering_color||'#666')+'">'+s.character_name+'</strong><br><small>'+s.play_count+'次</small></div>';});rolesHtml+='</div>';}
  // 获取该舞见的所有排练
  var rehs=[];try{var rr=await fetch(API+'/dancers/'+dancerId+'/rehearsals');rehs=await rr.json();}catch(e){}
  var rehsHtml='';
  if(rehs.length){
    rehsHtml='<h4 style="margin-top:16px;color:var(--pink);">所有排练 ('+rehs.length+'次)</h4><div style="max-height:300px;overflow-y:auto;margin-top:6px;">';
    rehs.forEach(function(rh){
      var cancelled=rh.status==='cancelled';
      var charDot=rh.cheering_color?'<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+rh.cheering_color+';margin-right:4px;vertical-align:middle;"></span>':'';
      rehsHtml+='<div class="rehearsal-item'+(cancelled?' cancelled':'')+'" style="cursor:pointer;margin-bottom:4px;" onclick="closeModal(\'modal-char\');showRehearsalDetail('+rh.rehearsal_id+')"><div class="info"><strong>'+charDot+rh.character_name+'</strong> · '+rh.dance_group_name+'<br>'+fmtDate(rh.rehearsal_date)+' '+(rh.start_time||'').slice(0,5)+'-'+(rh.end_time||'').slice(0,5)+' @'+rh.location+(cancelled?' <span style=\"color:#c62828;font-weight:700;\">[已取消]</span>':'')+'<br><small>'+(rh.content_summary||'')+'</small></div><span class="count '+(cancelled?'cancelled':'')+'">'+(cancelled?'已取消':'查看')+'</span></div>';
    });
    rehsHtml+='</div>';
  }
  var html='<div style="display:flex;gap:16px;align-items:flex-start;"><div style="width:60px;height:60px;border-radius:50%;background:var(--pink-light);display:flex;align-items:center;justify-content:center;font-size:1.5em;color:var(--pink);font-weight:700;">'+(d.cn_name||'?')[0]+'</div><div style="flex:1;"><h2 style="color:var(--pink);margin-bottom:2px;">'+(d.cn_name||'?')+'</h2><table style="font-size:0.85em;"><tr><td style="color:#999;width:60px;vertical-align:top;">所属舞团</td><td>'+dgHtml+' <button class="btn btn-sm" style="padding:1px 8px;font-size:0.7em;vertical-align:middle;" onclick="closeModal(\'modal-char\');openEditDancer('+d.dancer_id+')">修改</button></td></tr>'+(d.qq?'<tr><td style="color:#999;">QQ</td><td>'+d.qq+'</td></tr>':'')+'</table></div></div>'+rolesHtml+rehsHtml+'<div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
};

var selectedBiasChars = [];

// 构建角色偏见卡片选择器（按动漫团分组）
buildCharBiasCards=async function(){
  var panel = document.getElementById('dancer-char-cards');
  if(!panel)return;
  if(panel.children.length>0)return; // 已构建，不重复
  var chars=await(await fetch(API+'/characters')).json();
  var groups=await(await fetch(API+'/groups')).json();
  // 按动漫团分组
  var byGroup = {};
  chars.forEach(function(c){
    var gid = c.group_id;
    if(!byGroup[gid]) byGroup[gid] = {name: c.group_name, chars:[]};
    byGroup[gid].chars.push(c);
  });
  var html = '';
  Object.keys(byGroup).forEach(function(gid){
    var g = byGroup[gid];
    var logo = groupLogo[gid]||'';
    html += '<div style="margin-bottom:10px;">';
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
    if(logo) html += '<div style="width:22px;height:22px;border-radius:4px;background-image:url('+logo+');background-size:contain;background-repeat:no-repeat;background-position:center;opacity:0.6;"></div>';
    html += '<span style="font-size:0.8em;color:#999;font-weight:700;">'+g.name+'</span>';html += '<span style="font-size:0.7em;color:var(--pink-light);cursor:pointer;margin-left:4px;" onclick="event.stopPropagation();selectBiasGroup(\''+gid+'\')">全选</span>';html += '</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    g.chars.forEach(function(c){
      var color = c.cheering_color || '#ccc';
      html += '<div class="char-bias-card" data-char-name="'+c.name+'" data-char-color="'+color.replace(/'/g,'')+'" data-char-gid="'+gid+'" style="padding:3px 8px;border-radius:12px;border:2px solid '+color.replace(/'/g,'')+'33;background:'+color.replace(/'/g,'')+'10;font-size:0.75em;cursor:pointer;white-space:nowrap;transition:all 0.15s;" onclick="toggleBiasChar(this)">'+c.name+'</div>';
    });
    html += '</div></div>';
  });
  panel.innerHTML = html;
};

// 切换角色偏见卡片选中状态（多选）
function toggleBiasChar(el) {
  var charName = el.dataset.charName;
  var color = el.dataset.charColor;
  var idx = selectedBiasChars.indexOf(charName);
  if(idx >= 0) {
    // 取消选中
    el.classList.remove('active');
    el.style.background = color+'10';
    el.style.borderColor = color+'33';
    el.style.fontWeight = 'normal';
    selectedBiasChars.splice(idx, 1);
  } else {
    // 选中
    el.classList.add('active');
    el.style.background = color+'44';
    el.style.borderColor = color;
    el.style.fontWeight = '700';
    selectedBiasChars.push(charName);
  }
  updateBiasFilter();
}

// 全选/全不选某个团的所有角色
function selectBiasGroup(gid) {
  var cards = document.querySelectorAll('.char-bias-card[data-char-gid="'+gid+'"]');
  var allActive = true;
  cards.forEach(function(c){if(!c.classList.contains('active'))allActive=false;});
  cards.forEach(function(c){
    var charName = c.dataset.charName;
    var color = c.dataset.charColor;
    var idx = selectedBiasChars.indexOf(charName);
    if(allActive){
      c.classList.remove('active');
      c.style.background = color+'10';
      c.style.borderColor = color+'33';
      c.style.fontWeight = 'normal';
      if(idx>=0)selectedBiasChars.splice(idx,1);
    } else {
      if(idx<0){
        c.classList.add('active');
        c.style.background = color+'44';
        c.style.borderColor = color;
        c.style.fontWeight = '700';
        selectedBiasChars.push(charName);
      }
    }
  });
  updateBiasFilter();
}

function updateBiasFilter() {
  document.getElementById('dancer-char-search').value = selectedBiasChars.join(',');
  var label = document.getElementById('dancer-char-label');
  if(label){
    if(selectedBiasChars.length===0) label.textContent = '';
    else if(selectedBiasChars.length<=2) label.textContent = '→ '+selectedBiasChars.join(', ');
    else label.textContent = '→ '+selectedBiasChars[0]+' 等'+selectedBiasChars.length+'个角色';
  }
  loadDancerList();
}

loadDancerList=async function(){
  try{
  var sel=document.getElementById('dancer-dg-filter');if(sel&&!sel.options.length){var dgs=await(await fetch(API+'/dance-groups')).json();sel.innerHTML='<option value="">全部舞团</option>'+dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+'</option>';}).join('');}
  var dgId=sel?sel.value:'';
  var searchCN=(document.getElementById('dancer-new-cn').value||'').trim().toLowerCase();
  var searchQQ=(document.getElementById('dancer-new-qq').value||'').trim();
  var searchChar=(document.getElementById('dancer-char-search').value||'').trim();
  // 按角色名搜索（后端API）或获取全部舞见
  var dancers;
  if(searchChar){
    dancers=await(await fetch(API+'/dancers/by-character?q='+encodeURIComponent(searchChar))).json();
  } else {
    dancers=await(await fetch(API+'/dancers')).json();
  }
  await loadDGCache();
  // 按舞团筛选（支持多团：检查主团和关联团）
  if(dgId){
    var targetDgId = parseInt(dgId);
    dancers=dancers.filter(function(d){
      if (d.dance_group_id === targetDgId) return true;
      if (d.groups && d.groups.some(function(g){return g.dance_group_id === targetDgId;})) return true;
      return false;
    });
  }
  // 按CN名模糊搜索
  if(searchCN){dancers=dancers.filter(function(d){return d.cn_name.toLowerCase().includes(searchCN);});}
  // 按QQ搜索
  if(searchQQ){dancers=dancers.filter(function(d){return d.qq&&d.qq.includes(searchQQ);});}
  var le=document.getElementById('dancer-mgmt-list');if(!le)return;
  if(!dancers.length){le.innerHTML='<p style="color:#999;text-align:center;padding:40px;">没有匹配的舞见</p>';return;}
  // 批量获取舞见偏好
  var statsMap={};
  await Promise.all(dancers.map(async function(d){
    try{var sr=await fetch(API+'/dancers/'+d.dancer_id+'/stats');statsMap[d.dancer_id]=await sr.json();}catch(e){}
  }));
  // 按所有舞团分组（主团 + 关联团），同一舞见可出现在多个团下
  var byDg={}, seen={};
  dancers.forEach(function(d){
    var allGroups=d.groups&&d.groups.length?d.groups:[];
    if(!allGroups.length){
      // 无任何组
      var key='__none__';
      if(!byDg[key])byDg[key]={name:'未分组',dgId:null,dancers:[]};
      if(!seen[d.dancer_id+'_'+key]){byDg[key].dancers.push(d);seen[d.dancer_id+'_'+key]=true;}
    }else{
      allGroups.forEach(function(g){
        var key=String(g.dance_group_id);
        if(!byDg[key])byDg[key]={name:g.dance_group_name||dgCache[g.dance_group_id]||'舞团#'+g.dance_group_id,dgId:g.dance_group_id,dancers:[]};
        if(!seen[d.dancer_id+'_'+key]){byDg[key].dancers.push(d);seen[d.dancer_id+'_'+key]=true;}
      });
    }
  });
  var dgKeys=Object.keys(byDg).sort(function(a,b){return a==='__none__'?1:b==='__none__'?-1:parseInt(a)-parseInt(b);});
  le.innerHTML=dgKeys.map(function(key){
    var g=byDg[key];
    var grad=dgGradients[g.dgId]||(key==='__none__'?'#999,#bbb':'#ff6b9d,#e878a8');
    return'<div style="margin:20px 0 8px;padding:10px 16px;background:linear-gradient(135deg,'+grad+');border-radius:12px;color:#fff;"><strong style="font-size:1.1em;">'+g.name+'</strong><span style="margin-left:10px;font-size:0.8em;opacity:0.8;">'+g.dancers.length+' 人</span></div>'+
      '<div class="grid">'+g.dancers.map(function(d){
        var stats=statsMap[d.dancer_id]||[];
        var topColor=stats.length?stats[0].cheering_color||'#ff6b9d':'#eee';
        var topChar=stats.length?stats[0].character_name:'';
        var qqBadge=d.qq?'<span class="tag" style="font-size:0.65em;">QQ:'+d.qq+'</span>':'';
        // 多团标识
        var extraGroups = d.groups ? d.groups.filter(function(g){return g.dance_group_id !== d.dance_group_id;}) : [];
        var allGroups = d.groups || [];
        var hasMultiple = allGroups.length > 1;
        var multiBadge = extraGroups.length ? '<span title="同时隶属: '+extraGroups.map(function(g){return g.dance_group_name;}).join(', ')+'" style="display:inline-block;background:#fff3e0;color:#e65100;border-radius:10px;padding:0 5px;font-size:0.6em;margin-left:4px;vertical-align:middle;">+'+extraGroups.length+'团</span>' : '';
        return'<div class="card dancer-card" style="border:2px solid '+topColor+';position:relative;" data-did="'+d.dancer_id+'" onclick="showDancerDetail('+d.dancer_id+')"><h3>'+d.cn_name+multiBadge+'</h3>'+qqBadge+(topChar?'<br><small style="color:#999;">偏好: '+topChar+'</small>':'')+'<button class="btn btn-sm dancer-edit-btn" style="position:absolute;top:10px;right:36px;padding:2px 8px;font-size:0.65em;background:var(--blue);color:#fff;z-index:2;" data-did="'+d.dancer_id+'">✎</button><button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:4px;padding:2px 8px;font-size:0.65em;" onclick="event.stopPropagation();removeDancerFromGroup('+d.dancer_id+','+(g.dgId||0)+',\''+(d.cn_name||'').replace(/'/g,'\\\'')+'\','+(hasMultiple?'true':'false')+')" title="'+(hasMultiple?'从当前舞团移除':'删除舞见')+'">×</button></div>';
      }).join('')+'</div>';
  }).join('');
  }catch(e){var le=document.getElementById('dancer-mgmt-list');if(le)le.innerHTML='<p style=\"color:#e53935;text-align:center;padding:40px;\">加载出错: '+e.message+'</p>';}
};

addDanceGroup=async function(){var n=document.getElementById('dg-new-name').value.trim();if(!n){alert('请输入舞团名称');return;}var agSel=document.getElementById('dg-new-anime-group');if(!agSel||!agSel.value){alert('请选择翻跳团体');return;}var agId=parseInt(agSel.value);await fetch(API+'/dance-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,anime_group_id:agId})});document.getElementById('dg-new-name').value='';agSel.value='';dgCache={};loadDgMgmt();try{var sel=document.getElementById('dancer-dg-filter');if(sel){sel.innerHTML='';loadDancerList();}}catch(e){}};
deleteDanceGroup=async function(id,name){if(!confirm('确定解散舞团「'+name+'」？\n\n⚠ 这将同时删除：\n  • 该舞团所有舞见\n  • 该舞团所有排练及参与记录\n  • 该舞团所有曲目和演出\n\n此操作不可恢复！'))return;var res=await fetch(API+'/dance-groups/'+id,{method:'DELETE'});if(!res.ok){var e=await res.json();alert('解散失败：'+(e.error||'未知错误'));return;}loadDgMgmt();try{loadDancerList();}catch(e){}try{loadPerfView();}catch(e){}try{loadHome();}catch(e){}};
openAddDancer=async function(){
  document.getElementById('dancer-modal-title').textContent='新建舞见';
  document.getElementById('f-dancer-cn').value='';
  document.getElementById('f-dancer-qq').value='';
  document.getElementById('f-dancer-dg').value='';
  document.getElementById('f-dancer-edit-id').value='';
  document.querySelector('#form-dancer button[type=submit]').textContent='确认新建';
  // 填充舞团下拉（每次打开都刷新，确保新舞团可见）
  var sel=document.getElementById('f-dancer-dg');
  var dgs=await(await fetch(API+'/dance-groups')).json();
  sel.innerHTML='<option value="">暂不加入舞团</option>'+dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+'</option>';}).join('');
  document.getElementById('modal-dancer-add').classList.add('show');
};
openEditDancer=async function(id,cn,qq,dgId){
  // 如果没传完整数据，从 API 获取
  if(cn===undefined){
    var dancers=await(await fetch(API+'/dancers')).json();
    var d=dancers.find(function(x){return x.dancer_id===id;});
    if(!d)return;
    cn=d.cn_name||''; qq=d.qq||''; dgId=d.dance_group_id||0;
  }
  document.getElementById('dancer-modal-title').textContent='编辑舞见';
  document.getElementById('f-dancer-cn').value=cn||'';
  document.getElementById('f-dancer-qq').value=qq||'';
  document.getElementById('f-dancer-edit-id').value=id;
  document.querySelector('#form-dancer button[type=submit]').textContent='保存修改';
  var sel=document.getElementById('f-dancer-dg');
  var dgs=await(await fetch(API+'/dance-groups')).json();
  sel.innerHTML='<option value="">暂不加入舞团</option>'+dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+'</option>';}).join('');
  sel.value=dgId||'';
  document.getElementById('modal-dancer-add').classList.add('show');
};
submitDancer=async function(e){
  e.preventDefault();
  var cn=document.getElementById('f-dancer-cn').value.trim();
  var qq=document.getElementById('f-dancer-qq').value.trim();
  var dgId=document.getElementById('f-dancer-dg').value;
  var editId=document.getElementById('f-dancer-edit-id').value;
  if(!cn){alert('请输入CN名');return;}
  if(!qq){alert('请输入QQ号');return;}
	if(!/^\d+$/.test(qq)){alert('QQ号码必须是数字');return;}
  if(editId){
    // 编辑模式
    var res=await fetch(API+'/dancers/'+editId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({cn_name:cn,qq:qq,dance_group_id:dgId?parseInt(dgId):null})});
    if(!res.ok){var e=await res.json();alert('修改失败：'+(e.error||'未知错误'));return;}
  }else{
    // 新建模式
    var res=await fetch(API+'/dancers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cn_name:cn,qq:qq,dance_group_id:dgId?parseInt(dgId):null})});
    if(!res.ok){var e=await res.json();alert('新建失败：'+(e.error||'未知错误'));return;}
  }
  closeModal('modal-dancer-add');
  loadDancerList();
  try{loadDgMgmt();}catch(e){}
};
// 将舞见从指定舞团中移除（不删人，保留排练记录）
removeDancerFromGroup=async function(did, dgId, cn, hasMultiple){
  var label = hasMultiple ? '确定将 '+cn+' 从当前舞团中移除？\n\n⚠ 这将同时：\n  • 删除她在此舞团所有排练的参与记录\n  • 保留其他舞团的排练和归属' : '⚠ '+cn+' 只在本团。\n\n彻底删除将清除：\n  • 所有排练参与记录\n  • 舞见信息\n\n确定删除？';
  if(!confirm(label))return;
  if(!hasMultiple){
    // 只在一个团 → 彻底删除
    await fetch(API+'/dancers/'+did,{method:'DELETE'});
  } else {
    // 多团 → 仅从当前团移除
    await fetch(API+'/dancers/'+did+'/groups/'+dgId,{method:'DELETE'});
  }
  loadDancerList();
  try{loadPerfView();}catch(e){}
  try{loadHome();}catch(e){}
};
// 彻底删除舞见（从舞见详情页调用）
deleteDancer=async function(id){if(!confirm('确定删除此舞见？\n\n⚠ 将同时删除其所有排练参与记录'))return;await fetch(API+'/dancers/'+id,{method:'DELETE'});loadDancerList();try{loadPerfView();}catch(e){}try{loadHome();}catch(e){}};

// ── Rehearsal add form
var rehAssignments={}, pendingRehCharId=null, pendingRehDgId=null;
async function openAddRehearsal(){
  rehAssignments={}; pendingRehCharId=null; pendingRehDgId=null;
  var dgs=await(await fetch(API+'/dance-groups')).json();
  var sel=document.getElementById('f-dg-sel');
  sel.innerHTML='<option value="">选择已有舞团…</option>'+dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+(d.anime_group_name?' — 翻跳 '+d.anime_group_name:'')+'</option>';}).join('');
  sel.value='';
  document.getElementById('f-dg-new').style.display='none';
  document.getElementById('f-dg-new').value='';
  document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  document.getElementById('f-start').value='14:00';
  document.getElementById('f-end').value='16:00';
  document.getElementById('f-loc').value='';
  document.getElementById('f-desc').value='';
  document.getElementById('reh-init-chars').style.display='none';
  document.getElementById('reh-init-grid').innerHTML='';
  document.getElementById('modal-rehearsal').classList.add('show');
}
async function onDgSelect(){
  var selVal=document.getElementById('f-dg-sel').value;
  var newInput=document.getElementById('f-dg-new');
  newInput.style.display=selVal?'none':'block';
  if(selVal)newInput.value='';
  rehAssignments={}; pendingRehDgId=selVal?parseInt(selVal):null;
  var charsDiv=document.getElementById('reh-init-chars');
  var grid=document.getElementById('reh-init-grid');
  if(!selVal){charsDiv.style.display='none';grid.innerHTML='';return;}
  try{
    var dg=await(await fetch(API+'/dance-groups/'+selVal)).json();
    if(!dg.anime_group_id){charsDiv.style.display='none';grid.innerHTML='';return;}
    var group=await(await fetch(API+'/groups/'+dg.anime_group_id)).json();
    var chars=group.members||[];
    if(!chars.length){charsDiv.style.display='none';grid.innerHTML='';return;}
    renderRehInitGrid(chars);
    charsDiv.style.display='block';
  }catch(e){charsDiv.style.display='block';grid.innerHTML='<p style=\"color:#e53935;font-size:0.8em;\">加载角色失败: '+e.message+'</p>';}
}
function renderRehInitGrid(chars){
  var grid=document.getElementById('reh-init-grid');
  grid.innerHTML=chars.map(function(c){
    var assigned=rehAssignments[c.character_id];
    var label=assigned?'<span style=\"color:#333;font-weight:700;\">'+assigned.cn_name+'</span><br><small style=\"color:#999;\">'+(assigned.inGroup?'✓ 本团':'↗ 拉入舞团')+'</small>':'<span style=\"color:#999;\">点击指派</span>';
    return'<div class=\"card reh-init-card\" style=\"width:110px;padding:8px;text-align:center;cursor:pointer;border:2px solid '+(c.cheering_color||'#eee')+';background:'+(assigned?'#e8f5e9':'#fff')+';position:relative;\" data-cid=\"'+c.character_id+'\" onclick=\"openRehAssign('+c.character_id+')\"><div style=\"font-size:0.8em;font-weight:700;color:'+(c.cheering_color||'#666')+';\">'+c.name+'</div><div style=\"font-size:0.72em;margin-top:3px;\">'+label+'</div>'+(assigned?'<button class=\"btn btn-sm\" style=\"position:absolute;top:2px;right:2px;padding:0 5px;font-size:0.6em;\" onclick=\"event.stopPropagation();delete rehAssignments['+c.character_id+'];renderRehInitGrid(chars);\">×</button>':'')+'</div>';
  }).join('');
}
async function openRehAssign(charId){
  pendingRehCharId=charId;
  var html='<h3>指派舞见</h3>';
  // 加载推荐
  var recs=[];
  try{
    var rr=await fetch(API+'/dancers/recommend?dance_group_id='+pendingRehDgId+'&character_id='+charId);
    recs=await rr.json();
  }catch(e){}
  if(recs.in_group&&recs.in_group.length){
    html+='<div style=\"margin-bottom:8px;\"><span style=\"font-size:0.8em;color:#999;\">📌 本团推荐</span></div>';
    html+='<div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;\">';
    recs.in_group.forEach(function(d){
      html+='<div class=\"card\" style=\"width:100px;padding:8px;text-align:center;cursor:pointer;border:2px solid #66bb6a;background:#e8f5e9;\" onclick=\"selectRehDancer('+d.dancer_id+',\''+(d.cn_name||'').replace(/'/g,'\\\'')+'\','+pendingRehDgId+')\"><strong style=\"font-size:0.8em;\">'+d.cn_name+'</strong><br><small style=\"color:#999;\">'+d.play_count+'次</small></div>';
    });
    html+='</div>';
  }
  if(recs.other_group&&recs.other_group.length){
    html+='<div style=\"margin-bottom:8px;\"><span style=\"font-size:0.8em;color:#999;\">🔗 别团演过此角色</span></div>';
    html+='<div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;\">';
    recs.other_group.forEach(function(d){
      html+='<div class=\"card\" style=\"width:100px;padding:8px;text-align:center;cursor:pointer;border:2px solid #ff9800;background:#fff8e1;\" onclick=\"selectRehDancer('+d.dancer_id+',\''+(d.cn_name||'').replace(/'/g,'\\\'')+'\','+(d.dance_group_id||0)+','+pendingRehDgId+')\"><strong style=\"font-size:0.8em;\">'+d.cn_name+'</strong><br><small style=\"color:#999;\">'+(d.dance_group_name||'')+' · '+d.play_count+'次</small></div>';
    });
    html+='</div>';
  }
  html+='<input type=\"text\" id=\"reh-assign-search\" placeholder=\"搜索舞见CN或QQ…\" style=\"width:100%;padding:10px;border-radius:8px;border:2px solid #eee;margin-bottom:8px;\" oninput=\"searchRehDancers()\">';
  html+='<div id=\"reh-assign-results\" style=\"max-height:220px;overflow-y:auto;\"></div>';
  html+='<div id=\"reh-assign-new\" style=\"display:none;margin-top:10px;padding:10px;background:#fdf6f8;border-radius:8px;\">';
  html+='<p style=\"font-size:0.85em;color:#999;\">未找到，新建舞见：</p>';
  html+='<input type=\"text\" id=\"reh-assign-new-cn\" placeholder=\"CN名（必填）\" style=\"width:100%;padding:8px;border-radius:8px;border:2px solid #eee;margin-bottom:6px;\">';
  html+='<input type=\"text\" id=\"reh-assign-new-qq\" placeholder=\"QQ号（必填）\" style=\"width:100%;padding:8px;border-radius:8px;border:2px solid #eee;margin-bottom:6px;\">';
  html+='<button class=\"btn btn-primary btn-sm\" onclick=\"createAndAssignReh()\">新建并指派</button></div>';
  html+='<div style=\"margin-top:10px;text-align:right;\"><button class=\"btn\" onclick=\"closeModal(\'modal-sub\')\">取消</button></div>';
  document.getElementById('modal-sub-content').innerHTML=html;
  document.getElementById('modal-sub').classList.add('show');
  setTimeout(function(){var inp=document.getElementById('reh-assign-search');if(inp)inp.focus();},100);
}
async function searchRehDancers(){
  var q=document.getElementById('reh-assign-search').value.trim();
  var results=document.getElementById('reh-assign-results');
  var newForm=document.getElementById('reh-assign-new');
  if(!q){results.innerHTML='';newForm.style.display='none';return;}
  var dancers=await(await fetch(API+'/dancers/search?q='+encodeURIComponent(q))).json();
  newForm.style.display='block';
  if(!dancers.length){results.innerHTML='<p style=\"color:#999;font-size:0.85em;\">未找到匹配舞见</p>';return;}
  results.innerHTML=dancers.map(function(d){
    var inThisDg=(d.dance_group_id===pendingRehDgId);
    var badge=inThisDg?'<span class=\"tag\" style=\"font-size:0.65em;background:#66bb6a;color:#fff;\">本团</span>':'<span class=\"tag\" style=\"font-size:0.65em;background:#ff9800;color:#fff;\">其他团</span>';
    var hint=inThisDg?'':'<br><small style=\"color:#ff9800;\">↗ 选择后将拉入本舞团</small>';
    return'<div style=\"display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #f0f0f0;cursor:pointer;\" onclick=\"selectRehDancer('+d.dancer_id+',\''+(d.cn_name||'').replace(/'/g,'\\\'')+'\','+(d.dance_group_id||0)+')\"><div><strong>'+d.cn_name+'</strong> '+badge+'<br><small style=\"color:#999;\">QQ:'+(d.qq||'')+' · '+(d.dance_group_name||'')+'</small>'+hint+'</div><span class=\"tag\" style=\"font-size:0.7em;\">选择</span></div>';
  }).join('');
}
async function selectRehDancer(dancerId, cn, dgId){
  var inGroup=(dgId===pendingRehDgId);
  var msg=inGroup?'确定指派 '+cn+' 到此角色？':'⚠ '+cn+' 不在当前舞团中。\n\n选择她后将把她拉入本舞团（她可同时属于多个舞团）。\n\n确定继续？';
  if(!confirm(msg))return;
  rehAssignments[pendingRehCharId]={dancer_id:dancerId,cn_name:cn,inGroup:inGroup};
  closeModal('modal-sub');
  try{
    var dg=await(await fetch(API+'/dance-groups/'+pendingRehDgId)).json();
    if(dg.anime_group_id){
      var group=await(await fetch(API+'/groups/'+dg.anime_group_id)).json();
      renderRehInitGrid(group.members||[]);
    }
  }catch(e){}
}
async function createAndAssignReh(){
  var cn=document.getElementById('reh-assign-new-cn').value.trim();
  var qq=document.getElementById('reh-assign-new-qq').value.trim();
  if(!cn||!qq){alert('CN和QQ均为必填');return;}
	if(!/^\d+$/.test(qq)){alert('QQ号码必须是数字');return;}
  var res=await fetch(API+'/dancers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cn_name:cn,qq:qq,dance_group_id:null})});
  if(!res.ok){alert('创建失败');return;}
  var dancer=await res.json();
  rehAssignments[pendingRehCharId]={dancer_id:dancer.dancer_id,cn_name:cn,inGroup:false};
  closeModal('modal-sub');
  try{
    var dg=await(await fetch(API+'/dance-groups/'+pendingRehDgId)).json();
    if(dg.anime_group_id){
      var group=await(await fetch(API+'/groups/'+dg.anime_group_id)).json();
      renderRehInitGrid(group.members||[]);
    }
  }catch(e){}
}
async function addRehearsal(e){
  e.preventDefault();
  var selId=document.getElementById('f-dg-sel').value;
  var newName=document.getElementById('f-dg-new').value.trim();
  var dgId;
  if(selId){
    dgId=parseInt(selId);
  }else if(newName){
    var dgs=await(await fetch(API+'/dance-groups')).json();
    var match=dgs.find(function(d){return d.name===newName;});
    if(match){dgId=match.dance_group_id;}
    else{var cr=await fetch(API+'/dance-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newName})});dgId=(await cr.json()).dance_group_id;}
  }else{alert('请选择已有舞团或输入新建舞团名称');return;}
  var startTime=document.getElementById('f-start').value,endTime=document.getElementById('f-end').value,loc=document.getElementById('f-loc').value;
  if(!loc.trim()){alert('请输入排练地点');return;}
  if(startTime>=endTime){alert('结束时间必须晚于开始时间');return;}
  var participants=[];
  Object.keys(rehAssignments).forEach(function(cid){
    var a=rehAssignments[cid];
    participants.push({character_id:parseInt(cid),cn_name:a.cn_name,dancer_id:a.dancer_id});
  });
  var body={dance_group_id:dgId,rehearsal_date:document.getElementById('f-date').value,start_time:startTime,end_time:endTime,location:loc,content_summary:document.getElementById('f-desc').value.trim()||null,participants:participants};
  var res=await fetch(API+'/rehearsals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!res.ok){var err=await res.json();alert('添加失败：'+(err.error||'未知错误'));return;}
  closeModal('modal-rehearsal');
  loadPerfView();
  try{loadHome();}catch(e){}
}
function closeModal(id){document.getElementById(id).classList.remove('show');}
function closeModal(id){document.getElementById(id).classList.remove('show');}

// ── Event bindings
function safeOn(id,ev,fn){var el=document.getElementById(id);if(el)el.addEventListener(ev,fn);}
safeOn('group-filter-project','change',loadGroups);
safeOn('char-search','input',function(){
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadCharacters, 300);
});
safeOn('char-filter-age','change',loadCharacters);
safeOn('reh-filter-status','change',loadPerfView);
safeOn('reh-date-from','change',loadPerfView);
safeOn('reh-date-to','change',loadPerfView);
safeOn('dancer-new-cn','input',function(){loadDancerList();});
safeOn('dancer-new-qq','input',function(){loadDancerList();});
safeOn('dancer-char-search','input',function(){loadDancerList();});
safeOn('dancer-dg-filter','change',function(){loadDancerList();});
// 舞见列表事件委托：编辑按钮
var dml=document.getElementById('dancer-mgmt-list');
if(dml)dml.addEventListener('click',function(e){
  var btn=e.target.closest('.dancer-edit-btn');
  if(btn){e.stopPropagation();var did=parseInt(btn.getAttribute('data-did'));if(did)openEditDancer(did);}
});
['modal-rehearsal','modal-char','modal-sub','modal-dancer-add'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',function(e){if(e.target===this)closeModal(id);});});

// ── Scroll animation
(function(){
  var ob=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.remove('visible');void entry.target.offsetWidth;entry.target.classList.add('visible');}});},{threshold:0.15});
  function watch(){document.querySelectorAll('.card,.rehearsal-item,.stat-card').forEach(function(el){if(!el.classList.contains('anim-item'))el.classList.add('anim-item');ob.observe(el);});}
  var orig=showPage;showPage=function(n,f){orig(n,f);setTimeout(watch,150);};
  watch();
})();

// ── Init
loadHome();
renderHomeCalendar();
