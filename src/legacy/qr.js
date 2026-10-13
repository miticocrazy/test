/* ============================================================================
   qr.js · Generador de códigos QR (modelo 2, modo byte, UTF-8), sin librerías.
   Basado en el estándar ISO/IEC 18004. Solo se usa para el pase del final
   cuando hay un servidor que lo puede verificar.
   QR.encode(texto, 'M') → { size, modules: [[bool]] }
   QR.svg(texto, { dark, light, margin }) → '<svg …>'
   ========================================================================== */
(function () {
  'use strict';
  var QR = (window.QR = {});

  var ECL = { L: { o: 0, f: 1 }, M: { o: 1, f: 0 }, Q: { o: 2, f: 3 }, H: { o: 3, f: 2 } };
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v, e) { return Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[e.o][v] * NUM_BLOCKS[e.o][v]; }
  function gmul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function rsDivisor(deg) {
    var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    var root = 1;
    for (var k = 0; k < deg; k++) {
      for (var j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = gmul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift(); r.push(0);
      div.forEach(function (c, i) { r[i] ^= gmul(c, f); });
    });
    return r;
  }
  function utf8(s) {
    var out = [];
    var e = unescape(encodeURIComponent(s));
    for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i));
    return out;
  }
  function alignPos(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
    var r = [6];
    for (var p = v * 4 + 10; r.length < n; p -= step) r.splice(1, 0, p);
    return r;
  }

  QR.encode = function (text, eclName) {
    var e = ECL[eclName || 'M'] || ECL.M;
    var bytes = utf8(String(text));
    var v, cap;
    for (v = 1; v <= 40; v++) {
      cap = dataCodewords(v, e) * 8;
      var need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
      if (need <= cap) break;
    }
    if (v > 40) throw new Error('Texto demasiado largo para un QR');
    // bits
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var b = 0; b < bits.length; b += 8) { var x = 0; for (var k = 0; k < 8; k++) x = (x << 1) | bits[b + k]; data.push(x); }
    // bloques y corrección de errores
    var nb = NUM_BLOCKS[e.o][v], eccLen = ECC_PER_BLOCK[e.o][v], raw = Math.floor(rawModules(v) / 8);
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var div = rsDivisor(eccLen), blocks = [], pos = 0;
    for (var i2 = 0; i2 < nb; i2++) {
      var dat = data.slice(pos, pos + shortLen - eccLen + (i2 < nShort ? 0 : 1));
      pos += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i2 < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (var c = 0; c < blocks[0].length; c++) {
      for (var j = 0; j < blocks.length; j++) if (c !== shortLen - eccLen || j >= nShort) all.push(blocks[j][c]);
    }
    // matriz
    var size = v * 4 + 17, m = [], fn = [];
    for (var y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setF(x0, y0, d) { m[y0][x0] = d; fn[y0][x0] = true; }
    for (var t = 0; t < size; t++) { setF(6, t, t % 2 === 0); setF(t, 6, t % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setF(xx, yy, dist !== 2 && dist !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = alignPos(v), na = ap.length;
    for (var a1 = 0; a1 < na; a1++) for (var a2 = 0; a2 < na; a2++) {
      if ((a1 === 0 && a2 === 0) || (a1 === 0 && a2 === na - 1) || (a1 === na - 1 && a2 === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++) setF(ap[a1] + dx2, ap[a2] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    function formatBits(mask) {
      var d = (e.f << 3) | mask, r = d;
      for (var q = 0; q < 10; q++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var bits2 = ((d << 10) | r) ^ 0x5412;
      function g(i) { return ((bits2 >>> i) & 1) !== 0; }
      for (var i3 = 0; i3 <= 5; i3++) setF(8, i3, g(i3));
      setF(8, 7, g(6)); setF(8, 8, g(7)); setF(7, 8, g(8));
      for (var i4 = 9; i4 < 15; i4++) setF(14 - i4, 8, g(i4));
      for (var i5 = 0; i5 < 8; i5++) setF(size - 1 - i5, 8, g(i5));
      for (var i6 = 8; i6 < 15; i6++) setF(8, size - 15 + i6, g(i6));
      setF(8, size - 8, true);
    }
    formatBits(0);
    if (v >= 7) {
      var r2 = v;
      for (var q2 = 0; q2 < 12; q2++) r2 = (r2 << 1) ^ ((r2 >>> 11) * 0x1F25);
      var vb = (v << 12) | r2;
      for (var i7 = 0; i7 < 18; i7++) {
        var bit = ((vb >>> i7) & 1) !== 0, aa = size - 11 + i7 % 3, bb = Math.floor(i7 / 3);
        setF(aa, bb, bit); setF(bb, aa, bit);
      }
    }
    // datos en zigzag
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var xx2 = right - jj, up = ((right + 1) & 2) === 0, yy2 = up ? size - 1 - vert : vert;
          if (!fn[yy2][xx2] && bi < all.length * 8) { m[yy2][xx2] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
        }
      }
    }
    function applyMask(mask) {
      for (var y3 = 0; y3 < size; y3++) for (var x3 = 0; x3 < size; x3++) {
        if (fn[y3][x3]) continue;
        var inv;
        switch (mask) {
          case 0: inv = (x3 + y3) % 2 === 0; break;
          case 1: inv = y3 % 2 === 0; break;
          case 2: inv = x3 % 3 === 0; break;
          case 3: inv = (x3 + y3) % 3 === 0; break;
          case 4: inv = (Math.floor(x3 / 3) + Math.floor(y3 / 2)) % 2 === 0; break;
          case 5: inv = (x3 * y3) % 2 + (x3 * y3) % 3 === 0; break;
          case 6: inv = ((x3 * y3) % 2 + (x3 * y3) % 3) % 2 === 0; break;
          default: inv = ((x3 + y3) % 2 + (x3 * y3) % 3) % 2 === 0;
        }
        if (inv) m[y3][x3] = !m[y3][x3];
      }
    }
    function addHist(len, h) { if (h[0] === 0) len += size; h.pop(); h.unshift(len); }
    function countPat(h) {
      var n = h[1], core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
      return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
    }
    function termCount(col, len, h) { if (col) { addHist(len, h); len = 0; } len += size; addHist(len, h); return countPat(h); }
    function penalty() {
      var res = 0, pass, a, b2;
      for (pass = 0; pass < 2; pass++) {
        for (a = 0; a < size; a++) {
          var rc = false, run = 0, h = [0, 0, 0, 0, 0, 0, 0];
          for (b2 = 0; b2 < size; b2++) {
            var cell = pass === 0 ? m[a][b2] : m[b2][a];
            if (cell === rc) { run++; if (run === 5) res += 3; else if (run > 5) res++; }
            else { addHist(run, h); if (!rc) res += countPat(h) * 40; rc = cell; run = 1; }
          }
          res += termCount(rc, run, h) * 40;
        }
      }
      for (var y4 = 0; y4 < size - 1; y4++) for (var x4 = 0; x4 < size - 1; x4++) {
        var cc = m[y4][x4];
        if (cc === m[y4][x4 + 1] && cc === m[y4 + 1][x4] && cc === m[y4 + 1][x4 + 1]) res += 3;
      }
      var dark = 0;
      m.forEach(function (row) { row.forEach(function (cl) { if (cl) dark++; }); });
      var total = size * size;
      res += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return res;
    }
    var best = 0, bestP = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      applyMask(mk); formatBits(mk);
      var pp = penalty();
      if (pp < bestP) { bestP = pp; best = mk; }
      applyMask(mk);
    }
    applyMask(best); formatBits(best);
    return { size: size, version: v, mask: best, modules: m };
  };

  QR.svg = function (text, o) {
    o = o || {};
    var q = QR.encode(text, o.ecl || 'M'), mg = o.margin == null ? 3 : o.margin, n = q.size + mg * 2, d = '';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.modules[y][x]) d += 'M' + (x + mg) + ' ' + (y + mg) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"' + (o.label ? ' role="img" aria-label="' + o.label + '"' : ' aria-hidden="true"') + '>' +
      '<rect width="' + n + '" height="' + n + '" fill="' + (o.light || '#fff') + '"/><path d="' + d + '" fill="' + (o.dark || '#000') + '"/></svg>';
  };

  // Dibuja el QR en un canvas (para la imagen de recuerdo)
  QR.draw = function (cx, text, x, y, w, o) {
    o = o || {};
    var q = QR.encode(text, o.ecl || 'M'), mg = o.margin == null ? 3 : o.margin, n = q.size + mg * 2, s = w / n;
    cx.fillStyle = o.light || '#fff'; cx.fillRect(x, y, w, w);
    cx.fillStyle = o.dark || '#000';
    for (var yy = 0; yy < q.size; yy++) for (var xx = 0; xx < q.size; xx++) if (q.modules[yy][xx]) cx.fillRect(Math.floor(x + (xx + mg) * s), Math.floor(y + (yy + mg) * s), Math.ceil(s), Math.ceil(s));
  };
})();
