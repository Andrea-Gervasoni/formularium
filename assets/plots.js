/* ============================================================================
   FORMULARIUM — plots.js
   Interactive math-graph engine built on JSXGraph (loaded via CDN).
   ----------------------------------------------------------------------------
   Public API (window.FormulaPlot):
     whenReady(cb)        run cb once JSXGraph is available
     render(el, spec)     build an interactive board inside element `el`
     resetView()          reset zoom/pan of the most-recent board
     clearAll()           free every board (called on topic change)

   A "spec" is a small declarative object (see assets/plots-data.js for the
   library, and README for how to write your own). Every spec has a `kind`:
     function · parabola · circle · ellipse · hyperbola · homographic ·
     line · unit-circle
   ============================================================================ */
(function () {
  const boards = [];
  let last = null, lastBox = null;
  let optsApplied = false;

  /* ---- light-theme palette for the boards --------------------------------- */
  const K = {
    curve: '#cf6f1a', curve2: '#2f6f8f', curve3: '#3f8f5f',
    ink: '#221C14', soft: '#7c715f', mut: '#b9ad97',
    pt: '#cf6f1a', region: '#cf6f1a', good: '#4f8a4f',
    line: '#2f6f8f', dash: '#a89c88'
  };

  function applyOpts() {
    if (optsApplied || !window.JXG) return;
    optsApplied = true;
    const O = JXG.Options;
    O.grid.strokeColor = '#e7dcc8';
    O.grid.strokeOpacity = 0.7;
    O.grid.majorStep = 1;
    if (O.board) O.board.showInfobox = false;
    O.text.fontSize = 13;
    O.text.cssDefaultStyle = "font-family:'Manrope',sans-serif;";
  }

  /* ---- ready / lifecycle -------------------------------------------------- */
  function whenReady(cb) {
    if (window.JXG) { applyOpts(); cb(); return; }
    let n = 0;
    const t = setInterval(() => {
      if (window.JXG) { clearInterval(t); applyOpts(); cb(); }
      else if (++n > 120) clearInterval(t);
    }, 50);
  }
  function clearAll() {
    boards.forEach(b => { try { JXG.JSXGraph.freeBoard(b); } catch (e) {} });
    boards.length = 0; last = null; lastBox = null;
  }
  function resetView() {
    if (last && lastBox) { try { last.setBoundingBox(lastBox.slice(), true); last.update(); } catch (e) {} }
  }

  /* ---- helpers ------------------------------------------------------------ */
  const DEF = {
    a: { min: -4, max: 4, value: 1, step: 0.25 },
    b: { min: -6, max: 6, value: -5, step: 0.5 },
    c: { min: -6, max: 8, value: 6, step: 0.5 },
    k: { min: -4, max: 6, value: 2, step: 0.5 },
    h: { min: -5, max: 5, value: 2, step: 0.5 },
    m: { min: -4, max: 4, value: 1, step: 0.25 },
    q: { min: -6, max: 6, value: -1, step: 0.5 }
  };

  function makeBoard(el, box, aspect, extra) {
    el.classList.add('jxgbox');
    const board = JXG.JSXGraph.initBoard(el.id, Object.assign({
      boundingbox: box, axis: true, showCopyright: false, showNavigation: false,
      keepAspectRatio: !!aspect, grid: true, showInfobox: false,
      pan: { enabled: true, needShift: false },
      zoom: { wheel: true, needShift: false, min: 0.15, max: 12 },
      defaultAxes: {
        x: { strokeColor: '#b9ad97', highlight: false, ticks: { strokeColor: '#dccfb8', majorHeight: 7, drawZero: false, label: { fontSize: 11, strokeColor: '#9a8f7d', offset: [-2, -10] } } },
        y: { strokeColor: '#b9ad97', highlight: false, ticks: { strokeColor: '#dccfb8', majorHeight: 7, drawZero: false, label: { fontSize: 11, strokeColor: '#9a8f7d', offset: [8, -2] } } }
      }
    }, extra || {}));
    boards.push(board); last = board; lastBox = box.slice();
    return board;
  }

  function sdef(name, override) {
    return Object.assign({ name: name }, DEF[name] || { min: -5, max: 5, value: 1, step: 0.25 }, override || {});
  }

  // place a stack of sliders along the top-left of the board
  function addSliders(board, defs) {
    const [xmin, ymax, xmax, ymin] = board.getBoundingBox();
    const w = xmax - xmin, h = ymax - ymin;
    const refs = {};
    defs.forEach((d, i) => {
      const y = ymax - h * 0.075 * (i + 1);
      const x1 = xmin + w * 0.05, x2 = xmin + w * 0.34;
      const s = board.create('slider', [[x1, y], [x2, y], [d.min, d.value, d.max]], {
        name: d.name, snapWidth: d.step || -1, withLabel: true,
        strokeColor: '#a85a12', fillColor: '#cf6f1a',
        point1: { color: '#cf6f1a' }, point2: { color: '#cf6f1a' },
        baseline: { strokeColor: '#d8cdb8', strokeWidth: 2 },
        highline: { strokeColor: '#cf6f1a', strokeWidth: 4 },
        label: { fontSize: 14, strokeColor: '#221C14', cssStyle: 'font-weight:700;' },
        size: 4, precision: 1
      });
      refs[d.name] = s;
    });
    return refs;
  }
  const buildSliders = (board, spec, names) =>
    addSliders(board, names.map(n => sdef(n, (spec.sliders || {})[n] || (spec.params && spec.params[n] != null ? { value: spec.params[n] } : null))));

  // compile a JS-ish expression string into f(x) reading slider values live
  function compile(expr, refs) {
    const names = Object.keys(refs);
    const pre = 'const {sin,cos,tan,asin,acos,atan,atan2,sinh,cosh,tanh,sqrt,cbrt,abs,exp,pow,PI,E,sign,floor,ceil,min,max}=Math;const log=Math.log,ln=Math.log,log10=Math.log10;';
    let fn;
    try { fn = new Function(...names, 'x', pre + 'return (' + expr + ');'); }
    catch (e) { console.warn('plot expr error:', expr, e); return () => NaN; }
    return (x) => { try { const v = fn(...names.map(n => refs[n].Value()), x); return (typeof v === 'number' && isFinite(v)) ? v : NaN; } catch (e) { return NaN; } };
  }

  function readout(board, lines) {
    const [xmin, ymax, xmax, ymin] = board.getBoundingBox();
    const w = xmax - xmin, h = ymax - ymin;
    const content = () => (Array.isArray(lines) ? lines : [lines]).map(l => (typeof l === 'function' ? l() : l)).join('<br>');
    return board.create('text', [xmin + w * 0.04, ymin + h * 0.085, content], {
      fontSize: 14, strokeColor: '#221C14', fixed: true, anchorX: 'left', anchorY: 'bottom',
      cssStyle: "font-weight:700;background:rgba(255,253,249,.82);padding:5px 9px;border-radius:8px;line-height:1.35;"
    });
  }
  const fmt = (n, d = 2) => (Math.round(n * Math.pow(10, d)) / Math.pow(10, d));
  const nf = (n) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? 0 : v; };
  // build a readable signed LaTeX polynomial from [[coef,'x^{2}'],[coef,'x'],[coef,'']]
  function fmtPoly(terms) {
    let s = '';
    terms.forEach(([co, mono]) => {
      if (Math.abs(co) < 1e-9) return;
      const neg = co < 0, mag = nf(Math.abs(co));
      const coef = (mono && Math.abs(Math.abs(co) - 1) < 1e-9) ? '' : String(mag);
      s += (s === '') ? (neg ? '-' : '') + coef + mono : (neg ? ' - ' : ' + ') + coef + mono;
    });
    return s === '' ? '0' : s;
  }
  // (x - h)^2  with sign handling; bare x^2 when h≈0
  const sq = (v, center) => (Math.abs(center) < 1e-9) ? v + '^{2}' : '(' + v + (center > 0 ? ' - ' : ' + ') + nf(Math.abs(center)) + ')^{2}';
  const fmtLin = (p, q) => fmtPoly([[p, 'x'], [q, '']]);

  /* ===========================================================================
     KIND: function  (generic y=f(x), sliders, ghosts, asymptotes, extras)
     =========================================================================== */
  function kFunction(board, spec) {
    const sliderNames = spec.sliderOrder || Object.keys(spec.sliders || {});
    const refs = sliderNames.length ? addSliders(board, sliderNames.map(n => sdef(n, (spec.sliders || {})[n]))) : {};
    board._eq = () => {
      let s = spec.latex || 'y = f(x)';
      const ks = Object.keys(refs);
      if (ks.length) s += '\\quad\\left(' + ks.map(n => n + ' = ' + fmt(refs[n].Value())).join(',\\ ') + '\\right)';
      return s;
    };
    (spec.vlines || []).forEach(xv => board.create('line', [[xv, 0], [xv, 1]], { straightFirst: true, straightLast: true, strokeColor: K.dash, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false }));
    (spec.hlines || []).forEach(yv => board.create('line', [[0, yv], [1, yv]], { straightFirst: true, straightLast: true, strokeColor: K.dash, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false }));
    if (spec.ghost) { const g = compile(spec.ghost, refs); board.create('functiongraph', [g], { strokeColor: K.mut, strokeWidth: 2, dash: 2, highlight: false }); }

    const colors = [K.curve, K.curve2, K.curve3];
    (spec.exprs || [{ f: 'x*x' }]).forEach((e, i) => {
      const f = compile(e.f, refs);
      board.create('functiongraph', [f], { strokeColor: e.color || colors[i % 3], strokeWidth: 3, dash: e.dash ? 2 : 0, highlight: false });
    });

    // inverse: reflect first expr over y=x, draw y=x guide
    if (spec.inverse) {
      const f = compile((spec.exprs || [{ f: 'x*x*x' }])[0].f, refs);
      const [xmin, , xmax] = board.getBoundingBox();
      board.create('functiongraph', [x => x], { strokeColor: K.mut, dash: 2, strokeWidth: 1.5, highlight: false });
      board.create('curve', [t => f(t), t => t, xmin, xmax], { strokeColor: K.curve2, strokeWidth: 3, highlight: false });
    }

    // movable horizontal test line y=k (injectivity)
    if (spec.hline) {
      const ky = board.create('slider', [[board.getBoundingBox()[0] * 0.6, board.getBoundingBox()[1] * 0.85], [board.getBoundingBox()[2] * 0.6, board.getBoundingBox()[1] * 0.85], [board.getBoundingBox()[3], 1, board.getBoundingBox()[1]]], { name: 'k', strokeColor: '#a85a12', fillColor: K.curve2, baseline: { strokeColor: '#d8cdb8' }, highline: { strokeColor: K.curve2 }, label: { fontSize: 14, cssStyle: 'font-weight:700' } });
      board.create('line', [[0, () => ky.Value()], [1, () => ky.Value()]], { straightFirst: true, straightLast: true, strokeColor: K.curve2, strokeWidth: 2, dash: 1, fixed: true, highlight: false });
    }

    // mirror symmetric points (even / odd)
    if (spec.mirror) {
      const f = compile((spec.exprs || [{ f: 'x*x' }])[0].f, refs);
      const odd = spec.mirror === 'odd';
      const P = board.create('glider', [1.5, f(1.5), board.select(board.objectsList.find(o => o.elType === 'curve'))], { name: 'P', color: K.pt, size: 4, label: { fontSize: 13 } });
      const Q = board.create('point', [() => -P.X(), () => odd ? -f(-(-P.X())) : f(-P.X())], { name: "P'", color: K.curve2, size: 4, fixed: true, label: { fontSize: 13 } });
      board.create('segment', [P, Q], { strokeColor: K.mut, dash: 2, strokeWidth: 1.5, highlight: false });
      if (odd) board.create('point', [0, 0], { name: 'O', size: 1, color: K.ink, fixed: true, withLabel: false });
    }

    (spec.points || []).forEach(p => board.create('point', [p[0], p[1]], { name: p[2] || '', color: K.ink, size: 2, fixed: true }));
    if (spec.note) readout(board, spec.note);
  }

  /* ===========================================================================
     KIND: parabola  (y = a x² + b x + c), vertex, focus/directrix, shade, line, chord
     =========================================================================== */
  function kParabola(board, spec) {
    const refs = buildSliders(board, spec, ['a', 'b', 'c']);
    const a = () => refs.a.Value(), b = () => refs.b.Value(), c = () => refs.c.Value();
    board._eq = () => 'y = ' + fmtPoly([[a(), 'x^{2}'], [b(), 'x'], [c(), '']]);
    const f = x => a() * x * x + b() * x + c();
    const curve = board.create('functiongraph', [f], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    board.create('point', [() => -b() / (2 * a()), () => f(-b() / (2 * a()))], { name: 'V', color: K.ink, size: 2, fixed: true, label: { fontSize: 13, offset: [8, 8] } });

    if (spec.shade) {
      const dir = (spec.shade === 'lt' || spec.shade === 'le') ? '<' : '>';
      const sol = board.create('curve', [[], []], { strokeColor: K.region, strokeWidth: 7, strokeOpacity: 0.8, highlight: false });
      sol.updateDataArray = function () {
        const [xmin, , xmax] = board.getBoundingBox();
        const ints = signIntervals(a(), b(), c(), dir, xmin, xmax);
        this.dataX = []; this.dataY = [];
        ints.forEach(([lo, hi]) => { this.dataX.push(lo, hi, NaN); this.dataY.push(0, 0, NaN); });
      };
      // live roots
      const root = (which) => () => { const d = b() * b() - 4 * a() * c(); if (d < 0) return NaN; const s = Math.sqrt(d); return (-b() + which * s) / (2 * a()); };
      board.create('point', [root(-1), 0], { name: '', color: K.ink, size: 2, fixed: true, withLabel: false });
      board.create('point', [root(1), 0], { name: '', color: K.ink, size: 2, fixed: true, withLabel: false });
    }

    if (spec.focusDirectrix) {
      const vx = () => -b() / (2 * a());
      const disc = () => b() * b() - 4 * a() * c();
      board.create('point', [vx, () => (1 - disc()) / (4 * a())], { name: 'F', color: K.curve2, size: 3, fixed: true, label: { fontSize: 13 } });
      const dy = () => -(1 + disc()) / (4 * a());
      board.create('line', [[0, dy], [1, dy]], { straightFirst: true, straightLast: true, strokeColor: K.curve3, strokeWidth: 2, dash: 2, fixed: true, highlight: false, name: 'd', withLabel: false });
      const P = board.create('glider', [2, f(2), curve], { name: 'P', color: K.pt, size: 4 });
      board.create('segment', [P, [() => P.X(), dy]], { strokeColor: K.curve3, strokeWidth: 2, highlight: false });
      board.create('segment', [P, [vx, () => (1 - disc()) / (4 * a())]], { strokeColor: K.curve2, strokeWidth: 2, highlight: false });
    }

    if (spec.line) addStudyLine(board, spec.line, f, 'parabola');

    if (spec.chord) {
      const P1 = board.create('glider', [spec.chord[0], f(spec.chord[0]), curve], { name: 'A', color: K.pt, size: 4 });
      const P2 = board.create('glider', [spec.chord[1], f(spec.chord[1]), curve], { name: 'B', color: K.pt, size: 4 });
      board.create('line', [P1, P2], { strokeColor: K.curve2, strokeWidth: 2, dash: 1, highlight: false });
      const seg = board.create('curve', [[], []], { fillColor: K.region, fillOpacity: 0.18, strokeColor: K.region, strokeWidth: 1.5, highlight: false });
      seg.updateDataArray = function () {
        const x1 = Math.min(P1.X(), P2.X()), x2 = Math.max(P1.X(), P2.X());
        const m = (P2.Y() - P1.Y()) / (P2.X() - P1.X() || 1e-9), q = P1.Y() - m * P1.X();
        this.dataX = []; this.dataY = [];
        const N = 40; for (let i = 0; i <= N; i++) { const x = x1 + (x2 - x1) * i / N; this.dataX.push(x); this.dataY.push(f(x)); }
        for (let i = N; i >= 0; i--) { const x = x1 + (x2 - x1) * i / N; this.dataX.push(x); this.dataY.push(m * x + q); }
      };
    }
    if (spec.note) readout(board, spec.note);
  }

  // sign intervals where  A x² + B x + C  (dir '>' or '<')  0
  function signIntervals(A, B, C, dir, xmin, xmax) {
    let ints = [];
    if (Math.abs(A) < 1e-9) {
      if (Math.abs(B) < 1e-9) { if ((dir === '>' && C > 0) || (dir === '<' && C < 0)) ints = [[xmin, xmax]]; }
      else { const r = -C / B; if (dir === '>') ints = B > 0 ? [[r, xmax]] : [[xmin, r]]; else ints = B > 0 ? [[xmin, r]] : [[r, xmax]]; }
      return clampInts(ints, xmin, xmax);
    }
    const disc = B * B - 4 * A * C;
    if (disc < 0) { const sgn = A > 0 ? '>' : '<'; if (sgn === dir) ints = [[xmin, xmax]]; return clampInts(ints, xmin, xmax); }
    const sq = Math.sqrt(disc); let r1 = (-B - sq) / (2 * A), r2 = (-B + sq) / (2 * A); if (r1 > r2) { const t = r1; r1 = r2; r2 = t; }
    const outside = (A > 0 && dir === '>') || (A < 0 && dir === '<');
    ints = outside ? [[xmin, r1], [r2, xmax]] : [[r1, r2]];
    return clampInts(ints, xmin, xmax);
  }
  const clampInts = (ints, lo, hi) => ints.map(([a, b]) => [Math.max(a, lo), Math.min(b, hi)]).filter(([a, b]) => b > a);

  /* ===========================================================================
     KIND: circle  (center + radius; through-3-points; study line; pencil)
     =========================================================================== */
  function kCircle(board, spec) {
    if (spec.through) {
      const P = spec.through.map((p, i) => board.create('point', [p[0], p[1]], { name: String.fromCharCode(65 + i), color: K.pt, size: 4 }));
      const cc = board.create('circumcircle', P, { strokeColor: K.curve, strokeWidth: 3, center: { visible: true, name: 'C', color: K.ink, size: 2 }, highlight: false });
      board._eq = () => { const h = cc.center.X(), k = cc.center.Y(), r = cc.Radius(); return sq('x', h) + ' + ' + sq('y', k) + ' = ' + fmt(r * r); };
      readout(board, ['Trascina A, B, C: la circonferenza per 3 punti è unica']);
      return;
    }
    if (spec.pencil === 'circles') {
      const t = board.create('slider', [[-5, 6.2], [-1, 6.2], [0, 0.4, 1]], { name: 'λ', strokeColor: '#a85a12', fillColor: K.curve, label: { fontSize: 14, cssStyle: 'font-weight:700' } });
      const c1 = { x: -2, y: 0, r: 2.6 }, c2 = { x: 2, y: 0, r: 2.6 };
      board.create('circle', [[c1.x, c1.y], c1.r], { strokeColor: K.mut, strokeWidth: 1.5, dash: 2, highlight: false });
      board.create('circle', [[c2.x, c2.y], c2.r], { strokeColor: K.mut, strokeWidth: 1.5, dash: 2, highlight: false });
      // member of pencil: center & radius interpolate (illustrative)
      const cx = () => c1.x + (c2.x - c1.x) * t.Value(), cy = () => c1.y + (c2.y - c1.y) * t.Value();
      const rr = () => c1.r + (c2.r - c1.r) * t.Value();
      board.create('circle', [[cx, cy], rr], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
      board._eq = () => sq('x', cx()) + ' + ' + sq('y', cy()) + ' = ' + fmt(rr() * rr());
      readout(board, ['Muovi λ per scorrere il fascio di circonferenze']);
      return;
    }
    const ctr = board.create('point', spec.center || [0, 0], { name: 'C', color: K.ink, size: 3, label: { fontSize: 13 } });
    const rs = board.create('slider', [[board.getBoundingBox()[0] * 0.85, board.getBoundingBox()[1] * 0.85], [board.getBoundingBox()[0] * 0.3, board.getBoundingBox()[1] * 0.85], [0.5, spec.r || 3, Math.abs(board.getBoundingBox()[2]) * 0.95]], { name: 'r', strokeColor: '#a85a12', fillColor: K.curve, baseline: { strokeColor: '#d8cdb8' }, highline: { strokeColor: K.curve }, label: { fontSize: 14, cssStyle: 'font-weight:700' } });
    const circ = board.create('circle', [ctr, () => rs.Value()], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    board._eq = () => sq('x', ctr.X()) + ' + ' + sq('y', ctr.Y()) + ' = ' + fmt(rs.Value() * rs.Value());
    if (spec.showRadius) {
      const P = board.create('glider', [(spec.center ? spec.center[0] : 0) + (spec.r || 3), (spec.center ? spec.center[1] : 0), circ], { name: 'P', color: K.pt, size: 4 });
      board.create('segment', [ctr, P], { strokeColor: K.curve2, strokeWidth: 2, highlight: false, name: 'r', withLabel: false });
    }
    if (spec.line) addStudyLine(board, spec.line, null, 'circle', circ, ctr, () => rs.Value());
    if (spec.note) readout(board, spec.note);
  }

  /* ===========================================================================
     KIND: ellipse / hyperbola  (axis-aligned, sliders a,b, center, foci, line)
     =========================================================================== */
  function kEllipse(board, spec) {
    const refs = addSliders(board, [sdef('a', { min: 1, max: 6, value: spec.a || 4, step: 0.5 }), sdef('b', { min: 1, max: 6, value: spec.b || 3, step: 0.5 })]);
    const cx = spec.center ? spec.center[0] : 0, cy = spec.center ? spec.center[1] : 0;
    let CX = () => cx, CY = () => cy;
    if (spec.center && spec.movableCenter !== false) {
      const C = board.create('point', [cx, cy], { name: 'O′', color: K.ink, size: 3 });
      CX = () => C.X(); CY = () => C.Y();
    }
    const a = () => refs.a.Value(), b = () => refs.b.Value();
    const curve = board.create('curve', [t => CX() + a() * Math.cos(t), t => CY() + b() * Math.sin(t), 0, 2 * Math.PI], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    board._eq = () => '\\dfrac{' + sq('x', CX()) + '}{' + fmt(a() * a()) + '} + \\dfrac{' + sq('y', CY()) + '}{' + fmt(b() * b()) + '} = 1';
    if (spec.foci) {
      const cc = () => Math.sqrt(Math.max(a() * a() - b() * b(), 0));
      const F1 = board.create('point', [() => CX() - cc(), CY], { name: 'F₁', color: K.curve2, size: 3, fixed: true });
      const F2 = board.create('point', [() => CX() + cc(), CY], { name: 'F₂', color: K.curve2, size: 3, fixed: true });
      if (spec.sumGlider) {
        const P = board.create('glider', [CX() + a(), CY(), curve], { name: 'P', color: K.pt, size: 4 });
        board.create('segment', [F1, P], { strokeColor: K.curve3, strokeWidth: 2, highlight: false });
        board.create('segment', [F2, P], { strokeColor: K.curve3, strokeWidth: 2, highlight: false });
        readout(board, [() => 'PF₁ + PF₂ = ' + fmt(P.Dist(F1) + P.Dist(F2)) + '  (= 2a = ' + fmt(2 * a()) + ')']);
      }
    }
    if (spec.line) addStudyLine(board, spec.line, null, 'curve', curve);
    if (spec.note) readout(board, spec.note);
  }

  function kHyperbola(board, spec) {
    const refs = addSliders(board, [sdef('a', { min: 1, max: 6, value: spec.a || 3, step: 0.5 }), sdef('b', { min: 1, max: 6, value: spec.b || 2, step: 0.5 })]);
    const cx = spec.center ? spec.center[0] : 0, cy = spec.center ? spec.center[1] : 0;
    let CX = () => cx, CY = () => cy;
    if (spec.center) { const C = board.create('point', [cx, cy], { name: 'O′', color: K.ink, size: 3 }); CX = () => C.X(); CY = () => C.Y(); }
    const a = () => refs.a.Value(), b = () => refs.b.Value();
    const T = 2.6;
    board._eq = () => '\\dfrac{' + sq('x', CX()) + '}{' + fmt(a() * a()) + '} - \\dfrac{' + sq('y', CY()) + '}{' + fmt(b() * b()) + '} = 1';
    board.create('curve', [t => CX() + a() * Math.cosh(t), t => CY() + b() * Math.sinh(t), -T, T], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    board.create('curve', [t => CX() - a() * Math.cosh(t), t => CY() + b() * Math.sinh(t), -T, T], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    if (spec.asymptotes !== false) {
      board.create('line', [[CX(), CY()], [() => CX() + a(), () => CY() + b()]], { strokeColor: K.dash, strokeWidth: 1.5, dash: 2, highlight: false, straightFirst: true, straightLast: true });
      board.create('line', [[CX(), CY()], [() => CX() + a(), () => CY() - b()]], { strokeColor: K.dash, strokeWidth: 1.5, dash: 2, highlight: false, straightFirst: true, straightLast: true });
    }
    if (spec.foci) {
      const cc = () => Math.sqrt(a() * a() + b() * b());
      board.create('point', [() => CX() - cc(), CY], { name: 'F₁', color: K.curve2, size: 3, fixed: true });
      board.create('point', [() => CX() + cc(), CY], { name: 'F₂', color: K.curve2, size: 3, fixed: true });
    }
    if (spec.line) { const f = x => b() * Math.sqrt(Math.max((x - CX()) * (x - CX()) / (a() * a()) - 1, 0)) + CY(); addStudyLine(board, spec.line, null, 'curve'); }
    if (spec.note) readout(board, spec.note);
  }

  /* ===========================================================================
     KIND: homographic  y = (a x + b)/(c x + d), with asymptotes
     =========================================================================== */
  function kHomographic(board, spec) {
    const refs = addSliders(board, ['a', 'b', 'c', 'd'].map(n => sdef(n, { min: -4, max: 4, value: spec[n] != null ? spec[n] : ({ a: 1, b: 2, c: 1, d: -1 })[n], step: 1 })));
    const a = () => refs.a.Value(), b = () => refs.b.Value(), c = () => refs.c.Value(), d = () => refs.d.Value();
    const f = x => (a() * x + b()) / (c() * x + d());
    board._eq = () => 'y = \\dfrac{' + fmtLin(a(), b()) + '}{' + fmtLin(c(), d()) + '}';
    board.create('functiongraph', [f], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    const vx = () => (Math.abs(c()) < 1e-9 ? 1e6 : -d() / c());
    const hy = () => (Math.abs(c()) < 1e-9 ? 1e6 : a() / c());
    board.create('line', [[vx, -1], [vx, 1]], { straightFirst: true, straightLast: true, strokeColor: K.dash, strokeWidth: 1.5, dash: 2, highlight: false });
    board.create('line', [[-1, hy], [1, hy]], { straightFirst: true, straightLast: true, strokeColor: K.dash, strokeWidth: 1.5, dash: 2, highlight: false });
    readout(board, [() => 'asintoti: x = ' + fmt(vx()) + ' , y = ' + fmt(hy())]);
  }

  /* ===========================================================================
     KIND: line  (m,q sliders; draggable 2-point mode; pencil; distance to point)
     =========================================================================== */
  function kLine(board, spec) {
    if (spec.pencil) {
      const fx = spec.pencil[0], fy = spec.pencil[1];
      const F = board.create('point', [fx, fy], { name: 'P₀', color: K.ink, size: 3, fixed: true });
      const ks = board.create('slider', [[-5, 6.2], [-1, 6.2], [-6, 1, 6]], { name: 'm', strokeColor: '#a85a12', fillColor: K.curve, label: { fontSize: 14, cssStyle: 'font-weight:700' } });
      board.create('line', [F, [() => fx + 1, () => fy + ks.Value()]], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
      board._eq = () => { const m = ks.Value(); return 'y ' + (fy >= 0 ? '- ' + fmt(fy) : '+ ' + fmt(-fy)) + ' = ' + fmt(m) + '\\,(x ' + (fx >= 0 ? '- ' + fmt(fx) : '+ ' + fmt(-fx)) + ')'; };
      readout(board, ['Tutte le rette passano per P₀ — muovi m per ruotare']);
      return;
    }
    if (spec.drag) {
      const A = board.create('point', [-3, -2], { name: 'A', color: K.pt, size: 4 });
      const B = board.create('point', [3, 2], { name: 'B', color: K.pt, size: 4 });
      board.create('line', [A, B], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
      board._eq = () => { const m = (B.Y() - A.Y()) / (B.X() - A.X() || 1e-9); return 'y = ' + fmtPoly([[m, 'x'], [A.Y() - m * A.X(), '']]); };
      readout(board, [() => { const m = (B.Y() - A.Y()) / (B.X() - A.X() || 1e-9); return 'm = ' + fmt(m) + '   q = ' + fmt(A.Y() - m * A.X()); }]);
      return;
    }
    const refs = buildSliders(board, spec, ['m', 'q']);
    const m = () => refs.m.Value(), q = () => refs.q.Value();
    const line = board.create('line', [[0, q], [1, () => m() + q()]], { strokeColor: K.curve, strokeWidth: 3, highlight: false });
    board._eq = () => 'y = ' + fmtPoly([[m(), 'x'], [q(), '']]);
    if (spec.distancePoint) {
      const P = board.create('point', spec.distancePoint, { name: 'P', color: K.pt, size: 4 });
      const foot = board.create('orthogonalprojection', [P, line], { name: 'H', color: K.curve2, size: 2 });
      board.create('segment', [P, foot], { strokeColor: K.curve2, strokeWidth: 2, dash: 1, highlight: false });
      readout(board, [() => 'dist(P, r) = ' + fmt(P.Dist(foot))]);
    }
    if (spec.note) readout(board, spec.note);
  }

  /* ===========================================================================
     KIND: unit-circle  (draggable angle; sin/cos/tan segments; arc; readout)
     =========================================================================== */
  function kUnitCircle(board, spec) {
    const show = spec.show || ['sin', 'cos'];
    board.create('circle', [[0, 0], 1], { strokeColor: K.soft, strokeWidth: 2, highlight: false });
    const O = board.create('point', [0, 0], { name: 'O', size: 1, color: K.ink, fixed: true, withLabel: false });
    const circ = board.objectsList.find(o => o.elType === 'circle');
    const P = board.create('glider', [Math.cos(0.9), Math.sin(0.9), circ], { name: 'P', color: K.pt, size: 4 });
    if (spec.snap) {
      const angs = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].map(d => d * Math.PI / 180);
      P.on('up', () => { let th = Math.atan2(P.Y(), P.X()); if (th < 0) th += 2 * Math.PI; let best = angs[0], bd = 9; angs.forEach(a => { const d = Math.min(Math.abs(a - th), 2 * Math.PI - Math.abs(a - th)); if (d < bd) { bd = d; best = a; } }); P.moveTo([Math.cos(best), Math.sin(best)], 150); });
    }
    board.create('segment', [O, P], { strokeColor: K.ink, strokeWidth: 2, highlight: false });
    if (show.includes('arc')) board.create('arc', [O, [0.45, 0, 0], P], { strokeColor: K.curve, strokeWidth: 4, highlight: false, fillColor: K.region, fillOpacity: 0.12 });
    if (show.includes('cos')) board.create('segment', [O, [() => P.X(), 0]], { strokeColor: K.curve2, strokeWidth: 4, highlight: false });
    if (show.includes('sin')) board.create('segment', [[() => P.X(), 0], P], { strokeColor: K.curve, strokeWidth: 4, highlight: false });
    if (show.includes('tan')) {
      board.create('line', [[1, -1], [1, 1]], { straightFirst: true, straightLast: true, strokeColor: K.mut, strokeWidth: 1, dash: 2, highlight: false });
      const T = board.create('point', [1, () => P.Y() / (P.X() || 1e-9)], { name: '', size: 1, color: K.curve3, fixed: true, withLabel: false });
      board.create('segment', [[1, 0], T], { strokeColor: K.curve3, strokeWidth: 4, highlight: false });
    }
    const content = () => {
      let th = Math.atan2(P.Y(), P.X()); if (th < 0) th += 2 * Math.PI;
      const deg = Math.round(th * 180 / Math.PI);
      let s = 'θ = ' + deg + '°  =  ' + fmt(th) + ' rad';
      if (show.includes('sin') || show.includes('cos')) s += '<br>sin = ' + fmt(P.Y()) + '   cos = ' + fmt(P.X());
      if (show.includes('pyth')) s += '<br>sin²+cos² = ' + fmt(P.Y() * P.Y() + P.X() * P.X());
      if (show.includes('tan')) s += '<br>tan = ' + fmt(P.Y() / (P.X() || 1e-9));
      return s;
    };
    board.create('text', [board.getBoundingBox()[0] + 0.15, board.getBoundingBox()[3] + 0.4, content], { fontSize: 14, strokeColor: '#221C14', fixed: true, anchorX: 'left', anchorY: 'bottom', cssStyle: "font-weight:700;background:rgba(255,253,249,.85);padding:5px 9px;border-radius:8px;line-height:1.4;" });
    board._eq = () => {
      let th = Math.atan2(P.Y(), P.X()); if (th < 0) th += 2 * Math.PI;
      const deg = Math.round(th * 180 / Math.PI);
      let s = '\\theta = ' + deg + '^{\\circ} = ' + fmt(th) + '\\,\\text{rad}';
      if (show.includes('sin') || show.includes('cos')) s += ',\\quad \\sin\\theta = ' + fmt(P.Y()) + ',\\ \\cos\\theta = ' + fmt(P.X());
      if (show.includes('tan')) s += ',\\ \\tan\\theta = ' + fmt(P.Y() / (P.X() || 1e-9));
      return s;
    };
  }

  /* ---- shared: a draggable/parameterized study line over a curve ---------- */
  function addStudyLine(board, lspec, f, kind, geomObj, ctr, rFn) {
    const ms = board.create('slider', [[board.getBoundingBox()[0] * 0.9, board.getBoundingBox()[3] * 0.78], [board.getBoundingBox()[0] * 0.35, board.getBoundingBox()[3] * 0.78], [-5, lspec.m != null ? lspec.m : 1, 5]], { name: 'm', strokeColor: '#1f5f7f', fillColor: K.curve2, baseline: { strokeColor: '#cfe0e6' }, highline: { strokeColor: K.curve2 }, label: { fontSize: 13, cssStyle: 'font-weight:700' } });
    const qs = board.create('slider', [[board.getBoundingBox()[0] * 0.9, board.getBoundingBox()[3] * 0.92], [board.getBoundingBox()[0] * 0.35, board.getBoundingBox()[3] * 0.92], [-6, lspec.q != null ? lspec.q : 0, 6]], { name: 'q', strokeColor: '#1f5f7f', fillColor: K.curve2, baseline: { strokeColor: '#cfe0e6' }, highline: { strokeColor: K.curve2 }, label: { fontSize: 13, cssStyle: 'font-weight:700' } });
    const m = () => ms.Value(), q = () => qs.Value();
    board.create('line', [[0, q], [1, () => m() + q()]], { strokeColor: K.curve2, strokeWidth: 2.5, highlight: false });
    if (kind === 'circle' && geomObj && ctr && rFn) {
      readout(board, [() => {
        const d = Math.abs(m() * ctr.X() - ctr.Y() + q()) / Math.sqrt(m() * m() + 1);
        const r = rFn(); return d < r - 0.04 ? 'secante (2 punti)' : d > r + 0.04 ? 'esterna (0 punti)' : 'tangente (1 punto)';
      }]);
    }
  }

  /* ---- dispatch ----------------------------------------------------------- */
  const KINDS = { 'function': kFunction, parabola: kParabola, circle: kCircle, ellipse: kEllipse, hyperbola: kHyperbola, homographic: kHomographic, line: kLine, 'unit-circle': kUnitCircle };
  const DEFBOX = { 'function': [-7, 7, 7, -7], parabola: [-6, 9, 8, -6], circle: [-6, 6, 6, -6], ellipse: [-7, 6, 7, -6], hyperbola: [-7, 6, 7, -6], homographic: [-7, 7, 7, -7], line: [-7, 7, 7, -7], 'unit-circle': [-1.7, 1.9, 2.6, -1.7] };
  const ASPECT = { circle: true, 'unit-circle': true, ellipse: true, hyperbola: true };

  function render(el, spec) {
    if (!el || !window.JXG) return null;
    applyOpts();
    try {
      const box = spec.box || DEFBOX[spec.kind] || [-7, 7, 7, -7];
      const board = makeBoard(el, box, spec.aspect != null ? spec.aspect : ASPECT[spec.kind], spec.board);
      board.suspendUpdate();
      (KINDS[spec.kind] || kFunction)(board, spec);
      board.unsuspendUpdate();

      // live equation panel (liquid glass) just below the graph
      const fEl = document.getElementById(el.id.replace(/^plot-/, 'plotf-'));
      if (fEl && board._eq && window.katex) {
        const wrap = fEl.closest('.plot-formula');
        const draw = () => { try { const tex = board._eq(); if (/NaN|undefined|null/.test(tex)) return; katex.render(tex, fEl, { throwOnError: false, displayMode: false }); if (wrap) wrap.style.display = ''; } catch (e) {} };
        draw();
        board.on('update', draw);
      } else if (fEl) {
        const wrap = fEl.closest('.plot-formula');
        if (wrap) wrap.style.display = 'none';
      }
      return board;
    } catch (e) { console.warn('plot render error', spec, e); el.innerHTML = '<div style="padding:24px;color:#7c715f;font-style:italic">Grafico non disponibile.</div>'; return null; }
  }

  window.FormulaPlot = { whenReady, render, resetView, clearAll };
})();
