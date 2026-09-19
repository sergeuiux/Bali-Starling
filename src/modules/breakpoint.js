// breakpoint.js — выбор набора кадров под ширину окна.
// desktop / tablet / mobile — соответствуют папкам public/frames/*/{key}/

export function currentSize() {
  const w = window.innerWidth;
  if (w >= 1200) return 'desktop';
  if (w >= 720)  return 'tablet';
  return 'mobile';
}
