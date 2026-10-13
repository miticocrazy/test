/* ============================================================================
   app.js · Flujo del juego: portada, mapa, capítulos, minijuegos,
   sorpresas, final, descubrimientos, cuaderno, ajustes y vista previa.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.AVENTURA, ART = window.ART, E = window.ENG, G = window.GAMES;
  var $ = E.$, $$ = E.$$, el = E.el, esc = E.esc, icon = E.icon, S = E.S, Sound = E.Sound, FX = E.FX, Motion = E.Motion, wait = E.wait;
  var CH = C.capitulos;
  var PET = (C.companero && C.companero.nombre) || 'Pom';
  var SHORT = ['La plaza', 'La tiendita', 'La casita'];
  var PLACE = ['la plaza', 'la tiendita', 'la casita'];
  var SECRETS = { luna: 'La luna que guiña', paloma: 'Las palomas de la plaza', bici: 'La bici con timbre', helado: 'El carrito de los helados', barca: 'La barquita del lago', perro: PET + ' da vueltas' };
  var NSEC = 6;
  var GAMEMSG = {
    maleta: 'Las cinco cositas ya están en la maleta.',
    parejas: 'Todas las parejas, juntitas.',
    luces: 'El cartel ya brilla.',
    tienda: 'La tiendita ha quedado perfecta.',
    rincon: 'El rincón ha quedado precioso.',
    palabras: 'Todas las palabras, emparejadas.'
  };
  var GICON = { maleta: 'i-suitcase', parejas: 'i-cards', luces: 'i-bolt', tienda: 'i-basket', rincon: 'i-sofa', palabras: 'i-chat' };
  var WINS = ['¡Lo hemos conseguido!', '¡Precioso!', '¡Lo tienes!', '¡Qué bien!'];
  var RETOS = [];
  CH.forEach(function (c) { c.retos.forEach(function (r) { RETOS.push(r.id); }); });
  var NPIECES = 6;
  var PPLACE = ['arriba a la izquierda', 'arriba a la derecha', 'en medio a la izquierda', 'en medio a la derecha', 'abajo a la izquierda', 'abajo a la derecha'];

  var st = null;
  var cur = { screen: 'load', chapter: null, reto: null, ctl: null, easy: false };
  var gameTimers = [], resizeFns = [], assistTimer = null, assistShown = false, won = false;
  var arriving = false, opening = false, openSig = '', hintFor = '';
  var lastTap = null, greetAudio = null, greeted = false;

  function save() { S.save(); }

  /* ---------- Consultas de estado ---------- */
  function chById(id) { for (var i = 0; i < CH.length; i++) if (CH[i].id === id) return CH[i]; return null; }
  function chOf(gid) { for (var i = 0; i < CH.length; i++) for (var k = 0; k < CH[i].retos.length; k++) if (CH[i].retos[k].id === gid) return CH[i]; return null; }
  function retoOf(gid) { var c = chOf(gid); if (!c) return null; for (var k = 0; k < c.retos.length; k++) if (c.retos[k].id === gid) return c.retos[k]; return null; }
  function isOpen(c) { return E.isOpen(c.fecha); }
  function gdone(gid) { return !!(st.games[gid] && st.games[gid].done); }
  function cdone(c) { return c.retos.every(function (r) { return gdone(r.id); }); }
  function ropened(rid) { return !!(rid && st.rewards[rid]); }
  function fopen() { return E.isOpen('final'); }
  function lvl() { return E.levelFor(st.xp); }
  function discoveries() { return Object.keys(C.sorpresas).filter(ropened).length + Object.keys(st.secrets).length; }
  function piecesHave() { return RETOS.map(function (id) { return gdone(id); }); }
  function pieceCount() { return piecesHave().filter(Boolean).length; }
  function pieceSVG(i) {
    var c = i % 2, r = Math.floor(i / 2);
    return '<svg viewBox="' + (c * 150) + ' ' + (r * 150) + ' 150 150" preserveAspectRatio="none" aria-hidden="true" focusable="false"><use href="#lake-art" width="300" height="450"/></svg>';
  }
  function setExpr(node, expr) { var p = node && $('.pet', node); if (p) p.setAttribute('data-expr', expr || 'happy'); }

  /* ---------- Pantallas ---------- */
  function show(id) {
    E.Voice.stop();
    $$('#app > .screen').forEach(function (s) { s.classList.toggle('is-on', s.id === 'scr-' + id); });
    cur.screen = id;
  }
  function focusScreen(id) {
    var s = $('#scr-' + id); if (!s) return;
    var h = $('h1, h2', s);
    if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
  }
  function go(id, prep) {
    var o = {};
    if (lastTap && Date.now() - lastTap.t < 1200) { o.x = lastTap.x; o.y = lastTap.y; }
    return E.Wipe.run(function () { show(id); if (prep) prep(); }, o).then(function () { focusScreen(id); });
  }

  /* ---------- Portada ---------- */
  function buildTitle() {
    var t = $('#scr-title');
    var R = ART.rng(99), stars = '', flies = '';
    for (var i = 0; i < 38; i++) {
      var s = (2 + R() * 2.4).toFixed(1);
      stars += '<i class="t-star" style="left:' + (R() * 100).toFixed(1) + '%;top:' + (R() * 100).toFixed(1) + '%;width:' + s + 'px;height:' + s + 'px;animation-delay:' + (R() * 3).toFixed(2) + 's"></i>';
    }
    for (var k = 0; k < 10; k++) flies += '<i class="t-fly" style="left:' + (6 + R() * 88).toFixed(1) + '%;top:' + (60 + R() * 32).toFixed(1) + '%;animation-delay:' + (-R() * 7).toFixed(2) + 's;animation-duration:' + (6 + R() * 4).toFixed(1) + 's"></i>';
    var petals = '';
    for (var q = 0; q < 12; q++) petals += '<i class="t-petal" style="left:' + (4 + R() * 96).toFixed(1) + '%;animation-delay:' + (-R() * 12).toFixed(2) + 's;animation-duration:' + (10 + R() * 6).toFixed(1) + 's"></i>';
    function cl(x, y, w, d) {
      return '<div class="t-cloud" aria-hidden="true" style="left:' + x + '%;top:' + y + '%;width:' + w + 'px;height:' + Math.round(w * 0.45) + 'px;animation-delay:' + d + 's"><svg viewBox="-60 -40 120 60">' + ART.cloud(0, 0, 1, '#FFE6EF', '#E3AFC9') + '</svg></div>';
    }
    t.innerHTML = '<div class="t-stars" aria-hidden="true">' + stars + '</div><div class="t-moon" aria-hidden="true"></div><div class="t-sun" aria-hidden="true"></div>' +
      cl(-10, 13, 170, 0) + cl(74, 51, 120, -9) + cl(-14, 63, 110, -15) +
      ART.titleHills() + '<div aria-hidden="true">' + flies + petals + '</div>' +
      '<button class="icon-btn t-gear" data-act="settings" aria-label="Ajustes">' + icon('i-gear') + '</button>' +
      '<div class="t-main">' +
      '<span class="t-for">Para ' + esc(C.nombres.jugadora) + '</span>' +
      '<h1 class="logo" aria-label="Una pequeña aventura"><span class="logo__small" aria-hidden="true">Una pequeña</span><span class="logo__big" aria-hidden="true">' +
      'aventura'.split('').map(function (ch, i) { return '<span style="--i:' + i + '">' + ch + '</span>'; }).join('') + '</span></h1>' +
      '<button class="t-pet bob" data-act="pet-title" aria-label="' + esc(PET) + '">' + ART.pet('happy') + '</button>' +
      '<p class="bubble bubble--up t-say">¡Vamos, ' + esc(C.nombres.jugadora) + '! Tengo una pequeña misión para ti.</p>' +
      '<div class="t-actions"><button class="btn btn--gold btn--shine" data-act="start" id="t-start">' + (st.introDone ? 'Continuar' : 'A ver qué pasa') + '</button>' +
      '<div class="t-voice" id="t-voice"></div></div>' +
      '</div>';
    if (C.saludo && C.saludo.audio) {
      E.Voice.mini($('#t-voice'), C.saludo.audio, 'Un audio de ' + C.nombres.remitente).then(function (has) { greetAudio = !!has; });
    } else greetAudio = false;
  }
  function start() {
    Sound.unlock();
    Sound.play('pop');
    go('map', function () { renderHUD(false); updateMap(true); scrollToNode(petTarget() + 1, false); }).then(function () {
      if (!st.introDone) return intro().then(arrive);
      return arrive();
    }).then(function () {
      if (!greeted && cur.screen === 'map' && !$('.mpet__say')) { greeted = true; petSay(fopen() && st.finale.opened ? '¡Hola otra vez, ' + C.nombres.jugadora + '!' : '¡Vamos, ' + C.nombres.jugadora + '!'); }
    });
  }
  function intro() {
    var n = C.nombres, lines = [
      { t: (C.companero && C.companero.presentacion) || ('¡Guau! Soy ' + PET + '.'), expr: 'joy' },
      { t: n.remitente + ' me ha pedido que te acompañe estos días.' }
    ];
    if (!greetAudio && C.saludo && C.saludo.transcripcion) lines.push({ t: 'Y me ha dado un recado para ti: «' + C.saludo.transcripcion + '»', expr: 'wow' });
    lines.push({ t: 'Cada día se despierta un sitio nuevo del mapa. Hay juegos, cositas escondidas… y algún misterio.' });
    lines.push({ t: 'Juega a tu ritmo: nada caduca. Y si te cansas, lo dejas por hoy cuando quieras. ¡Vamos, ' + n.jugadora + '!', expr: 'joy' });
    return E.talk(lines, { skip: true }).then(function () { st.introDone = true; save(); });
  }

  /* ---------- Marcador (HUD) ---------- */
  function renderHUD(animate) {
    var L = lvl(), N = E.nextLevel(L);
    $('#hud-lvnum').textContent = L.nivel;
    $('#hud-lvname').textContent = L.nombre;
    $('#hud-xp').textContent = N ? (st.xp + '/' + N.xp) : (st.xp + ' XP');
    var pct = N ? Math.max(0, Math.min(100, (st.xp - L.xp) / (N.xp - L.xp) * 100)) : 100;
    var fill = $('#hud-fill');
    if (!animate) { fill.style.transition = 'none'; fill.style.width = pct + '%'; fill.getBoundingClientRect(); fill.style.transition = ''; }
    else fill.style.width = pct + '%';
    $('#hud-lvl').setAttribute('aria-label', 'Nivel ' + L.nivel + ', ' + L.nombre + '. ' + (N ? 'Te faltan ' + (N.xp - st.xp) + ' puntos para el siguiente nivel.' : 'Nivel máximo.'));
    $('#hud-bag .dot').hidden = !(discoveries() > (st.bagSeen || 0));
  }
  function lvlInfo() {
    var L = lvl(), N = E.nextLevel(L);
    Sound.play('tap');
    E.toast(N ? 'Nivel ' + L.nivel + '. Te faltan ' + (N.xp - st.xp) + ' XP para el nivel ' + N.nivel + '.' : 'Nivel ' + L.nivel + ': el más alto de la aventura.', 'i-star');
  }

  /* ---------- Mapa ---------- */
  var NODE = ART.MAP.nodes;
  function pc(q) { return { l: (q[0] / 4) + '%', t: (q[1] / 10) + '%' }; }
  function buildMap() {
    var w = $('#map-world');
    var h = ART.map();
    for (var i = 0; i < 4; i++) {
      var p = pc(NODE[i]);
      h += '<button class="mnode is-locked" id="node' + (i + 1) + '" data-node="' + (i + 1) + '" style="left:' + p.l + ';top:' + p.t + '"><span class="mnode__disc"></span></button>' +
        '<div class="mlabel" id="mlabel' + (i + 1) + '" style="left:' + p.l + ';top:' + p.t + '" aria-hidden="true"></div>';
    }
    h += '<div class="mpet" id="mpet" aria-hidden="true"><div class="mpet__flip"><div class="mpet__in bob">' + ART.pet('happy') + '</div></div></div>';
    w.innerHTML = h;
    plxEls = $$('.plx', w).map(function (g) { return { g: g, f: parseFloat(g.getAttribute('data-plx')) || 0 }; });
    applyParallax();
  }
  /* Parallax suave: el cielo, el sol y las nubes van más despacio */
  var plxEls = [], plxRaf = 0, bnRaf = 0;
  function applyParallax() {
    plxRaf = 0;
    var sc = $('#map-scroll'), w = $('#map-world');
    if (!sc || !w) return;
    if (Motion.reduced) { plxEls.forEach(function (p) { p.g.style.transform = ''; }); return; }
    var k = 400 / (w.clientWidth || 400), top = sc.scrollTop;
    plxEls.forEach(function (p) { p.g.style.transform = 'translateY(' + (top * p.f * k).toFixed(1) + 'px)'; });
  }
  function bannerParallax() {
    bnRaf = 0;
    var c = $('#chap'), svg = c && $('.chap__banner > svg', c);
    if (!svg) return;
    var y = Math.max(0, Math.min(c.scrollTop, 320));
    svg.style.transform = Motion.reduced ? '' : 'translateY(' + (y * 0.38).toFixed(1) + 'px) scale(' + (1 + y * 0.0005).toFixed(4) + ')';
  }
  function nextLocked() {
    for (var i = 0; i < CH.length; i++) if (!isOpen(CH[i])) return { n: i + 1, ts: E.T[CH[i].fecha] };
    if (!fopen()) return { n: 4, ts: E.T.final };
    return null;
  }
  function renderNode(n, stt) {
    var b = $('#node' + n), lab = $('#mlabel' + n), disc = $('.mnode__disc', b);
    b.classList.remove('is-locked', 'is-open', 'is-done');
    b.classList.add('is-' + stt);
    var badge = $('.mnode__badge', b); if (badge) badge.remove();
    var title, sub = '', aria;
    if (stt === 'locked') {
      disc.innerHTML = icon('i-lock');
      title = 'Todavía es un misterio';
      var nl = nextLocked();
      if (nl && nl.n === n) sub = 'Se abre ' + E.when(nl.ts);
      aria = title + (sub ? '. ' + sub + '.' : '.');
    } else if (n === 4) {
      disc.innerHTML = icon(stt === 'done' ? 'i-flower' : 'i-sparkle');
      title = C.final.titulo;
      sub = stt === 'done' ? 'Abierta' : 'Te está esperando';
      if (stt === 'open') b.insertAdjacentHTML('beforeend', '<span class="mnode__badge" aria-hidden="true">¡Nuevo!</span>');
      aria = title + '. ' + sub + '.';
    } else {
      var c = CH[n - 1], k = c.retos.filter(function (r) { return gdone(r.id); }).length;
      disc.innerHTML = stt === 'done' ? icon('i-heart') : '<span class="mnode__num">' + n + '</span>';
      title = c.titulo;
      if (stt === 'done') sub = 'Completado';
      else if (cdone(c)) { sub = '¡Algo ha aparecido!'; b.insertAdjacentHTML('beforeend', '<span class="mnode__badge" aria-hidden="true">¡Mira!</span>'); }
      else if (k === 0) { sub = 'Retos: 0 de ' + c.retos.length; b.insertAdjacentHTML('beforeend', '<span class="mnode__badge" aria-hidden="true">¡Nuevo!</span>'); }
      else sub = 'Retos: ' + k + ' de ' + c.retos.length;
      aria = 'Capítulo ' + n + ': ' + title + '. ' + sub + '.';
    }
    lab.innerHTML = '<b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '');
    b.setAttribute('aria-label', aria);
  }
  function updateMap(hold) {
    var w = $('#map-world');
    var L = lvl().nivel;
    w.classList.remove('lvl-1', 'lvl-2', 'lvl-3', 'lvl-4'); w.classList.add('lvl-' + L);
    for (var i = 0; i < 3; i++) {
      var c = CH[i], n = i + 1;
      var locked = !isOpen(c) || (hold && !st.unlockSeen[c.id]);
      var done = ropened(c.sorpresa) && !(hold && !st.celebrated[c.id]);
      w.classList.toggle('c' + n + '-locked', locked);
      w.classList.toggle('c' + n + '-done', done);
      renderNode(n, locked ? 'locked' : (ropened(c.sorpresa) ? 'done' : 'open'));
    }
    var fl = !fopen() || (hold && !st.unlockSeen.final);
    w.classList.toggle('c4-locked', fl);
    w.classList.toggle('c4-open', !fl);
    w.classList.toggle('c4-done', !!st.finale.opened);
    renderNode(4, fl ? 'locked' : (st.finale.opened ? 'done' : 'open'));
    var legs = $$('.leg', w);
    legs[0].classList.toggle('is-lit', !w.classList.contains('c1-locked'));
    legs[1].classList.toggle('is-lit', w.classList.contains('c1-done'));
    legs[2].classList.toggle('is-lit', w.classList.contains('c2-done'));
    legs[3].classList.toggle('is-lit', w.classList.contains('c3-done'));
    placePet();
    renderHint();
  }
  function petTarget() {
    for (var i = 0; i < 3; i++) { var c = CH[i]; if (isOpen(c) && !ropened(c.sorpresa)) return i; }
    if (fopen() && !st.finale.opened) return 3;
    var last = 0;
    for (var k = 0; k < 3; k++) if (isOpen(CH[k])) last = k;
    if (st.finale.opened) last = 3;
    return last;
  }
  var runT = null, sayT = null;
  function placePet() {
    var i = petTarget(), q = NODE[i], o = ART.MAP.petOffset[i], m = $('#mpet');
    var lx = (q[0] + o[0]) / 4, ty = (q[1] + o[1]) / 10;
    var l = lx + '%', t = ty + '%';
    var pet = $('.pet', m);
    var busy = CH.some(function (c) { return isOpen(c) && !ropened(c.sorpresa); }) || (fopen() && !st.finale.opened) || st.finale.opened;
    var rest = busy ? 'happy' : 'sleep';
    var moved = m.style.left && (m.style.left !== l || m.style.top !== t);
    if (moved && !Motion.reduced) {
      // Pom corre por el camino hasta el sitio nuevo
      m.classList.toggle('is-left', lx < parseFloat(m.style.left));
      m.classList.add('is-running');
      pet.setAttribute('data-expr', 'run');
      clearTimeout(runT);
      runT = setTimeout(function () {
        m.classList.remove('is-running', 'is-left');
        pet.setAttribute('data-expr', rest);
        pet.classList.remove('pet-hop'); pet.getBoundingClientRect(); pet.classList.add('pet-hop');
      }, 1000);
    } else if (!m.classList.contains('is-running')) {
      pet.setAttribute('data-expr', rest);
    }
    m.style.left = l; m.style.top = t;
  }
  /* Burbujita encima de Pom en el mapa */
  function petSay(text, ms) {
    var m = $('#mpet');
    if (!m) return;
    var old = $('.mpet__say', m); if (old) old.remove();
    clearTimeout(sayT);
    if (!text) return;
    var b = el('<div class="mpet__say" style="animation:none">' + esc(text) + '</div>');
    m.appendChild(b);
    var r = b.getBoundingClientRect(), vw = window.innerWidth, dx = 0;
    if (r.left < 10) dx = 10 - r.left; else if (r.right > vw - 10) dx = (vw - 10) - r.right;
    b.style.setProperty('--dx', Math.round(dx) + 'px');
    b.getBoundingClientRect();
    b.style.animation = '';
    sayT = setTimeout(function () { b.classList.add('is-out'); setTimeout(function () { b.remove(); }, 320); }, ms || 2800);
  }
  function hintText() {
    if (!isOpen(CH[0])) return 'La aventura empieza ' + E.when(E.T[CH[0].fecha]) + '. Aquí te espero.';
    for (var i = 0; i < 3; i++) {
      var c = CH[i];
      if (!isOpen(c) || ropened(c.sorpresa)) continue;
      if (cdone(c)) return '¡Ha aparecido algo en ' + PLACE[i] + '! Entra a verlo.';
      var k = c.retos.filter(function (r) { return gdone(r.id); }).length;
      if (k === 0) return i === 0 ? '¿Empezamos? Toca la plaza: hay una maleta muy misteriosa.' : '¡' + SHORT[i] + ' se ha despertado! Tócala para entrar.';
      return 'En ' + PLACE[i] + ' aún te espera un reto.';
    }
    if (fopen() && !st.finale.opened) return 'Al final del camino, junto al agua, hay una puerta que brilla.';
    if (st.finale.opened) return 'Todo lo que has descubierto está en «Mis descubrimientos».';
    var nl = nextLocked();
    if (nl) return 'Por hoy está todo. ' + (nl.n === 4 ? 'Lo último' : 'El siguiente capítulo') + ' se abre ' + E.when(nl.ts) + '.';
    return '¡Qué bonito está quedando el mapa!';
  }
  function setHint(t) {
    var h = $('#mhint');
    $('#mhint-t').textContent = t;
    h.hidden = false;
    h.style.animation = 'none'; h.getBoundingClientRect(); h.style.animation = '';
    hintFor = t;
  }
  function renderHint() {
    var t = hintText();
    if (t !== hintFor || $('#mhint').hidden) setHint(t);
  }
  function scrollToNode(n, smooth) {
    var sc = $('#map-scroll'), node = $('#node' + n);
    if (!node || !sc.clientHeight) return Promise.resolve();
    var target = node.offsetTop + $('#map-world').offsetTop + 34 - sc.clientHeight * 0.46;
    target = Math.max(0, Math.min(target, sc.scrollHeight - sc.clientHeight));
    if (Math.abs(sc.scrollTop - target) < 4) return Promise.resolve();
    if (smooth && !Motion.reduced && 'scrollBehavior' in document.documentElement.style) { sc.scrollTo({ top: target, behavior: 'smooth' }); return wait(650); }
    sc.scrollTop = target;
    return Promise.resolve();
  }
  function arrive() {
    if (arriving) return Promise.resolve();
    arriving = true;
    updateMap(true);
    var q = Promise.resolve();
    CH.forEach(function (c, i) { if (ropened(c.sorpresa) && !st.celebrated[c.id]) q = q.then(function () { return celebrate(c, i); }); });
    CH.forEach(function (c, i) { if (isOpen(c) && !st.unlockSeen[c.id]) q = q.then(function () { return unlockNode(c.id, i + 1); }); });
    if (fopen() && !st.unlockSeen.final) q = q.then(function () { return unlockNode('final', 4); });
    return q.then(function () {
      arriving = false;
      updateMap(false);
      return scrollToNode(petTarget() + 1, true);
    }, function () { arriving = false; });
  }
  function celebrate(c, i) {
    return scrollToNode(i + 1, true).then(function () {
      var w = $('#map-world'), n = i + 1;
      w.classList.add('c' + n + '-done');
      var legs = $$('.leg', w); if (legs[n]) legs[n].classList.add('is-lit');
      renderNode(n, 'done');
      Sound.play('light');
      FX.at($('#node' + n), { n: 34, speed: [2, 7] });
      setHint(['¡Mira la plaza: ya tiene luces de fiesta!', '¡Mimimimi! Las luces de la tiendita ya brillan.', '¡La casita y su jardín ya brillan!'][i]);
      petSay('¡Lo hemos conseguido!');
      st.celebrated[c.id] = true; save();
      return wait(2000);
    });
  }
  function unlockNode(key, n) {
    return scrollToNode(n, true).then(function () {
      var w = $('#map-world');
      w.classList.remove('c' + n + '-locked');
      if (n === 4) w.classList.add('c4-open');
      if (n === 1) $$('.leg', w)[0].classList.add('is-lit');
      st.unlockSeen[key] = true; save();
      var node = $('#node' + n);
      renderNode(n, n === 4 ? 'open' : (ropened(CH[n - 1].sorpresa) ? 'done' : 'open'));
      node.classList.remove('pop'); node.getBoundingClientRect(); node.classList.add('pop');
      Sound.play('unlock');
      FX.at(node, { n: 36, speed: [2, 8] });
      setHint(n === 4 ? 'Junto al agua… una puerta ha empezado a brillar, y el faro se ha encendido.' : (n === 1 ? '¡La plaza se ha despertado! Tócala para empezar.' : '¡' + SHORT[n - 1] + ' se ha despertado! Tócala para entrar.'));
      placePet();
      setTimeout(function () { petSay(n === 4 ? '¡Mira cómo brilla la puerta!' : '¡Vamos, ' + C.nombres.jugadora + '!'); }, Motion.reduced ? 0 : 1050);
      return wait(1500);
    });
  }
  function goMap() {
    return go('map', function () { renderHUD(true); updateMap(true); }).then(arrive);
  }
  function nodeTap(n, b) {
    var openNow = n === 4 ? fopen() : isOpen(CH[n - 1]);
    if (!openNow) {
      Sound.play('soft');
      b.classList.remove('is-shake'); b.getBoundingClientRect(); b.classList.add('is-shake');
      var nl = nextLocked();
      petSay('Shhh… todavía es un secreto.');
      E.toast(nl && nl.n === n ? 'Se abre ' + E.when(nl.ts) + '.' : 'Paso a paso: primero lo anterior.', 'i-lock');
      return;
    }
    Sound.play('pop');
    if (n === 4) openFinale(); else openChapter(CH[n - 1]);
  }

  /* Secretitos */
  var moonTaps = 0, petTaps = 0, petT = null;
  var PHRASES = ['¡Eh, que me mareo!', '¡Guau! ¿Jugamos a la pelota?', 'Shh… estaba soñando con palomitas.', '¡Cosquillas no!'];
  function discover(id) {
    if (st.secrets[id]) return false;
    st.secrets[id] = Date.now(); save();
    Sound.play('secret');
    E.toast('Secretito encontrado (' + Object.keys(st.secrets).length + ' de ' + NSEC + ')', 'i-sparkle');
    renderHUD(true);
    return true;
  }
  function replay(node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls); node.getBoundingClientRect(); node.classList.add(cls);
    if (ms) setTimeout(function () { node.classList.remove(cls); }, ms);
  }
  function secret(id, g) {
    var r = g.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (id === 'luna') {
      moonTaps++;
      replay($('.moon-face', g), 'wink');
      Sound.play('tap');
      if (moonTaps >= 3) {
        moonTaps = 0;
        replay($('.shooting'), 'go', 1300);
        FX.burst(cx, cy, { n: 16 });
        if (!discover('luna')) E.toast('Una estrella fugaz. Pide un deseo.', 'i-sparkle');
      }
    } else if (id === 'paloma') {
      replay($('.doves', g), 'fly', 2400); Sound.play('whoosh'); discover('paloma');
    } else if (id === 'bici') {
      replay($('.bike', g), 'ride', 1300); Sound.play('ring'); discover('bici');
    } else if (id === 'helado') {
      replay($('.cone', g), 'go', 1100); Sound.play('pop');
      FX.burst(cx, cy - 20, { n: 14, kinds: ['heart', 'spark'], colors: ['#FF8FA8', '#FFF3C4', '#FFFFFF'], gravity: -0.02, speed: [0.6, 2.4] });
      discover('helado');
    } else if (id === 'barca') {
      replay($('.boat', g), 'sail', 6100); Sound.play('pop'); discover('barca');
    }
  }
  function petTap(node) {
    var pet = $('.pet', node);
    petTaps++;
    clearTimeout(petT); petT = setTimeout(function () { petTaps = 0; }, 1600);
    Sound.play('guau');
    if (petTaps >= 5) {
      petTaps = 0;
      replay(pet, 'pet-spin', 900);
      Sound.play('guauguau');
      var r = node.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 18, kinds: ['heart', 'spark'], colors: ['#FF8FA8', '#FFE07A', '#FFFFFF'] });
      if (!discover('perro')) E.toast(PHRASES[Math.floor(Math.random() * PHRASES.length)], 'i-paw');
    } else replay(pet, 'pet-hop', 600);
  }

  /* ---------- Lo dejo aquí por hoy ---------- */
  function pauseForToday() {
    save();
    E.Voice.stop();
    Sound.play('night');
    var nl = nextLocked();
    var line = nl ? (nl.n === 4 ? 'Lo último' : 'Un sitio nuevo') + ' se despierta ' + E.when(nl.ts) + '.' : '';
    var ov = el('<div class="overlay pause" role="dialog" aria-modal="true" aria-labelledby="pz-t"><div class="pause__card">' +
      '<div class="pause__moon" aria-hidden="true"></div><div class="pause__pet" aria-hidden="true">' + ART.pet('sleep') + '</div>' +
      '<h2 id="pz-t">Guardado. Lo dejamos aquí por hoy.</h2>' +
      '<p>Todo se queda tal cual. Vuelve cuando te apetezca.</p>' +
      (line ? '<p class="pause__next">' + esc(line) + '</p>' : '') +
      '<button class="btn btn--soft" data-pz="back">Seguir jugando</button></div></div>');
    document.body.appendChild(ov);
    Sound.suspend();
    var b = $('[data-pz]', ov);
    setTimeout(function () { b.focus({ preventScroll: true }); }, 60);
    ov.addEventListener('keydown', function (e) { E.trapTab(e, ov); if (e.key === 'Escape') b.click(); });
    b.addEventListener('click', function () {
      Sound.resume();
      Sound.play('tap');
      ov.classList.add('is-leaving');
      setTimeout(function () { ov.remove(); }, 250);
    }, { once: true });
  }

  /* ---------- Capítulo ---------- */
  function banner(i) {
    var p = ART.uid('bn');
    if (i === 0) return '<svg viewBox="0 36 360 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + ART.plaza(p) + '</svg>';
    if (i === 1) return '<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + ART.shopFront(p) + '</svg>';
    return '<svg viewBox="0 30 360 236" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + ART.room(p) + '</svg>';
  }
  function chapterLine(c) {
    if (!st.chapIntro[c.id]) return c.intro;
    var k = c.retos.filter(function (r) { return gdone(r.id); }).length;
    if (ropened(c.sorpresa)) return 'Puedes volver a jugar cuando quieras. Los puntos ya son tuyos.';
    if (k === c.retos.length) return '¡Capítulo completado! Mira: algo ha aparecido.';
    if (k === 1) return '¡Ya solo queda un reto!';
    return c.intro;
  }
  function giftZone(c) {
    var rid = c.sorpresa, rw = C.sorpresas[rid] || {};
    if (ropened(rid)) return '<div class="giftzone"><h3>Sorpresa descubierta</h3><p>La tienes guardada en «Mis descubrimientos».</p><button class="btn btn--soft btn--sm" data-act="viewreward" data-r="' + rid + '">' + icon('i-eye') + 'Ver de nuevo</button></div>';
    if (cdone(c)) return '<div class="giftzone is-ready" id="giftzone"><div class="mini-gift">' + ART.gift(rw.objeto) + '</div><h3>' + (rw.objeto === 'maleta' ? 'La maleta ya se puede abrir' : '¡Algo ha aparecido!') + '</h3><button class="btn btn--gold btn--shine" data-act="reveal" data-r="' + rid + '">Abrir</button></div>';
    return '<div class="giftzone"><div class="mystery" aria-hidden="true">?</div><p>Completa los dos retos y aquí aparecerá algo.</p></div>';
  }
  function renderChapter(c) {
    var i = CH.indexOf(c);
    var tasks = c.retos.map(function (r, k) {
      var done = gdone(r.id);
      return '<button class="task" data-act="game" data-g="' + r.id + '">' +
        '<span class="task__ico ' + (k === 0 ? 'ico-a' : 'ico-b') + '">' + icon(GICON[r.juego] || 'i-star') + '</span>' +
        '<span class="task__txt"><span class="task__k">Reto ' + (k + 1) + '</span><span class="task__t">' + esc(r.titulo) + '</span><span class="task__d">' + esc(r.texto) + '</span></span>' +
        '<span class="task__st">' + (done ? '<span class="pill pill--done">' + icon('i-check') + 'Hecho</span>' : '<span class="pill pill--new">Jugar</span>') + '</span></button>';
    }).join('');
    if (c.conexion) {
      var ans = !!st.answers[c.id];
      tasks += '<button class="task" data-act="connect" data-c="' + c.id + '"><span class="task__ico ico-c">' + icon('i-heart') + '</span>' +
        '<span class="task__txt"><span class="task__k">Opcional</span><span class="task__t">Un ratito para ti</span><span class="task__d">Una pregunta pequeña, solo si te apetece.</span></span>' +
        '<span class="task__st">' + (ans ? '<span class="pill pill--soft">' + icon('i-check') + 'Guardado</span>' : '<span class="task__go">' + icon('i-back') + '</span>') + '</span></button>';
    }
    $('#chap').innerHTML = '<div class="chap__banner b' + (i + 1) + (ropened(c.sorpresa) ? ' lit' : '') + '">' + banner(i) +
      '<button class="icon-btn chap__back" data-act="map" aria-label="Volver al mapa">' + icon('i-back') + '</button></div>' +
      '<div class="chap__body"><div><span class="kicker">Capítulo ' + (i + 1) + '</span><h2 class="chap__title">' + esc(c.titulo) + '</h2></div>' +
      '<div class="say"><div class="say__c">' + ART.pet(cdone(c) && !ropened(c.sorpresa) ? 'joy' : 'happy') + '</div><p class="bubble" id="chap-say">' + esc(chapterLine(c)) + '</p></div>' +
      '<div class="tasks">' + tasks + '</div>' + giftZone(c) +
      '<button class="btn btn--ghost pausebtn--inline" data-act="pause">' + icon('i-moon') + 'Lo dejo aquí por hoy</button></div>';
    $('#chap').scrollTop = 0;
    bannerParallax();
  }
  function openChapter(c) {
    cur.chapter = c;
    return go('chapter', function () { renderChapter(c); }).then(function () {
      if (!st.chapIntro[c.id]) {
        st.chapIntro[c.id] = true; save();
        var b = $('#chap-say'); if (b) E.typeInto(b, c.intro, 22);
      }
    });
  }
  function backToChapter(c, justDone) {
    return go('chapter', function () { teardownGame(); renderChapter(c); }).then(function () {
      if (!justDone) return;
      var gz = $('#giftzone');
      if (gz) {
        gz.scrollIntoView({ behavior: Motion.reduced ? 'auto' : 'smooth', block: 'center' });
        setTimeout(function () { Sound.play('unlock'); FX.at(gz, { n: 30, speed: [2, 6] }); }, 500);
      }
    });
  }
  function chapterReveal(rid) {
    reveal(rid, { closeLabel: 'Volver al mapa' }).then(function () { goMap(); });
  }

  /* ---------- Minijuegos ---------- */
  function buildGameShell() {
    $('#g-pet').innerHTML = ART.pet('happy');
    window.addEventListener('resize', function () {
      if (cur.screen === 'game') resizeFns.forEach(function (fn) { try { fn(); } catch (e) { /* nada */ } });
      if (cur.screen === 'finale') layoutFinale();
    });
  }
  function gsay(t, expr) {
    $('#g-say').textContent = t || '';
    var pet = $('#g-pet .pet');
    pet.setAttribute('data-expr', expr || 'happy');
    if (t) { pet.classList.remove('pet-hop'); pet.getBoundingClientRect(); pet.classList.add('pet-hop'); }
  }
  var stageRO = null, roRaf = 0;
  function teardownGame() {
    gameTimers.forEach(clearTimeout); gameTimers = [];
    resizeFns = [];
    if (stageRO) { stageRO.disconnect(); stageRO = null; }
    clearTimeout(assistTimer);
    if (cur.ctl && cur.ctl.destroy) { try { cur.ctl.destroy(); } catch (e) { /* nada */ } }
    cur.ctl = null;
    $('#gstage').innerHTML = '';
  }
  function setupGame() {
    teardownGame();
    var c = cur.chapter, r = cur.reto, i = CH.indexOf(c), k = c.retos.indexOf(r);
    won = false; assistShown = false;
    $('#g-kicker').textContent = 'Capítulo ' + (i + 1) + ' · Reto ' + (k + 1) + (cur.easy ? ' · Fácil' : '');
    $('#g-title').textContent = r.titulo;
    $('#gassist').hidden = true;
    gsay('', 'happy');
    var stage = $('#gstage');
    var ctx = {
      cfg: r, easy: cur.easy,
      say: gsay,
      win: function () { if (won) return; won = true; $('#gassist').hidden = true; finishGame(false); },
      struggle: showAssist,
      size: function () { var b = stage.getBoundingClientRect(); return { w: Math.max(220, b.width - 28), h: Math.max(240, b.height - 12) }; },
      later: function (fn, ms) { var t = setTimeout(fn, ms); gameTimers.push(t); return t; },
      onResize: function (fn) { resizeFns.push(fn); }
    };
    try { cur.ctl = G[r.juego](stage, ctx); }
    catch (e) { cur.ctl = null; gsay('Este reto no ha cargado bien. Puedes seguir la aventura sin perder nada.'); showAssist(); }
    if (window.ResizeObserver) {
      var lastW = 0, lastH = 0;
      stageRO = new ResizeObserver(function () {
        var b = stage.getBoundingClientRect();
        if (Math.abs(b.width - lastW) < 2 && Math.abs(b.height - lastH) < 2) return;
        lastW = b.width; lastH = b.height;
        cancelAnimationFrame(roRaf);
        roRaf = requestAnimationFrame(function () { resizeFns.forEach(function (fn) { try { fn(); } catch (er) { /* nada */ } }); });
      });
      stageRO.observe(stage);
    }
    assistTimer = setTimeout(showAssist, 150000);
  }
  function startGame(gid) {
    cur.chapter = chOf(gid); cur.reto = retoOf(gid); cur.easy = false;
    if (!cur.reto) return;
    go('game', setupGame);
  }
  function showAssist() {
    if (assistShown || won) return;
    assistShown = true;
    var a = $('#gassist');
    a.innerHTML = '<p>¿Te lo pongo más fácil? Puedes seguir sin perder nada.</p>' +
      (cur.easy ? '' : '<button class="btn btn--lilac btn--sm" data-act="easy">Modo fácil</button>') +
      '<button class="btn btn--soft btn--sm" data-act="skipgame">Seguir la aventura</button>';
    a.hidden = false;
  }
  function setEasy(on) {
    cur.easy = !!on;
    E.toast(on ? 'Modo fácil activado' : 'Modo normal', 'i-sparkle');
    setupGame();
  }
  function skipGame() {
    E.confirm('¿Seguimos la aventura?', 'Este reto contará como hecho y no te pierdes nada. Puedes volver a jugarlo cuando quieras.', 'Sí, seguir', 'Prefiero intentarlo')
      .then(function (y) { if (y && !won) { won = true; finishGame(true); } });
  }
  function openHelp() {
    var r = cur.reto; if (!r) return;
    E.Modal.open('<div class="sheet__head"><h2 data-title>Cómo se juega</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<p>' + esc(G.HOWTO[r.juego] || '') + '</p>' +
      '<div class="sheet__actions"><button class="btn btn--gold" data-close="ok" autofocus>¡Entendido!</button>' +
      (cur.easy ? '<button class="btn btn--soft" data-close="normal">Volver al modo normal</button>' : '<button class="btn btn--lilac" data-close="easy">Jugar en modo fácil</button>') +
      '<button class="btn btn--soft" data-close="skip">Seguir la aventura</button></div>').done.then(function (v) {
      if (v === 'easy') setEasy(true);
      else if (v === 'normal') setEasy(false);
      else if (v === 'skip') skipGame();
    });
  }
  function exitGame() {
    var c = cur.chapter;
    go('chapter', function () { teardownGame(); renderChapter(c); });
  }
  function finishGame(skipped) {
    var r = cur.reto, c = cur.chapter;
    var g = st.games[r.id] || {}, first = !g.done, before = st.xp;
    st.games[r.id] = { done: true, at: g.at || Date.now(), plays: (g.plays || 0) + 1, skipped: g.done ? !!g.skipped : !!skipped };
    if (!skipped && !g.awarded && (first || g.skipped)) st.xp += C.xpPorReto;
    st.games[r.id].awarded = !!g.awarded || !skipped;
    if (!skipped) st.games[r.id].skipped = false;
    save();
    clearTimeout(assistTimer);
    showWin({ first: st.xp > before, before: before, after: st.xp, skipped: skipped, juego: r.juego, pieces: pieceCount() }).then(function (v) {
      if (v === 'again') { setupGame(); return; }
      levelUps().then(function () { backToChapter(c, first && cdone(c) && !ropened(c.sorpresa)); });
    });
  }
  function showWin(o) {
    return new Promise(function (resolve) {
      var Lb = E.levelFor(o.before), Nb = E.nextLevel(Lb);
      var title = o.skipped ? '¡Seguimos!' : WINS[Math.floor(Math.random() * WINS.length)];
      var msg = o.skipped ? 'Este reto ya cuenta como hecho. Sin prisas.' : (GAMEMSG[o.juego] || '¡Muy bien!');
      var xp = '';
      if (o.first) {
        var w0 = Nb ? Math.max(0, Math.min(100, (o.before - Lb.xp) / (Nb.xp - Lb.xp) * 100)) : 100;
        xp = '<p class="winp__xp"><span data-x="n">+0</span> XP</p>' +
          '<div class="winp__lv"><div class="winp__lvrow"><span>Nivel ' + Lb.nivel + ' · ' + esc(Lb.nombre) + '</span><span data-x="t">' + o.before + (Nb ? ' / ' + Nb.xp : '') + ' XP</span></div>' +
          '<div class="xpbar"><span class="xpbar__fill" data-x="f" style="width:' + w0 + '%"></span></div></div>' +
          '<div class="winp__piece"><span class="winp__pc" aria-hidden="true">' + icon('i-puzzle') + '</span><span><b>¡Una pieza más!</b> Llevas ' + o.pieces + ' de ' + NPIECES + '. Guárdala: servirá más adelante.</span></div>';
      } else {
        xp = '<p class="winp__sub">Ya tenías los puntos de este reto. ¡Qué bien se te da!</p>';
      }
      var ov = el('<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="win-t"><div class="winp">' +
        '<div class="ribbon" id="win-t">' + title + '</div>' +
        '<div class="wstars" aria-hidden="true">' + [0, 1, 2].map(function () { return '<svg class="wstar" viewBox="0 0 24 24"><use href="#i-heart"/></svg>'; }).join('') + '</div>' +
        '<p class="winp__msg">' + esc(msg) + '</p>' + xp +
        '<div class="winp__actions"><button class="btn btn--gold" data-w="go">Continuar</button>' +
        '<button class="btn btn--soft btn--sm" data-w="again">' + icon('i-replay') + 'Jugar otra vez</button></div>' +
        '<div class="winp__pet bob" aria-hidden="true">' + ART.pet('joy') + '</div></div></div>');
      document.body.appendChild(ov);
      Sound.play('win');
      FX.confetti(window.innerWidth / 2, window.innerHeight * 0.3, 70);
      $$('.wstar', ov).forEach(function (s, i) { setTimeout(function () { s.classList.add('is-on'); Sound.play('star'); }, 380 + i * 260); });
      if (o.first) {
        setTimeout(function () {
          var n = $('[data-x="n"]', ov), t = $('[data-x="t"]', ov), f = $('[data-x="f"]', ov), gain = o.after - o.before, last = 0;
          E.anim(Motion.reduced ? 1 : 850, function (p) {
            var v = Math.round(gain * p);
            n.textContent = '+' + v;
            t.textContent = (o.before + v) + (Nb ? ' / ' + Nb.xp : '') + ' XP';
            if (v - last >= 5) { last = v; Sound.play('xp'); }
          });
          f.style.width = (Nb ? Math.min(100, (o.after - Lb.xp) / (Nb.xp - Lb.xp) * 100) : 100) + '%';
          var r = n.getBoundingClientRect(); E.xpFloat(r.left + r.width / 2, r.top, '+' + gain + ' XP');
        }, 1150);
        setTimeout(function () { var pc = $('.winp__piece', ov); if (pc) { pc.classList.add('is-on'); Sound.play('found'); FX.at($('.winp__pc', ov), { n: 14, speed: [1.2, 3.6] }); } }, 2000);
      }
      var bGo = $('[data-w="go"]', ov);
      setTimeout(function () { bGo.focus({ preventScroll: true }); }, 60);
      ov.addEventListener('keydown', function (e) { E.trapTab(e, ov); });
      var closed = false;
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('[data-w]');
        if (!b || closed) return;
        closed = true;
        Sound.play('tap');
        ov.classList.add('is-leaving');
        setTimeout(function () { ov.remove(); }, 250);
        resolve(b.getAttribute('data-w'));
      });
    });
  }
  function levelUps() {
    var L = lvl();
    if (L.nivel <= st.levelSeen) return Promise.resolve();
    st.levelSeen = L.nivel; save();
    return showLevelUp(L);
  }
  function showLevelUp(L) {
    return new Promise(function (resolve) {
      var ov = el('<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="lv-t"><div class="rays" aria-hidden="true"></div><div class="lvlup">' +
        '<div class="medal" aria-hidden="true"><span>' + L.nivel + '</span></div><div class="lvlup__pet" aria-hidden="true">' + ART.pet('cheer') + '</div>' +
        '<p class="lvlup__k">¡Subes de nivel!</p><h2 id="lv-t">' + esc(L.nombre) + '</h2>' +
        '<p>' + esc(L.frase || 'Cada reto suma.') + '</p>' +
        '<button class="btn btn--gold btn--shine">¡Genial!</button></div></div>');
      document.body.appendChild(ov);
      Sound.play('levelup');
      setTimeout(function () {
        FX.confetti(window.innerWidth / 2, window.innerHeight * 0.38, 90);
        FX.burst(window.innerWidth / 2, window.innerHeight * 0.34, { n: 30, speed: [3, 9] });
      }, 450);
      var b = $('button', ov);
      setTimeout(function () { b.focus({ preventScroll: true }); }, 60);
      ov.addEventListener('keydown', function (e) { E.trapTab(e, ov); });
      b.addEventListener('click', function () {
        Sound.play('tap');
        ov.classList.add('is-leaving');
        setTimeout(function () { ov.remove(); resolve(); }, 250);
      }, { once: true });
    });
  }

  /* ---------- Un ratito para ti ---------- */
  var LEADS = ['Puedes elegir varias, escribirlo a tu manera o dejarlo para otro momento.', 'Elige lo que encaje, aunque sea más de una cosa.', 'Lo que te apetezca, sin compromiso.'];
  function answerText(a) {
    var s = (a.opts || []).join(' · ');
    if (a.text) s += (s ? '\n' : '') + a.text;
    return s;
  }
  function openConnect(c) {
    cur.chapter = c;
    go('connect', function () { renderConnect(c); });
  }
  function renderConnect(c) {
    var i = CH.indexOf(c), q = c.conexion, a = st.answers[c.id] || { opts: [], text: '' };
    var saved = !!st.answers[c.id];
    $('#conn').innerHTML = '<div class="conn__body">' +
      '<div class="conn__top"><button class="icon-btn" data-act="chapter" aria-label="Volver al capítulo">' + icon('i-back') + '</button><span class="kicker">Un ratito para ti · opcional</span></div>' +
      '<h2 class="conn__q">' + esc(q.pregunta) + '</h2>' +
      '<p class="conn__lead">' + esc(LEADS[i % LEADS.length]) + '</p>' +
      (q.aclaracion ? '<p class="conn__note">' + icon('i-sparkle') + '<span>' + esc(q.aclaracion) + '</span></p>' : '') +
      '<div class="privacy">' + icon('i-lock') + '<span>' + (st.privacySeen ? 'Se guarda solo en este móvil.' : 'Lo que guardes aquí se queda solo en este móvil: no se envía a nadie. Puedes borrarlo cuando quieras desde Ajustes.') + '</span></div>' +
      '<div class="chips" role="group" aria-label="Opciones">' + q.opciones.map(function (o, k) {
        return '<button class="chip" data-chip="' + k + '" aria-pressed="' + ((a.opts || []).indexOf(o) >= 0) + '">' + esc(o) + '</button>';
      }).join('') + '</div>' +
      '<label class="sr" for="conn-text">Si te apetece, escríbelo con tus palabras</label>' +
      '<textarea id="conn-text" rows="3" placeholder="Si te apetece, escríbelo con tus palabras…">' + esc(a.text || '') + '</textarea>' +
      '<div class="conn__actions"><div class="conn__row">' +
      '<button class="btn" data-act="conn-save">' + icon('i-check') + 'Guardar para mí</button>' +
      '<button class="btn btn--soft" data-act="conn-share">' + icon('i-share') + 'Compartir si quiero</button></div>' +
      '<button class="btn btn--ghost" data-act="conn-skip">' + esc(q.textoPasar || 'Ahora no') + '</button>' +
      (saved ? '<button class="btn btn--ghost" data-act="conn-del">Borrar mi respuesta</button>' : '') + '</div>' +
      (q.notaDePaulo ? '<div class="note"><span class="note__k">Una notita de ' + esc(C.nombres.remitente) + '</span><p class="note__t">' + esc(q.notaDePaulo) + '</p></div>' : '') +
      '</div>';
    $('#conn').scrollTop = 0;
  }
  function connCollect() {
    var c = cur.chapter, q = c.conexion;
    var opts = $$('#conn .chip').filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return q.opciones[+b.getAttribute('data-chip')]; });
    var text = ($('#conn-text').value || '').trim();
    return { opts: opts, text: text };
  }
  function connSave() {
    var c = cur.chapter, a = connCollect();
    if (!a.opts.length && !a.text) { E.toast('Elige algo o escribe unas palabras. O toca «' + (c.conexion.textoPasar || 'Ahora no') + '».', 'i-note'); return; }
    a.at = Date.now();
    st.answers[c.id] = a; st.privacySeen = true; save();
    Sound.play('place');
    E.toast('Guardado solo en este móvil', 'i-lock');
    openChapter(c);
  }
  function connShare() {
    var c = cur.chapter, a = connCollect();
    if (!a.opts.length && !a.text) { E.toast('Primero elige algo o escribe unas palabras.', 'i-note'); return; }
    E.shareText(c.conexion.pregunta, c.conexion.pregunta + '\n' + answerText(a));
  }
  function connDelete() {
    var c = cur.chapter;
    E.confirm('¿Borrar tu respuesta?', 'Se borrará de este móvil.', 'Borrar', 'Cancelar').then(function (y) {
      if (!y) return;
      delete st.answers[c.id]; save();
      E.toast('Respuesta borrada', 'i-trash');
      renderConnect(c);
    });
  }

  /* ---------- Cuaderno privado ---------- */
  function fmtDate(ts) { var d = new Date(ts); return d.getDate() + ' de ' + E.MESES[d.getMonth()] + ', ' + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function openNotebook(draft) {
    var list = st.cuaderno || [];
    var md = E.Modal.open('<div class="sheet__head"><h2 data-title>Mi cuaderno</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<p class="nb-lead">' + esc((C.cuaderno && C.cuaderno.texto) || '') + '</p>' +
      '<div class="privacy">' + icon('i-lock') + '<span>Se queda solo en este móvil. A ' + esc(C.nombres.remitente) + ' no le llega nada, salvo que tú decidas compartirlo. Puedes borrarlo cuando quieras.</span></div>' +
      '<label class="sr" for="nb-text">Escribe aquí</label><textarea class="field nb-text" id="nb-text" rows="4" placeholder="Si te apetece, escribe aquí…">' + esc(draft || '') + '</textarea>' +
      '<div class="sheet__actions"><button class="btn" data-nb="save">' + icon('i-check') + 'Guardar para mí</button><button class="btn btn--soft" data-close>Ahora no</button></div>' +
      (list.length ? '<p class="pv-h">Lo que has guardado</p>' + list.map(function (n, i) {
        return '<div class="ans"><p class="ans__q">' + esc(fmtDate(n.at)) + '</p><p class="ans__a">' + esc(n.t) + '</p>' +
          '<div class="ans__row"><button class="btn btn--soft btn--sm" data-nb="share" data-i="' + i + '">' + icon('i-share') + 'Compartir si quiero</button>' +
          '<button class="btn btn--soft btn--sm" data-nb="del" data-i="' + i + '">' + icon('i-trash') + 'Borrar</button></div></div>';
      }).join('') : ''));
    md.sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nb]');
      if (!b) return;
      var a = b.getAttribute('data-nb'), i = +b.getAttribute('data-i');
      if (a === 'save') {
        var t = ($('#nb-text', md.sheet).value || '').trim();
        if (!t) { E.toast('Escribe algo, o toca «Ahora no».', 'i-note'); return; }
        st.cuaderno.push({ t: t, at: Date.now() }); save();
        Sound.play('place');
        E.toast('Guardado solo en este móvil', 'i-lock');
        md.close();
        setTimeout(function () { openNotebook(); refreshAfterNotes(); }, 220);
      } else if (a === 'share') {
        var n = st.cuaderno[i]; if (n) E.shareText('Mi cuaderno', n.t);
      } else if (a === 'del') {
        var keep = ($('#nb-text', md.sheet).value || '');
        md.close();
        setTimeout(function () {
          E.confirm('¿Borrar esta nota?', 'Se borrará de este móvil.', 'Borrar', 'Cancelar').then(function (y) {
            if (y) { st.cuaderno.splice(i, 1); save(); E.toast('Nota borrada', 'i-trash'); refreshAfterNotes(); }
            openNotebook(keep);
          });
        }, 200);
      }
    });
  }
  function refreshAfterNotes() {
    if (cur.screen === 'collection') renderCollection();
  }

  /* ---------- Revelación de sorpresas ---------- */
  function reveal(rid, o) {
    o = o || {};
    var fresh = !ropened(rid) && !o.view;
    var rw = C.sorpresas[rid];
    var teaser = fresh && rw.antesDeAbrir ? rw.antesDeAbrir : null;
    return new Promise(function (resolve) {
      var ov = el('<div class="overlay reveal" role="dialog" aria-modal="true" aria-labelledby="rv-t">' +
        (fresh ? '<div class="reveal__stage"><p class="reveal__k" id="rv-t">' + (rw.objeto === 'maleta' ? '¿Qué habrá en la maleta?' : 'Algo ha aparecido…') + '</p><p class="reveal__sub">Es para ti.</p>' +
          (teaser ? '<div class="teaser"><p class="teaser__k">' + esc(C.nombres.remitente) + ' dice:</p><p class="teaser__t">«' + esc(teaser.texto) + '»</p><div class="teaser__v"></div></div>' : '') +
          '<div class="giftwrap">' + ART.gift(rw.objeto) + '<div class="reveal__pet" aria-hidden="true">' + ART.pet('wow') + '</div></div><button class="btn btn--gold btn--shine" data-rv="open">Abrir</button></div>' : '') +
        '<div class="reveal__result"' + (fresh ? ' hidden' : '') + '></div></div>');
      document.body.appendChild(ov);
      if (teaser && teaser.audio) E.Voice.mini($('.teaser__v', ov), teaser.audio, 'Escuchar');
      var result = $('.reveal__result', ov), closed = false;
      function close() {
        if (closed) return; closed = true;
        E.Voice.stop();
        ov.classList.add('is-leaving');
        setTimeout(function () { ov.remove(); }, 250);
        resolve();
      }
      function fill() {
        var at = st.rewards[rid] ? st.rewards[rid].at : Date.now();
        result.innerHTML = '<p class="reveal__title" id="rv-tt">' + (fresh ? 'Una sorpresa para ti' : 'Tu sorpresa') + '</p>' +
          E.couponHTML(rid, at) +
          '<div class="voicebox"></div>' +
          '<div class="reveal__actions"><button class="btn btn--gold" data-rv="save">' + icon('i-save') + 'Guardar cupón</button>' +
          '<button class="btn btn--soft" data-rv="close">' + esc(o.closeLabel || 'Cerrar') + '</button></div>';
        ov.setAttribute('aria-labelledby', 'rv-tt');
        result.hidden = false;
        requestAnimationFrame(function () { E.fitCoupon(result); });
        setTimeout(function () { E.fitCoupon(result); }, 700);
        E.Voice.mount($('.voicebox', result), rw.audio, rw.transcripcion);
        E.couponBlob(rid, at);
        setTimeout(function () { var f = $('[data-rv="save"]', result); if (f) f.focus({ preventScroll: true }); }, 500);
      }
      ov.addEventListener('keydown', function (e) { E.trapTab(e, ov); if (e.key === 'Escape' && !result.hidden) close(); });
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rv]');
        if (!b) return;
        var a = b.getAttribute('data-rv');
        if (a === 'open') {
          if (b.disabled) return;
          b.disabled = true;
          E.Voice.stop();
          if (!st.rewards[rid]) { st.rewards[rid] = { at: Date.now() }; save(); }
          var gift = $('.gift', ov), wrap = $('.giftwrap', ov);
          setExpr($('.reveal__pet', ov), 'cheer');
          Sound.play('reveal');
          gift.classList.add('is-shake');
          setTimeout(function () {
            gift.classList.remove('is-shake');
            gift.classList.add('is-open');
            wrap.insertAdjacentHTML('afterbegin', '<div class="burst" aria-hidden="true"></div>');
            var r = wrap.getBoundingClientRect();
            FX.confetti(r.left + r.width / 2, r.top + r.height * 0.4, 90);
            FX.burst(r.left + r.width / 2, r.top + r.height * 0.4, { n: 36, speed: [3, 10] });
          }, Motion.reduced ? 40 : 650);
          setTimeout(function () { $('.reveal__stage', ov).hidden = true; fill(); }, Motion.reduced ? 200 : 1550);
        } else if (a === 'save') {
          Sound.play('tap');
          E.saveCoupon(rid, st.rewards[rid] ? st.rewards[rid].at : Date.now());
        } else if (a === 'close') {
          Sound.play('tap');
          close();
        }
      });
      if (fresh) setTimeout(function () { var b = $('[data-rv="open"]', ov); if (b) b.focus({ preventScroll: true }); }, 900);
      else fill();
    });
  }

  /* ---------- Final: la puerta del viernes ---------- */
  var finPl = null, finMist = 0, finHelpT = null;
  function finSay(t, expr) {
    var b = $('#fin-bubble'); if (!b) return Promise.resolve();
    setExpr($('#fin-say'), expr);
    return E.typeInto(b, t, 22).done;
  }
  function renderFinale() {
    var f = $('#scr-finale'), opened = !!st.finale.opened;
    if (finPl) { finPl.destroy(); finPl = null; }
    clearTimeout(finHelpT);
    finMist = 0;
    f.classList.toggle('is-open', opened);
    var have = piecesHave(), given = !!st.finale.given;
    f.innerHTML = ART.finaleBg() +
      '<div class="fin-scene" id="fin-scene" aria-hidden="true"><svg viewBox="0 0 300 450" preserveAspectRatio="xMidYMax slice" focusable="false">' + ART.lake(ART.uid('lk')) + '</svg></div>' +
      '<div class="fin-main" id="fin-main">' +
      '<div class="fin-top"><button class="icon-btn" data-act="map" aria-label="Volver al mapa">' + icon('i-back') + '</button><h2 class="fin-title">' + esc(C.final.titulo) + '</h2><span style="width:48px;flex:none"></span></div>' +
      '<div class="fin-stage">' +
      '<div class="fin-say" id="fin-say"><div class="say"><div class="say__c">' + ART.pet('happy') + '</div><p class="bubble" id="fin-bubble" aria-live="polite"></p></div></div>' +
      (opened ? '<div class="fin-space"></div>' :
        '<div class="fdoor" id="fdoor"><div class="fdoor__aura"></div><div class="fdoor__frame"></div>' +
        '<div class="fdoor__board" id="fboard"><div class="fdoor__ghost"><svg viewBox="0 0 300 450" preserveAspectRatio="none" aria-hidden="true"><use href="#lake-art" width="300" height="450"/></svg></div>' +
        '<div class="fdoor__slots">' + [0, 1, 2, 3, 4, 5].map(function (i) {
          var on = st.finale.placed.indexOf(i) >= 0;
          return '<button class="fslot' + (on ? ' is-filled' : '') + '" data-i="' + i + '" aria-label="Hueco ' + PPLACE[i] + (on ? ': pieza colocada' : '') + '">' + (on ? pieceSVG(i) : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="fdoor__full"><svg viewBox="0 0 300 450" preserveAspectRatio="none" aria-hidden="true"><use href="#lake-art" width="300" height="450"/></svg></div></div>' +
        '<span class="fdoor__knob" aria-hidden="true"></span></div>' +
        '<div class="ftray" id="ftray" role="group" aria-label="Piezas">' + [0, 1, 2, 3, 4, 5].map(function (i) {
          var used = st.finale.placed.indexOf(i) >= 0, ok = have[i] || given;
          return '<button class="fpiece' + (ok ? '' : ' is-missing') + (used ? ' is-used' : '') + '" data-p="' + i + '" aria-label="' + (ok ? 'Pieza del cuadro' : 'Pieza que falta') + '">' + pieceSVG(i) + '</button>';
        }).join('') + '</div>' +
        '<div class="fin-help" id="fin-help" hidden><button class="btn btn--ghost" data-act="fhelp">¿Me ayudas, ' + esc(PET) + '?</button></div>') +
      '<div class="fin-after" id="fin-after"></div>' +
      '</div></div>';
    layoutFinale();
    if (!opened) bindFinalePuzzle();
  }
  function layoutFinale() {
    var d = $('#fdoor'); if (!d) return;
    var W = window.innerWidth, H = window.innerHeight;
    var piece = Math.floor(Math.min(56, (Math.min(W, 520) - 32 - 5 * 8) / 6));
    var avail = H - 64 - 86 - (piece + 22) - 74;
    var dw = Math.floor(Math.max(150, Math.min(270, W * 0.64, avail * 2 / 3)));
    d.style.setProperty('--dw', dw + 'px');
    $('#ftray').style.setProperty('--pc', piece + 'px');
  }
  function bindFinalePuzzle() {
    var pieces = $$('#ftray .fpiece'), slots = $$('#fdoor .fslot');
    finPl = G.placer({
      items: pieces, targets: slots, pad: 4,
      enabled: function () { return !st.finale.opened && !opening; },
      isDone: function (b) { return b.classList.contains('is-used'); },
      isTargetDone: function (t) { return t.classList.contains('is-filled'); },
      ghost: function (b) { return pieceSVG(+b.getAttribute('data-p')); },
      onSelect: function (b) {
        if (b.classList.contains('is-missing')) { givePieces(); }
        finSay('Ahora toca su hueco en la puerta.');
      },
      noSel: function () { Sound.play('tap'); finSay('Primero elige una pieza de abajo.'); },
      drop: function (b, slot, fromRect) {
        var i = +b.getAttribute('data-p'), k = +slot.getAttribute('data-i');
        finPl.deselect();
        if (b.classList.contains('is-missing')) givePieces();
        if (slot.classList.contains('is-filled')) return;
        if (i !== k) {
          finMist++;
          replay(b, 'is-shake', 450);
          Sound.play('soft');
          finSay(finMist >= 3 ? 'Esa va en otro hueco. Si quieres, te ayudo yo.' : 'Esa va en otro hueco. Fíjate en el dibujo de fondo.');
          if (finMist >= 2) $('#fin-help').hidden = false;
          return;
        }
        placePiece(i, fromRect);
      }
    });
    finHelpT = setTimeout(function () { var h = $('#fin-help'); if (h && !st.finale.opened) h.hidden = false; }, 30000);
  }
  function placePiece(i, fromRect) {
    var b = $('#ftray .fpiece[data-p="' + i + '"]'), slot = $('#fdoor .fslot[data-i="' + i + '"]');
    if (!b || !slot || st.finale.placed.indexOf(i) >= 0) return Promise.resolve();
    b.classList.add('is-used');
    st.finale.placed.push(i); save();
    Sound.play('pop');
    return G.flyTo(fromRect || b.getBoundingClientRect(), slot, pieceSVG(i), { size: Math.round(slot.getBoundingClientRect().width), arc: 30, from: 1, to: 1, ms: 520 }).then(function () {
      slot.classList.add('is-filled');
      slot.setAttribute('aria-label', 'Hueco ' + PPLACE[i] + ': pieza colocada');
      slot.innerHTML = pieceSVG(i);
      Sound.play('place');
      FX.at(slot, { n: 12, speed: [1.5, 4] });
      var n = st.finale.placed.length;
      if (n >= NPIECES) readyDoor();
      else finSay(['¡Encaja!', '¡Perfecta!', 'Muy bien.', '¡Esa sí!', 'Ya casi está.'][Math.min(4, n - 1)] + ' ' + (NPIECES - n === 1 ? 'Falta una.' : 'Faltan ' + (NPIECES - n) + '.'), 'joy');
    });
  }
  function givePieces() {
    if (st.finale.given) return Promise.resolve();
    st.finale.given = true; save();
    var from = $('#fin-say .say__c');
    var miss = $$('#ftray .fpiece.is-missing');
    return Promise.all(miss.map(function (b, k) {
      return wait(k * 260).then(function () {
        Sound.play('found');
        return G.flyTo(from.getBoundingClientRect(), b, pieceSVG(+b.getAttribute('data-p')), { size: 44, ms: 640 });
      }).then(function () { b.classList.remove('is-missing'); b.setAttribute('aria-label', 'Pieza del cuadro'); FX.at(b, { n: 12 }); });
    }));
  }
  function finaleHelp() {
    if (st.finale.opened || opening) return;
    $('#fin-help').hidden = true;
    finSay('¡Vamos allá! Las pongo yo.', 'joy');
    givePieces().then(function () {
      var left = [0, 1, 2, 3, 4, 5].filter(function (i) { return st.finale.placed.indexOf(i) < 0; });
      return left.reduce(function (q, i) { return q.then(function () { return placePiece(i).then(function () { return wait(180); }); }); }, Promise.resolve());
    });
  }
  function openFinale() {
    opening = false;
    go('finale', renderFinale).then(finaleArrive);
  }
  function finaleArrive() {
    if (st.finale.opened) { showAfter(false); finSay('Esta puerta ya está abierta. Puedes volver cuando quieras.', 'joy'); return; }
    if (st.finale.placed.length >= NPIECES) { readyDoor(); return; }
    var missing = piecesHave().filter(function (x) { return !x; }).length;
    finSay('Esta es la puerta del viernes. Para abrirla, hay que completar su cuadro.').then(function () { return wait(900); }).then(function () {
      if (missing && !st.finale.given) {
        return finSay(missing === NPIECES ? 'No hace falta haber jugado: te he guardado todas las piezas.' : 'Te falta alguna pieza, pero no pasa nada: las tenía yo.', 'joy')
          .then(function () { return givePieces(); }).then(function () { return wait(500); });
      }
    }).then(function () {
      if (cur.screen === 'finale' && !st.finale.opened && st.finale.placed.length < NPIECES) finSay('Toca una pieza y luego su hueco. También puedes arrastrarla.');
    });
  }
  function readyDoor() {
    var d = $('#fdoor');
    if (!d) return;
    d.classList.add('is-ready');
    $('#ftray').classList.add('is-gone');
    $('#fin-help').hidden = true;
    Sound.play('unlock');
    finSay('¡Completo! Ábrela cuando quieras.', 'joy');
    $('#fin-after').innerHTML = '<button class="btn btn--gold btn--shine btn--wide" data-act="opendoor">Abrir la puerta</button>';
    setTimeout(function () { var b = $('[data-act="opendoor"]'); if (b) b.focus({ preventScroll: true }); }, 100);
  }
  function openDoor() {
    if (st.finale.opened || opening) return;
    opening = true;
    $('#fin-after').innerHTML = '';
    var d = $('#fdoor'), scr = $('#scr-finale'), scene = $('#fin-scene');
    var r = $('#fboard').getBoundingClientRect();
    Sound.play('door');
    d.classList.add('is-opening');
    setTimeout(function () {
      var fl = el('<div class="fflood" aria-hidden="true"></div>');
      fl.style.left = (r.left + r.width / 2) + 'px'; fl.style.top = (r.top + r.height / 2) + 'px';
      document.body.appendChild(fl);
      fl.classList.add('go');
      setTimeout(function () { fl.remove(); }, 2600);
      FX.burst(r.left + r.width / 2, r.top + r.height * 0.5, { n: 44, speed: [3, 11] });
    }, Motion.reduced ? 0 : 650);
    setTimeout(function () {
      scr.classList.add('is-open');
      if (!Motion.reduced && scene.animate) {
        scene.style.transformOrigin = (r.left + r.width / 2) + 'px ' + (r.top + r.height / 2) + 'px';
        scene.animate([{ transform: 'scale(' + Math.max(0.2, r.width / window.innerWidth).toFixed(3) + ')', opacity: 0.3 }, { transform: 'scale(1)', opacity: 1 }], { duration: 1300, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      FX.rain('petal', 60, ['#FFE07A', '#FFD25E', '#FFF3C4', '#FFC2D2', '#FFFFFF']);
      finSay('Mira… es junto al agua.', 'wow');
    }, Motion.reduced ? 100 : 1250);
    setTimeout(function () {
      st.finale.opened = true; st.finale.openedAt = Date.now(); save();
      opening = false;
      if (finPl) { finPl.destroy(); finPl = null; }
      var dd = $('#fdoor'); if (dd) dd.remove();
      var tr = $('#ftray'); if (tr) tr.remove();
      var hp = $('#fin-help'); if (hp) hp.remove();
      showAfter(true);
      finSay('Esto es para ti.', 'joy');
    }, Motion.reduced ? 300 : 3300);
  }
  function showAfter(fresh) {
    var after = $('#fin-after');
    if (!after) return;
    var got = ropened(C.final.sorpresa);
    if (!$('.fin-space')) after.insertAdjacentHTML('beforebegin', '<div class="fin-space"></div>');
    after.innerHTML = '<section class="fin-panel' + (fresh ? ' is-fresh' : '') + '" aria-labelledby="fp-k"><p class="fin-panel__k" id="fp-k">Para ' + esc(C.nombres.jugadora) + '</p>' +
      '<div id="fin-voice"></div>' +
      (C.final.carta ? '<button class="envelope" data-act="letter"><span class="envelope__ico">' + icon('i-letter') + '</span><span class="envelope__t"><b>Hay una carta para ti</b><small>Ábrela cuando te apetezca.</small></span></button>' : '') +
      (C.final.sorpresa && C.sorpresas[C.final.sorpresa] ? '<button class="btn btn--gold btn--shine btn--wide" data-act="finalgift">' + (got ? 'Ver tu última sorpresa' : 'Una última sorpresa') + '</button>' : '') +
      passBtnHTML() +
      '<div class="fin-panel__row"><button class="btn btn--soft btn--sm" data-act="map">Volver al mapa</button><button class="btn btn--soft btn--sm" data-act="collection">Mis descubrimientos</button></div>' +
      '</section>';
    E.Voice.mount($('#fin-voice'), C.final.audio, C.final.transcripcion);
    if (fresh) setTimeout(function () { after.scrollIntoView({ behavior: Motion.reduced ? 'auto' : 'smooth', block: 'end' }); }, 400);
  }
  function openLetter() {
    var words = Motion.reduced ? esc(C.final.carta) : C.final.carta.split(/\s+/).map(function (w, i) { return '<span class="w" style="--i:' + i + '">' + esc(w) + '</span>'; }).join(' ');
    Sound.play('soft');
    E.Modal.open('<div class="sheet__head"><h2 data-title>Una carta para ti</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<article class="letter"><p class="letter__k">Para ' + esc(C.nombres.jugadora) + '</p><p class="letter__msg">' + words + '</p><p class="letter__sign">' + esc(C.final.firma) + '</p>' +
      '<span class="letter__flower" aria-hidden="true">' + icon('i-flower') + '</span></article>' +
      '<div class="sheet__actions"><button class="btn btn--soft" data-close autofocus>Cerrar</button></div>');
  }
  function finalGift() {
    var rid = C.final.sorpresa;
    reveal(rid, { closeLabel: 'Cerrar', view: ropened(rid) }).then(function () {
      var b = $('[data-act="finalgift"]'); if (b) b.textContent = 'Ver tu última sorpresa';
    });
  }

  /* ---------- El pase del final ----------
     Sin servidor, el pase es un recuerdo que vive en este móvil. Con el
     servidor del pase (config.js → pase.servidor) además tiene un QR que
     solo sirve para comprobarlo, botones de Wallet y el canje en persona.
     El juego solo habla con el servidor cuando Naroa abre su pase o toca
     uno de sus botones: nada en segundo plano, y nunca envía sus respuestas
     ni su cuaderno; solo el número del pase y un código al azar del móvil. */
  var PK = C.pase || {};
  var passOpen = false;
  var PASS_LINES = ['¡Aquí está tu pase!', 'Lo guardo yo también, por si acaso.', '¡Qué bonito ha quedado!'];
  function enc(v) { return encodeURIComponent(v); }
  function paseServer() {
    // Dentro de claude.ai la página no puede hablar con otros dominios: allí el pase es solo un recuerdo.
    var u = String(PK.servidor || '').trim();
    if (!u || E.inArtifact) return '';
    try { u = new URL(u, location.href).href; } catch (e) { return ''; }
    if (!/^https?:/i.test(u)) return '';
    return u.replace(/[?#].*$/, '').replace(/\/?$/, '/');
  }
  function aventuraId() { return String(PK.idAventura || 'una-pequena-aventura') + (S.preview ? '-prueba' : ''); }
  function ensurePase() {
    var P = st.pase;
    if (!P || typeof P !== 'object' || !P.id || !P.dev) {
      P = st.pase = { id: E.passId(), at: st.finale.openedAt || Date.now(), dev: E.token(24), test: !!S.preview, srv: null, err: null, seen: false };
      save();
    }
    return P;
  }
  function passApi(action, q, body) {
    var url = paseServer() + 'api.php?a=' + action + (q ? '&' + q : '');
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    var o = { method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'omit' };
    if (ctl) o.signal = ctl.signal;
    if (body) { o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(body); }
    return fetch(url, o).then(function (r) {
      return r.json().then(function (j) { return j; }, function () { return null; }).then(function (j) {
        clearTimeout(timer);
        if (!j || typeof j !== 'object') return { ok: false, error: 'respuesta', status: r.status };
        if (!r.ok) j.ok = false;
        j.status = r.status;
        return j;
      });
    }, function () { clearTimeout(timer); return { ok: false, error: 'red' }; });
  }
  function srvFrom(j, prev) {
    prev = prev || {};
    var w = j.wallet;
    return {
      cred: j.credencial || prev.cred, url: j.urlVerificacion || prev.url,
      emitido: j.emitido || prev.emitido || null, estado: j.estado || 'activo', canjeado: j.canjeado || null,
      apple: w ? !!w.apple : !!prev.apple, google: w ? !!w.google : !!prev.google,
      extra: !!j.extra, extraMsg: prev.extraMsg || null, checked: Date.now()
    };
  }
  function issuePase(P) {
    return passApi('emitir', '', { aventura: aventuraId(), dispositivo: P.dev, id: P.id }).then(function (j) {
      var p = j.pase;
      if (j.ok && p && p.credencial && p.urlVerificacion) {
        if (p.id) P.id = p.id;
        P.srv = srvFrom({ credencial: p.credencial, urlVerificacion: p.urlVerificacion, emitido: p.emitido, estado: p.estado, canjeado: p.canjeado, wallet: j.wallet });
        P.err = null;
      } else {
        P.err = { code: j.error || 'red', at: Date.now() };
      }
      save();
      return { was: null };
    });
  }
  function checkPase(P) {
    var was = P.srv.estado;
    return passApi('estado', 'c=' + enc(P.srv.cred) + '&t=' + enc(P.dev)).then(function (j) {
      if (j.ok && j.valido) { P.srv = srvFrom(j, P.srv); P.err = null; save(); return { was: was }; }
      if (j.ok && j.valido === false) {
        // El servidor ya no conoce este pase (por ejemplo, se borraron los de prueba): se pide de nuevo.
        P.srv = null; P.err = null; save();
        return issuePase(P);
      }
      P.err = { code: j.error || 'red', at: Date.now() }; save();
      return { was: was, offline: true };
    });
  }
  function syncPase(P) {
    if (!paseServer()) return Promise.resolve({});
    return P.srv ? checkPase(P) : issuePase(P);
  }
  function fmtDay(iso) { var t = Date.parse(iso); return isFinite(t) ? E.dateLabel(t) : ''; }
  function passStatus(P, busy) {
    if (!paseServer()) return { cls: 'is-local', ic: 'i-heart', t: 'Recuerdo de la aventura', s: 'Vive en este móvil y no necesita internet.' };
    var s = P.srv, code = P.err && P.err.code;
    if (!s) {
      if (busy) return { cls: 'is-busy', t: 'Preparando tu pase…', s: 'Conectando con el servidor del pase.' };
      if (code === 'ya_emitido') return { cls: 'is-warn', ic: 'i-heart', t: 'Este pase ya se pidió desde otro móvil', s: 'Aquí lo tienes como recuerdo. Si has cambiado de móvil, ' + C.nombres.remitente + ' puede arreglarlo.' };
      if (code === 'pronto') return { cls: 'is-warn', ic: 'i-heart', t: 'Todavía es pronto para el código', s: 'Vuelve a abrir tu pase un poco más tarde.' };
      return { cls: 'is-warn', ic: 'i-heart', t: 'Ahora no puedo conectar con el servidor', s: 'Tu pase sigue aquí como recuerdo. Lo intentaré otra vez cuando vuelvas a abrirlo.' };
    }
    var sub = busy ? 'Comprobando…' : (P.err ? 'Sin conexión: es el último estado que conozco.' : 'Comprobado ahora mismo.');
    if (s.estado === 'anulado') return { cls: 'is-off', ic: 'i-lock', t: 'Este pase ya no está activo', s: busy ? sub : 'Si crees que es un error, díselo a ' + C.nombres.remitente + '.' };
    if (s.estado === 'canjeado') return { cls: 'is-done', ic: 'i-check', t: 'Canjeado el ' + fmtDay(s.canjeado), s: sub };
    return { cls: 'is-ok', ic: 'i-check', t: 'Pase activo', s: sub };
  }
  function passSub() {
    var P = st.pase;
    if (!P || !P.seen) return 'Por haber completado la aventura.';
    if (P.srv && P.srv.estado === 'canjeado') return 'Canjeado el ' + fmtDay(P.srv.canjeado) + '.';
    if (P.srv && P.srv.estado === 'activo') return 'Activo. Enséñaselo a ' + C.nombres.remitente + ' cuando os veáis.';
    return 'Un recuerdo de la aventura.';
  }
  function passBtnHTML() {
    var fresh = !(st.pase && st.pase.seen);
    return '<button class="envelope envelope--pass' + (fresh ? ' is-new' : '') + '" data-act="pass"><span class="envelope__ico is-gold">' + icon('i-ticket') + '</span>' +
      '<span class="envelope__t"><b>Un pase con tu nombre</b><small>' + esc(passSub()) + '</small></span>' + (fresh ? '<span class="pill pill--new">¡Nuevo!</span>' : '') + '</button>';
  }
  function refreshPassButtons() {
    var fresh = !(st.pase && st.pase.seen);
    $$('.envelope--pass').forEach(function (b) {
      b.classList.toggle('is-new', fresh);
      var p = $('.pill--new', b); if (p && !fresh) p.remove();
      var s = $('small', b); if (s) s.textContent = passSub();
    });
    $$('[data-pass-sub]').forEach(function (n) { n.textContent = passSub(); });
  }
  function walletBtns(P) {
    var s = P.srv;
    if (!s || s.estado === 'anulado' || !s.cred || !paseServer()) return '';
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), android = /Android/i.test(ua);
    var q = 'c=' + enc(s.cred) + '&t=' + enc(P.dev), base = paseServer() + 'api.php?a=', h = '';
    if (s.apple && !android) h += '<a class="wbtn" href="' + esc(base + 'apple&' + q) + '">' + icon('i-wallet') + '<span><small>Añadir a</small>Apple Wallet</span></a>';
    if (s.google && !ios) h += '<a class="wbtn" href="' + esc(base + 'google&' + q) + '" target="_blank" rel="noopener">' + icon('i-wallet') + '<span><small>Guardar en</small>Google Wallet</span></a>';
    return h ? '<div class="wbtns">' + h + '</div>' : '';
  }
  function cardSig(P) { var s = P.srv || {}; return [P.id, s.url, s.estado, s.canjeado].join('|'); }
  function openPass() {
    if (passOpen) return Promise.resolve();
    passOpen = true;
    var P = ensurePase();
    var first = !P.seen;
    if (first) { P.seen = true; save(); }
    var ui = { busy: !!paseServer(), flipped: !first, stampNew: false, sig: '' };
    var prev = document.activeElement;
    return new Promise(function (resolve) {
      var ov = el('<div class="overlay passov" role="dialog" aria-modal="true" aria-labelledby="ps-t">' +
        '<button class="icon-btn passov__x" data-ps="close" aria-label="Cerrar">' + icon('i-close') + '</button>' +
        '<p class="passov__k" id="ps-t">' + (first ? 'Un pase con tu nombre' : 'Tu pase') + '</p>' +
        '<div class="passov__stage"><div class="passov__card"></div>' +
        '<div class="passov__pom" aria-hidden="true">' + ART.pet(first ? 'wow' : 'happy') + '</div><p class="passov__say" aria-hidden="true" hidden></p></div>' +
        '<div class="pstat" role="status"></div><div class="passov__acts"></div><p class="passov__note"></p></div>');
      document.body.appendChild(ov);
      var card = $('.passov__card', ov), stat = $('.pstat', ov), acts = $('.passov__acts', ov), note = $('.passov__note', ov), say = $('.passov__say', ov);
      var closed = false, sayT = null;
      function pomSay(t, expr, ms) {
        setExpr($('.passov__pom', ov), expr || 'happy');
        say.textContent = t; say.hidden = false; say.classList.remove('is-out');
        clearTimeout(sayT);
        sayT = setTimeout(function () { say.classList.add('is-out'); sayT = setTimeout(function () { say.hidden = true; }, 320); }, ms || 3000);
      }
      function paintCard() {
        ui.sig = cardSig(P);
        card.innerHTML = E.passHTML(P, { cls: (ui.flipped ? 'is-static' : 'is-back'), stampNew: ui.stampNew });
      }
      function paintInfo() {
        var s = passStatus(P, ui.busy);
        stat.className = 'pstat ' + s.cls;
        stat.innerHTML = (s.cls === 'is-busy' ? '<span class="pstat__spin" aria-hidden="true"></span>' : '<span class="pstat__i">' + icon(s.ic) + '</span>') +
          '<span class="pstat__t"><b>' + esc(s.t) + '</b>' + (s.s ? '<small>' + esc(s.s) + '</small>' : '') + '</span>';
        var h = ui.busy ? '' : walletBtns(P);
        if (P.srv && P.srv.estado === 'canjeado' && (P.srv.extra || P.srv.extraMsg)) {
          h += '<button class="envelope envelope--extra" data-ps="extra"><span class="envelope__ico">' + icon('i-letter') + '</span><span class="envelope__t"><b>Hay algo más que quería darte…</b><small>Ábrelo cuando quieras.</small></span></button>';
        }
        h += '<button class="btn btn--gold" data-ps="save">' + icon('i-save') + 'Guardar como imagen</button><button class="btn btn--soft" data-ps="close">Cerrar</button>';
        acts.innerHTML = h;
        note.textContent = !paseServer() ? ''
          : (P.srv && P.srv.estado === 'activo' ? 'Enséñaselo a ' + C.nombres.remitente + ' cuando os veáis: él puede escanearlo y canjearlo. ' : '') +
            'Al servidor solo le llegan el número del pase y un código al azar de este móvil; tus respuestas y tu cuaderno no salen de aquí.';
      }
      function close() {
        if (closed) return; closed = true; passOpen = false;
        clearTimeout(sayT);
        ov.classList.add('is-leaving');
        setTimeout(function () { ov.remove(); }, 250);
        refreshPassButtons();
        if (prev && prev.focus && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
        resolve();
      }
      paintCard(); paintInfo();
      var syncP = ui.busy ? syncPase(P) : Promise.resolve({});
      if (first) Sound.play('reveal');
      else pomSay(PASS_LINES[Math.floor(Math.random() * PASS_LINES.length)], 'happy', 2600);
      Promise.all([syncP, wait(first ? (Motion.reduced ? 60 : 1100) : 0)]).then(function (rs) {
        if (closed) return;
        var res = rs[0] || {};
        ui.busy = false;
        var nowRedeemed = !first && !!(P.srv && P.srv.estado === 'canjeado' && res.was && res.was !== 'canjeado');
        ui.stampNew = nowRedeemed;
        if (first) {
          paintCard();
          var pass = $('.pass', card);
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            if (closed || !pass) return;
            Sound.play('flip');
            pass.classList.remove('is-back');
            ui.flipped = true;
            setTimeout(function () {
              if (closed) return;
              var r = card.getBoundingClientRect();
              Sound.play('win');
              FX.confetti(r.left + r.width / 2, r.top + r.height * 0.32, 90);
              FX.burst(r.left + r.width / 2, r.top + r.height * 0.32, { n: 30, speed: [3, 9] });
              pomSay('¡Lo hemos conseguido!', 'cheer', 3400);
            }, Motion.reduced ? 60 : 650);
          }); });
        } else if (cardSig(P) !== ui.sig || nowRedeemed) {
          paintCard();
        }
        paintInfo();
        if (nowRedeemed) {
          Sound.play('levelup');
          var r2 = card.getBoundingClientRect();
          setTimeout(function () { FX.confetti(r2.left + r2.width / 2, r2.top + r2.height * 0.4, 80); }, Motion.reduced ? 0 : 380);
          pomSay('¡Canjeado! Ahora es un recuerdo para siempre.', 'cheer', 3800);
        }
        setTimeout(function () { var f = $('[data-ps="extra"]', ov) || $('[data-ps="save"]', ov); if (f && !closed) f.focus({ preventScroll: true }); }, first ? 900 : 200);
      });
      if (!Motion.reduced) {
        var tilt = function (e) {
          var p = $('.pass', card); if (!p || !ui.flipped) return;
          var r = card.getBoundingClientRect();
          var dx = E.clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5), dy = E.clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5);
          p.style.setProperty('--ry', (dx * 12).toFixed(2) + 'deg');
          p.style.setProperty('--rx', (-dy * 9).toFixed(2) + 'deg');
        };
        var untilt = function () { var p = $('.pass', card); if (p) { p.style.removeProperty('--rx'); p.style.removeProperty('--ry'); } };
        card.addEventListener('pointermove', tilt);
        ['pointerleave', 'pointercancel', 'pointerup'].forEach(function (ev) { card.addEventListener(ev, untilt); });
      }
      ov.addEventListener('keydown', function (e) { E.trapTab(e, ov); if (e.key === 'Escape') { Sound.play('tap'); close(); } });
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ps]');
        if (!b) return;
        var a = b.getAttribute('data-ps');
        if (a === 'close') { Sound.play('tap'); close(); }
        else if (a === 'save') {
          if (b.disabled) return;
          Sound.play('tap'); b.disabled = true;
          E.passBlob(P).then(function (blob) {
            return E.saveImage(blob, 'pase-' + String(P.id).toLowerCase() + '.png', PK.titulo || 'Pase de aventurera', { ok: 'Pase guardado', head: 'Guarda tu pase', alt: 'Imagen del pase de ' + C.nombres.jugadora });
          }).catch(function () { E.toast('No he podido preparar la imagen. Haz una captura de pantalla.', 'i-sparkle'); })
            .then(function () { b.disabled = false; });
        } else if (a === 'extra') {
          Sound.play('pop'); openExtra(P, b);
        }
      });
    });
  }
  function openExtra(P, btn) {
    if (btn) { if (btn.disabled) return; btn.disabled = true; }
    var have = P.srv && P.srv.extraMsg;
    var get = have ? Promise.resolve(have) : passApi('extra', 'c=' + enc(P.srv.cred) + '&t=' + enc(P.dev)).then(function (j) {
      if (!j.ok) return null;
      P.srv.extraMsg = { mensaje: String(j.mensaje || ''), audio: j.audio ? String(j.audio) : null };
      save();
      return P.srv.extraMsg;
    });
    return get.then(function (x) {
      if (btn) btn.disabled = false;
      if (!x || (!x.mensaje && !x.audio)) { E.toast('Ahora no puedo traerlo. Prueba otra vez en un momento.', 'i-sparkle'); return; }
      Sound.play('reveal');
      var md = E.Modal.open('<div class="sheet__head"><h2 data-title>Hay algo más que quería darte…</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
        (x.mensaje ? '<article class="letter"><p class="letter__k">Para ' + esc(C.nombres.jugadora) + '</p><p class="letter__msg">' + esc(x.mensaje).replace(/\n/g, '<br>') + '</p>' +
          '<p class="letter__sign">' + esc(C.nombres.remitente) + '</p><span class="letter__flower" aria-hidden="true">' + icon('i-heart') + '</span></article>' : '') +
        '<div class="extra__v"></div><div class="sheet__actions"><button class="btn btn--soft" data-close autofocus>Cerrar</button></div>');
      var src = null;
      if (x.audio) { try { src = new URL(x.audio, paseServer() || location.href).href; } catch (e) { src = null; } }
      if (src && /^https?:/i.test(src)) E.Voice.mount($('.extra__v', md.sheet), [src], null, 'Un mensaje de ' + C.nombres.remitente);
      var r = md.sheet.getBoundingClientRect();
      FX.confetti(window.innerWidth / 2, Math.max(60, r.top + 30), 70);
      md.done.then(function () { E.Voice.stop(); });
    });
  }
  function openWalletPreview() {
    var P = ensurePase(), srv = paseServer();
    E.Modal.open('<div class="sheet__head"><h2 data-title>Diseño para Wallet</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<p>Así se vería en Apple Wallet, con los mismos campos que prepara el servidor. Es una vista aproximada: el pase de verdad solo existe cuando el servidor lo firma con tus certificados.</p>' +
      E.walletHTML(P) +
      '<p class="pv-h">Servidor del pase</p><p>' + esc(srv ? srv : (E.inArtifact ? 'Dentro de claude.ai el pase es solo un recuerdo: el servidor se usa en la versión alojada en tu dominio.' : 'Sin servidor (pase.servidor en config.js): el pase es un recuerdo local, sin QR.')) + '</p>' +
      '<div class="sheet__actions"><button class="btn btn--soft" data-close autofocus>Cerrar</button></div>');
  }

  /* ---------- Mis descubrimientos ---------- */
  function openCollection() { go('collection', renderCollection); }
  function renderCollection() {
    var ids = Object.keys(C.sorpresas).filter(ropened);
    st.bagSeen = discoveries(); save();
    renderHUD(false);
    var h = '<div class="coll__body"><div class="coll__head"><button class="icon-btn" data-act="map" aria-label="Volver al mapa">' + icon('i-back') + '</button><h2>Mis descubrimientos</h2></div>';
    if (ids.length) {
      h += '<section class="csec"><h3>Sorpresas</h3><div class="cgrid">' + ids.map(function (k) {
        var r = C.sorpresas[k];
        return '<button class="ccard" data-act="viewreward" data-r="' + k + '"><span class="ccard__ico">' + icon('i-sparkle') + '</span><span><span class="ccard__t">' + esc(r.titulo) + '</span><span class="ccard__d">' + esc(r.texto) + '</span></span></button>';
      }).join('') + '</div></section>';
    } else {
      h += '<div class="empty"><div class="say__c">' + ART.pet('happy') + '</div><p>Aún no hay nada por aquí. Lo que vayas descubriendo aparecerá en este rincón.</p></div>';
    }
    if (st.finale.opened) {
      h += '<section class="csec"><h3>' + esc(C.final.titulo) + '</h3><button class="ccard" data-act="finale"><span class="ccard__ico">' + icon('i-flower') + '</span><span><span class="ccard__t">El mensaje y la carta de ' + esc(C.final.firma) + '</span><span class="ccard__d">Vuelve junto al agua cuando quieras.</span></span></button></section>';
      h += '<section class="csec"><h3>Tu pase</h3><button class="ccard ccard--red" data-act="pass"><span class="ccard__ico">' + icon('i-ticket') + '</span><span><span class="ccard__t">' + esc(PK.titulo || 'Pase de aventurera') + ' de ' + esc(C.nombres.jugadora) + '</span><span class="ccard__d" data-pass-sub>' + esc(passSub()) + '</span></span></button></section>';
    }
    var have = piecesHave(), n = pieceCount();
    h += '<section class="csec"><h3>Piezas</h3><p class="csec__p">' + (st.finale.opened ? 'El cuadro de la puerta, completo.' : 'Llevas ' + n + ' de ' + NPIECES + '. ¿Para qué servirán?') + '</p><div class="cpieces">' +
      [0, 1, 2, 3, 4, 5].map(function (i) {
        if (st.finale.opened) return '<div class="cpiece is-open">' + pieceSVG(i) + '</div>';
        return '<div class="cpiece' + (have[i] ? ' has' : '') + '">' + (have[i] ? icon('i-puzzle') : '?') + '</div>';
      }).join('') + '</div></section>';
    var found = Object.keys(st.secrets);
    h += '<section class="csec"><h3>Secretitos del mapa</h3><p class="csec__p">Has encontrado ' + found.length + ' de ' + NSEC + '. Algunos rincones del mapa reaccionan si los tocas.</p>' +
      (found.length ? '<div class="secretlist">' + found.map(function (id) { return '<span class="pill pill--soft">' + icon('i-sparkle') + esc(SECRETS[id] || id) + '</span>'; }).join('') + '</div>' : '') + '</section>';
    var nb = (st.cuaderno || []).length;
    h += '<section class="csec"><h3>Mi cuaderno</h3><button class="ccard ccard--soft" data-act="notebook"><span class="ccard__ico">' + icon('i-note') + '</span><span><span class="ccard__t">' + (nb ? nb + (nb === 1 ? ' nota guardada' : ' notas guardadas') : 'Un sitio para tus cosas') + '</span><span class="ccard__d">Solo en este móvil. Escribe si te apetece; también puedes pasar.</span></span></button></section>';
    var notes = CH.filter(function (c) { return st.answers[c.id]; }).length;
    if (notes) h += '<section class="csec"><h3>Tus respuestas</h3><button class="ccard ccard--soft" data-act="notes"><span class="ccard__ico">' + icon('i-heart') + '</span><span><span class="ccard__t">' + notes + (notes === 1 ? ' respuesta guardada' : ' respuestas guardadas') + '</span><span class="ccard__d">Solo en este móvil. Puedes verlas o borrarlas.</span></span></button></section>';
    $('#coll').innerHTML = h + '</div>';
    $('#coll').scrollTop = 0;
  }

  /* ---------- Ajustes ---------- */
  function applySettings() {
    Sound.setSfx(st.settings.sfx !== false);
    Sound.musicOn = !!st.settings.music;
    if (Sound.ctx) Sound.setMusic(Sound.musicOn);
    Motion.apply(st.settings.motion);
  }
  function swRow(ic, t, sub, key, on) {
    return '<div class="setrow"><span class="setrow__i">' + icon(ic) + '</span><span class="setrow__t" id="lbl-' + key + '">' + t + '<small>' + sub + '</small></span>' +
      '<button class="switch" role="switch" aria-checked="' + on + '" aria-labelledby="lbl-' + key + '" data-sw="' + key + '"></button></div>';
  }
  function openSettings() {
    var n = CH.filter(function (c) { return st.answers[c.id]; }).length, nb = (st.cuaderno || []).length;
    var md = E.Modal.open('<div class="sheet__head"><h2 data-title>Ajustes</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      swRow('i-sound', 'Efectos de sonido', 'Los sonidos del juego', 'sfx', Sound.sfxOn) +
      swRow('i-music', 'Música suave', 'Una melodía tranquila de fondo', 'music', Sound.musicOn) +
      swRow('i-motion', 'Reducir animaciones', 'Menos movimiento en pantalla', 'motion', Motion.reduced) +
      '<div class="setrow"><span class="setrow__i">' + icon('i-note') + '</span><span class="setrow__t">Mi cuaderno<small>' + (nb ? nb + (nb === 1 ? ' nota' : ' notas') + ', solo en este móvil' : 'Solo en este móvil') + '</small></span>' +
      '<button class="btn btn--soft btn--sm" data-set="notebook">Abrir</button></div>' +
      '<div class="setrow"><span class="setrow__i">' + icon('i-heart') + '</span><span class="setrow__t">Mis respuestas<small>' + (n ? n + (n === 1 ? ' guardada' : ' guardadas') + ' solo en este móvil' : 'No hay ninguna guardada') + '</small></span>' +
      '<button class="btn btn--soft btn--sm" data-set="notes">Ver</button></div>' +
      (S.preview ? '<div class="setrow"><span class="setrow__i">' + icon('i-eye') + '</span><span class="setrow__t">Vista previa<small>Herramientas de prueba</small></span><button class="btn btn--soft btn--sm" data-set="pv">Abrir</button></div>' : '') +
      (E.inArtifact ? '' : '<details class="howto"><summary>Tenerlo a mano en el iPhone</summary><ol><li>Abre este enlace en Safari.</li><li>Toca el botón Compartir (el cuadrado con la flecha).</li><li>Elige «Añadir a pantalla de inicio».</li></ol>' +
        '<p>Mejor hazlo antes de empezar: el iPhone guarda el progreso del icono aparte del de Safari.</p></details>') +
      '<span class="ver" id="ver">Versión ' + esc(C.version) + '</span>');
    md.sheet.addEventListener('click', function (e) {
      var sw = e.target.closest('[data-sw]');
      if (sw) {
        var k = sw.getAttribute('data-sw'), on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        if (k === 'sfx') { st.settings.sfx = on; Sound.setSfx(on); if (on) { Sound.unlock(); Sound.play('pop'); } }
        if (k === 'music') { st.settings.music = on; Sound.unlock(); Sound.setMusic(on); }
        if (k === 'motion') { st.settings.motion = on; Motion.apply(on); }
        save();
        return;
      }
      var b = e.target.closest('[data-set]');
      if (b) {
        var a = b.getAttribute('data-set');
        md.close();
        if (a === 'notes') setTimeout(openNotes, 200);
        if (a === 'notebook') setTimeout(function () { openNotebook(); }, 200);
        if (a === 'pv') setTimeout(openPreviewPanel, 200);
      }
    });
    var ver = $('#ver', md.sheet), pt = null;
    ver.addEventListener('pointerdown', function () { clearTimeout(pt); pt = setTimeout(function () { md.close(); setTimeout(askCode, 220); }, 2000); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { ver.addEventListener(ev, function () { clearTimeout(pt); }); });
  }
  function openNotes() {
    var list = CH.filter(function (c) { return st.answers[c.id]; });
    var md = E.Modal.open('<div class="sheet__head"><h2 data-title>Mis respuestas</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<p>Están guardadas solo en este móvil. Nadie más las ve, salvo que tú decidas compartirlas.</p>' +
      (list.length ? list.map(function (c) {
        return '<div class="ans"><p class="ans__q">' + esc(c.conexion.pregunta) + '</p><p class="ans__a">' + esc(answerText(st.answers[c.id])) + '</p>' +
          '<div class="ans__row"><button class="btn btn--soft btn--sm" data-n="share" data-c="' + c.id + '">' + icon('i-share') + 'Compartir si quiero</button>' +
          '<button class="btn btn--soft btn--sm" data-n="del" data-c="' + c.id + '">' + icon('i-trash') + 'Borrar</button></div></div>';
      }).join('') + '<div class="sheet__actions"><button class="btn btn--soft" data-n="all">' + icon('i-trash') + 'Borrar todas</button></div>' : '<p><b>No hay respuestas guardadas.</b></p>'));
    md.sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-n]');
      if (!b) return;
      var a = b.getAttribute('data-n'), c = chById(b.getAttribute('data-c'));
      if (a === 'share' && c) { E.shareText(c.conexion.pregunta, c.conexion.pregunta + '\n' + answerText(st.answers[c.id])); return; }
      md.close();
      setTimeout(function () {
        E.confirm(a === 'all' ? '¿Borrar todas tus respuestas?' : '¿Borrar esta respuesta?', 'Se borrarán de este móvil.', 'Borrar', 'Cancelar').then(function (y) {
          if (!y) { openNotes(); return; }
          if (a === 'all') st.answers = {}; else if (c) delete st.answers[c.id];
          save();
          E.toast(a === 'all' ? 'Respuestas borradas' : 'Respuesta borrada', 'i-trash');
          if (cur.screen === 'collection') renderCollection();
          if (cur.screen === 'chapter' && cur.chapter) renderChapter(cur.chapter);
          if (cur.screen === 'connect' && cur.chapter) renderConnect(cur.chapter);
          openNotes();
        });
      }, 200);
    });
  }

  /* ---------- Vista previa (solo para Paulo) ---------- */
  var PV_TIMES = [
    { t: 'Hora real', v: null },
    { t: 'Antes de empezar', v: E.T.capitulo1 - 9 * 3600000 },
    { t: 'Capítulo 1', v: E.T.capitulo1 + 60000 },
    { t: 'Capítulo 2', v: E.T.capitulo2 + 60000 },
    { t: 'Capítulo 3', v: E.T.capitulo3 + 60000 },
    { t: 'Final', v: E.T.final + 60000 }
  ];
  function audioList() {
    var l = [];
    if (C.saludo && C.saludo.audio) l.push(['Saludo de la portada', C.saludo.audio]);
    Object.keys(C.sorpresas).forEach(function (k, i) {
      var r = C.sorpresas[k];
      if (r.antesDeAbrir && r.antesDeAbrir.audio) l.push(['Antes de abrir la sorpresa ' + (i + 1), r.antesDeAbrir.audio]);
      if (r.audio) l.push(['Sorpresa ' + (i + 1), r.audio]);
    });
    if (C.final.audio) l.push(['Final', C.final.audio]);
    return l;
  }
  function askCode() {
    if (!window.AVENTURA_DEV_PREVIEW) return;
    var md = E.Modal.open('<div class="sheet__head"><h2 data-title>Vista previa</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<p>Escribe la palabra de la vista previa.</p><label class="sr" for="pv-code">Palabra</label><input class="field" id="pv-code" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<div class="sheet__actions"><button class="btn" data-pvc="ok">Entrar</button></div>');
    var inp = $('#pv-code', md.sheet);
    setTimeout(function () { inp.focus(); }, 80);
    function tryIt() {
      if ((inp.value || '').trim().toLowerCase() === String(C.codigoVistaPrevia || '').toLowerCase() && C.codigoVistaPrevia) { md.close(); enterPreview(); }
      else E.toast('No es esa palabra.', 'i-lock');
    }
    $('[data-pvc]', md.sheet).addEventListener('click', tryIt);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryIt(); });
  }
  function showFlag() {
    if ($('#pv-flag')) return;
    document.body.appendChild(el('<button class="pv-flag" id="pv-flag" data-act="pvpanel">Vista previa</button>'));
  }
  function reloadState() {
    st = S.load();
    applySettings();
    buildTitle(); buildMap(); renderHUD(false); updateMap(false);
    openSig = sig();
  }
  function enterPreview() {
    if (!window.AVENTURA_DEV_PREVIEW) return;
    S.preview = true;
    try { sessionStorage.setItem('aventura-pv', '1'); } catch (e) { /* nada */ }
    reloadState();
    showFlag();
    E.toast('Vista previa activada', 'i-eye');
    goMap();
  }
  function exitPreview() {
    S.preview = false;
    try { sessionStorage.removeItem('aventura-pv'); } catch (e) { /* nada */ }
    if (/vista-previa/.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }
    var f = $('#pv-flag'); if (f) f.remove();
    reloadState();
    go('title');
  }
  function completeChapter(i) {
    var c = CH[i];
    c.retos.forEach(function (r) {
      if (!gdone(r.id)) { st.games[r.id] = { done: true, at: Date.now(), plays: 1, skipped: true }; st.xp += C.xpPorReto; }
    });
    save();
    return levelUps();
  }
  function openPreviewPanel() {
    var md = E.Modal.open('<div class="sheet__head"><h2 data-title>Vista previa</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
      '<p>Solo para ti. Esta vista guarda su propio progreso aparte, así que no toca el de ' + esc(C.nombres.jugadora) + ' (que además está en su móvil).</p>' +
      '<p class="pv-h">Momento simulado</p><div class="pv-grid">' + PV_TIMES.map(function (x, i) {
        var on = (x.v === null && !st.simNow) || (x.v !== null && st.simNow === x.v);
        return '<button class="btn btn--soft' + (on ? ' is-sel' : '') + '" data-pv="time" data-i="' + i + '">' + x.t + '</button>';
      }).join('') + '</div>' +
      '<p class="pv-h">Atajos</p><div class="pv-grid">' + CH.map(function (c, i) { return '<button class="btn btn--soft" data-pv="complete" data-i="' + i + '">Completar cap. ' + (i + 1) + '</button>'; }).join('') +
      '<button class="btn btn--soft" data-pv="level">Ver subida de nivel</button><button class="btn btn--soft" data-pv="finale">Ir al final</button><button class="btn btn--soft" data-pv="pause">Ver la pausa</button>' +
      '<button class="btn btn--soft" data-pv="pass">Ver el pase</button><button class="btn btn--soft" data-pv="wallet">Diseño para Wallet</button></div>' +
      '<p class="pv-h">Sorpresas (con animación)</p><div class="pv-grid">' + Object.keys(C.sorpresas).map(function (k) {
        return '<button class="btn btn--soft" data-pv="reward" data-k="' + k + '">' + esc(C.sorpresas[k].titulo.replace(/^Vale por /, '')) + '</button>';
      }).join('') + '</div>' +
      '<p class="pv-h">Audios</p><div class="pv-audio" id="pv-audio">Comprobando…</div>' +
      '<div class="sheet__actions"><button class="btn btn--soft" data-pv="reset">Reiniciar progreso de prueba</button><button class="btn" data-pv="exit">Salir de la vista previa</button></div>');
    var lists = audioList();
    Promise.all(lists.map(function (l) { return E.probeAudio(l[1]); })).then(function (rs) {
      var box = $('#pv-audio', md.sheet); if (!box) return;
      box.innerHTML = lists.map(function (l, i) {
        var r = rs[i];
        if (!r) return '<div>' + esc(l[0]) + ': no está (' + esc(l[1].join(' o ')) + '). Se verá el texto.</div>';
        return '<div>' + esc(l[0]) + ': ' + (r.unknown ? 'no se puede comprobar aquí (' + esc(r.url) + ')' : 'encontrado (' + esc(r.url) + ')') + '</div>';
      }).join('');
    });
    md.sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pv]');
      if (!b) return;
      var a = b.getAttribute('data-pv');
      if (a === 'time') {
        st.simNow = PV_TIMES[+b.getAttribute('data-i')].v; save();
        md.close(); openSig = sig();
        E.toast('Momento: ' + PV_TIMES[+b.getAttribute('data-i')].t, 'i-eye');
        if (cur.screen === 'map') arrive(); else goMap();
      } else if (a === 'complete') {
        md.close(); completeChapter(+b.getAttribute('data-i')).then(function () { goMap(); });
      } else if (a === 'level') {
        md.close(); var L = lvl(); showLevelUp(E.nextLevel(L) || L);
      } else if (a === 'finale') {
        md.close(); if (!fopen()) { st.simNow = PV_TIMES[5].v; save(); } openFinale();
      } else if (a === 'pause') {
        md.close(); setTimeout(pauseForToday, 200);
      } else if (a === 'pass') {
        md.close(); setTimeout(openPass, 220);
      } else if (a === 'wallet') {
        md.close(); setTimeout(openWalletPreview, 220);
      } else if (a === 'reward') {
        md.close(); reveal(b.getAttribute('data-k'), { closeLabel: 'Cerrar' }).then(function () { if (cur.screen === 'map') arrive(); });
      } else if (a === 'reset') {
        md.close();
        E.confirm('¿Reiniciar la prueba?', 'Se borra solo el progreso de la vista previa.', 'Reiniciar', 'Cancelar').then(function (y) {
          if (!y) return;
          S.reset(); reloadState(); E.toast('Progreso de prueba reiniciado', 'i-replay'); go('title');
        });
      } else if (a === 'exit') {
        md.close(); exitPreview();
      }
    });
  }

  /* ---------- Paso del tiempo ---------- */
  function sig() { return CH.map(isOpen).concat([fopen()]).join(','); }
  function tick() {
    var s = sig();
    if (s === openSig) {
      if (cur.screen === 'map' && !arriving) updateMap(false);
      return;
    }
    openSig = s;
    if (cur.screen === 'map') arrive();
    else E.toast('Se ha despertado un lugar nuevo en el mapa.', 'i-sparkle');
  }

  /* ---------- Eventos ---------- */
  function bind() {
    document.addEventListener('pointerdown', function (e) {
      lastTap = { x: e.clientX, y: e.clientY, t: Date.now() };
      if (!Sound.ctx || Sound.ctx.state !== 'running') Sound.unlock();
      if (!Motion.reduced && cur.screen !== 'load') FX.burst(e.clientX, e.clientY, { n: 5, speed: [0.8, 2.4], life: [16, 28], size: [2, 3.6], gravity: 0, kinds: ['spark'], colors: ['#FFFFFF', '#FFE07A', '#FFC2D2'] });
    }, true);
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var a = b.getAttribute('data-act');
      switch (a) {
        case 'start': start(); break;
        case 'settings': Sound.play('tap'); openSettings(); break;
        case 'map': Sound.play('tap'); if (cur.screen === 'game') teardownGame(); goMap(); break;
        case 'collection': Sound.play('tap'); openCollection(); break;
        case 'chapter': Sound.play('tap'); if (cur.chapter) openChapter(cur.chapter); break;
        case 'game': Sound.play('pop'); startGame(b.getAttribute('data-g')); break;
        case 'connect': Sound.play('pop'); openConnect(chById(b.getAttribute('data-c'))); break;
        case 'game-exit': Sound.play('tap'); exitGame(); break;
        case 'game-help': Sound.play('tap'); openHelp(); break;
        case 'game-hint': Sound.play('tap'); if (cur.ctl && cur.ctl.hint) cur.ctl.hint(); break;
        case 'easy': setEasy(true); break;
        case 'skipgame': Sound.play('tap'); skipGame(); break;
        case 'reveal': chapterReveal(b.getAttribute('data-r')); break;
        case 'viewreward': Sound.play('pop'); reveal(b.getAttribute('data-r'), { view: true, closeLabel: 'Cerrar' }); break;
        case 'opendoor': openDoor(); break;
        case 'fhelp': Sound.play('tap'); finaleHelp(); break;
        case 'letter': openLetter(); break;
        case 'finalgift': finalGift(); break;
        case 'finale': Sound.play('pop'); openFinale(); break;
        case 'pass': Sound.play('pop'); openPass(); break;
        case 'notes': Sound.play('tap'); openNotes(); break;
        case 'notebook': Sound.play('tap'); openNotebook(); break;
        case 'pause': Sound.play('tap'); pauseForToday(); break;
        case 'hudlvl': lvlInfo(); break;
        case 'pet-title': petTap(b); break;
        case 'conn-save': connSave(); break;
        case 'conn-share': Sound.play('tap'); connShare(); break;
        case 'conn-skip': Sound.play('tap'); openChapter(cur.chapter); break;
        case 'conn-del': connDelete(); break;
        case 'pvpanel': openPreviewPanel(); break;
      }
    });
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('#conn .chip');
      if (!chip) return;
      var on = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(on));
      Sound.play(on ? 'pop' : 'tap');
    });
    $('#map-world').addEventListener('click', function (e) {
      var s = e.target.closest('.secret'); if (s) { secret(s.getAttribute('data-secret'), s); return; }
      var n = e.target.closest('.mnode'); if (n) { nodeTap(+n.getAttribute('data-node'), n); return; }
      var p = e.target.closest('.mpet'); if (p) petTap(p);
    });
    $('#map-scroll').addEventListener('scroll', function () { if (!plxRaf) plxRaf = requestAnimationFrame(applyParallax); }, { passive: true });
    $('#chap').addEventListener('scroll', function () { if (!bnRaf) bnRaf = requestAnimationFrame(bannerParallax); }, { passive: true });
    window.addEventListener('resize', function () { applyParallax(); });
    $('#mhint').addEventListener('click', function () {
      Sound.play('tap');
      var i = petTarget();
      scrollToNode(i + 1, true).then(function () { var n = $('#node' + (i + 1)); if (n) { n.classList.remove('pop'); n.getBoundingClientRect(); n.classList.add('pop'); } });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { Sound.suspend(); E.Voice.stop(); }
      else { if (!$('.pause')) Sound.resume(); tick(); }
    });
  }

  /* ---------- Arranque ---------- */
  function boot() {
    document.documentElement.lang = 'es';
    E.applyTheme();
    var pv = false;
    try { pv = sessionStorage.getItem('aventura-pv') === '1'; } catch (e) { /* nada */ }
    if (/vista-previa/.test(location.hash) || /[?&]vista-previa/.test(location.search)) pv = true;
    S.preview = !!window.AVENTURA_DEV_PREVIEW && pv;
    st = S.load();
    applySettings();
    document.body.insertAdjacentHTML('afterbegin', ART.sprite() + ART.lakeSymbol());
    $('#load-pet').innerHTML = ART.pet('happy');
    $('#mhint-c').innerHTML = ART.pet('happy');
    FX.init();
    E.Wipe.init();
    buildTitle();
    buildMap();
    buildGameShell();
    renderHUD(false);
    bind();
    E.downloads();
    audioList().forEach(function (l) { E.probeAudio(l[1]); });
    openSig = sig();
    setInterval(tick, 30000);
    if (S.preview) { showFlag(); try { sessionStorage.setItem('aventura-pv', '1'); } catch (e) { /* nada */ } }
    var ready = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, wait(1800)]) : wait(300);
    ready.then(function () { return wait(250); }).then(function () { show('title'); focusScreen('title'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
