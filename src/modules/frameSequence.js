// frameSequence.js — pin + scroll-scrubbed canvas playback (для section 1).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createStage } from './stage.js';

gsap.registerPlugin(ScrollTrigger);

export function createFrameSequence({
  canvas,
  frames,
  trigger,
  start = 'top top',
  end = '+=180%',
  pin = true,
  stageOptions = {},
  intro = true,
  introDelay = 0,
}) {
  const stage = createStage(canvas, frames, stageOptions);
  const state = { f: 0 };
  const last = frames.length - 1;

  ScrollTrigger.addEventListener('refresh', stage.resize);

  const tween = gsap.to(state, {
    f: last,
    ease: 'none',
    onUpdate: () => stage.draw(Math.round(state.f)),
    scrollTrigger: {
      trigger,
      start,
      end,
      pin,
      scrub: 0.2,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      fastScrollEnd: true,
    },
  });

  stage.draw(0, true);

  // Intro при загрузке: кадр «наплывает» — стартует крупнее (scale 1.3) и размытым,
  // за 1с встаёт в свой масштаб без блюра. Pin висит на секции, не на canvas,
  // поэтому transform/filter здесь свободны и не конфликтуют со скролл-пином.
  // Для hero intro отключён: наплыв делает морф прелоадера (иначе двойное появление).
  if (intro) {
    // immediateRender:false — «from» (scale 1.3) применяется только когда тween
    // стартует (после introDelay), чтобы наплыв шёл ПОСЛЕ снятия прелоадера, а не
    // под ним. До старта canvas в своём масштабе (кадр из морфа), без скачка раньше времени.
    gsap.fromTo(canvas,
      { scale: 1.3, filter: 'blur(18px)' },
      { scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out',
        clearProps: 'filter', delay: introDelay, immediateRender: false },
    );
  }

  return { tween, stage };
}
