/* ============================================================================
   FORMULARIUM — i18n.js
   Translations for the site UI. Topic content (formulas, examples, etc.)
   in content.json is language-neutral (Italian math notation).
   Usage: window.I18N.apply(lang) — lang is 'it' or 'en'.
   ============================================================================ */
const I18N_STRINGS = {
  it: {
    /* nav */
    nav_code: 'Ho un codice',
    nav_register: 'Registrati',
    /* hero */
    hero_eyebrow: 'Formulario di matematica',
    hero_sub: 'Tutte le formule ordinate come strumenti di precisione. Per ogni argomento: la formula, un esempio svolto, l\'errore frequente, uno schema visivo e i collegamenti con il resto del programma.',
    hero_cta_start: 'Inizia a studiare',
    hero_cta_code: 'Ho già un codice',
    stat_topics_label: 'Argomenti',
    stat_themes_label: 'Temi del programma',
    stat_examples_label: 'Esempi svolti',
    /* themes section */
    themes_crumb: 'Il programma',
    themes_h2: 'Quattro temi del programma',
    themes_arrow: 'Apri il tema',
    themes_topics: (n) => n + ' argomenti',
    /* register */
    reg_step: 'Registrazione',
    reg_h1: 'Crea il tuo accesso',
    reg_desc: 'Inserisci i tuoi dati: riceverai un codice personale di 6 caratteri per entrare nel formulario.',
    reg_nome: 'Nome',
    reg_cognome: 'Cognome',
    reg_ruolo: 'Classe / Ruolo',
    reg_ruolo_placeholder: 'Seleziona…',
    reg_email: 'Email',
    reg_email_placeholder: 'nome@esempio.it',
    reg_btn: 'Genera il mio codice',
    reg_switch: 'Hai già un codice?',
    reg_switch_btn: 'Inseriscilo qui',
    reg_ruolo_opts: ['Studente 1° liceo','Studente 2° liceo','Studente 3° liceo','Studente 4° liceo','Studente 5° liceo','Insegnante','Altro'],
    /* code ticket */
    ticket_label: 'Il tuo codice d\'accesso',
    ticket_hint: 'Conservalo: ti servirà per rientrare.',
    enter_btn: 'Entra nel formulario →',
    /* code entry */
    code_step: 'Accesso',
    code_h1: 'Inserisci il codice',
    code_desc: 'Sei caratteri, lettere e numeri, ricevuti in fase di registrazione.',
    code_btn: 'Entra',
    code_or: 'OPPURE',
    master_summary: 'Accesso docente / amministratore',
    master_username: 'Username',
    master_password: 'Password',
    master_btn: 'Entra come docente',
    code_switch: 'Non hai un codice?',
    code_switch_btn: 'Registrati',
    back_btn: 'Indietro',
    /* app sidebar */
    gauge_label: 'Completati',
    logout_btn: '↩ Esci dal formulario',
    /* topic */
    mark_done: 'Segna come completato',
    mark_done_ok: 'Completato',
    /* sections */
    sec_formula_en: 'Formula',
    sec_formula_it: 'La formula o procedura',
    sec_esempio_en: 'Esempio svolto',
    sec_esempio_it: 'Un esempio risolto passo-passo',
    sec_errore_en: 'Errore frequente',
    sec_errore_it: "L'errore da non fare",
    sec_schema_en: 'Schema visivo',
    sec_schema_it: 'Il disegno che lo spiega',
    sec_collegamenti_en: 'Collegamenti',
    sec_collegamenti_it: 'Dove si riallaccia',
    /* placeholder */
    placeholder: (label) => `Sezione «${label}» da completare — l'autore la riempirà presto.`,
    /* plot */
    plot_hint: 'Trascina i punti e gli slider · scorri per ingrandire',
    plot_reset: '↺ Reimposta vista',
    /* errors */
    err_form: 'Controlla i campi: nome, cognome, ruolo ed email valida sono obbligatori.',
    err_code_len: 'Inserisci tutti e 6 i caratteri.',
    err_code_bad: 'Codice non riconosciuto su questo dispositivo. Verifica o registrati di nuovo.',
    err_master: 'Credenziali non valide.',
    ok_email: (email) => `Ti abbiamo inviato il codice via email a ${email}. Controlla la casella (anche lo spam).`,
    ok_email_fail: 'Invio email non riuscito — ecco il tuo codice qui sotto, annotalo.',
    ok_no_email: 'Codice generato! Annotalo: ti servirà per accedere.',
    sending_email: (email) => `Sto inviando il codice via email a ${email}…`,
    load_error: 'Impossibile caricare <code>content.json</code>. Avvia il sito da un server locale (vedi README), non con doppio clic.',
  },
  en: {
    /* nav */
    nav_code: 'I have a code',
    nav_register: 'Sign up',
    /* hero */
    hero_eyebrow: 'Mathematics formulary',
    hero_sub: 'Every formula, organised like precision instruments. For each topic: the formula, a worked example, the common mistake, a visual diagram and links to the rest of the syllabus.',
    hero_cta_start: 'Start studying',
    hero_cta_code: 'I already have a code',
    stat_topics_label: 'Topics',
    stat_themes_label: 'Programme themes',
    stat_examples_label: 'Worked examples',
    /* themes section */
    themes_crumb: 'The syllabus',
    themes_h2: 'Four themes of the programme',
    themes_arrow: 'Open theme',
    themes_topics: (n) => n + ' topics',
    /* register */
    reg_step: 'Registration',
    reg_h1: 'Create your access',
    reg_desc: 'Fill in your details and you will receive a personal 6-character code to access the formulary.',
    reg_nome: 'First name',
    reg_cognome: 'Last name',
    reg_ruolo: 'Year / Role',
    reg_ruolo_placeholder: 'Select…',
    reg_email: 'Email',
    reg_email_placeholder: 'name@example.com',
    reg_btn: 'Generate my code',
    reg_switch: 'Already have a code?',
    reg_switch_btn: 'Enter it here',
    reg_ruolo_opts: ['Year 1 student','Year 2 student','Year 3 student','Year 4 student','Year 5 student','Teacher','Other'],
    /* code ticket */
    ticket_label: 'Your access code',
    ticket_hint: 'Keep it safe — you will need it to return.',
    enter_btn: 'Enter the formulary →',
    /* code entry */
    code_step: 'Access',
    code_h1: 'Enter your code',
    code_desc: 'Six characters — letters and numbers — received when you registered.',
    code_btn: 'Enter',
    code_or: 'OR',
    master_summary: 'Teacher / administrator access',
    master_username: 'Username',
    master_password: 'Password',
    master_btn: 'Enter as teacher',
    code_switch: "Don't have a code?",
    code_switch_btn: 'Sign up',
    back_btn: 'Back',
    /* app sidebar */
    gauge_label: 'Completed',
    logout_btn: '↩ Exit the formulary',
    /* topic */
    mark_done: 'Mark as completed',
    mark_done_ok: 'Completed',
    /* sections */
    sec_formula_en: 'Formula',
    sec_formula_it: 'The key formula or procedure',
    sec_esempio_en: 'Worked example',
    sec_esempio_it: 'Step-by-step solved example',
    sec_errore_en: 'Common mistake',
    sec_errore_it: 'The error to avoid',
    sec_schema_en: 'Visual diagram',
    sec_schema_it: 'The illustration that explains it',
    sec_collegamenti_en: 'Connections',
    sec_collegamenti_it: 'How it links to the rest',
    /* placeholder */
    placeholder: (label) => `Section «${label}» to be completed — the author will fill it in soon.`,
    /* plot */
    plot_hint: 'Drag points and sliders · scroll to zoom',
    plot_reset: '↺ Reset view',
    /* errors */
    err_form: 'Please check the fields: first name, last name, role and a valid email are required.',
    err_code_len: 'Please enter all 6 characters.',
    err_code_bad: 'Code not recognised on this device. Please check or register again.',
    err_master: 'Invalid credentials.',
    ok_email: (email) => `We sent your code by email to ${email}. Check your inbox (and spam folder).`,
    ok_email_fail: 'Email delivery failed — your code is shown below, please note it down.',
    ok_no_email: 'Code generated! Note it down — you will need it to access the formulary.',
    sending_email: (email) => `Sending your code by email to ${email}…`,
    load_error: 'Unable to load <code>content.json</code>. Run the site from a local server (see README), not by double-clicking.',
  }
};

// ---- public API ----
window.I18N = (() => {
  let _lang = localStorage.getItem('formularium.lang') || 'it';

  function t(key, ...args) {
    const s = I18N_STRINGS[_lang] || I18N_STRINGS.it;
    const v = s[key];
    if (typeof v === 'function') return v(...args);
    return v != null ? v : (I18N_STRINGS.it[key] || key);
  }

  function lang() { return _lang; }

  function set(l) {
    _lang = (l === 'en') ? 'en' : 'it';
    localStorage.setItem('formularium.lang', _lang);
    document.documentElement.lang = _lang;
    // update the toggle button label if it exists
    const btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = _lang === 'it' ? 'EN' : 'IT';
  }

  function toggle() { set(_lang === 'it' ? 'en' : 'it'); }

  // apply translations to all [data-i18n] elements
  function apply(html) {
    const s = I18N_STRINGS[_lang] || I18N_STRINGS.it;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      const v = s[k] != null ? s[k] : (I18N_STRINGS.it[k] || '');
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const k = el.dataset.i18nPh;
      const v = s[k] != null ? s[k] : (I18N_STRINGS.it[k] || '');
      if (typeof v === 'string') el.placeholder = v;
    });
    set(_lang); // update toggle btn
  }

  // initialise on load
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = _lang;
    apply();
  });

  return { t, lang, set, toggle, apply };
})();
