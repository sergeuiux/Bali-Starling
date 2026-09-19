// preloader.js — предзагрузка кадров первой секции и снятие оверлея.

import { currentSize } from './breakpoint.js';

const FRAMES_ROOT = `${import.meta.env.BASE_URL}frames`;

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
  const fill = document.getElementById('preloaderFill');
  const pct = document.getElementById('preloaderPct');

  const size = currentSize();

  // Мобилка (≤768px): покадровое видео секций 1–2 заменено статичными картинками
  // (см. .s1__poster / .s2__poster в разметке). Кадры НЕ грузим вовсе — это убирает
  // ~5 MB и 160 запросов с мобильной загрузки. Прелоадер закрываем сразу.
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  if (mobile) {
    if (fill) fill.style.width = '100%';
    if (pct)  pct.textContent  = '100%';
    await new Promise(r => setTimeout(r, 220));
    overlay?.classList.add('is-hidden');
    if (onDone) onDone(null, Promise.resolve(null), size);
    return;
  }

  // Первую секцию — обязательно ждём. Вторую — стартуем параллельно, но не ждём.
  // Оба видео: 80 кадров (1.mp4 / 2.mp4, прорежены до 20 fps).
  const seq1Promise = loadSequence('s1', size, 80, (p) => {
    const percent = Math.round(p * 100);
    if (fill) fill.style.width = percent + '%';
    if (pct)  pct.textContent  = percent + '%';
  });

  const seq2Promise = loadSequence('s2', size, 80, null);

  const seq1 = await seq1Promise;

  // Небольшая пауза, чтобы 100% успело отрендериться и глаз это заметил.
  await new Promise(r => setTimeout(r, 220));

  overlay?.classList.add('is-hidden');

  if (onDone) onDone(seq1, seq2Promise, size);
}
