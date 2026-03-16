/* ═══════════════════════════════════════
   KUBE-MONITOR — Shared JavaScript
═══════════════════════════════════════ */

// ── AUTH ──────────────────────────────
const Auth = {
  getUsers:   () => JSON.parse(localStorage.getItem('km_users')  || '[]'),
  saveUsers:  (u) => localStorage.setItem('km_users', JSON.stringify(u)),
  getSession: () => JSON.parse(localStorage.getItem('km_sess')   || 'null'),
  setSession: (s) => localStorage.setItem('km_sess', JSON.stringify(s)),
  clearSession: () => localStorage.removeItem('km_sess'),

  register(name, email, password) {
    if (!name || !email || !password) return { ok: false, msg: 'All fields are required' };
    if (password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, msg: 'Invalid email address' };
    const users = this.getUsers();
    if (users.find(u => u.email === email.toLowerCase())) return { ok: false, msg: 'Email already registered' };
    const user = { id: Date.now(), name, email: email.toLowerCase(), password: btoa(password), role: 'Operator', createdAt: new Date().toISOString() };
    users.push(user);
    this.saveUsers(users);
    this.setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return { ok: true };
  },

  login(email, password) {
    if (!email || !password) return { ok: false, msg: 'Please fill in all fields' };
    const users = this.getUsers();
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user || user.password !== btoa(password)) return { ok: false, msg: 'Invalid email or password' };
    this.setSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return { ok: true };
  },

  logout() { this.clearSession(); window.location.href = 'index.html'; },
  isLoggedIn() { return !!this.getSession(); },
  requireAuth() { if (!this.isLoggedIn()) { window.location.href = 'login.html'; return false; } return true; }
};

// ── NAVBAR ────────────────────────────
const Nav = {
  init(activePage) {
    const sess = Auth.getSession();
    const isAuth = !!sess;

    const rightHTML = isAuth ? `
      <div class="live-badge"><div class="live-pulse"></div>LIVE</div>
      <div class="nav-clock" id="nav-clock">--:--:--</div>
      <div class="nav-user">
        <div class="nav-avatar" id="nav-avatar">${sess.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="nav-user-name">${sess.name}</div>
          <div class="nav-user-role">${sess.role}</div>
        </div>
      </div>
      <button class="btn-logout" onclick="Auth.logout()">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 100-2H4V5h6a1 1 0 100-2H3zm11.707 4.293a1 1 0 010 1.414L12.414 11H17a1 1 0 110 2h-4.586l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        Logout
      </button>` : `
      <a href="login.html" class="btn-login-nav">Sign In</a>`;

    const pages = [
      { href: 'index.html',   label: 'Home',     icon: iconHome(),    key: 'home'      },
      { href: 'dashboard.html', label: 'Dashboard', icon: iconGrid(), key: 'dashboard', auth: true },
      { href: 'nodes.html',   label: 'Nodes',    icon: iconServer(),  key: 'nodes',    auth: true },
      { href: 'metrics.html', label: 'Metrics',  icon: iconChart(),   key: 'metrics',  auth: true },
      { href: 'login.html',   label: 'Login',    icon: iconLock(),    key: 'login',    hideAuth: true },
    ];

    const linksHTML = pages
      .filter(p => (!p.auth || isAuth) && (!p.hideAuth || !isAuth))
      .map(p => `<a href="${p.href}" class="nav-link${activePage === p.key ? ' active' : ''}">${p.icon}${p.label}</a>`)
      .join('');

    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    navbar.innerHTML = `
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon">${logoSVG()}</div>
        <div>
          <div class="nav-logo-text">Kube-Monitor</div>
          <span class="nav-logo-sub">K8s Resource Monitor</span>
        </div>
      </a>
      <nav class="nav-links">${linksHTML}</nav>
      <div class="nav-spacer"></div>
      <div class="nav-right">${rightHTML}</div>`;

    if (isAuth) {
      setInterval(() => {
        const el = document.getElementById('nav-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('en-GB');
      }, 1000);
    }
  }
};

// ── ICON SVGs ─────────────────────────
function logoSVG() {
  return `<svg width="20" height="20" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 2.5" opacity=".8"/>
    <circle cx="20" cy="20" r="5.5" fill="#38bdf8"/>
    <line x1="20" y1="4" x2="20" y2="12" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round"/>
    <line x1="20" y1="28" x2="20" y2="36" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round"/>
    <line x1="4" y1="20" x2="12" y2="20" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round"/>
    <line x1="28" y1="20" x2="36" y2="20" stroke="#2dd4bf" stroke-width="2" stroke-linecap="round"/>
    <circle cx="20" cy="4" r="2.5" fill="#38bdf8"/>
    <circle cx="20" cy="36" r="2.5" fill="#38bdf8"/>
    <circle cx="4" cy="20" r="2.5" fill="#38bdf8"/>
    <circle cx="36" cy="20" r="2.5" fill="#38bdf8"/>
  </svg>`;
}
function iconHome()   { return `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>`; }
function iconGrid()   { return `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`; }
function iconServer() { return `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z"/></svg>`; }
function iconChart()  { return `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>`; }
function iconLock()   { return `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/></svg>`; }

// ── METRICS ENGINE ────────────────────
const NODES_CONFIG = [
  { name: 'master-node',  type: 'master',  cpu: 4,  mem: 16 * 1024**3, os: 'Ubuntu 20.04 LTS' },
  { name: 'worker-pc-1',  type: 'laptop',  cpu: 4,  mem: 16 * 1024**3, os: 'Ubuntu 20.04 LTS' },
  { name: 'worker-rpi-1', type: 'rpi',     cpu: 4,  mem: 8  * 1024**3, os: 'Ubuntu 21.04'     },
  { name: 'worker-rpi-2', type: 'rpi',     cpu: 4,  mem: 8  * 1024**3, os: 'Ubuntu 21.04'     },
];

const MetricsEngine = {
  history: {},
  current: [],

  init() {
    NODES_CONFIG.forEach(n => { this.history[n.name] = []; });
    for (let i = 0; i < 12; i++) this._generate();
  },

  _r: (a, b) => parseFloat((Math.random() * (b - a) + a).toFixed(4)),
  _ri: (a, b) => Math.floor(Math.random() * (b - a + 1) + a),

  _generate() {
    const ts = new Date().toLocaleTimeString('en-GB');
    this.current = NODES_CONFIG.map(n => {
      const uCPU = this._r(0.08, n.cpu * 0.82);
      const uMem = this._r(n.mem * 0.12, n.mem * 0.78);
      const m = {
        name: n.name, type: n.type, os: n.os,
        allocCPU: n.cpu, allocMem: n.mem,
        limCPU:   this._r(0.4, n.cpu),
        limMem:   this._r(n.mem * .2, n.mem * .9),
        reqCPU:   this._r(0.05, uCPU),
        reqMem:   this._r(n.mem * .05, uMem),
        useCPU: uCPU, useMem: uMem,
        pods: this._ri(1, n.type === 'rpi' ? 5 : 10),
        status: 'Ready',
        uptime: this._r(95, 99.99).toFixed(2) + '%',
        ts
      };
      this.history[n.name].push({ t: ts, cpu: uCPU, mem: uMem });
      if (this.history[n.name].length > 25) this.history[n.name].shift();
      return m;
    });
  },

  tick() { this._generate(); return this.current; },
  get()  { return this.current; },
  getHistory(name) { return this.history[name] || []; }
};

// ── FORMATTERS ────────────────────────
const Fmt = {
  bytes(b) {
    if (!b) return '0 B';
    if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
    if (b >= 1048576)    return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1024).toFixed(1) + ' KB';
  },
  cpu(v)  { return v ? (+v).toFixed(3) : '0.000'; },
  pct(u, t) { return t ? Math.min(100, (u / t * 100)).toFixed(1) : 0; },
  cpuColor(p) { return +p > 80 ? 'var(--rose)' : +p > 60 ? 'var(--amber)' : 'var(--cyan)'; },
  memColor(p) { return +p > 80 ? 'var(--rose)' : +p > 60 ? 'var(--amber)' : 'var(--teal)'; },
  nodeTypeBadge(t) {
    if (t === 'master') return 'badge-indigo';
    if (t === 'rpi')    return 'badge-teal';
    return 'badge-cyan';
  },
  nodeTypeLabel(t) {
    if (t === 'master') return 'Master';
    if (t === 'rpi')    return 'RPi 4B';
    return 'Laptop';
  }
};

// ── FOOTER ────────────────────────────
function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;
  el.innerHTML = `
    <div class="footer-inner">
      <a href="index.html" class="footer-brand">
        <div class="nav-logo-icon" style="width:28px;height:28px;border-radius:8px">${logoSVG()}</div>
        <span class="footer-brand-name">Kube-Monitor</span>
      </a>
      <div class="footer-copy">© 2024 Kube-Monitor · MICST-2022 Research Implementation</div>
      <div class="footer-links">
        <a href="index.html"     class="footer-link">Home</a>
        <a href="dashboard.html" class="footer-link">Dashboard</a>
        <a href="nodes.html"     class="footer-link">Nodes</a>
        <a href="metrics.html"   class="footer-link">Metrics</a>
      </div>
    </div>`;
}

// ── CHART FACTORY ─────────────────────
function makeLineChart(canvasId, color = '#38bdf8', label = 'CPU') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label, data: [],
      borderColor: color, backgroundColor: color.replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#38bdf8', 'rgba(56,189,248,0.08)').replace('#2dd4bf', 'rgba(45,212,191,0.08)').replace('#818cf8', 'rgba(129,140,248,0.08)'),
      borderWidth: 2, tension: 0.4, fill: true,
      pointBackgroundColor: color, pointRadius: 2, pointHoverRadius: 5
    }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(9,18,32,.97)',
          borderColor: 'rgba(56,189,248,.25)', borderWidth: 1,
          titleFont: { family: 'IBM Plex Mono', size: 10 },
          bodyFont:  { family: 'IBM Plex Mono', size: 12 },
          titleColor: '#5a7a96', bodyColor: color,
          padding: 10,
        }
      },
      scales: {
        x: { ticks: { color: '#5a7a96', font: { family: 'IBM Plex Mono', size: 9 }, maxTicksLimit: 8 },
             grid: { color: 'rgba(56,189,248,.04)' }, border: { color: 'rgba(56,189,248,.08)' } },
        y: { ticks: { color: '#5a7a96', font: { family: 'IBM Plex Mono', size: 9 } },
             grid: { color: 'rgba(56,189,248,.04)' }, border: { color: 'rgba(56,189,248,.08)' } }
      },
      animation: { duration: 400 }
    }
  });
}

function updateLineChart(chart, history) {
  if (!chart || !history.length) return;
  chart.data.labels = history.map(h => h.t);
  chart.data.datasets[0].data = history.map(h => parseFloat(h.cpu.toFixed(3)));
  chart.update('active');
}
