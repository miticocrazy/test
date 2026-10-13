/* ============================================================================
   engine.js · Motor del juego: guardado, fechas, sonido, partículas,
   transiciones, diálogos, voz y exportación de cupones.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.AVENTURA;
  var ART = window.ART;
  var E = (window.ENG = {});

  /* ---------- Utilidades ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(html) { var t = document.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstElementChild; }
  function anim(ms, fn) {
    return new Promise(function (res) {
      var t0 = null;
      function f(now) {
        if (t0 === null) t0 = now;
        var t = Math.min(1, (now - t0) / ms);
        fn(t);
        if (t < 1) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
  }
  function center(node) {
    var r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }
  function icon(id, cls) { return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  E.$ = $; E.$$ = $$; E.wait = wait; E.clamp = clamp; E.rand = rand; E.shuffle = shuffle; E.esc = esc; E.el = el; E.anim = anim; E.center = center; E.icon = icon;

  E.inArtifact = !!(window.claude && typeof window.claude.use === 'function');

  /* ---------- Movimiento ---------- */
  var Motion = (E.Motion = {
    sys: !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    reduced: false,
    apply: function (pref) {
      this.reduced = pref == null ? this.sys : !!pref;
      document.documentElement.classList.toggle('rm', this.reduced);
    },
    t: function (ms) { return this.reduced ? Math.min(ms, 80) : ms; }
  });

  /* ---------- Guardado local ---------- */
  var Store = (E.Store = {
    mem: {},
    get: function (k) {
      try { var v = window.localStorage.getItem(k); if (v !== null) return v; } catch (e) { /* sin almacenamiento */ }
      return Object.prototype.hasOwnProperty.call(this.mem, k) ? this.mem[k] : null;
    },
    set: function (k, v) {
      this.mem[k] = v;
      try { window.localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ }
    },
    del: function (k) {
      delete this.mem[k];
      try { window.localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ }
    }
  });

  var SCHEMA = 1;
  var KEYS = { real: 'una-pequena-aventura.v1', preview: 'una-pequena-aventura.vista-previa.v1' };
  function fresh() {
    return {
      schema: SCHEMA,
      xp: 0,
      levelSeen: 1,
      games: {},
      rewards: {},
      celebrated: {},
      unlockSeen: {},
      introDone: false,
      chapIntro: {},
      answers: {},
      privacySeen: false,
      secrets: {},
      finale: { placed: [], opened: false, given: false, openedAt: null },
      cuaderno: [],
      pase: null,
      cv: 2,
      settings: { sfx: true, music: false, motion: null },
      bagSeen: 0,
      simNow: null
    };
  }
  function migrate(d) {
    var f = fresh();
    if (!d || typeof d !== 'object') return f;
    if (d.schema !== SCHEMA) {
      if (d.settings) f.settings = Object.assign(f.settings, d.settings);
      return f;
    }
    var legacy = d.cv !== 2;
    Object.keys(f).forEach(function (k) { if (d[k] === undefined || d[k] === null && k !== 'simNow') d[k] = f[k]; });
    Object.keys(f.settings).forEach(function (k) { if (d.settings[k] === undefined) d.settings[k] = f.settings[k]; });
    Object.keys(f.finale).forEach(function (k) { if (d.finale[k] === undefined) d.finale[k] = f.finale[k]; });
    if (typeof d.xp !== 'number' || !isFinite(d.xp)) d.xp = 0;
    if (!Array.isArray(d.cuaderno)) d.cuaderno = [];
    if (legacy) {
      // Datos de la primera versión: el final y los secretitos han cambiado.
      if (!d.finale.opened) { d.finale.placed = []; d.finale.given = false; }
      var ren = { luna: 'luna', barco: 'barca', chispa: 'perro' }, sec = {};
      Object.keys(d.secrets || {}).forEach(function (k) { if (ren[k]) sec[ren[k]] = d.secrets[k]; });
      d.secrets = sec;
      d.cv = 2;
    }
    return d;
  }
  var S = (E.S = {
    preview: false,
    d: null,
    key: function () { return this.preview ? KEYS.preview : KEYS.real; },
    load: function () {
      var raw = Store.get(this.key()), d = null;
      if (raw) { try { d = JSON.parse(raw); } catch (e) { d = null; } }
      this.d = migrate(d);
      return this.d;
    },
    save: function () { Store.set(this.key(), JSON.stringify(this.d)); },
    reset: function () { var keep = this.d ? this.d.settings : null; this.d = fresh(); if (keep) this.d.settings = keep; this.save(); }
  });
  E.KEYS = KEYS;

  /* ---------- Colores del tema ---------- */
  E.applyTheme = function () {
    var c = C.colores || {}, r = document.documentElement.style;
    var map = { crema: '--cream', rosa: '--pink', rubor: '--blush', rojo: '--red', rojoOscuro: '--red-deep', oro: '--gold', ciruela: '--ink', tinta: '--ink' };
    Object.keys(map).forEach(function (k) { if (c[k]) r.setProperty(map[k], c[k]); });
    if (c.ciruela) r.setProperty('--plum', c.ciruela);
  };

  /* ---------- Fechas ---------- */
  var T = (E.T = {});
  ['capitulo1', 'capitulo2', 'capitulo3', 'final'].forEach(function (k) { T[k] = Date.parse(C.fechas[k]); });
  var Clock = (E.Clock = {
    now: function () { return (S.preview && S.d && S.d.simNow) ? S.d.simNow : Date.now(); }
  });
  E.isOpen = function (key) {
    if (key === 'final' && C.abrirFinalYa) return true;
    var t = T[key];
    if (!isFinite(t)) return true; // fecha mal escrita: mejor abierta que bloqueada
    return Clock.now() >= t;
  };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  E.MESES = MESES;
  E.when = function(ts) {
    var fmt = new Intl.DateTimeFormat('es-ES',{timeZone:C.zonaHoraria,year:'numeric',month:'2-digit',day:'2-digit'});
    var date = new Date(ts), now=Clock.now();
    var hm = date.toLocaleTimeString('es-ES',{timeZone:C.zonaHoraria,hour:'2-digit',minute:'2-digit'});
    if(fmt.format(date)===fmt.format(new Date(now)))return 'hoy a las '+hm;
    if(fmt.format(date)===fmt.format(new Date(now+86400000)))return 'mañana a las '+hm;
    return 'el '+date.toLocaleDateString('es-ES',{timeZone:C.zonaHoraria,day:'numeric',month:'long'})+' a las '+hm;
  };
  E.dateLabel = function(ts){return new Date(ts).toLocaleDateString('es-ES',{timeZone:C.zonaHoraria,day:'numeric',month:'long',year:'numeric'})};

  /* ---------- Niveles ---------- */
  E.levelFor = function (xp) {
    var L = C.niveles, cur = L[0];
    for (var i = 0; i < L.length; i++) if (xp >= L[i].xp) cur = L[i];
    return cur;
  };
  E.nextLevel = function (lv) {
    for (var i = 0; i < C.niveles.length; i++) if (C.niveles[i].nivel === lv.nivel + 1) return C.niveles[i];
    return null;
  };

  /* ---------- Sonido (sintetizado, sin archivos) ---------- */
  var Sound = (E.Sound = {
    ctx: null, master: null, sfx: null, mus: null, rev: null,
    sfxOn: true, musicOn: false, ducked: false, timer: null,
    unlock: function () {
      try {
        if (!this.ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          var ctx = (this.ctx = new AC());
          this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(ctx.destination);
          this.sfx = ctx.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.master);
          this.mus = ctx.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
          var d = ctx.createDelay(1); d.delayTime.value = 0.19;
          var fb = ctx.createGain(); fb.gain.value = 0.3;
          var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
          var wet = ctx.createGain(); wet.gain.value = 0.32;
          d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(this.master);
          this.rev = d;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        var b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource();
        s.buffer = b; s.connect(this.ctx.destination); s.start(0);
        if (this.musicOn && !this.timer) this.startMusic();
      } catch (e) { /* audio no disponible */ }
    },
    tone: function (f, o) {
      var ctx = this.ctx; if (!ctx) return;
      o = o || {};
      var t = ctx.currentTime + (o.at || 0), dur = o.dur || 0.2, v = o.vol == null ? 0.3 : o.vol;
      var osc = ctx.createOscillator();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(f, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur * 0.8);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(o.bus || this.sfx);
      if (o.wet && this.rev) g.connect(this.rev);
      osc.start(t); osc.stop(t + dur + 0.05);
    },
    arp: function (fs, gap, o) {
      for (var i = 0; i < fs.length; i++) this.tone(fs[i], Object.assign({}, o, { at: (o && o.at || 0) + i * gap }));
    },
    noise: function (o) {
      var ctx = this.ctx; if (!ctx) return;
      o = o || {};
      var dur = o.dur || 0.35, len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
      var t = ctx.currentTime;
      f.frequency.setValueAtTime(o.from || 400, t); f.frequency.exponentialRampToValueAtTime(o.to || 2400, t + dur);
      var g = ctx.createGain(); g.gain.setValueAtTime(o.vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t);
    },
    play: function (name) {
      if (!this.sfxOn || !this.ctx || this.ducked) return;
      try {
        switch (name) {
          case 'tap': this.tone(700, { dur: 0.07, vol: 0.1, type: 'triangle' }); break;
          case 'pop': this.tone(520, { to: 900, dur: 0.12, vol: 0.16 }); break;
          case 'soft': this.tone(340, { to: 250, dur: 0.18, vol: 0.12 }); break;
          case 'flip': this.tone(880, { to: 620, dur: 0.08, vol: 0.07, type: 'triangle' }); break;
          case 'rotate': this.tone(440, { to: 560, dur: 0.09, vol: 0.1, type: 'triangle' }); break;
          case 'found': this.arp([1318.5, 1568, 2093], 0.065, { type: 'triangle', vol: 0.14, dur: 0.32, wet: true }); break;
          case 'match': this.arp([880, 1318.5], 0.08, { type: 'triangle', vol: 0.14, dur: 0.3, wet: true }); break;
          case 'place': this.arp([660, 990], 0.06, { type: 'triangle', vol: 0.14, dur: 0.22 }); break;
          case 'light': this.arp([784, 1046.5, 1318.5, 1568], 0.09, { type: 'triangle', vol: 0.12, dur: 0.5, wet: true }); break;
          case 'win': this.arp([523.25, 659.25, 783.99, 1046.5, 1318.5], 0.09, { type: 'triangle', vol: 0.16, dur: 0.6, wet: true }); break;
          case 'star': this.tone(1046.5, { to: 1568, dur: 0.18, vol: 0.12, type: 'triangle', wet: true }); break;
          case 'levelup':
            this.arp([523.25, 659.25, 783.99, 1046.5], 0.11, { type: 'triangle', vol: 0.16, dur: 0.4, wet: true });
            this.arp([1046.5, 1318.5, 1568], 0.0, { at: 0.5, type: 'triangle', vol: 0.1, dur: 1.4, wet: true });
            this.arp([523.25, 659.25, 783.99], 0.0, { at: 0.5, type: 'sine', vol: 0.08, dur: 1.4 });
            break;
          case 'reveal':
            for (var i = 0; i < 12; i++) this.tone(900 + i * 160, { at: i * 0.035, dur: 0.5, vol: 0.04, type: 'sine', wet: true });
            this.arp([1046.5, 1318.5, 1568, 2093], 0.08, { at: 0.42, type: 'triangle', vol: 0.12, dur: 0.8, wet: true });
            break;
          case 'whoosh': this.noise({ dur: 0.35, from: 300, to: 3200, vol: 0.08 }); break;
          case 'unlock': this.arp([392, 523.25, 783.99], 0.12, { type: 'triangle', vol: 0.14, dur: 0.6, wet: true }); break;
          case 'secret': this.arp([1568, 2093, 2637], 0.06, { type: 'sine', vol: 0.1, dur: 0.4, wet: true }); break;
          case 'guau': this.tone(560, { to: 420, dur: 0.09, vol: 0.11, type: 'triangle' }); break;
          case 'guauguau':
            this.tone(540, { to: 400, dur: 0.09, vol: 0.12, type: 'triangle' });
            this.tone(620, { to: 440, at: 0.13, dur: 0.1, vol: 0.12, type: 'triangle' });
            break;
          case 'ding': this.arp([1318.5, 1760], 0.07, { type: 'triangle', vol: 0.12, dur: 0.45, wet: true }); break;
          case 'ring':
            this.tone(2093, { dur: 0.3, vol: 0.07, type: 'sine', wet: true });
            this.tone(2637, { at: 0.16, dur: 0.35, vol: 0.06, type: 'sine', wet: true });
            break;
          case 'night': this.arp([659.25, 523.25, 392], 0.16, { type: 'sine', vol: 0.08, dur: 0.9, wet: true }); break;
          case 'door':
            this.tone(110, { to: 165, dur: 1.6, vol: 0.14, type: 'sine', a: 0.3 });
            for (var j = 0; j < 8; j++) this.tone(1200 + j * 220, { at: 0.6 + j * 0.06, dur: 0.9, vol: 0.04, wet: true });
            break;
          case 'xp': this.tone(1567, { dur: 0.06, vol: 0.06, type: 'triangle' }); break;
        }
      } catch (e) { /* ignorar */ }
    },
    note: function (i) {
      if (!this.sfxOn || !this.ctx || this.ducked) return;
      var f = [523.25, 659.25, 783.99, 1046.5][i] || 600;
      this.tone(f, { dur: 0.5, vol: 0.18, type: 'triangle', wet: true });
      this.tone(f * 2, { dur: 0.3, vol: 0.035, type: 'sine' });
    },
    setSfx: function (on) { this.sfxOn = !!on; },
    setMusic: function (on) {
      this.musicOn = !!on;
      if (on) this.startMusic(); else this.stopMusic();
    },
    startMusic: function () {
      if (!this.ctx || this.timer || !this.musicOn) return;
      var self = this, ctx = this.ctx;
      var step = 60 / 72 / 2;
      var prog = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]];
      var pat = [0, 2, 1, 3, 2, 1, 3, 2];
      var pent = [72, 74, 76, 79, 81, 84];
      var i = 0, next = ctx.currentTime + 0.15;
      function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
      this.mus.gain.cancelScheduledValues(ctx.currentTime);
      this.mus.gain.setTargetAtTime(this.ducked ? 0 : 0.55, ctx.currentTime, 0.6);
      this.timer = setInterval(function () {
        while (next < ctx.currentTime + 0.3) {
          var bar = Math.floor(i / 8) % prog.length, ch = prog[bar], k = i % 8, at = Math.max(0, next - ctx.currentTime);
          self.tone(hz(ch[pat[k]] + 12), { at: at, dur: 0.9, vol: 0.06, type: 'triangle', bus: self.mus, a: 0.01 });
          if (k === 0) self.tone(hz(ch[0] - 12), { at: at, dur: step * 8, vol: 0.05, type: 'sine', bus: self.mus, a: 0.25 });
          if ((k === 3 || k === 6) && Math.random() < 0.45) self.tone(hz(pent[Math.floor(Math.random() * pent.length)]), { at: at, dur: 1.3, vol: 0.035, type: 'sine', bus: self.mus, wet: true });
          next += step; i++;
        }
      }, 70);
    },
    stopMusic: function () {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this.ctx && this.mus) { this.mus.gain.cancelScheduledValues(this.ctx.currentTime); this.mus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); }
    },
    duck: function (on) {
      this.ducked = !!on;
      if (this.ctx && this.mus) this.mus.gain.setTargetAtTime(on || !this.musicOn ? 0 : 0.55, this.ctx.currentTime, 0.25);
    },
    suspend: function () { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
    resume: function () { if (this.musicOn && this.ctx) this.startMusic(); }
  });

  /* ---------- Partículas ---------- */
  var FX = (E.FX = {
    cv: null, cx: null, dpr: 1, w: 0, h: 0, parts: [], raf: 0, last: 0, glows: {},
    init: function () {
      this.cv = $('#fx');
      this.cx = this.cv.getContext('2d');
      this.resize();
      var self = this;
      window.addEventListener('resize', function () { self.resize(); });
      this.tick = this.tick.bind(this);
    },
    resize: function () {
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = window.innerWidth; this.h = window.innerHeight;
      this.cv.width = Math.round(this.w * this.dpr); this.cv.height = Math.round(this.h * this.dpr);
      this.cx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    glow: function (color) {
      if (this.glows[color]) return this.glows[color];
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.25, color); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      this.glows[color] = c;
      return c;
    },
    add: function (p) {
      this.parts.push(p);
      if (!this.raf) { this.last = 0; this.raf = requestAnimationFrame(this.tick); }
    },
    burst: function (x, y, o) {
      o = o || {};
      var n = o.n || 18;
      if (Motion.reduced) n = Math.ceil(n * 0.25);
      var cols = o.colors || ['#FFE3A6', '#FFFFFF', '#F7AECB', '#F48FB1'];
      var kinds = o.kinds || ['spark', 'glow'];
      for (var i = 0; i < n; i++) {
        var ang = o.angle == null ? Math.random() * Math.PI * 2 : o.angle + (Math.random() - 0.5) * (o.spread || Math.PI);
        var sp = Motion.reduced ? rand(0.3, 1) : rand(o.speed ? o.speed[0] : 2, o.speed ? o.speed[1] : 6);
        var life = rand(o.life ? o.life[0] : 36, o.life ? o.life[1] : 70);
        this.add({
          kind: kinds[i % kinds.length], x: x, y: y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          g: o.gravity == null ? 0.05 : o.gravity, drag: o.drag || 0.96,
          life: life, max: life, size: rand(o.size ? o.size[0] : 3, o.size ? o.size[1] : 8),
          rot: Math.random() * 6.28, vr: rand(-0.2, 0.2), color: cols[i % cols.length], ph: Math.random() * 6.28
        });
      }
    },
    confetti: function (x, y, n) {
      if (Motion.reduced) { this.burst(x, y, { n: 10, kinds: ['spark'] }); return; }
      n = n || 70;
      var cols = ['#F48FB1', '#D9364F', '#F5C77E', '#FFD6E5', '#FFFFFF', '#E8678C'];
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.9, sp = rand(6, 15);
        var life = rand(90, 150);
        this.add({ kind: 'conf', x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 0.22, drag: 0.975, life: life, max: life, size: rand(6, 11), rot: Math.random() * 6.28, vr: rand(-0.25, 0.25), color: cols[i % cols.length], ph: Math.random() * 6.28 });
      }
    },
    rain: function (kind, n, cols) {
      if (Motion.reduced) return;
      var self = this;
      cols = cols || ['#F7AECB', '#FFD6E5', '#FFFFFF', '#F48FB1', '#FFE3A6'];
      for (var i = 0; i < n; i++) {
        (function (i) {
          setTimeout(function () {
            var life = rand(220, 340);
            self.add({ kind: kind, x: rand(-20, self.w + 20), y: -20, vx: rand(-0.6, 0.6), vy: rand(1.1, 2.2), g: 0, drag: 1, life: life, max: life, size: rand(5, 10), rot: Math.random() * 6.28, vr: rand(-0.05, 0.05), color: cols[i % cols.length], ph: Math.random() * 6.28, sway: true });
          }, i * 70);
        })(i);
      }
    },
    at: function (node, o) { var c = center(node); this.burst(c.x, c.y, o); },
    tick: function (now) {
      var dt = this.last ? Math.min(3, (now - this.last) / 16.67) : 1;
      this.last = now;
      var cx = this.cx;
      cx.clearRect(0, 0, this.w, this.h);
      var alive = [];
      for (var i = 0; i < this.parts.length; i++) {
        var p = this.parts[i];
        p.life -= dt;
        if (p.life <= 0) continue;
        p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.ph += 0.15 * dt;
        if (p.sway) p.x += Math.sin(p.ph) * 0.8 * dt;
        var a = Math.min(1, p.life / (p.max * 0.4));
        cx.save();
        cx.globalAlpha = a;
        cx.translate(p.x, p.y);
        cx.rotate(p.rot);
        if (p.kind === 'glow') {
          cx.globalCompositeOperation = 'lighter';
          var s = p.size * 3.2;
          cx.drawImage(this.glow(p.color), -s, -s, s * 2, s * 2);
        } else if (p.kind === 'spark') {
          var k = p.size * (0.6 + 0.4 * Math.sin(p.ph * 2));
          cx.fillStyle = p.color;
          cx.beginPath();
          cx.moveTo(0, -k * 1.6); cx.quadraticCurveTo(0, 0, k * 1.6, 0); cx.quadraticCurveTo(0, 0, 0, k * 1.6); cx.quadraticCurveTo(0, 0, -k * 1.6, 0); cx.quadraticCurveTo(0, 0, 0, -k * 1.6);
          cx.fill();
        } else if (p.kind === 'conf') {
          cx.fillStyle = p.color;
          var hh = p.size * 0.55 * Math.abs(Math.cos(p.ph));
          cx.fillRect(-p.size / 2, -hh / 2, p.size, Math.max(1, hh));
        } else if (p.kind === 'petal') {
          cx.fillStyle = p.color;
          cx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.ph)));
          cx.beginPath(); cx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2); cx.fill();
        } else if (p.kind === 'heart') {
          var z = p.size / 10;
          cx.fillStyle = p.color; cx.scale(z, z);
          cx.beginPath(); cx.moveTo(0, 6); cx.bezierCurveTo(-10, -2, -6, -10, 0, -4); cx.bezierCurveTo(6, -10, 10, -2, 0, 6); cx.fill();
        }
        cx.restore();
        alive.push(p);
      }
      this.parts = alive;
      if (alive.length) this.raf = requestAnimationFrame(this.tick);
      else { this.raf = 0; cx.clearRect(0, 0, this.w, this.h); }
    }
  });

  /* ---------- Cortinilla de corazón ---------- */
  var Wipe = (E.Wipe = {
    el: null, star: null, cover: null, busy: false,
    init: function () {
      // corazón de unos 2 de ancho centrado en 0,0 (el hueco por el que se ve la pantalla)
      var heart = ART.heartPath(0, -0.12, 0.8);
      this.el = el('<svg class="wipe" aria-hidden="true" focusable="false"><defs>' +
        '<linearGradient id="wipeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#402435"/><stop offset=".45" stop-color="#9F263F"/><stop offset=".75" stop-color="#D9364F"/><stop offset="1" stop-color="#F48FB1"/></linearGradient>' +
        '<mask id="wipem"><rect x="-10" y="-10" width="200%" height="200%" fill="#fff"/><path id="wipes" d="' + heart + '" fill="#000"/></mask></defs>' +
        '<rect width="100%" height="100%" fill="url(#wipeg)" mask="url(#wipem)"/></svg>');
      document.body.appendChild(this.el);
      this.star = this.el.querySelector('#wipes');
      this.cover = el('<div class="fadecover" aria-hidden="true"></div>');
      document.body.appendChild(this.cover);
    },
    run: function (mid, o) {
      o = o || {};
      var self = this;
      if (this.busy) return Promise.resolve(mid && mid());
      this.busy = true;
      Sound.play('whoosh');
      if (Motion.reduced) {
        this.cover.classList.add('is-on');
        return wait(200).then(function () { return mid && mid(); }).then(function () { return wait(60); })
          .then(function () { self.cover.classList.remove('is-on'); self.busy = false; });
      }
      var W = window.innerWidth, H = window.innerHeight;
      var cx = o.x == null ? W / 2 : o.x, cy = o.y == null ? H / 2 : o.y;
      var far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
      var S = (far / 0.4) * 1.12;
      var star = this.star;
      function set(s, r) { star.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') rotate(' + r.toFixed(1) + ') scale(' + Math.max(s, 0.001).toFixed(3) + ')'); }
      set(S, 0);
      this.el.classList.add('is-on');
      return anim(340, function (t) { var e = t * t * t; set(S * (1 - e), 14 * t); })
        .then(function () { set(0, 14); return mid && mid(); })
        .then(function () { return wait(70); })
        .then(function () {
          cx = W / 2; cy = H * 0.45;
          return anim(460, function (t) { var e = 1 - Math.pow(1 - t, 3); set(S * e, -14 * (1 - t)); });
        })
        .then(function () { self.el.classList.remove('is-on'); self.busy = false; });
    }
  });

  /* ---------- Avisos ---------- */
  E.toast = function (text, ic) {
    var box = $('#toasts');
    var t = el('<div class="toast" role="status">' + (ic ? icon(ic) : '') + '<span>' + esc(text) + '</span></div>');
    box.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 320); }, 2600);
  };
  E.xpFloat = function (x, y, text) {
    var f = el('<div class="xp-float" aria-hidden="true">' + esc(text) + '</div>');
    f.style.left = (x - 30) + 'px'; f.style.top = (y - 20) + 'px';
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1400);
  };

  /* ---------- Hojas modales ---------- */
  function focusables(root) {
    return $$('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])', root)
      .filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  E.trapTab = function (e, root) {
    if (e.key !== 'Tab') return;
    var f = focusables(root);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  var Modal = (E.Modal = {
    open: function (inner, o) {
      o = o || {};
      var prev = document.activeElement;
      var id = 'm' + Math.random().toString(36).slice(2, 7);
      var m = el('<div class="modal"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="' + id + '" tabindex="-1">' + inner.replace('data-title', 'id="' + id + '"') + '</div></div>');
      document.body.appendChild(m);
      var sheet = m.firstElementChild, done, closed = false;
      var p = new Promise(function (r) { done = r; });
      function close(v) {
        if (closed) return; closed = true;
        m.style.animation = 'fadeOut .18s ease forwards';
        setTimeout(function () { m.remove(); }, 180);
        if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
        if (o.onClose) o.onClose(v);
        done(v);
      }
      m.addEventListener('click', function (e) {
        if (e.target === m && o.dismiss !== false) { Sound.play('tap'); close(null); }
        var c = e.target.closest('[data-close]');
        if (c && sheet.contains(c)) { Sound.play('tap'); close(c.getAttribute('data-close')); }
      });
      m.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && o.dismiss !== false) close(null);
        E.trapTab(e, sheet);
      });
      setTimeout(function () {
        var f = sheet.querySelector('[autofocus]') || sheet;
        try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
      }, 40);
      return { el: m, sheet: sheet, close: close, done: p };
    }
  });
  E.confirm = function (title, text, yes, no) {
    var md = Modal.open('<div class="sheet__head"><h2 data-title>' + esc(title) + '</h2></div><p>' + esc(text) + '</p>' +
      '<div class="sheet__actions"><button class="btn" data-close="yes">' + esc(yes) + '</button><button class="btn btn--soft" data-close="no" autofocus>' + esc(no) + '</button></div>');
    return md.done.then(function (v) { return v === 'yes'; });
  };

  /* ---------- Diálogos de Pom ---------- */
  E.typeInto = function (node, text, speed) {
    var stop = false, finish;
    var p = new Promise(function (res) {
      finish = function () { stop = true; node.textContent = text; res(); };
      if (Motion.reduced || !text) { finish(); return; }
      var i = 0;
      node.textContent = '';
      (function step() {
        if (stop) return;
        i += text.charAt(i) === ' ' ? 2 : 1;
        node.textContent = text.slice(0, i);
        if (i >= text.length) { stop = true; res(); return; }
        setTimeout(step, speed || 24);
      })();
    });
    return { done: p, finish: function () { finish(); } };
  };
  E.talk = function (lines, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var who = (C.companero && C.companero.nombre) || 'Pom';
      var box = el('<div class="talk" role="dialog" aria-modal="true" aria-label="' + esc(who) + ' te habla">' +
        '<div class="talk__box" tabindex="0"><div class="talk__pet bob">' + ART.pet('happy') + '</div>' +
        (o.skip ? '<button class="btn btn--soft btn--sm talk__skip" data-skip>Saltar</button>' : '') +
        '<span class="talk__name">' + esc(who) + '</span>' +
        '<p class="talk__text" aria-hidden="true"></p><p class="sr" aria-live="polite"></p>' +
        '<span class="talk__next">Toca para seguir' + icon('i-play') + '</span><div class="talk__actions" hidden></div></div></div>');
      document.body.appendChild(box);
      var tbox = $('.talk__box', box), txt = $('.talk__text', box), live = $('.sr', box), ch = $('.pet', box), next = $('.talk__next', box), acts = $('.talk__actions', box);
      var i = -1, typer = null, busy = false, ended = false;
      function end(v) {
        if (ended) return; ended = true;
        box.style.animation = 'fadeOut .2s ease forwards';
        setTimeout(function () { box.remove(); }, 200);
        if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
        resolve(v);
      }
      function show() {
        i++;
        if (i >= lines.length) { end(true); return; }
        var L = typeof lines[i] === 'string' ? { t: lines[i] } : lines[i];
        ch.setAttribute('data-expr', L.expr || 'happy');
        Sound.play('guau');
        live.textContent = L.t;
        typer = E.typeInto(txt, L.t, 22);
        busy = true;
        var last = i === lines.length - 1;
        next.hidden = !!(last && o.buttons);
        acts.hidden = true;
        typer.done.then(function () {
          busy = false;
          if (last && o.buttons) {
            acts.innerHTML = o.buttons.map(function (b, k) { return '<button class="btn ' + (b.cls || '') + ' btn--sm" data-b="' + k + '">' + esc(b.t) + '</button>'; }).join('');
            acts.hidden = false;
            var f = acts.querySelector('button'); if (f) f.focus({ preventScroll: true });
          }
        });
      }
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-b]');
        if (b) { Sound.play('tap'); end(o.buttons[+b.getAttribute('data-b')].v); return; }
        if (e.target.closest('[data-skip]')) { Sound.play('tap'); end('skip'); return; }
        if (!acts.hidden) return;
        if (busy) { typer.finish(); return; }
        Sound.play('tap');
        show();
      });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { if (e.target === tbox) { e.preventDefault(); tbox.click(); } }
        E.trapTab(e, box);
      });
      setTimeout(function () { tbox.focus({ preventScroll: true }); }, 50);
      show();
    });
  };

  /* ---------- Voz de Paulo ---------- */
  var probeCache = {};
  function probeOne(url) {
    if (!window.fetch || location.protocol === 'file:') return Promise.resolve('unknown');
    function ok(r) {
      var ct = (r.headers.get('content-type') || '').toLowerCase();
      return r.ok && ct.indexOf('text/html') === -1;
    }
    return fetch(url, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      if (ok(r)) return url;
      if (r.status === 405 || r.status === 501 || r.status === 403) {
        return fetch(url, { headers: { Range: 'bytes=0-1' }, cache: 'no-store' }).then(function (r2) { return (ok(r2) || r2.status === 206) ? url : null; });
      }
      return null;
    }).catch(function () { return 'unknown'; });
  }
  E.probeAudio = function (list) {
    if (!list || !list.length) return Promise.resolve(null);
    var key = list.join('|');
    if (probeCache[key]) return probeCache[key];
    probeCache[key] = list.reduce(function (acc, url) {
      return acc.then(function (found) {
        if (found && found !== 'unknown') return found;
        return probeOne(url).then(function (r) { return r === 'unknown' ? (found || { unknown: url }) : (r || found); });
      });
    }, Promise.resolve(null)).then(function (r) {
      if (r && typeof r === 'object') return { url: r.unknown, unknown: true };
      return r ? { url: r, unknown: false } : null;
    });
    return probeCache[key];
  };

  var Voice = (E.Voice = {
    audio: null, ui: null,
    stop: function () {
      if (this.audio) { try { this.audio.pause(); } catch (e) { /* nada */ } }
      Sound.duck(false);
      if (this.ui) { this.ui.classList.remove('playing'); var b = $('[data-v="play"] use', this.ui); if (b) b.setAttribute('href', '#i-play'); }
    },
    note: function (box, label, text) {
      box.innerHTML = '<div class="voice voice--note"><p class="voice__k">' + esc(label) + '</p><p class="voice__tx">“' + esc(text) + '”</p></div>';
    },
    mount: function (box, src, text, label) {
      var self = this;
      label = label || ('Un mensaje de ' + C.nombres.remitente);
      box.innerHTML = '';
      if (!src || !src.length) { if (text) this.note(box, label, text); return; }
      E.probeAudio(src).then(function (r) {
        if (!r) { if (text) self.note(box, label, text); return; }
        self.build(box, r.url, text, label);
      });
    },
    mini: function (box, src, label) {
      var self = this;
      box.innerHTML = '';
      if (!src || !src.length) return Promise.resolve(false);
      return E.probeAudio(src).then(function (r) {
        if (!r) return false;
        box.innerHTML = '<button class="vmini" type="button">' + icon('i-play') + '<span>' + esc(label) + '</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></button>';
        var b = box.firstElementChild, a = null;
        function set(on) { b.classList.toggle('playing', on); $('use', b).setAttribute('href', on ? '#i-pause' : '#i-play'); b.setAttribute('aria-pressed', String(on)); }
        set(false);
        b.addEventListener('click', function () {
          if (a && self.audio === a && !a.paused) { a.pause(); return; }
          if (!a || self.audio !== a) {
            if (self.audio) { try { self.audio.pause(); } catch (e) { /* nada */ } }
            a = new Audio(); a.preload = 'auto'; a.src = r.url;
            a.addEventListener('play', function () { set(true); Sound.duck(true); });
            a.addEventListener('pause', function () { set(false); Sound.duck(false); });
            a.addEventListener('ended', function () { set(false); Sound.duck(false); try { a.currentTime = 0; } catch (e) { /* nada */ } });
            a.addEventListener('error', function () { set(false); Sound.duck(false); box.innerHTML = ''; });
            self.audio = a; self.ui = null;
          }
          Sound.duck(true);
          var pr = a.play();
          if (pr && pr.catch) pr.catch(function (err) { set(false); Sound.duck(false); if (!err || err.name !== 'NotAllowedError') box.innerHTML = ''; });
        });
        return true;
      });
    },
    build: function (box, url, text, label) {
      var self = this;
      box.innerHTML = '<div class="voice"><p class="voice__k">' + esc(label) + '</p>' +
        '<button class="btn btn--wide" data-v="start">' + icon('i-play') + 'Escuchar mi mensaje</button>' +
        '<div class="voice__row" hidden>' +
        '<button class="vbtn" data-v="play" aria-label="Reproducir o pausar">' + icon('i-pause') + '</button>' +
        '<div class="vprog"><div class="vbar"><i></i></div><div class="vtime"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span><span data-v="time">0:00</span></div></div>' +
        '<button class="vbtn vbtn--sm" data-v="replay" aria-label="Escuchar desde el principio">' + icon('i-replay') + '</button></div>' +
        (text ? '<button class="voice__toggle" data-v="tx" aria-expanded="false">Leer el mensaje</button><p class="voice__tx" hidden>“' + esc(text) + '”</p>' : '') +
        '</div>';
      var ui = box.firstElementChild;
      var start = $('[data-v="start"]', ui), row = $('.voice__row', ui), play = $('[data-v="play"]', ui), bar = $('.vbar i', ui), tm = $('[data-v="time"]', ui);
      function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
      function setIcon(p) { $('use', play).setAttribute('href', p ? '#i-pause' : '#i-play'); ui.classList.toggle('playing', p); }
      function fail() {
        self.stop();
        if (text) { self.note(box, label, text); }
        else { box.innerHTML = ''; }
      }
      function attach() {
        if (self.audio) { try { self.audio.pause(); } catch (e) { /* nada */ } }
        var a = new Audio();
        a.preload = 'auto';
        a.src = url;
        a.addEventListener('timeupdate', function () {
          if (a.duration && isFinite(a.duration)) bar.style.width = (100 * a.currentTime / a.duration) + '%';
          tm.textContent = fmt(a.currentTime) + (a.duration && isFinite(a.duration) ? ' / ' + fmt(a.duration) : '');
        });
        a.addEventListener('ended', function () { setIcon(false); Sound.duck(false); bar.style.width = '100%'; });
        a.addEventListener('pause', function () { setIcon(false); Sound.duck(false); });
        a.addEventListener('play', function () { setIcon(true); Sound.duck(true); });
        a.addEventListener('error', fail);
        self.audio = a; self.ui = ui;
        return a;
      }
      var a = null;
      function go(fromStart) {
        if (!a || self.audio !== a) a = attach();
        if (fromStart) { try { a.currentTime = 0; } catch (e) { /* nada */ } }
        Sound.duck(true);
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function (err) { if (err && err.name === 'NotAllowedError') { setIcon(false); Sound.duck(false); } else fail(); });
      }
      start.addEventListener('click', function () { start.hidden = true; row.hidden = false; go(false); play.focus({ preventScroll: true }); });
      play.addEventListener('click', function () { if (a && self.audio === a && !a.paused) a.pause(); else go(false); });
      $('[data-v="replay"]', ui).addEventListener('click', function () { go(true); });
      var tg = $('[data-v="tx"]', ui);
      if (tg) tg.addEventListener('click', function () {
        var p = $('.voice__tx', ui), open = p.hidden;
        p.hidden = !open; tg.setAttribute('aria-expanded', String(open)); tg.textContent = open ? 'Ocultar el texto' : 'Leer el mensaje';
      });
    }
  });

  /* ---------- Cupones ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  E.couponId = function (rid) {
    var n = Object.keys(C.sorpresas).indexOf(rid) + 1;
    var code = hash(rid + C.nombres.jugadora + C.nombres.remitente + (C.sorpresas[rid] || {}).titulo).toString(36).toUpperCase().slice(-4);
    return 'PN-' + (n < 10 ? '0' : '') + n + '-' + code;
  };
  E.couponHTML = function (rid, at) {
    var r = C.sorpresas[rid];
    var d = at ? new Date(at) : new Date();
    var dl = d.getDate() + ' ' + E.MESES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
    return '<div class="coupon-wrap"><div class="coupon">' +
      '<div class="coupon__top"><span class="coupon__brand">' + icon('i-heart') + 'Una pequeña aventura</span><span class="coupon__id">N.º ' + E.couponId(rid) + '</span></div>' +
      (r.foto ? '<figure class="coupon__photo"><img src="' + esc(r.foto) + '" alt="" onerror="this.parentNode.remove()"></figure>' : '<span class="coupon__stamp">Sorpresa</span>') +
      '<h3 class="coupon__title">' + esc(r.titulo) + '</h3>' +
      '<p class="coupon__text">' + esc(r.texto) + '</p>' +
      '<div class="coupon__cut"></div>' +
      (r.nota ? '<p class="coupon__note">' + esc(r.nota) + '</p>' : '') +
      (r.propuesta || r.cuando ? '<div class="coupon__plan">' +
        (r.propuesta ? '<p><span>Mi plan</span>' + esc(r.propuesta) + '</p>' : '') +
        (r.cuando ? '<p><span>¿Cuándo?</span>' + esc(r.cuando) + '</p>' : '') + '</div>' : '') +
      '<p class="coupon__sign">— ' + esc(C.nombres.remitente) + '</p>' +
      '<div class="coupon__foot"><span>Para ' + esc(C.nombres.jugadora) + '</span><span>' + dl + '</span></div>' +
      '</div></div>';
  };
  E.fitCoupon = function (root) {
    var cp = $('.coupon', root), cut = $('.coupon__cut', root);
    if (cp && cut) cp.style.setProperty('--cut', (cut.offsetTop + 1) + 'px');
  };

  var blobCache = {};
  function loadImg(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function wrap(cx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + ' ' + words[i] : words[i];
      if (cx.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function rr(cx, x, y, w, h, r) {
    cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath();
  }
  E.couponBlob = function (rid, at) {
    if (blobCache[rid]) return blobCache[rid];
    var r = C.sorpresas[rid];
    var fontsReady = (document.fonts && document.fonts.load) ? Promise.all([
      document.fonts.load('700 64px Fredoka'), document.fonts.load('600 38px Nunito'), document.fonts.load('800 26px Nunito'), document.fonts.load('700 56px Caveat')
    ]).catch(function () { return null; }) : Promise.resolve();
    var petImg = loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART.pet('happy', true)));
    var photo = r.foto ? loadImg(r.foto) : Promise.resolve(null);
    blobCache[rid] = Promise.all([fontsReady, petImg, photo]).then(function (res) {
      var ch = res[1], ph = res[2];
      var mc = document.createElement('canvas').getContext('2d');
      var FT = 'Fredoka, Nunito, sans-serif', FB = 'Nunito, sans-serif', FH = 'Caveat, cursive';
      var tFont = 66, tLH = 76;
      mc.font = '700 ' + tFont + 'px ' + FT;
      var tl = wrap(mc, r.titulo, 760);
      if (tl.length > 2) { tFont = 56; tLH = 64; mc.font = '700 ' + tFont + 'px ' + FT; tl = wrap(mc, r.titulo, 780); }
      mc.font = '600 38px ' + FB;
      var dl = wrap(mc, r.texto || '', 740).slice(0, 3);
      mc.font = '700 60px ' + FH;
      var nl = r.nota ? wrap(mc, r.nota, 760).slice(0, 3) : [];
      // Posiciones relativas al borde superior del cupón
      var brandY = 92, imgTop = 126, imgH = ph ? 380 : (ch ? 196 : 0);
      var t0 = imgTop + imgH + (imgH ? 30 : 40) + tFont - 8;
      var tEnd = t0 + (tl.length - 1) * tLH;
      var d0 = tEnd + 62, dEnd = d0 + (dl.length - 1) * 50;
      var cutR = dEnd + 66;
      var n0 = cutR + 96, nEnd = nl.length ? n0 + (nl.length - 1) * 66 : cutR + 26;
      var plan = [];
      if (r.propuesta) plan.push(['MI PLAN', r.propuesta]);
      if (r.cuando) plan.push(['¿CUÁNDO?', r.cuando]);
      mc.font = '600 33px ' + FB;
      var cursor = nEnd + (nl.length ? 70 : 54), planEnd = nEnd;
      plan.forEach(function (row) {
        row.y = cursor;
        row.lines = wrap(mc, row[1], 720).slice(0, 3);
        row.t0 = cursor + 44;
        planEnd = row.t0 + (row.lines.length - 1) * 43;
        cursor = planEnd + 58;
      });
      var signR = (plan.length ? planEnd : nEnd) + 72, footR = signR + 96, th = footR + 58;
      var W = 1080, H = Math.max(1350, th + 230), tx = 90, tw = 900;
      var ty = Math.round((H - th - 70) / 2), cutY = ty + cutR;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var cx = cv.getContext('2d');
      var bg = cx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#FFDCE7'); bg.addColorStop(0.5, '#FFF4EC'); bg.addColorStop(1, '#FFE6C8');
      cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
      [[140, 160, 280, 'rgba(244,143,177,.35)'], [960, H - 140, 320, 'rgba(217,54,79,.16)'], [980, 140, 220, 'rgba(245,199,126,.35)']].forEach(function (b) {
        var g = cx.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]); g.addColorStop(0, b[3]); g.addColorStop(1, 'rgba(255,255,255,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      });
      var tk = document.createElement('canvas'); tk.width = W; tk.height = H;
      var k = tk.getContext('2d');
      k.shadowColor = 'rgba(64,36,53,.18)'; k.shadowBlur = 40; k.shadowOffsetY = 18;
      rr(k, tx, ty, tw, th, 56); k.fillStyle = '#FFFCF7'; k.fill();
      k.shadowColor = 'transparent';
      var tint = k.createRadialGradient(tx, ty, 0, tx, ty, 520); tint.addColorStop(0, 'rgba(244,143,177,.38)'); tint.addColorStop(1, 'rgba(244,143,177,0)');
      k.globalCompositeOperation = 'source-atop'; k.fillStyle = tint; k.fillRect(tx, ty, tw, th);
      var tint2 = k.createRadialGradient(tx + tw, ty + th, 0, tx + tw, ty + th, 560); tint2.addColorStop(0, 'rgba(245,199,126,.45)'); tint2.addColorStop(1, 'rgba(245,199,126,0)');
      k.fillStyle = tint2; k.fillRect(tx, ty, tw, th);
      k.globalCompositeOperation = 'destination-out';
      k.fillStyle = '#000';
      k.beginPath(); k.arc(tx, cutY, 38, 0, Math.PI * 2); k.fill();
      k.beginPath(); k.arc(tx + tw, cutY, 38, 0, Math.PI * 2); k.fill();
      k.globalCompositeOperation = 'source-over';
      cx.drawImage(tk, 0, 0);
      cx.save(); cx.setLineDash([16, 14]); cx.lineWidth = 4; cx.strokeStyle = 'rgba(217,54,79,.4)';
      rr(cx, tx + 24, ty + 24, tw - 48, th - 48, 38); cx.stroke();
      cx.strokeStyle = 'rgba(64,36,53,.2)'; cx.beginPath(); cx.moveTo(tx + 60, cutY); cx.lineTo(tx + tw - 60, cutY); cx.stroke(); cx.restore();
      cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      cx.fillStyle = '#D9364F'; cx.font = '800 28px ' + FB;
      cx.fillText('UNA PEQUEÑA AVENTURA', W / 2, ty + brandY);
      if (ph) {
        var pw = 320;
        cx.save(); cx.translate(W / 2, ty + imgTop + imgH / 2 - 10); cx.rotate(-0.03);
        cx.fillStyle = '#fff'; cx.shadowColor = 'rgba(64,36,53,.25)'; cx.shadowBlur = 20;
        cx.fillRect(-pw / 2 - 16, -pw / 2 - 16, pw + 32, pw + 60);
        cx.shadowColor = 'transparent';
        var sc = Math.max(pw / ph.width, pw / ph.height), iw = ph.width * sc, ih = ph.height * sc;
        cx.beginPath(); cx.rect(-pw / 2, -pw / 2, pw, pw); cx.clip();
        cx.drawImage(ph, -iw / 2, -ih / 2, iw, ih); cx.restore();
      } else if (ch) {
        cx.drawImage(ch, W / 2 - imgH / 2, ty + imgTop, imgH, imgH);
      }
      cx.fillStyle = '#402435'; cx.font = '700 ' + tFont + 'px ' + FT;
      tl.forEach(function (l, i) { cx.fillText(l, W / 2, ty + t0 + i * tLH); });
      cx.fillStyle = '#6E4A5E'; cx.font = '600 38px ' + FB;
      dl.forEach(function (l, i) { cx.fillText(l, W / 2, ty + d0 + i * 50); });
      if (nl.length) {
        cx.fillStyle = '#B8304A'; cx.font = '700 60px ' + FH;
        nl.forEach(function (l, i) { cx.fillText(l, W / 2, ty + n0 + i * 66); });
      }
      plan.forEach(function (row) {
        cx.fillStyle = '#D9364F'; cx.font = '800 24px ' + FB;
        cx.fillText(row[0], W / 2, ty + row.y);
        cx.fillStyle = '#402435'; cx.font = '600 33px ' + FB;
        row.lines.forEach(function (l, i) { cx.fillText(l, W / 2, ty + row.t0 + i * 43); });
      });
      cx.fillStyle = '#6E4A5E'; cx.font = '700 54px ' + FH;
      cx.fillText('— ' + C.nombres.remitente, W / 2, ty + signR);
      cx.font = '800 26px ' + FB; cx.fillStyle = '#96717F';
      cx.textAlign = 'left'; cx.fillText(('Para ' + C.nombres.jugadora).toUpperCase(), tx + 70, ty + footR);
      cx.textAlign = 'right'; cx.fillText('N.º ' + E.couponId(rid), tx + tw - 70, ty + footR);
      cx.textAlign = 'center'; cx.font = '700 28px ' + FB; cx.fillStyle = 'rgba(64,36,53,.55)';
      cx.fillText('Descubierto el ' + E.dateLabel(at || Date.now()), W / 2, H - 56);
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
    blobCache[rid].catch(function () { delete blobCache[rid]; });
    return blobCache[rid];
  };

  var dlP = null;
  E.downloads = function () {
    if (!dlP) {
      dlP = E.inArtifact ? window.claude.use('downloads').then(function (d) { return d || null; }, function () { return null; }) : Promise.resolve(null);
    }
    return dlP;
  };
  function blobToDataURL(b) {
    return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(b); });
  }
  /* Guardar una imagen: capacidad de descargas del artefacto, compartir del
     móvil o, si nada de eso existe, la imagen en pantalla para mantenerla pulsada. */
  E.saveImage = function (blob, name, title, o) {
    o = o || {};
    if (!blob) return Promise.reject(new Error('sin imagen'));
    function viaDownloads() {
      return E.downloads().then(function (dl) {
        if (!dl) return 'none';
        return dl.save({ filename: name, data: blob }).then(function () { E.toast(o.ok || 'Imagen guardada', 'i-check'); return 'done'; }, function (err) {
          if (err && err.code === 'declined') return 'done';
          return 'none';
        });
      });
    }
    function viaShare() {
      if (!navigator.share || !navigator.canShare || typeof File === 'undefined') return Promise.resolve('none');
      var file;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { return Promise.resolve('none'); }
      if (!navigator.canShare({ files: [file] })) return Promise.resolve('none');
      return navigator.share({ files: [file], title: title }).then(function () { return 'done'; }, function (err) {
        return err && err.name === 'AbortError' ? 'done' : 'none';
      });
    }
    var first = E.inArtifact ? viaDownloads : viaShare, second = E.inArtifact ? viaShare : viaDownloads;
    return first().then(function (st) { return st === 'done' ? st : second(); }).then(function (st) {
      if (st === 'done') return;
      return blobToDataURL(blob).then(function (url) {
        var canLink = !E.inArtifact;
        Modal.open('<div class="sheet__head"><h2 data-title>' + esc(o.head || 'Guarda la imagen') + '</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
          '<img class="imgsave" src="' + url + '" alt="' + esc(o.alt || title) + '">' +
          '<p>Mantén pulsada la imagen y elige «Guardar en Fotos». También vale una captura de pantalla.</p>' +
          (canLink ? '<div class="sheet__actions"><a class="btn btn--gold" href="' + url + '" download="' + name + '">' + icon('i-save') + 'Descargar imagen</a></div>' : ''));
      });
    });
  };
  E.saveCoupon = function (rid, at) {
    var r = C.sorpresas[rid];
    var name = 'vale-' + E.couponId(rid).toLowerCase() + '.png';
    return E.couponBlob(rid, at).then(function (blob) {
      return E.saveImage(blob, name, r.titulo, { ok: 'Cupón guardado', head: 'Guarda tu cupón', alt: 'Imagen del cupón: ' + r.titulo });
    }).catch(function () {
      E.toast('No he podido preparar la imagen. Haz una captura de pantalla.', 'i-sparkle');
    });
  };

  /* ---------- El pase del final ---------- */
  var PALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function rndBytes(n) {
    var a = new Uint8Array(n);
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256); }
    return a;
  }
  E.passId = function () { var b = rndBytes(8), s = 'PA-'; for (var i = 0; i < 8; i++) { if (i === 4) s += '-'; s += PALFA[b[i] % 32]; } return s; };
  E.token = function (n) {
    var b = rndBytes(n || 24), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  function paseCfg() { return C.pase || {}; }
  function paseLugares() { return paseCfg().lugares || ['La plaza', 'La tiendita', 'La casita', 'La puerta del viernes']; }
  function paseFecha(P) { return (P.srv && P.srv.emitido) ? Date.parse(P.srv.emitido) : P.at; }
  function shortDate(ts) { var d = new Date(ts); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); }
  E.passHTML = function (P, o) {
    o = o || {};
    var K = paseCfg(), name = C.nombres.jugadora, lug = paseLugares();
    var redeemed = P.srv && P.srv.estado === 'canjeado';
    var code = (P.srv && P.srv.url && P.srv.estado !== 'anulado' && window.QR)
      ? '<div class="pass__qr">' + window.QR.svg(P.srv.url, { label: 'Código QR del pase', dark: '#402435' }) + '</div><p class="pass__codecap">Escanéalo para comprobar que es auténtico. Escanearlo no lo canjea.</p>'
      : '<div class="pass__seal">' + icon('i-heart') + '<span>Recuerdo<br>de la aventura</span></div><p class="pass__codecap">' + esc(o.localNote || 'Un recuerdo para guardar siempre.') + '</p>';
    return '<article class="pass' + (o.cls ? ' ' + o.cls : '') + '" aria-label="' + esc((K.titulo || 'Pase de aventurera') + ' de ' + name) + '">' +
      '<div class="pass__in"><div class="pass__face pass__front">' +
      (P.test ? '<span class="pass__test" aria-hidden="true">Prueba</span>' : '') +
      '<div class="pass__top"><span class="pass__brand">' + icon('i-heart') + 'Una pequeña aventura</span><span class="pass__no">N.º ' + esc(P.id) + '</span></div>' +
      '<p class="pass__kind">' + esc(K.titulo || 'Pase de aventurera') + '</p>' +
      '<div class="pass__art">' + ART.emblem() + '<div class="pass__pom">' + ART.pet('happy') + '</div></div>' +
      '<p class="pass__lab">Titular</p><p class="pass__name">' + esc(name) + '</p>' +
      '<div class="pass__grid"><p><span>Estado</span><b>Aventura completada</b></p><p><span>Completada</span><b>' + esc(shortDate(paseFecha(P))) + '</b></p>' +
      '<p><span>De parte de</span><b>' + esc(C.nombres.remitente) + '</b></p><p><span>Lugares</span><b>' + lug.length + ' de ' + lug.length + '</b></p></div>' +
      '<ul class="pass__places">' + lug.map(function (l, i) { return '<li><i>' + icon('i-place' + Math.min(i, 3)) + '</i><span>' + esc(l.replace(/^La puerta del viernes$/, 'La puerta')) + '</span></li>'; }).join('') + '</ul>' +
      (K.mensaje ? '<p class="pass__msg">“' + esc(K.mensaje) + '”</p>' : '') +
      '<div class="pass__code">' + code + '</div>' +
      (redeemed ? '<div class="pass__stamp' + (o.stampNew ? ' is-new' : '') + '" aria-hidden="true">Canjeado<small>' + esc(shortDate(Date.parse(P.srv.canjeado) || Date.now())) + '</small></div>' : '') +
      '</div><div class="pass__face pass__back" aria-hidden="true">' + ART.emblem() + '<p>' + esc(K.titulo || 'Pase de aventurera') + '</p></div></div>' +
      '<span class="pass__shine" aria-hidden="true"></span></article>';
  };
  // Cómo se vería en Apple Wallet (los mismos campos que pass.json del servidor)
  E.walletHTML = function (P) {
    var K = paseCfg(), url = (P.srv && P.srv.url) || 'https://ejemplo.com/pase/verificar.php?c=EJEMPLO';
    return '<div class="wpass" aria-label="Vista previa para Wallet">' +
      '<div class="wpass__top"><span class="wpass__logo"><svg viewBox="20 12 80 80" aria-hidden="true">' + ART.pomHead(true) + '</svg></span><span class="wpass__lt">Una pequeña aventura</span><span class="wpass__hd">' + esc((K.titulo || 'Pase de aventurera').toUpperCase()) + '</span></div>' +
      '<div class="wpass__pri"><div><p class="wpass__lab">TITULAR</p><p class="wpass__big">' + esc(C.nombres.jugadora) + '</p></div><span class="wpass__thumb">' + ART.emblem() + '</span></div>' +
      '<div class="wpass__row"><div><p class="wpass__lab">ESTADO</p><p class="wpass__val">Aventura completada</p></div><div class="r"><p class="wpass__lab">COMPLETADA</p><p class="wpass__val">' + esc(shortDate(paseFecha(P))) + '</p></div></div>' +
      '<div class="wpass__row"><div><p class="wpass__lab">DE PARTE DE</p><p class="wpass__val">' + esc(C.nombres.remitente) + '</p></div><div class="r"><p class="wpass__lab">N.º</p><p class="wpass__val">' + esc(P.id) + '</p></div></div>' +
      '<div class="wpass__code">' + (window.QR ? window.QR.svg(url, { dark: '#000' }) : '') + '<small>' + esc(P.id) + '</small></div></div>';
  };

  // Imagen de recuerdo en alta resolución (1200 × 1800)
  E.passBlob = function (P) {
    var K = paseCfg(), lug = paseLugares();
    var fontsReady = (document.fonts && document.fonts.load) ? Promise.all([
      document.fonts.load('700 120px Fredoka'), document.fonts.load('800 30px Nunito'), document.fonts.load('700 54px Caveat')
    ]).catch(function () { return null; }) : Promise.resolve();
    function svgImg(svg) { return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); }
    var emblem = ART.emblem().replace('<svg ', '<svg width="800" height="800" ');
    return Promise.all([fontsReady, svgImg(emblem), svgImg(ART.pet('happy', true))].concat(lug.slice(0, 4).map(function (l, i) { return svgImg(ART.placeIcon(i, '#D9364F')); }))).then(function (res) {
      var em = res[1], pom = res[2], icons = res.slice(3);
      var W = 1200, H = 1800, cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var cx = cv.getContext('2d');
      var FT = 'Fredoka, Nunito, sans-serif', FB = 'Nunito, sans-serif', FH = 'Caveat, cursive';
      // fondo
      var bg = cx.createRadialGradient(W / 2, H * 0.3, 80, W / 2, H * 0.4, H);
      bg.addColorStop(0, '#6E1F3A'); bg.addColorStop(0.55, '#402435'); bg.addColorStop(1, '#1E0F1E');
      cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
      var R = ART.rng(5);
      for (var i = 0; i < 90; i++) { cx.globalAlpha = 0.25 + R() * 0.6; cx.fillStyle = i % 3 ? '#FFE3A6' : '#FFD6E5'; cx.beginPath(); cx.arc(R() * W, R() * H, 1 + R() * 3, 0, 6.3); cx.fill(); }
      cx.globalAlpha = 1;
      // tarjeta
      var x = 110, y = 110, w = 980, h = 1580;
      cx.save(); cx.shadowColor = 'rgba(20,8,18,.55)'; cx.shadowBlur = 60; cx.shadowOffsetY = 26;
      rr(cx, x, y, w, h, 70);
      var g = cx.createLinearGradient(x, y, x + w * 0.55, y + h);
      g.addColorStop(0, '#F48FB1'); g.addColorStop(0.24, '#E8678C'); g.addColorStop(0.5, '#D9364F'); g.addColorStop(0.78, '#9F263F'); g.addColorStop(1, '#6E1F3A');
      cx.fillStyle = g; cx.fill(); cx.restore();
      cx.save(); rr(cx, x, y, w, h, 70); cx.clip();
      var glow = cx.createRadialGradient(W / 2, y + 120, 10, W / 2, y + 120, 700); glow.addColorStop(0, 'rgba(255,214,229,.45)'); glow.addColorStop(1, 'rgba(255,214,229,0)');
      cx.fillStyle = glow; cx.fillRect(x, y, w, h);
      cx.globalAlpha = 0.08; cx.fillStyle = '#fff';
      for (var yy = y + 30; yy < y + h; yy += 64) for (var xx = x + 30 + ((yy / 64) % 2) * 32; xx < x + w; xx += 64) { cx.beginPath(); cx.arc(xx, yy, 4, 0, 6.3); cx.fill(); }
      cx.globalAlpha = 1; cx.restore();
      cx.lineWidth = 6; cx.strokeStyle = '#F5C77E'; rr(cx, x + 26, y + 26, w - 52, h - 52, 50); cx.stroke();
      cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(245,199,126,.6)'; rr(cx, x + 42, y + 42, w - 84, h - 84, 40); cx.stroke();
      cx.textBaseline = 'alphabetic';
      // cabecera
      cx.fillStyle = '#FFE3EC'; cx.font = '800 30px ' + FB; cx.textAlign = 'left';
      cx.fillText('UNA PEQUEÑA AVENTURA', x + 90, y + 130);
      cx.fillStyle = '#F5C77E'; cx.textAlign = 'right'; cx.fillText('N.º ' + P.id, x + w - 90, y + 130);
      // Dos composiciones: con código QR (pase del servidor) o como recuerdo local
      var hasQR = !!(P.srv && P.srv.url && P.srv.estado !== 'anulado' && window.QR);
      var L = hasQR
        ? { kind: 200, emT: 228, es: 340, pom: 210, lab: 632, name: 750, nameF: 120, cellT: 792, cellH: 116, cellG: 18, plY: 1110, plR: 42, plL: 78, plF: 24 }
        : { kind: 205, emT: 240, es: 400, pom: 240, lab: 735, name: 860, nameF: 128, cellT: 910, cellH: 124, cellG: 20, plY: 1250, plR: 46, plL: 84, plF: 25 };
      cx.textAlign = 'center'; cx.font = '800 34px ' + FB; cx.fillStyle = '#F5C77E';
      cx.fillText((K.titulo || 'Pase de aventurera').toUpperCase(), W / 2, y + L.kind);
      // emblema y Pom
      var es = L.es;
      if (em) { cx.save(); cx.shadowColor = 'rgba(30,8,20,.45)'; cx.shadowBlur = 40; cx.shadowOffsetY = 18; cx.drawImage(em, W / 2 - es / 2, y + L.emT, es, es); cx.restore(); }
      if (pom) cx.drawImage(pom, W / 2 + es * 0.22, y + L.emT + es * 0.5, L.pom, L.pom);
      // titular
      cx.fillStyle = '#FFD6E5'; cx.font = '800 30px ' + FB; cx.fillText('TITULAR', W / 2, y + L.lab);
      var nz = L.nameF; cx.font = '700 ' + nz + 'px ' + FT;
      while (cx.measureText(C.nombres.jugadora).width > 860 && nz > 60) { nz -= 4; cx.font = '700 ' + nz + 'px ' + FT; }
      cx.fillStyle = '#FFFFFF';
      cx.save(); cx.shadowColor = 'rgba(110,31,58,.6)'; cx.shadowOffsetY = 8; cx.fillText(C.nombres.jugadora, W / 2, y + L.name); cx.restore();
      // campos
      var cells = [['ESTADO', 'Aventura completada'], ['COMPLETADA', shortDate(paseFecha(P))], ['DE PARTE DE', C.nombres.remitente], ['LUGARES', lug.length + ' de ' + lug.length]];
      cells.forEach(function (c, i) {
        var cx0 = x + 90 + (i % 2) * 410, cy0 = y + L.cellT + Math.floor(i / 2) * (L.cellH + L.cellG);
        cx.fillStyle = 'rgba(64,36,53,.26)'; rr(cx, cx0, cy0, 390, L.cellH, 26); cx.fill();
        cx.strokeStyle = 'rgba(255,214,229,.3)'; cx.lineWidth = 2; cx.stroke();
        cx.textAlign = 'left'; cx.fillStyle = '#F5C77E'; cx.font = '800 24px ' + FB; cx.fillText(c[0], cx0 + 28, cy0 + 46);
        var fz = 38; cx.font = '700 ' + fz + 'px ' + FT;
        while (cx.measureText(c[1]).width > 390 - 52 && fz > 22) { fz -= 2; cx.font = '700 ' + fz + 'px ' + FT; }
        cx.fillStyle = '#FFFFFF'; cx.fillText(c[1], cx0 + 28, cy0 + L.cellH - 26);
      });
      // los cuatro lugares
      cx.textAlign = 'center';
      lug.slice(0, 4).forEach(function (l, i) {
        var px = x + 170 + i * 213, py = y + L.plY, ir = Math.round(L.plR * 1.13);
        cx.fillStyle = 'rgba(255,244,236,.96)'; cx.beginPath(); cx.arc(px, py, L.plR, 0, 6.3); cx.fill();
        cx.strokeStyle = 'rgba(245,199,126,.9)'; cx.lineWidth = 5; cx.stroke();
        if (icons[i]) cx.drawImage(icons[i], px - ir / 2, py - ir / 2, ir, ir);
        cx.fillStyle = '#FFE3EC'; cx.font = '700 ' + L.plF + 'px ' + FB; cx.fillText(l.replace(/^La puerta del viernes$/, 'La puerta'), px, py + L.plL);
      });
      if (hasQR) {
        // talón: mensaje a la izquierda y el código a la derecha
        cx.save(); cx.setLineDash([14, 12]); cx.lineWidth = 3; cx.strokeStyle = 'rgba(255,214,229,.5)';
        cx.beginPath(); cx.moveTo(x + 70, y + 1232); cx.lineTo(x + w - 70, y + 1232); cx.stroke(); cx.restore();
        var qs = 256, qx = x + w - 84 - qs, qy = y + 1258;
        cx.fillStyle = '#fff'; rr(cx, qx - 14, qy - 14, qs + 28, qs + 28, 24); cx.fill();
        window.QR.draw(cx, P.srv.url, qx, qy, qs, { dark: '#402435', margin: 2 });
        cx.textAlign = 'left';
        if (K.mensaje) {
          cx.fillStyle = '#FFF0F5'; cx.font = '700 50px ' + FH;
          wrap(cx, '“' + K.mensaje + '”', qx - 40 - (x + 90)).slice(0, 3).forEach(function (l, i) { cx.fillText(l, x + 90, y + 1318 + i * 56); });
        }
        cx.fillStyle = '#FFD6E5'; cx.font = '700 25px ' + FB;
        cx.fillText('Escanéalo para comprobar', x + 90, y + 1482); cx.fillText('que es auténtico.', x + 90, y + 1514);
      } else {
        if (K.mensaje) {
          cx.fillStyle = '#FFF0F5'; cx.font = '700 52px ' + FH;
          wrap(cx, '“' + K.mensaje + '”', 820).slice(0, 2).forEach(function (l, i) { cx.fillText(l, W / 2, y + 1408 + i * 58); });
        }
        cx.fillStyle = 'rgba(255,214,229,.85)'; cx.font = '700 26px ' + FB;
        cx.fillText('Un recuerdo de la aventura · ' + E.dateLabel(paseFecha(P)), W / 2, y + 1528);
      }
      if (P.srv && P.srv.estado === 'canjeado') {
        cx.save(); cx.translate(x + 250, y + L.emT + es * 0.42); cx.rotate(-0.24);
        cx.fillStyle = 'rgba(110,31,58,.45)'; rr(cx, -200, -70, 400, 140, 22); cx.fill();
        cx.strokeStyle = 'rgba(245,199,126,.95)'; cx.lineWidth = 7; rr(cx, -200, -70, 400, 140, 22); cx.stroke();
        cx.fillStyle = '#F5C77E'; cx.textAlign = 'center'; cx.font = '700 64px ' + FT; cx.fillText('CANJEADO', 0, 6);
        cx.font = '800 26px ' + FB; cx.fillText(shortDate(Date.parse(P.srv.canjeado) || Date.now()).toUpperCase(), 0, 46); cx.restore();
      }
      cx.textAlign = 'center'; cx.fillStyle = 'rgba(255,214,229,.55)'; cx.font = '700 26px ' + FB;
      cx.fillText('Para ' + C.nombres.jugadora + ', de ' + C.nombres.remitente, W / 2, H - 44);
      return new Promise(function (res2) { cv.toBlob(function (b) { res2(b); }, 'image/png'); });
    });
  };

  E.shareText = function (title, text) {
    function copy() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { E.toast('Copiado. Pégalo donde quieras.', 'i-check'); return true; }, function () { return false; });
      }
      return Promise.resolve(false);
    }
    function manual() {
      Modal.open('<div class="sheet__head"><h2 data-title>Tu texto</h2><button class="icon-btn" data-close aria-label="Cerrar">' + icon('i-close') + '</button></div>' +
        '<p>Cópialo y compártelo donde quieras.</p><textarea class="field" rows="6" readonly>' + esc(text) + '</textarea>');
      return true;
    }
    if (!E.inArtifact && navigator.share) {
      return navigator.share({ title: title, text: text }).then(function () { return true; }, function (err) {
        if (err && err.name === 'AbortError') return false;
        return copy().then(function (ok) { return ok || manual(); });
      });
    }
    return copy().then(function (ok) { return ok || manual(); });
  };
})();
