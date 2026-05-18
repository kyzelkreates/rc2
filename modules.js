// ─── helpers ─────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return 'never';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff/86400000);
  if (days < 1) return 'today'; if (days===1) return 'yesterday';
  if (days < 30) return days+'d ago'; if (days < 365) return Math.floor(days/30)+'mo ago';
  return Math.floor(days/365)+'y ago';
}
function fmtSize(kb) { if (!kb) return '0 KB'; if (kb<1024) return kb+' KB'; return (kb/1024).toFixed(1)+' MB'; }
function esc(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function isInactive(r) { const d=new Date(); d.setDate(d.getDate()-90); return new Date(r.updated_at)<d; }

// ─── modules object ───────────────────────────────────────────────────────────
const modules = {

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  dashboard(state) {
    const counts = [
      { n: state.passwords.length,    l: 'Passwords',    i: '🔑' },
      { n: state.notes.length,        l: 'Notes',        i: '📝' },
      { n: state.documents.length,    l: 'Documents',    i: '📄' },
      { n: state.contentIdeas.length, l: 'Content Ideas',i: '✨' },
      { n: state.clients.length,      l: 'Clients',      i: '🤝' },
      { n: state.domains.length,      l: 'Domains',      i: '🌐' },
    ];
    return `
    <div class="fade-in">
      <h2 style="font-size:22px;font-weight:800;margin:0 0 16px;">👋 Welcome back</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
        ${counts.map(c=>`
        <div class="stat-card module-card">
          <div style="font-size:20px;margin-bottom:6px;">${c.i}</div>
          <div class="stat-num">${c.n}</div>
          <div class="stat-label">${c.l}</div>
        </div>`).join('')}
      </div>
      <div class="glass" style="border-radius:20px;padding:20px;">
        <h3 style="font-size:15px;font-weight:700;margin:0 0 12px;">🕐 Recent Activity</h3>
        ${state.activity.length ? state.activity.slice(0,8).map(a=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);">
            <span style="color:#64748b;font-size:12px;">${timeAgo(a.date)}</span>
            <span style="font-size:13px;">${esc(a.text)}</span>
          </div>`).join('') :
          '<p style="color:#64748b;font-size:13px;">No activity yet — start adding data!</p>'
        }
      </div>
    </div>`;
  },

  // ── PASSWORDS ──────────────────────────────────────────────────────────────
  passwords(state) {
    return `
    <div class="fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 style="font-size:20px;font-weight:800;margin:0;">🔑 Password Vault</h2>
        <span class="pill pill-purple">${state.passwords.length} saved</span>
      </div>
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <input id="pwTitle" class="inp" placeholder="Website / App" style="flex:1;min-width:120px;"/>
          <input id="pwUser"  class="inp" placeholder="Username / Email" style="flex:1;min-width:120px;"/>
          <input id="pwPass"  class="inp" placeholder="Password" style="flex:1;min-width:120px;"/>
          <button onclick="appController.addPassword()" class="btn btn-primary">+ Add</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${state.passwords.length===0 ? '<div style="text-align:center;padding:40px;color:#64748b;">No passwords saved yet</div>' :
          state.passwords.map((p,i)=>`
          <div class="glass module-card" style="border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:14px;">${esc(p.title)}</div>
              <div style="color:#64748b;font-size:12px;">${esc(p.username)}</div>
            </div>
            <button onclick="navigator.clipboard.writeText('${esc(p.password)}');ui.toast('Copied!','ok')" class="btn btn-ghost btn-sm">📋 Copy</button>
            <button onclick="appController.deletePassword(${i})" class="btn btn-danger btn-sm">🗑</button>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── NOTES ──────────────────────────────────────────────────────────────────
  notes(state) {
    return `
    <div class="fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 style="font-size:20px;font-weight:800;margin:0;">📝 Notes</h2>
        <button onclick="appController.addNote()" class="btn btn-primary btn-sm">+ New Note</button>
      </div>
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <input id="noteTitle" class="inp" placeholder="Note title" style="margin-bottom:10px;"/>
        <textarea id="noteBody" class="inp" rows="4" placeholder="Write your note…" style="resize:vertical;"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
        ${state.notes.length===0 ? '<div style="color:#64748b;font-size:13px;">No notes yet</div>' :
          state.notes.map((n,i)=>`
          <div class="glass module-card" style="border-radius:16px;padding:16px;">
            <div style="font-weight:700;margin-bottom:6px;">${esc(n.title)}</div>
            <div style="color:#94a3b8;font-size:13px;line-height:1.5;max-height:80px;overflow:hidden;">${esc(n.body)}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
              <span style="color:#64748b;font-size:11px;">${timeAgo(n.date)}</span>
              <button onclick="appController.deleteNote(${i})" class="btn btn-danger btn-xs">🗑</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── DOCUMENTS ──────────────────────────────────────────────────────────────
  documents(state) {
    return `
    <div class="fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 style="font-size:20px;font-weight:800;margin:0;">📄 Document Vault</h2>
        <span class="pill pill-purple">${state.documents.length} docs</span>
      </div>
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <input id="docTitle" class="inp" placeholder="Document title" style="margin-bottom:10px;"/>
        <textarea id="docBody" class="inp" rows="5" placeholder="Paste or write document content…" style="resize:vertical;"></textarea>
        <div style="margin-top:10px;"><button onclick="appController.addDocument()" class="btn btn-primary btn-sm">+ Save Document</button></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${state.documents.length===0 ? '<div style="color:#64748b;text-align:center;padding:32px;">No documents yet</div>' :
          state.documents.map((d,i)=>`
          <div class="glass module-card" style="border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:22px;">📄</span>
            <div style="flex:1;">
              <div style="font-weight:700;">${esc(d.title)}</div>
              <div style="color:#64748b;font-size:12px;">${timeAgo(d.date)} · ${d.body.length} chars</div>
            </div>
            <button onclick="appController.deleteDocument(${i})" class="btn btn-danger btn-sm">🗑</button>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── EMAILS ─────────────────────────────────────────────────────────────────
  emails() {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">📧 Email Hub</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
        ${[
          {i:'📥',t:'VIP Inbox',d:'Your most important emails'},
          {i:'🤖',t:'AI Summaries',d:'Auto-summarized threads'},
          {i:'📎',t:'Attachments',d:'All files in one place'},
          {i:'📤',t:'Drafts',d:'Saved email drafts'},
          {i:'🗑️',t:'Spam Filter',d:'Review filtered mail'},
          {i:'🏷️',t:'Labels',d:'Organize by label'},
        ].map(c=>`
        <div class="stat-card module-card" style="cursor:pointer;">
          <div style="font-size:24px;margin-bottom:8px;">${c.i}</div>
          <div style="font-weight:700;">${c.t}</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">${c.d}</div>
        </div>`).join('')}
      </div>
      <div class="glass" style="border-radius:20px;padding:20px;margin-top:16px;">
        <h3 style="font-size:14px;font-weight:700;margin:0 0 12px;color:#64748b;">CONNECT YOUR EMAIL</h3>
        <p style="font-size:13px;color:#94a3b8;margin-bottom:14px;">Link Gmail, Outlook or any IMAP account to manage everything in one place.</p>
        <button class="btn btn-primary btn-sm">+ Connect Account</button>
      </div>
    </div>`;
  },

  // ── YOUTUBE ────────────────────────────────────────────────────────────────
  youtube(state) {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">▶️ YouTube Studio</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:20px;">
        ${[
          {i:'💡',t:'Video Ideas',n:state.youtubeData.filter(x=>x.type==='idea').length},
          {i:'🎣',t:'Hook Vault',n:state.youtubeData.filter(x=>x.type==='hook').length},
          {i:'🖼️',t:'Thumbnails',n:state.youtubeData.filter(x=>x.type==='thumb').length},
          {i:'🔬',t:'Research',n:state.youtubeData.filter(x=>x.type==='research').length},
        ].map(c=>`
        <div class="stat-card module-card">
          <div style="font-size:24px;margin-bottom:6px;">${c.i}</div>
          <div class="stat-num" style="font-size:28px;">${c.n}</div>
          <div class="stat-label">${c.t}</div>
        </div>`).join('')}
      </div>
      <div class="glass" style="border-radius:20px;padding:16px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <input id="ytText" class="inp" placeholder="Idea, hook, or note…" style="flex:1;"/>
          <select id="ytType" class="inp" style="max-width:130px;">
            <option value="idea">💡 Idea</option>
            <option value="hook">🎣 Hook</option>
            <option value="research">🔬 Research</option>
            <option value="thumb">🖼️ Thumbnail</option>
          </select>
          <button onclick="appController.addYouTubeItem()" class="btn btn-primary">+ Add</button>
        </div>
        ${state.youtubeData.slice(0,10).map((y,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span class="tag">${y.type}</span>
          <span style="flex:1;font-size:13px;">${esc(y.text)}</span>
          <button onclick="appController.deleteYouTubeItem(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>
    </div>`;
  },

  // ── SOCIAL ─────────────────────────────────────────────────────────────────
  social() {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">📱 Social Center</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
        ${[
          {i:'🎵',t:'TikTok Planner',c:'#ff0050'},
          {i:'📸',t:'Instagram Drafts',c:'#e1306c'},
          {i:'🐦',t:'Twitter / X',c:'#1da1f2'},
          {i:'👽',t:'Reddit Tracker',c:'#ff4500'},
          {i:'💼',t:'LinkedIn',c:'#0077b5'},
          {i:'▶️',t:'YouTube',c:'#ff0000'},
        ].map(p=>`
        <div class="module-card glass" style="border-radius:18px;padding:20px;cursor:pointer;border-left:3px solid ${p.c}22;">
          <div style="font-size:28px;margin-bottom:8px;">${p.i}</div>
          <div style="font-weight:700;font-size:14px;">${p.t}</div>
          <div style="margin-top:10px;"><span class="pill pill-gray">Coming soon</span></div>
        </div>`).join('')}
      </div>
    </div>`;
  },

  // ── AI WORKSPACE ───────────────────────────────────────────────────────────
  ai(state) {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">🤖 AI Workspace</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
        <div class="glass" style="border-radius:20px;padding:16px;">
          <h3 style="font-weight:700;margin:0 0 12px;font-size:14px;">💾 Prompt Vault</h3>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <input id="aiPromptInput" class="inp" placeholder="Save a useful prompt…" style="flex:1;"/>
            <button onclick="appController.addAIMemory()" class="btn btn-primary btn-sm">+</button>
          </div>
          ${state.aiMemory.slice(0,5).map((m,i)=>`
          <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
            <span style="font-size:12px;color:#94a3b8;flex:1;">${esc(m.text)}</span>
            <button onclick="appController.deleteAIMemory(${i})" class="btn btn-danger btn-xs">🗑</button>
          </div>`).join('')}
        </div>
        <div class="glass" style="border-radius:20px;padding:16px;">
          <h3 style="font-weight:700;margin:0 0 10px;font-size:14px;">⚡ AI Workflows</h3>
          ${[
            {i:'✍️',t:'Content Writer'},
            {i:'📊',t:'Data Analyzer'},
            {i:'🎯',t:'Strategy Builder'},
            {i:'💡',t:'Idea Generator'},
          ].map(w=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:7px;cursor:pointer;">
            <span>${w.i}</span>
            <span style="font-size:13px;font-weight:500;">${w.t}</span>
            <span class="pill pill-gray" style="margin-left:auto;">Soon</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── BUSINESS ───────────────────────────────────────────────────────────────
  business(state) {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">💼 Business Hub</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
        <div class="stat-card"><div style="font-size:20px;margin-bottom:6px;">🤝</div><div class="stat-num">${state.clients.length}</div><div class="stat-label">Clients</div></div>
        <div class="stat-card"><div style="font-size:20px;margin-bottom:6px;">🌐</div><div class="stat-num">${state.domains.length}</div><div class="stat-label">Domains</div></div>
        <div class="stat-card"><div style="font-size:20px;margin-bottom:6px;">📁</div><div class="stat-num">${state.projects.length}</div><div class="stat-label">Projects</div></div>
      </div>

      <!-- Clients -->
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:14px;">
        <h3 style="font-weight:700;margin:0 0 12px;font-size:14px;">🤝 Clients</h3>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <input id="clientName" class="inp" placeholder="Client name" style="flex:1;"/>
          <input id="clientEmail" class="inp" placeholder="Email" style="flex:1;"/>
          <button onclick="appController.addClient()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.clients.map((c,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span style="font-size:18px;">🤝</span>
          <div style="flex:1;"><div style="font-weight:600;font-size:13px;">${esc(c.name)}</div><div style="color:#64748b;font-size:11px;">${esc(c.email)}</div></div>
          <button onclick="appController.deleteClient(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>

      <!-- Domains -->
      <div class="glass" style="border-radius:20px;padding:16px;">
        <h3 style="font-weight:700;margin:0 0 12px;font-size:14px;">🌐 Domains</h3>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <input id="domainName" class="inp" placeholder="domain.com" style="flex:1;"/>
          <input id="domainExpiry" class="inp" type="date" style="flex:1;max-width:160px;"/>
          <button onclick="appController.addDomain()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.domains.map((d,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span style="font-size:18px;">🌐</span>
          <div style="flex:1;"><div style="font-weight:600;font-size:13px;">${esc(d.name)}</div><div style="color:#64748b;font-size:11px;">Expires: ${d.expiry||'unknown'}</div></div>
          <button onclick="appController.deleteDomain(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>
    </div>`;
  },

  // ── CONTENT STUDIO ─────────────────────────────────────────────────────────
  content(state) {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">✨ Content Studio</h2>
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <h3 style="font-weight:700;margin:0 0 12px;font-size:14px;">💡 Content Ideas</h3>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <input id="ideaTitle" class="inp" placeholder="Idea title" style="flex:1;"/>
          <select id="ideaPlatform" class="inp" style="max-width:140px;">
            <option>TikTok</option><option>YouTube</option><option>Instagram</option><option>Blog</option><option>Twitter</option>
          </select>
          <button onclick="appController.addContentIdea()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.contentIdeas.length===0 ? '<p style="color:#64748b;font-size:13px;">No ideas yet — start building your pipeline!</p>' :
          state.contentIdeas.map((c,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);">
            <span class="tag">${esc(c.platform)}</span>
            <span style="flex:1;font-size:13px;">${esc(c.title)}</span>
            <span style="color:#64748b;font-size:11px;">${timeAgo(c.date)}</span>
            <button onclick="appController.deleteContentIdea(${i})" class="btn btn-danger btn-xs">🗑</button>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── BRAND VAULT ────────────────────────────────────────────────────────────
  brands(state) {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">🎨 Brand Vault</h2>
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input id="brandName" class="inp" placeholder="Brand name" style="flex:1;"/>
          <input id="brandColor" class="inp" placeholder="Primary color (#hex)" style="flex:1;max-width:160px;"/>
          <input id="brandFont" class="inp" placeholder="Font" style="flex:1;max-width:140px;"/>
          <button onclick="appController.addBrand()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
        ${state.brandAssets.length===0 ? '<div style="color:#64748b;font-size:13px;">No brands saved yet</div>' :
          state.brandAssets.map((b,i)=>`
          <div class="glass module-card" style="border-radius:18px;padding:16px;border-top:4px solid ${esc(b.color)||'#7c3aed'};">
            <div style="font-weight:700;margin-bottom:4px;">${esc(b.name)}</div>
            <div style="font-size:12px;color:#94a3b8;">${esc(b.color)} · ${esc(b.font)}</div>
            <div style="margin-top:10px;"><button onclick="appController.deleteBrand(${i})" class="btn btn-danger btn-xs">🗑</button></div>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── REPO CLEANER ───────────────────────────────────────────────────────────
  repocleaner(state) {
    const hasTokens = state._rcGhToken || state._rcVcToken;
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 4px;">🔐 Repo Cleaner</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px;">Manage GitHub repos & Vercel projects. Tokens kept in memory only.</p>

      ${!hasTokens ? `
      <!-- Token entry -->
      <div class="glass" style="border-radius:20px;padding:20px;">
        <div style="margin-bottom:12px;">
          <label style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:6px;">GitHub Token (required)</label>
          <input id="rcGhToken" type="password" class="inp" placeholder="ghp_…"/>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:6px;">Vercel Token (optional)</label>
          <input id="rcVcToken" type="password" class="inp" placeholder="Leave blank to skip"/>
        </div>
        <button onclick="appController.rcLoadTokens()" class="btn btn-primary">🚀 Load My Data</button>
      </div>` : `
      <!-- Loaded state -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
        <span class="pill pill-green">✓ GitHub</span>
        ${state._rcVcToken ? '<span class="pill pill-purple">✓ Vercel</span>' : ''}
        <button onclick="appController.rcClear()" class="btn btn-ghost btn-sm" style="margin-left:auto;">Change Keys</button>
        <button onclick="appController.rcRefresh()" class="btn btn-ghost btn-sm">🔄 Refresh</button>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:6px;margin-bottom:14px;">
        ${['repos','projects','deployments'].map(t=>`
        <button onclick="appController.rcTab('${t}')" class="btn ${(state._rcTab||'repos')===t?'btn-primary':'btn-ghost'} btn-sm">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">
        <div class="stat-card" style="padding:14px;text-align:center;"><div class="stat-num" style="font-size:24px;">${(state._rcRepos||[]).length}</div><div class="stat-label">Repos</div></div>
        <div class="stat-card" style="padding:14px;text-align:center;"><div class="stat-num" style="font-size:24px;">${(state._rcRepos||[]).filter(r=>r.archived).length}</div><div class="stat-label">Archived</div></div>
        <div class="stat-card" style="padding:14px;text-align:center;"><div class="stat-num" style="font-size:24px;">${(state._rcProjects||[]).length}</div><div class="stat-label">VC Projects</div></div>
        <div class="stat-card" style="padding:14px;text-align:center;"><div class="stat-num" style="font-size:24px;">${(state._rcDeploys||[]).length}</div><div class="stat-label">Deploys</div></div>
      </div>

      ${state._rcLoading ? '<div style="text-align:center;padding:40px;color:#64748b;"><div class="spin" style="margin:0 auto 12px;"></div>Loading…</div>' : ''}

      <!-- Repos tab -->
      ${(state._rcTab||'repos')==='repos' ? `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${(state._rcRepos||[]).length===0&&!state._rcLoading ? '<div style="text-align:center;padding:32px;color:#64748b;">No repos loaded yet — hit Refresh</div>' : ''}
        ${(state._rcRepos||[]).map((r,i)=>`
        <div class="glass module-card repo-card" style="border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;word-break:break-word;">${esc(r.full_name)}</div>
            <div style="color:#64748b;font-size:11px;">Updated ${timeAgo(r.updated_at)} · ${fmtSize(r.size)}</div>
          </div>
          ${r.archived?'<span class="pill pill-gray">archived</span>':''}
          ${r.private?'<span class="pill pill-blue">private</span>':'<span class="pill pill-green">public</span>'}
          ${isInactive(r)&&!r.archived?'<span class="pill pill-yellow">inactive</span>':''}
          ${!r.archived?`<button onclick="appController.rcArchiveRepo(${i})" class="btn btn-ghost btn-xs">📦</button>`:''}
          <button onclick="appController.rcDeleteRepo(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>` : ''}

      <!-- Projects tab -->
      ${(state._rcTab||'repos')==='projects' ? `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${(state._rcProjects||[]).length===0 ? '<div style="text-align:center;padding:32px;color:#64748b;">No Vercel projects loaded</div>' : ''}
        ${(state._rcProjects||[]).map((p,i)=>`
        <div class="glass module-card" style="border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
          <div style="flex:1;"><div style="font-weight:700;font-size:13px;">${esc(p.name)}</div><div style="color:#64748b;font-size:11px;">${p.framework||'—'}</div></div>
          <button onclick="appController.rcDeleteProject(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>` : ''}

      <!-- Deployments tab -->
      ${(state._rcTab||'repos')==='deployments' ? `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${(state._rcDeploys||[]).length===0 ? '<div style="text-align:center;padding:32px;color:#64748b;">No deployments loaded</div>' : ''}
        ${(state._rcDeploys||[]).map((d,i)=>`
        <div class="glass module-card" style="border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
          <div style="flex:1;"><div style="font-weight:700;font-size:13px;">${esc(d.name)}</div><div style="color:#64748b;font-size:11px;">${d.url||''} · ${timeAgo(d.createdAt?new Date(d.createdAt).toISOString():null)}</div></div>
          <span class="pill ${d.state==='READY'?'pill-green':d.state==='ERROR'||d.state==='CANCELED'?'pill-red':'pill-yellow'}">${d.state||'?'}</span>
          <button onclick="appController.rcDeleteDeploy(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>` : ''}
      `}
    </div>`;
  },

  // ── DEVICES ────────────────────────────────────────────────────────────────
  devices() {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">💻 Device & Session Center</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
        ${[
          {i:'📱',t:'This Device',s:'Active now',c:'pill-green'},
          {i:'💻',t:'Desktop',s:'Last seen 2d ago',c:'pill-gray'},
          {i:'🔒',t:'Vault Lock',s:'Auto-lock: 30 min',c:'pill-blue'},
        ].map(d=>`
        <div class="stat-card module-card">
          <div style="font-size:28px;margin-bottom:8px;">${d.i}</div>
          <div style="font-weight:700;">${d.t}</div>
          <div style="margin-top:6px;"><span class="pill ${d.c}">${d.s}</span></div>
        </div>`).join('')}
      </div>
    </div>`;
  },

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  settings() {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">⚙️ Settings</h2>
      <div class="glass" style="border-radius:20px;padding:20px;margin-bottom:14px;">
        <h3 style="font-weight:700;font-size:14px;margin:0 0 14px;">🔒 Security</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button onclick="appController.changePassword()" class="btn btn-ghost" style="justify-content:flex-start;">🔑 Change Master Password</button>
          <button onclick="appController.exportData()" class="btn btn-ghost" style="justify-content:flex-start;">📤 Export All Data</button>
          <button onclick="appController.importData()" class="btn btn-ghost" style="justify-content:flex-start;">📥 Import Data</button>
        </div>
      </div>
      <div class="glass" style="border-radius:20px;padding:20px;">
        <h3 style="font-weight:700;font-size:14px;margin:0 0 14px;color:#ef4444;">⚠️ Danger Zone</h3>
        <button onclick="appController.clearAllData()" class="btn btn-danger">🗑️ Wipe All Vault Data</button>
      </div>
    </div>`;
  }
};
