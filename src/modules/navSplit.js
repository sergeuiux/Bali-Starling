// navSplit.js — тема плашки меню.
//
// Единый принцип: в любой момент у навбара активен РОВНО ОДИН класс темы
// (on-sX) — или НИ ОДНОГО на секции 1 (прозрачно поверх видео). Тему ставит
// секция, которая сейчас под строкой меню, через setNavTheme() — helper снимает
// все чужие классы и ставит нужный. Секции НЕ снимают класс при выходе: он
// держится, пока следующая секция не перезапишет. Так между секциями не бывает
// «дыры» без заливки (иначе меню на миг становилось прозрачным/тёмным).
//
// Секция 1: прозрачность выставляет здесь navSplit — когда секция 2 ещё ниже
// строки меню (мы на первой секции), тема сбрасывается в null.

import { gsap } from 'gsap';

export const NAV_THEME_CLASSES = [
  'on-s2', 'on-s3', 'on-s3-light', 'on-s4', 'on-s5',
  'on-s6', 'on-s6-light', 'on-s7', 'on-s8', 'on-s9',
];

// Ставит ровно один класс темы (или ни одного при cls == null/'').
export function setNavTheme(nav, cls) {
  if (!nav) return;
  for (const c of NAV_THEME_CLASSES) {
    if (c !== cls) nav.classList.remove(c);
  }
  if (cls) nav.classList.add(cls);
}

export function initNavSplit() {
  const nav  = document.querySelector('.site-nav');
  const s2   = document.getElementById('section-two');
  const song = document.querySelector('[data-sound-toggle]');
  if (!nav || !s2) return;

  const navMid = 46; // вертикальный центр строки меню

  const update = () => {
    const s2r = s2.getBoundingClientRect();
    // Секция 2 под строкой меню? (её светлая панель заняла верх экрана)
    const active = s2r.top <= navMid && s2r.bottom >= navMid;

    if (active) {
      // Секция 2 под меню — светлая плашка (пункт About оранжевый).
      setNavTheme(nav, 'on-s2');
    } else if (s2r.top > navMid) {
      // Секция 2 ещё ниже строки меню → мы на секции 1 → прозрачно.
      setNavTheme(nav, null);
    }
    // Иначе (секция 2 выше строки меню) — под меню секция 3+, ими управляют
    // их собственные контроллеры; здесь тему не трогаем.

    if (song) song.classList.toggle('on-light', active);
  };

  update();
  gsap.ticker.add(update);
  window.addEventListener('resize', update);
}
