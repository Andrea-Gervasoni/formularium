# Formularium

A public, interactive **mathematics formulary** for students of the Italian
*liceo scientifico*. Each topic is presented as a card with
five fixed sections — **Formula · Esempio svolto · Errore frequente · Schema
visivo · Collegamenti** — with maths typeset by [KaTeX](https://katex.org).

> **Why the name?** *Formularium* is the Latin word for a collection of
> formulas — academic, memorable, and legible in any language. It reads as a
> scholarly object rather than a web app, which suits a university-portfolio piece.

**Design at a glance**
- **Palette** — deep **oxblood** field (`#160609`→`#230a0f`) with a single
  **diplomatic crimson** accent (`oklch(0.63 0.20 25)`) and luminous glass
  surfaces. Dark, cinematic and premium — one saturated accent keeps the maths
  the hero.
- **Atmosphere** — ambient gradient field, a fading top grid, film-grain +
  vignette overlay, and slow-drifting glossy crimson “fluid” blobs.
- **Type** — *Space Grotesk* (display) paired with *Manrope* (body) and
  *JetBrains Mono* for codes. Maths in KaTeX.
- **Hero** — a centered, full-bleed hero with a giant two-tone gradient wordmark
  (not a split layout), eyebrow pill, glass CTAs and a stats row.
- **Signature element** — analogue instrument controls survive: the completion
  checkbox is a precision **dial** (needle swings, ring closes) and the sidebar
  progress meter is a glowing **tuning gauge** with a moving needle.
- **CMS** — **Option A (single `content.json`)**. One file is the simplest thing
  for a non-developer to maintain: no folders, no per-file naming, fully editable
  in GitHub's web editor, and it keeps all topics in one searchable place.
- Files: `index.html`, `assets/styles.css`, `assets/app.js`, `assets/schemas.js`.

---

## 1. Project structure

```
index.html            ← the whole site (landing, registration, code entry, app)
content.json          ← ALL topic content — this is the file the owner edits
assets/
  styles.css          ← all styling
  app.js              ← logic (auth, routing, tree, progress, KaTeX, EmailJS)
  schemas.js          ← default SVG diagrams (fallback for some topics)
  plots-data.js       ← interactive-graph specs, one per topic
  plots.js            ← the interactive-graph engine (uses JSXGraph CDN)
README.md
```

Everything is plain HTML/CSS/JS. No framework, no build step, no npm.

---

## 2. Run it locally

Because the site loads `content.json` with `fetch`, you must serve the folder
over HTTP (opening `index.html` with a double-click will fail on that one fetch).
Any static server works:

```bash
# Python (already installed on most machines)
python3 -m http.server 8000
# then open http://localhost:8000

# …or Node
npx serve
```

---

## 3. Deploy to GitHub Pages (zero config)

1. Create a repository and push these files to the **root** (not a subfolder).
2. On GitHub: **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)**.
4. Save. Your site appears at `https://<user>.github.io/<repo>/` in a minute.

No other configuration is needed. KaTiX and EmailJS load from their CDNs.

---

## 4. Edit content WITHOUT writing code

All content lives in **`content.json`**. You can edit it:
- in any text editor, or
- directly on GitHub — open `content.json`, click the **pencil ✏️**, edit, then
  **Commit changes**. The live site updates automatically.

A topic looks like this:

```json
{
  "id": "a-irrazionali",
  "title": "Equazioni e disequazioni irrazionali",
  "formula":      ["Testo. Puoi scrivere formule come $\\sqrt{x+1}=3$."],
  "esempio":      ["Primo passo…", "Secondo passo…", "Risultato…"],
  "errore":       ["L'errore tipico è…"],
  "schema":       "",
  "collegamenti": ["Si collega a…"]
}
```

Rules of thumb:
- Each of the five sections is a **list of strings** (`[...]`). Each string is a
  paragraph; in *esempio svolto* each string becomes a **numbered step**.
- Leave a section as `[]` to show a tidy *“da completare”* placeholder.
- **Maths:** write LaTeX between `$ … $` (inline) or `$$ … $$` (centered).
  Inside JSON every backslash must be **doubled**: write `$\\frac{a}{b}$`,
  `$\\sqrt{x}$`, `$\\Delta$`.
- **Bold:** wrap text in `**double asterisks**`.
- **schema** (the visual): leave it `""` to use a built-in diagram (where one
  exists) or the placeholder, or paste your own `"<svg>…</svg>"` string.
- **Never change a topic's `id`** once students may have marked it complete — the
  id is the key used to remember their progress.

Three topics are filled in as reference examples:
*Disequazioni di 2° grado*, *Funzioni pari e dispari*,
*Equazione della parabola come luogo geometrico*, and *Misura degli angoli*.
The remaining ~28 are scaffolded and ready to fill.

---

## 4-bis. Grafici interattivi (Schema visivo)

La sezione **Schema visivo** di ogni argomento mostra un **grafico interattivo**
(libreria *JSXGraph*, caricata da CDN): si possono **trascinare i punti**,
muovere gli **slider** dei parametri e **zoomare con la rotellina**. Subito sotto
il grafico, un pannello *liquid-glass* mostra l'**equazione attuale** (in KaTeX)
che si aggiorna in tempo reale mentre interagisci. Il pulsante *Reimposta vista*
riporta lo zoom iniziale.

I grafici di tutti gli argomenti sono già pronti in **`assets/plots-data.js`**,
indicizzati per `id`. Per **cambiarne uno senza toccare quel file**, aggiungi un
campo `"plot"` all'argomento dentro `content.json` (ha la priorità):

```json
{
  "id": "b-retta",
  "title": "Equazione e grafico di una retta",
  "plot": { "kind": "line", "drag": true }
}
```

Il campo `plot` è un piccolo oggetto con una chiave **`kind`** (il tipo di
grafico) e qualche opzione. I tipi disponibili:

| `kind`        | A cosa serve                                  | Opzioni utili |
|---------------|-----------------------------------------------|---------------|
| `function`    | grafico di `y=f(x)` qualunque                 | `exprs:[{f:"a*x*x+b*x+c"}]`, `sliders:{a:{min,max,value,step}}`, `vlines`, `hlines`, `ghost`, `hline:true`, `inverse:true`, `mirror:"even"\|"odd"` |
| `parabola`    | parabola con vertice                          | `params:{a,b,c}`, `shade:"gt"\|"lt"`, `focusDirectrix:true`, `line:{m,q}`, `chord:[x1,x2]` |
| `circle`      | circonferenza                                 | `center:[x,y]`, `r`, `showRadius:true`, `line:{m,q}`, `through:[[..],[..],[..]]`, `pencil:"circles"` |
| `ellipse`     | ellisse                                       | `a`, `b`, `foci:true`, `sumGlider:true`, `center:[x,y]`, `line:{m,q}` |
| `hyperbola`   | iperbole                                      | `a`, `b`, `foci:true`, `asymptotes:true`, `center:[x,y]`, `line:{m,q}` |
| `homographic` | funzione omografica `(ax+b)/(cx+d)`           | `a`, `b`, `c`, `d` |
| `line`        | retta                                         | `drag:true` (2 punti), `m`, `q`, `pencil:[x,y]` (fascio), `distancePoint:[x,y]` |
| `unit-circle` | circonferenza goniometrica                    | `show:["sin","cos","tan","arc","pyth"]`, `snap:true` |

Opzioni comuni a tutti: `box:[xmin, ymax, xmax, ymin]` (riquadro visibile) e
`note:["testo"]` (didascalia in basso). Nelle espressioni `exprs` puoi usare
`x`, i parametri degli slider, e le funzioni `sin cos tan sqrt abs exp log pow`
(es. `"abs(x*x - k)"`). Per **togliere** il grafico a un argomento, metti
`"plot": null`.

The remaining ~28 are scaffolded and ready to fill.

---

## 5. Login reale con Supabase (consigliato) — opzionale ma gratuito

Senza Supabase, i codici funzionano **solo sul browser in cui sono stati
generati** (modalità locale, vedi §7). Con Supabase i codici vivono in un vero
database: validi **su ogni dispositivo**, e tu vedi l'elenco degli iscritti.
Il piano gratuito basta e avanza (nessuna carta richiesta; il progetto va in
pausa dopo ~1 settimana di totale inattività, si riattiva con un clic).

1. Crea un account su <https://supabase.com> e un nuovo **progetto** (scegli una
   password per il database e una region vicina, es. *Frankfurt*).
2. Apri **SQL Editor → New query**, incolla tutto il contenuto del file
   **`supabase-schema.sql`** (in questa cartella) e premi **Run**. Crea la
   tabella `access_codes` e le due funzioni usate dal sito.
3. Vai in **Project Settings → API** e copia due valori:
   - **Project URL** (es. `https://abcd1234.supabase.co`)
   - **Project API key → `anon` `public`** (la chiave pubblica — *mai* la
     `service_role`).
4. Apri `assets/app.js` e compila il blocco `CONFIG.SUPABASE` in alto:

```js
SUPABASE: {
  URL:      'https://abcd1234.supabase.co',
  ANON_KEY: 'eyJhbGciOi...'        // la chiave "anon public"
}
```

Fatto. Da ora la registrazione genera codici nel database e l'accesso li
verifica lì. Per **vedere gli iscritti**: Dashboard → **Table Editor →
`access_codes`** (visibile solo a te, loggato nella dashboard).

> **Perché la chiave `anon` può stare nel codice pubblico?** Perché la tabella
> ha *Row Level Security* attiva **senza policy**: la chiave pubblica non può
> leggere né scrivere la tabella direttamente. Può solo eseguire le due
> funzioni `fh_register` / `fh_check_code`, che non restituiscono mai le email
> degli iscritti. Le email restano private. Non incollare **mai** la chiave
> `service_role` nel sito.

Lasciando `URL`/`ANON_KEY` vuoti (`''`) il sito resta in modalità locale.

---

## 6. Configure email delivery (EmailJS) — optional

The access code is **always shown on screen** after registration. If you also
want it emailed to the student, set up EmailJS (free tier, no backend):

1. Create an account at <https://www.emailjs.com> and add an **Email Service**.
2. Create an **Email Template** containing the variables
   `{{to_name}}`, `{{to_email}}`, `{{access_code}}`, `{{ruolo}}`.
   In the template's “To” field use `{{to_email}}`.
3. Copy your **Public Key**, **Service ID** and **Template ID**.
4. Open `assets/app.js` and fill the `CONFIG.EMAILJS` block near the top:

```js
EMAILJS: {
  PUBLIC_KEY:  'XXXXXXXXXXXX',
  SERVICE_ID:  'service_xxxxx',
  TEMPLATE_ID: 'template_xxxxx'
}
```

Leave `PUBLIC_KEY` empty (`''`) to disable email entirely — everything else
still works.

---

## 7. Master (teacher / admin) credentials

A master login bypasses the access-code flow. The defaults are:

| Username | Password       |
|----------|----------------|
| `docente`| `maturita2026` |

To change them, open the site, open the browser **console**, and run e.g.:

```js
cyrb53('my-new-username')   // → copy the result
cyrb53('my-new-password')   // → copy the result
```

Then paste the two results into `assets/app.js`:

```js
MASTER_USER_HASH: '…',   // hash of the username
MASTER_PASS_HASH: '…',   // hash of the password
```

### ⚠️ Security limitations / modalità (read this)

**Modalità locale (senza Supabase).** È un **sito statico** — niente server, quindi
ogni "autenticazione" è **comodità, non vera sicurezza**:

- Tutto (incluso l'*hash* della master password) viaggia nel JavaScript pubblico
  e chiunque può leggerlo. L'hash `cyrb53` tiene solo la parola fuori dal
  sorgente — è **offuscamento, non protezione**.
- I codici generati restano nel `localStorage` del singolo browser: **non** sono
  verificati su un database e non si sincronizzano tra dispositivi.

**Con Supabase (§5).** I codici diventano **reali e cross-device**, salvati in un
database con le email degli iscritti **non esposte** al pubblico (RLS + funzioni
`SECURITY DEFINER`). Resta comunque vero che il sito è pensato per materiale di
studio: **considera pubblici i contenuti del formulario** — la master password
lato client non è una barriera robusta.

---

## 8. Accessibility & performance
- Respects `prefers-reduced-motion` (animations collapse to instant).
- Works down to a 375 px viewport; sidebar becomes a hamburger menu on mobile.
- Initial payload (HTML + CSS + JS + content) is well under 500 KB; KaTeX is the
  only heavy dependency and is CDN-cached.
