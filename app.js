// ─── In-memory RC state (tokens never hit localStorage) ───────────────────────
let _rcGhToken = '';
let _rcVcToken = '';
let _rcRepos = [];
let _rcProjects = [];
let _rcDeploys = [];
let _rcLoading = false;
let _rcTab = 'repos';

// ─── GitHub API ───────────────────────────────────────────────────────────────
async function ghFetch(path, opts={}) {
  const res = await fetch('https://api.github.com'+path, {
    ...opts,
    headers: {
      Authorization: 'Bearer '+_rcGhToken,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body?{'Content-Type':'application/json'}:{}),
      ...(opts.headers||{})
    }
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.message||res.statusText); }
  if (res.status===204) return null;
  return res.json();
}
async function ghAllRepos() {
  let all=[],p=1;
  while(true){ const d=await ghFetch(`/user/repos?per_page=100&page=${p}&sort=updated&affiliation=owner`); all=all.concat(d); if(d.length<100) break; p++; }
  return all;
}

// ─── Vercel API ───────────────────────────────────────────────────────────────
async function vcFetch(path, opts={}) {
  const res = await fetch('https://api.vercel.com'+path, {
    ...opts, headers:{ Authorization:'Bearer '+_rcVcToken, ...(opts.headers||{}) }
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||res.statusText); }
  if (res.status===204) return null;
  return res.json();
}
async function vcAllProjects() {
  let all=[],until; while(true){ const d=await vcFetch('/v9/projects?limit=100'+(until?'&until='+until:'')); all=all.concat(d.projects); if(!d.pagination?.next||!d.projects.length) break; until=d.pagination.next; } return all;
}
async function vcAllDeploys() {
  let all=[],until; while(true){ const d=await vcFetch('/v6/deployments?limit=100'+(until?'&until='+until:'')); all=all.concat(d.deployments); if(!d.pagination?.next||!d.deployments.length) break; until=d.pagination.next; } return all;
}

// ─── App controller ───────────────────────────────────────────────────────────
const appController = {
  currentModule: 'dashboard',

  boot() {
    const session = storage.session.get();
    if (session?.authenticated) { this.render(); }
    else { ui.renderLogin(); }
  },

  handleLogin() {
    const pw = document.getElementById('loginPass')?.value||'';
    if (!pw) { ui.toast('Enter a password','err'); return; }
    let state = storage.get();
    if (!state.auth.passwordHash) {
      state.auth.passwordHash = CryptoJS.SHA256(pw).toString();
      storage.set(state);
    }
    if (CryptoJS.SHA256(pw).toString() !== state.auth.passwordHash) { ui.toast('Wrong password','err'); return; }
    storage.session.set({ authenticated: true });
    this.render();
  },

  render() {
    const state = this._stateWithRC();
    ui.renderShell(state, this.currentModule);
    this.renderModule();
  },

  renderModule() {
    const root = document.getElementById('moduleRoot');
    if (!root) return;
    const state = this._stateWithRC();
    root.innerHTML = modules[this.currentModule]
      ? modules[this.currentModule](state)
      : '<div style="color:#64748b;padding:40px;text-align:center;">Module not found</div>';
  },

  // Merge in-memory RC data into state for rendering (never persisted)
  _stateWithRC() {
    const s = storage.get();
    s._rcGhToken = _rcGhToken;
    s._rcVcToken = _rcVcToken;
    s._rcRepos = _rcRepos;
    s._rcProjects = _rcProjects;
    s._rcDeploys = _rcDeploys;
    s._rcLoading = _rcLoading;
    s._rcTab = _rcTab;
    return s;
  },

  switchModule(name) { this.currentModule = name; this.render(); },
  switchWorkspace(name) { storage.update(s=>{ s.currentWorkspace=name; }); this.render(); },
  lock() { storage.session.clear(); _rcGhToken=''; _rcVcToken=''; ui.renderLogin(); },

  // ── Passwords
  addPassword() {
    const t=document.getElementById('pwTitle')?.value?.trim();
    const u=document.getElementById('pwUser')?.value?.trim();
    const p=document.getElementById('pwPass')?.value?.trim();
    if (!t||!p) { ui.toast('Title and password required','err'); return; }
    storage.update(s=>{ s.passwords.unshift({title:t,username:u,password:p}); s.activity.unshift({text:`Added password: ${t}`,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Password saved','ok');
  },
  deletePassword(i) {
    ui.openModal('Delete Password?','This cannot be undone.','DELETE',()=>{
      storage.update(s=>{ s.passwords.splice(i,1); });
      this.renderModule(); ui.toast('Deleted','ok');
    });
  },

  // ── Notes
  addNote() {
    const t=document.getElementById('noteTitle')?.value?.trim();
    const b=document.getElementById('noteBody')?.value?.trim();
    if (!t) { ui.toast('Title required','err'); return; }
    storage.update(s=>{ s.notes.unshift({title:t,body:b,date:new Date().toISOString()}); s.activity.unshift({text:`Added note: ${t}`,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Note saved','ok');
  },
  deleteNote(i) {
    ui.openModal('Delete Note?','This cannot be undone.','DELETE',()=>{
      storage.update(s=>{ s.notes.splice(i,1); });
      this.renderModule(); ui.toast('Deleted','ok');
    });
  },

  // ── Documents
  addDocument() {
    const t=document.getElementById('docTitle')?.value?.trim();
    const b=document.getElementById('docBody')?.value?.trim();
    if (!t) { ui.toast('Title required','err'); return; }
    storage.update(s=>{ s.documents.unshift({title:t,body:b,date:new Date().toISOString()}); s.activity.unshift({text:`Added document: ${t}`,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Document saved','ok');
  },
  deleteDocument(i) {
    ui.openModal('Delete Document?','This cannot be undone.','DELETE',()=>{
      storage.update(s=>{ s.documents.splice(i,1); });
      this.renderModule(); ui.toast('Deleted','ok');
    });
  },

  // ── YouTube
  addYouTubeItem() {
    const text=document.getElementById('ytText')?.value?.trim();
    const type=document.getElementById('ytType')?.value;
    if (!text) { ui.toast('Enter some text','err'); return; }
    storage.update(s=>{ s.youtubeData.unshift({text,type,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Saved','ok');
  },
  deleteYouTubeItem(i) { storage.update(s=>{ s.youtubeData.splice(i,1); }); this.renderModule(); },

  // ── AI Memory
  addAIMemory() {
    const text=document.getElementById('aiPromptInput')?.value?.trim();
    if (!text) return;
    storage.update(s=>{ s.aiMemory.unshift({text,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Prompt saved','ok');
  },
  deleteAIMemory(i) { storage.update(s=>{ s.aiMemory.splice(i,1); }); this.renderModule(); },

  // ── Business
  addClient() {
    const name=document.getElementById('clientName')?.value?.trim();
    const email=document.getElementById('clientEmail')?.value?.trim();
    if (!name) { ui.toast('Name required','err'); return; }
    storage.update(s=>{ s.clients.unshift({name,email,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Client added','ok');
  },
  deleteClient(i) { storage.update(s=>{ s.clients.splice(i,1); }); this.renderModule(); },
  addDomain() {
    const name=document.getElementById('domainName')?.value?.trim();
    const expiry=document.getElementById('domainExpiry')?.value;
    if (!name) { ui.toast('Domain required','err'); return; }
    storage.update(s=>{ s.domains.unshift({name,expiry,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Domain added','ok');
  },
  deleteDomain(i) { storage.update(s=>{ s.domains.splice(i,1); }); this.renderModule(); },

  // ── Content
  addContentIdea() {
    const title=document.getElementById('ideaTitle')?.value?.trim();
    const platform=document.getElementById('ideaPlatform')?.value;
    if (!title) { ui.toast('Title required','err'); return; }
    storage.update(s=>{ s.contentIdeas.unshift({title,platform,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Idea saved','ok');
  },
  deleteContentIdea(i) { storage.update(s=>{ s.contentIdeas.splice(i,1); }); this.renderModule(); },

  // ── Brands
  addBrand() {
    const name=document.getElementById('brandName')?.value?.trim();
    const color=document.getElementById('brandColor')?.value?.trim();
    const font=document.getElementById('brandFont')?.value?.trim();
    if (!name) { ui.toast('Brand name required','err'); return; }
    storage.update(s=>{ s.brandAssets.unshift({name,color,font,date:new Date().toISOString()}); });
    this.renderModule(); ui.toast('Brand saved','ok');
  },
  deleteBrand(i) { storage.update(s=>{ s.brandAssets.splice(i,1); }); this.renderModule(); },

  // ── Repo Cleaner
  async rcLoadTokens() {
    const gh=document.getElementById('rcGhToken')?.value?.trim();
    const vc=document.getElementById('rcVcToken')?.value?.trim();
    if (!gh) { ui.toast('GitHub token required','err'); return; }
    _rcGhToken=gh; _rcVcToken=vc; _rcTab='repos';
    await this.rcRefresh();
  },
  async rcRefresh() {
    if (!_rcGhToken) { ui.toast('Load tokens first','err'); return; }
    _rcLoading=true; this.renderModule();
    try {
      _rcRepos = await ghAllRepos();
      if (_rcVcToken) { [_rcProjects,_rcDeploys]=await Promise.all([vcAllProjects(),vcAllDeploys()]); }
      ui.toast('Loaded!','ok');
    } catch(e) { ui.toast('Error: '+e.message,'err'); }
    _rcLoading=false; this.renderModule();
  },
  rcClear() { _rcGhToken=''; _rcVcToken=''; _rcRepos=[]; _rcProjects=[]; _rcDeploys=[]; this.renderModule(); },
  rcTab(t) { _rcTab=t; this.renderModule(); },
  rcArchiveRepo(i) {
    const r=_rcRepos[i];
    ui.openModal(`Archive ${r.name}?`,'Repo will be archived on GitHub.','ARCHIVE',async()=>{
      try { await ghFetch(`/repos/${r.owner.login}/${r.name}`,{method:'PATCH',body:JSON.stringify({archived:true})}); _rcRepos[i]={..._rcRepos[i],archived:true}; this.renderModule(); ui.toast('Archived','ok'); }
      catch(e) { ui.toast('Error: '+e.message,'err'); }
    });
  },
  rcDeleteRepo(i) {
    const r=_rcRepos[i];
    ui.openModal(`Delete ${r.name}?`,'⚠️ Permanently deletes the repo. Cannot be undone.','DELETE',async()=>{
      try { await ghFetch(`/repos/${r.owner.login}/${r.name}`,{method:'DELETE'}); _rcRepos.splice(i,1); this.renderModule(); ui.toast('Deleted','ok'); }
      catch(e) { ui.toast('Error: '+e.message,'err'); }
    });
  },
  rcDeleteProject(i) {
    const p=_rcProjects[i];
    ui.openModal(`Delete project ${p.name}?`,'Removes the Vercel project permanently.','DELETE',async()=>{
      try { await vcFetch(`/v9/projects/${p.id}`,{method:'DELETE'}); _rcProjects.splice(i,1); this.renderModule(); ui.toast('Deleted','ok'); }
      catch(e) { ui.toast('Error: '+e.message,'err'); }
    });
  },
  rcDeleteDeploy(i) {
    const d=_rcDeploys[i];
    ui.openModal('Delete deployment?','Removes this deployment from Vercel.','DELETE',async()=>{
      try { await vcFetch(`/v13/deployments/${d.uid}`,{method:'DELETE'}); _rcDeploys.splice(i,1); this.renderModule(); ui.toast('Deleted','ok'); }
      catch(e) { ui.toast('Error: '+e.message,'err'); }
    });
  },

  // ── Settings
  changePassword() {
    const np=prompt('New master password:');
    if (!np) return;
    storage.update(s=>{ s.auth.passwordHash=CryptoJS.SHA256(np).toString(); });
    ui.toast('Password changed','ok');
  },
  exportData() {
    const data=JSON.stringify(storage.get(),null,2);
    const blob=new Blob([data],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='vault-os-backup.json'; a.click(); url=a.href; URL.revokeObjectURL(a.href);
    ui.toast('Exported!','ok');
  },
  importData() {
    const input=document.createElement('input'); input.type='file'; input.accept='.json';
    input.onchange=e=>{
      const file=e.target.files[0];
      if (!file) return;
      const reader=new FileReader();
      reader.onload=ev=>{ try { const d=JSON.parse(ev.target.result); storage.set(d); this.render(); ui.toast('Imported!','ok'); } catch { ui.toast('Invalid file','err'); } };
      reader.readAsText(file);
    };
    input.click();
  },
  clearAllData() {
    ui.openModal('Wipe ALL data?','This permanently deletes everything in the vault.','WIPE',()=>{
      localStorage.removeItem('vault_os_v2'); sessionStorage.clear(); location.reload();
    });
  },

  globalSearch(q) {
    if (!q) return;
    const s=storage.get();
    const results=[
      ...s.passwords.filter(x=>x.title.toLowerCase().includes(q.toLowerCase())).map(x=>({type:'password',label:x.title})),
      ...s.notes.filter(x=>x.title.toLowerCase().includes(q.toLowerCase())).map(x=>({type:'note',label:x.title})),
    ];
    if (results.length) ui.toast(`Found ${results.length} result(s): ${results[0].label}`,'ok');
    else ui.toast('No results','warn');
  }
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
appController.boot();
