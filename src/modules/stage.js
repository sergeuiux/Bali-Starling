// stage.js — базовый canvas-рендер кадра (cover), с адаптацией под DPR/resize.
// Отдельно от frameSequence, чтобы им мог пользоваться собственный timeline
// в секции 2.

export function createStage(canvas, frames, options = {}) {
  const {
    fit = 'cover',
    scale: userScale = 1,
    cropBottom = 0,      // сколько процентов нижней части кадра обрезать (0..1)
    cropTop = 0,         // то же для верха
    offsetX = 0,         // сдвиг окна отрисовки по X (доля ширины canvas): <0 — левее
    offsetY = 0,         // сдвиг окна отрисовки по Y (доля высоты canvas)
    onSampleColor = null, // callback(rgbString) — вызывается с цветом первого пикселя первого кадра
  } = options;
  const ctx = canvas.getContext('2d');
  let currentIndex = -1;
  let sampledColor = null;

  function sampleColor(img) {
    if (sampledColor || !img || !img.complete || img.naturalWidth === 0) return;
    try {
      const c = document.createElement('canvas');
      c.width = 1; c.height = 1;
      const cctx = c.getContext('2d');
      cctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = cctx.getImageData(0, 0, 1, 1).data;
      sampledColor = `rgb(${r}, ${g}, ${b})`;
      canvas.style.background = sampledColor;
      if (onSampleColor) onSampleColor(sampledColor);
    } catch (e) {
      // getImageData может упасть из-за CORS в редких случаях — фолбэк на CSS-фон.
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);
    draw(currentIndex >= 0 ? currentIndex : 0, true);
  }

  function draw(i, force = false) {
    if (i === currentIndex && !force) return;
    const img = frames[Math.max(0, Math.min(frames.length - 1, i))];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    currentIndex = i;

    sampleColor(img);

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // source rect (обрезка сверху/снизу).
    const sy = ih * cropTop;
    const sh = ih * (1 - cropTop - cropBottom);
    const sw = iw;
    const sx = 0;

    const s = fit === 'contain'
      ? Math.min(cw / sw, ch / sh)
      : Math.max(cw / sw, ch / sh);
    const scale = s * userScale;

    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (cw - dw) / 2 + offsetX * cw;
    const dy = (ch - dh) / 2 + offsetY * ch;

    // Фон canvas — точный цвет кадра (letterbox не отличается от видео).
    if (sampledColor) {
      ctx.fillStyle = sampledColor;
      ctx.fillRect(0, 0, cw, ch);
    } else {
      ctx.clearRect(0, 0, cw, ch);
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  resize();
  window.addEventListener('resize', resize);

  return { draw, resize };
}
