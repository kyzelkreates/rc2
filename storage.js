const STORAGE_KEY = "vault_os_v2";
const SESSION_KEY = "vault_os_session_v2";

const defaultState = {
  auth: { passwordHash: "" },
  currentWorkspace: "Personal",
  workspaces: {
    Personal:      { theme: "violet" },
    Business:      { theme: "emerald" },
    Content:       { theme: "orange" },
    "SaaS Projects":{ theme: "blue" },
    "Dog Training":{ theme: "pink" }
  },
  passwords: [],
  emails: [],
  socialAccounts: [],
  youtubeData: [],
  notes: [],
  documents: [],
  projects: [],
  aiMemory: [],
  contentIdeas: [],
  brandAssets: [],
  clients: [],
  domains: [],
  repoTokens: { github: "", vercel: "" },
  activity: []
};

const storage = {
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { this.set(defaultState); return structuredClone(defaultState); }
      // Merge with defaults to handle new fields
      const saved = JSON.parse(raw);
      return Object.assign(structuredClone(defaultState), saved);
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
