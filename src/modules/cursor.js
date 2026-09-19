// Custom cursor — как на honeyeater.org.
// Белый круг 16px, position: fixed, mix-blend-mode: difference (сам инвертируется
// над любым фоном). Плавно следует за мышью через lerp + transform: translate3d.
// На hover по кликабельным элементам увеличивается до 56px.

export function initCursor() {
  // Только для десктопа с настоящей мышью — тач-устройства оставляют системный.
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cur);
  document.documentElement.classList.add('has-custom-cursor');

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x, ty = y;
  let s = 1, ts = 1;           // текущий и целевой scale

  window.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
  }, { passive: true });

  // Position + scale в одном transform — порядок translate() * scale() держит
  // центр курсора на кончике мыши при любом масштабе. Оба параметра —
  // независимые lerp'ы: позиция быстрая (0.28), scale плавный (0.18).
  const loop = () => {
    tx += (x - tx) * 0.28;
    ty += (y - ty) * 0.28;
    s  += (ts - s) * 0.18;
    cur.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Скрыть при выходе за окно, показать при возврате.
  document.addEventListener('mouseleave', () => cur.classList.add('is-out'));
  document.addEventListener('mouseenter', () => cur.classList.remove('is-out'));

  // Hover на кликабельных — раздутие через target scale.
  const isHoverable = (el) => el.closest('a, button, [data-cursor="hover"]');
  document.addEventListener('mouseover', (e) => {
    if (isHoverable(e.target)) { ts = 3.5; cur.classList.add('is-hover'); }
  });
  document.addEventListener('mouseout', (e) => {
    if (isHoverable(e.target)) { ts = 1; cur.classList.remove('is-hover'); }
  });
}
