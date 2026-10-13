// typograf.js — микротипографика: убирает висячие предлоги/артикли/союзы.
//
// Короткие служебные слова (a, the, of, on, and, for …) не должны оставаться
// в конце строки — перенос обязан утащить их на новую строку вместе со
// следующим словом. Для этого пробел ПОСЛЕ такого слова заменяем на
// неразрывный ( ). Глаголы и местоимения не трогаем — они могут
// заканчивать строку (так и в макете: «…islands was» переносится, а «a
// losing» идёт вместе).
//
// Запускать ДО splitText: тогда неразрывные пробелы попадают и в заголовки
// [data-split] (splitText их сохраняет).

// Английские предлоги, артикли и союзы, которые нельзя оставлять в конце строки.
const GLUE = new Set([
  'a', 'an', 'the',
  'of', 'to', 'in', 'on', 'at', 'by', 'for', 'up', 'as', 'off', 'out',
  'per', 'via', 'from', 'with', 'into', 'onto', 'over', 'than',
  'and', 'or', 'nor', 'but', 'so', 'yet', 'if',
]);

/** Вешает   после служебных слов в одной строке текста. */
function glue(text) {
  if (!text || text.indexOf(' ') === -1) return text;
  const parts = text.split(/(\s+)/);   // чередование слово / пробелы
  for (let i = 0; i < parts.length - 1; i++) {
    if (/^ +$/.test(parts[i + 1]) && /\S/.test(parts[i]) && GLUE.has(parts[i].toLowerCase())) {
      parts[i + 1] = ' ';
    }
  }
  return parts.join('');
}

/**
 * Проходит по текстовым узлам поддерева и применяет glue(). Пропускает
 * служебные теги и счётчики (там только числа, трогать нечего).
 */
export function typograf(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
      if (p.closest('[data-count-to]')) return NodeFilter.FILTER_REJECT;
      if (!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const g = glue(n.textContent);
    if (g !== n.textContent) n.textContent = g;
  });
}
