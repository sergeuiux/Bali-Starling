// smoothScroll.js — Lenis + GSAP ScrollTrigger sync.

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Пин через transform на всех устройствах. Чтобы на мобилке он не дёргался
// и не давал рывка, скролл пальцем тоже отдаём Lenis (syncTouch ниже): тогда
// и прокрутка, и пины идут одним механизмом (GSAP ticker) — синхронно.
ScrollTrigger.defaults({ pinType: 'transform' });

const isTouch = window.matchMedia('(max-width: 768px)').matches;

export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.6,                                             // выше = мягче инерция
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.85,                                     // ниже = меньше рывки на колесе
    // Мобилка: Lenis управляет и скроллом пальцем (не только колесом) — палец
    // двигает скролл плавно, пины (transform) идут синхронно, без дёрганья и
    // рывка. syncTouchLerp — мягкость следования за пальцем (выше = «тяжелее»).
    syncTouch: isTouch,
    syncTouchLerp: 0.075,
    touchMultiplier: 1.4,
    lerp: 0.08,                                                 // плавность интерполяции
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
