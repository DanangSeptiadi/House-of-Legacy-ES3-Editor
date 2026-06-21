// ── Generic table renderer ───────────────────────────────────────
function renderTable(cid,heads,rows,rowFn){
  const c=$(cid);
  if(!rows?.length){c.innerHTML='<p class="empty">No data. Load a save or add entries above.</p>';return;}
  c.innerHTML=`<div class="tbl-wrap"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr>${rowFn(r,i)}</td>`).join('')}</tbody></table></div>`;
}

// ── Game data form ────────────────────────────────────────────────
function renderGameData(){
  if(!S)return;
  const cg=S.CGNum?.value||['0','0'],fam=S.FamilyData?.value||['','Yu','1','0'],tm=S.Time_now?.value||[1,1,7];
  $('gameForm').innerHTML=[
    ['💰 Gold','number','gold',String(cg[0]||'0')],
    ['💎 Ingots','number','ingot',String(cg[1]||'0')],
    ['🏠 Family Name','text','fname',fam[1]||'Yu'],
    ['📈 Family Level','number','flevel',String(fam[2]||'1')],
    ['⭐ Reputation','number','frep',String(fam[3]||'0')],
    ['📅 Year','number','year',tm[2]],
    ['🌙 Month','number','month',tm[1]],
    ['☀️ Day','number','day',tm[0]]
  ].map(([label,type,id,val])=>`<div class="field"><label>${label}</label><input type="${type}" id="g_${id}" value="${esc(val)}"></div>`).join('');
}

// ── Members table ─────────────────────────────────────────────────
function renderMembers(){
  renderTable('memberTbl',['ID','Name','Gender','Age','HP','Mood','Stam','Renown','Charm','Luck','Lit','Mar','Com','Art','Cun','Exam','School','Talent','TalVal','Skill','SkVal','Hobby'],
    S?.Member_now?.value,(m,i)=>{
      const f=parseF4(m[MI.f4]),t='member';
      return `${td(m[MI.id],t,i,'id')}${td(f.name,t,i,'name')}${tds(OPT.gender,f.gender,t,i,'gender')}${td(m[MI.age]||'21',t,i,'age','number')}${td(m[MI.health]||'100',t,i,'health','number')}${td(m[MI.mood]||'80',t,i,'mood','number')}${td(m[MI.stamina]||'100',t,i,'stamina','number')}${td(m[MI.rep]||'0',t,i,'rep','number')}${td(m[MI.charm]||'0',t,i,'charm','number')}${td(f.luck,t,i,'luck','number')}${td(m[MI.lit]||'0',t,i,'lit','number')}${td(m[MI.mar]||'0',t,i,'mar','number')}${td(m[MI.com]||'0',t,i,'com','number')}${td(m[MI.art]||'0',t,i,'art','number')}${td(m[MI.cunning]||'0',t,i,'cunning','number')}${tds(OPT.exam,m[MI.examTitle]||'0',t,i,'examTitle')}${tds(OPT.school,m[MI.school]||'0',t,i,'school')}${tds(OPT.talent,f.talentType,t,i,'talentType')}${td(f.talentVal,t,i,'talentVal','number')}${tds(OPT.skill,f.skillType,t,i,'skillType')}${td(m[MI.skillVal]||'0',t,i,'skillVal','number')}${tds(OPT.hobby,f.hobby,t,i,'hobby')}${del(t,i)}`;
    });
}

// ── Spouses table ─────────────────────────────────────────────────
function renderSpouses(){
  renderTable('spouseTbl',['ID','Portrait','Name','Partner','Age','Health','Stamina','Mood','Renown','Charm','Luck','Lit','Mar','Com','Art','Cunning','SkVal','Relation','Hobby','Talent','TalVal','Skill'],
    S?.Member_qu?.value,(s,i)=>{
      const f=parseF4(s[SI.f4]),t='spouse';
      return `${td(s[SI.id],t,i,'id')}${td(s[SI.portrait]||defaultPortrait,t,i,'portrait')}${td(f.name,t,i,'name')}${td(getPipe(s[SI.f4],9),t,i,'partnerId')}${td(s[SI.age]||'18',t,i,'age','number')}${td(s[SI.health]||'100',t,i,'health','number')}${td(s[SI.stamina]||'100',t,i,'stamina','number')}${td(s[SI.mood]||'80',t,i,'mood','number')}${td(s[SI.rep]||'0',t,i,'rep','number')}${td(s[SI.charm]||'0',t,i,'charm','number')}${td(f.luck,t,i,'luck','number')}${td(s[SI.lit]||'0',t,i,'lit','number')}${td(s[SI.mar]||'0',t,i,'mar','number')}${td(s[SI.com]||'0',t,i,'com','number')}${td(s[SI.art]||'0',t,i,'art','number')}${td(s[SI.cunning]||'0',t,i,'cunning','number')}${td(s[SI.skillVal]||'0',t,i,'skillVal','number')}${td(s[SI.relation]||'0',t,i,'relation','number')}${tds(OPT.hobby,f.hobby,t,i,'hobby')}${tds(OPT.talent,f.talentType,t,i,'talentType')}${td(f.talentVal,t,i,'talentVal','number')}${tds(OPT.skill,f.skillType,t,i,'skillType')}${del(t,i)}`;
    });
}

// ── Retainers table ───────────────────────────────────────────────
function renderRetainers(){
  renderTable('retainerTbl',['ID','Portrait','Name','Gender','Age','HP','Stam','Mood','Renown','Charm','Luck','Lit','Mar','Com','Art','Cun','Fee','Talent','TalVal','Skill','SpecialTag'],
    S?.MenKe_Now?.value,(r,i)=>{
      const f=parseF4(r[RI.nl]),t='retainer';
      return `${td(r[RI.id],t,i,'id')}${td(r[RI.portrait]||defaultPortrait,t,i,'portrait')}${td(f.name,t,i,'name')}${tds(OPT.gender,f.gender,t,i,'gender')}${td(r[RI.age]||'21',t,i,'age','number')}${td(r[RI.health]||'100',t,i,'health','number')}${td(r[RI.stamina]||'100',t,i,'stamina','number')}${td(r[RI.mood]||'50',t,i,'mood','number')}${td(r[RI.rep]||'0',t,i,'rep','number')}${td(r[RI.charm]||'0',t,i,'charm','number')}${td(f.luck,t,i,'luck','number')}${td(r[RI.lit]||'0',t,i,'lit','number')}${td(r[RI.mar]||'0',t,i,'mar','number')}${td(r[RI.com]||'0',t,i,'com','number')}${td(r[RI.art]||'0',t,i,'art','number')}${td(r[RI.cunning]||'0',t,i,'cunning','number')}${td(r[RI.fee]||'0',t,i,'fee','number')}${tds(OPT.talent,f.talentType,t,i,'talentType')}${td(f.talentVal,t,i,'talentVal','number')}${tds(OPT.skill,f.skillType,t,i,'skillType')}${td(r[RI.specialTag]||'',t,i,'specialTag')}${del(t,i)}`;
    });
}

// ── Horses table ──────────────────────────────────────────────────
function renderHorses(){
  renderTable('horseTbl',['Color','Age','Lifespan','Power','Speed','Smart','Owner'],
    S?.Horse_Have?.value,(h,i)=>{
      while(h.length<7)h.push('0');const t='horse';
      return `${tds(OPT.horse,h[0],t,i,'0')}${td(h[1],t,i,'1','number')}${td(h[2],t,i,'2','number')}${td(h[3],t,i,'3','number')}${td(h[4],t,i,'4','number')}${td(h[5],t,i,'5','number')}${td(h[6],t,i,'6')}${del(t,i)}`;
    });
}

// ── Inventory table ────────────────────────────────────────────────
function renderInventory(){
  renderTable('inventoryTbl',['Item ID','Quantity'],
    S?.Prop_have?.value,(item,i)=>`${td(item[0],'inv',i,'0','number')}${td(item[1],'inv',i,'1','number')}${del('inv',i)}`);
}

// ── Tab layout initialisation ─────────────────────────────────────
(function initLayout(){
  const tabsEl=$('tabs'),panelsEl=$('panels');
  TABS.forEach(({id,label,html},i)=>{
    const btn=Object.assign(document.createElement('button'),{className:'tab'+(i?'':' active'),textContent:label});
    btn.dataset.tab=id;
    tabsEl.appendChild(btn);
    const pane=Object.assign(document.createElement('div'),{id:id+'-pane',className:'pane'+(i?'':' active'),innerHTML:html});
    panelsEl.appendChild(pane);
  });
  tabsEl.addEventListener('click',e=>{
    const btn=e.target.closest('.tab');
    if(!btn)return;
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab+'-pane').classList.add('active');
  });
})();

// ── Render everything ─────────────────────────────────────────────
function renderAll(){
  renderGameData();
  renderMembers();
  renderSpouses();
  renderRetainers();
  renderInventory();
  renderHorses();
}
