// Κρατάμε το αρχικό κείμενο κάθε κόμβου ώστε η επιστροφή στα ελληνικά να είναι ακριβής.
let currentLanguage = 'el';
const originalTexts = new WeakMap();
const originalLabels = new WeakMap();

function normalizeTranslation(text) {
  return Array.from(text, character => character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    .join('').replace(/[amtbnk]/g, letter => ({ a: 'α', m: 'μ', t: 'τ', b: 'β', n: 'ν', k: 'κ' })[letter]);
}

const translationEntries = new Map(Object.entries(window.menuTranslations)
  .filter(([key]) => /[\u0370-\u03ff]/.test(key))
  .map(([key, value]) => [normalizeTranslation(key).replace(/\s+/g, ' '), value]));
const translationPattern = new RegExp('(?<![\\p{L}])(?:' + [...translationEntries.keys()]
  .sort((a, b) => b.length - a.length)
  .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
  .join('|') + ')(?![\\p{L}])', 'gu');

function translateMenuText(text) {
  const normalized = normalizeTranslation(text);
  let result = '', offset = 0;
  for (const match of normalized.matchAll(translationPattern)) {
    result += text.slice(offset, match.index) + translationEntries.get(match[0].replace(/\s+/g, ' '));
    offset = match.index + match[0].length;
  }
  return result + text.slice(offset);
}

function applyMenuLanguage() {
  document.querySelectorAll('#menu, #categories, #scroll-hint').forEach(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!originalTexts.has(node)) originalTexts.set(node, node.nodeValue);
      const original = originalTexts.get(node);
      node.nodeValue = currentLanguage === 'en' ? translateMenuText(original) : original;
    }
  });
  document.querySelectorAll('.category-arrow').forEach(button => {
    if (!originalLabels.has(button)) originalLabels.set(button, button.getAttribute('aria-label'));
    const original = originalLabels.get(button);
    button.setAttribute('aria-label', currentLanguage === 'en' ? translateMenuText(original) : original);
  });
}

function switchLanguage(language) {
  if (!['el', 'en'].includes(language)) return;
  currentLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll('.language-btn').forEach(button => {
    const active = button.dataset.lang === language;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  applyMenuLanguage();
  updateCategoryArrows();
}
