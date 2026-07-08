/* ============================================================================
   FORMULARIUM — plots-data.js
   The library of interactive-graph specs, keyed by topic id. The "Schema
   visivo" of each topic renders the matching board.
   ----------------------------------------------------------------------------
   A spec is a tiny object: { kind: "...", ...options }. The owner can override
   any of these per-topic by adding a "plot" field in content.json (which takes
   priority). See README §"Grafici interattivi" for the full option list.
   Kinds: function · parabola · circle · ellipse · hyperbola · homographic ·
          line · unit-circle
   ============================================================================ */
const PLOTS = {

  /* ---------------- TEMA A — funzioni ---------------- */
  'a-diseq-2grado': { kind: 'parabola', params: { a: 1, b: -5, c: 6 }, shade: 'gt',
    note: ['Sposta a, b, c: in arancio le x che risolvono  a x²+bx+c > 0'] },

  'a-razionali': { kind: 'function', exprs: [{ f: '(x*x*x - x)/(x - k)' }], vlines: [2], box: [-4, 5, 4, -6],
    sliders: { k: { min: -3, max: 4, value: 2, step: 0.5 } },
    latex: 'y = \\dfrac{x^{3}-x}{x-k}',
    points: [[-1, 0, 'zero'], [0, 0, 'zero'], [1, 0, 'zero']],
    note: ['Sposta k: l’asintoto verticale segue il denominatore; gli zeri del numeratore restano fissi in −1, 0, 1'] },

  'a-valori-assoluti': { kind: 'function', exprs: [{ f: 'abs(3*x + 1)' }, { f: 'x + k' }],
    sliders: { k: { min: -6, max: 3, value: -2, step: 0.5 } }, box: [-5, 6, 5, -6],
    latex: 'y = |3x+1| \\quad \\text{e} \\quad y = x + k',
    points: [[-0.333, 0, 'vertice']],
    note: ['Sposta k: la retta incontra la "V" solo se passa abbastanza in alto; se resta sotto il vertice, l’equazione è impossibile'] },

  'a-irrazionali': { kind: 'function', exprs: [{ f: 'sqrt(x + k)' }],
    sliders: { k: { min: -4, max: 6, value: 2, step: 0.5 } }, box: [-6, 8, 9, -3],
    latex: 'y = \\sqrt{\\,x + k\\,}',
    note: ['Dominio: x + k ≥ 0  (la radice esiste solo a destra di −k)'] },

  'a-caratteristiche-funzioni': { kind: 'function', exprs: [{ f: '(x*x - 4)/(x - 3)' }], vlines: [3], box: [-7, 10, 9, -10],
    latex: 'y = \\dfrac{x^{2}-4}{x-3}',
    points: [[-2, 0, 'zero'], [2, 0, 'zero']], note: ['Zeri in x = ±2 · asintoto verticale x = 3'] },

  'a-proprieta-funzioni': { kind: 'function', exprs: [{ f: 'x*x*x - 3*x' }], hline: true, box: [-4, 6, 4, -6],
    latex: 'y = x^{3} - 3x',
    note: ['Muovi la retta y = k: se taglia il grafico in >1 punto, f non è iniettiva'] },

  'a-tratti': { kind: 'function', exprs: [{ f: 'x < 0 ? -x : (x <= 2 ? x*x : x + 2)' }], box: [-5, 8, 6, -3],
    latex: 'f(x)=\\begin{cases}-x & x<0\\\\ x^{2} & 0\\le x\\le 2\\\\ x+2 & x>2\\end{cases}',
    note: ['f(x) = −x  (x<0);  x²  (0≤x≤2);  x+2  (x>2)'] },

  'a-pari-dispari': { kind: 'function', exprs: [{ f: 'x*x - cos(x)' }], mirror: 'even', box: [-7, 7, 7, -3],
    latex: 'y = x^{2} - \\cos x',
    note: ['Funzione PARI: trascina P, il punto P′ in −x ha la stessa altezza'] },

  'a-composta-inversa': { kind: 'function', exprs: [{ f: 'pow(2, x)' }], inverse: true, box: [-6, 6, 6, -6],
    latex: 'y = 2^{x} \\;\\longrightarrow\\; y = \\log_{2} x',
    note: ['In blu la funzione inversa: riflessione di f rispetto alla retta y = x'] },

  /* ---------------- TEMA B — retta e trasformazioni ---------------- */
  'b-retta': { kind: 'line', drag: true, box: [-7, 7, 7, -7],
    note: ['Trascina A e B: leggi coefficiente angolare m e intercetta q'] },

  'b-distanza-bisettrici': { kind: 'line', m: 0.5, q: 1, distancePoint: [-3, 4], box: [-7, 7, 7, -7],
    note: ['Trascina P: il segmento PH è la distanza punto-retta'] },

  'b-fasci': { kind: 'line', pencil: [1, 2], box: [-7, 8, 7, -6] },

  'b-trasformazioni': { kind: 'function', exprs: [{ f: '(x - h)*(x - h) + k' }], ghost: 'x*x',
    sliders: { h: { min: -4, max: 4, value: 2, step: 0.5 }, k: { min: -4, max: 4, value: -1, step: 0.5 } },
    latex: 'y = (x - h)^{2} + k',
    box: [-7, 8, 7, -5], note: ['Traslazione di y = x² (tratteggio) di vettore (h, k)'] },

  /* ---------------- TEMA C — coniche ---------------- */
  // circonferenza
  'c-circ-luogo': { kind: 'circle', center: [1, 1], r: 3, showRadius: true,
    note: ['Trascina il centro C, regola r: ogni punto P dista r da C'] },
  'c-circ-retta': { kind: 'circle', center: [0, 0], r: 3, line: { m: 0.4, q: -2 },
    note: ['Muovi la retta (m, q): osserva secante / tangente / esterna'] },
  'c-circ-determinare': { kind: 'circle', through: [[-3, 0], [3, 0], [0, 3]] },
  'c-circ-fasci': { kind: 'circle', pencil: 'circles', box: [-7, 7, 7, -7] },

  // parabola
  'c-par-luogo': { kind: 'parabola', params: { a: 0.25, b: 0, c: 0 }, focusDirectrix: true,
    note: ['Trascina P: dista uguale dal fuoco F e dalla direttrice d'] },
  'c-par-retta': { kind: 'parabola', params: { a: 0.5, b: 0, c: -2 }, line: { m: 1, q: 0 },
    note: ['Regola la retta: tangenza quando tocca la parabola in un solo punto'] },
  'c-par-determinare': { kind: 'parabola', params: { a: 1, b: -2, c: -1 },
    note: ['Vertice V mostrato in tempo reale al variare di a, b, c'] },
  'c-par-archimede': { kind: 'parabola', params: { a: 0.5, b: 0, c: -2 }, chord: [-3, 3],
    note: ['Trascina A e B sulla parabola: in arancio il segmento parabolico'] },

  // ellisse
  'c-ell-luogo': { kind: 'ellipse', a: 4, b: 3, foci: true, sumGlider: true,
    note: ['Trascina P: la somma delle distanze dai fuochi resta = 2a'] },
  'c-ell-retta': { kind: 'ellipse', a: 4, b: 2, line: { m: 0.3, q: 1 } },
  'c-ell-traslate': { kind: 'ellipse', a: 3, b: 2, center: [1, -1],
    note: ['Trascina il centro O′: l’ellisse trasla rigidamente'] },

  // iperbole
  'c-ip-luogo': { kind: 'hyperbola', a: 3, b: 2, foci: true, asymptotes: true,
    note: ['Gli asintoti (tratteggio) guidano i due rami dell’iperbole'] },
  'c-ip-retta': { kind: 'hyperbola', a: 3, b: 2, line: { m: 0.8, q: 0 } },
  'c-ip-traslata': { kind: 'hyperbola', a: 2, b: 2, center: [1, -1] },
  'c-ip-equilatera': { kind: 'homographic', a: 1, b: 2, c: 1, d: -1, box: [-8, 8, 8, -8],
    note: ['Funzione omografica y = (a x + b)/(c x + d)'] },

  /* ---------------- TEMA D — trigonometria ---------------- */
  'd-misura-angoli': { kind: 'unit-circle', show: ['arc'],
    note: ['Trascina P sulla circonferenza: leggi l’angolo in gradi e radianti'] },
  'd-definizione': { kind: 'unit-circle', show: ['sin', 'cos', 'tan', 'arc'] },
  'd-relazioni': { kind: 'unit-circle', show: ['sin', 'cos', 'pyth'] },
  'd-angoli-particolari': { kind: 'unit-circle', show: ['sin', 'cos', 'arc'], snap: true }
};
window.PLOTS = PLOTS;
