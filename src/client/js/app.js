const API = 'http://localhost:3000/api';
let dgCache = {}, pageFilter = null;
const groupLogo = { 1:'images/logos/muse.png', 2:'images/logos/aqours.png', 3:'images/logos/nijigasaki.png', 4:'images/logos/liella.png', 5:'images/logos/hasunosora.png', 7:'images/logos/saintsnow.png', 8:'images/logos/sunnypassion.png', 9:'images/logos/bluebird.png' };

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
  if (name==='characters'){ if(!filterVal) selectedGroups=[]; loadCharacters(); }
  if (name==='rehearsal') { renderCalendar(); loadPerfView(); }
  if (name==='dancegroups') loadDgMgmt();
  if (name==='dancers') loadDancerList();
  if (name==='home') loadHome();
}

async function loadHome() {
  await loadDGCache();
  var r = await fetch(API+'/stats'); var stats = await r.json();
  document.getElementById('stat-projects').textContent=stats.projectCount;
  document.getElementById('stat-groups').textContent=stats.groupCount;
  document.getElementById('stat-chars').textContent=stats.charCount;
  document.getElementById('stat-seiyuu').textContent=stats.rehCount;
  var rr = await fetch(API+'/rehearsals'); var list = await rr.json();
  var el = document.getElementById('home-rehearsals');
  var recent = list.slice(-4).reverse();
  if (!recent.length) { el.innerHTML='<p style="color:#999;">暂无排练</p>'; return; }
  el.innerHTML = recent.map(function(r){
    return '<div class="rehearsal-item" style="cursor:pointer;" onclick="showRehearsalDetail('+r.rehearsal_id+')"><div class="info"><strong>'+(dgCache[r.dance_group_id]||'?')+'</strong> · '+fmtDate(r.rehearsal_date)+' '+(r.start_time||'').slice(0,5)+'-'+(r.end_time||'').slice(0,5)+' @'+r.location+'<br><small>'+(r.content_summary||'')+'</small></div><span class="count '+r.occupancy_status+'">'+r.current_participants+'人</span></div>';
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

async function loadCharacters(){
  var cardsWrap = document.getElementById('group-mini-cards');
  if (cardsWrap.children.length===0){
    var gr = await fetch(API+'/groups'); var groups = await gr.json();
    buildGroupMiniCards(groups);
    document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.add('active');});
    selectedGroups=groups.map(function(g){return String(g.group_id);});
  }
  // 每次进入角色页都检查是否有来自动漫团的筛选指令
  if (pageFilter&&pageFilter.gid){
    selectedGroups=[String(pageFilter.gid)]; pageFilter=null;
    document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.toggle('active',c.dataset.gid===selectedGroups[0]);});
  }
  var search = document.getElementById('char-search').value;
  var ageRange = document.getElementById('char-filter-age').value;
  var url = API+'/characters?';
  if (selectedGroups.length===1) url+='group_id='+selectedGroups[0]+'&';
  if (search) url+='search='+encodeURIComponent(search)+'&';
  if (ageRange){var parts=ageRange.split('-');url+='cv_age_min='+parts[0]+'&cv_age_max='+parts[1]+'&';}
  var r = await fetch(url); var chars = await r.json();
  if (selectedGroups.length>=1){ chars=chars.filter(function(c){return selectedGroups.indexOf(String(c.group_id))>=0;}); }
  else { document.querySelectorAll('.group-mini-card').forEach(function(c){c.classList.add('active');}); }

  var grp={}; chars.forEach(function(c){var gn=c.group_name||'其他'; if(!grp[gn])grp[gn]=[]; grp[gn].push(c);});
  document.getElementById('char-grid').innerHTML = Object.entries(grp).map(function(e){
    return '<div style="grid-column:1/-1;margin-top:12px;"><h3 style="color:var(--pink);padding-bottom:6px;border-bottom:2px solid var(--pink-light);">'+e[0]+' <span style="font-weight:400;font-size:0.8em;color:#999;">('+e[1].length+'人)</span></h3></div>'+e[1].map(function(c){
      var age = c.birth_date?Math.floor((new Date()-new Date(c.birth_date))/31557600000):null;
      var cheerDot = c.cheering_color?' <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+c.cheering_color+';border:1px solid #ddd;vertical-align:middle;"></span>':'';
      return '<div class="card" onclick="showCharDetail('+c.character_id+')"><div class="card-render-bg" style="background-image:url(images/chars/char-'+c.character_id+'.png)"></div><h3>'+c.name+cheerDot+'</h3><span class="tag blue">'+(c.birthday||'?')+' · '+(c.blood_type||'?')+'型 · '+(c.height||'?')+'cm</span><div class="cv">CV: '+(c.cv_name||'?')+(age?' ('+age+'岁)':'')+'</div>'+(c.hobby?'<div style="margin-top:6px;font-size:0.82em;color:#888;">'+c.hobby+'</div>':'')+'<div style="margin-top:4px;font-size:0.75em;color:var(--pink);">点击查看详情 →</div></div>';
    }).join('');
  }).join('');
}

async function showCharDetail(charId){
  var r = await fetch(API+'/characters/'+charId); var c = await r.json();
  var age = c.birth_date?Math.floor((new Date()-new Date(c.birth_date))/31557600000):null;
  var html = '<div style="display:flex;gap:24px;flex-wrap:wrap;"><div style="flex:0 0 200px;text-align:center;"><img src="images/chars/char-'+charId+'.png" style="width:180px;object-fit:contain;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);" onerror="this.style.display=\'none\'"><div style="display:none;width:180px;height:210px;border-radius:12px;background:linear-gradient(135deg,#fff5f8,#fce4ec);align-items:center;justify-content:center;color:var(--pink);font-size:3em;">'+(c.name||'?')[0]+'</div></div><div style="flex:1;min-width:280px;"><h2 style="color:var(--pink);margin-bottom:4px;">'+c.name+'</h2><p style="color:#999;">'+(c.group_name||'?')+'</p><table style="font-size:0.9em;"><tr><td style="color:#999;width:60px;">CV</td><td>'+(c.cv_name||'?')+(age?' ('+age+'岁)':'')+'</td></tr><tr><td style="color:#999;">生日</td><td>'+(c.birthday||'?')+'</td></tr><tr><td style="color:#999;">血型</td><td>'+(c.blood_type||'?')+'型</td></tr><tr><td style="color:#999;">身高</td><td>'+(c.height||'?')+' cm</td></tr><tr><td style="color:#999;">爱好</td><td>'+(c.hobby||'?')+'</td></tr>'+(c.eye_color?'<tr><td style="color:#999;">瞳色</td><td>'+c.eye_color+'</td></tr>':'')+(c.cheering_color?'<tr><td style="color:#999;">应援色</td><td><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:'+c.cheering_color+';border:1px solid #ddd;"></span> '+c.cheering_color+'</td></tr>':'')+(c.call_response?'<tr><td style="color:#999;">互动词</td><td style="font-size:0.85em;">'+c.call_response+'</td></tr>':'')+'</table>'+(c.description?'<div style="margin-top:12px;padding:12px;background:#fff5f8;border-radius:8px;font-size:0.9em;line-height:1.6;">'+c.description+'</div>':'')+(c.rehearsals&&c.rehearsals.length?'<div style="margin-top:12px;"><h4 style="color:var(--pink);">近期排练</h4>'+c.rehearsals.slice(0,5).map(function(rh){return'<div style="font-size:0.82em;padding:4px 0;border-bottom:1px solid #f0f0f0;"><span style="color:var(--pink);cursor:pointer;" onclick="showDancerDetail('+(rh.dancer_id||0)+')">'+rh.cn_name+'</span> · '+fmtDate(rh.rehearsal_date)+' · <span style="color:#42a5f5;cursor:pointer;" onclick="showDgDetail('+(rh.dance_group_id||0)+')">'+rh.dance_group_name+'</span></div>';}).join('')+'</div>':'')+'<div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-sm" style="background:var(--purple);color:#fff;" onclick="showRelationGraph('+charId+')">关系图谱</button></div></div></div><div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML = html;
  document.getElementById('modal-char').classList.add('show');
}

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

// ── Relation graph
var specialRels={'17,15':'姐妹','15,17':'姐妹','56,57':'姐妹','57,56':'姐妹','39,41':'姐妹','41,39':'姐妹','1,3':'幼驯染','3,1':'幼驯染','1,4':'幼驯染','4,1':'幼驯染','10,12':'幼驯染','12,10':'幼驯染','31,33':'幼驯染','33,31':'幼驯染','10,1':'憧憬','6,9':'搭档','9,6':'搭档','2,7':'搭档','7,2':'搭档','11,12':'搭档','12,11':'搭档'};
async function showRelationGraph(charId){
  var c=await(await fetch(API+'/characters/'+charId)).json();
  var group=await(await fetch(API+'/groups/'+c.group_id)).json();
  var members=group.members||[]; if(members.length<2){alert('暂无关系数据');return;}
  var nodes=members.map(function(m){return{id:m.character_id,name:m.name,color:m.cheering_color||'#ff6b9d',isCenter:m.character_id===charId};});
  var W=600,H=480,cx=W/2,cy=H/2;
  nodes.forEach(function(n,i){var a=i/nodes.length*2*Math.PI-Math.PI/2;n.x=cx+(n.isCenter?0:160)*Math.cos(a);n.y=cy+(n.isCenter?0:160)*Math.sin(a);n.vx=0;n.vy=0;});
  var html='<canvas id="rel-canvas" width="'+W+'" height="'+H+'" style="background:#fdf6f8;border-radius:16px;cursor:grab;"></canvas><div style="text-align:right;margin-top:8px;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
  setTimeout(function(){
    var cv=document.getElementById('rel-canvas');if(!cv)return;var ctx=cv.getContext('2d'),drag=null;
    function drawArrow(x1,y1,x2,y2,cl,sz){var a=Math.atan2(y2-y1,x2-x1);var px=x2-26*Math.cos(a),py=y2-26*Math.sin(a);ctx.fillStyle=cl;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-sz*Math.cos(a-0.6),py-sz*Math.sin(a-0.6));ctx.lineTo(px-sz*Math.cos(a+0.6),py-sz*Math.sin(a+0.6));ctx.closePath();ctx.fill();}
    function step(){
      if(!document.getElementById('rel-canvas'))return;
      nodes.forEach(function(a){nodes.forEach(function(b){if(a===b)return;var dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1,rel=specialRels[a.id+','+b.id];if(a.isCenter||b.isCenter){var t=a.isCenter?100:120,f=(d-t)*0.004;a.vx+=dx/d*f;a.vy+=dy/d*f;}else if(d<70){var f2=(70-d)*0.015;a.vx-=dx/d*f2;a.vy-=dy/d*f2;}});if(a.isCenter){a.vx+=(cx-a.x)*0.015;a.vy+=(cy-a.y)*0.015;}a.vx*=0.9;a.vy*=0.9;a.x+=a.vx;a.y+=a.vy;a.x=Math.max(20,Math.min(W-20,a.x));a.y=Math.max(20,Math.min(H-20,a.y));});
      ctx.clearRect(0,0,W,H);
      nodes.forEach(function(a){nodes.forEach(function(b){if(a.id>=b.id)return;var rel=specialRels[a.id+','+b.id];ctx.strokeStyle=rel?'#e57373':(a.isCenter||b.isCenter?'#ffc0cb':'#f0e0e8');ctx.lineWidth=rel?2.2:(a.isCenter||b.isCenter?1:0.4);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(rel){drawArrow(a.x,a.y,b.x,b.y,'#e57373',7);if(rel!=='憧憬')drawArrow(b.x,b.y,a.x,a.y,'#e57373',7);var mx=(a.x+b.x)/2,my=(a.y+b.y)/2;ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold 11px Microsoft YaHei';var tw=ctx.measureText(rel).width;ctx.fillRect(mx-tw/2-6,my-10,tw+12,20);ctx.fillStyle='#c62828';ctx.textAlign='center';ctx.fillText(rel,mx,my+4);}});});
      nodes.forEach(function(n){var r=n.isCenter?30:22;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=n.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=n.isCenter?3:2;ctx.stroke();if(n.isCenter){ctx.beginPath();ctx.arc(n.x,n.y,r+5,0,Math.PI*2);ctx.strokeStyle=n.color;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}ctx.fillStyle='#333';ctx.font=(n.isCenter?'bold ':'')+'11px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(n.name,n.x,n.y+r+14);});
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
var dgGradients = {1:'#ff8c42,#ffab6e',2:'#42a5f5,#64b5f6',3:'#ab47bc,#ce93d8',4:'#66bb6a,#81c784',7:'#ef5350,#ff6e6e',8:'#ffa726,#ffb74d',9:'#78909c,#a0aeb8'};
loadRehPage = function(){ loadPerfView(); };
loadPerfView = async function(){
  await loadDGCache();
  var sh=document.getElementById('reh-show-history'); if(!sh)return;
  var df=document.getElementById('reh-date-from').value;
  if(!sh.checked&&!df) df=new Date().toISOString().slice(0,10);
  var url=API+'/rehearsals?'; if(df)url+='date_from='+df+'&';
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
      html+='<div class="rehearsal-item" style="cursor:pointer;margin-left:8px;margin-bottom:4px;border-left-color:'+(dgGradients[g.dgId]||'#ff6b9d').split(',')[0]+';" onclick="showRehearsalDetail('+rh.rehearsal_id+')"><div class="info"><strong>'+(rh.stage_type||'排练')+'</strong> · '+fmtDate(rh.rehearsal_date)+' '+(rh.start_time||'').slice(0,5)+'-'+(rh.end_time||'').slice(0,5)+' @'+rh.location+'</div><span class="count '+(rh.occupancy_status||'')+'">'+rh.current_participants+'人</span></div>';
    });
  });
  document.getElementById('rehearsal-list').innerHTML=html||'<p style="color:#999;">暂无排练</p>';
};

showRehearsalDetail = async function(rehId){await loadDGCache();renderRehDetail(rehId);};
async function renderRehDetail(rehId){
  var rr=await fetch(API+'/rehearsals/'+rehId);var reh=await rr.json();
  var parts=reh.participants||[];
  var dgRes=await fetch(API+'/dance-groups/'+reh.dance_group_id);var dg=await dgRes.json();
  var excluded=reh.excluded_chars?reh.excluded_chars.split(',').map(Number):[];
  var allChars=[];
  if(dg.anime_group_id){
    var grRes=await fetch(API+'/groups/'+dg.anime_group_id);var group=await grRes.json();
    allChars=(group.members||[]).filter(function(c){return excluded.indexOf(c.character_id)===-1;});
  }
  var partMap={};parts.forEach(function(p){partMap[p.character_id]={cn:p.cn_name,pid:p.participation_id};});
  var filled=Object.keys(partMap).length;
  var cards=allChars.map(function(c){
    var p=partMap[c.character_id];var color=c.cheering_color||'#ccc';
    if(p) return '<div class="reh-part-card filled" data-cid="'+c.character_id+'" style="--card-color:'+color+'" onclick="editDancerInDetail('+rehId+','+c.character_id+',\''+p.cn+'\','+p.pid+')"><div class="rpc-char" style="color:'+color+'">'+c.name+'</div><div class="rpc-dancer">'+p.cn+'</div></div>';
    return '<div class="reh-part-card missing" data-cid="'+c.character_id+'" onclick="assignDancerInDetail('+rehId+','+c.character_id+')"><div class="rpc-char">'+c.name+'</div><div class="rpc-status">+ 空缺</div></div>';
  }).join('');

  var html='<div style="padding:12px 16px;background:linear-gradient(135deg,#ff6b9d,#e878a8);border-radius:12px;color:#fff;margin-bottom:14px;"><strong style="font-size:1.1em;">曲目: '+(reh.content_summary||'排练')+'</strong><br><span style="font-size:0.8em;opacity:0.8;">'+(dgCache[reh.dance_group_id]||'?')+' · '+fmtDate(reh.rehearsal_date)+'</span></div>';
  html+='<table style="font-size:0.9em;margin-bottom:10px;"><tr><td style="color:#999;width:60px;">时间</td><td>'+(reh.start_time||'').slice(0,5)+' - '+(reh.end_time||'').slice(0,5)+'</td></tr><tr><td style="color:#999;">地点</td><td>'+(reh.location||'?')+'</td></tr></table>';
  html+='<div class="reh-parts-grid" id="reh-detail-grid">'+cards+'</div>';
  html+='<div style="margin-top:4px;font-size:0.8em;">已填 <strong>'+filled+'</strong>/'+allChars.length+' 人</div>';
  html+='<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-sm" style="background:#fff;border:1px solid #ef5350;color:#ef5350;" onclick="toggleSlotEdit('+rehId+')">删减角色</button><button class="btn btn-sm" style="background:var(--pink);color:#fff;" onclick="openAddCharPopup('+rehId+')">+ 添加角色</button><button class="btn btn-sm" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
}

editDancerInDetail=function(rehId,charId,cn,partId){var ncn=prompt('修改CN（留空删除）：',cn);if(ncn===null)return;if(ncn===''){if(confirm('删除？')){fetch(API+'/rehearsals/'+rehId+'/participants/'+partId,{method:'DELETE'}).then(function(){renderRehDetail(rehId);});}}else if(ncn!==cn){fetch(API+'/rehearsals/'+rehId+'/participants/'+partId,{method:'DELETE'}).then(function(){assignByName(rehId,charId,ncn);});}};
assignDancerInDetail=function(rehId,charId){var cn=prompt('指派舞见CN：');if(!cn)return;assignByName(rehId,charId,cn);};
assignByName=async function(rehId,charId,cn){
  var reh=await(await fetch(API+'/rehearsals/'+rehId)).json();var dgId=reh.dance_group_id;
  var dancerId;var dancers=await(await fetch(API+'/dancers?dance_group_id='+dgId)).json();
  var df=dancers.find(function(d){return d.cn_name===cn;});
  if(df)dancerId=df.dancer_id;
  else{var cd=await fetch(API+'/dancers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dance_group_id:dgId,cn_name:cn})});dancerId=(await cd.json()).dancer_id;}
  var pr=await fetch(API+'/rehearsals/'+rehId+'/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dancer_id:dancerId,character_id:charId})});
  if(!pr.ok){var e=await pr.json();alert(e.error);}else renderRehDetail(rehId);
};
toggleSlotEdit=function(rehId){
  var grid=document.getElementById('reh-detail-grid');if(!grid)return;
  var editing=!grid.classList.contains('editing');
  if(editing){grid.classList.add('editing');}else{grid.classList.remove('editing');}
  grid.querySelectorAll('.reh-part-card').forEach(function(card){
    if(editing){card.classList.add('shaking');card.style.cursor='pointer';
      card.onclick=function(){var cid=parseInt(card.dataset.cid);if(cid&&confirm(card.classList.contains('filled')?'移除此角色卡片？（已有舞见将被一并移除）':'移除此角色卡片？'))fetch(API+'/rehearsals/'+rehId+'/chars/'+cid,{method:'DELETE'}).then(function(){renderRehDetail(rehId);});};}
    else{card.classList.remove('shaking');card.style.cursor='';
      if(card.classList.contains('missing'))card.onclick=function(){assignDancerInDetail(rehId,parseInt(card.dataset.cid));};
      else{var p=card.querySelector('.rpc-dancer').textContent;var cid=parseInt(card.dataset.cid);card.onclick=function(){editDancerInDetail(rehId,cid,p,0);};}}
  });
  if(editing) showExcludedPicker(rehId); else {var pk=document.getElementById('excluded-picker-'+rehId);if(pk)pk.remove();}
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
reAddChar=function(rehId,charId){fetch(API+'/rehearsals/'+rehId+'/chars/'+charId,{method:'POST'}).then(function(){renderRehDetail(rehId);setTimeout(function(){toggleSlotEdit(rehId);},200);});};
addNewCharSlot=function(rehId,charId){fetch(API+'/rehearsals/'+rehId+'/slots/'+charId,{method:'POST'}).then(function(){renderRehDetail(rehId);});};

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
    recommended.forEach(function(c){html+='<div class="card" style="width:90px;padding:8px;text-align:center;cursor:pointer;" onclick="reAddChar('+rehId+','+c.character_id+');closeModal(\'modal-sub\');renderRehDetail('+rehId+')"><h3 style="font-size:0.8em;">'+c.name+'</h3><span class="tag blue">'+(c.group_name||'')+'</span></div>';});
    html+='</div>';
  }
  html+='<input type="text" id="char-search-box" placeholder="搜索其他团角色..." style="width:100%;padding:8px;border-radius:20px;border:2px solid #eee;margin-bottom:8px;" oninput="filterCharSearch()">';
  html+='<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:200px;overflow-y:auto;" id="char-search-results">';
  others.forEach(function(c){html+='<div class="char-search-item card" style="width:90px;padding:8px;text-align:center;cursor:pointer;" data-name="'+c.name+'" onclick="addNewCharSlot('+rehId+','+c.character_id+');closeModal(\'modal-sub\');renderRehDetail('+rehId+')"><h3 style="font-size:0.8em;">'+c.name+'</h3><span class="tag blue">'+(c.group_name||'')+'</span></div>';});
  html+='</div><div style="margin-top:12px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-sub\')">关闭</button></div>';
  document.getElementById('modal-sub-content').innerHTML=html;
  document.getElementById('modal-sub').classList.add('show');
};
filterCharSearch=function(){var q=(document.getElementById('char-search-box').value||'').toLowerCase();document.querySelectorAll('.char-search-item').forEach(function(el){el.style.display=el.dataset.name.toLowerCase().includes(q)?'':'none';});};

// ── Calendar
renderCalendar=async function(){renderCal('reh-calendar');};
renderHomeCalendar=async function(){renderCal('home-calendar');};
async function renderCal(calId){
  var cal=document.getElementById(calId);if(!cal)return;
  var now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var days=new Date(y,m+1,0).getDate(),first=new Date(y,m,1).getDay(),today=now.toISOString().slice(0,10);
  var ms=y+'-'+String(m+1).padStart(2,'0')+'-01',me=y+'-'+String(m+1).padStart(2,'0')+'-'+String(days).padStart(2,'0');
  var rehs=await(await fetch(API+'/rehearsals?date_from='+ms+'&date_to='+me)).json();
  var rd={},dgCol={1:'#ff8c42',2:'#42a5f5',3:'#ab47bc',4:'#66bb6a',7:'#ef5350',8:'#ffa726',9:'#78909c'};
  rehs.forEach(function(r){var d=r.rehearsal_date.slice(0,10);if(!rd[d])rd[d]=[];rd[d].push(r.dance_group_id);});
  var hd=['日','一','二','三','四','五','六'].map(function(h){return'<div class="cal-hd">'+h+'</div>';}).join('');
  var html=hd;for(var i=0;i<first;i++)html+='<div class="cal-day other"></div>';
  for(var d=1;d<=days;d++){
    var ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),cls='cal-day';
    if(ds===today)cls+=' today';if(rd[ds])cls+=' has-reh';
    var dots=(rd[ds]||[]).map(function(id){return'<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:'+(dgCol[id]||'#ccc')+';margin:0 1px;"></span>';}).join('');
    html+='<div class="'+cls+'" onclick="jumpToDate(\''+ds+'\')">'+d+(dots?'<br>'+dots:'')+'</div>';
  }
  cal.innerHTML=html;
}
jumpToDate=function(ds){document.getElementById('reh-date-from').value=ds;document.getElementById('reh-date-to').value=ds;document.getElementById('reh-show-history').checked=true;loadPerfView();};

// ── DG / Dancer management
loadDgMgmt=async function(){
  var dgs=await(await fetch(API+'/dance-groups')).json();var dgList=document.getElementById('dg-mgmt-list');if(!dgList)return;
  dgList.innerHTML=dgs.map(function(d){var logo=groupLogo[d.anime_group_id]||'';return'<div class="card" style="display:flex;align-items:center;gap:12px;padding:16px;cursor:pointer;" onclick="showDgDetail('+d.dance_group_id+')">'+(logo?'<div style="width:50px;height:50px;border-radius:10px;background-image:url('+logo+');background-size:contain;background-repeat:no-repeat;background-position:center;opacity:0.3;"></div>':'')+'<div style="flex:1;"><strong>'+d.name+'</strong>'+(d.anime_group_name?'<br><small style="color:#999;">翻跳：'+d.anime_group_name+'</small>':'')+'</div></div>';}).join('');
  var sel=document.getElementById('dancer-dg-filter');if(sel)sel.innerHTML=dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+'</option>';}).join('');
};

showDgDetail=async function(dgId){
  var dg=await(await fetch(API+'/dance-groups/'+dgId)).json();var logo=groupLogo[dg.anime_group_id]||'';
  var html='<div style="padding:12px 16px;background:linear-gradient(135deg,#ff6b9d,#e878a8);border-radius:12px;color:#fff;margin-bottom:14px;"><strong>'+dg.name+'</strong><br><span style="font-size:0.8em;opacity:0.8;">'+(dg.anime_group_name||'综合舞团')+' · '+(dg.created_date||'?')+'</span></div>';
  if(dg.dancers&&dg.dancers.length){html+='<h4>舞见('+dg.dancers.length+'人)</h4><div style="display:flex;flex-wrap:wrap;gap:6px;">';dg.dancers.forEach(function(dr){html+='<span class="tag" style="cursor:pointer;" onclick="showDancerDetail('+dr.dancer_id+')">'+dr.cn_name+'</span>';});html+='</div>';}
  if(dg.rehearsals&&dg.rehearsals.length){html+='<h4 style="margin-top:16px;color:var(--pink);">排练曲目</h4>';
    var sg={};dg.rehearsals.forEach(function(rh){var sn=(rh.content_summary||'').replace(/ (初排|复习|队形|合练|带妆|彩排|终排|排练|完整版排练|走位练习|外景排练).*/,'')||'排练';if(!sg[sn])sg[sn]=[];sg[sn].push(rh);});
    Object.entries(sg).forEach(function(e){html+='<div style="margin:12px 0 4px;padding:8px 12px;background:linear-gradient(135deg,#ff6b9d,#e878a8);border-radius:10px;color:#fff;font-size:0.9em;"><strong>曲目: '+e[0]+'</strong><span style="margin-left:8px;opacity:0.7;">'+e[1].length+'次</span></div>';e[1].forEach(function(rh){html+='<div class="rehearsal-item" style="cursor:pointer;margin-left:8px;margin-bottom:3px;border-left-color:#ff6b9d;" onclick="closeModal(\'modal-char\');showRehearsalDetail('+rh.rehearsal_id+')"><div class="info"><strong>'+(rh.stage_type||'排练')+'</strong> · '+fmtDate(rh.rehearsal_date)+' @'+rh.location+'</div><span class="count '+(rh.occupancy_status||'')+'">'+rh.current_participants+'人</span></div>';});});
  }
  html+='<div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
};

showDancerDetail=async function(dancerId){
  var dancers=await(await fetch(API+'/dancers')).json();var d=dancers.find(function(x){return x.dancer_id===dancerId;});if(!d)return;await loadDGCache();
  var html='<div style="display:flex;gap:16px;align-items:flex-start;"><div style="width:60px;height:60px;border-radius:50%;background:var(--pink-light);display:flex;align-items:center;justify-content:center;font-size:1.5em;color:var(--pink);font-weight:700;">'+d.cn_name[0]+'</div><div style="flex:1;"><h2 style="color:var(--pink);margin-bottom:2px;">'+d.cn_name+'</h2><table style="font-size:0.85em;"><tr><td style="color:#999;width:60px;">舞团</td><td>'+(dgCache[d.dance_group_id]||'?')+'</td></tr>'+(d.contact_info?'<tr><td style="color:#999;">联系</td><td>'+d.contact_info+'</td></tr>':'')+'</table></div></div><div style="margin-top:16px;text-align:right;"><button class="btn" onclick="closeModal(\'modal-char\')">关闭</button></div>';
  document.getElementById('char-detail-content').innerHTML=html;
  document.getElementById('modal-char').classList.add('show');
};

loadDancerList=async function(){
  var sel=document.getElementById('dancer-dg-filter');if(sel&&!sel.options.length){var dgs=await(await fetch(API+'/dance-groups')).json();sel.innerHTML=dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+'</option>';}).join('');}
  var dancers=await(await fetch(API+'/dancers')).json();await loadDGCache();
  var le=document.getElementById('dancer-mgmt-list');if(!le)return;
  le.innerHTML=dancers.map(function(d){return'<div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-left:4px solid '+(d.contact_info?'#ff6b9d':'#eee')+';" onclick="showDancerDetail('+d.dancer_id+')"><div><strong>'+d.cn_name+'</strong><br><small style="color:#999;">'+(dgCache[d.dance_group_id]||'?')+'</small></div><button class="btn btn-danger btn-sm" style="padding:2px 10px;font-size:0.7em;" onclick="event.stopPropagation();deleteDancer('+d.dancer_id+')">×</button></div>';}).join('');
};

addDanceGroup=async function(){var n=document.getElementById('dg-new-name').value.trim();if(!n)return;await fetch(API+'/dance-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})});document.getElementById('dg-new-name').value='';loadDgMgmt();};
addDancer=async function(){var cn=document.getElementById('dancer-new-cn').value.trim();var dgId=document.getElementById('dancer-dg-filter').value;if(!cn||!dgId)return;var c=document.getElementById('dancer-new-contact').value.trim();await fetch(API+'/dancers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dance_group_id:parseInt(dgId),cn_name:cn,contact_info:c||null})});document.getElementById('dancer-new-cn').value='';loadDancerList();};
deleteDancer=async function(id){if(!confirm('删除?'))return;await fetch(API+'/dancers/'+id,{method:'DELETE'});loadDancerList();};

// ── Rehearsal add form
async function openAddRehearsal(){
  document.getElementById('modal-rehearsal').classList.add('show');
  document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
  ['f-max','f-char','f-cns'].forEach(function(id){var el=document.getElementById(id);if(el){el.style.display='none';if(el.previousElementSibling)el.previousElementSibling.style.display='none';}});
  var dr=await fetch(API+'/dance-groups');var dgs=await dr.json();
  var sel=document.getElementById('f-dg-sel');
  sel.innerHTML='<option value="">选择舞团...</option>'+dgs.map(function(d){return'<option value="'+d.dance_group_id+'">'+d.name+(d.anime_group_name?' ('+d.anime_group_name+')':'')+'</option>';}).join('');
  sel.value='';document.getElementById('f-dg-new').value='';
}
onDgPick=async function(){
  var id=document.getElementById('f-dg-sel').value;
  document.getElementById('f-dg-new').style.display=id?'none':'block';
  if(id){
    var songs=await(await fetch(API+'/songs?dance_group_id='+id)).json();
    var sel=document.getElementById('f-song');
    sel.innerHTML='<option value="">新建曲目...</option>'+songs.map(function(s){return'<option value="'+s.name+'">'+s.name+'</option>';}).join('');
  }
};
async function addRehearsal(e){
  e.preventDefault();
  var selId=document.getElementById('f-dg-sel').value;
  var newName=document.getElementById('f-dg-new').value.trim();
  var dgId;
  if(selId){dgId=parseInt(selId);}
  else if(newName){
    var dgs=await(await fetch(API+'/dance-groups')).json();
    var match=dgs.find(function(d){return d.name===newName;});
    if(match)dgId=match.dance_group_id;
    else{var cr=await fetch(API+'/dance-groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newName})});dgId=(await cr.json()).dance_group_id;}
  }else{alert('请选择或输入舞团');return;}
  var songName=document.getElementById('f-song').value.trim();
  var stage=document.getElementById('f-stage').value;
  var content=(songName||'排练')+' '+stage+(document.getElementById('f-desc').value?' · '+document.getElementById('f-desc').value:'');
  var rehRes=await fetch(API+'/rehearsals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dance_group_id:dgId,rehearsal_date:document.getElementById('f-date').value,start_time:document.getElementById('f-start').value,end_time:document.getElementById('f-end').value,location:document.getElementById('f-loc').value,content_summary:content,stage_type:stage})});
  if(!rehRes.ok){var err=await rehRes.json();alert(err.error);return;}
  closeModal('modal-rehearsal');document.getElementById('form-rehearsal').reset();document.getElementById('f-dg-new').value='';loadPerfView();
}
function closeModal(id){document.getElementById(id).classList.remove('show');}

// ── Event bindings
function safeOn(id,ev,fn){var el=document.getElementById(id);if(el)el.addEventListener(ev,fn);}
safeOn('group-filter-project','change',loadGroups);
safeOn('char-search','input',loadCharacters);
safeOn('char-filter-age','change',loadCharacters);
safeOn('reh-filter-status','change',loadPerfView);
safeOn('reh-date-from','change',loadPerfView);
safeOn('reh-date-to','change',loadPerfView);
['modal-rehearsal','modal-char','modal-sub'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',function(e){if(e.target===this)closeModal(id);});});

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
