/* =====================================================
   SOC_Espace – Script unifié
   ===================================================== */
'use strict';

// ── Données utilisateurs (in-memory) ─────────────────────────
let USERS = [
  { username: 'root',  password: 'toor',     role: 'root',  created_at: '2024-01-01' },
  { username: 'admin', password: 'admin123', role: 'admin', created_at: '2024-01-02' },
  { username: 'user1', password: 'pass1',    role: 'user',  created_at: '2024-01-03' }
];

// ── Alertes IDS (in-memory) ───────────────────────────────────
let IDS_ALERTS = [];

// ── Logs (in-memory) ─────────────────────────────────────────
let LOGS = [];

function addLog(message, type = 'info', username = '') {
  const now = new Date();
  LOGS.unshift({
    date: now.toLocaleString('fr-FR'),
    type,
    username: username || (sessionStorage.getItem('soc_user') || '—'),
    message
  });
  if (LOGS.length > 500) LOGS.pop();

  // Also show in terminal panel
  const logOutput = document.getElementById('logOutput');
  if (logOutput) {
    const time = now.toLocaleTimeString('fr-FR');
    const tags = { success: '[SUCCESS]', error: '[ERREUR]', warn: '[ALERTE]', info: '[INFO]' };
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${time}] ${tags[type] || '[INFO]'} ${message}`;
    logOutput.appendChild(entry);
    logOutput.scrollTop = logOutput.scrollHeight;
  }
}

// ============================================================
//  MATRIX RAIN
// ============================================================
(function initMatrix() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニ∂∑√∞≈';
  const fontSize = 12;
  let drops = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cols = Math.floor(canvas.width / fontSize);
    for (let i = 0; i < cols; i++) {
      if (!drops[i]) drops[i] = 0;
      const c = chars[Math.floor(Math.random() * chars.length)];
      const alpha = 0.4 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(0,255,65,${alpha})`;
      ctx.font = `${fontSize}px Share Tech Mono, monospace`;
      ctx.fillText(c, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 50);
})();

// ============================================================
//  CLOCK
// ============================================================
function updateClock() {
  const el = document.getElementById('navClock');
  const de = document.getElementById('navDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString('fr-FR');
  if (de) de.textContent = now.toLocaleDateString('fr-FR');
}
if (document.getElementById('navClock')) {
  updateClock();
  setInterval(updateClock, 1000);
}

// ============================================================
//  LOGIN FORM
// ============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username    = document.getElementById('username').value.trim();
    const password    = document.getElementById('password').value;
    const loginBtn    = document.getElementById('loginBtn');
    const spinner     = document.getElementById('btnSpinner');
    const btnText     = document.querySelector('.btn-text');
    const errorBanner = document.getElementById('errorBanner');
    const errorText   = document.getElementById('errorText');

    loginBtn.disabled = true;
    spinner.style.display = 'inline';
    btnText.textContent = 'Authentification…';
    addLog(`Tentative de connexion : user=${username}`, 'info', username);

    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        addLog(`Connexion réussie : user=${username} (${user.role})`, 'success', username);
        errorBanner.style.display = 'none';
        btnText.textContent = 'Accès accordé ✓';
        sessionStorage.setItem('soc_user', username);
        sessionStorage.setItem('soc_role', user.role);
        setTimeout(() => {
          window.location.href = user.role === 'root' ? 'dashboard-root.html' : 'dashboard-admin.html';
        }, 800);
      } else {
        addLog(`Échec de connexion : user=${username}`, 'error', username);
        errorText.textContent = 'Nom d\'utilisateur ou mot de passe incorrect.';
        errorBanner.style.display = 'flex';
        loginBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Connexion Sécurisée';
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
      }
    }, 900);
  });
}

// ============================================================
//  AUTH CHECK (dashboard pages)
// ============================================================
function requireAuth(requiredRole) {
  const user = sessionStorage.getItem('soc_user');
  const role = sessionStorage.getItem('soc_role');
  if (!user) {
    window.location.href = 'login.html';
    return false;
  }
  if (requiredRole === 'root' && role !== 'root') {
    window.location.href = 'dashboard-admin.html';
    return false;
  }
  return true;
}

function loadNavUser() {
  const user = sessionStorage.getItem('soc_user') || '—';
  const role = sessionStorage.getItem('soc_role') || 'user';
  const navUser = document.getElementById('navUser');
  const navRole = document.getElementById('navRole');
  if (navUser) navUser.textContent = '👤 ' + user;
  if (navRole) {
    navRole.textContent = role.toUpperCase();
    if (role === 'root') navRole.classList.add('root');
  }
  const welcomeUser = document.getElementById('welcomeUser');
  if (welcomeUser) welcomeUser.textContent = user;
}

function logout() {
  addLog('Déconnexion utilisateur', 'info');
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ============================================================
//  TERMINAL TOGGLE + TABS
// ============================================================
const termPanel = document.getElementById('terminalPanel');
const toggleBtn = document.getElementById('terminalToggle');
if (toggleBtn && termPanel) {
  toggleBtn.addEventListener('click', () => {
    const collapsed = termPanel.classList.toggle('collapsed');
    toggleBtn.textContent = collapsed ? '▲' : '▼';
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btnId = 'tab-' + tab;
  const contentId = tab + 'Tab';
  const btn = document.getElementById(btnId);
  const content = document.getElementById(contentId);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  if (tab === 'terminal' && termState.step === 'idle') {
    startTerminalSession();
  }
}

// ============================================================
//  TERMINAL SESSION
// ============================================================
const termState = {
  authenticated: false,
  step: 'idle',
  loginAttempt: '',
  historyIndex: -1,
  history: []
};

function startTerminalSession() {
  const input = document.getElementById('termInput');
  if (!input) return;
  termState.step = 'awaiting-login';
  input.disabled = false;
  input.type = 'text';
  input.focus();
  termPrint('Connexion au terminal de sécurité SOC_Espace…', 'result');
  termPrint('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'result');
  termPrint('', '');
  setPrompt('login: ');
  input.addEventListener('keydown', handleTermInput);
}

function handleTermInput(e) {
  if (e.key === 'ArrowUp' && termState.step === 'ready') {
    e.preventDefault();
    if (termState.historyIndex < termState.history.length - 1) {
      termState.historyIndex++;
      this.value = termState.history[termState.history.length - 1 - termState.historyIndex];
    }
    return;
  }
  if (e.key === 'ArrowDown' && termState.step === 'ready') {
    e.preventDefault();
    if (termState.historyIndex > 0) {
      termState.historyIndex--;
      this.value = termState.history[termState.history.length - 1 - termState.historyIndex];
    } else {
      termState.historyIndex = -1;
      this.value = '';
    }
    return;
  }
  if (e.key !== 'Enter') return;

  const val = this.value.trim();

  if (termState.step === 'awaiting-login') {
    termPrint('login: ' + val, 'cmd');
    termState.loginAttempt = val;
    termState.step = 'awaiting-password';
    this.type = 'password';
    setPrompt('password: ');
    this.value = '';
    return;
  }

  if (termState.step === 'awaiting-password') {
    termPrint('password: ••••••••', 'cmd');
    const pass = this.value;
    this.value = '';
    const rootUser = USERS.find(u => u.username === termState.loginAttempt && u.password === pass && u.role === 'root');
    if (rootUser) {
      termState.authenticated = true;
      termState.step = 'ready';
      this.type = 'text';
      termPrint('', '');
      termPrint('Accès accordé. Bienvenue, ' + termState.loginAttempt + '.', 'ok');
      termPrint('Tapez "help" pour voir les commandes disponibles.', 'result');
      termPrint('', '');
      setPrompt('SOC_Espace ~# ');
      addLog(`Accès terminal root : ${termState.loginAttempt}`, 'warn');
    } else {
      termState.step = 'idle';
      termPrint('', '');
      termPrint('Accès refusé. Identifiants invalides.', 'error');
      termPrint('Seul le compte root peut accéder au terminal.', 'error');
      addLog(`Tentative terminal refusée : ${termState.loginAttempt}`, 'error');
      setTimeout(() => {
        termState.step = 'awaiting-login';
        termPrint('── Nouvelle tentative ──', 'result');
        setPrompt('login: ');
        this.type = 'text';
      }, 1500);
    }
    return;
  }

  if (termState.step === 'ready') {
    termState.historyIndex = -1;
    if (!val) return;
    termPrint(`SOC_Espace ~# ${val}`, 'cmd');
    termState.history.push(val);
    const output = handleCommand(val);
    if (output) {
      if (Array.isArray(output)) {
        output.forEach(line => termPrint(line.text, line.type || 'result'));
      } else {
        termPrint(output, 'result');
      }
    }
    this.value = '';
    scrollTermOutput();
  }
}

function handleCommand(rawCmd) {
  const parts = rawCmd.trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();

  switch (cmd) {
    case 'help':
      return [
        { text: '', type: 'result' },
        { text: '┌─── COMMANDES DISPONIBLES ───────────────────────────┐', type: 'ok' },
        { text: '│  help                   Affiche cette aide           │', type: 'result' },
        { text: '│  account                Liste les utilisateurs       │', type: 'result' },
        { text: '│  adduser <user> <pass>  Créer un utilisateur        │', type: 'result' },
        { text: '│  deluser <user>         Supprimer un utilisateur    │', type: 'result' },
        { text: '│  passwd <user> <pass>   Changer le mot de passe     │', type: 'result' },
        { text: '│  whoami                 Utilisateur actif            │', type: 'result' },
        { text: '│  alerts                 Voir les alertes IDS         │', type: 'result' },
        { text: '│  logs [N]               Voir les N derniers logs     │', type: 'result' },
        { text: '│  clear                  Vider le terminal            │', type: 'result' },
        { text: '│  exit                   Se déconnecter              │', type: 'result' },
        { text: '└────────────────────────────────────────────────────┘', type: 'ok' },
        { text: '', type: 'result' }
      ];

    case 'account': {
      const lines = [
        { text: '', type: 'result' },
        { text: '  USERNAME          RÔLE', type: 'ok' },
        { text: '  ─────────────────────────────────', type: 'result' }
      ];
      USERS.forEach(u => {
        lines.push({ text: `  ${u.username.padEnd(18)} ${u.role}`, type: 'result' });
      });
      lines.push({ text: '', type: 'result' });
      lines.push({ text: `  Total : ${USERS.length} compte(s)`, type: 'ok' });
      lines.push({ text: '', type: 'result' });
      return lines;
    }

    case 'adduser': {
      if (!parts[1] || !parts[2]) return [{ text: 'Usage : adduser <username> <password>', type: 'error' }];
      const newUser = parts[1], newPass = parts[2];
      if (USERS.find(u => u.username === newUser)) return [{ text: `Erreur : "${newUser}" existe déjà.`, type: 'error' }];
      USERS.push({ username: newUser, password: newPass, role: 'user', created_at: new Date().toLocaleDateString('fr-FR') });
      addLog(`Utilisateur créé : ${newUser}`, 'success');
      return [{ text: `OK — Utilisateur "${newUser}" créé.`, type: 'ok' }];
    }

    case 'deluser': {
      if (!parts[1]) return [{ text: 'Usage : deluser <username>', type: 'error' }];
      if (parts[1] === 'root') return [{ text: 'Erreur : impossible de supprimer root.', type: 'error' }];
      const before = USERS.length;
      USERS = USERS.filter(u => u.username !== parts[1]);
      if (USERS.length === before) return [{ text: `Erreur : "${parts[1]}" introuvable.`, type: 'error' }];
      addLog(`Utilisateur supprimé : ${parts[1]}`, 'warn');
      return [{ text: `OK — Utilisateur "${parts[1]}" supprimé.`, type: 'ok' }];
    }

    case 'passwd': {
      if (!parts[1] || !parts[2]) return [{ text: 'Usage : passwd <username> <password>', type: 'error' }];
      const found = USERS.find(u => u.username === parts[1]);
      if (!found) return [{ text: `Erreur : "${parts[1]}" introuvable.`, type: 'error' }];
      found.password = parts[2];
      addLog(`Mot de passe modifié : ${parts[1]}`, 'info');
      return [{ text: `OK — Mot de passe de "${parts[1]}" mis à jour.`, type: 'ok' }];
    }

    case 'whoami':
      return [{ text: `${termState.loginAttempt} (root)`, type: 'ok' }];

    case 'alerts': {
      if (!IDS_ALERTS.length) return [{ text: 'Aucune alerte IDS enregistrée.', type: 'result' }];
      const lines = [{ text: '', type: 'result' }, { text: '─── ALERTES IDS ───', type: 'ok' }];
      IDS_ALERTS.slice(0, 10).forEach(a => {
        lines.push({ text: `  [${a.severity.toUpperCase()}] ${a.type} — ${a.source} — ${a.date}`, type: a.severity === 'critical' ? 'error' : 'warn' });
      });
      lines.push({ text: '', type: 'result' });
      return lines;
    }

    case 'logs': {
      const n = parseInt(parts[1]) || 10;
      if (!LOGS.length) return [{ text: 'Aucun log disponible.', type: 'result' }];
      const lines = [{ text: '', type: 'result' }, { text: '─── JOURNAL ───', type: 'ok' }];
      LOGS.slice(0, n).forEach(l => {
        lines.push({ text: `  [${l.type.toUpperCase()}] ${l.message}`, type: l.type === 'success' ? 'ok' : l.type });
      });
      lines.push({ text: '', type: 'result' });
      return lines;
    }

    case 'clear': {
      const termOutput = document.getElementById('termOutput');
      if (termOutput) termOutput.innerHTML = '';
      return null;
    }

    case 'exit': {
      termState.authenticated = false;
      termState.step = 'idle';
      addLog(`Déconnexion terminal : ${termState.loginAttempt}`, 'info');
      termState.loginAttempt = '';
      termPrint('', '');
      termPrint('Déconnexion. Session terminée.', 'warn');
      const input = document.getElementById('termInput');
      if (input) {
        input.disabled = true;
        input.removeEventListener('keydown', handleTermInput);
      }
      setPrompt('$');
      setTimeout(() => {
        termState.step = 'awaiting-login';
        if (input) { input.disabled = false; input.type = 'text'; input.addEventListener('keydown', handleTermInput); }
        termPrint('── Nouvelle session ──', 'result');
        setPrompt('login: ');
      }, 1500);
      return null;
    }

    default:
      return [{ text: `Commande inconnue : "${cmd}". Tapez "help".`, type: 'error' }];
  }
}

function termPrint(text, type = 'result') {
  const termOutput = document.getElementById('termOutput');
  if (!termOutput) return;
  const line = document.createElement('div');
  line.className = `term-line ${type}`;
  line.textContent = text === '' ? '\u00A0' : text;
  termOutput.appendChild(line);
  scrollTermOutput();
}

function setPrompt(text) {
  const prompt = document.getElementById('termPrompt');
  if (prompt) prompt.textContent = text;
}

function scrollTermOutput() {
  const t = document.getElementById('termOutput');
  if (t) t.scrollTop = t.scrollHeight;
}

// ============================================================
//  IDS ENGINE (simulation)
// ============================================================
const IDS_PATTERNS = [
  { pattern: /('|"|;|--|\/\*|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bEXEC\b)/i, type: 'SQL Injection', severity: 'critical' },
  { pattern: /(<script|javascript:|onerror=|onload=|alert\(|document\.cookie|eval\()/i, type: 'XSS', severity: 'high' },
  { pattern: /(\.\.\/|\.\.\\|\/etc\/passwd|\/etc\/shadow|\/proc\/)/i, type: 'LFI / Path Traversal', severity: 'high' },
  { pattern: /(\bexec\b|\bsystem\b|\bpassthru\b|\bshell_exec\b|`[^`]+`|\$\()/i, type: 'Command Injection', severity: 'critical' },
  { pattern: /(nmap|nikto|sqlmap|metasploit|burp|hydra|masscan)/i, type: 'Outil d\'attaque', severity: 'high' },
  { pattern: /(wget|curl|nc |netcat|bash -i|\/bin\/sh)/i, type: 'Reverse Shell', severity: 'critical' },
  { pattern: /(\bphpinfo\b|\bevalbase64\b|base64_decode\(|gzinflate\()/i, type: 'Webshell / PHP injection', severity: 'critical' }
];

function analyzePayload(payload, source) {
  for (const rule of IDS_PATTERNS) {
    if (rule.pattern.test(payload)) {
      const alert = {
        id: Date.now(),
        date: new Date().toLocaleString('fr-FR'),
        type: rule.type,
        severity: rule.severity,
        source: source || '127.0.0.1',
        payload: payload.substring(0, 100)
      };
      IDS_ALERTS.unshift(alert);
      addLog(`IDS : ${rule.type} détecté depuis ${alert.source}`, 'error');
      return { detected: true, ...alert };
    }
  }
  return { detected: false };
}

// ============================================================
//  SCANNER (simulation)
// ============================================================
function runScan(url) {
  const results = [];
  const isHttps = url.startsWith('https://');

  if (!isHttps) {
    results.push({ severity: 'high', type: 'HTTPS manquant', detail: 'Le site utilise HTTP non chiffré. Les données transitent en clair.', test: 'Vérification protocole' });
  } else {
    results.push({ severity: 'safe', type: 'HTTPS actif', detail: 'Connexion chiffrée détectée.', test: 'Vérification protocole' });
  }

  const sqlTests = ["' OR '1'='1", "1; DROP TABLE users--", "UNION SELECT NULL--"];
  if (Math.random() < 0.3) {
    results.push({ severity: 'critical', type: 'SQL Injection possible', detail: `Paramètre potentiellement vulnérable à l'injection SQL.`, test: sqlTests[Math.floor(Math.random() * sqlTests.length)] });
  } else {
    results.push({ severity: 'safe', type: 'SQL Injection', detail: 'Aucune vulnérabilité SQLi détectée.', test: 'Multiple payloads SQLi testés' });
  }

  if (Math.random() < 0.4) {
    results.push({ severity: 'high', type: 'XSS Réfléchi potentiel', detail: 'Un ou plusieurs paramètres semblent refléter les données sans encodage.', test: '<script>alert(1)</script>' });
  } else {
    results.push({ severity: 'safe', type: 'XSS', detail: 'Aucun vecteur XSS réfléchi trouvé.', test: 'Payloads XSS testés' });
  }

  const missingHeaders = [];
  if (Math.random() < 0.6) missingHeaders.push('Content-Security-Policy');
  if (Math.random() < 0.5) missingHeaders.push('X-Frame-Options');
  if (Math.random() < 0.4) missingHeaders.push('Strict-Transport-Security');
  if (Math.random() < 0.3) missingHeaders.push('X-XSS-Protection');

  if (missingHeaders.length) {
    results.push({ severity: 'medium', type: 'En-têtes de sécurité manquants', detail: `Headers absents : ${missingHeaders.join(', ')}`, test: 'Analyse des en-têtes HTTP' });
  } else {
    results.push({ severity: 'safe', type: 'En-têtes de sécurité', detail: 'Tous les en-têtes de sécurité recommandés sont présents.', test: 'Analyse en-têtes HTTP' });
  }

  if (Math.random() < 0.2) {
    results.push({ severity: 'medium', type: 'Open Redirect possible', detail: 'Un paramètre de redirection pourrait être exploité.', test: '?next=https://evil.com' });
  }

  if (Math.random() < 0.35) {
    results.push({ severity: 'medium', type: 'LFI potentielle', detail: 'Chemin de fichier détecté dans les paramètres.', test: '../../etc/passwd' });
  }

  addLog(`Scan terminé : ${url} — ${results.length} résultat(s)`, 'info');
  return { url, results };
}

// ============================================================
//  CRYPTO AUDIT (simulation)
// ============================================================
function runCryptoAudit(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  const isHttps = url.startsWith('https://');
  const grade = isHttps ? ['A+', 'A', 'A', 'B+', 'B'][Math.floor(Math.random() * 5)] : 'F';

  const checks = [
    { label: 'Protocole HTTPS', ok: isHttps, detail: isHttps ? 'Connexion chiffrée active' : 'HTTP non sécurisé détecté', severity: isHttps ? 'safe' : 'critical' },
    { label: 'TLS Version', ok: isHttps, detail: isHttps ? 'TLS 1.3 / 1.2 supporté' : 'N/A', severity: isHttps ? 'safe' : 'high' },
    { label: 'Certificat SSL', ok: isHttps, detail: isHttps ? (Math.random() > 0.2 ? 'Certificat valide' : 'Certificat expirant bientôt') : 'Absent', severity: isHttps ? 'safe' : 'critical' },
    { label: 'HSTS (Strict-Transport)', ok: isHttps && Math.random() > 0.4, detail: 'Vérifie Strict-Transport-Security header', severity: 'medium' },
    { label: 'Content-Security-Policy', ok: Math.random() > 0.5, detail: 'Politique de sécurité du contenu', severity: 'medium' },
    { label: 'X-Frame-Options', ok: Math.random() > 0.4, detail: 'Protection contre le clickjacking', severity: 'medium' },
    { label: 'Cookies Secure', ok: isHttps && Math.random() > 0.3, detail: 'Attributs Secure et HttpOnly', severity: 'medium' },
    { label: 'Redirection HTTP→HTTPS', ok: isHttps, detail: isHttps ? 'Redirection automatique active' : 'Pas de redirection', severity: isHttps ? 'safe' : 'high' }
  ];

  addLog(`Audit crypto : ${url} — Grade: ${grade}`, 'info');
  return { url, grade, checks };
}

// ============================================================
//  REPORTS DATA
// ============================================================
function getReportData() {
  const byType = { success: 0, error: 0, warn: 0, info: 0 };
  LOGS.forEach(l => { if (byType[l.type] !== undefined) byType[l.type]++; });
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  IDS_ALERTS.forEach(a => { if (bySeverity[a.severity] !== undefined) bySeverity[a.severity]++; });
  return {
    totalLogs: LOGS.length,
    byType,
    totalAlerts: IDS_ALERTS.length,
    bySeverity,
    totalUsers: USERS.length,
    recentLogs: LOGS.slice(0, 20),
    recentAlerts: IDS_ALERTS.slice(0, 10)
  };
}

// ============================================================
//  INITIAL LOGS
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => addLog('Système SOC_Espace initialisé', 'info', 'système'),      300);
  setTimeout(() => addLog('Vérification des certificats… OK', 'success', 'système'), 900);
  setTimeout(() => addLog('Chiffrement TLS 1.3 actif', 'success', 'système'),       1500);
  setTimeout(() => addLog('Surveillance réseau en attente', 'warn', 'système'),      2100);
});
