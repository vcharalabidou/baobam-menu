// Μηχανισμός αλλαγής γλώσσας. Για αλλαγή κειμένων, επεξεργαστείτε το translations.js.
// Κρατάμε τα αρχικά ελληνικά ώστε η επιστροφή από EN σε EL να είναι ακριβής.
let currentLanguage = 'el';
const originalTexts = new WeakMap();
const originalLabels = new WeakMap();

// Αναγνωρίζει φράσεις ακόμη και με διαφορετικούς τόνους, κεφαλαία ή ορισμένα ανάμεικτα ελληνικά/λατινικά γράμματα.
function normalizeTranslation(text) {
  return Array.from(text, character => character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    .join('').replace(/[amtbnk]/g, letter => ({ a: 'α', m: 'μ', t: 'τ', b: 'β', n: 'ν', k: 'κ' })[letter]);
}

// Οι μεγαλύτερες φράσεις μεταφράζονται πρώτες, πριν από μεμονωμένα υλικά μέσα σε αυτές.
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

// Ενημερώνει τα κείμενα στις παρακάτω περιοχές. Μια νέα περιοχή με μεταφράσεις προστίθεται στη λίστα επιλογής.
function applyMenuLanguage() {
  document.querySelectorAll('#menu, #categories, #scroll-hint, #store-info, #allergy-notice, .menu-search label, #clear-search').forEach(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!originalTexts.has(node)) originalTexts.set(node, node.nodeValue);
      const original = originalTexts.get(node);
      node.nodeValue = currentLanguage === 'en' ? translateMenuText(original) : original;
    }
  });
  document.querySelectorAll('.category-arrow, .copy-phone').forEach(button => {
    if (!originalLabels.has(button)) originalLabels.set(button, button.getAttribute('aria-label'));
    const original = originalLabels.get(button);
    button.setAttribute('aria-label', currentLanguage === 'en' ? translateMenuText(original) : original);
    if (button.classList.contains('copy-phone')) button.title = button.getAttribute('aria-label');
  });
}

// Τα κουμπιά EL/EN αλλάζουν γλώσσα και ανανεώνουν τυχόν αποτελέσματα αναζήτησης.
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
  if (document.getElementById('menu-search-input').value.trim()) searchMenu();
  updateCategoryArrows();
}
