/* ============================================================================
   art.js · Ilustraciones del juego, dibujadas con SVG desde código.
   Paleta: rosa (Naroa), rojo (Paulo), oro (la magia), crema y ciruela.
   No hace falta tocar este archivo para cambiar textos ni fechas.
   ========================================================================== */
(function () {
  'use strict';
  var ART = (window.ART = {});
  var N = 0;
  function uid(p) { N += 1; return (p || 'g') + N.toString(36); }
  function r1(n) { return Math.round(n * 10) / 10; }
  ART.uid = uid;

  // Colores del mundo
  var K0 = {
    cream: '#FFF4EC', paper: '#FFFBF7', blush: '#FFD6E5', pink: '#F48FB1', pink2: '#F7AECB', rose: '#E8678C',
    red: '#D9364F', red2: '#C02C45', deep: '#9F263F', wine: '#6E1F3A', plum: '#402435', plum2: '#5B3249',
    gold: '#F5C77E', gold2: '#E9A852', gold3: '#FFE3A6', mauve: '#B9809C', sage: '#9DBF96', sage2: '#7FA67E', leaf: '#6E9A72'
  };
  ART.K = K0;

  function rng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  ART.rng = rng;

  function starPts(cx, cy, R, r, n, rot) {
    n = n || 5; rot = rot == null ? -90 : rot;
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var rad = i % 2 ? r : R;
      var a = (rot + (i * 180) / n) * Math.PI / 180;
      pts.push(r1(cx + rad * Math.cos(a)) + ',' + r1(cy + rad * Math.sin(a)));
    }
    return pts.join(' ');
  }
  ART.starPts = starPts;

  function spark(cx, cy, s) {
    return 'M' + cx + ' ' + (cy - s) + ' Q' + cx + ' ' + cy + ' ' + (cx + s) + ' ' + cy +
      ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + s) + ' Q' + cx + ' ' + cy + ' ' + (cx - s) + ' ' + cy +
      ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - s) + 'Z';
  }
  ART.spark = spark;

  function smooth(pts, from, to) {
    var d = 'M' + pts[from][0] + ' ' + pts[from][1];
    for (var i = from; i < to; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + r1(c1x) + ' ' + r1(c1y) + ' ' + r1(c2x) + ' ' + r1(c2y) + ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }
  function heartPath(cx, cy, s) {
    // corazón de ancho ~2s, punta abajo
    return 'M' + r1(cx) + ' ' + r1(cy + s * 0.9) + ' C' + r1(cx - s * 1.25) + ' ' + r1(cy) + ' ' + r1(cx - s * 0.95) + ' ' + r1(cy - s * 1.05) + ' ' + r1(cx) + ' ' + r1(cy - s * 0.42) +
      ' C' + r1(cx + s * 0.95) + ' ' + r1(cy - s * 1.05) + ' ' + r1(cx + s * 1.25) + ' ' + r1(cy) + ' ' + r1(cx) + ' ' + r1(cy + s * 0.9) + 'Z';
  }
  ART.heartPath = heartPath;
  function catenary(x1, y1, x2, y2, sag) {
    return 'M' + x1 + ' ' + y1 + ' Q' + r1((x1 + x2) / 2) + ' ' + r1((y1 + y2) / 2 + sag * 2) + ' ' + x2 + ' ' + y2;
  }
  function onCat(x1, y1, x2, y2, sag, t) {
    var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag * 2;
    var x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    var y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    return [r1(x), r1(y)];
  }

  // Contorno esponjoso: elipse (girada th radianes) con n bultos de tamaño b
  function fluff(cx, cy, rx, ry, n, b, th, seed) {
    th = th || 0;
    var c = Math.cos(th), s = Math.sin(th);
    var R = rng(seed || (Math.round(cx * 7 + cy * 13 + rx * 3) >>> 0));
    function pt(a, k) {
      var x = (rx + k) * Math.cos(a), y = (ry + k) * Math.sin(a);
      return [r1(cx + x * c - y * s), r1(cy + x * s + y * c)];
    }
    var p0 = pt(0, 0), d = 'M' + p0[0] + ' ' + p0[1];
    for (var i = 1; i <= n; i++) {
      var a = i * 2 * Math.PI / n, am = (i - 0.5) * 2 * Math.PI / n;
      var q = pt(am + (R() - 0.5) * 0.16, b * (1.5 + R() * 1.1)), p = pt(a, i === n ? 0 : (R() - 0.5) * b * 0.5);
      d += ' Q' + q[0] + ' ' + q[1] + ' ' + p[0] + ' ' + p[1];
    }
    return d + 'Z';
  }
  ART.fluff = fluff;

  /* ---------- Piezas pequeñas reutilizables ---------- */
  function cloud(x, y, s, fill, shade) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="2" cy="11" rx="44" ry="8" fill="' + shade + '" opacity=".5"/>' +
      '<circle cx="-22" cy="1" r="15" fill="' + fill + '"/>' +
      '<circle cx="0" cy="-9" r="21" fill="' + fill + '"/>' +
      '<circle cx="23" cy="-1" r="16" fill="' + fill + '"/>' +
      '<rect x="-38" y="-1" width="78" height="14" rx="7" fill="' + fill + '"/>' +
      '<circle cx="-6" cy="-15" r="7" fill="#fff" opacity=".55"/>' +
      '</g>';
  }
  ART.cloud = cloud;

  // Árbol en flor del bosque rosa
  var BLOSSOM = [
    { trunk: '#7A4552', dark: '#E06D97', mid: '#F291B5', light: '#FFC9DC' },
    { trunk: '#744050', dark: '#D45380', mid: '#EC7BA3', light: '#FFB6CF' },
    { trunk: '#7E4A55', dark: '#EE9AAE', mid: '#F8B9C8', light: '#FFE1EA' }
  ];
  function blossomTree(x, y, s, v) {
    var pal = BLOSSOM[v || 0];
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="1" rx="20" ry="3.8" fill="#3A1E30" opacity=".12"/>' +
      '<path d="M-5 0 Q-3.6 -20 -2.6 -34 L3 -34 Q4.2 -20 5.4 0Z" fill="' + pal.trunk + '"/>' +
      '<path d="M-1.4 -22 Q-9 -28 -15 -37 M1.6 -27 Q9 -31 13 -40" stroke="' + pal.trunk + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
      '<path d="' + fluff(-15, -45, 14, 11, 9, 1.6, 0, 3) + '" fill="' + pal.dark + '"/>' +
      '<path d="' + fluff(15, -47, 15, 12, 9, 1.6, 0, 5) + '" fill="' + pal.dark + '"/>' +
      '<path d="' + fluff(0, -58, 19, 15, 11, 1.8, 0, 7) + '" fill="' + pal.mid + '"/>' +
      '<path d="' + fluff(-11, -50, 11, 9, 8, 1.4, 0, 11) + '" fill="' + pal.mid + '"/>' +
      '<path d="' + fluff(12, -51, 11, 9, 8, 1.4, 0, 13) + '" fill="' + pal.mid + '"/>' +
      '<ellipse cx="-6" cy="-66" rx="8" ry="5.4" fill="' + pal.light + '" opacity=".9"/>' +
      '<circle cx="-15" cy="-52" r="3.6" fill="' + pal.light + '" opacity=".7"/>' +
      '<circle cx="10" cy="-62" r="2.6" fill="' + pal.light + '" opacity=".75"/>' +
      '<circle cx="6" cy="-45" r="1.8" fill="#fff" opacity=".7"/><circle cx="-20" cy="-42" r="1.5" fill="#fff" opacity=".6"/>' +
      '</g>';
  }
  ART.blossomTree = blossomTree;

  // Rosal
  function roseBush(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="0" rx="26" ry="4.5" fill="#3A1E30" opacity=".09"/>' +
      '<path d="' + fluff(-12, -9, 12, 9, 8, 1.4, 0, 21) + '" fill="#6E9A72"/>' +
      '<path d="' + fluff(12, -9, 13, 9, 8, 1.4, 0, 23) + '" fill="#6E9A72"/>' +
      '<path d="' + fluff(0, -15, 14, 10, 9, 1.5, 0, 25) + '" fill="#86AE85"/>' +
      '<circle cx="-12" cy="-12" r="3.6" fill="#D9364F"/><circle cx="-12" cy="-12" r="1.6" fill="#F48FB1"/>' +
      '<circle cx="4" cy="-21" r="3.4" fill="#F48FB1"/><circle cx="4" cy="-21" r="1.4" fill="#FFD6E5"/>' +
      '<circle cx="15" cy="-10" r="3.4" fill="#D9364F"/><circle cx="15" cy="-10" r="1.5" fill="#F48FB1"/>' +
      '<circle cx="-3" cy="-9" r="2.6" fill="#FFD6E5"/>' +
      '<circle cx="-6" cy="-20" r="2.2" fill="#B9DDB4" opacity=".6"/>' +
      '</g>';
  }
  ART.roseBush = roseBush;

  function flower(x, y, s, petal, center) {
    var p = '';
    for (var i = 0; i < 5; i++) {
      var a = (i * 72 - 90) * Math.PI / 180;
      p += '<circle cx="' + r1(Math.cos(a) * 3.1) + '" cy="' + r1(Math.sin(a) * 3.1) + '" r="2.5" fill="' + petal + '"/>';
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + p + '<circle r="1.8" fill="' + center + '"/></g>';
  }
  ART.flower = flower;
  function yflower(x, y, s) { return flower(x, y, s, '#FFD25E', '#F29A2E'); }

  // Flor amarilla grande (8 pétalos) con tallo opcional
  function bigFlower(x, y, s, stem) {
    var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">';
    if (stem) g += '<path d="M0 6 Q2 18 0 30" stroke="#6E9A72" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M1 20 Q9 15 12 19 Q6 24 1 22Z" fill="#86AE85"/>';
    for (var i = 0; i < 8; i++) g += '<ellipse cx="0" cy="-7" rx="3.6" ry="6.6" fill="#FFD25E" stroke="#F2B12F" stroke-width=".7" transform="rotate(' + (i * 45) + ')"/>';
    return g + '<circle r="4.4" fill="#F29A2E"/><circle cx="-1.2" cy="-1.3" r="1.5" fill="#FFE7A0"/></g>';
  }
  ART.bigFlower = bigFlower;

  function tulip(x, y, s, color, dark) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M0 0 Q1 -8 0 -14" stroke="#6E9A72" stroke-width="1.6" fill="none"/>' +
      '<path d="M0 -4 Q-5 -7 -6 -12 Q-2 -9 0 -6" fill="#86AE85"/>' +
      '<path d="M-4 -14 Q-4.6 -20 -2.6 -21.4 L0 -18 L2.6 -21.4 Q4.6 -20 4 -14 Q0 -11 -4 -14Z" fill="' + color + '"/>' +
      '<path d="M0 -18 L0 -12.6" stroke="' + dark + '" stroke-width=".9" opacity=".55"/>' +
      '</g>';
  }
  function tuft(x, y, s, c) {
    return '<path d="M' + r1(x - 4 * s) + ' ' + y + ' Q' + r1(x - 3 * s) + ' ' + r1(y - 6 * s) + ' ' + r1(x - 5.5 * s) + ' ' + r1(y - 9 * s) +
      ' M' + x + ' ' + y + ' Q' + x + ' ' + r1(y - 7 * s) + ' ' + r1(x + s) + ' ' + r1(y - 11 * s) +
      ' M' + r1(x + 4 * s) + ' ' + y + ' Q' + r1(x + 3 * s) + ' ' + r1(y - 6 * s) + ' ' + r1(x + 6 * s) + ' ' + r1(y - 8 * s) +
      '" stroke="' + c + '" stroke-width="' + r1(1.4 * s) + '" fill="none" stroke-linecap="round"/>';
  }
  function reeds(x, y, s) {
    var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">';
    [[-8, -26, -2], [-3, -34, 1], [3, -30, 3], [8, -22, 5]].forEach(function (q) {
      g += '<path d="M' + q[0] + ' 0 Q' + (q[0] + q[2] * 0.5) + ' ' + (q[1] / 2) + ' ' + (q[0] + q[2]) + ' ' + q[1] + '" stroke="#86AE85" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    });
    g += '<rect x="-1.6" y="-38" width="3.6" height="9" rx="1.8" fill="#8C4A5A"/><rect x="4.6" y="-33" width="3.2" height="8" rx="1.6" fill="#8C4A5A"/>';
    return g + '</g>';
  }
  // Seta del bosque encantado (con brillo suave)
  function mushroom(x, y, s, cap, glow) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      (glow ? '<circle class="shroom-glow" cx="0" cy="-8" r="15" fill="url(#' + glow + ')"/>' : '') +
      '<ellipse cx="0" cy="0" rx="9" ry="2" fill="#3A1E30" opacity=".12"/>' +
      '<path d="M-3 0 Q-3.6 -6 -2.4 -8 L2.4 -8 Q3.6 -6 3 0Z" fill="#FFF1E6"/>' +
      '<path d="M-10 -7.4 Q-9 -17 0 -17.6 Q9 -17 10 -7.4 Q0 -5 -10 -7.4Z" fill="' + cap + '"/>' +
      '<circle cx="-4.4" cy="-12.4" r="1.6" fill="#FFF4EC"/><circle cx="2.6" cy="-14.6" r="1.3" fill="#FFF4EC"/><circle cx="5.6" cy="-10.2" r="1.1" fill="#FFF4EC"/>' +
      '</g>';
  }
  function lamppost(x, y, h, cls) {
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<rect x="-2" y="' + (-h) + '" width="4" height="' + h + '" rx="2" fill="#5B3249"/>' +
      '<rect x="-5" y="-6" width="10" height="6" rx="2" fill="#5B3249"/>' +
      '<circle class="' + (cls || '') + ' lamp-glow" cx="0" cy="' + (-h - 8) + '" r="16" fill="url(#mpglow)" opacity="0"/>' +
      '<path d="M-7 ' + (-h - 1) + ' h14 l-3 -12 h-8z" fill="#5B3249"/>' +
      '<path class="' + (cls || '') + ' lamp-glass" d="M-4.6 ' + (-h - 2.4) + ' h9.2 l-2.2 -8.4 h-4.8z" fill="#B98AA0"/>' +
      '<path d="M-5 ' + (-h - 13) + ' q5 -5 10 0z" fill="#4A2A3D"/>' +
      '</g>';
  }
  function bunting(x1, y1, x2, y2, sag, n, cls, glow) {
    var cols = ['#F48FB1', '#F5C77E', '#D9364F', '#FFD6E5', '#E8678C'];
    var s = '<path d="' + catenary(x1, y1, x2, y2, sag) + '" stroke="#8E5A6E" stroke-width="1.2" fill="none"/>';
    for (var i = 1; i < n; i++) {
      var t = i / n, q = onCat(x1, y1, x2, y2, sag, t);
      if (i % 2) s += '<path d="M' + r1(q[0] - 5) + ' ' + q[1] + ' L' + r1(q[0] + 5) + ' ' + q[1] + ' L' + q[0] + ' ' + r1(q[1] + 9) + 'Z" fill="' + cols[(i >> 1) % cols.length] + '"/>';
      else s += '<circle class="' + cls + '" cx="' + q[0] + '" cy="' + r1(q[1] + 2) + '" r="2.2" fill="#EBD7DC"/>' + (glow ? '<circle class="' + cls + '-halo" cx="' + q[0] + '" cy="' + r1(q[1] + 2) + '" r="7" fill="url(#' + glow + ')"/>' : '');
    }
    return s;
  }
  function windowRect(x, y, w, h, cls, curtain) {
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(4, w / 5) + '" fill="#FFF8F1"/>' +
      '<rect class="' + (cls || '') + '" x="' + (x + 2.5) + '" y="' + (y + 2.5) + '" width="' + (w - 5) + '" height="' + (h - 5) + '" rx="' + Math.min(3, w / 6) + '" fill="#9C5A78"/>' +
      '<path d="M' + r1(x + w / 2) + ' ' + (y + 2.5) + ' V' + (y + h - 2.5) + ' M' + (x + 2.5) + ' ' + r1(y + h / 2) + ' H' + (x + w - 2.5) + '" stroke="#FFF8F1" stroke-width="1.6"/>';
    if (curtain) s += '<path d="M' + (x + 2.5) + ' ' + (y + 2.5) + ' h' + r1(w * 0.28) + ' q-' + r1(w * 0.18) + ' ' + r1(h * 0.4) + ' -' + r1(w * 0.28) + ' ' + r1(h * 0.62) + 'z" fill="' + curtain + '"/>' +
      '<path d="M' + (x + w - 2.5) + ' ' + (y + 2.5) + ' h-' + r1(w * 0.28) + ' q' + r1(w * 0.18) + ' ' + r1(h * 0.4) + ' ' + r1(w * 0.28) + ' ' + r1(h * 0.62) + 'z" fill="' + curtain + '"/>';
    return s;
  }
  // Faro rojo y rosa (base en x, y; alto h). glass/beam: clases opcionales
  function lighthouse(x, y, h, o) {
    o = o || {};
    var wb = h * 0.2, wt = h * 0.13, top = y - h;
    var s = '<g transform="translate(' + x + ' 0)">';
    if (o.beam) s += '<g class="lh-beam ' + o.beam + '"><path d="M0 ' + r1(top - h * 0.12) + ' L' + r1(-h * 2.6) + ' ' + r1(top - h * 0.5) + ' L' + r1(-h * 2.6) + ' ' + r1(top + h * 0.22) + 'Z" fill="url(#' + o.beamGrad + ')"/></g>';
    // torre
    s += '<path d="M' + r1(-wb) + ' ' + y + ' L' + r1(-wt) + ' ' + r1(top) + ' L' + r1(wt) + ' ' + r1(top) + ' L' + r1(wb) + ' ' + y + 'Z" fill="#FFF1EC"/>';
    for (var k = 0; k < 3; k++) {
      var y0 = y - h * (0.08 + k * 0.31), y1 = y0 - h * 0.15;
      var w0 = wb - (wb - wt) * ((y - y0) / h), w1 = wb - (wb - wt) * ((y - y1) / h);
      s += '<path d="M' + r1(-w0) + ' ' + r1(y0) + ' L' + r1(-w1) + ' ' + r1(y1) + ' L' + r1(w1) + ' ' + r1(y1) + ' L' + r1(w0) + ' ' + r1(y0) + 'Z" fill="#D9364F"/>';
    }
    s += '<path d="M' + r1(wb * 0.35) + ' ' + y + ' L' + r1(wt * 0.4) + ' ' + r1(top) + ' L' + r1(wt) + ' ' + r1(top) + ' L' + r1(wb) + ' ' + y + 'Z" fill="#9F263F" opacity=".22"/>';
    s += '<rect x="' + r1(-wb * 0.28) + '" y="' + r1(y - h * 0.18) + '" width="' + r1(wb * 0.56) + '" height="' + r1(h * 0.18) + '" rx="' + r1(wb * 0.28) + '" fill="#6E1F3A"/>';
    s += '<rect x="' + r1(-wt * 0.25) + '" y="' + r1(y - h * 0.62) + '" width="' + r1(wt * 0.5) + '" height="' + r1(h * 0.08) + '" rx="1" fill="#6E1F3A" opacity=".8"/>';
    // galería, linterna y cúpula
    s += '<rect x="' + r1(-wt * 1.45) + '" y="' + r1(top - 2) + '" width="' + r1(wt * 2.9) + '" height="3.4" rx="1.4" fill="#5B3249"/>';
    s += '<rect class="' + (o.glass || '') + '" x="' + r1(-wt * 0.8) + '" y="' + r1(top - h * 0.17) + '" width="' + r1(wt * 1.6) + '" height="' + r1(h * 0.15) + '" rx="1.6" fill="' + (o.lit ? '#FFE3A6' : '#B98AA0') + '"/>';
    s += '<path d="M' + r1(-wt * 0.8) + ' ' + r1(top - h * 0.1) + ' h' + r1(wt * 1.6) + '" stroke="#5B3249" stroke-width="1"/>';
    s += '<path d="M' + r1(-wt * 1.1) + ' ' + r1(top - h * 0.17) + ' Q0 ' + r1(top - h * 0.34) + ' ' + r1(wt * 1.1) + ' ' + r1(top - h * 0.17) + 'Z" fill="#9F263F"/>';
    s += '<circle cx="0" cy="' + r1(top - h * 0.31) + '" r="1.8" fill="#F5C77E"/>';
    return s + '</g>';
  }
  ART.lighthouse = lighthouse;

  /* ---------- Pom, el pomerania que la acompaña ---------- */
  function petColors() {
    var c = (window.AVENTURA && window.AVENTURA.companero && window.AVENTURA.companero.colores) || {};
    return { pelo: c.pelo || '#EE8E43', claro: c.claro || '#FFE7C9', sombra: c.sombra || '#C9692D', brillo: c.brillo || '#F7B46F', lazo: c.lazo || '#F48FB1' };
  }
  ART.petColors = petColors;
  var INK = '#2E1A26';
  function pomHead(K, stat) {
    var s = '';
    // orejitas puntiagudas (detrás de la melena)
    s += '<g class="pet__ear pet__ear--l"><path d="M35.5 40 L38.2 22.6 Q39.6 19.6 42.2 21.6 L53.5 33Z" fill="' + K.pelo + '"/><path d="M39.6 35.4 L40.6 25.8 L48.2 33.2Z" fill="#F7B3B8"/></g>';
    s += '<g class="pet__ear pet__ear--r"><path d="M84.5 40 L81.8 22.6 Q80.4 19.6 77.8 21.6 L66.5 33Z" fill="' + K.pelo + '"/><path d="M80.4 35.4 L79.4 25.8 L71.8 33.2Z" fill="#F7B3B8"/></g>';
    // melena: sombra, pelo y brillo
    s += '<path d="' + fluff(60, 61, 31, 26.5, 18, 2.6) + '" fill="' + K.sombra + '"/>';
    s += '<path d="' + fluff(60, 56.5, 31, 28, 20, 2.8) + '" fill="' + K.pelo + '"/>';
    s += '<ellipse cx="66" cy="37" rx="9" ry="4.6" fill="' + K.brillo + '" opacity=".55"/>';
    // carita clara
    s += '<path d="' + fluff(60, 64.5, 21.5, 15.5, 14, 2.1) + '" fill="' + K.claro + '"/>';
    s += '<ellipse cx="60" cy="47" rx="5.2" ry="8" fill="' + K.claro + '" opacity=".55"/>';
    // coloretes
    s += '<ellipse cx="41.2" cy="64.2" rx="4.8" ry="2.9" fill="#F48FB1" opacity=".5"/><ellipse cx="78.8" cy="64.2" rx="4.8" ry="2.9" fill="#F48FB1" opacity=".5"/>';
    // ojos grandes y oscuros
    s += '<g class="pet__eyes e-open">' +
      '<ellipse cx="48.4" cy="54.6" rx="6" ry="6.6" fill="' + INK + '"/><ellipse cx="71.6" cy="54.6" rx="6" ry="6.6" fill="' + INK + '"/>' +
      '<circle cx="50.6" cy="52" r="2.3" fill="#fff"/><circle cx="73.8" cy="52" r="2.3" fill="#fff"/>' +
      '<circle cx="46.8" cy="57.4" r="1.05" fill="#fff" opacity=".85"/><circle cx="70" cy="57.4" r="1.05" fill="#fff" opacity=".85"/></g>';
    if (!stat) {
      s += '<g class="e-joy" fill="none" stroke="' + INK + '" stroke-width="3.1" stroke-linecap="round"><path d="M42.6 56 Q48.4 49.4 54.2 56"/><path d="M65.8 56 Q71.6 49.4 77.4 56"/></g>' +
        '<g class="e-sleep" fill="none" stroke="' + INK + '" stroke-width="2.8" stroke-linecap="round"><path d="M42.8 55 Q48.4 59.6 54 55"/><path d="M66 55 Q71.6 59.6 77.2 55"/></g>';
    }
    // hocico, nariz y boca
    s += '<ellipse cx="60" cy="66.4" rx="8.6" ry="6.4" fill="#FFF6EA"/>';
    s += '<g class="pet__nose"><path d="M55.6 61.4 Q60 59.6 64.4 61.4 Q64.2 64.8 60 66.2 Q55.8 64.8 55.6 61.4Z" fill="' + INK + '"/><ellipse cx="58.4" cy="61.7" rx="1.6" ry=".8" fill="#fff" opacity=".7"/></g>';
    s += '<path class="m-smile" d="M60 66.2 V67.8 M55.8 68 Q57.9 70.6 60 68 Q62.1 70.6 64.2 68" fill="none" stroke="' + INK + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>';
    if (!stat) {
      s += '<g class="m-joy"><path d="M55 67.4 Q60 77.6 65 67.4 Q60 69.2 55 67.4Z" fill="#8E2A44"/><path d="M57.2 71.4 Q60 77 62.8 71.4 Q60 70.2 57.2 71.4Z" fill="#F48FB1"/><path d="M60 66.2 V68" stroke="' + INK + '" stroke-width="1.9" stroke-linecap="round"/></g>' +
        '<g class="m-wow"><path d="M60 66.2 V67.6" stroke="' + INK + '" stroke-width="1.9" stroke-linecap="round"/><ellipse cx="60" cy="70.4" rx="2.5" ry="3" fill="' + INK + '"/></g>';
    }
    // lazo rosa
    s += '<g class="pet__bow"><g transform="translate(44.5 30.5) rotate(-24)">' +
      '<path d="M0 0 Q-9.5 -8.4 -11.4 -1.6 Q-12 5.6 0 0Z" fill="' + K.lazo + '"/><path d="M0 0 Q9.5 -8.4 11.4 -1.6 Q12 5.6 0 0Z" fill="' + K.lazo + '"/>' +
      '<path d="M-2 .6 Q-6 -2.6 -8.6 -1.2 M2 .6 Q6 -2.6 8.6 -1.2" stroke="#D9567F" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M-1.4 1.2 L-4.4 7.4 L-1.6 6.6 L0 8.8Z M1.4 1.2 L4.4 7.4 L1.6 6.6 L0 8.8Z" fill="#E8709A"/>' +
      '<circle r="2.7" fill="#E8709A"/><circle cx="-.8" cy="-.8" r=".9" fill="#FFD6E5"/></g></g>';
    return s;
  }
  ART.pomHead = function (stat) { return pomHead(petColors(), stat); };

  ART.pet = function (expr, stat) {
    var K = petColors(), id = uid('pt');
    var s = '';
    if (!stat) s += '<defs><radialGradient id="' + id + 'h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE9C8" stop-opacity=".85"/><stop offset=".6" stop-color="#FFD0D8" stop-opacity=".25"/><stop offset="1" stop-color="#FFD0D8" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="pet__halo" cx="60" cy="66" r="56" fill="url(#' + id + 'h)"/>';
    s += '<ellipse class="pet__shadow" cx="60" cy="114.5" rx="29" ry="4.4" fill="#3A1E30" opacity=".14"/>';
    s += '<g class="pet__all">';
    // cola: penacho sobre el lomo
    s += '<g class="pet__tail"><path d="' + fluff(87.5, 71, 22, 14.5, 15, 3, -1.05, 5) + '" fill="' + K.sombra + '"/>' +
      '<path d="' + fluff(86.5, 69.5, 20.5, 13, 15, 2.8, -1.05, 9) + '" fill="' + K.pelo + '"/>' +
      '<path d="' + fluff(88.5, 66, 12, 7, 11, 1.9, -1.05, 3) + '" fill="' + K.brillo + '"/>' +
      '<path d="M84 84 q4 -8 9 -12 M88 86 q5 -7 10 -9" stroke="' + K.sombra + '" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/></g>';
    // patitas de atrás
    s += '<ellipse class="pet__paw pet__paw--bl" cx="40" cy="108.4" rx="7" ry="5" fill="' + K.sombra + '"/>' +
      '<ellipse class="pet__paw pet__paw--br" cx="80" cy="108.4" rx="7" ry="5" fill="' + K.sombra + '"/>';
    // cuerpo de bola de algodón
    s += '<g class="pet__body"><path d="' + fluff(60, 93, 27, 18.5, 18, 2.4) + '" fill="' + K.pelo + '"/>' +
      '<path d="' + fluff(60, 91.5, 15.5, 13.5, 12, 2) + '" fill="' + K.claro + '"/>' +
      '<path d="M54 90 q2 3 1 6 M60 92 q1.6 3 .4 6 M66 90 q-2 3 -1 6" stroke="#EBC59E" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".9"/></g>';
    // patitas de delante
    s += '<g class="pet__paw pet__paw--fl"><ellipse cx="50" cy="109.2" rx="7" ry="5.2" fill="' + K.claro + '"/><path d="M48 107.6 v3 M52 107.6 v3" stroke="#E2B892" stroke-width="1.1" stroke-linecap="round"/></g>' +
      '<g class="pet__paw pet__paw--fr"><ellipse cx="70" cy="109.2" rx="7" ry="5.2" fill="' + K.claro + '"/><path d="M68 107.6 v3 M72 107.6 v3" stroke="#E2B892" stroke-width="1.1" stroke-linecap="round"/></g>';
    s += '<g class="pet__head">' + pomHead(K, stat) + '</g>';
    s += '</g>';
    if (!stat) s += '<path class="e-sleep pet__zz" d="M92 16 h7 l-7 8 h7" stroke="#B0436C" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    if (stat) return '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120">' + s + '</svg>';
    return '<svg class="pet" data-expr="' + (expr || 'happy') + '" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' + s + '</svg>';
  };

  /* ---------- Sprite con iconos, objetos e ilustraciones pequeñas ---------- */
  // Iconos de los cuatro lugares (para el pase): plaza/maleta, tiendita, casita y puerta
  var PLACE_PATHS = [
    '<rect x="3.5" y="8" width="17" height="12" rx="2.6"/><path d="M9 8V6.2a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6.2V8M8 8v12M16 8v12"/>',
    '<path d="M5 10.4v9.1h14v-9.1"/><path d="M3.6 9.8 5.2 4.6h13.6l1.6 5.2q-2.1 2.4-4.2 0-2.1 2.4-4.2 0-2.1 2.4-4.2 0-2.1 2.4-4.2 0z"/><path d="M10 19.5v-4.8h4v4.8"/>',
    '<path d="M3.8 11.6 12 4.8l8.2 6.8"/><path d="M6 10v9.5h12V10"/><path d="M12 17.4s-2.8-1.7-2.8-3.6a1.5 1.5 0 0 1 2.8-.8 1.5 1.5 0 0 1 2.8.8c0 1.9-2.8 3.6-2.8 3.6z"/>',
    '<path d="M6 20.5V10a6 6 0 0 1 12 0v10.5"/><path d="M4 20.5h16"/><circle cx="14.6" cy="15" r=".9"/>'
  ];
  ART.placeIcon = function (i, color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><g fill="none" stroke="' + (color || '#D9364F') + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + PLACE_PATHS[i] + '</g></svg>';
  };

  ART.sprite = function () {
    var gear = (function () {
      var p = [];
      for (var i = 0; i < 8; i++) {
        var a = i * 45;
        [[a - 16, 7.4], [a - 8.5, 10.4], [a + 8.5, 10.4], [a + 16, 7.4]].forEach(function (q) {
          var t = q[0] * Math.PI / 180;
          p.push(r1(12 + q[1] * Math.cos(t)) + ' ' + r1(12 + q[1] * Math.sin(t)));
        });
      }
      return 'M' + p.join(' L') + 'Z';
    })();
    var st = ' fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    var K = petColors();
    function petals8(cx, cy, rx, ry, d, col, edge) {
      var s = '';
      for (var i = 0; i < 8; i++) s += '<ellipse cx="' + cx + '" cy="' + (cy - d) + '" rx="' + rx + '" ry="' + ry + '" fill="' + col + '"' + (edge ? ' stroke="' + edge + '" stroke-width=".8"' : '') + ' transform="rotate(' + (i * 45) + ' ' + cx + ' ' + cy + ')"/>';
      return s;
    }
    function popcorn(list) {
      return list.map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="#FFF6DA"/><circle cx="' + (q[0] + q[2] * 0.3) + '" cy="' + (q[1] + q[2] * 0.3) + '" r="' + r1(q[2] * 0.45) + '" fill="#FFE29A"/>'; }).join('');
    }
    return '<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' +
      /* Iconos de interfaz */
      '<symbol id="i-back" viewBox="0 0 24 24"><path d="M14.5 5.5 8 12l6.5 6.5"' + st + ' stroke-width="2.8"/></symbol>' +
      '<symbol id="i-gear" viewBox="0 0 24 24"><path d="' + gear + '"' + st + ' stroke-width="2"/><circle cx="12" cy="12" r="3.2"' + st + ' stroke-width="2"/></symbol>' +
      '<symbol id="i-bag" viewBox="0 0 24 24"><path d="M4 11.2h16v7.3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"' + st + ' stroke-width="2.2"/><path d="M4 11.2V9.6C4 6.5 7.6 4.5 12 4.5s8 2 8 5.1v1.6"' + st + ' stroke-width="2.2"/><rect x="10.2" y="9.6" width="3.6" height="4.4" rx="1.1" fill="currentColor"/></symbol>' +
      '<symbol id="i-help" viewBox="0 0 24 24"><path d="M9.2 9.3a2.9 2.9 0 1 1 4.1 2.6c-.9.4-1.3 1-1.3 2v.5"' + st + ' stroke-width="2.6"/><circle cx="12" cy="18" r="1.4" fill="currentColor"/></symbol>' +
      '<symbol id="i-bulb" viewBox="0 0 24 24"><path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.9l10-6.4a1 1 0 0 0 0-1.8l-10-6.4A1 1 0 0 0 8 5.6z" fill="currentColor"/></symbol>' +
      '<symbol id="i-pause" viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.4" fill="currentColor"/></symbol>' +
      '<symbol id="i-replay" viewBox="0 0 24 24"><path d="M4.8 12a7.2 7.2 0 1 0 2.1-5.1"' + st + '/><path d="M6.6 3.4v3.8h3.8"' + st + '/></symbol>' +
      '<symbol id="i-close" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"' + st + ' stroke-width="2.8"/></symbol>' +
      '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="10" rx="2.6" fill="currentColor"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"' + st + ' stroke-width="2.6"/></symbol>' +
      '<symbol id="i-check" viewBox="0 0 24 24"><path d="M5.5 12.5l4.2 4.2 8.8-9.4"' + st + ' stroke-width="3"/></symbol>' +
      '<symbol id="i-star" viewBox="0 0 24 24"><polygon points="' + starPts(12, 12.8, 9.6, 4.4) + '" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></symbol>' +
      '<symbol id="i-sound" viewBox="0 0 24 24"><path d="M4.5 9.5h3l4.5-3.8v12.6L7.5 14.5h-3z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M17.8 6.6a7.4 7.4 0 0 1 0 10.8"' + st + '/></symbol>' +
      '<symbol id="i-music" viewBox="0 0 24 24"><path d="M9.5 17.5V6.2l9-1.8v11"' + st + '/><circle cx="7.4" cy="17.6" r="2.4" fill="currentColor"/><circle cx="16.4" cy="15.6" r="2.4" fill="currentColor"/></symbol>' +
      '<symbol id="i-motion" viewBox="0 0 24 24"><path d="M4 12c2.6-4 5.4-4 8 0s5.4 4 8 0"' + st + '/><path d="M4 17c2.6-2.4 5.4-2.4 8 0s5.4 2.4 8 0" ' + st + ' opacity=".5"/></symbol>' +
      '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l.8 12a2 2 0 0 0 2 1.8h4.4a2 2 0 0 0 2-1.8L17 7"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-share" viewBox="0 0 24 24"><path d="M12 15V4M8 7.5 12 3.6l4 3.9"' + st + '/><path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"' + st + '/></symbol>' +
      '<symbol id="i-save" viewBox="0 0 24 24"><path d="M12 4v11M7.6 10.8 12 15.2l4.4-4.4"' + st + '/><path d="M5 19.5h14"' + st + '/></symbol>' +
      '<symbol id="i-note" viewBox="0 0 24 24"><path d="M6 4.5h9l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z"' + st + ' stroke-width="2.2"/><path d="M8.5 11h7M8.5 14.5h5"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-sparkle" viewBox="0 0 24 24"><path d="' + spark(12, 12, 9) + '" fill="currentColor"/><path d="' + spark(19, 5, 3) + '" fill="currentColor"/></symbol>' +
      '<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/></symbol>' +
      '<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.8 12S6.2 5.8 12 5.8 21.2 12 21.2 12 17.8 18.2 12 18.2 2.8 12 2.8 12z"' + st + ' stroke-width="2.2"/><circle cx="12" cy="12" r="2.8" fill="currentColor"/></symbol>' +
      '<symbol id="i-puzzle" viewBox="0 0 24 24"><path d="M5 9h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v3H5v-3a2 2 0 1 0 0-4z"' + st + ' stroke-width="2.1"/></symbol>' +
      '<symbol id="i-cards" viewBox="0 0 24 24"><rect x="3.5" y="6" width="10" height="13" rx="2" transform="rotate(-10 8.5 12.5)"' + st + ' stroke-width="2.1"/><rect x="10.5" y="5" width="10" height="13" rx="2" transform="rotate(8 15.5 11.5)"' + st + ' stroke-width="2.1"/></symbol>' +
      '<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"' + st + '/><path d="M15 15l4.5 4.5"' + st + ' stroke-width="2.8"/></symbol>' +
      '<symbol id="i-tile" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3.5"' + st + ' stroke-width="2.1"/><path d="M4 12h5a3 3 0 0 0 3-3V4"' + st + ' stroke-width="2.1"/></symbol>' +
      '<symbol id="i-chat" viewBox="0 0 24 24"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"' + st + ' stroke-width="2.1"/></symbol>' +
      '<symbol id="i-suitcase" viewBox="0 0 24 24"><rect x="3.5" y="8" width="17" height="12" rx="2.6"' + st + ' stroke-width="2.2"/><path d="M9 8V6.2a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6.2V8M8 8v12M16 8v12"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-basket" viewBox="0 0 24 24"><path d="M3.5 10.5h17l-1.8 8.4a1.6 1.6 0 0 1-1.6 1.3H6.9a1.6 1.6 0 0 1-1.6-1.3z"' + st + ' stroke-width="2.2"/><path d="M8 10.5l3-6M16 10.5l-3-6M9.5 14v3M14.5 14v3"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-sofa" viewBox="0 0 24 24"><path d="M5.5 11V8.6A2.6 2.6 0 0 1 8.1 6h7.8a2.6 2.6 0 0 1 2.6 2.6V11"' + st + ' stroke-width="2.2"/><path d="M3.5 12.6a1.6 1.6 0 0 1 3.2 0V14h10.6v-1.4a1.6 1.6 0 0 1 3.2 0V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"' + st + ' stroke-width="2.2"/><path d="M6 19v1.5M18 19v1.5"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13.4 3 6 13.6h5.2L10.2 21 18 10.2h-5.2z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></symbol>' +
      '<symbol id="i-moon" viewBox="0 0 24 24"><path d="M19.5 14.6A7.6 7.6 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1z" fill="currentColor"/></symbol>' +
      '<symbol id="i-letter" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12.5" rx="2.2"' + st + ' stroke-width="2.2"/><path d="M4.2 7.2 12 13l7.8-5.8"' + st + ' stroke-width="2.2"/></symbol>' +
      '<symbol id="i-flower" viewBox="0 0 24 24">' + (function () { var s = ''; for (var i = 0; i < 6; i++) s += '<ellipse cx="12" cy="6.6" rx="3.2" ry="4.6" fill="currentColor" transform="rotate(' + (i * 60) + ' 12 12)"/>'; return s; })() + '<circle cx="12" cy="12" r="3.4" fill="#fff" opacity=".85"/></symbol>' +
      '<symbol id="i-paw" viewBox="0 0 24 24"><ellipse cx="12" cy="15.6" rx="5.2" ry="4.4" fill="currentColor"/><ellipse cx="6" cy="10.4" rx="2.2" ry="2.8" fill="currentColor"/><ellipse cx="9.6" cy="6.6" rx="2.2" ry="2.9" fill="currentColor"/><ellipse cx="14.4" cy="6.6" rx="2.2" ry="2.9" fill="currentColor"/><ellipse cx="18" cy="10.4" rx="2.2" ry="2.8" fill="currentColor"/></symbol>' +
      '<symbol id="i-ticket" viewBox="0 0 24 24"><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"' + st + ' stroke-width="2.1"/><path d="M14.5 6.5v11" ' + st + ' stroke-width="1.8" stroke-dasharray="1.6 2.2"/><path d="' + heartPath(9.2, 12, 2.6) + '" fill="currentColor"/></symbol>' +
      '<symbol id="i-qr" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.2"' + st + ' stroke-width="2"/><rect x="14" y="4" width="6" height="6" rx="1.2"' + st + ' stroke-width="2"/><rect x="4" y="14" width="6" height="6" rx="1.2"' + st + ' stroke-width="2"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 18.5h1.5V20H14zM18.5 14H20v1.5h-1.5z" fill="currentColor"/></symbol>' +
      '<symbol id="i-wallet" viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="12.5" rx="2.6"' + st + ' stroke-width="2.1"/><path d="M3.8 10h16.4" ' + st + ' stroke-width="2"/><rect x="14" y="12.6" width="4.4" height="3" rx="1.2" fill="currentColor"/></symbol>' +
      '<symbol id="i-door" viewBox="0 0 24 24"><path d="M6 20.5V10a6 6 0 0 1 12 0v10.5"' + st + ' stroke-width="2.2"/><path d="M4 20.5h16"' + st + ' stroke-width="2.2"/><circle cx="14.6" cy="15" r="1.2" fill="currentColor"/></symbol>' +
      PLACE_PATHS.map(function (d, i) { return '<symbol id="i-place' + i + '" viewBox="0 0 24 24"><g' + st + ' stroke-width="2.2">' + d + '</g></symbol>'; }).join('') +

      /* Cositas que brillan en la plaza (28×28) */
      '<symbol id="ob-llave" viewBox="0 0 28 28">' +
      '<circle cx="9" cy="9" r="5.6" fill="none" stroke="#F4B53A" stroke-width="3"/><circle cx="9" cy="9" r="5.6" fill="none" stroke="#FFE08A" stroke-width="1" opacity=".9"/>' +
      '<path d="M13 13l10 10" stroke="#F4B53A" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M19.4 19.4l-2.4 2.4M21.8 21.8l-2 2" stroke="#F4B53A" stroke-width="2.6" stroke-linecap="round"/></symbol>' +
      '<symbol id="ob-postal" viewBox="0 0 28 28"><g transform="rotate(-9 14 14)">' +
      '<rect x="3" y="7" width="22" height="15" rx="2" fill="#FFF8EE" stroke="#E9C2B0" stroke-width="1.2"/>' +
      '<rect x="17.4" y="9" width="5.2" height="6" rx="1" fill="#D9364F"/><path d="M18.4 12.6 l1.4 -1.6 1.4 1.6" stroke="#fff" stroke-width=".9" fill="none"/>' +
      '<path d="M6 12.4h8M6 15.6h8M6 18.6h5.4" stroke="#C9A6B5" stroke-width="1.3" stroke-linecap="round"/></g></symbol>' +
      '<symbol id="ob-gafas" viewBox="0 0 28 28">' +
      '<path d="M3 11.6 1.6 9.4M25 11.6l1.4-2.2" stroke="#D9364F" stroke-width="1.8" stroke-linecap="round"/>' +
      '<rect x="3" y="10" width="9.4" height="7.6" rx="3.6" fill="#6E1F3A" stroke="#D9364F" stroke-width="1.8"/>' +
      '<rect x="15.6" y="10" width="9.4" height="7.6" rx="3.6" fill="#6E1F3A" stroke="#D9364F" stroke-width="1.8"/>' +
      '<path d="M12.4 12.6q1.6-1.6 3.2 0" stroke="#D9364F" stroke-width="1.8" fill="none"/>' +
      '<path d="M5.4 12.6l2.4-1.2M18 12.6l2.4-1.2" stroke="#FFD6E5" stroke-width="1.3" stroke-linecap="round"/></symbol>' +
      '<symbol id="ob-flor" viewBox="0 0 28 28"><path d="M14 16v10" stroke="#6E9A72" stroke-width="2" stroke-linecap="round"/><path d="M14 22q5-4 7-1-3 3-7 2z" fill="#86AE85"/>' +
      petals8(14, 11, 2.6, 4.6, 5.2, '#FFD25E', '#F2B12F') + '<circle cx="14" cy="11" r="3.2" fill="#F29A2E"/><circle cx="13" cy="10" r="1.1" fill="#FFE7A0"/></symbol>' +
      '<symbol id="ob-estrella" viewBox="0 0 28 28"><polygon points="' + starPts(14, 14.6, 11, 5) + '" fill="#FFD25E" stroke="#F2A62B" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<polygon points="' + starPts(12.6, 12.6, 4.6, 2.2) + '" fill="#FFF3C4" opacity=".8"/></symbol>' +

      /* Cartas de parejas (60×60) */
      '<symbol id="ic-pintxo" viewBox="0 0 60 60"><ellipse cx="30" cy="51" rx="22" ry="4" fill="#402435" opacity=".1"/>' +
      '<path d="M30 24V7" stroke="#C99A6E" stroke-width="2.2" stroke-linecap="round"/><path d="M30.6 8l9 3-9 3.4z" fill="#D9364F"/>' +
      '<path d="M9 44Q8 36 13.5 34L46 30Q52 30 52 37v4.6Q52 46 46.6 46.6L15 49Q9.4 49 9 44Z" fill="#E9B477"/>' +
      '<path d="M15 44.6l31-3.6" stroke="#D49A5E" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M11 36Q13 25 26 23Q39 19.4 47 25.6Q53 30 48 34.2L14 38.4Q10.4 38.4 11 36Z" fill="#FFD36E"/>' +
      '<circle cx="21" cy="30" r="2.2" fill="#E59A3A"/><circle cx="32.6" cy="25.6" r="1.7" fill="#E59A3A"/><circle cx="40.6" cy="30.2" r="2.4" fill="#D98A2E"/><circle cx="27.6" cy="33.2" r="1.4" fill="#E59A3A"/><circle cx="36" cy="33" r="1.1" fill="#E59A3A"/>' +
      '<path d="M16 30q4-5 10-6" stroke="#FFF0BC" stroke-width="2.2" fill="none" stroke-linecap="round"/></symbol>' +
      '<symbol id="ic-taza" viewBox="0 0 60 60"><ellipse cx="28" cy="52" rx="20" ry="3.4" fill="#402435" opacity=".1"/>' +
      '<path d="M41 27q11 0 11 7.6T41 42" stroke="#E8678C" stroke-width="5" fill="none"/>' +
      '<path d="M13 22h30v18q0 10-10 10H23q-10 0-10-10z" fill="#F48FB1"/>' +
      '<path d="M17 27v12q0 5 4 7" stroke="#FFD0DC" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="28" cy="22" rx="15" ry="4.2" fill="#FFC2D2"/><ellipse cx="28" cy="22.6" rx="12" ry="2.9" fill="#9A5B3E"/>' +
      '<path d="' + heartPath(29, 35, 5) + '" fill="#fff" opacity=".9"/>' +
      '<path d="M22 16q-3-4 0-7t0-6M30 16q-3-4 0-7t0-6" stroke="#F2B9C9" stroke-width="2.2" fill="none" stroke-linecap="round"/></symbol>' +
      '<symbol id="ic-palomitas" viewBox="0 0 60 60"><ellipse cx="30" cy="55" rx="16" ry="3" fill="#402435" opacity=".1"/>' +
      popcorn([[19, 22, 6], [27, 17, 6.4], [36, 19, 6], [43, 24, 5.4], [24, 25, 5], [33, 25, 5.4], [16, 27, 4.2], [30, 11, 4.8], [40, 14, 4.4]]) +
      '<path d="M14 27h32l-4 27H18z" fill="#fff"/>' +
      '<path d="M20.4 27l2.2 27h-4.6zM27.6 27h4.8l-.4 27h-4z" fill="#D9364F"/><path d="M39.6 27h4.8L42 54h-4.6z" fill="#D9364F"/>' +
      '<path d="M13 27.2h34" stroke="#9F263F" stroke-width="2.6" stroke-linecap="round"/></symbol>' +
      '<symbol id="ic-casco" viewBox="0 0 60 60"><ellipse cx="30" cy="54" rx="20" ry="3" fill="#402435" opacity=".1"/>' +
      '<path d="M8 38q0-22 22-24 22 2 22 24 0 3-4 3H12q-4 0-4-3z" fill="#E05A6F"/>' +
      '<path d="M20 18.4q4 10 2.4 20.6M30 15v24M40 18.4q-4 10-2.4 20.6" stroke="#9F263F" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M15.6 25q3.6-6.4 10.4-8" stroke="#FFD6E5" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M6 40.6h48" stroke="#6E1F3A" stroke-width="4.4" stroke-linecap="round"/>' +
      '<path d="M15 42q2 8.6 9.6 10.4M45 42q-2 8.6-9.6 10.4M24.6 52.4h10.8" stroke="#402435" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<rect x="27" y="50" width="6" height="5" rx="1.4" fill="#F5C77E"/></symbol>' +
      '<symbol id="ic-flor" viewBox="0 0 60 60"><path d="M30 30q2 14 0 26" stroke="#6E9A72" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M30.6 46q9-6 13-2.4-6 6-13 4.4z" fill="#86AE85"/><path d="M29.4 40q-8-5-12-2 5 6 12 4z" fill="#9DBF96"/>' +
      petals8(30, 23, 5.6, 9.6, 10.6, '#FFD25E', '#F2B12F') + '<circle cx="30" cy="23" r="6.4" fill="#F29A2E"/><circle cx="28" cy="21" r="2.3" fill="#FFE7A0"/></symbol>' +
      '<symbol id="ic-perro" viewBox="20 12 80 80">' + pomHead(K, true) + '</symbol>' +

      /* Productos de la tiendita (40×40) */
      '<symbol id="it-manzana" viewBox="0 0 40 40"><path d="M20 13C13 9 6 14 7.5 22c1.5 9 7.5 13 12.5 10.5 5 2.5 11-1.5 12.5-10.5C34 14 27 9 20 13z" fill="#E8485F"/>' +
      '<path d="M20 13q-1-5 2-8" stroke="#8A553F" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M21.4 9q6-4 9 0-5 3-9 0z" fill="#86AE85"/>' +
      '<ellipse cx="13.6" cy="19.6" rx="2.4" ry="4" fill="#fff" opacity=".45" transform="rotate(20 13.6 19.6)"/></symbol>' +
      '<symbol id="it-platano" viewBox="0 0 40 40"><path d="M8 11q1 19 17 22 8 1 11-3-11 0-18-7-5-5-6-12z" fill="#FFD25E"/>' +
      '<path d="M12 11q1 7 6 12 7 7 18 7" stroke="#E8A92C" stroke-width="1.6" fill="none"/>' +
      '<path d="M7.6 11.6 9 7.4l3.6 3.2" fill="#9C7A40"/><path d="M34.4 30.6l2.4-1" stroke="#5B3D2E" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M11.6 16q2 8 9 12" stroke="#FFF0B8" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/></symbol>' +
      '<symbol id="it-pan" viewBox="0 0 40 40"><g transform="rotate(-26 20 20)"><rect x="2.6" y="14.4" width="34.8" height="11.6" rx="5.8" fill="#E8B26A"/>' +
      '<rect x="2.6" y="20.4" width="34.8" height="5.6" rx="2.8" fill="#D2924A" opacity=".55"/>' +
      '<path d="M10 16.4l3 5M17.4 16.4l3 5M24.8 16.4l3 5" stroke="#FFE3AC" stroke-width="2.2" stroke-linecap="round"/></g></symbol>' +
      '<symbol id="it-cruasan" viewBox="0 0 40 40"><path d="M5 28q1-13 15-15 14 2 15 15-3.4-3-6.6-2.6Q26 20 20 20t-8.4 5.4Q8.4 25 5 28z" fill="#F2B45C"/>' +
      '<path d="M11.6 25.4q2-6.6 8.4-7M28.4 25.4q-2-6.6-8.4-7M20 13v7" stroke="#D9903A" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
      '<path d="M9 22q2-5 6-6.6" stroke="#FFE0A8" stroke-width="1.7" fill="none" stroke-linecap="round"/></symbol>' +
      '<symbol id="it-cacao" viewBox="0 0 40 40"><rect x="10.6" y="12" width="18.8" height="23" rx="4" fill="#A86E52"/>' +
      '<rect x="9.6" y="7.4" width="20.8" height="6.4" rx="2.6" fill="#D9364F"/><rect x="13" y="17.6" width="14" height="11" rx="2.4" fill="#FFF3E2"/>' +
      '<path d="' + heartPath(20, 23.2, 3.2) + '" fill="#A86E52"/><path d="M13.4 13.4v19" stroke="#C48B6E" stroke-width="1.6" opacity=".6"/></symbol>' +
      '<symbol id="it-galletas" viewBox="0 0 40 40"><circle cx="15" cy="24" r="10" fill="#E2A65E"/><circle cx="24.6" cy="17.4" r="10" fill="#F2C27E"/>' +
      '<circle cx="21" cy="14" r="1.6" fill="#7A4A32"/><circle cx="27.6" cy="15.6" r="1.4" fill="#7A4A32"/><circle cx="24" cy="21" r="1.6" fill="#7A4A32"/><circle cx="29.4" cy="21.6" r="1.1" fill="#7A4A32"/>' +
      '<circle cx="10.6" cy="27" r="1.3" fill="#7A4A32"/><circle cx="14" cy="30.4" r="1.1" fill="#7A4A32"/></symbol>' +

      /* Cositas para el rincón (48×48) */
      '<symbol id="rc-cojin" viewBox="0 0 48 48"><path d="M7 11q17-7 34 0 5 13 0 26-17 7-34 0-5-13 0-26z" fill="#F48FB1"/>' +
      '<path d="M11 15q13-5 26 0 3.6 9 0 18-13 5-26 0-3.6-9 0-18z" fill="none" stroke="#FFD0DC" stroke-width="1.6" stroke-dasharray="3 2.6"/>' +
      '<path d="' + heartPath(24, 24.4, 5) + '" fill="#D9364F"/></symbol>' +
      '<symbol id="rc-manta" viewBox="0 0 48 48"><path d="M5 13h38v21q0 4-4 4H9q-4 0-4-4z" fill="#F5C77E"/>' +
      '<path d="M5 21.4h38M5 29.4h38M15.6 13v25M28.4 13v25" stroke="#FFF4EC" stroke-width="2.4" opacity=".7"/>' +
      '<path d="M5 13q19-5 38 0v7q-19-5-38 0z" fill="#E9A852"/><path d="M10 38v4M15 38v4M20 38v4M25 38v4M30 38v4M35 38v4" stroke="#E9A852" stroke-width="2" stroke-linecap="round"/></symbol>' +
      '<symbol id="rc-lampara" viewBox="0 0 48 48"><path d="M14 7h20l6.6 16.6H7.4z" fill="#FFC2A8"/><path d="M14 7h20" stroke="#E89A7E" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M12 21h24" stroke="#FFDCCB" stroke-width="2"/><rect x="22.4" y="23.6" width="3.2" height="15" rx="1.4" fill="#B88A74"/>' +
      '<ellipse cx="24" cy="40.6" rx="9.4" ry="3.2" fill="#B88A74"/><ellipse cx="24" cy="24" rx="6.6" ry="1.8" fill="#FFF3C4"/></symbol>' +
      '<symbol id="rc-tazas" viewBox="0 0 48 48"><path d="M20 26q5 0 5 4t-5 4" stroke="#E8678C" stroke-width="3" fill="none"/><path d="M5 22h16v12q0 5-5 5h-6q-5 0-5-5z" fill="#F48FB1"/>' +
      '<ellipse cx="13" cy="22" rx="8" ry="2.4" fill="#9A5B3E"/>' +
      '<path d="M41 23q5 0 5 4t-5 4" stroke="#B92B45" stroke-width="3" fill="none"/><path d="M26 19h16v13q0 5-5 5h-6q-5 0-5-5z" fill="#D9364F"/>' +
      '<ellipse cx="34" cy="19" rx="8" ry="2.4" fill="#9A5B3E"/>' +
      '<path d="M12 15q-2-3 0-5t0-5M33 12q-2-3 0-5t0-5" stroke="#FFD6E5" stroke-width="2" fill="none" stroke-linecap="round"/></symbol>' +
      '<symbol id="rc-palomitas" viewBox="0 0 48 48">' + popcorn([[14, 22, 5], [21, 17, 5.4], [29, 18, 5.2], [35, 23, 4.6], [18, 25, 4.4], [27, 24, 4.8], [24, 12, 4]]) +
      '<path d="M6 25h36q-2 15-18 15T6 25z" fill="#D9364F"/><path d="M10 29q4 6 14 7" stroke="#F48FB1" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M5 25h38" stroke="#9F263F" stroke-width="2.6" stroke-linecap="round"/></symbol>' +
      '<symbol id="rc-mando" viewBox="0 0 48 48"><path d="M10 17q4-4 10-3h8q6-1 10 3 6.6 8.6 4.6 16-2.4 5-7.4 2L31 31H17l-4.2 4Q7.8 38 5.4 33 3.4 25.6 10 17z" fill="#5B3249"/>' +
      '<path d="M14 23h7M17.5 19.5v7" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><circle cx="31" cy="21" r="2.2" fill="#F48FB1"/><circle cx="35.4" cy="25" r="2.2" fill="#F5C77E"/>' +
      '<path d="M12 18.6q3-2.6 7-2.6" stroke="#8C5A76" stroke-width="2" fill="none" stroke-linecap="round"/></symbol>' +
      '</svg>';
  };

  /* ---------- Mapa del mundo (400 × 1000) ----------
     De abajo arriba: el bosque rosa y la plaza, la tiendita, la casita con su
     jardín de flores y, al final, el lago al atardecer con el faro y la puerta. */
  ART.MAP = {
    w: 400, h: 1000,
    nodes: [[120, 912], [214, 722], [182, 556], [200, 344]],
    pts: [[200, 1006], [166, 966], [120, 912], [142, 850], [180, 800], [214, 722], [238, 664], [220, 606], [182, 556], [196, 506], [222, 474], [236, 452]],
    pier: [[238, 456], [232, 428], [222, 400], [212, 374], [205, 352]],
    petOffset: [[-58, -18], [-62, 8], [56, -18], [56, -10]]
  };

  ART.map = function () {
    var M = ART.MAP, p = 'mp';
    var R = rng(7);
    var s = '<svg class="map-art" viewBox="0 0 400 1000" preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">';
    s += '<defs>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="300" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#2A1428"/><stop offset=".22" stop-color="#4A1C3C"/><stop offset=".45" stop-color="#8A2C4F"/><stop offset=".66" stop-color="#C9485E"/><stop offset=".82" stop-color="#EE7E7C"/><stop offset="1" stop-color="#F8BB8E"/></linearGradient>' +
      '<linearGradient id="' + p + 'lake" x1="0" y1="256" x2="0" y2="456" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#F7B7A3"/><stop offset=".3" stop-color="#EE919A"/><stop offset=".66" stop-color="#BD5A7F"/><stop offset="1" stop-color="#8E3D66"/></linearGradient>' +
      '<linearGradient id="' + p + 'gr" x1="0" y1="440" x2="0" y2="1000" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FCE6D8"/><stop offset=".5" stop-color="#F9DCCF"/><stop offset="1" stop-color="#F5D2C6"/></linearGradient>' +
      '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset=".4" stop-color="#FFD978" stop-opacity=".45"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'pglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD0E6" stop-opacity=".9"/><stop offset=".45" stop-color="#FF6F9E" stop-opacity=".4"/><stop offset="1" stop-color="#FF6F9E" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'fog" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".6" stop-color="#FFF0F4" stop-opacity=".72"/><stop offset="1" stop-color="#FFF0F4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF4D6"/><stop offset=".22" stop-color="#FFD9A0" stop-opacity=".9"/><stop offset=".58" stop-color="#F7958A" stop-opacity=".35"/><stop offset="1" stop-color="#F07F8F" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'door" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF0F5" stop-opacity=".95"/><stop offset=".35" stop-color="#F7A8C4" stop-opacity=".6"/><stop offset=".7" stop-color="#D9364F" stop-opacity=".25"/><stop offset="1" stop-color="#D9364F" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'shroom" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE0EC" stop-opacity=".9"/><stop offset="1" stop-color="#F48FB1" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".8"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + p + 'shoot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>' +
      '<filter id="' + p + 'sil" x="-5%" y="-5%" width="110%" height="110%"><feFlood flood-color="#9A6382" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in"/></filter>' +
      '</defs>';

    // Cielo del atardecer
    s += '<rect width="400" height="1000" fill="url(#' + p + 'sky)"/>';
    // Sol que se pone (se mueve un poco más lento al desplazar)
    s += '<g class="plx" data-plx=".08"><g class="sunrays">';
    for (var ry = 0; ry < 9; ry++) {
      var ang = (-170 + ry * 20) * Math.PI / 180;
      var x2 = r1(112 + Math.cos(ang - 0.05) * 260), y2 = r1(236 + Math.sin(ang - 0.05) * 260), x3 = r1(112 + Math.cos(ang + 0.05) * 260), y3 = r1(236 + Math.sin(ang + 0.05) * 260);
      s += '<path d="M112 236 L' + x2 + ' ' + y2 + ' L' + x3 + ' ' + y3 + 'Z" fill="#FFE3B0" opacity=".1"/>';
    }
    s += '</g><circle class="sun-glow" cx="112" cy="236" r="122" fill="url(#' + p + 'sun)"/><circle cx="112" cy="236" r="29" fill="#FFE6BE"/><circle cx="104" cy="228" r="11" fill="#FFF5DE" opacity=".8"/></g>';
    // Estrellas: aparecen más según sube el nivel
    var groups = ['', '', '', ''];
    for (var i = 0; i < 60; i++) {
      var x = r1(8 + R() * 384), y = r1(6 + R() * 150);
      if (x > 296 && x < 374 && y > 34 && y < 112) continue;
      var lv = i % 4;
      var tw = R() < 0.4 ? ' class="tw" style="animation-delay:' + r1(R() * 4) + 's"' : '';
      groups[lv] += '<circle' + tw + ' cx="' + x + '" cy="' + y + '" r="' + r1(0.6 + R() * 1.3) + '" fill="#FFF0E0"/>';
    }
    [[52, 60, 5, 0], [118, 112, 4, 1], [276, 26, 4.5, 2], [372, 150, 3.6, 3], [28, 150, 3.4, 1], [160, 36, 3.6, 3], [238, 122, 3.2, 2]].forEach(function (q) {
      groups[q[3]] += '<path class="tw" style="animation-delay:' + r1(R() * 3) + 's" d="' + spark(q[0], q[1], q[2]) + '" fill="#FFE6B8"/>';
    });
    s += '<g class="plx" data-plx=".05">';
    for (var g = 0; g < 4; g++) s += '<g class="mstars lv' + (g + 1) + '">' + groups[g] + '</g>';
    // Luna (secreto)
    s += '<g class="secret" data-secret="luna">' +
      '<circle cx="334" cy="72" r="52" fill="url(#' + p + 'glow)" opacity=".45"/>' +
      '<g class="moon-face"><circle cx="334" cy="72" r="23" fill="#FFEFD9"/>' +
      '<circle cx="325" cy="65" r="5" fill="#F5D9C2"/><circle cx="342" cy="82" r="3.6" fill="#F5D9C2"/><circle cx="341" cy="61" r="2.4" fill="#F5D9C2"/></g>' +
      '<circle cx="334" cy="72" r="34" fill="transparent"/></g>';
    s += '<g class="shooting"><path d="M372 26 L250 100" stroke="url(#' + p + 'shoot)" stroke-width="2.6" stroke-linecap="round"/></g></g>';
    // Nubes rosadas por el sol
    s += '<g class="plx" data-plx=".18"><g class="mclouds"><g class="drift d1">' + cloud(70, 150, 0.9, '#FFD9E2', '#E58FA8') + '</g><g class="drift d2">' + cloud(300, 196, 0.75, '#FFD9E2', '#E58FA8') + '</g></g></g>';
    s += '<path d="M150 178 q4 -4 8 0 q4 -4 8 0 M172 168 q3 -3 6 0 q3 -3 6 0" stroke="#6E1F3A" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>';

    // Montañas lejanas
    s += '<path d="M0 236 Q40 202 84 214 Q118 224 150 234 L250 234 Q284 216 318 204 Q362 190 400 212 V266 H0Z" fill="#7A3358"/>';
    s += '<path d="M0 246 Q22 234 36 238 L44 262 H0Z M400 242 Q372 228 356 236 L350 262 H400Z" fill="#622647"/>';
    s += '<path d="M0 252 Q60 232 120 246 Q160 254 200 250 Q250 246 300 240 Q350 236 400 246 V268 H0Z" fill="#9C4565"/>';
    s += '<path d="M0 252 Q60 232 120 246 Q160 254 200 250 Q250 246 300 240 Q350 236 400 246" stroke="#E87C86" stroke-width="1.6" fill="none" opacity=".55"/>';
    // Lago
    s += '<path d="M0 258 H400 V452 Q360 444 320 450 Q280 458 238 448 Q200 440 160 446 Q110 454 60 446 Q30 442 0 448Z" fill="url(#' + p + 'lake)"/>';
    s += '<path d="M0 259 H400" stroke="#FFD9C4" stroke-width="2" opacity=".8"/>';
    // reflejo del sol
    s += '<g class="mrefl">' + [[112, 268, 34], [112, 282, 24], [112, 296, 38], [112, 310, 18], [112, 324, 28], [112, 340, 12], [112, 356, 20]].map(function (q, k) {
      return '<path class="tw" style="animation-delay:' + (k * 0.4) + 's" d="M' + (q[0] - q[2] / 2) + ' ' + q[1] + ' h' + q[2] + '" stroke="' + (k % 2 ? '#FFD6E5' : '#FFE3A6') + '" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>';
    }).join('') + '</g>';
    s += '<g class="waves"><path class="wave w1" d="M30 300 q8 -5 16 0 t16 0 M150 336 q8 -5 16 0 t16 0 M262 392 q8 -5 16 0 t16 0 M50 414 q8 -5 16 0 t16 0 M300 424 q8 -5 16 0 t16 0 M176 286 q8 -4 16 0" stroke="#FFE1EA" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/></g>';

    // Cabo y faro rojo y rosa
    s += '<path d="M276 266 Q290 248 310 245 Q328 236 348 240 Q372 232 400 240 V296 Q384 290 368 294 Q340 302 314 292 Q292 284 276 266Z" fill="#5E2442"/>';
    s += '<path d="M282 262 Q294 250 312 248 Q330 240 350 244 Q372 238 400 244" stroke="#9C4565" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += '<path d="M300 270 q10 -6 22 -3 M330 262 q12 -5 26 -1 M364 258 q10 -4 22 0" stroke="#7A3358" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    s += '<ellipse cx="296" cy="300" rx="9" ry="3.4" fill="#5E2442"/><ellipse cx="270" cy="276" rx="5" ry="2.2" fill="#5E2442"/>';
    s += '<g class="lh-refl">' + [[352, 304, 10], [352, 314, 7], [352, 324, 12], [352, 336, 6]].map(function (q) {
      return '<path d="M' + (q[0] - q[2] / 2) + ' ' + q[1] + ' h' + q[2] + '" stroke="#FFD6E5" stroke-width="2" stroke-linecap="round" opacity=".55"/>';
    }).join('') + '</g>';
    s += '<g class="lh">' + lighthouse(352, 246, 62, { glass: 'lh-lamp', beam: 'lh1', beamGrad: p + 'beam' }) + '</g>';
    s += '<circle class="lh-halo" cx="352" cy="176" r="22" fill="url(#' + p + 'glow)"/>';

    // Barquita (secreto)
    s += '<g class="secret" data-secret="barca"><g class="boat"><path d="M52 398 h40 l-7 10 h-26z" fill="#D9364F"/><path d="M58 398 q14 -4 28 0" stroke="#9F263F" stroke-width="1.6" fill="none"/>' +
      '<path d="M66 398 L56 386 M80 398 L92 388" stroke="#B88A74" stroke-width="2" stroke-linecap="round"/></g><circle cx="72" cy="398" r="26" fill="transparent"/></g>';
    // lucecitas sobre el lago (al abrir la puerta)
    s += '<g class="ff ff4">' + [[118, 300], [262, 300], [320, 380], [86, 356], [262, 410], [154, 410]].map(function (q, k) {
      return '<g transform="translate(' + q[0] + ' ' + q[1] + ')"><g class="fly f' + (k % 4) + '"><circle r="10" fill="url(#' + p + 'glow)"/><circle r="2.4" fill="#FFF8D2"/></g></g>';
    }).join('') + '</g>';

    // Orilla
    s += '<path d="M0 448 Q30 442 60 446 Q110 454 160 446 Q200 440 238 448 Q280 458 320 450 Q360 444 400 452 V1000 H0Z" fill="url(#' + p + 'gr)"/>';
    s += '<path d="M0 449 Q30 443 60 447 Q110 455 160 447 Q200 441 238 449 Q280 459 320 451 Q360 445 400 453" stroke="#FFF1DE" stroke-width="5" fill="none" opacity=".9"/>';
    s += reeds(22, 456, 1) + reeds(48, 452, 0.8) + reeds(366, 460, 1) + reeds(390, 458, 0.8);

    // Muelle y la puerta antigua (lugar 4)
    var pier = M.pier;
    var loc4 = '<g id="' + p + 'loc4">';
    for (var k = 0; k < pier.length - 1; k++) {
      var a = pier[k], b = pier[k + 1], an = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + 90;
      for (var t = 0; t < 1; t += 0.25) {
        var px = r1(a[0] + (b[0] - a[0]) * t), py = r1(a[1] + (b[1] - a[1]) * t);
        loc4 += '<rect x="-10" y="-2.4" width="20" height="4.8" rx="1.4" fill="' + (Math.round(t * 4) % 2 ? '#D8AE94' : '#E8C7AE') + '" transform="translate(' + px + ' ' + py + ') rotate(' + r1(an) + ')"/>';
      }
    }
    [[226, 444], [250, 440], [216, 404], [240, 400], [206, 370], [226, 366]].forEach(function (q) {
      loc4 += '<rect x="' + (q[0] - 2) + '" y="' + (q[1] - 4) + '" width="4" height="12" rx="1.6" fill="#8E5A5A"/>';
    });
    loc4 += '<ellipse cx="200" cy="346" rx="62" ry="17" fill="#B98A86"/><ellipse cx="200" cy="342" rx="59" ry="13.5" fill="#F0D9CE"/>';
    loc4 += '<path d="M150 342 h100 M158 336 h84 M158 348 h84 M176 336 v12 M200 336 v12 M224 336 v12" stroke="#D9BCB0" stroke-width="1.2"/>';
    // faroles de piedra
    [[150, 336], [250, 336]].forEach(function (q) {
      loc4 += '<rect x="' + (q[0] - 3) + '" y="' + (q[1] - 30) + '" width="6" height="30" rx="2" fill="#B98A86"/>' +
        '<rect x="' + (q[0] - 7) + '" y="' + (q[1] - 44) + '" width="14" height="15" rx="3.4" fill="#8E5A6E"/>' +
        '<rect class="isl-lampglass" x="' + (q[0] - 4) + '" y="' + (q[1] - 41) + '" width="8" height="9" rx="2" fill="#B98AA0"/>' +
        '<path d="M' + (q[0] - 8) + ' ' + (q[1] - 44) + ' l8 -6 l8 6z" fill="#6E3A52"/>';
    });
    // arco de piedra antiguo
    loc4 += '<path d="M162 336 V262 A38 38 0 0 1 238 262 V336Z" fill="#F3E1D6"/>';
    loc4 += '<path d="M162 336 V262 A38 38 0 0 1 238 262 V336" fill="none" stroke="#C9A49C" stroke-width="2"/>';
    loc4 += '<path d="M162 300 h10 M162 318 h10 M228 300 h10 M228 318 h10 M162 282 h10 M228 282 h10 M166 248 l9 5 M234 248 l-9 5 M180 230 l6 8 M220 230 l-6 8" stroke="#D9BCB0" stroke-width="1.6" stroke-linecap="round"/>';
    loc4 += '<path d="M172 336 V264 A28 28 0 0 1 228 264 V336Z" fill="#C9A49C"/>';
    loc4 += '<path d="M176 336 V266 A24 24 0 0 1 224 266 V336Z" class="door-hole" fill="#FFE7B3"/>';
    loc4 += '<g class="door-leaf"><path d="M176 336 V266 A24 24 0 0 1 224 266 V336Z" fill="#9F263F"/>' +
      '<path d="M188 336 V248 M200 336 V243 M212 336 V248" stroke="#7E1D33" stroke-width="1.6"/>' +
      '<path d="M178 286 h44 M178 316 h44" stroke="#C9A55E" stroke-width="2"/>' +
      [[182, 286], [194, 286], [206, 286], [218, 286], [182, 316], [194, 316], [206, 316], [218, 316]].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="1.3" fill="#F5C77E"/>'; }).join('') +
      '<path d="' + heartPath(210, 300, 3.4) + '" fill="#F5C77E"/></g>';
    // piedra clave con corazón y enredadera con rosas
    loc4 += '<path d="M192 220 h16 l-3 14 h-10z" fill="#E8CFC2" stroke="#C9A49C" stroke-width="1.4"/><path d="' + heartPath(200, 226, 3) + '" fill="#D9364F"/>';
    loc4 += '<path d="M160 334 Q154 300 164 276 Q170 256 186 244 M240 334 Q246 300 236 276 Q230 256 214 244" stroke="#7FA67E" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    [[159, 312, '#D9364F'], [163, 288, '#F48FB1'], [172, 262, '#D9364F'], [184, 247, '#F48FB1'], [241, 314, '#F48FB1'], [237, 290, '#D9364F'], [229, 264, '#F48FB1'], [216, 247, '#D9364F']].forEach(function (q) {
      loc4 += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.4" fill="' + q[2] + '"/><circle cx="' + q[0] + '" cy="' + q[1] + '" r="1.4" fill="#FFD6E5"/>';
    });
    loc4 += '<rect x="166" y="333" width="68" height="5" rx="2" fill="#D9BCB0"/>';
    loc4 += '<path d="M200 206 l4 6 -4 4 -4 -4z" fill="#F5C77E"/>';
    loc4 += '</g>';
    s += '<circle class="door-aura" cx="200" cy="290" r="86" fill="url(#' + p + 'door)"/>';
    s += loc4;
    s += '<use href="#' + p + 'loc4" class="sil sil4" filter="url(#' + p + 'sil)"/>';
    // flores amarillas al final
    s += '<g class="bloom yf">' + [[28, 470], [62, 462], [96, 474], [132, 466], [164, 476], [266, 474], [300, 466], [334, 476], [372, 470], [146, 352], [254, 354], [112, 486], [292, 488], [190, 470]].map(function (q, k) {
      return '<g transform="translate(' + q[0] + ' ' + q[1] + ')"><g class="bl" style="transition-delay:' + (k * 70) + 'ms">' + bigFlower(0, 0, 0.62 + (k % 3) * 0.08, false) + '</g></g>';
    }).join('') + '</g>';

    // Casita y su jardín de flores (lugar 3)
    var h3 = '<g id="' + p + 'loc3">' +
      '<ellipse cx="94" cy="568" rx="70" ry="8" fill="#3A1E30" opacity=".08"/>' +
      '<rect x="122" y="474" width="13" height="26" rx="2" fill="#E39A8F"/><rect x="119" y="470" width="19" height="6" rx="2" fill="#C97C72"/>' +
      '<rect x="44" y="506" width="100" height="60" rx="4" fill="#FFF4EC"/>' +
      '<rect x="120" y="506" width="24" height="60" fill="#F7DCD3" opacity=".85"/>' +
      '<path d="M34 510 L94 466 L154 510 Q156 515 150 515 L38 515 Q32 515 34 510Z" fill="#D9364F"/>' +
      '<path d="M34 510 L94 466 L154 510" stroke="#9F263F" stroke-width="3" fill="none" stroke-linejoin="round"/>' +
      '<path d="M60 496 q6 3 12 0 M84 490 q6 3 12 0 M108 496 q6 3 12 0 M72 506 q6 3 12 0 M96 506 q6 3 12 0" stroke="#F07A8E" stroke-width="1.6" fill="none"/>' +
      '<circle class="h-win" cx="94" cy="490" r="7" fill="#9C5A78" stroke="#FFF8F1" stroke-width="2"/>' +
      windowRect(52, 520, 40, 30, 'h-win', '#F48FB1') +
      '<rect x="50" y="550" width="44" height="6" rx="2" fill="#B9786A"/>' + flower(58, 549, 0.7, '#F48FB1', '#FFE07A') + flower(70, 549, 0.7, '#FFD25E', '#F29A2E') + flower(82, 549, 0.7, '#D9364F', '#FFE07A') +
      '<path d="M106 566 V538 A13 13 0 0 1 132 538 V566Z" fill="#E8678C"/><circle cx="127" cy="552" r="1.8" fill="#F5C77E"/>' +
      '<path d="' + heartPath(119, 540, 3.4) + '" fill="#FFD6E5"/>' +
      '<rect x="102" y="565" width="34" height="4" rx="2" fill="#E2C2B5"/>' +
      '<g class="fairy">' + [[40, 508], [52, 499], [64, 490], [76, 481], [88, 472], [100, 472], [112, 481], [124, 490], [136, 499], [148, 508]].map(function (q) {
        return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.2" fill="#EBD7DC"/>';
      }).join('') + '</g>' +
      '<g class="fence">' + [24, 38, 52, 66, 80, 94, 108, 122, 136, 150].map(function (x) { return '<path d="M' + x + ' 592 V578 l3 -4 3 4 V592Z" fill="#FFF6EC"/>'; }).join('') +
      '<rect x="20" y="582" width="140" height="3.4" rx="1.6" fill="#FFF6EC"/></g>' +
      tulip(30, 598, 0.9, '#F48FB1', '#D9607E') + tulip(60, 600, 0.9, '#FFD25E', '#E0B23E') + tulip(92, 598, 0.9, '#D9364F', '#9F263F') + tulip(126, 600, 0.9, '#FFB6CF', '#E8678C');
    // macizos de flores
    var F = rng(17), bed = '', glow = '';
    for (var f = 0; f < 26; f++) {
      var fx = r1(10 + F() * 156), fy = r1(606 + F() * 30);
      var col = [['#F48FB1', '#FFE07A'], ['#D9364F', '#FFD6E5'], ['#FFD25E', '#F29A2E'], ['#FFF4EC', '#F5C77E'], ['#E8678C', '#FFF1B8']][f % 5];
      bed += tuft(fx + 3, fy + 5, 0.8, '#86AE85') + flower(fx, fy, 0.75 + F() * 0.35, col[0], col[1]);
      if (f % 3 === 0) glow += '<path class="tw" style="animation-delay:' + r1(F() * 3) + 's" d="' + spark(r1(fx + 4), r1(fy - 6), 2.6) + '" fill="#FFF3C4"/>';
    }
    h3 += bed + '</g>';
    s += h3;
    s += '<use href="#' + p + 'loc3" class="sil sil3" filter="url(#' + p + 'sil)"/>';
    s += '<g class="garden-glow">' + glow + '<circle cx="60" cy="616" r="26" fill="url(#' + p + 'glow)" opacity=".55"/><circle cx="130" cy="620" r="22" fill="url(#' + p + 'glow)" opacity=".5"/></g>';
    s += '<g class="smoke">' + [[130, 460, 5], [137, 446, 6.4], [131, 430, 7.4]].map(function (q, k) {
      return '<circle class="puffo p' + k + '" cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="#FFF0F4" opacity=".85"/>';
    }).join('') + '</g>';
    s += '<g class="hglow"><circle cx="72" cy="535" r="30" fill="url(#' + p + 'glow)"/><circle cx="94" cy="490" r="14" fill="url(#' + p + 'glow)"/></g>';
    s += blossomTree(332, 532, 1.05, 0) + blossomTree(374, 572, 0.9, 1) + roseBush(300, 606, 0.9) + roseBush(386, 612, 1);

    // Tiendita (lugar 2)
    var st2 = '<g id="' + p + 'loc2">' +
      '<ellipse cx="320" cy="744" rx="74" ry="8" fill="#3A1E30" opacity=".08"/>' +
      '<rect x="372" y="652" width="14" height="88" fill="#F2C9B6"/>' +
      '<rect x="256" y="652" width="118" height="88" fill="#FFE6DA"/>' +
      '<rect x="250" y="642" width="138" height="12" rx="3" fill="#F48FB1"/>' +
      '<rect x="286" y="657" width="64" height="16" rx="8" fill="#FFFFFF"/>' +
      '<text x="318" y="669" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="11" letter-spacing="1.2" fill="#D9364F">SÚPER</text>' +
      (function () {
        var a2 = '';
        for (var i2 = 0; i2 < 8; i2++) a2 += '<rect x="' + (256 + i2 * 15) + '" y="678" width="15" height="16" fill="' + (i2 % 2 ? '#FFF4EC' : '#D9364F') + '"/><circle cx="' + (263.5 + i2 * 15) + '" cy="694" r="7.5" fill="' + (i2 % 2 ? '#FFF4EC' : '#D9364F') + '"/>';
        return a2 + '<rect x="254" y="675" width="122" height="5" rx="2" fill="#9F263F"/>';
      })() +
      '<rect x="264" y="704" width="62" height="30" rx="3" fill="#FFF8F1"/><rect class="shop-win" x="267" y="707" width="56" height="24" rx="2" fill="#C9A7B8"/>' +
      '<path d="M267 716 h56 M267 725 h56" stroke="#B98AA0" stroke-width="1.4"/>' +
      [[272, 714, '#E8485F'], [278, 714, '#FFD25E'], [284, 714, '#9DBF96'], [298, 714, '#E8485F'], [304, 714, '#FFD25E'], [276, 723, '#E8B26A'], [284, 723, '#E8B26A'], [300, 723, '#F48FB1'], [310, 723, '#D9364F'], [314, 714, '#9DBF96']].map(function (q) {
        return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.6" fill="' + q[2] + '"/>';
      }).join('') +
      '<rect x="334" y="702" width="32" height="38" rx="3" fill="#9C5A78"/><rect class="shop-win" x="338" y="706" width="24" height="16" rx="2" fill="#C9A7B8"/><circle cx="360" cy="726" r="1.8" fill="#F5C77E"/>' +
      '<rect x="262" y="738" width="24" height="10" rx="2" fill="#C9906E"/><circle cx="268" cy="737" r="3" fill="#E8485F"/><circle cx="275" cy="736" r="3" fill="#E8485F"/><circle cx="281" cy="737" r="3" fill="#E8485F"/>' +
      '<rect x="290" y="740" width="22" height="9" rx="2" fill="#C9906E"/><circle cx="296" cy="739" r="2.8" fill="#FFD25E"/><circle cx="303" cy="738" r="2.8" fill="#FFD25E"/>' +
      // instalación de luces en el tejado
      '<g class="neon"><path d="M262 642 V628 M380 642 V628" stroke="#5B3249" stroke-width="2"/>' +
      '<rect x="258" y="606" width="126" height="26" rx="8" fill="#2E1428"/>' +
      '<path class="neon-tube" d="' + heartPath(276, 619, 7) + '" fill="none" stroke="#8A5A73" stroke-width="2.2"/>' +
      '<text class="neon-text" x="332" y="625" text-anchor="middle" font-family="Caveat, \'Bradley Hand\', cursive" font-weight="700" font-size="19" fill="#8A5A73">mimimimi</text></g>' +
      '</g>';
    s += '<g class="neon-glow"><ellipse cx="320" cy="619" rx="72" ry="26" fill="url(#' + p + 'pglow)"/></g>';
    s += st2;
    s += '<use href="#' + p + 'loc2" class="sil sil2" filter="url(#' + p + 'sil)"/>';
    s += lamppost(122, 744, 74, 'l2');
    s += '<g class="bulbs">' + bunting(124, 664, 256, 678, 10, 12, 'bulb', null) + '</g>';
    // Bici (secreto)
    s += '<g class="secret" data-secret="bici"><g class="bike">' +
      '<g class="wheel w1"><circle cx="54" cy="728" r="12" fill="none" stroke="#5B3249" stroke-width="2.6"/><path d="M54 716 V740 M42 728 H66" stroke="#B98AA0" stroke-width="1.2"/></g>' +
      '<g class="wheel w2"><circle cx="96" cy="728" r="12" fill="none" stroke="#5B3249" stroke-width="2.6"/><path d="M96 716 V740 M84 728 H108" stroke="#B98AA0" stroke-width="1.2"/></g>' +
      '<path d="M54 728 L70 728 L84 708 L62 708 Z M70 728 L64 702 M84 708 L96 728 M82 708 L80 700" stroke="#D9364F" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M58 701 h12" stroke="#5B3249" stroke-width="3.4" stroke-linecap="round"/><path d="M76 699 q4 -2 8 0" stroke="#5B3249" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="85" cy="699" r="2.2" fill="#F5C77E"/>' +
      '<path d="M56 690 h22 l-3 8 h-16z" fill="#FFF0D8" stroke="#C9906E" stroke-width="1.4"/>' + flower(62, 690, 0.6, '#FFD25E', '#F29A2E') + flower(70, 689, 0.6, '#F48FB1', '#FFE07A') +
      '</g><circle cx="76" cy="716" r="30" fill="transparent"/></g>';

    // Bosque rosa alrededor de la plaza (lugar 1)
    var pl = '<g id="' + p + 'loc1">';
    pl += blossomTree(34, 816, 0.95, 1) + blossomTree(366, 818, 0.9, 0) + blossomTree(300, 822, 0.7, 2);
    pl += '<ellipse cx="184" cy="938" rx="178" ry="72" fill="#F3DCCD"/><ellipse cx="184" cy="938" rx="160" ry="58" fill="#F9EADF"/>';
    for (var row = 0; row < 6; row++) {
      for (var col2 = 0; col2 < 12; col2++) {
        var cxp = 40 + col2 * 26 + (row % 2) * 13, cyp = 892 + row * 18;
        var dx = (cxp - 184) / 170, dy = (cyp - 938) / 66;
        if (dx * dx + dy * dy > 0.92) continue;
        pl += '<path d="M' + (cxp - 8) + ' ' + cyp + ' q8 -4 16 0" stroke="#EBCDBC" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
      }
    }
    // edificio izquierdo
    pl += '<rect x="-2" y="808" width="86" height="80" fill="#F7B3C4"/><path d="M-6 812 L40 786 L88 812Z" fill="#D9364F"/><rect x="-6" y="808" width="94" height="5" fill="#9F263F"/>' +
      windowRect(10, 822, 20, 24, 'pw', '#FFD6E5') + windowRect(48, 822, 20, 24, 'pw', '#FFD6E5') +
      '<path d="M8 846 h24 M46 846 h24" stroke="#FFF8F1" stroke-width="2"/><path d="M8 851 h24 M46 851 h24 M10 846 v5 M18 846 v5 M26 846 v5 M48 846 v5 M56 846 v5 M64 846 v5" stroke="#9F263F" stroke-width="1.2"/>' +
      '<path d="M18 888 V870 A10 10 0 0 1 38 870 V888Z M50 888 V870 A10 10 0 0 1 70 870 V888Z" fill="#A85A78" opacity=".6"/>';
    // edificios derechos
    pl += '<rect x="272" y="814" width="66" height="76" fill="#FFD9C4"/><path d="M268 818 L305 798 L342 818Z" fill="#E8667E"/>' +
      '<rect x="338" y="808" width="66" height="82" fill="#FBD3DF"/><rect x="334" y="802" width="72" height="8" rx="2" fill="#F48FB1"/>' +
      windowRect(282, 826, 18, 22, 'pw', null) + windowRect(310, 826, 18, 22, 'pw', null) + windowRect(348, 822, 18, 22, 'pw', '#FFD6E5') + windowRect(376, 822, 18, 22, 'pw', '#FFD6E5') +
      (function () { var a3 = ''; for (var i3 = 0; i3 < 5; i3++) a3 += '<path d="M' + (274 + i3 * 12.4) + ' 858 h12.4 v8 q-6.2 5 -12.4 0z" fill="' + (i3 % 2 ? '#FFF4EC' : '#D9364F') + '"/>'; return a3; })() +
      '<path d="M282 890 V872 h22 v18z" fill="#A85A78" opacity=".5"/>' +
      '<path d="M352 890 V870 A9 9 0 0 1 370 870 V890Z M378 890 V870 A9 9 0 0 1 396 870 V890Z" fill="#B0657F" opacity=".55"/>' +
      '<ellipse cx="306" cy="902" rx="12" ry="3.6" fill="#FFF8F1"/><path d="M306 905 V918 M300 918 h12" stroke="#8E5A6E" stroke-width="1.6"/>' +
      '<path d="M288 904 v14 M292 896 v22 M320 896 v22 M324 904 v14" stroke="#8E5A6E" stroke-width="1.4"/>';
    // farola y fuente
    pl += lamppost(20, 978, 66, 'l1');
    pl += '<g transform="translate(292 948)"><ellipse cx="0" cy="6" rx="28" ry="7" fill="#3A1E30" opacity=".08"/><ellipse cx="0" cy="0" rx="26" ry="8" fill="#F1DCD9"/><ellipse cx="0" cy="-1" rx="21" ry="5.2" fill="#CBDDF4"/>' +
      '<rect x="-3.4" y="-22" width="6.8" height="20" rx="2" fill="#F1DCD9"/><ellipse cx="0" cy="-22" rx="10" ry="3.4" fill="#F1DCD9"/>' +
      '<path class="fount-water" d="M0 -26 Q-8 -34 -14 -12 M0 -26 Q8 -34 14 -12" stroke="#E2EEFF" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>';
    pl += roseBush(80, 1004, 1) + roseBush(392, 1006, 1.2) + flower(108, 986, 0.8, '#FFD25E', '#F29A2E') + flower(142, 996, 0.7, '#F48FB1', '#FFE07A') + flower(330, 990, 0.8, '#FFFFFF', '#F5C77E');
    pl += '</g>';
    s += pl;
    // setas que brillan en el bosque
    s += mushroom(112, 794, 0.85, '#D9364F', p + 'shroom') + mushroom(124, 798, 0.6, '#F48FB1', p + 'shroom') + mushroom(256, 794, 0.75, '#E8678C', p + 'shroom') +
      mushroom(150, 998, 0.9, '#D9364F', p + 'shroom') + mushroom(165, 1001, 0.65, '#F48FB1', p + 'shroom') + mushroom(12, 1000, 0.8, '#E8678C', p + 'shroom');
    s += '<g class="bunt">' + bunting(84, 828, 272, 836, 12, 16, 'bulb1', null) + '</g>';
    // maleta
    s += '<g class="mcase"><circle class="case-glow" cx="180" cy="896" r="26" fill="url(#' + p + 'glow)"/>' +
      '<g class="case-closed"><rect x="166" y="890" width="30" height="20" rx="4" fill="#E05A6F"/><path d="M175 890 v-4 q0 -2 2 -2 h8 q2 0 2 2 v4" stroke="#9F263F" stroke-width="2" fill="none"/>' +
      '<path d="M173 890 v20 M189 890 v20" stroke="#9F263F" stroke-width="2"/><rect x="164" y="896" width="34" height="3" rx="1.4" fill="#C02C45"/></g>' +
      '<g class="case-open"><path d="M164 892 l4 -14 h26 l4 14z" fill="#F48FB1"/><rect x="166" y="890" width="30" height="20" rx="4" fill="#E05A6F"/>' +
      '<path d="' + spark(181, 876, 7) + '" fill="#FFE07A"/><path d="' + spark(170, 868, 4) + '" fill="#FFF3C4"/><path d="' + spark(193, 870, 4) + '" fill="#FFF3C4"/></g></g>';
    // palomas (secreto)
    s += '<g class="secret" data-secret="paloma"><g class="doves">' +
      [[230, 906, 1], [250, 914, -1]].map(function (q, k2) {
        return '<g transform="translate(' + q[0] + ' ' + q[1] + ') scale(' + q[2] + ' 1)"><g class="dove dv' + k2 + '"><ellipse cx="0" cy="0" rx="7" ry="5" fill="#E9DDE3"/><circle cx="6" cy="-4" r="3.4" fill="#E9DDE3"/>' +
          '<path d="M9 -4 l3 1 -3 1z" fill="#F5A97F"/><circle cx="6.6" cy="-4.6" r=".8" fill="#402435"/><path d="M-6 -1 q-5 0 -6 3 q4 1 6 -1z" fill="#C9B6C0"/><path d="M-2 -3 q2 -4 6 -2" stroke="#C9B6C0" stroke-width="1.6" fill="none"/>' +
          '<path d="M-1 5 v2 M2 5 v2" stroke="#F5A97F" stroke-width="1"/></g></g>';
      }).join('') + '</g><circle cx="240" cy="908" r="24" fill="transparent"/></g>';
    // carrito de helados (secreto)
    s += '<g class="secret" data-secret="helado"><g class="cart"><path d="M344 936 q20 -16 40 0z" fill="#D9364F"/><path d="M350 936 q14 -10 28 0" stroke="#FFF4EC" stroke-width="3" fill="none"/><path d="M364 936 V950" stroke="#8E5A6E" stroke-width="1.6"/>' +
      '<rect x="346" y="950" width="36" height="24" rx="4" fill="#FFF6EC"/><rect x="346" y="950" width="36" height="6" rx="3" fill="#F48FB1"/>' +
      '<path d="M360 958 l4 10 4 -10z" fill="#E8B26A"/><circle cx="364" cy="957" r="4" fill="#F48FB1"/>' +
      '<circle cx="352" cy="976" r="4" fill="#5B3249"/><circle cx="376" cy="976" r="4" fill="#5B3249"/>' +
      '<g class="cone"><path d="M360 940 l4 12 4 -12z" fill="#E8B26A"/><circle cx="364" cy="938" r="5" fill="#FFF3C4"/><circle cx="364" cy="932" r="4.4" fill="#F48FB1"/></g>' +
      '</g><circle cx="364" cy="958" r="28" fill="transparent"/></g>';

    // Camino
    var pts = M.pts;
    var full = smooth(pts, 0, pts.length - 1);
    s += '<g class="mpath">' +
      '<path d="' + full + '" fill="none" stroke="#EBC3B8" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + full + '" fill="none" stroke="#FFF4EA" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + full + '" fill="none" stroke="#F0A9A0" stroke-width="2.6" stroke-linecap="round" stroke-dasharray=".1 9"/>' +
      '</g>';
    var legs = [[0, 2], [2, 5], [5, 8], [8, 11]];
    s += '<g class="mlegs">' + legs.map(function (l, i4) {
      return '<path class="leg leg' + (i4 + 1) + '" d="' + smooth(pts, l[0], l[1]) + '" fill="none" stroke="#F5C77E" stroke-width="4.6" stroke-linecap="round" stroke-dasharray="1 9"/>';
    }).join('') + '</g>';
    s += '<g transform="translate(232 996)"><path d="M0 0 V-22" stroke="#8E5A5A" stroke-width="3"/><rect x="-22" y="-36" width="44" height="17" rx="5" fill="#FFF4EA" stroke="#C99A86" stroke-width="1.6"/>' +
      '<text x="0" y="-23.4" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="600" font-size="10.5" fill="#8A4A60">Inicio</text></g>';

    // Niebla sobre lugares bloqueados
    function fog(cls, list) {
      return '<g class="fog ' + cls + '">' + list.map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="url(#' + p + 'fog)"/>'; }).join('') + '</g>';
    }
    s += fog('fog1', [[60, 860, 58], [150, 900, 52], [240, 880, 54], [330, 860, 56], [100, 960, 48], [300, 960, 52]]);
    s += fog('fog2', [[290, 690, 64], [350, 640, 54], [250, 740, 46], [360, 730, 52]]);
    s += fog('fog3', [[70, 520, 56], [130, 510, 52], [40, 580, 44], [130, 590, 46], [80, 620, 40]]);
    s += fog('fog4', [[160, 300, 58], [240, 300, 58], [200, 260, 54], [200, 350, 60], [120, 330, 40], [280, 330, 40]]);
    // Pétalos que caen
    var PR = rng(29), pe = '';
    for (var q2 = 0; q2 < 18; q2++) {
      var ex = r1(10 + PR() * 380), ey = r1(470 + PR() * 500), sc = r1(0.7 + PR() * 0.7);
      pe += '<g transform="translate(' + ex + ' ' + ey + ') scale(' + sc + ')"><path class="petal pe' + (q2 % 6) + '" d="M0 -3.4 Q3.4 -1 0 3.4 Q-3.4 -1 0 -3.4Z" fill="' + ['#F7AECB', '#FFD6E5', '#F48FB1'][q2 % 3] + '"/></g>';
    }
    s += '<g class="petals">' + pe + '</g>';
    return s + '</svg>';
  };

  /* ---------- La plaza al borde del bosque rosa (360 × 400) ---------- */
  ART.plaza = function (p) {
    var R = rng(11);
    var s = '<defs>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2A3BE"/><stop offset=".55" stop-color="#FFC6C2"/><stop offset="1" stop-color="#FFE2C8"/></linearGradient>' +
      '<linearGradient id="' + p + 'fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8E2D6"/><stop offset="1" stop-color="#EFD0C2"/></linearGradient>' +
      '<radialGradient id="' + p + 'sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF7DE" stop-opacity=".95"/><stop offset="1" stop-color="#FFF7DE" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset=".4" stop-color="#FFD978" stop-opacity=".45"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    s += '<rect width="360" height="400" fill="url(#' + p + 'sky)"/>';
    s += '<circle cx="300" cy="54" r="60" fill="url(#' + p + 'sun)"/><circle cx="300" cy="54" r="17" fill="#FFF0D2"/>';
    s += cloud(70, 40, 0.6, '#FFF0F4', '#EBB6CB') + cloud(210, 26, 0.45, '#FFF0F4', '#EBB6CB');
    // el bosque asoma por detrás de los tejados
    s += blossomTree(140, 104, 0.62, 2) + blossomTree(166, 100, 0.5, 0) + blossomTree(324, 104, 0.58, 1);
    // edificios
    s += '<rect x="-4" y="76" width="94" height="180" fill="#F7B3C4"/><path d="M-8 80 L42 50 L94 80Z" fill="#D9364F"/><rect x="-8" y="76" width="102" height="6" fill="#9F263F"/>';
    s += '<rect x="90" y="96" width="90" height="160" fill="#FFD9C4"/><rect x="86" y="88" width="98" height="10" rx="2" fill="#F2A98F"/>';
    s += '<rect x="180" y="62" width="94" height="194" fill="#FBD3DF"/><path d="M176 66 L227 40 L278 66Z" fill="#E8667E"/><rect x="176" y="62" width="102" height="6" fill="#C24D6A"/>';
    s += '<circle cx="227" cy="88" r="12" fill="#FFF8F1" stroke="#C24D6A" stroke-width="2.4"/><path d="M227 80 V88 L233 91" stroke="#5B3249" stroke-width="2" fill="none" stroke-linecap="round"/>';
    s += '<rect x="274" y="92" width="90" height="164" fill="#FFF0E2"/><path d="M270 96 L318 70 L366 96Z" fill="#D9364F"/><rect x="270" y="92" width="96" height="6" fill="#9F263F"/>';
    // ventanas
    [[12, 108], [50, 108], [12, 158], [50, 158]].forEach(function (q) { s += windowRect(q[0], q[1], 24, 30, 'pw', '#FFD6E5'); });
    s += '<rect x="8" y="136" width="32" height="6" rx="2" fill="#B9786A"/>' + flower(16, 135, 0.8, '#F48FB1', '#FFE07A') + flower(26, 135, 0.8, '#FFD25E', '#F29A2E') + flower(35, 135, 0.8, '#FFFFFF', '#F5C77E');
    [[102, 118], [142, 118]].forEach(function (q) { s += windowRect(q[0], q[1], 26, 32, 'pw', null); });
    s += '<rect x="96" y="150" width="78" height="5" rx="2" fill="#FFF8F1"/><path d="M98 155 v14 M108 155 v14 M118 155 v14 M128 155 v14 M138 155 v14 M148 155 v14 M158 155 v14 M168 155 v14 M96 169 h78" stroke="#9F263F" stroke-width="1.6"/>';
    [[194, 112], [234, 112], [194, 160], [234, 160]].forEach(function (q) { s += windowRect(q[0], q[1], 26, 30, 'pw', '#FFD6E5'); });
    [[288, 112], [326, 112], [288, 160], [326, 160]].forEach(function (q) {
      s += windowRect(q[0], q[1], 22, 28, 'pw', null) + '<rect x="' + (q[0] - 7) + '" y="' + q[1] + '" width="6" height="28" rx="1.4" fill="#E8667E"/><rect x="' + (q[0] + 23) + '" y="' + q[1] + '" width="6" height="28" rx="1.4" fill="#E8667E"/>';
    });
    // soportales
    s += '<rect x="-4" y="204" width="368" height="6" fill="#FFF6EE" opacity=".7"/>';
    for (var a = 0; a < 9; a++) {
      var ax = 4 + a * 40;
      s += '<path d="M' + ax + ' 256 V228 A16 16 0 0 1 ' + (ax + 32) + ' 228 V256Z" fill="#8A3F60" opacity=".3"/>';
    }
    // banderines
    s += bunting(0, 172, 360, 160, 14, 22, 'pbulb', p + 'gl');
    // suelo
    s += '<rect x="0" y="252" width="360" height="148" fill="url(#' + p + 'fl)"/>';
    s += '<path d="M0 252 H360" stroke="#E6C2B4" stroke-width="2.4"/>';
    for (var row = 0; row < 7; row++) {
      var y = 266 + row * 20, sp = 20 + row * 3;
      for (var x = -10 + (row % 2) * sp / 2; x < 370; x += sp) s += '<path d="M' + r1(x) + ' ' + y + ' q' + r1(sp / 2 - 2) + ' -4 ' + r1(sp - 4) + ' 0" stroke="#E6C2B4" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>';
    }
    // farola
    s += '<g transform="translate(54 334)"><ellipse cx="0" cy="2" rx="14" ry="3.6" fill="#3A1E30" opacity=".1"/><rect x="-6" y="-8" width="12" height="9" rx="2" fill="#5B3249"/><rect x="-2.4" y="-132" width="4.8" height="126" rx="2" fill="#5B3249"/>' +
      '<circle cx="0" cy="-142" r="22" fill="url(#' + p + 'gl)"/><path d="M-9 -132 h18 l-4 -16 h-10z" fill="#5B3249"/><path d="M-6 -134 h12 l-3 -11 h-6z" fill="#FFE7A8"/><path d="M-6 -149 q6 -6 12 0z" fill="#4A2A3D"/></g>';
    // fuente
    s += '<g transform="translate(180 312)"><ellipse cx="0" cy="10" rx="70" ry="16" fill="#3A1E30" opacity=".08"/>' +
      '<ellipse cx="0" cy="4" rx="64" ry="16" fill="#F1DCD9"/><ellipse cx="0" cy="0" rx="60" ry="14" fill="#FFF4EC"/><ellipse cx="0" cy="0" rx="50" ry="10" fill="#CBDDF4"/>' +
      '<path d="M-36 2 q8 -3 16 0 M14 4 q8 -3 16 0" stroke="#EEF4FF" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<rect x="-8" y="-48" width="16" height="48" rx="5" fill="#FFF4EC"/><ellipse cx="0" cy="-48" rx="24" ry="6" fill="#F1DCD9"/><ellipse cx="0" cy="-50" rx="19" ry="4.4" fill="#CBDDF4"/>' +
      '<path class="fs-water" d="M0 -56 Q-14 -76 -30 -6 M0 -56 Q14 -76 30 -6" stroke="#EEF4FF" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<rect x="-2.4" y="-60" width="4.8" height="8" rx="2" fill="#F1DCD9"/></g>';
    // café con sombrilla
    s += '<g transform="translate(92 356)"><ellipse cx="0" cy="8" rx="24" ry="4" fill="#3A1E30" opacity=".08"/><path d="M0 -10 V8" stroke="#8E5A6E" stroke-width="2.4"/><ellipse cx="0" cy="-12" rx="20" ry="5" fill="#FFF8F1"/>' +
      '<path d="M0 -12 V-54" stroke="#8E5A6E" stroke-width="2"/><path d="M-30 -48 Q0 -70 30 -48 Z" fill="#D9364F"/><path d="M-10 -48 Q0 -66 10 -48Z" fill="#FFF4EC"/><path d="M-30 -48 q5 4 10 0 q5 4 10 0 q5 4 10 0 q5 4 10 0 q5 4 10 0 q5 4 10 0" fill="#D9364F"/>' +
      '<path d="M-26 -2 v12 M-30 -6 v16 M26 -2 v12 M30 -6 v16" stroke="#8E5A6E" stroke-width="1.8"/><path d="M-32 -6 h8 M24 -6 h8" stroke="#8E5A6E" stroke-width="2"/></g>';
    // banco
    s += '<g transform="translate(300 336)"><ellipse cx="0" cy="12" rx="34" ry="4" fill="#3A1E30" opacity=".08"/><rect x="-32" y="-14" width="64" height="6" rx="3" fill="#C69E89"/><rect x="-32" y="-2" width="64" height="6" rx="3" fill="#B58C78"/>' +
      '<path d="M-26 4 V12 M26 4 V12 M-26 -8 V-2 M26 -8 V-2" stroke="#8E6B5E" stroke-width="3.4"/></g>';
    // macetas
    s += '<g transform="translate(24 370)"><path d="M-14 -16 h28 l-4 22 h-20z" fill="#E8957F"/><rect x="-16" y="-20" width="32" height="6" rx="2" fill="#D9806C"/>' + roseBush(0, -20, 0.6) + '</g>';
    s += '<g transform="translate(338 374)"><path d="M-14 -16 h28 l-4 22 h-20z" fill="#F48FB1"/><rect x="-16" y="-20" width="32" height="6" rx="2" fill="#E8678C"/>' + roseBush(0, -20, 0.6) + '</g>';
    // palomas
    s += [[244, 380, 1], [266, 386, -1]].map(function (q) {
      return '<g transform="translate(' + q[0] + ' ' + q[1] + ') scale(' + q[2] + ' 1)"><ellipse cx="0" cy="0" rx="8" ry="5.6" fill="#E9DDE3"/><circle cx="7" cy="-4.6" r="3.8" fill="#E9DDE3"/><path d="M10.4 -4.6 l3.2 1 -3.2 1z" fill="#F5A97F"/><circle cx="7.6" cy="-5.2" r=".9" fill="#402435"/><path d="M-7 -1 q-6 0 -7 3 q5 1 7 -1z" fill="#C9B6C0"/><path d="M-1 6 v2 M2 6 v2" stroke="#F5A97F" stroke-width="1.2"/></g>';
    }).join('');
    // pétalos en el aire
    for (var t = 0; t < 10; t++) s += '<circle class="tw" style="animation-delay:' + r1(R() * 3) + 's" cx="' + r1(R() * 360) + '" cy="' + r1(R() * 60) + '" r="' + r1(0.5 + R() * 0.8) + '" fill="#FFF8E8" opacity=".8"/>';
    for (var q2 = 0; q2 < 7; q2++) s += '<path transform="translate(' + r1(20 + R() * 320) + ' ' + r1(200 + R() * 60) + ') rotate(' + r1(R() * 180) + ')" d="M0 -3 Q3 -1 0 3 Q-3 -1 0 -3Z" fill="#F7AECB" opacity=".9"/>';
    return s;
  };

  /* ---------- Luces de la tiendita: muro con cartel (300 × 440) ---------- */
  ART.luces = function (p) {
    var s = '<defs>' +
      '<linearGradient id="' + p + 'wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1830"/><stop offset="1" stop-color="#5E2442"/></linearGradient>' +
      '<linearGradient id="' + p + 'stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DEE3"/><stop offset="1" stop-color="#DDB3BE"/></linearGradient>' +
      '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD0E6" stop-opacity=".95"/><stop offset=".45" stop-color="#FF5F8E" stop-opacity=".38"/><stop offset="1" stop-color="#FF5F8E" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'yg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF5C8" stop-opacity="1"/><stop offset=".35" stop-color="#FFD978" stop-opacity=".6"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    s += '<rect width="300" height="440" fill="url(#' + p + 'wall)"/>';
    for (var r = 0; r < 22; r++) {
      var y = 4 + r * 20;
      for (var x = (r % 2) * -20; x < 300; x += 40) s += '<rect x="' + (x + 2) + '" y="' + y + '" width="36" height="16" rx="3" fill="#ffffff" opacity=".045"/>';
    }
    // guirnalda
    s += '<path d="' + catenary(-6, 14, 306, 18, 9) + '" stroke="#2A1222" stroke-width="1.6" fill="none"/>';
    for (var i = 1; i < 12; i++) {
      var q = onCat(-6, 14, 306, 18, 9, i / 12);
      s += '<circle class="lg-bulbhalo" cx="' + q[0] + '" cy="' + (q[1] + 5) + '" r="9" fill="url(#' + p + 'yg)"/><path d="M' + q[0] + ' ' + q[1] + ' v3" stroke="#2A1222" stroke-width="1.4"/><circle class="lg-bulb" cx="' + q[0] + '" cy="' + (q[1] + 6) + '" r="3.4" fill="#8A5A73"/>';
    }
    // cartel
    s += '<circle class="lg-halo" cx="150" cy="98" r="130" fill="url(#' + p + 'glow)"/>';
    s += '<rect x="34" y="44" width="232" height="112" rx="22" fill="#2A1222" stroke="#7E3A5C" stroke-width="3"/>';
    s += '<circle cx="46" cy="56" r="3" fill="#7E3A5C"/><circle cx="254" cy="56" r="3" fill="#7E3A5C"/><circle cx="46" cy="144" r="3" fill="#7E3A5C"/><circle cx="254" cy="144" r="3" fill="#7E3A5C"/>';
    var heart = heartPath(150, 82, 22);
    s += '<g class="neon-on"><path d="' + heart + '" fill="none" stroke="#FF4F86" stroke-width="14" opacity=".28"/><path d="' + heart + '" fill="none" stroke="#FF7FB0" stroke-width="7" opacity=".55"/></g>';
    s += '<path class="neon-tube" d="' + heart + '" fill="none" stroke="#7E5A70" stroke-width="4.6" stroke-linecap="round"/>';
    s += '<path class="neon-core" d="' + heart + '" fill="none" stroke="#FFE3F0" stroke-width="1.6" opacity="0"/>';
    var txt = '<text x="150" y="141" text-anchor="middle" font-family="Caveat, \'Bradley Hand\', cursive" font-weight="700" font-size="40"';
    s += '<g class="neon-on">' + txt + ' fill="none" stroke="#FF4F86" stroke-width="9" opacity=".25">mimimimi</text>' + txt + ' fill="none" stroke="#FF8FB8" stroke-width="4" opacity=".55">mimimimi</text></g>';
    s += txt + ' class="neon-text" fill="#7E5A70">mimimimi</text>';
    // cable hacia el cartel
    s += '<path d="M110 196 V168 Q110 160 118 158" stroke="#2A1222" stroke-width="7" fill="none" stroke-linecap="round"/>';
    s += '<path class="lg-riser" d="M110 214 V168 Q110 160 118 158" stroke="#FFD86A" stroke-width="3.4" stroke-linecap="round" fill="none" opacity="0"/>';
    // tablero
    s += '<rect x="48" y="200" width="224" height="222" rx="22" fill="#7E3A5C"/>';
    s += '<rect x="52" y="204" width="216" height="214" rx="19" fill="url(#' + p + 'stone)"/>';
    s += '<rect x="58" y="208" width="204" height="204" rx="16" fill="#5E2A47" opacity=".5"/>';
    s += '<rect x="102" y="194" width="16" height="18" rx="4" fill="#4A1E36"/><path class="lg-exit" d="M110 210 V196" stroke="#FFD86A" stroke-width="6" stroke-linecap="round" opacity="0"/>';
    // enchufe
    s += '<path d="M24 360 H62" stroke="#2A1222" stroke-width="12" stroke-linecap="round"/><path d="M26 360 H62" stroke="#FFD86A" stroke-width="5" stroke-linecap="round"/>';
    s += '<circle class="lg-gemglow" cx="18" cy="360" r="24" fill="url(#' + p + 'yg)"/>';
    s += '<rect x="2" y="340" width="26" height="40" rx="7" fill="#FFF4EC"/><rect x="6" y="344" width="18" height="32" rx="5" fill="#F1DCD9"/>' +
      '<circle cx="12" cy="356" r="2" fill="#5B3249"/><circle cx="18" cy="356" r="2" fill="#5B3249"/>' +
      '<rect x="10" y="362" width="12" height="9" rx="2.4" fill="#F48FB1"/>' +
      '<path d="' + spark(15, 336, 5) + '" fill="#FFE07A"/>';
    return s;
  };

  /* Pieza del camino de luz (100 × 100) */
  ART.tile = function (type, p) {
    var groove = type === 'straight' ? 'M0 50 H100' : 'M0 50 Q50 50 50 0';
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="' + p + 't" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#FFF2F5"/><stop offset="1" stop-color="#F2CBD6"/></radialGradient></defs>' +
      '<rect x="4" y="4" width="92" height="92" rx="16" fill="url(#' + p + 't)"/>' +
      '<rect x="4" y="4" width="92" height="92" rx="16" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="2"/>' +
      '<circle cx="14" cy="14" r="2.6" fill="#E6A9BB"/><circle cx="86" cy="14" r="2.6" fill="#E6A9BB"/><circle cx="14" cy="86" r="2.6" fill="#E6A9BB"/><circle cx="86" cy="86" r="2.6" fill="#E6A9BB"/>' +
      '<path d="' + groove + '" stroke="#7E3A5C" stroke-width="22" fill="none" stroke-linecap="butt"/>' +
      '<path d="' + groove + '" stroke="#4A1E36" stroke-width="14" fill="none" stroke-linecap="butt"/>' +
      '<path class="tile-light" d="' + groove + '" stroke="#FFD86A" stroke-width="8" fill="none" stroke-linecap="butt" pathLength="100"/>' +
      '</svg>';
  };

  /* ---------- Fachada de la tiendita (300 × 200) ---------- */
  ART.shopFront = function (p) {
    var s = '<defs><linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A1C3C"/><stop offset=".65" stop-color="#B8476A"/><stop offset="1" stop-color="#F29A8E"/></linearGradient>' +
      '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD0E6" stop-opacity=".9"/><stop offset=".45" stop-color="#FF6F9E" stop-opacity=".38"/><stop offset="1" stop-color="#FF6F9E" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'yg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset=".4" stop-color="#FFD978" stop-opacity=".45"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="300" height="200" fill="url(#' + p + 'sky)"/>';
    var R = rng(4);
    for (var i = 0; i < 16; i++) s += '<circle class="tw" style="animation-delay:' + r1(R() * 3) + 's" cx="' + r1(R() * 300) + '" cy="' + r1(R() * 60) + '" r="' + r1(0.6 + R()) + '" fill="#FFF0E0"/>';
    s += blossomTree(26, 182, 0.75, 1) + blossomTree(278, 184, 0.7, 0);
    s += '<rect x="0" y="176" width="300" height="24" fill="#F3D6CA"/><path d="M0 176 H300" stroke="#E2B9AA" stroke-width="2"/>';
    s += '<rect x="56" y="70" width="188" height="108" fill="#FFE6DA"/><rect x="236" y="70" width="10" height="108" fill="#F2C9B6"/><rect x="48" y="60" width="204" height="14" rx="3" fill="#F48FB1"/>';
    s += '<circle class="bn-halo" cx="150" cy="38" r="80" fill="url(#' + p + 'glow)"/>';
    s += '<path d="M78 60 V48 M222 60 V48" stroke="#5B3249" stroke-width="2.4"/><rect x="70" y="14" width="160" height="38" rx="12" fill="#2E1428"/>';
    s += '<path class="bn-neon" d="' + heartPath(96, 32, 9) + '" fill="none" stroke="#8A5A73" stroke-width="3"/>';
    s += '<text class="bn-neon-t" x="164" y="42" text-anchor="middle" font-family="Caveat, \'Bradley Hand\', cursive" font-weight="700" font-size="26" fill="#8A5A73">mimimimi</text>';
    s += '<rect x="112" y="78" width="76" height="18" rx="9" fill="#fff"/><text x="150" y="91.6" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="12" letter-spacing="1.4" fill="#D9364F">SÚPER</text>';
    for (var k = 0; k < 13; k++) s += '<rect x="' + (52 + k * 15.6) + '" y="100" width="15.6" height="18" fill="' + (k % 2 ? '#FFF4EC' : '#D9364F') + '"/><circle cx="' + r1(59.8 + k * 15.6) + '" cy="118" r="7.8" fill="' + (k % 2 ? '#FFF4EC' : '#D9364F') + '"/>';
    s += '<rect x="66" y="132" width="104" height="44" rx="4" fill="#FFF8F1"/><rect class="bn-win" x="70" y="136" width="96" height="36" rx="3" fill="#D7B2C2"/>';
    s += '<path d="M70 148 h96 M70 160 h96" stroke="#B98AA0" stroke-width="1.6"/>';
    [[78, 145, '#E8485F'], [86, 145, '#FFD25E'], [94, 145, '#9DBF96'], [110, 145, '#E8485F'], [120, 145, '#FFD25E'], [80, 157, '#E8B26A'], [90, 157, '#E8B26A'], [116, 157, '#F48FB1'], [128, 157, '#D9364F'], [146, 145, '#9DBF96'], [152, 157, '#E8B26A'], [140, 157, '#FFD25E']].forEach(function (q) {
      s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.2" fill="' + q[2] + '"/>';
    });
    s += '<rect x="186" y="128" width="42" height="48" rx="4" fill="#9C5A78"/><rect class="bn-win" x="191" y="134" width="32" height="22" rx="3" fill="#D7B2C2"/><circle cx="220" cy="160" r="2.2" fill="#F5C77E"/>';
    s += '<g class="bn-bulbs">' + bunting(0, 92, 52, 104, 6, 6, 'bnb', p + 'yg') + bunting(248, 104, 300, 92, 6, 6, 'bnb', p + 'yg') + '</g>';
    return s;
  };

  /* ---------- Interior de la tiendita (360 × 330) ---------- */
  ART.shopInside = function (p) {
    var s = '<defs><linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4EC"/><stop offset="1" stop-color="#FDE3D9"/></linearGradient></defs>';
    s += '<rect width="360" height="330" fill="url(#' + p + 'w)"/>';
    for (var i = 0; i < 12; i++) s += '<rect x="' + (i * 32) + '" y="0" width="14" height="330" fill="#FFD6E5" opacity=".32"/>';
    // cartel
    s += '<rect x="112" y="10" width="136" height="34" rx="17" fill="#D9364F"/><rect x="116" y="14" width="128" height="26" rx="13" fill="#FFF8F1"/>';
    s += '<text x="180" y="33" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="17" letter-spacing="2" fill="#D9364F">SÚPER</text>';
    s += '<path d="' + heartPath(130, 26, 4.4) + '" fill="#F48FB1"/><path d="' + heartPath(230, 26, 4.4) + '" fill="#F48FB1"/>';
    // cartel de abierto (gira al terminar)
    s += '<g class="open-sign"><path d="M318 10 V20" stroke="#8E5A6E" stroke-width="1.4"/><g class="open-card"><rect x="294" y="20" width="48" height="20" rx="5" fill="#8C5A76"/>' +
      '<text class="os-closed" x="318" y="34" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="10" fill="#fff">Cerrado</text>' +
      '<text class="os-open" x="318" y="34" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="10" fill="#fff">Abierto</text></g></g>';
    // baldas
    var names = ['Fruta', 'Panadería', 'Merienda'];
    [0, 1, 2].forEach(function (k) {
      var y = 108 + k * 80;
      s += '<rect x="22" y="' + (y - 54) + '" width="316" height="58" rx="10" fill="#FFFFFF" opacity=".5"/>';
      s += '<rect x="18" y="' + y + '" width="324" height="11" rx="4" fill="#D9A982"/><rect x="18" y="' + (y + 8) + '" width="324" height="4" rx="2" fill="#B88A74"/>';
      s += '<path d="M40 ' + (y + 11) + ' v8 M320 ' + (y + 11) + ' v8" stroke="#B88A74" stroke-width="4" stroke-linecap="round"/>';
      s += '<g transform="translate(70 ' + (y - 28) + ')"><rect x="-44" y="-12" width="88" height="24" rx="8" fill="' + ['#FFE3EA', '#FFF1C9', '#FBE3EC'][k] + '" stroke="' + ['#F48FB1', '#F5C77E', '#E8678C'][k] + '" stroke-width="2"/>' +
        '<text x="0" y="5.6" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="600" font-size="14" fill="#6E4A5E">' + names[k] + '</text></g>';
    });
    // mostrador
    s += '<rect x="0" y="292" width="360" height="38" fill="#E8C3A8"/><rect x="0" y="288" width="360" height="8" rx="3" fill="#D9A982"/>';
    s += '<g transform="translate(318 300)"><rect x="-22" y="-4" width="44" height="22" rx="4" fill="#E8678C"/><rect x="-16" y="-20" width="30" height="16" rx="3" fill="#9F263F"/>' +
      '<rect class="till-screen" x="-12" y="-17" width="22" height="9" rx="2" fill="#2E1428"/><text class="till-txt" x="-1" y="-10" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="6.4" fill="#FFE07A">¡GRACIAS!</text>' +
      '<circle cx="-12" cy="5" r="2" fill="#fff"/><circle cx="-5" cy="5" r="2" fill="#fff"/><circle cx="2" cy="5" r="2" fill="#fff"/><circle cx="9" cy="5" r="2" fill="#F5C77E"/></g>';
    return s;
  };

  /* ---------- El rincón (360 × 300) ---------- */
  ART.room = function (p) {
    var s = '<defs><linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBDDE6"/><stop offset="1" stop-color="#F4CDD9"/></linearGradient>' +
      '<linearGradient id="' + p + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1830"/><stop offset="1" stop-color="#8A2C4F"/></linearGradient>' +
      '<radialGradient id="' + p + 'lamp" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset=".45" stop-color="#FFD978" stop-opacity=".35"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'tv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7A8C4"/><stop offset="1" stop-color="#F5C77E"/></linearGradient></defs>';
    s += '<rect width="360" height="300" fill="url(#' + p + 'w)"/>';
    for (var r = 0; r < 7; r++) for (var c = 0; c < 12; c++) s += '<path d="' + heartPath(14 + c * 30 + (r % 2) * 15, 14 + r * 28, 2) + '" fill="#FFFFFF" opacity=".5"/>';
    s += '<circle class="rm-glow" cx="236" cy="156" r="120" fill="url(#' + p + 'lamp)"/>';
    // ventana
    s += '<rect x="22" y="22" width="86" height="84" rx="8" fill="#FFF8F1"/><rect x="28" y="28" width="74" height="72" rx="5" fill="url(#' + p + 'n)"/>';
    s += '<circle cx="82" cy="46" r="9" fill="#FFEFD9"/><circle cx="78" cy="43" r="2" fill="#F5D9C2"/>';
    [[40, 40], [56, 60], [44, 80], [70, 74], [92, 86], [60, 36]].forEach(function (q) { s += '<circle class="tw" cx="' + q[0] + '" cy="' + q[1] + '" r="1.2" fill="#FFF0E0"/>'; });
    s += '<path d="M65 28 V100 M28 64 H102" stroke="#FFF8F1" stroke-width="3"/>';
    s += '<path d="M18 18 h30 q-10 40 -26 92 h-4z" fill="#F48FB1"/><path d="M112 18 h-30 q10 40 26 92 h4z" fill="#F48FB1"/><rect x="14" y="14" width="102" height="6" rx="3" fill="#C69E89"/>';
    s += '<g class="win-lights">' + [24, 36, 48, 60, 72, 84, 96, 108].map(function (x, k) { return '<circle cx="' + x + '" cy="' + (22 + (k % 2) * 3) + '" r="2.2" fill="#EBD7DC"/>'; }).join('') + '</g>';
    // cuadro
    s += '<rect x="262" y="34" width="56" height="44" rx="4" fill="#FFF8F1" stroke="#C69E89" stroke-width="3"/><path d="' + heartPath(290, 56, 9) + '" fill="#D9364F"/>';
    // suelo y alfombra
    s += '<rect x="0" y="214" width="360" height="86" fill="#EBC9B2"/>';
    for (var k = 0; k < 4; k++) s += '<path d="M0 ' + (232 + k * 20) + ' H360" stroke="#DDB89A" stroke-width="1.4"/>';
    s += '<ellipse cx="196" cy="264" rx="122" ry="26" fill="#F48FB1"/><ellipse cx="196" cy="264" rx="110" ry="20" fill="#F9C3D6"/>';
    s += '<ellipse cx="196" cy="264" rx="96" ry="15" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 5" opacity=".8"/>';
    // sofá
    s += '<ellipse cx="104" cy="230" rx="96" ry="8" fill="#3A1E30" opacity=".08"/>';
    s += '<rect x="26" y="128" width="160" height="62" rx="20" fill="#D9364F"/>';
    s += '<rect x="22" y="174" width="168" height="40" rx="14" fill="#E8556B"/><path d="M104 176 V212" stroke="#C02C45" stroke-width="2"/>';
    s += '<rect x="8" y="150" width="34" height="66" rx="16" fill="#B92B45"/><rect x="170" y="150" width="34" height="66" rx="16" fill="#B92B45"/>';
    s += '<path d="M30 214 v10 M180 214 v10" stroke="#8E6B5E" stroke-width="5" stroke-linecap="round"/>';
    // mesita auxiliar
    s += '<ellipse cx="234" cy="176" rx="22" ry="6" fill="#D9A982"/><path d="M234 180 V214 M224 214 h20" stroke="#B88A74" stroke-width="4" stroke-linecap="round"/>';
    // mesa baja
    s += '<rect x="148" y="222" width="122" height="12" rx="6" fill="#D9A982"/><rect x="148" y="230" width="122" height="6" rx="3" fill="#B88A74"/>';
    s += '<path d="M160 236 v18 M258 236 v18" stroke="#B88A74" stroke-width="5" stroke-linecap="round"/>';
    // mueble y tele
    s += '<rect x="262" y="178" width="88" height="48" rx="6" fill="#E6B9A6"/><path d="M306 182 V222 M266 200 H346" stroke="#D29E8A" stroke-width="2"/><circle cx="300" cy="192" r="1.8" fill="#8E6B5E"/><circle cx="312" cy="192" r="1.8" fill="#8E6B5E"/>';
    s += '<rect x="268" y="114" width="76" height="58" rx="7" fill="#5B3249"/><rect x="273" y="119" width="66" height="48" rx="4" fill="#2A1222"/>';
    s += '<g class="tv-on"><rect x="273" y="119" width="66" height="48" rx="4" fill="url(#' + p + 'tv)"/><path d="M299 131 v24 l20 -12z" fill="#fff" opacity=".9"/></g>';
    s += '<path d="M300 172 v6 M312 172 v6" stroke="#5B3249" stroke-width="3"/>';
    // vapor (al terminar)
    s += '<g class="rm-steam"><path d="M172 186 q-3 -5 0 -9 t0 -9 M184 184 q-3 -5 0 -9 t0 -9" stroke="#FFFFFF" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/></g>';
    return s;
  };
  // Destinos del rincón: [id, x, y, tamaño] en coordenadas de la escena
  ART.ROOM_SLOTS = [
    ['cojin', 66, 166, 46],
    ['manta', 138, 176, 50],
    ['lampara', 234, 148, 46],
    ['tazas', 180, 208, 40],
    ['palomitas', 232, 206, 42],
    ['mando', 304, 258, 42]
  ];

  /* ---------- Junto al agua (300 × 450): cuadro final y piezas ---------- */
  function lakeArt(p) {
    var R = rng(41), F = rng(77);
    var s = '<defs>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C24D6A"/><stop offset=".5" stop-color="#F08A8A"/><stop offset="1" stop-color="#FFD3B0"/></linearGradient>' +
      '<linearGradient id="' + p + 'lk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBC2AE"/><stop offset=".4" stop-color="#EE8C9D"/><stop offset="1" stop-color="#A9517A"/></linearGradient>' +
      '<linearGradient id="' + p + 'gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE4D4"/><stop offset="1" stop-color="#F6CDBF"/></linearGradient>' +
      '<radialGradient id="' + p + 'sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6D6"/><stop offset=".35" stop-color="#FFE3A0" stop-opacity=".75"/><stop offset="1" stop-color="#FFE3A0" stop-opacity="0"/></radialGradient>' +
      '</defs>';
    s += '<rect width="300" height="450" fill="url(#' + p + 'sky)"/>';
    s += '<circle class="lk-sunglow" cx="196" cy="186" r="96" fill="url(#' + p + 'sun)"/><circle cx="196" cy="186" r="25" fill="#FFEBC4"/>';
    s += '<g class="lk-clouds">' + cloud(64, 74, 0.62, '#FFE6EE', '#EFA3B8') + cloud(238, 50, 0.5, '#FFE6EE', '#EFA3B8') + cloud(150, 112, 0.36, '#FFE6EE', '#EFA3B8') + '</g>';
    s += '<path d="M104 92 q4 -4 8 0 q4 -4 8 0 M126 82 q3 -3 6 0 q3 -3 6 0" stroke="#6E1F3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    // montes y cortados
    s += '<path d="M0 200 Q50 168 100 182 Q150 196 190 190 Q240 176 300 190 V226 H0Z" fill="#B95A7E"/>';
    s += '<path d="M0 132 Q20 124 34 146 Q48 172 56 226 H0Z" fill="#8E3D62"/><path d="M6 150 q14 6 30 4 M4 172 q18 6 40 4 M6 196 q20 6 44 2" stroke="#B05A7E" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M300 126 Q276 136 266 162 Q258 190 254 226 H300Z" fill="#8E3D62"/><path d="M296 146 q-14 6 -28 6 M298 170 q-18 6 -36 6 M298 196 q-20 6 -42 4" stroke="#B05A7E" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    // faro pequeñito en el cortado
    s += '<circle cx="285" cy="100" r="16" fill="url(#' + p + 'sun)"/>' + lighthouse(285, 133, 30, { lit: true });
    s += '<path d="M0 214 Q60 198 120 208 Q180 216 230 206 Q270 200 300 208 V230 H0Z" fill="#D58AA3"/>';
    s += blossomTree(38, 222, 0.5, 0) + blossomTree(250, 222, 0.42, 1) + blossomTree(20, 226, 0.36, 2);
    // lago
    s += '<rect x="0" y="224" width="300" height="114" fill="url(#' + p + 'lk)"/>';
    s += '<path d="M0 225 H300" stroke="#FFE3D6" stroke-width="2" opacity=".8"/>';
    s += '<g class="lk-glint">' + [[196, 236, 30], [196, 248, 22], [196, 260, 34], [196, 274, 18], [196, 288, 26], [196, 304, 12]].map(function (q, k) {
      return '<path class="tw" style="animation-delay:' + (k * 0.35) + 's" d="M' + (q[0] - q[2] / 2) + ' ' + q[1] + ' h' + q[2] + '" stroke="#FFF2CC" stroke-width="2.6" stroke-linecap="round"/>';
    }).join('') + '</g>';
    s += '<g class="lk-waves"><path d="M30 252 q8 -4 16 0 t16 0 M86 282 q8 -4 16 0 t16 0 M226 300 q8 -4 16 0 t16 0 M250 260 q8 -4 16 0 M40 316 q8 -4 16 0 t16 0" stroke="#FFE6EE" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>';
    // barquita
    s += '<g class="lk-boat"><path d="M232 274 h34 l-6 8 h-22z" fill="#D9364F"/><path d="M237 274 q12 -3 24 0" stroke="#9F263F" stroke-width="1.4" fill="none"/></g>';
    // embarcadero
    s += '<path d="M118 340 L140 262 L160 262 L182 340Z" fill="#D8AE94"/>';
    for (var k = 0; k < 9; k++) {
      var y = 266 + k * 9, w0 = 10 + k * 2.5;
      s += '<path d="M' + r1(150 - w0) + ' ' + y + ' H' + r1(150 + w0) + '" stroke="#C0957A" stroke-width="1.4"/>';
    }
    s += '<path d="M140 262 L118 340 M160 262 L182 340" stroke="#A9806A" stroke-width="2.4"/>';
    [[142, 268, 10], [158, 268, 10], [134, 296, 14], [166, 296, 14], [124, 326, 18], [176, 326, 18]].forEach(function (q) {
      s += '<rect x="' + (q[0] - 2.2) + '" y="' + q[1] + '" width="4.4" height="' + q[2] + '" rx="1.6" fill="#8E5A5A"/>';
    });
    // orilla
    s += '<path d="M0 336 Q50 326 110 336 Q150 342 190 334 Q240 326 300 334 V450 H0Z" fill="url(#' + p + 'gr)"/>';
    s += '<path d="M0 337 Q50 327 110 337 Q150 343 190 335 Q240 327 300 335" stroke="#FFF1DE" stroke-width="4" fill="none" opacity=".9"/>';
    s += reeds(14, 342, 1.1) + reeds(34, 346, 0.9) + reeds(286, 342, 1.1);
    s += roseBush(52, 360, 0.8) + roseBush(270, 372, 0.9);
    // flores
    var fl = '';
    for (var f = 0; f < 34; f++) {
      var fx = r1(8 + F() * 284), fy = r1(352 + F() * 92);
      if (fx > 168 && fx < 252 && fy > 330) continue;
      var big = F() < 0.35, yel = F() < 0.72;
      var col = yel ? null : [['#FFFFFF', '#F5C77E'], ['#F48FB1', '#FFE07A'], ['#D9364F', '#FFD6E5']][f % 3];
      var inner = yel ? (big ? bigFlower(0, 0, 0.62, false) : yflower(0, 0, 1.3)) : flower(0, 0, 1.3, col[0], col[1]);
      fl += '<g transform="translate(' + fx + ' ' + fy + ')"><g class="lk-bl" style="transition-delay:' + (f * 45) + 'ms">' + inner + '</g></g>';
    }
    s += fl;
    [[60, 400], [130, 430], [180, 380], [24, 420], [104, 372]].forEach(function (q) { s += tuft(q[0], q[1], 1.5, '#86AE85'); });
    // la flor amarilla
    s += '<g class="hero"><path class="hero-stem" d="M206 452 Q200 420 210 392 Q216 376 212 360" stroke="#6E9A72" stroke-width="4" fill="none" stroke-linecap="round" pathLength="100"/>' +
      '<g transform="translate(204 412)"><g class="hero-leaf l1"><path d="M0 0 Q-20 -12 -28 -2 Q-14 8 0 4Z" fill="#86AE85"/></g></g>' +
      '<g transform="translate(210 396)"><g class="hero-leaf l2"><path d="M0 0 Q20 -14 28 -4 Q14 8 0 4Z" fill="#9DBF96"/></g></g>' +
      '<g transform="translate(212 352)"><g class="hero-head">' + bigFlower(0, 0, 1.9, false) + '</g></g></g>';
    // mariposas
    s += '<g transform="translate(92 300)"><g class="bfly"><path d="M0 0 C-7 -10 -14 -2 -7 2 C-12 7 -4 11 0 3 C4 11 12 7 7 2 C14 -2 7 -10 0 0Z" fill="#F48FB1"/></g></g>';
    s += '<g transform="translate(206 318)"><g class="bfly b2"><path d="M0 0 C-7 -10 -14 -2 -7 2 C-12 7 -4 11 0 3 C4 11 12 7 7 2 C14 -2 7 -10 0 0Z" fill="#D9364F"/></g></g>';
    for (var t = 0; t < 8; t++) s += '<path class="tw" style="animation-delay:' + r1(R() * 3) + 's" d="' + spark(r1(20 + R() * 260), r1(232 + R() * 96), r1(2 + R() * 2.4)) + '" fill="#FFFBEA"/>';
    return s;
  }
  ART.lakeSymbol = function () {
    return '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' +
      '<symbol id="lake-art" viewBox="0 0 300 450">' + lakeArt('lks') + '</symbol></svg>';
  };
  ART.lake = function (p) { return lakeArt(p); };

  /* ---------- Fondo del final, antes de abrir (400 × 800) ---------- */
  ART.finaleBg = function () {
    var p = uid('fb'), R = rng(31);
    var s = '<svg class="fin-bg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + p + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E0F1E"/><stop offset=".42" stop-color="#4B1E3E"/><stop offset=".56" stop-color="#A64566"/></linearGradient>' +
      '<linearGradient id="' + p + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C4A70"/><stop offset="1" stop-color="#3E1A35"/></linearGradient>' +
      '<radialGradient id="' + p + 'g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".9"/><stop offset=".4" stop-color="#FFD978" stop-opacity=".35"/><stop offset="1" stop-color="#FFD978" stop-opacity="0"/></radialGradient>' +
      '</defs><rect width="400" height="800" fill="url(#' + p + 'n)"/><g class="fin-stars">';
    for (var i = 0; i < 70; i++) s += '<circle class="tw" style="animation-delay:' + r1(R() * 4) + 's" cx="' + r1(R() * 400) + '" cy="' + r1(R() * 420) + '" r="' + r1(0.6 + R() * 1.5) + '" fill="#FFF0E0"/>';
    s += '</g><circle cx="318" cy="120" r="54" fill="url(#' + p + 'g)" opacity=".55"/><circle cx="318" cy="120" r="22" fill="#FFEFD9"/>';
    s += '<path d="M0 452 Q60 410 120 428 Q170 442 210 436 Q270 420 330 412 Q370 406 400 420 V470 H0Z" fill="#5E2442"/>';
    s += '<path d="M0 462 Q80 444 160 456 Q240 464 300 452 Q360 444 400 452 V480 H0Z" fill="#7A3358"/>';
    s += '<g transform="translate(0 0)">' + lighthouse(356, 446, 46, { lit: true }) + '</g><circle cx="356" cy="392" r="18" fill="url(#' + p + 'g)"/>';
    s += '<rect x="0" y="470" width="400" height="330" fill="url(#' + p + 'l)"/>';
    s += '<g>' + [[318, 486, 30], [318, 502, 22], [318, 520, 34], [318, 540, 16], [318, 562, 24]].map(function (q, k) {
      return '<path class="tw" style="animation-delay:' + (k * 0.4) + 's" d="M' + (q[0] - q[2] / 2) + ' ' + q[1] + ' h' + q[2] + '" stroke="#FFE6D2" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>';
    }).join('') + '</g>';
    s += '<path d="M150 800 L186 560 L214 560 L250 800Z" fill="#8C5A6A"/>';
    for (var k = 0; k < 12; k++) {
      var y = 572 + k * 20, w = 15 + k * 3.1;
      s += '<path d="M' + r1(200 - w) + ' ' + y + ' H' + r1(200 + w) + '" stroke="#6E4256" stroke-width="2"/>';
    }
    s += '<path d="M0 760 Q100 740 200 756 Q300 770 400 748 V800 H0Z" fill="#3E1A35"/>';
    return s + '</svg>';
  };

  /* ---------- Caja sorpresa (regalo o maleta) ---------- */
  ART.gift = function (kind) {
    var id = uid('gb');
    if (kind === 'maleta') {
      return '<svg class="gift gift--maleta" viewBox="0 0 160 170" aria-hidden="true" focusable="false"><defs>' +
        '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F48FB1"/><stop offset="1" stop-color="#D9364F"/></linearGradient>' +
        '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9B6CC"/><stop offset="1" stop-color="#E8678C"/></linearGradient></defs>' +
        '<ellipse class="gift__shadow" cx="80" cy="160" rx="58" ry="7.5" fill="#2A1222" opacity=".22"/>' +
        '<g class="gift__body"><rect x="22" y="78" width="116" height="78" rx="12" fill="url(#' + id + 'b)"/>' +
        '<rect x="22" y="78" width="116" height="10" fill="#6E1F3A" opacity=".16"/>' +
        '<rect x="44" y="78" width="10" height="78" fill="#9F263F"/><rect x="106" y="78" width="10" height="78" fill="#9F263F"/>' +
        '<rect x="42" y="118" width="14" height="10" rx="2" fill="#F5C77E"/><rect x="104" y="118" width="14" height="10" rx="2" fill="#F5C77E"/>' +
        '<circle cx="80" cy="128" r="11" fill="#FFF4EC"/><path d="' + heartPath(80, 128, 5.4) + '" fill="#D9364F"/>' +
        '<circle cx="128" cy="98" r="7" fill="#F5C77E"/><path d="' + spark(128, 98, 4.4) + '" fill="#fff"/>' +
        '<path d="M30 92 Q32 118 30 146" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round" fill="none"/></g>' +
        '<g class="gift__lid"><path d="M60 58 V46 Q60 38 68 38 H92 Q100 38 100 46 V58" stroke="#9F263F" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<rect x="18" y="56" width="124" height="28" rx="11" fill="url(#' + id + 'l)"/>' +
        '<rect x="42" y="56" width="14" height="28" fill="#9F263F"/><rect x="104" y="56" width="14" height="28" fill="#9F263F"/>' +
        '<rect x="74" y="74" width="12" height="9" rx="2" fill="#F5C77E"/>' +
        '<path d="M26 63 H38" stroke="#fff" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/></g>' +
        '</svg>';
    }
    return '<svg class="gift" viewBox="0 0 160 170" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7A8C4"/><stop offset="1" stop-color="#D9364F"/></linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC2D6"/><stop offset="1" stop-color="#E8678C"/></linearGradient>' +
      '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE7B0"/><stop offset=".5" stop-color="#F5C77E"/><stop offset="1" stop-color="#E0A04E"/></linearGradient>' +
      '</defs>' +
      '<ellipse class="gift__shadow" cx="80" cy="160" rx="54" ry="7.5" fill="#2A1222" opacity=".22"/>' +
      '<g class="gift__body"><rect x="28" y="74" width="104" height="82" rx="11" fill="url(#' + id + 'b)"/>' +
      '<rect x="28" y="74" width="104" height="12" fill="#6E1F3A" opacity=".14"/>' +
      '<rect x="70" y="74" width="20" height="82" fill="url(#' + id + 'r)"/>' +
      '<path d="M40 96 Q42 122 40 146" stroke="#fff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      '<path d="' + spark(112, 120, 7) + '" fill="#FFF6D8" opacity=".9"/><path d="' + spark(104, 140, 3.6) + '" fill="#FFF6D8" opacity=".8"/></g>' +
      '<g class="gift__lid"><rect x="20" y="54" width="120" height="26" rx="9" fill="url(#' + id + 'l)"/>' +
      '<rect x="68" y="54" width="24" height="26" fill="url(#' + id + 'r)"/>' +
      '<path d="M30 60 H58" stroke="#fff" stroke-opacity=".5" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M80 54 C62 22 36 32 50 50 C56 56 70 56 80 54Z" fill="url(#' + id + 'r)"/>' +
      '<path d="M80 54 C98 22 124 32 110 50 C104 56 90 56 80 54Z" fill="url(#' + id + 'r)"/>' +
      '<path d="M80 54 C70 38 56 34 54 44" stroke="#C98A2E" stroke-width="1.6" fill="none" opacity=".6"/>' +
      '<path d="M80 54 C90 38 104 34 106 44" stroke="#C98A2E" stroke-width="1.6" fill="none" opacity=".6"/>' +
      '<circle cx="80" cy="54" r="7" fill="#F5C77E"/><circle cx="78" cy="52" r="2.4" fill="#FFF0BC"/></g>' +
      '</svg>';
  };

  /* ---------- Paisaje de portada: el bosque rosa ---------- */
  ART.titleHills = function () {
    var s = '<svg class="title-hills" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">';
    s += '<path d="M0 176 Q80 132 170 154 Q262 176 332 136 Q372 114 400 124 V300 H0Z" fill="#A9446E"/>';
    // árboles del bosque en el horizonte
    [[22, 160, 0.42], [128, 150, 0.36], [214, 164, 0.4], [352, 128, 0.44], [392, 126, 0.32]].forEach(function (q, i) {
      s += '<g transform="translate(' + q[0] + ' ' + q[1] + ') scale(' + q[2] + ')"><path d="M-4 0 L-2.6 -30 L2.6 -30 L4 0Z" fill="#7A2E52"/><path d="' + fluff(0, -50, 24, 19, 11, 2, 0, 31 + i) + '" fill="#C2557F"/><ellipse cx="-7" cy="-60" rx="9" ry="6" fill="#DA7398" opacity=".8"/></g>';
    });
    // pueblecito
    var houses = [[34, 150, 26, 22], [62, 146, 22, 26], [88, 152, 24, 20], [292, 146, 24, 24], [318, 140, 20, 30], [342, 148, 26, 22]];
    houses.forEach(function (h, i) {
      s += '<rect x="' + h[0] + '" y="' + h[1] + '" width="' + h[2] + '" height="' + h[3] + '" fill="#8E2F55"/>' +
        '<path d="M' + (h[0] - 3) + ' ' + h[1] + ' L' + (h[0] + h[2] / 2) + ' ' + (h[1] - 12) + ' L' + (h[0] + h[2] + 3) + ' ' + h[1] + 'Z" fill="#8E2F55"/>' +
        '<rect class="t-win" style="animation-delay:' + (i * 0.7) + 's" x="' + (h[0] + h[2] / 2 - 3) + '" y="' + (h[1] + 6) + '" width="6" height="7" rx="1" fill="#FFE3A0"/>';
    });
    s += '<path d="M0 214 Q100 170 204 200 Q300 228 400 186 V300 H0Z" fill="#EE8FAE"/>';
    s += '<path d="M120 222 Q200 206 280 222 Q240 230 200 230 Q160 230 120 222Z" fill="#F7B8C8" opacity=".75"/>';
    s += '<path d="M0 252 Q120 216 232 244 Q320 266 400 238 V300 H0Z" fill="#FFDCCB"/>';
    var R = rng(3);
    for (var i = 0; i < 16; i++) {
      var c = [['#FFD25E', '#F29A2E'], ['#F48FB1', '#FFE07A'], ['#FFFFFF', '#F5C77E'], ['#D9364F', '#FFD6E5']][i % 4];
      s += flower(r1(20 + R() * 360), r1(262 + R() * 30), r1(0.9 + R() * 0.6), c[0], c[1]);
    }
    s += tuft(60, 268, 1.6, '#E2A7A0') + tuft(300, 262, 1.6, '#E2A7A0') + tuft(180, 284, 1.3, '#E2A7A0');
    return s + '</svg>';
  };

  /* ---------- Emblema del pase: bosque, faro, jardín y puerta (200 × 200) ----------
     Sin referencias externas: sirve igual en la página que dentro de una imagen. */
  ART.emblem = function (p) {
    p = p || uid('em');
    var s = '<defs>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9F263F"/><stop offset=".45" stop-color="#E8678C"/><stop offset=".8" stop-color="#F9B48F"/><stop offset="1" stop-color="#FFD9B8"/></linearGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7B0"/><stop offset=".5" stop-color="#F5C77E"/><stop offset="1" stop-color="#C98A3E"/></linearGradient>' +
      '<radialGradient id="' + p + 'd" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6DD"/><stop offset=".5" stop-color="#FFD6A0" stop-opacity=".7"/><stop offset="1" stop-color="#FFD6A0" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + p + 'c"><circle cx="100" cy="100" r="80"/></clipPath></defs>';
    s += '<circle cx="100" cy="100" r="97" fill="url(#' + p + 'r)"/><circle cx="100" cy="100" r="89" fill="#9F263F"/>';
    for (var i = 0; i < 36; i++) { var a = i * 10 * Math.PI / 180; s += '<circle cx="' + r1(100 + Math.cos(a) * 93) + '" cy="' + r1(100 + Math.sin(a) * 93) + '" r="1.3" fill="#FFF4EC" opacity=".8"/>'; }
    s += '<circle cx="100" cy="100" r="82" fill="none" stroke="#F5C77E" stroke-width="2"/>';
    s += '<g clip-path="url(#' + p + 'c)"><rect x="0" y="0" width="200" height="200" fill="url(#' + p + 's)"/>';
    // estrellas y sol
    s += '<path d="' + spark(62, 52, 3.4) + '" fill="#FFE3A6"/><path d="' + spark(140, 44, 2.6) + '" fill="#FFE3A6"/><path d="' + spark(100, 34, 2.2) + '" fill="#FFF4EC"/>';
    s += '<circle cx="100" cy="118" r="44" fill="url(#' + p + 'd)"/>';
    // agua
    s += '<rect x="0" y="122" width="200" height="30" fill="#E07A93"/><path d="M30 132 h18 M120 138 h22 M70 144 h14" stroke="#FFD6E5" stroke-width="2" stroke-linecap="round"/>';
    // faro a la derecha
    s += '<path d="M138 124 Q150 112 176 116 L200 120 V130 H136Z" fill="#6E1F3A"/>' + lighthouse(160, 118, 40, { lit: true });
    s += '<circle cx="160" cy="70" r="12" fill="url(#' + p + 'd)"/>';
    // árbol del bosque a la izquierda
    s += blossomTree(40, 132, 0.85, 1);
    // la puerta en el centro
    s += '<path d="M84 140 V104 A16 16 0 0 1 116 104 V140Z" fill="#F3E1D6"/><path d="M89 140 V106 A11 11 0 0 1 111 106 V140Z" fill="#FFE7B3"/>' +
      '<path d="M89 140 V106 A11 11 0 0 1 111 106 V140Z" fill="url(#' + p + 'd)"/><path d="' + heartPath(100, 94, 2.6) + '" fill="#D9364F"/>';
    // jardín delante
    s += '<path d="M0 150 Q50 140 100 146 Q150 152 200 142 V200 H0Z" fill="#FCE4D4"/>';
    var F = rng(55);
    for (var f = 0; f < 22; f++) {
      var col = [['#F48FB1', '#FFE07A'], ['#D9364F', '#FFD6E5'], ['#FFD25E', '#F29A2E'], ['#FFFFFF', '#F5C77E']][f % 4];
      s += flower(r1(16 + F() * 168), r1(152 + F() * 34), r1(0.9 + F() * 0.6), col[0], col[1]);
    }
    s += '</g>';
    s += '<path d="' + heartPath(100, 186, 6) + '" fill="#F5C77E"/>';
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + s + '</svg>';
  };
})();
