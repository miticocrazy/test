/* ============================================================================
   games.js · Los seis minijuegos (y la ayuda para colocar cosas).
   Cada juego recibe el escenario y un contexto (ctx) con:
     ctx.cfg      configuración del reto (config.js)
     ctx.easy     modo fácil
     ctx.say()    lo que dice Pom · ctx.win() reto superado
     ctx.struggle() ofrece modo fácil o seguir · ctx.size() espacio libre
     ctx.later()  temporizador que se limpia al salir
   Devuelve { hint(), destroy() }.
   ========================================================================== */
(function () {
  'use strict';
  var ART = window.ART, E = window.ENG, C = window.AVENTURA;
  var $ = E.$, $$ = E.$$, el = E.el, esc = E.esc, shuffle = E.shuffle, FX = E.FX, Sound = E.Sound, Motion = E.Motion;
  var G = (window.GAMES = {});
  var PET = (C.companero && C.companero.nombre) || 'Pom';

  function flyTo(fromRect, toEl, html, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var to = toEl.getBoundingClientRect();
      if (Motion.reduced || !document.body.animate) { res(); return; }
      var size = opts.size || 40;
      var f = el('<div class="flyer">' + html + '</div>');
      f.style.width = size + 'px'; f.style.height = size + 'px';
      f.style.left = (fromRect.left + fromRect.width / 2 - size / 2) + 'px';
      f.style.top = (fromRect.top + fromRect.height / 2 - size / 2) + 'px';
      document.body.appendChild(f);
      var dx = (to.left + to.width / 2) - (fromRect.left + fromRect.width / 2);
      var dy = (to.top + to.height / 2) - (fromRect.top + fromRect.height / 2);
      var a = f.animate([
        { transform: 'translate(0,0) scale(' + (opts.from || 1.4) + ')' },
        { transform: 'translate(' + (dx * 0.45) + 'px,' + (dy * 0.45 - (opts.arc == null ? 70 : opts.arc)) + 'px) scale(1.2)', offset: 0.45 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + (opts.to || 0.8) + ')' }
      ], { duration: opts.ms || 700, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' });
      var done = false;
      function end() { if (done) return; done = true; f.remove(); res(); }
      a.onfinish = end;
      setTimeout(end, (opts.ms || 700) + 300);
    });
  }
  G.flyTo = flyTo;

  function svgPoint(svg, x, y) {
    var pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    var m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }
  function replay(node, cls, ms) {
    node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls);
    if (ms) setTimeout(function () { node.classList.remove(cls); }, ms);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ----------------------------------------------------------------------
     Colocar cosas: tocar y luego tocar el destino, o arrastrar.
     ---------------------------------------------------------------------- */
  function placer(o) {
    var sel = null, suppress = false, dead = false;
    function deselect() {
      if (sel) sel.classList.remove('is-sel');
      sel = null;
      o.targets.forEach(function (t) { t.classList.remove('is-target'); });
    }
    function select(it) {
      if (dead || !o.enabled() || o.isDone(it)) return;
      if (sel === it) { deselect(); Sound.play('tap'); return; }
      deselect();
      sel = it; it.classList.add('is-sel');
      Sound.play('pop');
      if (o.onSelect) o.onSelect(it);
    }
    o.items.forEach(function (it) {
      it.addEventListener('click', function () { if (suppress) { suppress = false; return; } select(it); });
      it.addEventListener('pointerdown', function (e) {
        if (dead || !o.enabled() || o.isDone(it) || e.button > 0) return;
        var sx = e.clientX, sy = e.clientY, drag = false, gh = null, r0 = it.getBoundingClientRect();
        try { it.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
        function move(ev) {
          var dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!drag && Math.sqrt(dx * dx + dy * dy) > 9) {
            drag = true;
            deselect();
            gh = el('<div class="dragghost">' + o.ghost(it) + '</div>');
            gh.style.left = r0.left + 'px'; gh.style.top = r0.top + 'px'; gh.style.width = r0.width + 'px'; gh.style.height = r0.height + 'px';
            document.body.appendChild(gh);
            it.classList.add('is-drag');
            Sound.play('pop');
          }
          if (drag) {
            gh.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)';
            var over = hit(ev.clientX, ev.clientY);
            o.targets.forEach(function (t) { t.classList.toggle('is-over', t === over); });
          }
        }
        function up(ev) {
          it.removeEventListener('pointermove', move); it.removeEventListener('pointerup', up); it.removeEventListener('pointercancel', up);
          if (!drag) return;
          suppress = true;
          setTimeout(function () { suppress = false; }, 400);
          var gr = gh.getBoundingClientRect();
          gh.remove(); it.classList.remove('is-drag');
          o.targets.forEach(function (t) { t.classList.remove('is-over'); });
          var target = ev.type === 'pointercancel' ? null : hit(ev.clientX, ev.clientY);
          if (!target) { Sound.play('tap'); return; }
          o.drop(it, target, gr);
        }
        it.addEventListener('pointermove', move); it.addEventListener('pointerup', up); it.addEventListener('pointercancel', up);
      });
    });
    function hit(x, y) {
      var found = null;
      o.targets.forEach(function (t) {
        if (o.isTargetDone && o.isTargetDone(t)) return;
        var r = t.getBoundingClientRect(), pad = o.pad || 0;
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) found = t;
      });
      return found;
    }
    o.targets.forEach(function (t) {
      t.addEventListener('click', function () {
        if (dead || !o.enabled()) return;
        if (!sel) { if (o.noSel) o.noSel(t); return; }
        var it = sel;
        o.drop(it, t, it.getBoundingClientRect());
      });
    });
    return {
      deselect: deselect,
      selected: function () { return sel; },
      destroy: function () { dead = true; $$('.dragghost').forEach(function (g) { g.remove(); }); }
    };
  }
  G.placer = placer;

  /* ======================================================================
     1 · LA MALETA: cinco cositas que brillan en la plaza
     ====================================================================== */
  G.maleta = function (stage, ctx) {
    var OBJ = [
      { id: 'llave', name: 'una llavecita', spots: [[150, 312], [300, 352], [132, 162]] },
      { id: 'postal', name: 'una postal', spots: [[247, 127], [92, 342], [24, 350]] },
      { id: 'gafas', name: 'unas gafas de sol', spots: [[304, 320], [54, 316], [318, 236]] },
      { id: 'flor', name: 'una flor amarilla', spots: [[30, 128], [216, 330], [340, 352]] },
      { id: 'estrella', name: 'una estrellita', spots: [[180, 192], [124, 88], [176, 386]] }
    ];
    var p = ART.uid('pz');
    var objs = OBJ.map(function (o) { var s = o.spots[Math.floor(Math.random() * o.spots.length)]; return { id: o.id, name: o.name, x: s[0], y: s[1], found: false }; });
    var root = el('<div class="hunt"><div class="hunt__scene"><svg viewBox="0 0 360 400" role="img" aria-label="Una plaza al atardecer con cositas escondidas">' +
      ART.plaza(p) +
      '<defs><radialGradient id="' + p + 'hg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF8D0" stop-opacity="1"/><stop offset=".45" stop-color="#FFE07A" stop-opacity=".75"/><stop offset="1" stop-color="#FFE07A" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="hobjs">' + objs.map(function (o, i) {
        return '<g transform="translate(' + o.x + ' ' + o.y + ')"><g class="hobj" data-i="' + i + '" tabindex="0" role="button" aria-label="Algo brilla aquí">' +
          '<circle class="hobj__glow" r="19" fill="url(#' + p + 'hg)"/>' +
          '<g class="hobj__icon"><use href="#ob-' + o.id + '" x="-12" y="-12" width="24" height="24"/></g>' +
          '<circle r="26" fill="transparent"/></g></g>';
      }).join('') + '</g><g class="hfx"></g></svg></div>' +
      '<div class="case" aria-label="La maleta"><span class="case__handle" aria-hidden="true"></span><div class="case__body">' +
      '<span class="case__strap" aria-hidden="true"></span><span class="case__strap case__strap--r" aria-hidden="true"></span>' +
      '<div class="case__slots">' + objs.map(function (o, i) {
        return '<div class="slot" data-s="' + i + '" role="img" aria-label="' + esc(cap(o.name)) + ': sin encontrar"><svg viewBox="0 0 28 28" aria-hidden="true"><use href="#ob-' + o.id + '"/></svg></div>';
      }).join('') + '</div><span class="case__lid" aria-hidden="true"></span></div></div></div>');
    stage.appendChild(root);
    var scene = $('.hunt__scene', root), svg = $('svg', scene), hfx = $('.hfx', svg), cs = $('.case', root);
    if (ctx.easy) svg.classList.add('easy');
    var count = 0, misses = 0, done = false;

    function layout() {
      var s = ctx.size();
      var w = Math.min(s.w, 470, (s.h - 92) * 360 / 400);
      scene.style.width = Math.floor(w) + 'px';
      scene.style.height = Math.floor(w * 400 / 360) + 'px';
      cs.style.width = Math.floor(Math.min(w, 380)) + 'px';
    }
    layout();
    ctx.onResize(layout);

    function find(g) {
      var i = +g.getAttribute('data-i'), o = objs[i];
      if (o.found || done) return;
      o.found = true; count++; misses = 0;
      var r = g.getBoundingClientRect();
      g.classList.add('is-gone');
      Sound.play('found');
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 22, speed: [2, 5] });
      var slot = $('[data-s="' + i + '"]', cs);
      ctx.say('¡' + cap(o.name) + '! ' + (count < 5 ? 'Llevas ' + count + ' de 5.' : 'Ya están las cinco.'), 'joy');
      flyTo(r, slot, '<svg viewBox="0 0 28 28"><use href="#ob-' + o.id + '"/></svg>').then(function () {
        slot.classList.add('is-found');
        slot.setAttribute('aria-label', cap(o.name) + ': en la maleta');
        Sound.play('pop');
        FX.at(slot, { n: 10, speed: [1, 3] });
        if (count === 5 && !done) {
          done = true;
          ctx.later(function () {
            cs.classList.add('is-closed');
            Sound.play('place');
            ctx.say('¡Maleta llena! Pesa un poquito… ¿qué habrá dentro?', 'wow');
            var cr = cs.getBoundingClientRect();
            FX.burst(cr.left + cr.width / 2, cr.top + cr.height / 2, { n: 30, speed: [2, 6] });
          }, 500);
          ctx.later(function () { ctx.win(); }, 1900);
        }
      });
    }
    function miss(e) {
      var pt = svgPoint(svg, e.clientX, e.clientY);
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', '14'); c.setAttribute('class', 'ripple');
      hfx.appendChild(c);
      setTimeout(function () { c.remove(); }, 600);
      Sound.play('tap');
      misses++;
      if (misses === 4) ctx.say('Aquí no hay nada… Fíjate en lo que brilla un poquito.', 'sniff');
      if (misses === 7) { ctx.say('¿Te ayudo? Toca la bombilla y te enseño dónde mirar.'); ctx.struggle(); }
    }
    svg.addEventListener('click', function (e) {
      var g = e.target.closest('.hobj');
      if (g) find(g); else miss(e);
    });
    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('.hobj');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); find(g); }
    });
    ctx.say('En la plaza brillan cinco cositas. ¿Las encuentras?', 'sniff');

    var hints = 0;
    return {
      hint: function () {
        var left = objs.filter(function (o) { return !o.found; });
        if (!left.length) return;
        var o = left[Math.floor(Math.random() * left.length)];
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', o.x); c.setAttribute('cy', o.y); c.setAttribute('r', '22'); c.setAttribute('class', 'hint-ring');
        hfx.appendChild(c);
        setTimeout(function () { c.remove(); }, 4200);
        ctx.say('Creo que aquí hay algo…', 'sniff');
        hints++;
        if (hints === 3) ctx.struggle();
      },
      destroy: function () {}
    };
  };

  /* ======================================================================
     2 · PAREJAS de lo nuestro
     ====================================================================== */
  G.parejas = function (stage, ctx) {
    var ICONS = ['pintxo', 'taza', 'palomitas', 'casco', 'flor', 'perro'];
    var NAMES = { pintxo: '¡Pareja de pintxos!', taza: 'Dos tazas calentitas.', palomitas: 'Palomitas por partida doble.', casco: 'Los dos cascos, listos.', flor: 'Dos flores amarillas.', perro: '¡Ese soy yo, con mi lazo y todo!' };
    var ONE = { pintxo: 'un pintxo', taza: 'una taza calentita', palomitas: 'unas palomitas', casco: 'un casco', flor: 'una flor amarilla', perro: PET };
    var root = el('<div class="mem" role="group" aria-label="Cartas"></div>');
    stage.appendChild(root);
    var pairs = 0, first = null, lock = false, matched = 0, misses = 0, peeks = 2, rows = 3, done = false;

    function layout() {
      var s = ctx.size(), cols = 4, gap = 9;
      var cw = Math.min((s.w - gap * (cols - 1)) / cols, ((s.h - gap * (rows - 1)) / rows) * 0.8, 112);
      cw = Math.floor(cw);
      root.style.gridTemplateColumns = 'repeat(' + cols + ', ' + cw + 'px)';
      $$('.mcard', root).forEach(function (c) { c.style.width = cw + 'px'; c.style.height = Math.floor(cw * 1.25) + 'px'; });
    }
    function deal() {
      pairs = ctx.easy ? 4 : Math.max(2, Math.min(6, ctx.cfg.parejas || 6));
      rows = pairs * 2 / 4;
      first = null; lock = false; matched = 0; done = false;
      var icons = shuffle(ICONS).slice(0, pairs);
      var deck = shuffle(icons.concat(icons));
      root.innerHTML = deck.map(function (k, i) {
        return '<button class="mcard deal" style="--i:' + i + '" data-k="' + k + '" aria-label="Carta boca abajo">' +
          '<span class="mcard__in"><span class="mcard__face mcard__back"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-paw"/></svg></span>' +
          '<span class="mcard__face mcard__front"><svg viewBox="0 0 60 60" aria-hidden="true"><use href="#ic-' + k + '"/></svg></span></span></button>';
      }).join('');
      layout();
      ctx.later(function () { $$('.mcard', root).forEach(function (c) { c.classList.remove('deal'); }); }, 1400);
    }
    deal();
    ctx.onResize(layout);
    ctx.say('Da la vuelta a dos cartas. Si son iguales, ¡pareja!');

    function up(c, on) {
      c.classList.toggle('is-up', on);
      c.setAttribute('aria-label', on ? 'Carta: ' + ONE[c.getAttribute('data-k')] : 'Carta boca abajo');
    }
    root.addEventListener('click', function (e) {
      var c = e.target.closest('.mcard');
      if (!c || lock || done || c.classList.contains('is-up')) return;
      up(c, true);
      Sound.play('flip');
      if (!first) { first = c; return; }
      var a = first, b = c;
      first = null; lock = true;
      if (a.getAttribute('data-k') === b.getAttribute('data-k')) {
        ctx.later(function () {
          a.classList.add('is-match'); b.classList.add('is-match');
          Sound.play('match');
          FX.at(a, { n: 12, speed: [1.5, 4] }); FX.at(b, { n: 12, speed: [1.5, 4] });
          matched++;
          ctx.say(NAMES[a.getAttribute('data-k')] + ' ' + (matched < pairs ? 'Llevas ' + matched + ' de ' + pairs + '.' : '¡Todas las parejas!'), 'joy');
          lock = false;
          if (matched === pairs) { done = true; ctx.later(function () { ctx.win(); }, 900); }
        }, 420);
      } else {
        misses++;
        ctx.later(function () { a.classList.add('is-shake'); b.classList.add('is-shake'); Sound.play('soft'); }, 700);
        ctx.later(function () {
          a.classList.remove('is-shake'); b.classList.remove('is-shake');
          up(a, false); up(b, false);
          lock = false;
          if (misses === 4) ctx.say('Sin prisa. Intenta recordar dónde estaba cada una.');
          if (misses === 9) { ctx.say('Si quieres, la bombilla te deja echar un vistazo.'); ctx.struggle(); }
        }, 1150);
      }
    });
    return {
      hint: function () {
        if (lock || done) return;
        if (peeks <= 0) { ctx.say('Ya no quedan vistazos. Si te apetece, prueba el modo fácil.'); ctx.struggle(); return; }
        peeks--;
        lock = true;
        var hidden = $$('.mcard', root).filter(function (c) { return !c.classList.contains('is-match') && !c.classList.contains('is-up'); });
        hidden.forEach(function (c) { c.classList.add('is-up'); });
        ctx.say('¡Mira rápido! ' + (peeks ? 'Te queda un vistazo más.' : 'Era el último vistazo.'), 'wow');
        ctx.later(function () { hidden.forEach(function (c) { c.classList.remove('is-up'); }); lock = false; }, 1500);
      },
      destroy: function () {}
    };
  };

  /* ======================================================================
     3 · LUCES: gira las piezas para encender el cartel
     ====================================================================== */
  G.luces = function (stage, ctx) {
    var p = ART.uid('lu');
    var root = el('<div class="luces' + (ctx.easy ? ' easy' : '') + '"><svg class="luces__art" viewBox="0 0 300 440" aria-hidden="true" focusable="false">' + ART.luces(p) + '</svg></div>');
    stage.appendChild(root);
    var BASE = { straight: [3, 1], corner: [3, 0] };
    var tiles = [
      { c: 0, r: 0, type: 'corner', sol: [1] },
      { c: 1, r: 0, type: 'corner', sol: [3] },
      { c: 0, r: 1, type: 'straight', sol: [0, 2] },
      { c: 1, r: 1, type: 'corner', sol: [0] }
    ];
    var ORDER = [2, 3, 1, 0];
    var NAMES = ['arriba a la izquierda', 'arriba a la derecha', 'abajo a la izquierda', 'abajo a la derecha'];
    function ok(t) { return t.sol.indexOf(t.rot) >= 0; }
    var guard = 0;
    do {
      tiles.forEach(function (t) { t.rot = Math.floor(Math.random() * 4); });
      guard++;
    } while (guard < 50 && tiles.filter(ok).length > 1);
    tiles.forEach(function (t, i) {
      t.deg = t.rot * 90;
      var b = el('<button class="ftile" aria-label="Pieza ' + NAMES[i] + '. Toca para girarla."><div class="ftile__rot">' + ART.tile(t.type, p + 't' + i) + '</div></button>');
      b.style.left = (20 + t.c * 33.333) + '%';
      b.style.top = (47.727 + t.r * 22.727) + '%';
      $('.ftile__rot', b).style.transform = 'rotate(' + t.deg + 'deg)';
      root.appendChild(b);
      t.el = b; t.rotEl = $('.ftile__rot', b); t.light = $('.tile-light', b);
      b.addEventListener('click', function () { rotate(t); });
    });
    function layout() {
      var s = ctx.size();
      var w = Math.min(s.w, 430, s.h * 300 / 440);
      root.style.width = Math.floor(w) + 'px';
      root.style.height = Math.floor(w * 440 / 300) + 'px';
    }
    layout();
    ctx.onResize(layout);

    function conn(t) { return BASE[t.type].map(function (s) { return (s + t.rot) % 4; }); }
    function at(c, r) { for (var i = 0; i < tiles.length; i++) if (tiles[i].c === c && tiles[i].r === r) return tiles[i]; return null; }
    function trace() {
      var lit = [], c = 0, r = 1, enter = 3;
      for (var g = 0; g < 6; g++) {
        var t = at(c, r); if (!t) break;
        var cs = conn(t); if (cs.indexOf(enter) < 0) break;
        var exit = cs[0] === enter ? cs[1] : cs[0];
        lit.push({ t: t, enter: enter });
        if (c === 0 && r === 0 && exit === 0) return { lit: lit, ok: true };
        var d = [[0, -1], [1, 0], [0, 1], [-1, 0]][exit];
        c += d[0]; r += d[1];
        if (c < 0 || c > 1 || r < 0 || r > 1) break;
        enter = (exit + 2) % 4;
      }
      return { lit: lit, ok: false };
    }
    function setLit(t, on, enter, delay) {
      var path = t.light;
      if (!on) {
        t.el.classList.remove('is-lit'); t.litEnter = null;
        path.style.transition = 'none'; path.style.strokeDashoffset = '100';
        return;
      }
      if (t.el.classList.contains('is-lit') && t.litEnter === enter) return;
      t.litEnter = enter;
      var fwd = ((3 + t.rot) % 4) === enter;
      path.style.transition = 'none';
      path.style.strokeDashoffset = fwd ? '100' : '-100';
      ctx.later(function () {
        if (t.litEnter !== enter) return;
        t.el.classList.add('is-lit');
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset .34s ease';
        path.style.strokeDashoffset = '0';
      }, delay || 0);
    }
    var solved = false, upd = null, hints = 0, taps = 0;
    function update() {
      var tr = trace();
      var on = tr.lit.map(function (x) { return x.t; });
      tiles.forEach(function (t) { if (on.indexOf(t) < 0) setLit(t, false); t.el.classList.toggle('is-ok', ok(t)); });
      tr.lit.forEach(function (x, i) { setLit(x.t, true, x.enter, i * 130); });
      if (tr.ok && !solved) {
        solved = true;
        ctx.later(win, tr.lit.length * 130 + 380);
      }
    }
    function rotate(t) {
      if (solved) return;
      t.rot = (t.rot + 1) % 4; t.deg += 90;
      t.rotEl.style.transform = 'rotate(' + t.deg + 'deg)';
      t.el.classList.remove('is-hint');
      Sound.play('rotate');
      setLit(t, false);
      taps++;
      if (taps === 18) ctx.say('¿Te ayudo? La bombilla te dice qué pieza tocar.');
      if (taps === 30) ctx.struggle();
      clearTimeout(upd);
      upd = setTimeout(update, 300);
    }
    function win() {
      root.classList.add('is-solved');
      Sound.play('light');
      ctx.say('¡Mimimimi! Ya brilla.', 'joy');
      var r = root.getBoundingClientRect();
      ctx.later(function () {
        FX.burst(r.left + r.width / 2, r.top + r.height * (98 / 440), { n: 34, speed: [2, 7], colors: ['#FFD0E6', '#F48FB1', '#FFFFFF', '#FFE07A'] });
      }, 1000);
      ctx.later(function () { ctx.win(); }, 2300);
    }
    ctx.later(update, 200);
    ctx.say('Gira las piezas para que la corriente vaya del enchufe al cartel.');
    return {
      hint: function () {
        if (solved) return;
        for (var i = 0; i < ORDER.length; i++) {
          var t = tiles[ORDER[i]];
          if (!ok(t)) {
            tiles.forEach(function (x) { x.el.classList.remove('is-hint'); });
            t.el.classList.add('is-hint');
            ctx.say('Prueba a girar la pieza que brilla: es la siguiente del camino.', 'wow');
            hints++;
            if (hints === 3) ctx.struggle();
            return;
          }
        }
      },
      destroy: function () { clearTimeout(upd); }
    };
  };

  /* ======================================================================
     4 · LA TIENDITA: cada cosa en su balda
     ====================================================================== */
  G.tienda = function (stage, ctx) {
    var SHELF = ['Fruta', 'Panadería', 'Merienda'];
    var ITEMS = shuffle([
      { id: 'manzana', name: 'una manzana', short: 'Manzana', shelf: 0 },
      { id: 'platano', name: 'un plátano', short: 'Plátano', shelf: 0 },
      { id: 'pan', name: 'una barra de pan', short: 'Pan', shelf: 1 },
      { id: 'cruasan', name: 'un cruasán', short: 'Cruasán', shelf: 1 },
      { id: 'cacao', name: 'un bote de cacao', short: 'Cacao', shelf: 2 },
      { id: 'galletas', name: 'unas galletas', short: 'Galletas', shelf: 2 }
    ]);
    var p = ART.uid('sh');
    var SPOTX = [48, 76];
    var root = el('<div class="shop' + (ctx.easy ? ' is-easy' : '') + '"><div class="shop__scene"><svg viewBox="0 0 360 330" aria-hidden="true" focusable="false">' + ART.shopInside(p) + '</svg>' +
      SHELF.map(function (n, k) {
        var mine = ITEMS.filter(function (it) { return it.shelf === k; });
        return '<button class="shelf" data-s="' + k + '" aria-label="Balda de ' + esc(n) + '" style="top:' + ((52 + k * 80) / 3.3) + '%;height:' + (68 / 3.3) + '%">' +
          SPOTX.map(function (x, j) {
            return '<span class="spot" style="left:' + x + '%"><svg class="spot__ghost" viewBox="0 0 40 40" aria-hidden="true"><use href="#it-' + mine[j].id + '"/></svg></span>';
          }).join('') + '</button>';
      }).join('') + '</div>' +
      '<div class="ptray shop__tray" role="group" aria-label="Cesta">' + ITEMS.map(function (it, i) {
        return '<button class="pitem sitem" data-i="' + i + '" aria-label="' + esc(cap(it.name)) + '"><svg viewBox="0 0 40 40" aria-hidden="true"><use href="#it-' + it.id + '"/></svg><span>' + esc(it.short) + '</span></button>';
      }).join('') + '</div></div>');
    stage.appendChild(root);
    var scene = $('.shop__scene', root), shelves = $$('.shelf', root), items = $$('.sitem', root), tray = $('.shop__tray', root);
    var placed = 0, misses = 0, hints = 0, done = false, used = [0, 0, 0];

    function layout() {
      var s = ctx.size();
      root.style.width = Math.min(s.w, 460) + 'px';
      var trayH = (tray.offsetHeight || 80) + 14;
      var w = Math.floor(Math.min(s.w, 460, (s.h - trayH) * 360 / 330));
      scene.style.width = w + 'px'; scene.style.height = Math.floor(w * 330 / 360) + 'px';
    }
    layout();
    ctx.onResize(layout);

    var pl = placer({
      items: items, targets: shelves, pad: 6,
      enabled: function () { return !done; },
      isDone: function (b) { return b.classList.contains('is-placed'); },
      ghost: function (b) { return '<svg viewBox="0 0 40 40"><use href="#it-' + ITEMS[+b.getAttribute('data-i')].id + '"/></svg>'; },
      onSelect: function (b) { ctx.say('¿En qué balda va ' + ITEMS[+b.getAttribute('data-i')].name + '?'); },
      noSel: function () { Sound.play('tap'); ctx.say('Primero elige algo de la cesta.'); },
      drop: function (b, shelf, fromRect) {
        var it = ITEMS[+b.getAttribute('data-i')], k = +shelf.getAttribute('data-s');
        pl.deselect();
        if (it.shelf !== k) {
          misses++;
          replay(b, 'is-shake', 450);
          Sound.play('soft');
          ctx.say(misses >= 4 ? 'Eso va en otra balda. La bombilla te enseña cuál.' : cap(it.name) + ' no va en ' + SHELF[k] + '. ¡Prueba otra!');
          if (misses === 5) ctx.struggle();
          return;
        }
        var spot = $$('.spot', shelf)[used[k]++];
        b.classList.add('is-placed');
        b.setAttribute('aria-label', cap(it.name) + ': colocado');
        placed++;
        Sound.play('pop');
        flyTo(fromRect, spot, '<svg viewBox="0 0 40 40"><use href="#it-' + it.id + '"/></svg>', { size: 44, arc: 40, from: 1, to: 1 }).then(function () {
          spot.classList.add('is-filled');
          spot.insertAdjacentHTML('beforeend', '<svg class="spot__item" viewBox="0 0 40 40" aria-hidden="true"><use href="#it-' + it.id + '"/></svg>');
          Sound.play('ding');
          FX.at(spot, { n: 10, speed: [1.2, 3.4], colors: ['#FFE3A6', '#FFFFFF', '#F7AECB'] });
          if (placed < 6) ctx.say(['¡A su sitio!', '¡Eso es!', 'Muy bien colocado.', '¡Perfecto!', 'Ya casi está.'][placed - 1] + ' ' + (6 - placed) + (6 - placed === 1 ? ' cosa más.' : ' cosas más.'), 'joy');
          else finish();
        });
      }
    });
    function finish() {
      done = true;
      ctx.later(function () {
        root.classList.add('is-open');
        Sound.play('win');
        var r = scene.getBoundingClientRect();
        FX.burst(r.left + r.width * 0.88, r.top + r.height * 0.1, { n: 26, speed: [2, 6] });
        ctx.say('¡Tienda lista! Esto se nos da bien, ¿eh?', 'joy');
      }, 300);
      ctx.later(function () { ctx.win(); }, 2000);
    }
    ctx.say('Ayúdame a colocar la tienda: cada cosa en su balda.');
    return {
      hint: function () {
        if (done) return;
        hints++;
        var b = pl.selected();
        if (!b) {
          var left = items.filter(function (x) { return !x.classList.contains('is-placed'); });
          b = left[Math.floor(Math.random() * left.length)];
          replay(b, 'is-hint', 2600);
        }
        var it = ITEMS[+b.getAttribute('data-i')];
        replay(shelves[it.shelf], 'is-target', 2700);
        ctx.say(cap(it.name) + ' va en la balda de ' + SHELF[it.shelf] + '.', 'wow');
        if (hints === 4) ctx.struggle();
      },
      destroy: function () { pl.destroy(); }
    };
  };

  /* ======================================================================
     5 · EL RINCÓN: seis cositas en su sitio
     ====================================================================== */
  G.rincon = function (stage, ctx) {
    var NAME = { cojin: 'el cojín', manta: 'la manta', lampara: 'la lámpara', tazas: 'las tazas', palomitas: 'las palomitas', mando: 'el mando' };
    var SHORT = { cojin: 'Cojín', manta: 'Manta', lampara: 'Lámpara', tazas: 'Tazas', palomitas: 'Palomitas', mando: 'Mando' };
    var SLOTS = ART.ROOM_SLOTS;
    var order = shuffle(SLOTS.map(function (s) { return s[0]; }));
    var p = ART.uid('rm');
    var root = el('<div class="room' + (ctx.easy ? ' is-easy' : '') + '"><div class="room__scene"><svg viewBox="0 0 360 300" aria-hidden="true" focusable="false">' + ART.room(p) + '</svg>' +
      SLOTS.map(function (s) {
        return '<button class="rslot" data-id="' + s[0] + '" aria-label="Sitio para ' + esc(NAME[s[0]]) + '" style="left:' + (s[1] / 3.6) + '%;top:' + (s[2] / 3) + '%;width:' + (s[3] / 3.6) + '%">' +
          '<svg class="rslot__ghost" viewBox="0 0 48 48" aria-hidden="true"><use href="#rc-' + s[0] + '"/></svg></button>';
      }).join('') + '</div>' +
      '<div class="ptray room__tray" role="group" aria-label="Cositas para colocar">' + order.map(function (id) {
        return '<button class="pitem ritem" data-id="' + id + '" aria-label="' + esc(cap(NAME[id])) + '"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#rc-' + id + '"/></svg><span>' + SHORT[id] + '</span></button>';
      }).join('') + '</div></div>');
    stage.appendChild(root);
    var scene = $('.room__scene', root), slots = $$('.rslot', root), items = $$('.ritem', root), tray = $('.room__tray', root);
    var placed = 0, misses = 0, hints = 0, done = false;

    function layout() {
      var s = ctx.size();
      root.style.width = Math.min(s.w, 470) + 'px';
      var trayH = (tray.offsetHeight || 80) + 14;
      var w = Math.floor(Math.min(s.w, 470, (s.h - trayH) * 360 / 300));
      scene.style.width = w + 'px'; scene.style.height = Math.floor(w * 300 / 360) + 'px';
    }
    layout();
    ctx.onResize(layout);
    function slotOf(id) { for (var i = 0; i < slots.length; i++) if (slots[i].getAttribute('data-id') === id) return slots[i]; return null; }

    var pl = placer({
      items: items, targets: slots, pad: 8,
      enabled: function () { return !done; },
      isDone: function (b) { return b.classList.contains('is-placed'); },
      isTargetDone: function (t) { return t.classList.contains('is-filled'); },
      ghost: function (b) { return '<svg viewBox="0 0 48 48"><use href="#rc-' + b.getAttribute('data-id') + '"/></svg>'; },
      onSelect: function (b) { ctx.say('¿Dónde ponemos ' + NAME[b.getAttribute('data-id')] + '? Busca su silueta.'); },
      noSel: function (t) { Sound.play('tap'); ctx.say('Primero elige una cosita de abajo.'); },
      drop: function (b, slot, fromRect) {
        var id = b.getAttribute('data-id');
        pl.deselect();
        if (slot.classList.contains('is-filled')) { replay(b, 'is-shake', 450); Sound.play('soft'); return; }
        if (slot.getAttribute('data-id') !== id) {
          misses++;
          replay(b, 'is-shake', 450);
          Sound.play('soft');
          ctx.say(misses >= 4 ? 'Esa va en otro sitio. La bombilla te enseña dónde.' : 'Ahí no encaja ' + NAME[id] + '. Busca su silueta.');
          if (misses === 5) ctx.struggle();
          return;
        }
        b.classList.add('is-placed');
        b.setAttribute('aria-label', cap(NAME[id]) + ': en su sitio');
        placed++;
        Sound.play('pop');
        flyTo(fromRect, slot, '<svg viewBox="0 0 48 48"><use href="#rc-' + id + '"/></svg>', { size: Math.max(40, slot.getBoundingClientRect().width), arc: 50, from: 1, to: 1 }).then(function () {
          slot.classList.add('is-filled');
          slot.setAttribute('aria-label', cap(NAME[id]) + ': en su sitio');
          slot.insertAdjacentHTML('beforeend', '<svg class="rslot__item" viewBox="0 0 48 48" aria-hidden="true"><use href="#rc-' + id + '"/></svg>');
          root.classList.add('has-' + id);
          Sound.play('place');
          FX.at(slot, { n: 12, speed: [1.2, 3.6] });
          var say = { lampara: '¡Qué luz más bonita!', tazas: 'Algo calentito para los dos.', mando: '¡Tele encendida!', palomitas: 'Palomitas a mano. Imprescindible.', manta: 'Mantita. Lo más importante.', cojin: 'Un cojín bien mullido.' }[id];
          if (placed < 6) ctx.say(say + ' ' + (6 - placed === 1 ? 'Falta una.' : 'Faltan ' + (6 - placed) + '.'), 'joy');
          else finish();
        });
      }
    });
    function finish() {
      done = true;
      ctx.later(function () {
        root.classList.add('is-cozy');
        Sound.play('light');
        var r = scene.getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top + r.height * 0.45, { n: 30, speed: [2, 6] });
        ctx.say('¡Listo! Ya tenemos nuestro rincón.', 'joy');
      }, 350);
      ctx.later(function () { ctx.win(); }, 2100);
    }
    ctx.say('Pon cada cosita en su sitio: tócala y luego su silueta, o arrástrala.');
    return {
      hint: function () {
        if (done) return;
        hints++;
        var b = pl.selected();
        if (!b) {
          var left = items.filter(function (x) { return !x.classList.contains('is-placed'); });
          b = left[Math.floor(Math.random() * left.length)];
          replay(b, 'is-hint', 2600);
        }
        var s = slotOf(b.getAttribute('data-id'));
        if (s) replay(s, 'is-target', 2700);
        ctx.say(cap(NAME[b.getAttribute('data-id')]) + ' va donde brilla.', 'wow');
        if (hints === 4) ctx.struggle();
      },
      destroy: function () { pl.destroy(); }
    };
  };

  /* ======================================================================
     6 · PALABRITAS: español y portugués
     ====================================================================== */
  G.palabras = function (stage, ctx) {
    var all = (ctx.cfg.pares && ctx.cfg.pares.length ? ctx.cfg.pares : [
      { es: 'él', pt: 'ele', pista: 'Igual que «él», pero con una e al final.' },
      { es: 'ella', pt: 'ela', pista: 'Como «ella», pero con una sola l.' }
    ]).slice(0, 6);
    var pairs = ctx.easy ? all.slice(0, Math.min(4, all.length)) : all;
    var left = shuffle(pairs.map(function (q, i) { return i; })), right = shuffle(pairs.map(function (q, i) { return i; }));
    var root = el('<div class="words">' +
      '<div class="words__cols"><div class="wcol"><p class="wcol__h">Español</p><div class="wcol__list" role="group" aria-label="En español">' +
      left.map(function (i) { return '<button class="wcard" data-k="' + i + '" data-side="es" aria-pressed="false">' + esc(pairs[i].es) + '</button>'; }).join('') + '</div></div>' +
      '<div class="words__mid" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-heart"/></svg><span class="words__fill"><svg viewBox="0 0 24 24"><use href="#i-heart"/></svg></span></div>' +
      '<div class="wcol"><p class="wcol__h">Portugués</p><div class="wcol__list" role="group" aria-label="En portugués">' +
      right.map(function (i) { return '<button class="wcard wcard--pt" data-k="' + i + '" data-side="pt" aria-pressed="false" lang="pt">' + esc(pairs[i].pt) + '</button>'; }).join('') + '</div></div></div>' +
      '</div>');
    stage.appendChild(root);
    var sel = null, matched = 0, misses = 0, hints = 0, done = false, busy = false;
    var fill = $('.words__fill', root);

    function layout() {
      var s = ctx.size();
      root.style.width = Math.min(s.w, 460) + 'px';
      var n = pairs.length, h = Math.floor(Math.min(62, Math.max(46, (s.h - 40 - (n - 1) * 10) / n)));
      root.style.setProperty('--wh', h + 'px');
    }
    layout();
    ctx.onResize(layout);

    function setSel(b) {
      if (sel) sel.setAttribute('aria-pressed', 'false');
      sel = b;
      if (b) b.setAttribute('aria-pressed', 'true');
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.wcard');
      if (!b || done || busy || b.classList.contains('is-match')) return;
      if (!sel || sel === b || sel.getAttribute('data-side') === b.getAttribute('data-side')) {
        if (sel === b) { setSel(null); Sound.play('tap'); return; }
        setSel(b); Sound.play('pop');
        return;
      }
      var a = sel; setSel(null);
      if (a.getAttribute('data-k') === b.getAttribute('data-k')) {
        var q = pairs[+a.getAttribute('data-k')], n = matched % 6;
        [a, b].forEach(function (x) { x.classList.add('is-match', 'c' + n); x.setAttribute('aria-pressed', 'false'); x.setAttribute('aria-label', q.es + ', en portugués ' + q.pt + ': emparejadas'); });
        matched++;
        fill.style.height = (100 * matched / pairs.length) + '%';
        Sound.play('match');
        FX.at(a, { n: 10, speed: [1.2, 3.4] }); FX.at(b, { n: 10, speed: [1.2, 3.4] });
        if (matched < pairs.length) ctx.say('«' + q.es + '» → «' + q.pt + '». ¡Eso es!', 'joy');
        else {
          done = true;
          ctx.later(function () {
            root.classList.add('is-done');
            Sound.play('light');
            var r = $('.words__mid', root).getBoundingClientRect();
            FX.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 30, speed: [2, 6], kinds: ['heart', 'spark'], colors: ['#F48FB1', '#D9364F', '#F5C77E', '#FFFFFF'] });
            ctx.say('¡Muito bem! O sea… ¡muy bien!', 'joy');
          }, 300);
          ctx.later(function () { ctx.win(); }, 1900);
        }
      } else {
        misses++;
        busy = true;
        a.classList.add('is-shake'); b.classList.add('is-shake');
        Sound.play('soft');
        ctx.say(misses >= 4 ? 'Casi. Si quieres, la bombilla te da una pista.' : 'Casi. Prueba con otra pareja.');
        if (misses === 7) ctx.struggle();
        ctx.later(function () { a.classList.remove('is-shake'); b.classList.remove('is-shake'); busy = false; }, 450);
      }
    });
    ctx.say('Toca una palabra en español y luego la suya en portugués.');
    return {
      hint: function () {
        if (done) return;
        var k = -1;
        if (sel) k = +sel.getAttribute('data-k');
        else for (var i = 0; i < left.length; i++) { var c = $('.wcard[data-side="es"][data-k="' + left[i] + '"]', root); if (!c.classList.contains('is-match')) { k = left[i]; break; } }
        if (k < 0) return;
        hints++;
        $$('.wcard[data-k="' + k + '"]', root).forEach(function (x) { replay(x, 'is-hint', 2600); });
        ctx.say('Pista: ' + pairs[k].pista, 'wow');
        if (hints === 4) ctx.struggle();
      },
      destroy: function () {}
    };
  };

  G.HOWTO = {
    maleta: 'Toca las cositas que brillan en la plaza. Cada una que encuentres se guarda en la maleta. Si no ves alguna, la bombilla te enseña dónde mirar.',
    parejas: 'Da la vuelta a dos cartas. Si son iguales, se quedan boca arriba. Encuentra todas las parejas, sin prisa: aquí no hay reloj.',
    luces: 'Toca una pieza para girarla. La corriente sale del enchufe (abajo a la izquierda) y tiene que llegar hasta el cartel. Las piezas que se iluminan ya llevan la corriente.',
    tienda: 'Toca un producto de la cesta y después su balda. También puedes arrastrarlo. Si te equivocas, no pasa nada: se queda en la cesta.',
    rincon: 'Toca una cosita de abajo y después su sitio en el rincón: busca su silueta. También puedes arrastrarla.',
    palabras: 'Toca una palabra en español y después la suya en portugués (o al revés). Si no sale, la bombilla te da una pista. Aquí no hay notas ni prisas.'
  };
})();
