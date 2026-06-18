/* ============================================================================
   FORMULARIUM — schemas.js
   Hand-drawn SVG diagrams keyed by topic id, used as the "Schema visivo" when a
   topic's "schema" field in content.json is left empty. The owner can override
   any of these by pasting their own <svg>…</svg> into content.json.
   Style: ink strokes, amber accent, notebook feel.
   ============================================================================ */
/* light-theme palette: dark ink on the light glass surface, orange accent */
const C = {
  ink:   '#221C14',                 // primary dark ink
  soft:  '#4b4234',                 // secondary
  mut:   '#7c715f',                 // muted
  line:  'rgba(34,28,20,0.22)',     // hairlines
  amber: '#DD7A2E',                 // burnt-orange accent
  tint:  'rgba(221,122,46,0.16)'    // orange tint fill
};

const SCHEMAS = {

  /* ---- Disequazioni di 2° grado: la parabola e il segno -------------------- */
  'a-diseq-2grado': `
  <svg viewBox="0 0 360 230" width="360" height="230" role="img" aria-label="Parabola con concavità verso l'alto: positiva all'esterno degli zeri">
    <!-- positive zones tint -->
    <rect x="28" y="40" width="104" height="110" fill="${C.tint}" opacity=".55"/>
    <rect x="248" y="40" width="84" height="110" fill="${C.tint}" opacity=".55"/>
    <!-- axes -->
    <line x1="28" y1="150" x2="338" y2="150" stroke="${C.soft}" stroke-width="1.4"/>
    <line x1="60" y1="36" x2="60" y2="200" stroke="${C.line}" stroke-width="1.2"/>
    <polygon points="338,150 330,146 330,154" fill="${C.soft}"/>
    <text x="330" y="170" font-family="Manrope,sans-serif" font-size="12" fill="${C.mut}">x</text>
    <!-- parabola y = x²-5x+6 (concava verso l'alto) -->
    <path d="M88,60 C128,150 156,192 190,192 C224,192 252,150 292,60"
          fill="none" stroke="${C.amber}" stroke-width="2.6" stroke-linecap="round"/>
    <!-- roots -->
    <circle cx="132" cy="150" r="4" fill="${C.ink}"/>
    <circle cx="248" cy="150" r="4" fill="${C.ink}"/>
    <text x="120" y="172" font-family="Manrope,sans-serif" font-size="13" fill="${C.ink}">x₁</text>
    <text x="244" y="172" font-family="Manrope,sans-serif" font-size="13" fill="${C.ink}">x₂</text>
    <!-- sign labels -->
    <text x="74" y="118" font-family="Space Grotesk,sans-serif" font-size="30" font-weight="700" fill="${C.amber}">+</text>
    <text x="296" y="118" font-family="Space Grotesk,sans-serif" font-size="30" font-weight="700" fill="${C.amber}">+</text>
    <text x="183" y="138" font-family="Space Grotesk,sans-serif" font-size="30" font-weight="700" fill="${C.mut}">−</text>
    <text x="118" y="216" font-family="Manrope,sans-serif" font-size="12.5" fill="${C.soft}">positiva all'esterno degli zeri</text>
  </svg>`,

  /* ---- Funzione pari: simmetria rispetto all'asse y ----------------------- */
  'a-pari-dispari': `
  <svg viewBox="0 0 360 230" width="360" height="230" role="img" aria-label="Funzione pari: grafico simmetrico rispetto all'asse y">
    <line x1="24" y1="160" x2="336" y2="160" stroke="${C.soft}" stroke-width="1.4"/>
    <line x1="180" y1="30" x2="180" y2="206" stroke="${C.amber}" stroke-width="1.6" stroke-dasharray="5 5"/>
    <polygon points="336,160 328,156 328,164" fill="${C.soft}"/>
    <text x="322" y="180" font-family="Manrope,sans-serif" font-size="12" fill="${C.mut}">x</text>
    <text x="188" y="44" font-family="Manrope,sans-serif" font-size="12" fill="${C.amber}">asse y</text>
    <!-- even curve (parabola-like) symmetric about x=180 -->
    <path d="M70,58 C120,150 150,176 180,176 C210,176 240,150 290,58"
          fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>
    <!-- mirrored sample points -->
    <circle cx="120" cy="120" r="4" fill="${C.amber}"/>
    <circle cx="240" cy="120" r="4" fill="${C.amber}"/>
    <line x1="120" y1="120" x2="120" y2="160" stroke="${C.mut}" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="240" y1="120" x2="240" y2="160" stroke="${C.mut}" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="96" y="150" font-family="Manrope,sans-serif" font-size="12" fill="${C.soft}">−x</text>
    <text x="248" y="150" font-family="Manrope,sans-serif" font-size="12" fill="${C.soft}">x</text>
    <text x="120" y="214" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="17" fill="${C.ink}">f(−x)</text>
    <text x="180" y="214" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="17" fill="${C.ink}">=</text>
    <text x="240" y="214" text-anchor="middle" font-family="Space Grotesk,sans-serif" font-size="17" fill="${C.ink}">f(x)</text>
  </svg>`,

  /* ---- Parabola come luogo geometrico: fuoco e direttrice ----------------- */
  'c-par-luogo': `
  <svg viewBox="0 0 360 240" width="360" height="240" role="img" aria-label="Parabola: ogni punto è equidistante dal fuoco e dalla direttrice">
    <!-- directrice -->
    <line x1="36" y1="198" x2="324" y2="198" stroke="${C.amber}" stroke-width="2" stroke-dasharray="7 5"/>
    <text x="40" y="216" font-family="Manrope,sans-serif" font-size="12.5" fill="${C.amber}">direttrice d</text>
    <!-- parabola (vertex at 180,150 opening up) -->
    <path d="M70,60 C120,150 150,150 180,150 C210,150 240,150 290,60"
          fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>
    <!-- focus -->
    <circle cx="180" cy="108" r="4.5" fill="${C.amber}"/>
    <text x="190" y="106" font-family="Space Grotesk,sans-serif" font-size="17" fill="${C.ink}">F</text>
    <!-- point P on parabola -->
    <circle cx="240" cy="96" r="4.5" fill="${C.ink}"/>
    <text x="248" y="92" font-family="Space Grotesk,sans-serif" font-size="17" fill="${C.ink}">P</text>
    <!-- equal segments: P→F and P→directrice -->
    <line x1="240" y1="96" x2="180" y2="108" stroke="${C.soft}" stroke-width="1.6"/>
    <line x1="240" y1="96" x2="240" y2="198" stroke="${C.soft}" stroke-width="1.6"/>
    <!-- equality ticks -->
    <line x1="208" y1="95" x2="214" y2="107" stroke="${C.amber}" stroke-width="2"/>
    <line x1="234" y1="146" x2="246" y2="146" stroke="${C.amber}" stroke-width="2"/>
    <text x="150" y="232" text-anchor="middle" font-family="Manrope,sans-serif" font-size="12.5" fill="${C.soft}">PF = dist(P, d)  per ogni P</text>
  </svg>`,

  /* ---- Radiante: arco lungo quanto il raggio ------------------------------ */
  'd-misura-angoli': `
  <svg viewBox="0 0 360 240" width="360" height="240" role="img" aria-label="Un radiante: l'arco è lungo quanto il raggio">
    <circle cx="150" cy="130" r="80" fill="none" stroke="${C.line}" stroke-width="1.6"/>
    <!-- centre + horizontal radius -->
    <circle cx="150" cy="130" r="3.4" fill="${C.ink}"/>
    <line x1="150" y1="130" x2="230" y2="130" stroke="${C.soft}" stroke-width="1.8"/>
    <text x="186" y="148" font-family="Manrope,sans-serif" font-size="12.5" fill="${C.soft}">r</text>
    <!-- radius to ~57.3° (1 rad) -->
    <line x1="150" y1="130" x2="193" y2="63" stroke="${C.soft}" stroke-width="1.8"/>
    <!-- highlighted arc = r -->
    <path d="M230,130 A80,80 0 0 0 193,63" fill="none" stroke="${C.amber}" stroke-width="3.2"/>
    <text x="238" y="86" font-family="Manrope,sans-serif" font-size="12.5" fill="${C.amber}">arco = r</text>
    <!-- angle arc + label -->
    <path d="M178,130 A28,28 0 0 0 166,107" fill="none" stroke="${C.ink}" stroke-width="1.4"/>
    <text x="178" y="118" font-family="Space Grotesk,sans-serif" font-size="16" fill="${C.ink}">θ</text>
    <text x="150" y="232" text-anchor="middle" font-family="Manrope,sans-serif" font-size="12.5" fill="${C.soft}">arco = raggio  ⇒  θ = 1 radiante ≈ 57,3°</text>
  </svg>`
};
window.SCHEMAS = SCHEMAS;
