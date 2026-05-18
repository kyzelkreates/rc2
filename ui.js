const NAV = [
  { id:"dashboard",   icon:"🏠", label:"Dashboard" },
  { id:"passwords",   icon:"🔑", label:"Passwords" },
  { id:"notes",       icon:"📝", label:"Notes" },
  { id:"documents",   icon:"📄", label:"Documents" },
  { id:"emails",      icon:"📧", label:"Email Hub" },
  { id:"youtube",     icon:"▶️",  label:"YouTube Studio" },
  { id:"social",      icon:"📱", label:"Social Center" },
  { id:"ai",          icon:"🤖", label:"AI Workspace" },
  { id:"business",    icon:"💼", label:"Business" },
  { id:"content",     icon:"✨", label:"Content Studio" },
  { id:"brands",      icon:"🎨", label:"Brand Vault" },
  { id:"repocleaner", icon:"🔐", label:"Repo Cleaner" },
  { id:"devices",     icon:"💻", label:"Devices" },
  { id:"settings",    icon:"⚙️",  label:"Settings" },
];

const ui = {
  app: document.getElementById("app"),

  renderLogin() {
    this.app.innerHTML = `
    <div class="login-wrap">
      <div class="glass fade-in" style="border-radius:28px;padding:36px;width:100%;max-width:420px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:52px;margin-bottom:12px;">🔐</div>
          <h1 style="font-size:26px;font-weight:900;margin:0 0 6px">Private AI Digital Vault OS</h1>
          <p style="color:#64748b;font-size:14px;margin:0">Secure intelligent digital operating system</p>
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:7px;">Master Password</label>
          <input id="loginPass" type="password" class="inp" placeholder="Enter your master password…" onkeydown="if(event.key==='Enter')appController.handleLogin()" style="font-size:16px;padding:13px 16px;"/>
        </div>
        <button onclick="appController.handleLogin()" class="btn btn-primary" style="width:100%;padding:13px;font-size:15px;border-radius:14px;margin-top:4px;">
          Unlock Vault
        </button>
        <p style="text-align:center;font-size:11px;color:#334155;margin-top:16px;">
          First time? Set any password — it becomes your master key.
        </p>
      </div>
    </div>`;
  },

  renderShell(state, activeModule) {
    const ws = state.currentWorkspace;
    this.app.innerHTML = `
    <div id="app-inner" style="height:100vh;display:flex;flex-direction:column;">

      <!-- Top bar -->
      <div class="topbar">
        <button id="sidebar-toggle" onclick="ui.toggleSidebar()" style="display:none;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;">☰</button>
        <span style="font-size:18px;font-weight:800;flex:1;">🔐 Vault OS</span>
        <span class="ws-badge pill-purple">${ws}</span>
        <button onclick="appController.lock()" class="btn btn-danger btn-sm" style="margin-left:8px;">🔒 Lock</button>
      </div>

      <div style="flex:1;display:flex;overflow:hidden;position:relative;">

        <!-- Sidebar overlay (mobile) -->
        <div class="sidebar-overlay" id="sidebar-overlay" onclick="ui.closeSidebar()"></div>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div style="padding:14px 12px 8px;">
            <div class="inp" style="padding:8px 12px;display:flex;align-items:center;gap:8px;">
              <span style="color:#64748b;">🔍</span>
              <input oninput="appController.globalSearch(this.value)" placeholder="Search everything…" style="background:none;border:none;outline:none;color:#e2e8f0;font-size:13px;width:100%;"/>
            </div>
          </div>

          <div class="section-title">Navigation</div>
          <div style="padding:0 8px;">
            ${NAV.map(n=>`
            <button class="nav-btn ${activeModule===n.id?'active':''}" onclick="appController.switchModule('${n.id}');ui.closeSidebar()">
              <span class="icon">${n.icon}</span>${n.label}
            </button>`).join('')}
          </div>

          <div style="margin-top:auto;padding:12px;">
            <div class="section-title" style="padding:0 0 6px;">Workspace</div>
            <select class="inp" onchange="appController.switchWorkspace(this.value)" style="margin-bottom:0;">
              ${Object.keys(state.workspaces).map(k=>`<option${k===ws?' selected':''}>${k}</option>`).join('')}
            </select>
          </div>
        </aside>

        <!-- Main -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
          <div class="main-scroll" id="moduleRoot"></div>
        </div>

      </div>
    </div>
    <div id="toast"></div>
    <div class="modal-bg" id="modal">
      <div class="modal-box">
        <h3 id="modal-title"></h3>
        <p id="modal-desc"></p>
        <div style="margin-bottom:14px;">
          <label style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:6px;">Type <strong id="modal-word"></strong> to confirm</label>
          <input type="text" id="modal-input" class="inp" oninput="ui.checkModal()" placeholder=""/>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-ghost" style="flex:1;" onclick="ui.closeModal()">Cancel</button>
          <button class="btn btn-danger" style="flex:1;" id="modal-confirm" disabled onclick="ui.confirmModal()">Confirm</button>
        </div>
      </div>
    </div>`;

    // Show hamburger on mobile
    if (window.innerWidth <= 700) {
      document.getElementById('sidebar-toggle').style.display = 'block';
    }
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  },
  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
  },

  // Modal
  _modalCb: null,
  openModal(title, desc, word, cb) {
    this._modalCb = cb;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-desc').textContent = desc;
    document.getElementById('modal-word').textContent = word;
    document.getElementById('modal-input').value = '';
    document.getElementById('modal-confirm').disabled = true;
    document.getElementById('modal').classList.add('open');
    setTimeout(()=>document.getElementById('modal-input').focus(),80);
  },
  checkModal() {
    const w = document.getElementById('modal-word').textContent;
    document.getElementById('modal-confirm').disabled = document.getElementById('modal-input').value !== w;
  },
  confirmModal() {
    this.closeModal();
    if (this._modalCb) this._modalCb();
  },
  closeModal() {
    document.getElementById('modal')?.classList.remove('open');
    this._modalCb = null;
  },

  // Toast
  _toastTimer: null,
  toast(msg, type='') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg; el.className = 'show ' + type;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(()=>{ el.className=''; }, 3000);
  }
};
