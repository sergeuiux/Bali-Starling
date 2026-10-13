// smoothScroll.js — Lenis + GSAP ScrollTrigger sync.

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// pinType по устройству:
//  • Десктоп — 'transform': скролл сглаживает Lenis (колесо), и transform-пин
//    идёт с ним синхронно, без рывка на сотни px при защёлкивании fixed.
//  • Мобилка — 'fixed': скролл пальцем нативный (Lenis тач не перехватывает),
//    а transform-пин обновляется в JS с лагом относительно нативной прокрутки —
//    отсюда дрожание. position:fixed браузер держит нативно, без тряски.
const isTouch = window.matchMedia('(max-width: 768px)').matches;
ScrollTrigger.defaults({ pinType: isTouch ? 'fixed' : 'transform' });

export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.6,                                             // выше = мягче инерция
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.85,                                     // ниже = меньше рывки на колесе
    touchMultiplier: 1.4,
    lerp: 0.08,                                                 // плавность интерполяции
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
