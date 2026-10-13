// reveals.js — появление элементов + счётчики цифр.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Разбивает заголовок с [data-split] на слова (word-wrapper) и символы (.char).
 * Слово-обёртка — inline-block с overflow:hidden, чтобы у символов был y-clip.
 * Между словами — обычный пробел: браузер спокойно переносит на границах слов.
 * Вложенные теги (span.muted и т.п.) сохраняются.
 */
export function splitText(root) {
  const els = root.querySelectorAll('[data-split]');

  const wrapWord = (text) => {
    const word = document.createElement('span');
    word.className = 'word';
    const inner = document.createElement('span');
    inner.className = 'word__inner';
    for (const ch of text) {
      const c = document.createElement('span');
      c.className = 'char';
      c.textContent = ch;
      inner.appendChild(c);
    }
    word.appendChild(inner);
    return word;
  };

  const walk = (source, target) => {
    source.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const parts = n.textContent.split(/(\s+)/);
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            // Сохраняем неразрывный пробел (из типографа / ручного &nbsp;),
            // иначе предлог оторвётся и сможет повиснуть в конце строки.
            target.appendChild(document.createTextNode(part.includes(' ') ? ' ' : ' '));
          } else {
            target.appendChild(wrapWord(part));
          }
        });
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const clone = n.cloneNode(false);
        walk(n, clone);
        target.appendChild(clone);
      }
    });
  };

  els.forEach((el) => {
    if (el.dataset.splitDone === '1') return;
    const orig = el.cloneNode(true);
    el.innerHTML = '';
    walk(orig, el);
    el.dataset.splitDone = '1';
  });
}

/**
 * Появление заголовков и текстов при попадании в viewport, в стиле Framer/Cryptix:
 * контент поднимается снизу (translateY) из непрозрачности (opacity 0→1) с лёгким
 * размытием (blur 4px→0). Заголовки [data-split] — по словам со stagger; тексты
 * [data-reveal] — цельным блоком.
 *
 * Триггер — IntersectionObserver по реальной видимости элемента: работает и внутри
 * пиновых секций (где ScrollTrigger по скролл-позиции промахивался), и повторяет
 * анимацию КАЖДЫЙ раз, когда элемент снова появляется на экране (при уходе за
 * пределы экрана состояние сбрасывается в стартовое).
 *
 * Эффект — только opacity/transform/filter (GPU) + will-change, поэтому не мешает
 * загрузке. Запускается после прелоадера.
 */
function setupReveal(root, selector, apply) {
  // Элементы секции 1 (hero) исключаем из IntersectionObserver — их проигрывает
  // единый intro при загрузке (initHeroIntro), синхронно с меню, а не по видимости.
  const items = [...root.querySelectorAll(selector)].filter((el) => !el.closest('#section-one'));
  if (!items.length) return;

  items.forEach((el) => apply.reset(el));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) apply.play(e.target);
        else apply.reset(e.target);
      });
    },
    // Небольшой порог + подрезка низа вьюпорта: анимация стартует, когда элемент
    // уже заметно вошёл в кадр (а не краем у самой кромки экрана).
    { threshold: 0.2, rootMargin: '0px 0px -12% 0px' }
  );

  items.forEach((el) => io.observe(el));
}

export function initHeroReveal(root, selector = '[data-split]') {
  setupReveal(root, selector, {
    reset(el) {
      const words = el.querySelectorAll('.word__inner');
      if (!words.length) return;
      gsap.set(words, { yPercent: 100, opacity: 0, filter: 'blur(4px)' });
    },
    play(el) {
      const words = el.querySelectorAll('.word__inner');
      if (!words.length) return;
      gsap.to(words, {
        yPercent: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.05,
        overwrite: true,
      });
    },
  });
}

/**
 * Intro секции 1 при загрузке: всё появляется синхронно (одним таймлайном) —
 * верхнее меню выезжает сверху из непрозрачности, заголовок поднимается по словам,
 * текст и кнопка всплывают вместе с ним. Запускается один раз после прелоадера
 * (элементы секции 1 исключены из IntersectionObserver, см. setupReveal).
 */
export function initHeroIntro(root) {
  const section = root.querySelector('#section-one');
  if (!section) return;
  const nav    = document.getElementById('siteNav');
  const title  = section.querySelector('.s1__title');
  const bottom = section.querySelector('.s1__bottom');
  const words  = title ? title.querySelectorAll('.word__inner') : [];

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (nav) {
    gsap.set(nav, { yPercent: -100, opacity: 0 });
    tl.to(nav, { yPercent: 0, opacity: 1, duration: 0.8, clearProps: 'transform,opacity' }, 0);
  }
  if (words.length) {
    gsap.set(words, { yPercent: 100, opacity: 0, filter: 'blur(4px)' });
    tl.to(words, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.05 }, 0);
  }
  if (bottom) {
    gsap.set(bottom, { y: 26, opacity: 0, filter: 'blur(4px)' });
    tl.to(bottom, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75 }, 0);
  }
}

export function initFadeReveal(root) {
  setupReveal(root, '[data-reveal]', {
    reset(el) {
      gsap.set(el, { y: 26, opacity: 0, filter: 'blur(4px)' });
    },
    play(el) {
      gsap.to(el, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.75,
        ease: 'power3.out',
        overwrite: true,
      });
    },
  });
}
