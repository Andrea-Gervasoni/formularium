# Formularium

A public, interactive mathematics formulary for students of the Italian *liceo scientifico*. Each topic is a card with five fixed sections — **Formula · Worked Example · Common Mistake · Visual Diagram · Connections** — with mathematics typeset by KaTeX and fully interactive graphs powered by JSXGraph.

> **Why the name?** *Formularium* is the Latin word for a collection of formulas — academic, memorable, and legible in any language. It reads as a scholarly object rather than a web app, which suits a university-portfolio piece.

---

## Design at a glance

- **Palette** — warm off-white background with a single **amber/orange** accent (`#D9772B`). One saturated accent keeps the mathematics the hero.
- **Type** — *STIX Two Text* (the serif used in scientific publishing) for headings and the italic wordmark, *Manrope* for body text, *Space Grotesk* for UI accents. Mathematics in KaTeX.
- **Hero** — a centered, full-bleed hero with an italic-serif wordmark, a decorative annotated parabola (dashed axes, vertex and roots marked) that draws itself on load, glass CTAs, a stats row, and the author byline.
- **Signature element** — analogue instrument controls: the completion checkbox is a precision **dial** (needle swings, ring closes) and the sidebar progress meter is a **tuning gauge** with a moving needle. Inside the formulary: a reading progress bar, a giant theme-letter watermark on each topic page, and a "theorem box" treatment for the Formula section.
- **Interactive graphs** — every topic's "Visual Diagram" section renders a live JSXGraph board with draggable points, parameter sliders and scroll-to-zoom. A live KaTeX formula panel below the graph updates as you interact.
- **CMS** — **Option A (single `content.json`)**. One file, editable in any text editor or directly in GitHub's web UI — no folders, no per-file naming, fully searchable.
- **i18n** — IT / EN language switch (flag toggle in the navbar, preference persisted in `localStorage`).
- **Author byline** — newspaper-style signature (photo + name + role) in the hero and, in compact form, in the sidebar footer. Clicking it shows a liquid-glass toast ("Personal site coming soon") until the personal-site URL is set — see §9.

---

## 1. Project structure

```
index.html              ← the whole site (landing · registration · code entry · app)
content.json            ← ALL topic content — the only file the owner needs to edit
assets/
  styles.css            ← all styling
  app.js                ← auth, routing, tree, progress, KaTeX, EmailJS, i18n
  i18n.js               ← IT / EN translation strings
  schemas.js            ← fallback SVG diagrams for topics without an interactive graph
  plots-data.js         ← interactive-graph specs, one per topic
  plots.js              ← interactive-graph engine (wraps JSXGraph)
  email-template.html   ← HTML email template to paste into EmailJS
  logo.png              ← app icon (navbar · sidebar · auth cards · favicon)
  andrea-gervasoni.png  ← author photo for the byline (replace with your own)
google-reviews-script.js ← Apps Script to paste into Google Sheets (star reviews)
supabase-schema.sql     ← SQL to run in Supabase to set up the access-codes table
README.md
LICENSE                 ← MIT
```

Everything is plain HTML / CSS / JS. No framework, no build step, no npm.

---

## 2. Run it locally

The site loads `content.json` via `fetch`, so you must serve it over HTTP — opening `index.html` by double-clicking will fail on that one request. Any static server works:

```bash
# Python (pre-installed on most machines)
python3 -m http.server 8000
# then open http://localhost:8000

# …or Node
npx serve
```

---

## 3. Deploy to GitHub Pages (zero config)

1. Create a **public** repository and push all files to the **root** (not a subfolder).
2. On GitHub: **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch** · Branch: **main** · Folder: **/ (root)**.
4. **Save.** Your site appears at `https://<user>.github.io/<repo>/` within a minute.

No other configuration is needed. KaTeX and JSXGraph load from CDN.

---

## 4. Edit content without writing code

All content lives in **`content.json`**. Edit it:

- in any text editor, or
- directly on GitHub — open `content.json`, click the **pencil ✏️**, edit, then **Commit changes**. The live site updates automatically.

A topic looks like this:

```json
{
  "id": "a-irrazionali",
  "title": "Equazioni e disequazioni irrazionali",
  "formula":      ["Text. Formulas inline: $\\sqrt{x+1}=3$."],
  "esempio":      ["Step one…", "Step two…", "Result…"],
  "errore":       ["The common mistake is…"],
  "schema":       "",
  "collegamenti": ["This connects to…"]
}
```

**Rules of thumb:**

- Each of the five sections is a list of strings (`[…]`). Each string is a paragraph; in `esempio` each string becomes a numbered step.
- Leave a section as `[]` to display a tidy *"to be completed"* placeholder.
- **Maths:** write LaTeX between `$ … $` (inline) or `$$ … $$` (display). Inside JSON every backslash must be doubled: `$\\frac{a}{b}$`, `$\\sqrt{x}$`, `$\\Delta$`.
- **Bold:** wrap text in `**double asterisks**`.
- **`schema` (the visual):** leave it `""` to use the built-in interactive graph (or the static fallback), or paste your own `"<svg>…</svg>"` string.
- **Never change a topic's `id`** once students may have marked it complete — the `id` is the key used to store their progress in `localStorage`.

Four topics are fully filled in as reference examples: *Disequazioni di 2° grado*, *Funzioni pari e dispari*, *Equazione della parabola come luogo geometrico*, and *Misura degli angoli*. The remaining ~28 are scaffolded and ready to fill.

---

## 4-bis. Interactive graphs (Visual Diagram section)

Every topic's Visual Diagram section renders a live **JSXGraph** board — drag points, move parameter sliders, scroll to zoom. A **live KaTeX panel** beneath the graph shows the current equation and updates in real time. The *Reset view* button restores the initial zoom.

All graph specs are ready in **`assets/plots-data.js`**, keyed by topic `id`. To override one without touching that file, add a `"plot"` field to the topic in `content.json` (it takes priority):

```json
{
  "id": "b-retta",
  "title": "Equazione e grafico di una retta",
  "plot": { "kind": "line", "drag": true }
}
```

| `kind` | Used for | Useful options |
|---|---|---|
| `function` | Any `y = f(x)` graph | `exprs:[{f:"a*x*x+b*x+c"}]`, `sliders:{a:{min,max,value,step}}`, `vlines`, `hlines`, `ghost`, `hline:true`, `inverse:true`, `mirror:"even"\|"odd"` |
| `parabola` | Parabola with vertex | `params:{a,b,c}`, `shade:"gt"\|"lt"`, `focusDirectrix:true`, `line:{m,q}`, `chord:[x1,x2]` |
| `circle` | Circle | `center:[x,y]`, `r`, `showRadius:true`, `line:{m,q}`, `through:[[..],[..],[..]]`, `pencil:"circles"` |
| `ellipse` | Ellipse | `a`, `b`, `foci:true`, `sumGlider:true`, `center:[x,y]`, `line:{m,q}` |
| `hyperbola` | Hyperbola | `a`, `b`, `foci:true`, `asymptotes:true`, `center:[x,y]`, `line:{m,q}` |
| `homographic` | Homographic function `(ax+b)/(cx+d)` | `a`, `b`, `c`, `d` |
| `line` | Straight line | `drag:true` (2-point), `m`, `q`, `pencil:[x,y]` (pencil), `distancePoint:[x,y]` |
| `unit-circle` | Trigonometric circle | `show:["sin","cos","tan","arc","pyth"]`, `snap:true` |

Common options for all kinds: `box:[xmin, ymax, xmax, ymin]` (visible window) and `note:["text"]` (caption). In `exprs` expressions you can use `x`, slider parameter names, and the functions `sin cos tan sqrt abs exp log pow`. To **remove** the graph from a topic entirely, set `"plot": null`.

---

## 5. Real login with Supabase (recommended) — free

Without Supabase, codes are stored in the **browser's `localStorage`** and are only valid on the device that generated them (local mode). With Supabase, codes live in a real database: valid on every device, and you can see the list of registered users.

The free tier is genuinely free — no credit card required. Note: a free project is **paused after ~1 week of complete inactivity**; just reopen it from the dashboard to wake it up.

**Setup (4 steps):**

1. Create an account at <https://supabase.com> and a new **project** (choose a database password and a nearby region, e.g. *Frankfurt*).
2. Open **SQL Editor → New query**, paste the entire contents of **`supabase-schema.sql`** and click **Run**. This creates the `access_codes` table and the two RPC functions used by the site.
3. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **Project API key → `anon` `public`** — the public key. **Never** use the `service_role` key.
4. Open `assets/app.js` and fill in `CONFIG.SUPABASE` near the top:

```js
SUPABASE: {
  URL:      'https://abcd1234.supabase.co',
  ANON_KEY: 'eyJhbGciOi...'
}
```

Done. Registrations now create codes in the database; logins verify against it. To **view registered users**: Dashboard → **Table Editor → `access_codes`** (visible only to you when logged in to the dashboard).

> **Why is the `anon` key safe to ship in public JS?**
> The table has Row Level Security enabled **without any policy** — the public key cannot read or write the table directly. It can only call the two functions `fh_register` / `fh_check_code`, which never return email addresses. User emails remain private. Never paste the `service_role` key into the site.

Leaving `URL` / `ANON_KEY` as `''` keeps the site in local mode.

---

## 6. Configure email delivery (EmailJS) — optional

The access code is always **shown on screen** after registration. To also email it to the student, set up EmailJS (free tier, no backend):

1. Create an account at <https://www.emailjs.com> and add an **Email Service** (connect your Gmail or other provider).
2. Create an **Email Template** with variables `{{to_name}}`, `{{to_email}}`, `{{passcode}}`, `{{ruolo}}`. Set the *To* field to `{{to_email}}`.
   - A ready-made HTML template is in **`assets/email-template.html`** — paste its `<div>…</div>` body into the EmailJS template editor (switch to HTML view `< >`).
3. Copy your **Public Key**, **Service ID** and **Template ID**.
4. Open `assets/app.js` and fill in `CONFIG.EMAILJS`:

```js
EMAILJS: {
  PUBLIC_KEY:  'XXXXXXXXXXXX',
  SERVICE_ID:  'service_xxxxx',
  TEMPLATE_ID: 'template_xxxxx'
}
```

Leave `PUBLIC_KEY` as `''` to disable email entirely — everything else still works.

---

## 6-bis. Star ratings → Google Sheets (optional)

After a student opens 5 topics, a review modal appears (star rating 1–5). To save these ratings to a Google Sheet:

1. Open **Google Drive → New → Google Sheets** — name it *Formularium Reviews*.
2. In row 1 add four column headers: `Timestamp` · `Stelle` · `Lingua` · `Data`.
3. In the sheet: **Extensions → Apps Script** — delete the default code, paste the entire **`google-reviews-script.js`** file, and save.
4. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** → copy the **Web app URL**.
5. Open `assets/app.js` and paste the URL into `CONFIG.REVIEWS_SHEET_URL`:

```js
REVIEWS_SHEET_URL: 'https://script.google.com/macros/s/XXX/exec'
```

> **Privacy:** only the star rating (1–5), the interface language (it/en) and a timestamp are sent to the sheet. **No name, email, or any personal data is transmitted.**
> The registration form also shows this note to users.

---

## 7. Master (teacher / admin) credentials

A master login bypasses the access-code flow. Default credentials:

| Username | Password |
|---|---|
| `docente` | `maturita2026` |

**To change them**, open the browser console on the live site and run:

```js
cyrb53('my-new-username')   // copy the result
cyrb53('my-new-password')   // copy the result
```

Then paste both results into `assets/app.js`:

```js
MASTER_USER_HASH: '…',
MASTER_PASS_HASH: '…',
```

---

## ⚠️ Security limitations

**Local mode (without Supabase).** This is a static site — there is no server. All "authentication" here is **convenience only, not real security**:

- Everything (including the master-password hash) ships inside the public JavaScript bundle and can be read by anyone who looks. The `cyrb53` hash only keeps the literal word out of plain sight — it is **obfuscation, not protection**.
- Generated codes are stored in the visitor's own `localStorage` and are not verified against any database; they do not sync across devices.

**With Supabase (§5).** Codes become real and cross-device, stored in a database. User emails are never exposed to the public (RLS + `SECURITY DEFINER` functions). The site is intended for public study material — **treat all formulary content as public**. The client-side master password is not a robust barrier.

---

## 8. Accessibility & performance

- Respects `prefers-reduced-motion` (all animations collapse to instant transitions).
- Works down to a 375 px viewport; the sidebar becomes a hamburger menu on mobile.
- Initial payload (HTML + CSS + JS + content) is well under 500 KB; KaTeX and JSXGraph are the only heavy dependencies and are CDN-cached.
- Semantic HTML throughout; ARIA labels on interactive controls.

---

## 9. Author byline

The hero and the sidebar footer carry an author signature. To personalise it:

1. **Photo** — replace `assets/andrea-gervasoni.png` with your own square portrait (it is shown as a 34 px circle, grayscale until hovered).
2. **Link** — when your personal site is live, open `index.html`, find the two `<a class="byline" href="#"…>` elements and set `href` to your URL. Then remove the toast handler in `assets/app.js` (the block marked `byline: personal site not live yet`) so the link opens normally.
3. **Name / role** — edit the text in `index.html` and the `byline_by` / `byline_role` strings in `assets/i18n.js`.

---

## License

MIT — see [`LICENSE`](LICENSE).
