// Uygulamanın girişi: veriyi yükler, temayı uygular, sekmeler arasında geçişi yönetir.

import { $, $$, debounce } from './util.js';
import * as store from './store.js';
import { renderShelf } from './views/shelf.js';
import { renderDiscover, onDiscoverChange } from './views/discover.js';
import { renderQuotes } from './views/quotes.js';
import { renderSettings, applyTheme, THEMES } from './views/settings.js';
import { renderQuiz, checkBadges, currentRank } from './views/quiz.js';

const ROUTES = {
  raf: { render: renderShelf, title: 'Rafım' },
  kesfet: { render: renderDiscover, title: 'Keşfet' },
  alintilar: { render: renderQuotes, title: 'Alıntılar' },
  quiz: { render: renderQuiz, title: 'Quiz' },
  ayarlar: { render: renderSettings, title: 'Ayarlar' },
};

let current = 'raf';

function route() {
  const key = location.hash.slice(1);
  if (key && !ROUTES[key]) return; // bilinmeyen çapalar sayfayı değiştirmesin
  current = key || 'raf';
  const view = $('#view');
  view.dataset.view = current;
  ROUTES[current].render(view);
  document.title = `${ROUTES[current].title} | Candlekeep`;
  for (const a of $$('.nav a')) a.setAttribute('aria-current', a.getAttribute('href') === '#' + current ? 'page' : 'false');
  window.scrollTo(0, 0);
}

const rerender = debounce(() => {
  const y = window.scrollY;
  ROUTES[current].render($('#view'));
  window.scrollTo(0, y);
}, 60);

function updateRankChip() {
  const r = currentRank();
  const chip = $('#rank-chip');
  chip.replaceChildren();
  const lvl = document.createElement('span');
  lvl.className = 'chip-lvl';
  lvl.textContent = r.lvl;
  chip.append(lvl, r.name);
  chip.title = `${r.xp} XP`;
}

const afterChange = debounce(() => {
  const fresh = checkBadges();
  updateRankChip();
  if (fresh.length && current === 'quiz') rerender();
}, 400);

function onChange(change) {
  afterChange();
  if (change.type === 'settings' && change.key === 'theme') return syncThemeSelect();
  if (change.type === 'all') { applyTheme(store.getState().settings.theme); syncThemeSelect(); }
  if (current === 'kesfet' && onDiscoverChange(change)) return;
  if (current === 'quiz' && change.type === 'quiz') return;
  if (current === 'ayarlar' && change.type === 'settings') return;
  rerender();
}

function syncThemeSelect() {
  const sel = $('#theme-select');
  if (sel) sel.value = store.getState().settings.theme;
}

function init() {
  store.load();
  applyTheme(store.getState().settings.theme);

  const sel = $('#theme-select');
  sel.replaceChildren(...THEMES.map((t) => new Option(t.label, t.id)));
  sel.value = store.getState().settings.theme;
  sel.addEventListener('change', () => {
    store.setSetting('theme', sel.value);
    applyTheme(sel.value);
    if (current === 'ayarlar') renderSettings($('#view'));
  });

  // Yapışkan araç çubuğu üst menünün tam altında dursun
  const bar = $('.topbar');
  const setBarH = () => document.documentElement.style.setProperty('--topbar-h', bar.offsetHeight + 'px');
  setBarH();
  if ('ResizeObserver' in window) new ResizeObserver(setBarH).observe(bar);

  store.subscribe(onChange);
  window.addEventListener('hashchange', route);
  if (!location.hash) history.replaceState(null, '', '#raf');
  route();
  updateRankChip();
  setTimeout(() => { if (checkBadges().length && current === 'quiz') rerender(); updateRankChip(); }, 800);
}

init();
