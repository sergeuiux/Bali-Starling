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
  return { tween, stage };
}
