const STORAGE_KEY = "vault_os_v2";
const SESSION_KEY = "vault_os_session_v2";

const defaultState = {
  auth: { passwordHash: "" },
  currentWorkspace: "Personal",
  workspaces: {
    Personal:       { theme: "violet" },
    Business:       { theme: "emerald" },
    Content:        { theme: "orange" },
    "SaaS Projects":{ theme: "blue" },
    "Dog Training": { theme: "pink" }
  },
  // Core vault data
  passwords: [],       // { title, username, password, category, url, notes }
  notes: [],
  documents: [],
  // Service credentials stored as structured vaults
  serviceKeys: [],     // { service, label, fields: [{key, value}], category, date }
  emails: [],
  socialAccounts: [],  // { platform, username, password, email, apiKey, notes }
  youtubeData: [],
  aiMemory: [],
  contentIdeas: [],
  brandAssets: [],
  clients: [],
  domains: [],
  projects: [],
  activity: []
};

const storage = {
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { this.set(defaultState); return structuredClone(defaultState); }
      return Object.assign(structuredClone(defaultState), JSON.parse(raw));
    } catch { return structuredClone(defaultState); }
  },
  set(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); },
  update(cb) { const s = this.get(); cb(s); this.set(s); return s; },
  session: {
    set(d) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(d)); },
    get() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } },
    clear() { sessionStorage.removeItem(SESSION_KEY); }
  }
};
