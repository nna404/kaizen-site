/* ==========================================================================
   HALLOWEEN.JS — animações temáticas (versão KAIZEN / japonesa)

   Como usar: adicione antes de fechar o </body>
   <script src="halloween.js" defer></script>

   O script cria tudo sozinho (elementos + CSS), não precisa mexer no HTML.
   Funciona bem junto com o halloween.css, mas também roda sem ele.

   O que ele faz:
   - Lanternas (chōchin 🏮), folhas de bordo 🍁, máscaras oni 👹 e tengu 👺,
     fantasmas 👻 e kanji (改 善 鬼 魔 妖 闇) caindo pela tela
   - Hitodama: chamas vermelhas de espíritos flutuando em ondas
   - Um yūrei (fantasma) ou máscara que cruza a tela de vez em quando
   - Duas lanternas penduradas no topo, balançando
   - Névoa avermelhada no rodapé
   - Mini explosão de símbolos ao clicar em qualquer lugar
   - Botão no canto inferior esquerdo para ligar/desligar tudo
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     CONFIGURAÇÕES — mexa aqui para ajustar quantidade, tamanho e velocidade
     Os pares [min, max] são sorteados a cada novo elemento.
     ------------------------------------------------------------------------ */

  var CONFIG = {
    storageKey: 'hw-fx',

    // Itens que caem (emoji ou kanji). Repetir um item aumenta a chance dele.
    falling: {
      enabled: true,
      items: ['🏮', '🍁', '🍁', '👹', '👺', '👻', '改', '善', '鬼', '魔', '妖', '闇'],
      every: [1300, 2600],      // intervalo entre cada queda (ms)
      size: [20, 38],           // tamanho (px)
      duration: [9000, 16000],  // tempo para cruzar a tela (ms)
      max: 14                   // máximo de itens na tela ao mesmo tempo
    },

    // Hitodama: chamas de espíritos
    spirits: {
      enabled: true,
      every: [4500, 8500],
      count: [1, 3],
      size: [14, 26],
      duration: [8000, 14000]
    },

    // Fantasma/máscara que cruza a tela devagar
    ghost: {
      enabled: true,
      items: ['👻', '👻', '👹', '👺'],
      every: [20000, 35000],
      size: [48, 70],
      duration: [14000, 20000]
    },

    // Lanternas penduradas no topo
    lanterns: {
      enabled: true,
      items: [
        { side: 'right', offset: '7%', rope: 60, size: 40, delay: '0s' },
        { side: 'left', offset: '5%', rope: 95, size: 32, delay: '-2s' }
      ]
    },

    mist: { enabled: true },

    clickBurst: {
      enabled: true,
      items: ['🏮', '👹', '🍁', '⛩️', '改', '鬼'],
      count: 7
    }
  };


  /* ------------------------------------------------------------------------
     UTILITÁRIOS
     ------------------------------------------------------------------------ */

  var KANJI = /[\u4e00-\u9fff]/;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randRange(range) {
    return rand(range[0], range[1]);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function readStorage() {
    try {
      return localStorage.getItem(CONFIG.storageKey);
    } catch (e) {
      return null;
    }
  }

  function writeStorage(value) {
    try {
      localStorage.setItem(CONFIG.storageKey, value);
    } catch (e) {
      /* sem acesso ao storage: ignora */
    }
  }

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';


  /* ------------------------------------------------------------------------
     CSS INJETADO
     ------------------------------------------------------------------------ */

  var CSS = [
    '.hw-layer{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:60}',
    '.hw-layer[hidden]{display:none}',
    '.hw-sprite{position:absolute;left:0;top:0;line-height:1;will-change:transform;user-select:none}',
    '.hw-sprite>span{display:inline-block}',

    /* Kanji */
    '.hw-kanji{font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","MS PMincho",serif;',
    'font-weight:700;color:#e5252a;text-shadow:0 0 10px rgba(229,37,42,.75)}',

    /* Hitodama */
    '.hw-orb{border-radius:50%;',
    'background:radial-gradient(circle at 50% 55%,#fff 0%,#ffd6d6 16%,#e5252a 42%,rgba(193,18,31,0) 72%);',
    'filter:drop-shadow(0 0 8px rgba(229,37,42,.85))}',

    /* Lanternas penduradas */
    '.hw-lantern{position:absolute;top:0;display:flex;flex-direction:column;align-items:center;',
    'transform-origin:top center;animation:hw-sway 5s ease-in-out infinite}',
    '.hw-rope{width:1px;background:rgba(245,241,234,.55)}',
    '.hw-lantern-body{line-height:1;margin-top:-2px;filter:drop-shadow(0 0 10px rgba(229,37,42,.75))}',
    '@keyframes hw-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}',

    /* Névoa */
    '.hw-mist{position:absolute;left:0;right:0;bottom:0;height:170px;',
    'background:radial-gradient(ellipse at 18% 100%,rgba(193,18,31,.24),transparent 60%),',
    'radial-gradient(ellipse at 82% 100%,rgba(245,241,234,.09),transparent 55%);',
    'animation:hw-mist 12s ease-in-out infinite alternate}',
    '@keyframes hw-mist{from{opacity:.55;transform:translateX(-3%)}to{opacity:1;transform:translateX(3%)}}',

    /* Botão liga/desliga */
    '.hw-toggle{position:fixed;left:16px;bottom:16px;z-index:70;width:44px;height:44px;border-radius:50%;',
    'border:1px solid var(--hw-blood,#c1121f);background:rgba(0,0,0,.88);color:#fff;font-size:22px;line-height:1;',
    'cursor:pointer;display:grid;place-items:center;padding:0;',
    'box-shadow:0 0 14px rgba(193,18,31,.45);transition:transform .2s,opacity .2s,box-shadow .2s}',
    '.hw-toggle:hover{transform:scale(1.1);box-shadow:0 0 22px rgba(229,37,42,.7)}',
    '.hw-toggle:focus-visible{outline:2px solid var(--hw-bone,#f5f1ea);outline-offset:2px}',
    '.hw-toggle[aria-pressed="false"]{opacity:.55;filter:grayscale(1)}',

    /* Mobile */
    '@media(max-width:760px){.hw-lantern-body{transform:scale(.8)}',
    '.hw-toggle{width:40px;height:40px;font-size:20px;left:12px;bottom:12px}}'
  ].join('');


  /* ------------------------------------------------------------------------
     ESTADO E ELEMENTOS BASE
     ------------------------------------------------------------------------ */

  var layer = null;
  var toggleBtn = null;
  var enabled = false;
  var timers = [];
  var fallingCount = 0;


  function injectStyles() {
    var style = document.createElement('style');
    style.setAttribute('data-hw', '');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildLayer() {
    layer = document.createElement('div');
    layer.className = 'hw-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.hidden = true;

    if (CONFIG.mist.enabled) {
      var mist = document.createElement('div');
      mist.className = 'hw-mist';
      layer.appendChild(mist);
    }

    if (CONFIG.lanterns.enabled) {
      CONFIG.lanterns.items.forEach(function (cfg) {
        var lantern = document.createElement('div');
        lantern.className = 'hw-lantern';
        lantern.style[cfg.side] = cfg.offset;
        lantern.style.animationDelay = cfg.delay;
        lantern.style.animationDuration = rand(4, 6.5).toFixed(1) + 's';

        var rope = document.createElement('div');
        rope.className = 'hw-rope';
        rope.style.height = cfg.rope + 'px';

        var body = document.createElement('div');
        body.className = 'hw-lantern-body';
        body.style.fontSize = cfg.size + 'px';
        body.textContent = '🏮';

        lantern.appendChild(rope);
        lantern.appendChild(body);
        layer.appendChild(lantern);
      });
    }

    document.body.appendChild(layer);
  }

  function buildToggle() {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'hw-toggle';
    toggleBtn.textContent = '🏮';
    toggleBtn.setAttribute('aria-label', 'Ligar ou desligar as animações de Halloween');
    toggleBtn.title = 'Animações de Halloween';
    toggleBtn.addEventListener('click', function () {
      api.toggle();
    });
    document.body.appendChild(toggleBtn);
  }

  // Sprite de texto (emoji ou kanji)
  function makeSprite(text, size) {
    var el = document.createElement('div');
    el.className = 'hw-sprite';
    el.style.fontSize = size + 'px';

    var inner = document.createElement('span');
    inner.textContent = text;
    if (KANJI.test(text)) inner.className = 'hw-kanji';
    el.appendChild(inner);

    layer.appendChild(el);
    return { el: el, inner: inner, cleanup: null };
  }

  // Sprite de chama (hitodama) com brilho tremulando
  function makeOrb(size) {
    var el = document.createElement('div');
    el.className = 'hw-sprite';

    var inner = document.createElement('span');
    inner.className = 'hw-orb';
    inner.style.width = size + 'px';
    inner.style.height = size * 1.2 + 'px';
    el.appendChild(inner);

    layer.appendChild(el);

    var flicker = inner.animate(
      [
        { opacity: 0.7, transform: 'scale(0.88)' },
        { opacity: 1, transform: 'scale(1.12)' }
      ],
      { duration: rand(200, 420), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    );

    return { el: el, inner: inner, cleanup: function () { flicker.cancel(); } };
  }


  /* ------------------------------------------------------------------------
     EFEITO: ITENS CAINDO (lanternas, folhas, máscaras, kanji)
     ------------------------------------------------------------------------ */

  function spawnFalling() {
    var cfg = CONFIG.falling;
    if (fallingCount >= cfg.max) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var size = randRange(cfg.size);

    var sprite = makeSprite(pick(cfg.items), size);
    var el = sprite.el;
    var startX = rand(0, vw - size);
    var drift = rand(-120, 120);
    var sway = rand(-40, 40);
    var rotation = rand(-300, 300);

    fallingCount++;

    var animation = el.animate(
      [
        { transform: 'translate(' + startX + 'px,-70px) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + (startX + drift * 0.15 + sway) + 'px,' + (vh * 0.1) + 'px) rotate(' + (rotation * 0.1) + 'deg)', opacity: 1, offset: 0.08 },
        { transform: 'translate(' + (startX + drift * 0.6 - sway) + 'px,' + (vh * 0.6) + 'px) rotate(' + (rotation * 0.6) + 'deg)', opacity: 1, offset: 0.6 },
        { transform: 'translate(' + (startX + drift) + 'px,' + (vh + 70) + 'px) rotate(' + rotation + 'deg)', opacity: 1 }
      ],
      { duration: randRange(cfg.duration), easing: 'linear' }
    );

    animation.onfinish = function () {
      fallingCount--;
      el.remove();
    };
  }


  /* ------------------------------------------------------------------------
     EFEITO: ATRAVESSAR A TELA EM ONDAS (hitodama e fantasma)
     ------------------------------------------------------------------------ */

  function flyAcross(sprite, duration, opacity) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var fromLeft = Math.random() < 0.5;
    var x0 = fromLeft ? -90 : vw + 90;
    var x1 = fromLeft ? vw + 90 : -90;
    var y0 = rand(vh * 0.08, vh * 0.6);
    var amplitude = rand(30, 90);
    var waves = rand(1.5, 3);
    var steps = 10;
    var frames = [];

    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var frame = {
        transform: 'translate(' + (x0 + (x1 - x0) * t) + 'px,' + (y0 + Math.sin(t * Math.PI * 2 * waves) * amplitude) + 'px)',
        offset: t
      };
      // aparece e some suavemente nas pontas
      frame.opacity = t < 0.1 ? opacity * (t / 0.1) : (t > 0.9 ? opacity * ((1 - t) / 0.1) : opacity);
      frames.push(frame);
    }

    var animation = sprite.el.animate(frames, { duration: duration, easing: 'linear' });
    animation.onfinish = function () {
      if (sprite.cleanup) sprite.cleanup();
      sprite.el.remove();
    };
  }

  function spawnSpirits() {
    var cfg = CONFIG.spirits;
    var total = Math.round(randRange(cfg.count));

    for (var i = 0; i < total; i++) {
      flyAcross(makeOrb(randRange(cfg.size)), randRange(cfg.duration), 0.95);
    }
  }

  function spawnGhost() {
    var cfg = CONFIG.ghost;
    flyAcross(makeSprite(pick(cfg.items), randRange(cfg.size)), randRange(cfg.duration), 0.45);
  }


  /* ------------------------------------------------------------------------
     EFEITO: EXPLOSÃO DE SÍMBOLOS AO CLICAR
     ------------------------------------------------------------------------ */

  function burst(x, y) {
    var cfg = CONFIG.clickBurst;

    for (var i = 0; i < cfg.count; i++) {
      var el = makeSprite(pick(cfg.items), rand(16, 26)).el;
      var angle = (Math.PI * 2 * i) / cfg.count + rand(-0.3, 0.3);
      var distance = rand(50, 110);
      var dx = Math.cos(angle) * distance;
      var dy = Math.sin(angle) * distance - 30; // leve tendência para cima

      var animation = el.animate(
        [
          { transform: 'translate(' + x + 'px,' + y + 'px) scale(0.4) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px) scale(1) rotate(' + rand(-180, 180) + 'deg)', opacity: 1, offset: 0.6 },
          { transform: 'translate(' + (x + dx) + 'px,' + (y + dy + 50) + 'px) scale(0.8) rotate(' + rand(-220, 220) + 'deg)', opacity: 0 }
        ],
        { duration: rand(700, 1000), easing: 'ease-out' }
      );

      animation.onfinish = (function (node) {
        return function () { node.remove(); };
      })(el);
    }
  }

  function onDocumentClick(event) {
    if (!enabled || !CONFIG.clickBurst.enabled) return;
    if (event.target.closest && event.target.closest('.hw-toggle')) return;
    burst(event.clientX, event.clientY);
  }


  /* ------------------------------------------------------------------------
     AGENDADOR: repete uma função em intervalos aleatórios
     ------------------------------------------------------------------------ */

  function schedule(fn, range, firstDelay) {
    function tick() {
      if (!enabled) return;
      if (!document.hidden) fn(); // não acumula animações com a aba em segundo plano
      timers.push(setTimeout(tick, randRange(range)));
    }
    timers.push(setTimeout(tick, firstDelay));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }


  /* ------------------------------------------------------------------------
     CONTROLE (ligar / desligar)
     ------------------------------------------------------------------------ */

  function start() {
    if (enabled) return;
    enabled = true;
    layer.hidden = false;
    toggleBtn.setAttribute('aria-pressed', 'true');

    if (CONFIG.falling.enabled) schedule(spawnFalling, CONFIG.falling.every, 300);
    if (CONFIG.spirits.enabled) schedule(spawnSpirits, CONFIG.spirits.every, 2500);
    if (CONFIG.ghost.enabled) schedule(spawnGhost, CONFIG.ghost.every, 9000);
  }

  function stop() {
    if (!enabled) return;
    enabled = false;
    clearTimers();
    fallingCount = 0;
    layer.hidden = true;
    toggleBtn.setAttribute('aria-pressed', 'false');

    // remove sprites em andamento (névoa e lanternas só ficam escondidas)
    var sprites = layer.querySelectorAll('.hw-sprite');
    for (var i = 0; i < sprites.length; i++) sprites[i].remove();
  }

  var api = {
    start: function () { start(); writeStorage('on'); },
    stop: function () { stop(); writeStorage('off'); },
    toggle: function () { if (enabled) api.stop(); else api.start(); },
    config: CONFIG
  };

  window.HalloweenFX = api;


  /* ------------------------------------------------------------------------
     INICIALIZAÇÃO
     ------------------------------------------------------------------------ */

  function init() {
    if (!canAnimate) return; // navegador muito antigo: não faz nada

    injectStyles();
    buildLayer();
    buildToggle();
    document.addEventListener('click', onDocumentClick);

    // Respeita a escolha salva; sem escolha, só liga se o usuário não pediu "menos movimento"
    var saved = readStorage();
    var shouldStart = saved ? saved === 'on' : !prefersReducedMotion;

    toggleBtn.setAttribute('aria-pressed', 'false');
    if (shouldStart) start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
