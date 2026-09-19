// ruler.js — вертикальные линейки-шкалы у левого и правого краёв экрана
// (по мотивам noir.framer.wiki). Штрихи (SVG-маска, repeat-y) бегут синхронно
// со скроллом — эффект бесконечной измерительной ленты. Цвет инвертируется по
// фону через mix-blend-mode: difference (как кастомный курсор), поэтому линейка
// автоматически светлая на тёмных секциях и тёмная на светлых.

export function initRuler() {
  const rulers = Array.from(document.querySelectorAll('[data-ruler]'));
  if (!rulers.length) return;

  let last = -1;
  const loop = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    if (y !== last) {
      last = y;
      // Штрихи бегут вверх при прокрутке вниз (лента «отсчитывает» пройденное).
      const off = (-y) + 'px';
      for (let i = 0; i < rulers.length; i++) {
        rulers[i].style.setProperty('--ruler-y', off);
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
