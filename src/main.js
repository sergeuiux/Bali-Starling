// Jalak — entry.

import './styles/main.css';

import { runPreloader } from './modules/preloader.js';
import { initSmoothScroll } from './modules/smoothScroll.js';
import { createFrameSequence } from './modules/frameSequence.js';
import { createStage } from './modules/stage.js';
import { splitText, initHeroReveal, initFadeReveal } from './modules/reveals.js';
import { initSoundToggle } from './modules/sound.js';
import { initCursor } from './modules/cursor.js';
import { initNavSplit, setNavTheme } from './modules/navSplit.js';
import { initRuler } from './modules/ruler.js';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

/* Секция 2: видео птички (прилёт) слева проматывается по скроллу,
   затем справа появляются факты. Заголовок — при входе в секцию. */
function initSectionTwo(allFrames, lenis) {
  const section = document.getElementById('section-two');
  const canvas  = document.getElementById('stageTwo');
  const factsEl = document.querySelector('[data-s2-facts]');
  const corners = section ? section.querySelector('.s2__corners') : null;
  const fade    = section ? section.querySelector('.s2__fade') : null;
  if (!section || !canvas) return;
  if (!allFrames) return;   // на мобилке кадры не грузятся — этой ветки быть не должно

  // Убираем первый кадр — у него отличается фон/экспозиция (мелькает на старте).
  const frames = allFrames.slice(1);

  // offsetX < 0 сдвигает окно кадра левее — птичка (она в правой части landscape-
  // кадра) встаёт в видимое пространство (по центру левой половины на десктопе,
  // в кадр видео-области на мобилке).
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const stage = createStage(canvas, frames, {
    fit: 'cover', scale: 1.0, offsetX: mobile ? -0.45 : -0.42,
  });
  stage.draw(0);

  const factRows = factsEl ? factsEl.querySelectorAll('.s2__fact') : [];
  gsap.set(factRows, { y: 30, opacity: 0 });

  // Шторки (clip). Стартово закрыты; раскрываются внутри pin-таймлайна (scrub),
  // а не по позиции секции — top при переходе pin s1→s2 скачет, из-за чего раньше
  // раскрытие было резким. В таймлайне scrub оно плавно следует прогрессу скролла.
  const clip = { r: 50 };
  const applyClip = () => {
    const c = `inset(${clip.r}% 0 ${clip.r}% 0)`;
    canvas.style.clipPath = c;
    if (corners) corners.style.clipPath = c;
    if (fade) fade.style.clipPath = c;
  };
  applyClip();

  // Факты появляются, как только секция полностью на экране (top top).
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    invalidateOnRefresh: true,
    onEnter: () => gsap.to(factRows, {
      y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', overwrite: true,
    }),
    onLeaveBack: () => gsap.to(factRows, {
      y: 30, opacity: 0, duration: 0.3, overwrite: true,
    }),
  });

  const head = section.querySelector('.s2__head');
  // Мобилка: заголовок и подзаголовок скрыты, пока шторки не раскроются.
  if (mobile && head) gsap.set(head, { autoAlpha: 0 });

  const state = { f: 0 };
  const last = frames.length - 1;

  // Единый pin-таймлайн: 0..40% — плавное раскрытие шторок, 40..100% — прилёт птички.
  const tl = gsap.timeline({
    scrollTrigger: {
      id: 's2pin',
      trigger: section,
      start: 'top top',
      end: '+=160%',
      pin: true,
      scrub: 0.6,          // выше = мягче/медленнее реакция
      invalidateOnRefresh: true,
      anticipatePin: 1,
      fastScrollEnd: true,
    },
  });
  tl.to(clip, { r: 0, duration: 0.40, ease: 'power2.inOut', onUpdate: applyClip }, 0);
  if (mobile && head) tl.to(head, { autoAlpha: 1, duration: 0.08 }, 0.40);
  tl.to(state, {
    f: last, duration: 0.60, ease: 'none',
    onUpdate: () => stage.draw(Math.round(state.f)),
  }, 0.40);

  // Клик по «Read the story» — плавный автоскролл к концу секции 2; scrub-анимации
  // (шторки, птичка, факты) проигрываются сами по пути.
  const pinST = tl.scrollTrigger;
  const readBtn = document.querySelector('.btn-read');
  if (readBtn && lenis && pinST) {
    readBtn.addEventListener('click', () => {
      lenis.scrollTo(pinST.end, {
        duration: 7.5,       // длиннее = медленнее и плавнее автоскролл
        lock: true,          // не прерывать автоскролл случайным вводом
        // easeInOutSine: почти постоянная скорость в середине (ближе к линейному),
        // мягкие старт и финиш — движение без рывков и без «прилипания» в конце.
        easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
      });
    });
  }
}

/* Секция 2 — мобильная версия (макет 372:2280). Без pin/scrub и без canvas:
   светлый фон, заголовок сверху, статичная картинка выезжает из шторки при входе
   в кадр, затем ниже проявляются факты. Заголовок/подзаголовок/значок Bali
   поднимают общие reveal'ы ([data-split] / [data-reveal]). */
function initSectionTwoMobile(lenis) {
  const section = document.getElementById('section-two');
  if (!section) return;
  const media = section.querySelector('.s2__media');
  const facts = [...section.querySelectorAll('.s2__fact')];

  // Кнопка «Read the story»: клик плавно скроллит к секции 2 (без роста/стрелки —
  // на мобилке кнопка статична).
  const readBtn = document.querySelector('.btn-read');
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(section, {
          duration: 1.6,
          easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
        });
      } else {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Картинка: шторка (clip-path) раскрывается, когда медиа входит в кадр.
  if (media) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => media.classList.toggle('is-revealed', e.isIntersecting));
    }, { threshold: 0.2 });
    io.observe(media);
  }

  // Факты: fade-up по одному при входе в кадр (реверсивно, как общие reveal'ы).
  if (facts.length) {
    const rest = { y: 26, opacity: 0, filter: 'blur(4px)' };
    facts.forEach((f) => gsap.set(f, rest));
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          gsap.to(e.target, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out', overwrite: true });
        } else {
          gsap.set(e.target, rest);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
    facts.forEach((f) => io2.observe(f));
  }
}

/* Секция 3 — мобильная версия (макеты 372:4641 / 7709 / 9355). Пинится на своём
   месте (без наезда на секцию 2). Сетка птичек в кружках-лунках: по скроллу птички
   гаснут вразнобой (кружки остаются), счётчик 309→6 / 1990→2001, 6 выживших в
   центральной колонке. В финале фон темнеет (#0E1219), выжившие белеют. */
function initSectionThreeMobile() {
  const section = document.getElementById('section-three');
  if (!section) return;
  const flock  = section.querySelector('[data-s3m-flock]');
  const bigEl  = section.querySelector('[data-s3m-big]');
  const yearEl = section.querySelector('[data-s3m-year]');
  const nav    = document.querySelector('.site-nav');
  if (!flock) return;

  const CELL = 20, STEP = 30, SURV = 6;   // кружок 20px, целевой шаг ~30px, 6 выживших

  // Сетка ЗАПОЛНЯЕТ контейнер .s3m__flock (flex:1) на ЛЮБОЙ ширине: число колонок/
  // рядов — по целевому шагу 30px, промежутки растягиваются так, что крайние ячейки
  // касаются краёв (макет 387:19876, шаг X = (W−20)/(cols−1)). Пересобирается на
  // resize/refresh — иначе сетка, построенная под стартовую ширину, не растянется.
  let cells = [], darkEls = [], lightEls = [];
  let lastP = 0;

  const build = () => {
    const rect = flock.getBoundingClientRect();
    const availW = Math.round(rect.width)  || (window.innerWidth - 40);
    const availH = Math.round(rect.height) || (window.innerHeight - 200);

    const cols = Math.max(2, Math.round(availW / STEP));
    const rows = Math.max(2, Math.round(availH / STEP));
    const stepX = (availW - CELL) / (cols - 1);
    const stepY = (availH - CELL) / (rows - 1);

    flock.innerHTML = '';
    cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 's3m__cell';
        cell.style.left = Math.round(c * stepX) + 'px';
        cell.style.top  = Math.round(r * stepY) + 'px';
        cell.innerHTML = `<img class="s3m__bird s3m__bird--dark" src="${import.meta.env.BASE_URL}bird.svg" alt="">`
                       + `<img class="s3m__bird s3m__bird--light" src="${import.meta.env.BASE_URL}bird-white.svg" alt="">`;
        flock.appendChild(cell);
        cells.push({ el: cell, r, c });
      }
    }
    darkEls  = cells.map((c) => c.el.querySelector('.s3m__bird--dark'));
    lightEls = cells.map((c) => c.el.querySelector('.s3m__bird--light'));

    // 6 выживших: центральная колонка, С САМОГО ВЕРХА (ряды 0..5, друг под другом).
    const midCol  = Math.floor(cols / 2);
    const survKey = new Set();
    for (let i = 0; i < SURV; i++) survKey.add(i * cols + midCol);
    cells.forEach((cell) => {
      cell.surv = survKey.has(cell.r * cols + cell.c);
      cell.th   = Math.random() * 0.60;   // индивидуальный порог гашения (фаза 0..0.7)
    });

    apply(lastP);   // восстановить текущее состояние анимации на новой сетке
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const C0 = { bg: '#F2F7FD', fg: '#10151C', line: 'rgba(16,21,28,0.12)', hole: 'rgba(16,21,28,0.06)' };
  const C1 = { bg: '#0E1219', fg: '#FFFFFF', line: 'rgba(255,255,255,0.14)', hole: 'rgba(255,255,255,0.08)' };

  const apply = (p) => {
    lastP = p;
    // Счётчик 309→6 / 1990→2001 (пока гаснут птички, p 0..0.7).
    const a = clamp01(p / 0.70);
    if (bigEl)  bigEl.textContent  = Math.round(lerp(309, 6, a));
    if (yearEl) yearEl.textContent = Math.round(lerp(1990, 2001, a));

    // Гашение не-выживших птичек (кружок остаётся); каждая по своему порогу.
    cells.forEach((cell, i) => {
      if (cell.surv) return;
      darkEls[i].style.opacity = String(1 - clamp01((p - cell.th) / 0.08));
    });

    // Финал (p 0.72..1): фон темнеет, выжившие тёмная→белая, лунки светлеют.
    const t = clamp01((p - 0.72) / 0.28);
    section.style.setProperty('--s3-bg',   gsap.utils.interpolate(C0.bg,   C1.bg,   t));
    section.style.setProperty('--s3-fg',   gsap.utils.interpolate(C0.fg,   C1.fg,   t));
    section.style.setProperty('--s3-line', gsap.utils.interpolate(C0.line, C1.line, t));
    section.style.setProperty('--s3m-hole', gsap.utils.interpolate(C0.hole, C1.hole, t));
    cells.forEach((cell, i) => {
      if (!cell.surv) return;
      darkEls[i].style.opacity  = String(1 - t);
      lightEls[i].style.opacity = String(t);
    });
    if (nav) setNavTheme(nav, t > 0.5 ? 'on-s3' : 'on-s3-light');
  };

  build();

  // Пересборка сетки под новую ширину/высоту (поворот экрана, resize).
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

  const m = { p: 0 };
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=200%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      onRefresh:   build,   // ScrollTrigger.refresh() (в т.ч. после resize) → пересобрать сетку
      onUpdate:    (self) => { if (nav) setNavTheme(nav, self.progress > 0.5 ? 'on-s3' : 'on-s3-light'); },
      onEnter:     () => { if (nav) setNavTheme(nav, 'on-s3-light'); },
      onEnterBack: () => { if (nav) setNavTheme(nav, 'on-s3-light'); },
    },
  }).to(m, { p: 1, duration: 1, ease: 'none', onUpdate: () => apply(m.p) }, 0);
}

/* Навигация по меню: плавный автоскролл (lenis) вместо нативных якорей.
   - About the Bird → к концу пина секции 2 (тот же кинематографичный эффект,
     что и кнопка «Read the story»);
   - Collapse → секция 3 (Only 309), Island → секция 5, Law → awig-awig (секция 6);
   - Numbers → к концу пина секции 8 (фаза Count «Just above 500»).
   Подсветка активного пункта — через классы .on-sX (CSS), ставятся секциями. */
function initNav(lenis) {
  if (!lenis) return;
  const links = document.querySelectorAll('[data-nav]');
  if (!links.length) return;
  // Тот же easing, что у «Read the story» (easeInOutSine — ровная середина).
  const easeStory = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const kind = a.dataset.nav;
      let target = null, duration = 2, lock = false;

      if (kind === 'about') {
        const st = ScrollTrigger.getById('s2pin');
        target = st ? st.end : '#section-two';
        duration = 7.5; lock = true;                 // как «Read the story»
      } else if (kind === 'numbers') {
        const st = ScrollTrigger.getById('s8pin');
        // чуть внутрь пина (не на самый край) — Count полностью показан, а тема
        // on-s9 ещё активна, поэтому пункт Numbers остаётся подсвеченным.
        target = st ? st.end - 100 : '#section-park';
        duration = 3;
      } else if (kind === 'collapse') {
        target = '#section-three';
      } else if (kind === 'island') {
        target = '#section-island';
      } else if (kind === 'law') {
        target = '#section-law';
      } else {
        target = a.getAttribute('href');
      }
      if (target == null) return;
      lenis.scrollTo(target, { duration, lock, easing: easeStory });
    });
  });
}

/* Бургер-меню (мобилка): открытие/закрытие оверлея. */
function initBurger() {
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!burger || !menu) return;

  const set = (open) => {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => set(!menu.classList.contains('is-open')));
  const closeBtn = menu.querySelector('[data-menu-close]');
  if (closeBtn) closeBtn.addEventListener('click', () => set(false));
  menu.querySelectorAll('.mobile-menu__nav a').forEach((a) =>
    a.addEventListener('click', () => set(false)));
}

/* Секция 3 — collapse. Наезжает поверх секции 2 (секция 2 держится подложкой).
   Пин на 200vh, вся анимация привязана к скроллу (scrub) и реверсивна — играет
   вперёд по скроллу вниз и отматывается вверх, без блокировки скролла.
   Фаза A: счётчик 309→6 / 1990→2021, бледные птички гаснут, 6 выживших съезжаются
   в вертикальную линию по центру. Фаза B: фон темнеет #0E1219, инверсия, птички
   растут и разлетаются вверх — промежутки растут, верхние улетают быстрее нижних,
   каждая вытягивается по вертикали (растяжка формы, как scaleX у букв awig). */
function initSectionThree() {
  const section = document.getElementById('section-three');
  if (!section) return;
  const flock   = section.querySelector('[data-s3-flock]');
  const bigEl   = section.querySelector('[data-s3-big]');
  const yearEl  = section.querySelector('[data-s3-year]');
  const nav     = document.querySelector('.site-nav');
  const twoEl   = document.getElementById('section-two');
  if (!flock) return;

  // --- Раскладка сетки ---
  const SIZE = 24, GAP = 10, STEP = SIZE + GAP;   // шаг 34px
  const LEFT = 100, TOP = 350;
  const SURV = 6;

  const vw = window.innerWidth, vh = window.innerHeight;
  const cols = Math.max(1, Math.floor((vw - LEFT - 100 + GAP) / STEP));
  const rows = Math.max(1, Math.floor((vh - TOP - 30) / STEP));

  // --- Генерация птичек ---
  flock.innerHTML = '';
  const birds = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const b = document.createElement('div');
      b.className = 's3__bird';
      b.style.left = (LEFT + c * STEP) + 'px';
      b.style.top  = (TOP + r * STEP) + 'px';
      b.innerHTML = `<img class="s3__bird-dark" src="${import.meta.env.BASE_URL}bird.svg" alt="">`;
      flock.appendChild(b);
      birds.push(b);
    }
  }

  // --- 6 «выживших» — случайно (Fisher–Yates) ---
  const order = birds.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const survSet = new Set(order.slice(0, SURV));
  const survivors = [], faders = [];
  birds.forEach((b, i) => {
    if (survSet.has(i)) {
      const light = document.createElement('img');   // белый слой для инверсии
      light.className = 's3__bird-light';
      light.src = `${import.meta.env.BASE_URL}bird-white.svg`;
      light.alt = '';
      b.appendChild(light);
      survivors.push(b);
    } else {
      faders.push(b);
    }
  });
  const darkEls  = survivors.map((b) => b.querySelector('.s3__bird-dark'));
  const lightEls = survivors.map((b) => b.querySelector('.s3__bird-light'));

  // Порядок выживших сверху вниз — для ровной линии.
  const lineOrder = survivors
    .map((b) => ({ b, y: parseFloat(b.style.top) }))
    .sort((a, z) => a.y - z.y)
    .map((o) => o.b);

  // Позиции вертикальной линии по центру экрана (мелкие, 24px).
  const lineX   = vw / 2 - SIZE / 2;
  const lineTop = vh * 0.5 - (SURV * STEP) / 2;   // столбец из 6 по центру по вертикали

  // ============ Единая scroll-анимация (scrub, реверсивная) ============
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Индивидуальный порог гашения для каждой «бледной» (случайно в первой части A).
  const faderTh = faders.map(() => Math.random() * 0.30);
  // Стартовые позиции выживших — для интерполяции сбора в линию.
  const survStart = survivors.map((b) => ({ left: parseFloat(b.style.left), top: parseFloat(b.style.top) }));
  const survIdx   = survivors.map((b) => lineOrder.indexOf(b));   // индекс в линии (0 = верх)

  // Разлёт вверх: нижняя (idx = SURV-1) уходит на FLY_BASE, каждая выше — на FLY_GAP
  // дальше → промежутки растут, верхние улетают быстрее. Без роста/растяжки формы.
  const FLY_BASE = vh * 0.4, FLY_GAP = vh * 0.16;

  // Тема секции: светлая (старт) → тёмная. Меню — тёмное на светлом, белое на тёмном.
  const C0 = { bg: '#F2F7FD', fg: '#10151C', line: 'rgba(16,21,28,0.12)' };
  const C1 = { bg: '#0E1219', fg: '#FFFFFF', line: 'rgba(255,255,255,0.14)' };
  const setS3Nav = (p) => {
    if (!nav) return;
    // Светлая (белая) плашка пока collapse светлый; когда фон затемняется — тёмная.
    setNavTheme(nav, p > 0.52 ? 'on-s3' : 'on-s3-light');
  };

  const applyAll = (p) => {
    // --- Счётчик (идёт, пока гаснут птички) ---
    const a = clamp01(p / 0.34);
    if (bigEl)  bigEl.textContent  = Math.round(lerp(309, 6, a));
    if (yearEl) yearEl.textContent = Math.round(lerp(1990, 2021, a));

    // --- Гашение бледных птичек (каждая по своему порогу; завершается к ~0.36) ---
    faders.forEach((b, i) => {
      b.style.opacity = String(1 - clamp01((p - faderTh[i]) / 0.06));
    });

    // --- Сбор выживших в линию — ТОЛЬКО после того как все бледные погасли (0.38…0.54) ---
    const c = clamp01((p - 0.38) / 0.16);
    survivors.forEach((b, i) => {
      b.style.left = lerp(survStart[i].left, lineX, c) + 'px';
      b.style.top  = lerp(survStart[i].top,  lineTop + survIdx[i] * STEP, c) + 'px';
    });

    // --- Тема: фон темнеет, инверсия тёмная→белая птица (0.54…0.66) ---
    const t = clamp01((p - 0.54) / 0.12);
    section.style.setProperty('--s3-bg',   gsap.utils.interpolate(C0.bg,   C1.bg,   t));
    section.style.setProperty('--s3-fg',   gsap.utils.interpolate(C0.fg,   C1.fg,   t));
    section.style.setProperty('--s3-line', gsap.utils.interpolate(C0.line, C1.line, t));
    darkEls.forEach((el)  => { el.style.opacity = String(1 - t); });
    lightEls.forEach((el) => { el.style.opacity = String(t); });

    // --- Улёт вверх (0.72…1): птички уезжают вверх БЕЗ роста и растяжки —
    //     размер неизменный (24px). Верхние уходят дальше (лёгкий стаггер);
    //     секция уезжает вверх, снизу наезжает s4. ---
    const fly = clamp01((p - 0.72) / 0.28);
    survivors.forEach((b, i) => {
      const idx  = survIdx[i];                              // 0 = верх
      const dist = FLY_BASE + (SURV - 1 - idx) * FLY_GAP;   // верхние — дальше
      b.style.transform = `translateY(${-dist * fly}px)`;
    });
  };

  applyAll(0);
  if (import.meta.env.DEV) window.__s3 = { applyAll };

  const m = { p: 0 };
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=200%',
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      // Тема меню — только пока секция 3 активна (иначе класс залипает на s1/s2).
      onUpdate:    (self) => setS3Nav(self.progress),
      onEnter:     (self) => setS3Nav(self.progress),
      onEnterBack: (self) => setS3Nav(self.progress),
      // Тему НЕ снимаем при выходе — соседняя секция перезапишет её при входе
      // (иначе между секциями появляется «дыра» без заливки).
    },
  }).to(m, { p: 1, duration: 1, ease: 'none', onUpdate: () => applyAll(m.p) }, 0);

  // ============ Наезд секции 3 поверх секции 2 (секция 2 держится подложкой) ============
  // Пока секция 3 едет снизу к верху, фиксируем секцию 2 классом .s2--hold
  // (position:fixed). Её GSAP-спейсер от видео-пина сохраняет высоту — раскладка не
  // прыгает; секция 3 (z-index выше) наезжает поверх зафиксированной секции 2.
  if (twoEl) {
    const hold = (on) => twoEl.classList.toggle('s2--hold', on);
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'top top',
      invalidateOnRefresh: true,
      onEnter:     () => hold(true),
      onEnterBack: () => hold(true),
      onLeave:     () => hold(false),
      onLeaveBack: () => hold(false),
    });
  }
}

/* Секция 4 — «Six known wild birds». Блок цитаты (.s4__col — текст + вертикальная
   линия border-left) едет по скроллу чуть быстрее самой секции: лёгкий параллакс.
   y от +70 (когда секция входит снизу) до -70 (когда уходит вверх) — за проход блок
   смещается на 140px больше секции, поэтому «обгоняет» её. */
function initSectionFour() {
  const section = document.getElementById('section-four');
  if (!section) return;
  const col = section.querySelector('.s4__col');
  if (!col) return;

  // Параллакс блока цитаты — только десктоп. На мобилке всё в обычном потоке.
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  if (!mobile) {
    gsap.fromTo(col, { y: 220 }, {
      y: -220,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }

  // Nav — светлая тема (заливка), активен «Collapse» пока секция 4 в зоне видимости.
  const nav = document.getElementById('siteNav');
  ScrollTrigger.create({
    trigger: section, start: 'top 90%', end: 'bottom 10%',
    onToggle: (self) => {
      // Тёмная плашка (пункт Collapse оранжевый). При выходе не снимаем — соседняя
      // секция перезапишет тему при входе.
      if (self.isActive) setNavTheme(nav, 'on-s4');
    },
  });
}

/* Секция 5 — Island split (макет 293:1739). Пинится; заголовок на 160px.
   Слева фрейм карты, справа текст. По скроллу карта увеличивается и едет вверх;
   путь приякорен к карте (внутри её SVG), рисуется и по нему бежит точка Бали→Нуса.
   Подписи Bali/Nusa статичны во фрейме. В конце проявляется «And all the villages
   agreed to help». */
function initSectionFive() {
  const section = document.getElementById('section-island');
  if (!section) return;
  const frame  = section.querySelector('.s5__frame');
  const map    = section.querySelector('[data-s5-map]');
  const route  = section.querySelector('[data-s5-route]');
  const trail  = section.querySelector('[data-s5-trail]');
  const solid  = section.querySelector('[data-s5-trail-solid]');
  const clip   = section.querySelector('[data-s5-clip]');
  const marker = section.querySelector('[data-s5-marker]');
  const result = section.querySelector('[data-s5-result]');
  const nav    = document.querySelector('.site-nav');
  if (!map || !route || !frame) return;

  // Размер/позиция слоя карты — из макета, относительно ширины фрейма
  // (map2: 1162×720 при фрейме 700; старт -597/-281). Масштаб карты ∝ ширине фрейма.
  const MW = 1162 / 700, MH = 720 / 700, ML = 597 / 700, MT = 281 / 700;
  const sizeMap = () => {
    const fw = frame.clientWidth;
    map.style.width  = (fw * MW) + 'px';
    map.style.height = (fw * MH) + 'px';
    map.style.left   = (-fw * ML) + 'px';
    map.style.top    = (-fw * MT) + 'px';
  };
  sizeMap();

  // Движение карты по скроллу: transform (translate px + scale). Старт = кадр 5-4
  // (identity). Финиш = кадр 5-5 из макета (карта 1575.7 при 1162 → z≈1.356).
  const camEnd = { tx: -190, ty: -110, z: 1.25 };
  const cam = { tx: 0, ty: 0, z: 1 };
  const applyCam = () => {
    map.style.transform = `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.z})`;
  };
  applyCam();

  // Путь. Маркер проходит весь маршрут до СЗ Нуса-Пениды. Оранжевый след раскрываем
  // clip-прямоугольником до X текущей точки (путь монотонен по X).
  const len = route.getTotalLength();
  const place = (frac) => {
    const pt = route.getPointAtLength(len * Math.max(0, Math.min(1, frac)));
    marker.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    if (clip) clip.setAttribute('width', String(pt.x));
  };

  // Стартовые состояния: белый пунктир маршрута и точка старта видны сразу;
  // оранжевый след скрыт (clip width 0) и раскрывается; сплошной оранжевый и итог скрыты.
  gsap.set(result, { autoAlpha: 0, y: 12 });
  gsap.set(solid, { autoAlpha: 0 });
  place(0);

  const t = { p: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=233%',              /* короче в 1.5× (было 350%) */
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      onRefreshInit: sizeMap,          // пересчёт размера карты при ресайзе/refresh
      onToggle: (self) => {
        // Тёмная плашка (пункт Island оранжевый). При выходе не снимаем.
        if (self.isActive) setNavTheme(nav, 'on-s5');
      },
    },
  });

  // Карта увеличивается и едет вверх весь скролл (равномерно).
  tl.to(cam, { tx: camEnd.tx, ty: camEnd.ty, z: camEnd.z, duration: 1, ease: 'none', onUpdate: applyCam }, 0);

  // Путь рисуется (clip) и маркер бежит от старта до Нуса-Пениды — весь скролл.
  tl.to(t, {
    p: 1, duration: 0.86, ease: 'none',
    onUpdate: () => place(t.p),
  }, 0.04);

  // Финал: оранжевый след «закрашивается» (сплошной) + «And all the villages…».
  tl.to(solid,  { autoAlpha: 1, duration: 0.08, ease: 'power2.out' }, 0.9);
  tl.to(result, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.9);

  // Отладка калибровки камеры (только в dev): window.__s5cam({tx,ty,z}).
  if (import.meta.env.DEV) {
    window.__s5cam = (o) => { Object.assign(cam, o); applyCam(); };
    window.__s5path = (d) => { route.setAttribute('d', d); trail.setAttribute('d', d); };
  }
}

/* Секция 5 — мобильная версия (макет 372:13593). Пинится. Компактная карта
   (кроп map.webp): по скроллу оранжевый след рисуется вдоль белого маршрута и по
   нему бежит точка Bali→Nusa Penida; в финале проявляется «And all the villages
   agreed to help». Без зума карты — она статична, как в макете. */
function initSectionFiveMobile() {
  const section = document.getElementById('section-island');
  if (!section) return;
  const route  = section.querySelector('[data-s5m-route]');
  const clip   = section.querySelector('[data-s5m-clip]');
  const marker = section.querySelector('[data-s5m-marker]');
  const result = section.querySelector('[data-s5m-result]');
  const nav    = document.querySelector('.site-nav');
  if (!route || !marker) return;

  const len = route.getTotalLength();
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const place = (frac) => {
    const pt = route.getPointAtLength(len * clamp01(frac));
    marker.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    if (clip) clip.setAttribute('width', String(pt.x));
  };

  gsap.set(result, { autoAlpha: 0, y: 12 });
  place(0);

  const t = { p: 0 };
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      onToggle: (self) => { if (self.isActive) setNavTheme(nav, 'on-s5'); },
    },
  })
    .to(t, { p: 1, duration: 0.85, ease: 'none', onUpdate: () => place(t.p) }, 0)
    .to(result, { autoAlpha: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.86);
}

/* Секция 6 — Awig-awig (макет 189:10764). Пинится. Фон тёмный→светлый; два слова AWIG
   сходятся к центру; центральная карточка растёт и кроссфейдит 5 фото; белые слова
   поверх картинки обрезаются по её прямоугольнику; внизу проявляется абзац. */
function initSectionSix() {
  const s = document.getElementById('section-law');
  if (!s) return;
  const card    = s.querySelector('[data-s6-card]');
  const photos  = Array.from(s.querySelectorAll('[data-s6-photo]'));
  const wl  = s.querySelector('[data-s6-wl]'),  wr  = s.querySelector('[data-s6-wr]');
  const wl2 = s.querySelector('[data-s6-wl2]'), wr2 = s.querySelector('[data-s6-wr2]');
  const lightLayer = s.querySelector('[data-s6-words-light]');
  const caption = s.querySelector('[data-s6-caption]');
  const nav = document.querySelector('.site-nav');
  if (!card || !lightLayer) return;

  // Финальный размер карточки и зазор слов: на мобилке — под ширину экрана
  // (стартовый размер карточки 95×80 общий, механика та же, что на десктопе).
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const ENDW = mobile ? Math.min(window.innerWidth - 40, 340) : 590;
  const ENDH = mobile ? Math.round(ENDW * 420 / 590) : 420;
  const GAP  = mobile ? 20 : 30;   // GAP — зазор между словами AWIG в финале
  const C0 = { bg: '#0E1219', word: '#ffffff', line: 'rgba(255,255,255,0.14)' };
  const C1 = { bg: '#F2F7FD', word: '#10151C', line: 'rgba(16,21,28,0.12)' };

  // Фото сменяются быстро и зациклено. Все кадры непрозрачны, текущий выводится наверх
  // по z-index (жёсткая смена) — без пустых кадров и без зависимости от rAF/видимости.
  let photoTimer = null, pi = 0, zc = 1;
  const startCycle = () => {
    if (photoTimer) return;
    photos.forEach((el) => { el.style.opacity = 1; el.style.zIndex = 0; });
    photos[0].style.zIndex = zc;            // старт с первого кадра сверху
    photoTimer = setInterval(() => {
      pi = (pi + 1) % photos.length;
      photos[pi].style.zIndex = ++zc;       // текущий — поверх всех
    }, 300);
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const setClip = () => {
    const cr = card.getBoundingClientRect(), lr = lightLayer.getBoundingClientRect();
    lightLayer.style.clipPath =
      `inset(${cr.top - lr.top}px ${lr.right - cr.right}px ${lr.bottom - cr.bottom}px ${cr.left - lr.left}px round 8px)`;
  };
  // Схождение слов AWIG к центру. Сдвиг вычисляется динамически: в финале внутренние
  // края слов встают в GAP/2 от центра экрана (зазор между словами = GAP).
  let shiftL = 0, shiftR = 0, lastP = 0;
  const setConverge = (cp) => {
    // Пульс растяжения: scaleX 1 → 1.35 → 1 за проход (пик в середине). Слова тянутся
    // в сторону движения (transform-origin left/right в CSS) — буквы «рассоединяются»,
    // как в Bali Starling / на bymonolog. scaleX идёт вторым в списке (применяется
    // первым), поэтому translateX в px не масштабируется.
    const c = Math.max(0, Math.min(1, cp));
    const sx = 1 + 0.35 * Math.sin(c * Math.PI);
    const txL = `translateX(${shiftL * cp}px) scaleX(${sx})`;
    const txR = `translateX(${shiftR * cp}px) scaleX(${sx})`;
    wl.style.transform = txL; wl2.style.transform = txL;
    wr.style.transform = txR; wr2.style.transform = txR;
  };
  const measure = () => {
    wl.style.transform = 'none'; wr.style.transform = 'none';
    const cx = window.innerWidth / 2;
    shiftL = (cx - GAP / 2) - wl.getBoundingClientRect().right;
    shiftR = (cx + GAP / 2) - wr.getBoundingClientRect().left;
    setConverge(lastP);   // вернуть актуальное положение (симметрично всем словам)
  };

  // Пиновый обработчик: схождение слов, тема, рост карточки, clip, абзац.
  // Слова сходятся непрерывно в течение всего пина (начинают двигаться, только когда
  // секция залипла на весь экран, и движутся, пока идёт скролл).
  const applyAll = (p) => {
    lastP = p;
    setConverge(p);
    const t = clamp01(p / 0.35);
    s.style.setProperty('--s6-bg',   gsap.utils.interpolate(C0.bg,   C1.bg,   t));
    s.style.setProperty('--s6-word', gsap.utils.interpolate(C0.word, C1.word, t));
    s.style.setProperty('--s6-line', gsap.utils.interpolate(C0.line, C1.line, t));
    card.style.width  = (95 + (ENDW - 95) * p) + 'px';
    card.style.height = (80 + (ENDH - 80) * p) + 'px';
    setClip();
    caption.style.opacity = clamp01((p - 0.22) / 0.12);
  };
  const setNav = (pr) => {
    // Тёмная плашка пока awig-awig тёмный; когда фон светлеет — светлая (белая).
    setNavTheme(nav, pr > 0.3 ? 'on-s6-light' : 'on-s6');
  };

  measure();
  applyAll(0);
  startCycle();   // фото крутятся зациклено всегда (5 картинок — ресурсы мизерные)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (import.meta.env.DEV) window.__s6 = { measure, setConverge, applyAll, getShift: () => ({ shiftL, shiftR, lastP }) };

  const m = { p: 0 };
  if (mobile) {
    // Мобилка: без пина. Сцена — блок высотой с карточку на пике (ENDH), чтобы абзац
    // (в потоке под сценой, 30px) оказался в 30px под карточкой. Анимация роста карточки
    // и схождения слов идёт по скроллу входа: старт — когда сцена поднялась на 20% экрана
    // (top 80%), пик — когда её центр дошёл до центра экрана.
    const stage = s.querySelector('[data-s6-stage]');
    if (stage) stage.style.height = ENDH + 'px';
    const measureMobile = () => { if (stage) stage.style.height = ENDH + 'px'; measure(); };
    gsap.timeline({
      scrollTrigger: {
        trigger: stage || s, start: 'top 80%', end: 'center center', scrub: 0.6,
        invalidateOnRefresh: true, onRefresh: measureMobile,
        onUpdate: (self) => setNav(self.progress),
      },
    }).to(m, { p: 1, duration: 1, ease: 'none', onUpdate: () => applyAll(m.p) }, 0);
    return;
  }
  gsap.timeline({
    scrollTrigger: {
      trigger: s, start: 'top top', end: '+=160%', pin: true, scrub: 0.8,
      invalidateOnRefresh: true, anticipatePin: 1, fastScrollEnd: true,
      onRefresh: measure,
      onUpdate: (self) => setNav(self.progress),
      // Тему не снимаем при выходе — соседняя секция перезапишет при входе.
    },
  }).to(m, { p: 1, duration: 1, ease: 'none', onUpdate: () => applyAll(m.p) }, 0);
}

/* Секция 7: бенто-грид. Фото по скроллу едут ВВЕРХ внутри своих фреймов
   (parallax): старт — верх снимка у верха фрейма, к выходу секции открывается
   низ снимка. Фрейм с overflow:hidden, уголки статичны. Без пина. */
/* Секция «Community / What happens if you break the law».
   Полоски (рост в стороны + чёрная заливка, инверсия текста) — чистый CSS :hover.
   Здесь: nav-тема (светлая) + параллакс правого фото (по скроллу едет вверх). */
function initBreakLaw() {
  const s = document.getElementById('section-breaklaw');
  if (!s) return;
  const nav = document.getElementById('siteNav');

  // Nav — светлая тема (переиспользуем on-s7), пока секция в зоне видимости.
  ScrollTrigger.create({
    trigger: s, start: 'top 90%', end: 'bottom 10%',
    onToggle: (self) => {
      // Светлая (белая) плашка. При выходе не снимаем.
      if (self.isActive) setNavTheme(nav, 'on-s7');
    },
  });

  // Мобилка: простой вертикальный поток (заголовок → пункты → фото), без
  // абсолютной раскладки, параллакса и видео у курсора — их делает только десктоп.
  if (window.matchMedia('(max-width: 768px)').matches) return;

  const photo = s.querySelector('[data-sbl-photo]');
  const rowsEl = s.querySelector('[data-sbl-rows]');
  const mediaEl = s.querySelector('.sbl__media');
  const vlineEl = s.querySelector('.sbl__vline');
  const kickerEl = s.querySelector('.sbl__kicker');

  // Пункты прижаты к низу. Верх фото и центральной линии подгоняем под верх блока
  // пунктов (фото ровно по их высоте), а подпись ставим на 20px над пунктами.
  const syncMedia = () => {
    const top = rowsEl.offsetTop;      // верх первого пункта
    if (mediaEl) mediaEl.style.top = top + 'px';
    if (vlineEl) vlineEl.style.top = top + 'px';
    if (kickerEl) kickerEl.style.top = (top - 20 - kickerEl.offsetHeight) + 'px';
  };
  syncMedia();
  ScrollTrigger.addEventListener('refreshInit', syncMedia);
  window.addEventListener('resize', syncMedia);

  // Параллакс фото: фрейм с overflow:hidden, фото выше фрейма и едет вверх по скроллу.
  // Ход ограничен MAX_SHIFT (умеренный параллакс).
  if (photo) {
    const MAX_SHIFT = 380;
    let shift = 0;
    const measure = () => {
      const frameH = photo.parentElement.clientHeight;
      shift = Math.min(Math.max(0, photo.offsetHeight - frameH), MAX_SHIFT);
    };
    const place = (p) => { photo.style.transform = `translate3d(0, ${-shift * p}px, 0)`; };

    measure();
    place(0);

    gsap.to({ p: 0 }, {
      p: 1, ease: 'none',
      onUpdate() { place(this.targets()[0].p); },
      scrollTrigger: {
        trigger: s, start: 'top bottom', end: 'bottom top', scrub: 0.6,
        invalidateOnRefresh: true, onRefresh: measure,
      },
    });
  }

  // Видео у курсора — только для настоящей мыши.
  const vidWrap = s.querySelector('[data-sbl-video]');
  const rows = Array.from(s.querySelectorAll('[data-sbl-row]'));
  if (!vidWrap || !window.matchMedia('(pointer: fine)').matches) return;
  const vids = Array.from(vidWrap.querySelectorAll('.sbl__cv'));

  const VH = 140;        // высота видео-фрейма
  const OFF_X = 24;      // видео правее курсора на 24px, центр по вертикали — на курсоре
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;   // курсор
  let vx = mx, vy = my;                                          // текущая позиция фрейма (lerp)
  let active = -1;                                               // индекс наведённой строки
  let raf = null;

  const target = () => ({ x: mx + OFF_X, y: my - VH / 2 });
  const loop = () => {
    const t = target();
    vx += (t.x - vx) * 0.15;
    vy += (t.y - vy) * 0.15;
    vidWrap.style.transform = `translate3d(${vx}px, ${vy}px, 0)`;
    raf = requestAnimationFrame(loop);
  };

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  rows.forEach((row, i) => {
    row.addEventListener('mouseenter', () => {
      active = i;
      // Первый показ — телепорт фрейма к курсору, чтобы не прилетал издалека.
      if (!vidWrap.classList.contains('is-on')) {
        const t = target(); vx = t.x; vy = t.y;
        vidWrap.style.transform = `translate3d(${vx}px, ${vy}px, 0)`;
      }
      vids.forEach((v, k) => {
        if (k === i) { v.classList.add('is-on'); const p = v.play(); if (p) p.catch(() => {}); }
        else { v.classList.remove('is-on'); v.pause(); }
      });
      vidWrap.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    });
    row.addEventListener('mouseleave', () => {
      if (active === i) active = -1;
      // Скрываем только если ушли со всех строк (переход между соседними строками
      // сначала шлёт leave старой, затем enter новой — active успевает обновиться).
      setTimeout(() => {
        if (active !== -1) return;
        vidWrap.classList.remove('is-on');
        vids.forEach((v) => { v.classList.remove('is-on'); v.pause(); });
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      }, 30);
    });
  });
}

/* Секция 8+9: объединённый пиновый морф-переход.
   Секция 8 (National Park, LAW): слева видео, справа тексты + BEFORE/AFTER.
   По скроллу контент 8 уезжает parallax; левое видео едет вправо-вверх и ужимается
   в верх-левую ячейку грида 2×2; проявляются 3 остальных видео и текст секции 9
   (Count). Nav: LAW → COUNT. */
function initSectionEight() {
  const s = document.getElementById('section-park');
  if (!s) return;
  const nav     = document.getElementById('siteNav');
  const stage8  = s.querySelector('[data-s8-stage]');
  const stage9  = s.querySelector('[data-s9-stage]');
  const morph   = s.querySelector('[data-morph]');
  const corners = s.querySelector('[data-morph-corners]');
  const slot    = s.querySelector('[data-s9-slot]');
  const cells   = Array.from(s.querySelectorAll('[data-s9-cell]'));
  const vids    = Array.from(s.querySelectorAll('video'));
  if (!morph || !slot) return;

  const playAllVids = () => vids.forEach((v) => { const pr = v.play(); if (pr) pr.catch(() => {}); });

  // Мобилка: простой поток — National Park (текст + BEFORE/AFTER), ниже Count
  // (заголовок + сетка 2×2 видео). Без морфа и пина: видео grid-1 переносим из
  // морф-контейнера в пустую ячейку сетки; все 4 видео просто крутятся.
  if (window.matchMedia('(max-width: 768px)').matches) {
    const morphVid = morph.querySelector('video');
    if (morphVid && slot) { morphVid.classList.add('s9__video'); slot.appendChild(morphVid); }
    playAllVids();
    ScrollTrigger.create({
      trigger: stage8, start: 'top 70%', end: 'bottom 30%',
      onToggle: (self) => { if (self.isActive) setNavTheme(nav, 'on-s8'); },
    });
    ScrollTrigger.create({
      trigger: stage9, start: 'top 70%', end: 'bottom 30%',
      onToggle: (self) => { if (self.isActive) setNavTheme(nav, 'on-s9'); },
    });
    return;
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // start — фрейм видео в секции 8 (лево); end — верх-левая ячейка грида. Обе
  // геометрии в координатах секции (независимо от позиции скролла).
  let start = {}, end = {};
  const measure = () => {
    const secR = s.getBoundingClientRect();
    start = { left: 20, top: 343, width: secR.width * 0.5 - 20, height: secR.height - 363 };
    const slotR = slot.getBoundingClientRect();
    end = {
      left: slotR.left - secR.left, top: slotR.top - secR.top,
      width: slotR.width, height: slotR.height,
    };
  };

  const apply = (p) => {
    // морф-видео: движется в первые ~60% скролла
    const q = easeInOut(clamp01(p / 0.6));
    morph.style.left   = lerp(start.left, end.left, q) + 'px';
    morph.style.top    = lerp(start.top, end.top, q) + 'px';
    morph.style.width  = lerp(start.width, end.width, q) + 'px';
    morph.style.height = lerp(start.height, end.height, q) + 'px';
    if (corners) corners.style.opacity = 1 - clamp01(p / 0.5);
    // стейдж 8 — уезжает вверх и гаснет
    const secH = s.getBoundingClientRect().height || window.innerHeight;
    stage8.style.transform = `translateY(${-0.55 * secH * clamp01(p / 0.55)}px)`;
    stage8.style.opacity = 1 - clamp01(p / 0.45);
    // стейдж 9 (текст Count) — проявляется
    stage9.style.opacity = clamp01((p - 0.28) / 0.35);
    // ячейки грида v4/v3/v2 — проявляются со стаггером
    cells.forEach((c, i) => {
      const t = clamp01((p - (0.35 + i * 0.08)) / 0.22);
      c.style.opacity = t;
      c.style.transform = `scale(${lerp(0.94, 1, t)})`;
    });
  };

  const setNav = (p) => {
    // Обе фазы — светлая (белая) плашка; отличается только активный пункт
    // (National Park → Law, Count → Numbers).
    setNavTheme(nav, p >= 0.5 ? 'on-s9' : 'on-s8');
  };

  const playAll = () => vids.forEach((v) => { const pr = v.play(); if (pr) pr.catch(() => {}); });

  measure();
  apply(0);
  playAll();   // видео крутятся зациклено (autoplay muted); постер — на случай не загрузки

  const m = { p: 0 };
  gsap.timeline({
    scrollTrigger: {
      id: 's8pin',
      trigger: s, start: 'top top', end: '+=150%', pin: true, scrub: 0.8,
      invalidateOnRefresh: true, anticipatePin: 1, fastScrollEnd: true,
      onRefresh: measure,
      onUpdate: (self) => setNav(self.progress),
      onEnter: playAll, onEnterBack: playAll,
      // Тему не снимаем при выходе: на футере остаётся светлая плашка (on-s9),
      // что и нужно — «далее всегда белое».
    },
  }).to(m, { p: 1, duration: 1, ease: 'none', onUpdate: () => apply(m.p) }, 0);

  if (import.meta.env.DEV) window.__s8 = { apply, measure, start: () => start, end: () => end };
}

const app = {
  init() {
    const root = document.body;

    splitText(root);
    const lenis = initSmoothScroll();
    if (import.meta.env.DEV) { window.__lenis = lenis; window.__ST = ScrollTrigger; }
    initCursor();
    initRuler();
    initSoundToggle();
    initNavSplit();
    initBurger();
    initNav(lenis);

    runPreloader({
      onDone: (seq1, seq2Promise) => {
        // Секция 1: полноэкранное видео, птичка улетает по скроллу (pin + scrub).
        // На мобилке кадры не грузятся (preloader вернул seq1 === null) — показываем
        // статичную картинку (.s1__poster), canvas и pin не инициализируем.
        // Признак мобилки берём из решения preloader (единый источник — иначе
        // повторный matchMedia может разойтись с ним и уронить десктопный путь).
        const mobile = !seq1;
        if (!mobile) {
          createFrameSequence({
            canvas: document.getElementById('stageOne'),
            frames: seq1,
            trigger: document.getElementById('section-one'),
            start: 'top top',
            end: '+=200%',
            pin: true,
            stageOptions: { offsetX: 0 },
          });
        }

        // Reveal заголовков и нижнего блока.
        initHeroReveal(root);
        initFadeReveal(root);

        // Блюр секции 1, когда секция 2 видна больше чем на 50%.
        // (S2→S3 без блюра — секция 3 наезжает поверх секции 2.)
        // Только десктоп: на мобилке секция 2 идёт обычным потоком под секцией 1.
        if (!mobile) {
          const s1El = document.getElementById('section-one');
          const s2El = document.getElementById('section-two');
          if (s1El && s2El) {
            const io = new IntersectionObserver(
              (entries) => {
                entries.forEach((e) => {
                  if (e.intersectionRatio >= 0.5) s1El.classList.add('is-blurred');
                  else s1El.classList.remove('is-blurred');
                });
              },
              { threshold: [0, 0.25, 0.5, 0.75, 1] }
            );
            io.observe(s2El);
          }
        }

        seq2Promise.then((seq2) => {
          // Мобилка: лёгкая версия секции 2 (картинка из шторки + текст),
          // без pin/scrub и без canvas. Десктоп: полная покадровая версия.
          if (mobile) initSectionTwoMobile(lenis);
          else initSectionTwo(seq2, lenis);
          // Секция 3: на мобилке своя версия (без наезда на секцию 2).
          if (mobile) initSectionThreeMobile();
          else initSectionThree(lenis);
          initSectionFour();
          // Секция 5: на мобилке — компактная карта с анимацией пути.
          if (mobile) initSectionFiveMobile();
          else initSectionFive();
          initSectionSix();
          initBreakLaw();
          initSectionEight();
          ScrollTrigger.refresh();
        });
      },
    });
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
