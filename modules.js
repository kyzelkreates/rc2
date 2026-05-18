// ─── helpers ─────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return 'never';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff/86400000);
  if (days<1) return 'today'; if (days===1) return 'yesterday';
  if (days<30) return days+'d ago'; if (days<365) return Math.floor(days/30)+'mo ago';
  return Math.floor(days/365)+'y ago';
}
function fmtSize(kb) { if (!kb) return '0 KB'; if (kb<1024) return kb+' KB'; return (kb/1024).toFixed(1)+' MB'; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function isInactive(r) { const d=new Date(); d.setDate(d.getDate()-90); return new Date(r.updated_at)<d; }

// helper: find saved service key
function getSavedKey(state, service) {
  return (state.serviceKeys||[]).find(k=>k.service===service);
}
function fieldVal(saved, key) {
  if (!saved) return '';
  const f = (saved.fields||[]).find(f=>f.key===key);
  return f ? esc(f.value) : '';
}

// ─── credential section builder ───────────────────────────────────────────────
function credSection(service, label, fields, savedData, saveAction) {
  const hasSaved = !!savedData;
  return `
  <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <h3 style="font-weight:700;font-size:14px;margin:0;">🔐 ${label} Credentials</h3>
      ${hasSaved ? '<span class="pill pill-green">✓ Saved in Vault</span>' : '<span class="pill pill-yellow">Not saved yet</span>'}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${fields.map(f=>`
      <div>
        <label style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:4px;">${f.label}</label>
        <input id="${service}_${f.key}" type="${f.secret?'password':'text'}" class="inp" placeholder="${f.placeholder||''}" value="${hasSaved ? fieldVal(savedData, f.key) : ''}" autocomplete="off" spellcheck="false"/>
      </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button onclick="${saveAction}" class="btn btn-primary btn-sm">💾 Save to Vault</button>
      ${hasSaved ? `<button onclick="appController.deleteServiceKey('${service}')" class="btn btn-danger btn-sm">🗑 Remove</button>` : ''}
    </div>
  </div>`;
}

// ─── modules ─────────────────────────────────────────────────────────────────
const modules = {

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  dashboard(state) {
    const counts = [
      { n:state.passwords.length,    l:'Passwords',    i:'🔑', m:'passwords' },
      { n:state.notes.length,        l:'Notes',        i:'📝', m:'notes' },
      { n:state.documents.length,    l:'Documents',    i:'📄', m:'documents' },
      { n:(state.serviceKeys||[]).length, l:'Service Keys', i:'🗝️', m:'passwords' },
      { n:state.contentIdeas.length, l:'Content Ideas',i:'✨', m:'content' },
      { n:state.clients.length,      l:'Clients',      i:'🤝', m:'business' },
    ];
    return `
    <div class="fade-in">
      <h2 style="font-size:22px;font-weight:800;margin:0 0 16px;">👋 Welcome back, Kyzel</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
        ${counts.map(c=>`
        <div class="stat-card module-card" onclick="appController.switchModule('${c.m}')" style="cursor:pointer;">
          <div style="font-size:20px;margin-bottom:6px;">${c.i}</div>
          <div class="stat-num">${c.n}</div>
          <div class="stat-label">${c.l}</div>
        </div>`).join('')}
      </div>
      <div class="glass" style="border-radius:20px;padding:20px;">
        <h3 style="font-size:15px;font-weight:700;margin:0 0 12px;">🕐 Recent Activity</h3>
        ${state.activity.length ? state.activity.slice(0,10).map(a=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);">
            <span style="color:#64748b;font-size:12px;flex-shrink:0;">${timeAgo(a.date)}</span>
            <span style="font-size:13px;">${esc(a.text)}</span>
          </div>`).join('') :
          '<p style="color:#64748b;font-size:13px;">No activity yet — start adding data!</p>'
        }
      </div>
    </div>`;
  },

  // ── PASSWORDS ──────────────────────────────────────────────────────────────
  passwords(state) {
    const cats = ['General','Social','Email','Banking','Work','API Keys','Other'];
    const allItems = [
      ...(state.passwords||[]).map((p,i)=>({...p, _type:'pw', _i:i})),
      ...(state.serviceKeys||[]).map((k,i)=>({title:k.label, username:k.service, password:(k.fields||[]).map(f=>f.key+': '+f.value).join(' | '), category:k.category||'API Keys', _type:'sk', _i:i, date:k.date})),
    ];
    return `
    <div class="fade-in">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <h2 style="font-size:20px;font-weight:800;margin:0;">🔑 Password & Keys Vault</h2>
        <span class="pill pill-purple">${allItems.length} saved</span>
      </div>
      <!-- Add form -->
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <input id="pwTitle" class="inp" placeholder="Website / App / Service"/>
          <input id="pwUrl"   class="inp" placeholder="URL (optional)"/>
          <input id="pwUser"  class="inp" placeholder="Username / Email"/>
          <input id="pwPass"  class="inp" type="password" placeholder="Password / API Key" autocomplete="off"/>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="pwCat" class="inp" style="flex:1;">
            ${cats.map(c=>`<option>${c}</option>`).join('')}
          </select>
          <input id="pwNotes" class="inp" placeholder="Notes (optional)" style="flex:2;"/>
          <button onclick="appController.addPassword()" class="btn btn-primary">+ Save</button>
        </div>
      </div>
      <!-- List -->
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${allItems.length===0 ? '<div style="text-align:center;padding:40px;color:#64748b;">No credentials saved yet</div>' :
          allItems.map(p=>`
          <div class="glass module-card" style="border-radius:16px;padding:12px 14px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span style="font-weight:700;font-size:14px;">${esc(p.title)}</span>
                  <span class="pill pill-gray" style="font-size:10px;">${esc(p.category||'General')}</span>
                  ${p._type==='sk'?'<span class="pill pill-blue" style="font-size:10px;">API Key</span>':''}
                </div>
                <div style="color:#64748b;font-size:12px;margin-top:2px;">${esc(p.username)}</div>
                ${p.url?`<div style="color:#a78bfa;font-size:11px;">${esc(p.url)}</div>`:''}
                ${p.notes?`<div style="color:#94a3b8;font-size:11px;margin-top:2px;">${esc(p.notes)}</div>`:''}
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0;">
                <button onclick="appController.copyPw(${p._i},'${p._type}')" class="btn btn-ghost btn-sm">📋</button>
                <button onclick="appController.revealPw(${p._i},'${p._type}',this)" class="btn btn-ghost btn-sm">👁</button>
                <button onclick="appController.deleteEntry(${p._i},'${p._type}')" class="btn btn-danger btn-sm">🗑</button>
              </div>
            </div>
            <div id="pw-reveal-${p._type}-${p._i}" style="display:none;margin-top:8px;padding:8px 10px;background:rgba(0,0,0,.3);border-radius:8px;font-size:12px;font-family:monospace;word-break:break-all;color:#a78bfa;"></div>
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
        <span class="pill pill-purple">${state.notes.length}</span>
      </div>
      <div class="glass" style="border-radius:20px;padding:16px;margin-bottom:16px;">
        <input id="noteTitle" class="inp" placeholder="Note title" style="margin-bottom:8px;"/>
        <textarea id="noteBody" class="inp" rows="4" placeholder="Write your note…" style="resize:vertical;"></textarea>
        <div style="margin-top:8px;"><button onclick="appController.addNote()" class="btn btn-primary btn-sm">+ Save Note</button></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
        ${state.notes.length===0 ? '<div style="color:#64748b;font-size:13px;padding:20px;">No notes yet</div>' :
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
        <input id="docTitle" class="inp" placeholder="Document title" style="margin-bottom:8px;"/>
        <textarea id="docBody" class="inp" rows="5" placeholder="Paste or write document content…" style="resize:vertical;"></textarea>
        <div style="margin-top:8px;"><button onclick="appController.addDocument()" class="btn btn-primary btn-sm">+ Save Document</button></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${state.documents.length===0 ? '<div style="color:#64748b;text-align:center;padding:32px;">No documents yet</div>' :
          state.documents.map((d,i)=>`
          <div class="glass module-card" style="border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:22px;">📄</span>
            <div style="flex:1;"><div style="font-weight:700;">${esc(d.title)}</div><div style="color:#64748b;font-size:12px;">${timeAgo(d.date)} · ${d.body.length} chars</div></div>
            <button onclick="appController.deleteDocument(${i})" class="btn btn-danger btn-sm">🗑</button>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── EMAILS ─────────────────────────────────────────────────────────────────
  emails(state) {
    const saved = getSavedKey(state, 'email_accounts');
    const accts = (state.socialAccounts||[]).filter(a=>a.platform==='email');
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">📧 Email Hub</h2>
      ${credSection('email_accounts','Email Accounts',
        [
          {key:'gmail_email',    label:'Gmail Address',     placeholder:'you@gmail.com',    secret:false},
          {key:'gmail_pass',     label:'Gmail App Password',placeholder:'App password',      secret:true},
          {key:'outlook_email',  label:'Outlook Address',   placeholder:'you@outlook.com',  secret:false},
          {key:'outlook_pass',   label:'Outlook Password',  placeholder:'Password',          secret:true},
          {key:'smtp_host',      label:'SMTP Host',         placeholder:'smtp.gmail.com',   secret:false},
          {key:'imap_host',      label:'IMAP Host',         placeholder:'imap.gmail.com',   secret:false},
        ], saved, "appController.saveServiceKey('email_accounts','Email Accounts','email')"
      )}
      <!-- Saved accounts list -->
      ${accts.length ? `
      <div class="glass" style="border-radius:20px;padding:16px;">
        <h3 style="font-weight:700;font-size:14px;margin:0 0 10px;">Saved Email Accounts</h3>
        ${accts.map((a,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span style="font-size:16px;">📧</span>
          <div style="flex:1;"><div style="font-weight:600;font-size:13px;">${esc(a.username)}</div><div style="color:#64748b;font-size:11px;">${esc(a.email)}</div></div>
          <button onclick="appController.deleteSocial(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:14px;">
        ${[{i:'📥',t:'VIP Inbox'},{i:'🤖',t:'AI Summaries'},{i:'📎',t:'Attachments'},{i:'📤',t:'Drafts'}].map(c=>`
        <div class="stat-card" style="cursor:pointer;"><div style="font-size:22px;margin-bottom:6px;">${c.i}</div><div style="font-weight:700;font-size:13px;">${c.t}</div></div>`).join('')}
      </div>
    </div>`;
  },

  // ── YOUTUBE ────────────────────────────────────────────────────────────────
  youtube(state) {
    const saved = getSavedKey(state, 'youtube');
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">▶️ YouTube Studio</h2>
      ${credSection('youtube','YouTube / Google',
        [
          {key:'channel_name', label:'Channel Name',      placeholder:'Your channel', secret:false},
          {key:'email',        label:'Google Email',       placeholder:'you@gmail.com',secret:false},
          {key:'password',     label:'Google Password',    placeholder:'Password',     secret:true},
          {key:'api_key',      label:'YouTube API Key',    placeholder:'AIza...',      secret:true},
          {key:'client_id',    label:'OAuth Client ID',    placeholder:'Optional',     secret:false},
          {key:'client_secret',label:'OAuth Client Secret',placeholder:'Optional',     secret:true},
        ], saved, "appController.saveServiceKey('youtube','YouTube','social')"
      )}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:16px;">
        ${[
          {i:'💡',t:'Video Ideas',n:state.youtubeData.filter(x=>x.type==='idea').length},
          {i:'🎣',t:'Hook Vault',n:state.youtubeData.filter(x=>x.type==='hook').length},
          {i:'🖼️',t:'Thumbnails',n:state.youtubeData.filter(x=>x.type==='thumb').length},
          {i:'🔬',t:'Research',n:state.youtubeData.filter(x=>x.type==='research').length},
        ].map(c=>`<div class="stat-card"><div style="font-size:20px;margin-bottom:4px;">${c.i}</div><div class="stat-num" style="font-size:24px;">${c.n}</div><div class="stat-label">${c.t}</div></div>`).join('')}
      </div>
      <div class="glass" style="border-radius:20px;padding:14px;">
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <input id="ytText" class="inp" placeholder="Idea, hook, or note…" style="flex:1;"/>
          <select id="ytType" class="inp" style="max-width:130px;"><option value="idea">💡 Idea</option><option value="hook">🎣 Hook</option><option value="research">🔬 Research</option><option value="thumb">🖼️ Thumbnail</option></select>
          <button onclick="appController.addYouTubeItem()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.youtubeData.slice(0,10).map((y,i)=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span class="tag">${y.type}</span><span style="flex:1;font-size:13px;">${esc(y.text)}</span>
          <button onclick="appController.deleteYouTubeItem(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>
    </div>`;
  },

  // ── SOCIAL CENTER ──────────────────────────────────────────────────────────
  social(state) {
    const platforms = [
      { id:'tiktok',    icon:'🎵', label:'TikTok',    fields:[{key:'username',label:'Username',secret:false},{key:'email',label:'Email',secret:false},{key:'password',label:'Password',secret:true},{key:'api_key',label:'API Key',secret:true}] },
      { id:'instagram', icon:'📸', label:'Instagram',  fields:[{key:'username',label:'Username',secret:false},{key:'email',label:'Email',secret:false},{key:'password',label:'Password',secret:true},{key:'api_token',label:'API Token',secret:true}] },
      { id:'twitter',   icon:'🐦', label:'Twitter / X',fields:[{key:'username',label:'Username',secret:false},{key:'email',label:'Email',secret:false},{key:'password',label:'Password',secret:true},{key:'api_key',label:'API Key',secret:true},{key:'api_secret',label:'API Secret',secret:true},{key:'bearer_token',label:'Bearer Token',secret:true}] },
      { id:'reddit',    icon:'👽', label:'Reddit',     fields:[{key:'username',label:'Username',secret:false},{key:'password',label:'Password',secret:true},{key:'client_id',label:'Client ID',secret:false},{key:'client_secret',label:'Client Secret',secret:true}] },
      { id:'linkedin',  icon:'💼', label:'LinkedIn',   fields:[{key:'email',label:'Email',secret:false},{key:'password',label:'Password',secret:true}] },
      { id:'facebook',  icon:'📘', label:'Facebook',   fields:[{key:'email',label:'Email',secret:false},{key:'password',label:'Password',secret:true},{key:'page_token',label:'Page Token',secret:true}] },
    ];

    const active = state._socialTab || platforms[0].id;
    const plat = platforms.find(p=>p.id===active)||platforms[0];
    const saved = getSavedKey(state, 'social_'+plat.id);

    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 14px;">📱 Social Center</h2>
      <!-- Platform tabs -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
        ${platforms.map(p=>`
        <button onclick="appController.socialTab('${p.id}')" class="btn ${active===p.id?'btn-primary':'btn-ghost'} btn-sm">${p.icon} ${p.label}</button>`).join('')}
      </div>
      ${credSection('social_'+plat.id, plat.icon+' '+plat.label, plat.fields, saved,
        `appController.saveServiceKey('social_${plat.id}','${plat.label}','social')`
      )}
    </div>`;
  },

  // ── AI WORKSPACE ───────────────────────────────────────────────────────────
  ai(state) {
    const saved = getSavedKey(state, 'ai_keys');
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">🤖 AI Workspace</h2>
      ${credSection('ai_keys','AI Service API Keys',
        [
          {key:'openai',      label:'OpenAI API Key',       placeholder:'sk-...',  secret:true},
          {key:'anthropic',   label:'Anthropic (Claude)',    placeholder:'sk-ant-…',secret:true},
          {key:'gemini',      label:'Google Gemini Key',     placeholder:'AIza…',   secret:true},
          {key:'huggingface', label:'Hugging Face Token',    placeholder:'hf_…',    secret:true},
          {key:'replicate',   label:'Replicate Token',       placeholder:'r8_…',    secret:true},
          {key:'elevenlabs',  label:'ElevenLabs API Key',    placeholder:'…',       secret:true},
        ], saved, "appController.saveServiceKey('ai_keys','AI Service Keys','api')"
      )}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="glass" style="border-radius:20px;padding:14px;">
          <h3 style="font-weight:700;font-size:13px;margin:0 0 10px;">💾 Prompt Vault</h3>
          <div style="display:flex;gap:7px;margin-bottom:8px;">
            <input id="aiPromptInput" class="inp" placeholder="Save a useful prompt…" style="flex:1;"/>
            <button onclick="appController.addAIMemory()" class="btn btn-primary btn-sm">+</button>
          </div>
          ${state.aiMemory.slice(0,6).map((m,i)=>`
          <div style="display:flex;align-items:flex-start;gap:7px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);">
            <span style="flex:1;font-size:12px;color:#94a3b8;">${esc(m.text)}</span>
            <button onclick="navigator.clipboard.writeText('${esc(m.text)}');ui.toast('Copied!','ok')" class="btn btn-ghost btn-xs">📋</button>
            <button onclick="appController.deleteAIMemory(${i})" class="btn btn-danger btn-xs">🗑</button>
          </div>`).join('')}
        </div>
        <div class="glass" style="border-radius:20px;padding:14px;">
          <h3 style="font-weight:700;font-size:13px;margin:0 0 10px;">⚡ AI Workflows</h3>
          ${[{i:'✍️',t:'Content Writer'},{i:'📊',t:'Data Analyzer'},{i:'🎯',t:'Strategy Builder'},{i:'💡',t:'Idea Generator'}].map(w=>`
          <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;background:rgba(255,255,255,.04);margin-bottom:6px;">
            <span>${w.i}</span><span style="font-size:13px;font-weight:500;">${w.t}</span>
            <span class="pill pill-gray" style="margin-left:auto;font-size:10px;">Soon</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  // ── BUSINESS ───────────────────────────────────────────────────────────────
  business(state) {
    const savedStripe = getSavedKey(state, 'stripe');
    const savedPaypal = getSavedKey(state, 'paypal');
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">💼 Business Hub</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px;">
        <div class="stat-card"><div style="font-size:18px;margin-bottom:4px;">🤝</div><div class="stat-num">${state.clients.length}</div><div class="stat-label">Clients</div></div>
        <div class="stat-card"><div style="font-size:18px;margin-bottom:4px;">🌐</div><div class="stat-num">${state.domains.length}</div><div class="stat-label">Domains</div></div>
        <div class="stat-card"><div style="font-size:18px;margin-bottom:4px;">📁</div><div class="stat-num">${state.projects.length}</div><div class="stat-label">Projects</div></div>
      </div>

      <!-- Payment credentials -->
      ${credSection('stripe','Stripe',
        [
          {key:'pk', label:'Publishable Key', placeholder:'pk_live_…', secret:false},
          {key:'sk', label:'Secret Key',       placeholder:'sk_live_…', secret:true},
          {key:'webhook', label:'Webhook Secret', placeholder:'whsec_…', secret:true},
        ], savedStripe, "appController.saveServiceKey('stripe','Stripe','payment')"
      )}
      ${credSection('paypal','PayPal',
        [
          {key:'client_id',     label:'Client ID',     placeholder:'…', secret:false},
          {key:'client_secret', label:'Client Secret', placeholder:'…', secret:true},
          {key:'email',         label:'PayPal Email',  placeholder:'you@paypal.com', secret:false},
        ], savedPaypal, "appController.saveServiceKey('paypal','PayPal','payment')"
      )}

      <!-- Clients -->
      <div class="glass" style="border-radius:20px;padding:14px;margin-bottom:12px;">
        <h3 style="font-weight:700;font-size:13px;margin:0 0 10px;">🤝 Clients</h3>
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px;">
          <input id="clientName"  class="inp" placeholder="Client name" style="flex:1;"/>
          <input id="clientEmail" class="inp" placeholder="Email" style="flex:1;"/>
          <button onclick="appController.addClient()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.clients.map((c,i)=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span>🤝</span><div style="flex:1;"><div style="font-weight:600;font-size:13px;">${esc(c.name)}</div><div style="color:#64748b;font-size:11px;">${esc(c.email)}</div></div>
          <button onclick="appController.deleteClient(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>

      <!-- Domains -->
      <div class="glass" style="border-radius:20px;padding:14px;">
        <h3 style="font-weight:700;font-size:13px;margin:0 0 10px;">🌐 Domains</h3>
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px;">
          <input id="domainName"   class="inp" placeholder="domain.com" style="flex:1;"/>
          <input id="domainExpiry" class="inp" type="date" style="flex:1;max-width:150px;"/>
          <button onclick="appController.addDomain()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.domains.map((d,i)=>`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span>🌐</span><div style="flex:1;"><div style="font-weight:600;font-size:13px;">${esc(d.name)}</div><div style="color:#64748b;font-size:11px;">Expires: ${d.expiry||'unknown'}</div></div>
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
      <div class="glass" style="border-radius:20px;padding:14px;margin-bottom:14px;">
        <h3 style="font-weight:700;font-size:13px;margin:0 0 10px;">💡 Content Ideas Pipeline</h3>
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;">
          <input id="ideaTitle" class="inp" placeholder="Idea title…" style="flex:2;"/>
          <select id="ideaPlatform" class="inp" style="flex:1;max-width:130px;">
            <option>TikTok</option><option>YouTube</option><option>Instagram</option><option>Blog</option><option>Twitter</option><option>LinkedIn</option>
          </select>
          <button onclick="appController.addContentIdea()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
        ${state.contentIdeas.length===0 ? '<p style="color:#64748b;font-size:13px;">No ideas yet — start building!</p>' :
          state.contentIdeas.map((c,i)=>`
          <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);">
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
      <div class="glass" style="border-radius:20px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <input id="brandName"  class="inp" placeholder="Brand name" style="flex:1;"/>
          <input id="brandColor" class="inp" placeholder="Primary color #hex" style="flex:1;max-width:160px;"/>
          <input id="brandFont"  class="inp" placeholder="Font" style="flex:1;max-width:130px;"/>
          <button onclick="appController.addBrand()" class="btn btn-primary btn-sm">+ Add</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;">
        ${state.brandAssets.length===0 ? '<div style="color:#64748b;font-size:13px;">No brands saved yet</div>' :
          state.brandAssets.map((b,i)=>`
          <div class="glass module-card" style="border-radius:18px;padding:16px;border-top:4px solid ${esc(b.color)||'#7c3aed'};">
            <div style="font-weight:700;margin-bottom:4px;">${esc(b.name)}</div>
            <div style="font-size:12px;color:#94a3b8;">${esc(b.color)} · ${esc(b.font)}</div>
            <button onclick="appController.deleteBrand(${i})" class="btn btn-danger btn-xs" style="margin-top:10px;">🗑</button>
          </div>`).join('')}
      </div>
    </div>`;
  },

  // ── REPO CLEANER ───────────────────────────────────────────────────────────
  repocleaner(state) {
    const savedRC = getSavedKey(state, 'repo_cleaner');
    const hasTokens = !!(state._rcGhToken);
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 4px;">🔐 Repo Cleaner</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px;">Manage GitHub repos & Vercel projects.</p>

      ${credSection('repo_cleaner','GitHub & Vercel Tokens',
        [
          {key:'github_token', label:'GitHub Personal Access Token', placeholder:'ghp_…',  secret:true},
          {key:'vercel_token', label:'Vercel API Token (optional)',   placeholder:'Leave blank to skip', secret:true},
        ], savedRC, "appController.saveServiceKey('repo_cleaner','Repo Cleaner Tokens','api')"
      )}

      ${!hasTokens ? `
      <div class="glass" style="border-radius:20px;padding:16px;">
        <p style="color:#94a3b8;font-size:13px;margin:0 0 12px;">Tokens saved in vault above will auto-load. Or enter below to load without saving:</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
          <input id="rcGhToken" type="password" class="inp" placeholder="GitHub token" value="${savedRC ? fieldVal(savedRC,'github_token') : ''}"/>
          <input id="rcVcToken" type="password" class="inp" placeholder="Vercel token (optional)" value="${savedRC ? fieldVal(savedRC,'vercel_token') : ''}"/>
        </div>
        <button onclick="appController.rcLoadTokens()" class="btn btn-primary">🚀 Load My Data</button>
      </div>` : `
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
        <span class="pill pill-green">✓ GitHub</span>
        ${state._rcVcToken?'<span class="pill pill-purple">✓ Vercel</span>':''}
        <button onclick="appController.rcClear()" class="btn btn-ghost btn-sm" style="margin-left:auto;">Change Keys</button>
        <button onclick="appController.rcRefresh()" class="btn btn-ghost btn-sm">🔄 Refresh</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
        <div class="stat-card" style="padding:12px;text-align:center;"><div class="stat-num" style="font-size:22px;">${(state._rcRepos||[]).length}</div><div class="stat-label">Repos</div></div>
        <div class="stat-card" style="padding:12px;text-align:center;"><div class="stat-num" style="font-size:22px;">${(state._rcRepos||[]).filter(r=>r.archived).length}</div><div class="stat-label">Archived</div></div>
        <div class="stat-card" style="padding:12px;text-align:center;"><div class="stat-num" style="font-size:22px;">${(state._rcProjects||[]).length}</div><div class="stat-label">Projects</div></div>
        <div class="stat-card" style="padding:12px;text-align:center;"><div class="stat-num" style="font-size:22px;">${(state._rcDeploys||[]).length}</div><div class="stat-label">Deploys</div></div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:12px;">
        ${['repos','projects','deployments'].map(t=>`
        <button onclick="appController.rcTab('${t}')" class="btn ${(state._rcTab||'repos')===t?'btn-primary':'btn-ghost'} btn-sm">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
      </div>

      ${state._rcLoading?'<div style="text-align:center;padding:32px;color:#64748b;"><div class="spin" style="margin:0 auto 10px;"></div>Loading…</div>':''}

      ${(state._rcTab||'repos')==='repos' ? `
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${(state._rcRepos||[]).length===0&&!state._rcLoading?'<div style="text-align:center;padding:32px;color:#64748b;">No repos — hit Refresh</div>':''}
        ${(state._rcRepos||[]).map((r,i)=>`
        <div class="glass module-card" style="border-radius:14px;padding:11px 13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:13px;word-break:break-word;">${esc(r.full_name)}</div><div style="color:#64748b;font-size:11px;">Updated ${timeAgo(r.updated_at)} · ${fmtSize(r.size)}</div></div>
          ${r.archived?'<span class="pill pill-gray">archived</span>':''}
          ${r.private?'<span class="pill pill-blue">private</span>':'<span class="pill pill-green">public</span>'}
          ${isInactive(r)&&!r.archived?'<span class="pill pill-yellow">inactive</span>':''}
          ${!r.archived?`<button onclick="appController.rcArchiveRepo(${i})" class="btn btn-ghost btn-xs">📦</button>`:''}
          <button onclick="appController.rcDeleteRepo(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>` : ''}

      ${(state._rcTab||'repos')==='projects' ? `
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${(state._rcProjects||[]).length===0?'<div style="text-align:center;padding:32px;color:#64748b;">No Vercel projects</div>':''}
        ${(state._rcProjects||[]).map((p,i)=>`
        <div class="glass module-card" style="border-radius:14px;padding:11px 13px;display:flex;align-items:center;gap:8px;">
          <div style="flex:1;"><div style="font-weight:700;font-size:13px;">${esc(p.name)}</div><div style="color:#64748b;font-size:11px;">${p.framework||'—'}</div></div>
          <button onclick="appController.rcDeleteProject(${i})" class="btn btn-danger btn-xs">🗑</button>
        </div>`).join('')}
      </div>` : ''}

      ${(state._rcTab||'repos')==='deployments' ? `
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${(state._rcDeploys||[]).length===0?'<div style="text-align:center;padding:32px;color:#64748b;">No deployments</div>':''}
        ${(state._rcDeploys||[]).map((d,i)=>`
        <div class="glass module-card" style="border-radius:14px;padding:11px 13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <div style="flex:1;"><div style="font-weight:700;font-size:13px;">${esc(d.name)}</div><div style="color:#64748b;font-size:11px;">${d.url||''}</div></div>
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
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
        ${[{i:'📱',t:'This Device',s:'Active now',c:'pill-green'},{i:'💻',t:'Desktop',s:'Last seen 2d ago',c:'pill-gray'},{i:'🔒',t:'Vault Lock',s:'Auto-lock: 30 min',c:'pill-blue'}].map(d=>`
        <div class="stat-card module-card"><div style="font-size:26px;margin-bottom:8px;">${d.i}</div><div style="font-weight:700;">${d.t}</div><div style="margin-top:6px;"><span class="pill ${d.c}">${d.s}</span></div></div>`).join('')}
      </div>
    </div>`;
  },

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  settings() {
    return `
    <div class="fade-in">
      <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">⚙️ Settings</h2>
      <div class="glass" style="border-radius:20px;padding:18px;margin-bottom:12px;">
        <h3 style="font-weight:700;font-size:13px;margin:0 0 12px;">🔒 Security</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button onclick="appController.changePassword()" class="btn btn-ghost" style="justify-content:flex-start;">🔑 Change Master Password</button>
          <button onclick="appController.exportData()" class="btn btn-ghost" style="justify-content:flex-start;">📤 Export Vault Backup (.json)</button>
          <button onclick="appController.importData()" class="btn btn-ghost" style="justify-content:flex-start;">📥 Import Vault Backup</button>
        </div>
      </div>
      <div class="glass" style="border-radius:20px;padding:18px;">
        <h3 style="font-weight:700;font-size:13px;margin:0 0 12px;color:#ef4444;">⚠️ Danger Zone</h3>
        <button onclick="appController.clearAllData()" class="btn btn-danger">🗑️ Wipe All Vault Data</button>
      </div>
    </div>`;
  }
};
