# Formularium

A public, interactive mathematics formulary for students of the Italian *liceo*. Each topic is a card with five fixed sections — **Formula · Worked Example · Common Mistake · Visual Diagram · Connections** — with mathematics typeset by KaTeX and fully interactive graphs powered by JSXGraph.

> **Why the name?** *Formularium* is the Latin word for a collection of formulas — academic, memorable, and legible in any language. It reads as a scholarly object rather than a web app, which suits a university-portfolio piece.

---

## Design at a glance

- **Palette** — warm off-white background with a single **amber/orange** accent (`#D9772B`). One saturated accent keeps the mathematics the hero.
- **Type** — *Space Grotesk* (display) paired with *Manrope* (body) and *JetBrains Mono* for codes. Mathematics in KaTeX.
- **Hero** — a centered, full-bleed hero with a giant two-tone gradient wordmark, eyebrow pill, glass CTAs and a stats row.
- **Signature element** — analogue instrument controls: the completion checkbox is a precision **dial** (needle swings, ring closes) and the sidebar progress meter is a **tuning gauge** with a moving needle.
- **Interactive graphs** — every topic's "Visual Diagram" section renders a live JSXGraph board with draggable points, parameter sliders and scroll-to-zoom. A live KaTeX formula panel below the graph updates as you interact.
- **CMS** — **Option A (single `content.json`)**. One file, editable in any text editor or directly in GitHub's web UI — no folders, no per-file naming, fully searchable.
- **i18n** — IT / EN language switch (flag toggle in the navbar, preference persisted in `localStorage`).

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

## License

MIT
