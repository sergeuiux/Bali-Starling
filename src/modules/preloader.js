// preloader.js — предзагрузка кадров первой секции и анимированный прелоадер.
//
// Десктоп: окно-картинка по центру, счётчик 1→99, картинки сменяются шторкой
// (clip-path) на порогах из макета. На 99 — когда кадры hero готовы — окно
// расширяется во весь экран, а кадр frame_0001 переезжает в hero-позицию
// (птица уходит вправо) и бесшовно сменяется canvas-анимацией.
// Мобилка: кадры не грузим, прелоадер просто тёмный и быстро гаснет.

import { gsap } from 'gsap';
import { currentSize } from './breakpoint.js';

const FRAMES_ROOT = `${import.meta.env.BASE_URL}frames`;

// Пороги счётчика, на которых активируется слой i (0..5). Из макета Figma:
// карт.1 до 14, карт.2 до 32, карт.3 до 54, карт.4 до 75, карт.5 до 85,
// hero-кадр с 86 до 99.
const LAYER_AT = [0, 14, 32, 54, 75, 86];

/**
 * Грузит последовательность кадров вида /frames/{name}/{size}/frame_%04d.webp.
 * Возвращает массив HTMLImageElement (в порядке индексов, начиная с 0 = frame_0001).
 * onProgress(0..1) — вызывается по мере загрузки.
 */
export function loadSequence(name, size, count, onProgress) {
  const images = new Array(count);
  let loaded = 0;
  const promises = [];

  for (let i = 0; i < count; i++) {
    const idx = String(i + 1).padStart(4, '0');
    const src = `${FRAMES_ROOT}/${name}/${size}/frame_${idx}.webp`;
    const img = new Image();
    img.decoding = 'async';
    const p = new Promise((resolve) => {
      img.onload = () => {
        loaded++;
        if (onProgress) onProgress(loaded / count);
        resolve(img);
      };
      img.onerror = () => {
        loaded++;
        if (onProgress) onProgress(loaded / count);
        resolve(img); // мягкая ошибка — не рушим цепочку
      };
    });
    img.src = src;
    images[i] = img;
    promises.push(p);
  }

  return Promise.all(promises).then(() => images);
}

export async function runPreloader({ onDone } = {}) {
  const overlay = document.getElementById('preloader');
  const size = currentSize();
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  // --- Мобилка: кадры не грузим (экономия ~5 MB / 160 запросов). Быстрый уход. ---
  if (mobile) {
    await new Promise((r) => setTimeout(r, 300));
    overlay?.classList.add('is-hidden');
    if (onDone) onDone(null, Promise.resolve(null), size);
    return;
  }

  // --- Десктоп: анимированный прелоадер ---
  const win = document.getElementById('plWindow');
  const countEl = document.getElementById('plCount');
  const heroLayer = document.getElementById('plHeroLayer');
  const layers = Array.from(document.querySelectorAll('.pl__layer'));

  // hero-слой — первый кадр hero (тот же файл, что в canvas → бесшовный морф).
  if (heroLayer) {
    heroLayer.style.backgroundImage = `url('${FRAMES_ROOT}/s1/${size}/frame_0001.webp')`;
  }

  // Грузим кадры: s1 ждём, s2 — в фоне.
  const seq1Promise = loadSequence('s1', size, 58, null);
  const seq2Promise = loadSequence('s2', size, 72, null);

  // Счётчик 1→99 + смена картинок шторкой на порогах.
  let activeLayer = 0;
  const counterObj = { v: 1 };
  const counterDone = new Promise((resolve) => {
    gsap.to(counterObj, {
      v: 99,
      duration: 2.8,
      ease: 'none',
      onUpdate() {
        const v = Math.round(counterObj.v);
        if (countEl) countEl.textContent = v;
        // активировать максимальный слой, чей порог достигнут
        let target = 0;
        for (let i = 0; i < LAYER_AT.length; i++) if (v >= LAYER_AT[i]) target = i;
        while (activeLayer < target) {
          activeLayer++;
          const layer = layers[activeLayer];
          if (layer) {
            layer.classList.add('is-active');
            gsap.fromTo(layer,
              { clipPath: 'inset(100% 0 0 0)' },
              { clipPath: 'inset(0% 0 0 0)', duration: 0.55, ease: 'power2.out' });
          }
        }
      },
      onComplete: resolve,
    });
  });

  // Ждём И счётчик (99), И готовность кадров hero — тогда морф бесшовен.
  const [seq1] = await Promise.all([seq1Promise, counterDone]);

  // Морф: окно во весь экран, кадр переезжает в hero-позицию, счётчик гаснет.
  await new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to(countEl, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0)
      .to(win, {
        width: '100vw', height: '100vh',
        marginLeft: '-50vw', marginTop: '-50vh',
        duration: 1.0, ease: 'power3.inOut',
      }, 0)
      .to(heroLayer, { backgroundPosition: '50% 50%', duration: 1.0, ease: 'power3.inOut' }, 0);
  });

  // Инициализируем hero-canvas ПОД окном (рисует тот же frame_0001), затем гасим
  // оверлей — подмена «картинка → canvas» незаметна.
  if (onDone) onDone(seq1, seq2Promise, size);
  requestAnimationFrame(() => overlay?.classList.add('is-hidden'));
}
