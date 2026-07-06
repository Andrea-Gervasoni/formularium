/* ============================================================================
   FORMULARIUM — app.js  (vanilla JS, no build step, no framework)
   ----------------------------------------------------------------------------
     0. CONFIG — master credentials + EmailJS (the only things you edit here)
     1. Utilities (hash, storage, math render)
     2. Auth: view routing, registration, code generation, code/master login
     3. Content: load content.json, landing themes grid, tree, render a topic
     4. Progress: completion check-dials + the tuning-gauge
   ============================================================================ */

/* ============================================================================
   0. CONFIG
   ----------------------------------------------------------------------------
   ⚠ SECURITY NOTE — READ THIS.
   This is a 100% static site (GitHub Pages): there is NO server. Any "login"
   here is cosmetic / convenience only. Everything below ships inside the
   public JavaScript bundle, so a determined visitor can read it. Do NOT put
   anything genuinely secret behind this gate. The master password is stored as
   a cyrb53 hash (not plaintext) merely so the literal word isn't sitting in the
   source — this is obfuscation, NOT real security. Generated access codes live
   in the visitor's own localStorage and are not checked against any database.
   For real access control you need a backend. Treat this formulary as PUBLIC.
   ============================================================================ */
const CONFIG = {
  // Master (docente/admin) login. Regenerate hashes by running cyrb53('value')
  // in the browser console. Defaults: docente / maturita2026
  MASTER_USER_HASH: '191f14bbe728c8',   // = cyrb53('docente')
  MASTER_PASS_HASH: '15fb3197e1cbf',    // = cyrb53('maturita2026')

  // EmailJS — OPTIONAL. Leave PUBLIC_KEY as '' to skip email (code still shown).
  EMAILJS: { PUBLIC_KEY: '8VjEnZQYIeANEbY-0', SERVICE_ID: 'service_ktqyywt', TEMPLATE_ID: 'template_jjy29te' },

  // SUPABASE — OPTIONAL but recommended for a REAL login (codes valid on every
  // device, stored in a database). Leave URL/ANON_KEY as '' to stay in local
  // (device-only) mode. Setup: see README §"Login reale con Supabase".
  // The anon key is designed to be public; the data is protected by the SQL
  // policies + functions in supabase-schema.sql — never paste the *service* key.
  SUPABASE: { URL: 'https://iwwycwyrfubvjbtlkyby.supabase.co', ANON_KEY: 'sb_publishable_ELjDcNqI3guYt7FvoXhoxg_Ie9SiWfR' },

  // GOOGLE SHEETS — OPTIONAL. Paste the Web App URL from Apps Script to save
  // star ratings. Only stores: rating (1-5), language, timestamp. NO personal data.
  // Setup: see google-reviews-script.js
  REVIEWS_SHEET_URL: 'https://script.google.com/macros/s/AKfycbzk8jpC_Ca50zYTCPpSgIgeynzyxR4C3--D__y00irOFGhfWgXbDE7_tIOk1xJ8SHK4RA/exec'
};

const LS = {
  AUTH:  'formularium.auth',
  CODES: 'formularium.codes',
  DONE:  'formularium.done',
  LAST:  'formularium.lastTopic'
};

/* ============================================================================
   1. UTILITIES
   ============================================================================ */
// cyrb53 — tiny fast string hash (NOT cryptographic; see security note above).
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
window.cyrb53 = cyrb53; // so the owner can mint new master hashes in the console

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const store = {
  get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch (e) { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

// Supabase client (lazy). Returns the client, or false if not configured.
// NB: if the CDN script hasn't loaded yet, we return false WITHOUT caching,
// so a later call can still succeed once the deferred script arrives.
let _sb = null;
function sb() {
  if (_sb !== null) return _sb;
  const c = CONFIG.SUPABASE;
  if (!(c && c.URL && c.ANON_KEY)) { _sb = false; return _sb; }
  if (!(window.supabase && window.supabase.createClient)) return false; // retry later
  _sb = window.supabase.createClient(c.URL, c.ANON_KEY);
  return _sb;
}

function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let c = ''; const a = new Uint32Array(6);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 1e9);
  for (let i = 0; i < 6; i++) c += alphabet[a[i] % alphabet.length];
  return c;
}

function renderMath(el) {
  const run = () => {
    if (!window.renderMathInElement) return false;
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false }
      ],
      throwOnError: false
    });
    return true;
  };
  if (!run()) { let n = 0; const t = setInterval(() => { if (run() || ++n > 60) clearInterval(t); }, 50); }
}

// minimal markdown: escape + **bold**
function inlineFmt(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/* ============================================================================
   2. AUTH + ROUTING
   ============================================================================ */
function showView(name) {
  $$('.view').forEach(v => v.classList.toggle('is-active', v.id === 'view-' + name));
  window.scrollTo(0, 0);
  if (window.I18N) I18N.apply();
}
function isAuthed() { return localStorage.getItem(LS.AUTH) === '1'; }
function setAuthed(v) { v ? localStorage.setItem(LS.AUTH, '1') : localStorage.removeItem(LS.AUTH); }
function notice(el, type, msg) { el.className = 'notice ' + type; el.textContent = msg; el.classList.remove('hidden'); }

function initNav() {
  // flag switch (IT/EN)
  const flagSwitch = document.getElementById('lang-switch');
  function syncFlagSwitch() {
    if (!flagSwitch) return;
    const l = window.I18N ? I18N.lang() : 'it';
    flagSwitch.classList.toggle('lang-it', l === 'it');
    flagSwitch.classList.toggle('lang-en', l === 'en');
  }
  if (flagSwitch) {
    syncFlagSwitch();
    const doLangToggle = () => {
      if (window.I18N) { I18N.toggle(); I18N.apply(); }
      syncFlagSwitch();
      const sub = document.querySelector('.rail-head .wm small'); if (sub) sub.textContent = I18N.t('rail_subtitle');
      const lo = document.getElementById('logout-btn'); if (lo) lo.textContent = I18N.t('logout_btn');
      const grid = document.getElementById('themes-grid'); if (grid && CONTENT) { grid.innerHTML = ''; buildLanding(); }
      const sel = document.getElementById('r-ruolo');
      if (sel) { const opts = I18N.t('reg_ruolo_opts'); [...sel.options].forEach((o,i)=>{ if(i===0){o.text=I18N.t('reg_ruolo_placeholder');}else if(opts[i-1]){o.text=opts[i-1];} }); }
    };
    flagSwitch.addEventListener('click', doLangToggle);
    flagSwitch.addEventListener('keydown', e => { if(e.key===' '||e.key==='Enter'){e.preventDefault();doLangToggle();} });
  }
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => {
    const dest = b.dataset.goto;
    if (dest === 'app') { if (isAuthed()) enterApp(); else showView('register'); return; }
    showView(dest);
  }));
  const lo = $('#logout-btn');
  if (lo) lo.addEventListener('click', () => { setAuthed(false); showView('landing'); });
  // navbar depth on scroll
  const nav = $('#nav');
  if (nav) { const sync = () => nav.classList.toggle('scrolled', window.scrollY > 8); window.addEventListener('scroll', sync, { passive: true }); sync(); }
}

function initRegister() {

  // update ruolo <select> options on load in case lang != 'it'
  (function syncRuoloOpts() {
    const sel = document.getElementById('r-ruolo');
    if (!sel || !window.I18N) return;
    const opts = I18N.t('reg_ruolo_opts');
    if (!Array.isArray(opts)) return;
    [...sel.options].forEach((o, i) => {
      if (i === 0) { o.text = I18N.t('reg_ruolo_placeholder'); return; }
      if (opts[i-1]) o.text = opts[i-1];
    });
  })();

  const form = $('#register-form'), msg = $('#register-msg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nome: $('#r-nome').value.trim(), cognome: $('#r-cognome').value.trim(),
      ruolo: $('#r-ruolo').value, email: $('#r-email').value.trim()
    };
    if (!data.nome || !data.cognome || !data.ruolo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      notice(msg, 'err', I18N.t('err_form') || 'Controlla i campi: nome, cognome, ruolo ed email valida sono obbligatori.'); return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Genero il codice…';
    const reEnable = () => { btn.disabled = false; btn.textContent = 'Genera il mio codice'; };

    // create the code: Supabase (real, cross-device) if configured, else local-only
    let code;
    const client = sb();
    if (client) {
      try {
        const { data: rpcCode, error } = await client.rpc('fh_register', {
          p_nome: data.nome, p_cognome: data.cognome, p_ruolo: data.ruolo, p_email: data.email
        });
        if (error) throw error;
        code = rpcCode;
      } catch (err) {
        console.warn('Supabase register error:', err);
        notice(msg, 'err', 'Errore di connessione al server. Riprova tra poco.'); reEnable(); return;
      }
    } else {
      code = genCode();
    }
    // remember on this device too (so the same browser logs in instantly)
    const codes = store.get(LS.CODES, {}); codes[code] = { ...data, ts: Date.now() }; store.set(LS.CODES, codes);

    $('#generated-code').textContent = code;
    const ticket = $('#code-result .code-ticket');

    const cfg = CONFIG.EMAILJS;
    const emailConfigured = !!(cfg.PUBLIC_KEY && cfg.SERVICE_ID && cfg.TEMPLATE_ID);
    // nascondi SEMPRE il ticket se l'email è configurata — appare solo come ripiego su errore
    if (ticket) ticket.classList.toggle('hidden', emailConfigured);
    $('#code-result').classList.remove('hidden');

    if (emailConfigured) {
      notice(msg, 'ok', I18N.t('sending_email', data.email));
      try {
        // aspetta fino a 8s che emailjs CDN sia caricato
        let tries = 0;
        while (!window.emailjs && tries++ < 80) await new Promise(r => setTimeout(r, 100));
        if (!window.emailjs) throw new Error('EmailJS CDN not loaded');
        emailjs.init({ publicKey: cfg.PUBLIC_KEY });
        await emailjs.send(cfg.SERVICE_ID, cfg.TEMPLATE_ID, {
          to_name: data.nome + ' ' + data.cognome, to_email: data.email, email: data.email,
          access_code: code, passcode: code, code: code, ruolo: data.ruolo
        });
        notice(msg, 'ok', I18N.t('ok_email', data.email));
      } catch (err) {
        // invio fallito: mostra il codice come ripiego
        if (ticket) ticket.classList.remove('hidden');
        notice(msg, 'ok', I18N.t('ok_email_fail')); console.warn('EmailJS error:', err);
      }
    } else { notice(msg, 'ok', I18N.t('ok_no_email')); }
  });
  $('#enter-with-code').addEventListener('click', () => { setAuthed(true); enterApp(); });
}

function initCodeEntry() {
  const otp = $('#otp');
  if (!otp) return;
  const boxes = $$('input', otp);
  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus(); });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const txt = (e.clipboardData.getData('text') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      [...txt].forEach((ch, k) => { if (boxes[k]) boxes[k].value = ch; });
      (boxes[txt.length] || boxes[5]).focus();
    });
  });
  $('#code-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = boxes.map(b => b.value).join('').toUpperCase(), msg = $('#code-msg');
    if (code.length < 6) { notice(msg, 'err', I18N.t('err_code_len')); return; }
    const client = sb();
    if (client) {
      try {
        const { data, error } = await client.rpc('fh_check_code', { p_code: code });
        if (error) throw error;
        if (data === true) { setAuthed(true); enterApp(); }
        else notice(msg, 'err', 'Codice non riconosciuto. Verifica o registrati di nuovo.');
      } catch (err) { console.warn('Supabase check error:', err); notice(msg, 'err', 'Errore di connessione. Riprova tra poco.'); }
    } else {
      if (store.get(LS.CODES, {})[code]) { setAuthed(true); enterApp(); }
      else notice(msg, 'err', I18N.t('err_code_bad') || 'Codice non riconosciuto Verifica o registrati di nuovo.');
    }
  });
  $('#master-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = $('#m-user').value.trim(), p = $('#m-pass').value, msg = $('#master-msg');
    if (cyrb53(u) === CONFIG.MASTER_USER_HASH && cyrb53(p) === CONFIG.MASTER_PASS_HASH) { setAuthed(true); enterApp(); }
    else notice(msg, 'err', I18N.t('err_master'));
  });
}

/* ============================================================================
   3. CONTENT
   ============================================================================ */
let CONTENT = null, TREE_BUILT = false;
let TOPIC_INDEX = {}, TOPIC_ORDER = [];

async function loadContent() {
  if (CONTENT) return CONTENT;
  const res = await fetch('content.json', { cache: 'no-cache' });
  CONTENT = await res.json();
  CONTENT.themes.forEach(theme => {
    const collect = (topics, group) => topics.forEach(t => {
      TOPIC_INDEX[t.id] = { topic: t, themeId: theme.id, themeTitle: theme.title, group };
      TOPIC_ORDER.push(t.id);
    });
    if (theme.topics) collect(theme.topics, null);
    if (theme.groups) theme.groups.forEach(g => collect(g.topics, g.title));
  });
  return CONTENT;
}

function themeTopicCount(theme) {
  let n = 0;
  if (theme.topics) n += theme.topics.length;
  if (theme.groups) theme.groups.forEach(g => n += g.topics.length);
  return n;
}

// landing: hero stat + the four theme cards
function buildLanding() {
  const stat = $('#stat-topics');
  if (stat) stat.textContent = TOPIC_ORDER.length;
  const grid = $('#themes-grid');
  if (!grid || grid.children.length) return;
  CONTENT.themes.forEach(theme => {
    const card = document.createElement('div');
    card.className = 'theme-card glass';
    card.innerHTML = `
      <div class="tc-glyph">${theme.id}</div>
      <div class="tc-letter">${theme.id}</div>
      <h3>${theme.title}</h3>
      <div class="tc-count">${I18N.t('themes_topics', themeTopicCount(theme))}</div>
      <div class="tc-arrow">${I18N.t('themes_arrow')}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
      </div>`;
    card.addEventListener('click', () => { if (isAuthed()) enterApp(); else showView('register'); });
    grid.appendChild(card);
  });
}

/* ---- sidebar tree ---- */
const dialCheckSVG = `
  <svg class="dial-check" viewBox="0 0 22 22" role="checkbox" tabindex="0" aria-checked="false">
    <circle class="ring" cx="11" cy="11" r="8.6" fill="none" stroke-width="2.4" transform="rotate(-90 11 11)"/>
    <circle class="face" cx="11" cy="11" r="6.2" stroke-width="1.4"/>
    <line class="needle" x1="11" y1="11" x2="11" y2="6.4" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;

function buildTree() {
  if (TREE_BUILT) return;
  const tree = $('#tree'), done = store.get(LS.DONE, {});
  tree.innerHTML = '';
  CONTENT.themes.forEach((theme, ti) => {
    const themeEl = document.createElement('div');
    themeEl.className = 'theme' + (ti === 0 ? '' : ' collapsed');
    themeEl.innerHTML = `
      <button class="theme-btn" type="button">
        <span class="theme-letter">${theme.id}</span>
        <span class="t-title">${theme.title}</span>
        <svg class="chev" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l4 4 4-4"/></svg>
      </button>
      <div class="theme-body"><div class="theme-body-inner"></div></div>`;
    const inner = $('.theme-body-inner', themeEl);
    const addTopic = (t) => {
      const row = document.createElement('div');
      row.className = 'topic'; row.dataset.id = t.id;
      const filled = (t.formula && t.formula.length);
      row.innerHTML = `${dialCheckSVG}<span class="topic-title">${t.title}</span>${filled ? '' : '<span class="empty-dot" title="Da completare"></span>'}`;
      if (done[t.id]) $('.dial-check', row).classList.add('on');
      row.addEventListener('click', (e) => { if (!e.target.closest('.dial-check')) openTopic(t.id); });
      const dial = $('.dial-check', row);
      const toggle = (e) => { e.stopPropagation(); toggleDone(t.id); };
      dial.addEventListener('click', toggle);
      dial.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(e); } });
      inner.appendChild(row);
    };
    if (theme.topics) theme.topics.forEach(addTopic);
    if (theme.groups) theme.groups.forEach(g => {
      const gl = document.createElement('div'); gl.className = 'group-label'; gl.textContent = g.title;
      inner.appendChild(gl); g.topics.forEach(addTopic);
    });
    const body = $('.theme-body', themeEl);
    const setH = () => { if (!themeEl.classList.contains('collapsed')) body.style.height = inner.offsetHeight + 'px'; };
    $('.theme-btn', themeEl).addEventListener('click', () => {
      if (themeEl.classList.contains('collapsed')) { themeEl.classList.remove('collapsed'); body.style.height = inner.offsetHeight + 'px'; }
      else { body.style.height = inner.offsetHeight + 'px'; requestAnimationFrame(() => { themeEl.classList.add('collapsed'); body.style.height = '0px'; }); }
    });
    tree.appendChild(themeEl);
    requestAnimationFrame(setH);
  });
  TREE_BUILT = true;
}

/* ---- render a topic ---- */
const SECTIONS = [
  { key: 'formula',      en: 'Formula',          it: 'La formula o procedura',         cls: '' },
  { key: 'esempio',      en: 'Esempio svolto',   it: 'Un esempio risolto passo-passo', cls: 'steps' },
  { key: 'errore',       en: 'Errore frequente', it: "L'errore da non fare",           cls: 'error' },
  { key: 'schema',       en: 'Schema visivo',    it: 'Il disegno che lo spiega',       cls: 'schema' },
  { key: 'collegamenti', en: 'Collegamenti',     it: 'Dove si riallaccia',             cls: 'links' }
];

function placeholderHTML(label) {
  return `<div class="placeholder">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 8v5M12 16h.01M4 5h16v14H4z"/></svg>
    Sezione «${label}» da completare — l'autore la riempirà presto.
  </div>`;
}

function renderSectionBody(sec, topic) {
  const val = topic[sec.key];
  if (sec.key === 'schema') {
    const spec = topic.plot || (window.PLOTS && PLOTS[topic.id]);
    if (spec) return `<div class="plot-wrap">
        <div class="plot" id="plot-${topic.id}"></div>
        <div class="plot-formula glass">
          <span class="pf-label">Equazione nel grafico</span>
          <span class="pf-eq" id="plotf-${topic.id}"></span>
        </div>
        <div class="plot-bar">
          <span class="plot-hint">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
            Trascina i punti e gli slider · scorri per ingrandire
          </span>
          <button type="button" class="plot-reset" data-reset="${topic.id}">↺ Reimposta vista</button>
        </div>
      </div>`;
    const svg = (val && val.trim()) ? val : (window.SCHEMAS && SCHEMAS[topic.id]) || '';
    return svg ? `<div class="schema-fig">${svg}</div>` : placeholderHTML(sec.en);
  }
  if (!val || !val.length) return placeholderHTML(sec.en);
  if (sec.cls === 'steps') return `<ol class="steps">${val.map(s => `<li>${inlineFmt(s)}</li>`).join('')}</ol>`;
  if (sec.cls === 'links') return `<ul class="links">${val.map(s => `<li>${inlineFmt(s)}</li>`).join('')}</ul>`;
  return val.map(s => `<p>${inlineFmt(s)}</p>`).join('');
}

function openTopic(id) {
  const entry = TOPIC_INDEX[id];
  if (!entry) return;
  const t = entry.topic;
  store.set(LS.LAST, id);
  $$('.topic').forEach(r => r.classList.toggle('active', r.dataset.id === id));

  const isDone = !!store.get(LS.DONE, {})[id];
  const host = $('#topic-host');
  const sectionsHTML = SECTIONS.map((sec, i) => {
    const num = ['I', 'II', 'III', 'IV', 'V'][i];
    return `<section class="section glass is-${sec.key}${sec.key === 'errore' ? ' is-error' : ''}" style="animation-delay:${i * 0.05}s">
      <div class="section-head">
        <span class="section-num">${num}</span>
        <div><span class="section-title">${sec.en}<span class="it">${sec.it}</span></span></div>
      </div>
      <div class="section-body">${renderSectionBody(sec, t)}</div>
    </section>`;
  }).join('');

  host.innerHTML = `
    <div class="topic-watermark" aria-hidden="true">${entry.themeId}</div>
    <div class="crumb fade-up">
      <span>Tema ${entry.themeId}</span><span class="sep">·</span><span>${entry.themeTitle}</span>
      ${entry.group ? `<span class="sep">·</span><span>${entry.group}</span>` : ''}
    </div>
    <h1 class="topic-h1 fade-up">${t.title}</h1>
    <div class="topic-meta fade-up">
      <button class="mark-done ${isDone ? 'done' : ''}" id="mark-done" type="button">
        <span class="md-dial">${dialCheckSVG}</span>
        <span class="md-label">${isDone ? 'Completato' : 'Segna come completato'}</span>
      </button>
    </div>
    ${sectionsHTML}`;

  const md = $('#mark-done');
  if (md && isDone && $('.dial-check', md)) $('.dial-check', md).classList.add('on');
  if (md) md.addEventListener('click', () => toggleDone(id));
  renderMath(host);

  // interactive graph (Schema visivo)
  if (window.FormulaPlot) {
    FormulaPlot.clearAll();
    const spec = t.plot || (window.PLOTS && PLOTS[id]);
    const el = document.getElementById('plot-' + id);
    if (spec && el) FormulaPlot.whenReady(() => { if (document.getElementById('plot-' + id) === el) FormulaPlot.render(el, spec); });
    const reset = host.querySelector('.plot-reset');
    if (reset) reset.addEventListener('click', () => FormulaPlot.resetView());
  }
  closeRail();
  if (isAuthed()) maybeShowReview();
}

/* ============================================================================
   4. PROGRESS
   ============================================================================ */
function toggleDone(id) {
  const done = store.get(LS.DONE, {});
  done[id] ? delete done[id] : (done[id] = true);
  store.set(LS.DONE, done);
  const row = $(`.topic[data-id="${id}"]`);
  if (row) $('.dial-check', row).classList.toggle('on', !!done[id]);
  const md = $('#mark-done');
  if (md && store.get(LS.LAST) === id) {
    const on = !!done[id];
    md.classList.toggle('done', on);
    $('.md-label', md).textContent = on ? I18N.t('mark_done_ok') : I18N.t('mark_done');
    if ($('.dial-check', md)) $('.dial-check', md).classList.toggle('on', on);
  }
  updateGauge();
}

function updateGauge() {
  const done = store.get(LS.DONE, {});
  const total = TOPIC_ORDER.length, count = TOPIC_ORDER.filter(id => done[id]).length;
  const pct = total ? count / total : 0;
  $('#gauge-done').textContent = count;
  $('#gauge-total').textContent = total;
  const fill = $('#gauge-fill');
  if (fill) { const len = fill.getTotalLength(); fill.style.strokeDasharray = len; fill.style.strokeDashoffset = len * (1 - pct); }
  const needle = $('#gauge-needle');
  if (needle) needle.style.transform = `rotate(${pct * 180}deg)`;
}

/* ============================================================================
   ENTRY
   ============================================================================ */
async function enterApp() {
  showView('app');
  if (!TREE_BUILT) {
    try { await loadContent(); }
    catch (e) {
      $('#topic-host').innerHTML = '<p style="color:oklch(0.8 0.14 25)">Impossibile caricare <code>content.json</code>. Avvia il sito da un server locale (vedi README), non con doppio clic.</p>';
      console.error(e); return;
    }
    buildTree(); updateGauge();
  }
  const last = store.get(LS.LAST);
  openTopic(last && TOPIC_INDEX[last] ? last : TOPIC_ORDER[0]);
}

function openRail() { $('#rail').classList.add('open'); $('#scrim').classList.add('show'); }
function closeRail() { $('#rail').classList.remove('open'); $('#scrim').classList.remove('show'); }

// Safety: when the tab is hidden the browser pauses animation timelines, which
// would leave opacity:0 entrance states stuck invisible (background load,
// prerender, screenshot capture). Force the visible end-state in that case.
function applyMotionGuard() { document.body.classList.toggle('no-anim', document.hidden); }
document.addEventListener('visibilitychange', applyMotionGuard);

async function init() {
  if (window.I18N) I18N.apply();
  applyMotionGuard();
  // byline: personal site not live yet — show a liquid-glass toast instead
  let bylineToastTimer = null;
  $$('.byline').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    let toast = document.getElementById('byline-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'byline-toast';
      toast.className = 'byline-toast';
      toast.setAttribute('role', 'status');
      toast.innerHTML = '<img class="byline-toast-photo" src="assets/andrea-gervasoni.png" alt="" onerror="this.style.display=\'none\'"><span class="pip"></span><span class="txt"></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector('.txt').textContent = (window.I18N ? I18N.t('byline_toast') : 'Sito personale in arrivo');
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(bylineToastTimer);
    bylineToastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }));
  // reading progress bar (study panel)
  const rp = document.getElementById('read-progress');
  if (rp) {
    const updRP = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - window.innerHeight;
      rp.style.width = (max > 80 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', updRP, { passive: true });
    window.addEventListener('resize', updRP, { passive: true });
    updRP();
  }
  initNav(); initRegister(); initCodeEntry();
  const burger = $('#hamburger'), scrim = $('#scrim');
  if (burger) burger.addEventListener('click', openRail);
  if (scrim) scrim.addEventListener('click', closeRail);

  // load content early so the landing can show counts + theme cards
  try { await loadContent(); buildLanding(); } catch (e) { console.warn('content.json not loaded yet:', e); }

  if (isAuthed()) enterApp();
  else showView('landing');
}

/* ============================================================================
   REVIEW MODAL — appears after 5 topics opened, one-time
   ============================================================================ */
const LS_REVIEW = 'formularium.reviewDone';
const LS_OPENS  = 'formularium.topicOpens';

function maybeShowReview() {
  if (store.get(LS_REVIEW)) return;
  const n = (store.get(LS_OPENS, 0) || 0) + 1;
  store.set(LS_OPENS, n);
  if (n >= 5) showReview();
}

function showReview() {
  if (store.get(LS_REVIEW)) return;
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  const stars = [...modal.querySelectorAll('.star')];
  let chosen = 0;
  const light = (v) => stars.forEach(s => s.classList.toggle('lit', +s.dataset.v <= v));
  stars.forEach(s => {
    s.addEventListener('mouseenter', () => light(+s.dataset.v));
    s.addEventListener('mouseleave', () => light(chosen));
    s.addEventListener('click', () => {
      chosen = +s.dataset.v; light(chosen);
      const reviewData = { rating: chosen, lang: window.I18N ? I18N.lang() : 'it', ts: Date.now() };
      store.set(LS_REVIEW, reviewData);
      if (CONFIG.REVIEWS_SHEET_URL) {
        fetch(CONFIG.REVIEWS_SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewData) }).catch(() => {});
      }
      const thanks = document.getElementById('review-thanks');
      if (thanks) thanks.classList.remove('hidden');
      setTimeout(() => modal.classList.add('hidden'), 2200);
    });
  });
  const closeBtn = document.getElementById('review-close');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    store.set(LS_REVIEW, { rating: 0, dismissed: true, ts: Date.now() });
  });
}

document.addEventListener('DOMContentLoaded', init);
