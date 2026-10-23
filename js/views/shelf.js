// Rafım: rastgele alıntı, filtreler ve kapak ızgarası.

import { h, norm, fmtRating } from '../util.js';
import * as store from '../store.js';
import { STATUS, DONE, statusLabel } from '../store.js';
import { CATEGORIES, CATALOG_BY_ID } from '../catalog/index.js';
import { coverBox } from '../covers.js';
import { openDetail, openNew } from './detail.js';
import { importQuotesFlow } from './quotes.js';

// Ekran değişse de seçimler kalsın
const ui = { kind: 'book', status: 'all', q: '', sort: 'updated', cat: '' };
let heroQuote = null;

function pickQuote(exclude) {
  const all = store.getState().quotes.filter((q) => (q.tr || q.orig).length <= 480);
  const pool = all.length ? all : store.getState().quotes;
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  let q;
  do { q = pool[Math.floor(Math.random() * pool.length)]; } while (q === exclude);
  return q;
}

function heroSection() {
  if (!heroQuote || !store.getState().quotes.includes(heroQuote)) heroQuote = pickQuote();
  if (!heroQuote) {
    return h('section', { class: 'hero hero-empty' },
      h('p', { class: 'hero-text' }, 'Alıntı defterini yüklediğinde, her açılışta buradan bir tanesi karşılayacak.'),
      h('button', { type: 'button', class: 'btn', onclick: importQuotesFlow }, 'Alıntı dosyasını yükle'));
  }
  const q = heroQuote;
  const book = q.bookId && (store.getItem(q.bookId) || CATALOG_BY_ID.get(q.bookId));
  const main = (q.tr || q.orig).replace(/^["“”«»„']+/, '').replace(/["“”«»]+$/, '');
  const sub = q.tr && q.orig ? q.orig : '';
  return h('section', { class: 'hero' },
    h('blockquote', { class: 'hero-text' }, main),
    sub && h('blockquote', { class: 'hero-orig' }, sub),
    h('div', { class: 'hero-foot' },
      h('cite', null, book ? book.title : q.section || ''),
      h('button', {
        type: 'button', class: 'link',
        onclick: (e) => {
          heroQuote = pickQuote(q);
          e.target.closest('.hero').replaceWith(heroSection());
        },
      }, 'Başka bir alıntı')));
}

function sorter(sort) {
  const t = (i) => i.title.toLocaleLowerCase('tr');
  switch (sort) {
    case 'rating': return (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || t(a).localeCompare(t(b), 'tr');
    case 'title': return (a, b) => t(a).localeCompare(t(b), 'tr');
    case 'series': return (a, b) => (a.series || a.title).localeCompare(b.series || b.title, 'tr')
      || (a.seriesNo ?? 99) - (b.seriesNo ?? 99);
    case 'creator': return (a, b) => (a.creator || '').localeCompare(b.creator || '', 'tr') || t(a).localeCompare(t(b), 'tr');
    default: return (a, b) => b.updatedAt - a.updatedAt;
  }
}

function card(item, showStatus) {
  const cover = coverBox(item);
  if (item.rating != null) cover.append(h('span', { class: 'badge-rating', 'aria-label': `Puan ${fmtRating(item.rating)}` }, fmtRating(item.rating)));
  if (item.fav) cover.append(h('span', { class: 'badge-fav', 'aria-label': 'Favori' }, '♥'));
  const sub = [];
  if (item.series) sub.push(item.series + (item.seriesNo != null ? ` #${item.seriesNo}` : ''));
  else if (item.creator) sub.push(item.creator);
  return h('button', {
    type: 'button', class: `card st-${item.status}`, dataset: { id: item.id },
    onclick: () => openDetail(item.id),
  },
  cover,
  h('span', { class: 'card-title' }, item.title),
  h('span', { class: 'card-sub' }, sub.join(''), showStatus && !DONE[item.kind].includes(item.status) && h('span', { class: 'card-status' }, statusLabel(item.kind, item.status))),
  item.status === 'reading' || item.status === 'playing'
    ? item.progress && h('span', { class: 'card-progress' }, item.progress)
    : null);
}

export function renderShelf(root) {
  const kind = ui.kind;
  const all = store.itemsOf(kind);
  const counts = { all: all.length };
  for (const s of STATUS[kind]) counts[s.id] = all.filter((i) => i.status === s.id).length;
  if (ui.status !== 'all' && !STATUS[kind].some((s) => s.id === ui.status)) ui.status = 'all';

  const grid = h('div', { class: 'grid' });
  const drawGrid = () => {
    const f = norm(ui.q);
    let items = all.filter((i) => (ui.status === 'all' || i.status === ui.status)
      && (!ui.cat || (i.category || '') === ui.cat)
      && (!f || norm(`${i.title} ${i.titleTr} ${i.creator} ${i.series} ${(i.tags || []).join(' ')}`).includes(f)));
    items.sort(sorter(ui.sort));
    if (!all.length) {
      grid.replaceChildren(h('div', { class: 'empty inline' },
        h('p', null, kind === 'book'
          ? 'Rafında henüz kitap yok. Keşfet sekmesinden okuduklarını tek tıkla işaretleyebilirsin.'
          : 'Rafında henüz oyun yok. Keşfet sekmesinden oynadıklarını tek tıkla işaretleyebilirsin.'),
        h('a', { class: 'btn primary', href: '#kesfet' }, 'Keşfet\'e git')));
      return;
    }
    if (!items.length) {
      grid.replaceChildren(h('p', { class: 'muted empty inline' }, 'Bu filtrelerle eşleşen bir şey yok.'));
      return;
    }
    grid.replaceChildren(...items.map((i) => card(i, ui.status === 'all')));
  };

  const chip = (id, label) => h('button', {
    type: 'button', class: 'chip' + (ui.status === id ? ' on' : ''), 'aria-pressed': String(ui.status === id),
    onclick: () => { ui.status = id; renderShelf(root); },
  }, label, h('span', { class: 'count' }, counts[id]));

  const kindTab = (k, label) => h('button', {
    type: 'button', role: 'tab', 'aria-selected': String(kind === k), class: 'tab' + (kind === k ? ' on' : ''),
    onclick: () => { ui.kind = k; ui.cat = ''; renderShelf(root); },
  }, label, h('span', { class: 'count' }, store.itemsOf(k).length));

  root.replaceChildren(
    heroSection(),
    h('div', { class: 'shelf-head' },
      h('div', { class: 'tabs', role: 'tablist' }, kindTab('book', 'Kitaplar'), kindTab('game', 'Oyunlar')),
      h('button', { type: 'button', class: 'btn', onclick: () => openNew(kind) }, kind === 'book' ? 'Kitap ekle' : 'Oyun ekle')),
    h('div', { class: 'chips status-chips' }, chip('all', 'Hepsi'), STATUS[kind].map((s) => counts[s.id] ? chip(s.id, s.label) : null)),
    h('div', { class: 'toolbar' },
      h('input', {
        type: 'search', placeholder: kind === 'book' ? 'Ad, yazar, seri, etiket' : 'Ad, stüdyo, etiket',
        'aria-label': 'Rafta ara', value: ui.q,
        oninput: (e) => { ui.q = e.target.value; drawGrid(); },
      }),
      h('select', { 'aria-label': 'Kategori', value: ui.cat, onchange: (e) => { ui.cat = e.target.value; drawGrid(); } },
        h('option', { value: '' }, 'Bütün kategoriler'),
        CATEGORIES[kind].map((c) => h('option', { value: c.id }, c.label))),
      h('select', { 'aria-label': 'Sıralama', value: ui.sort, onchange: (e) => { ui.sort = e.target.value; drawGrid(); } },
        h('option', { value: 'updated' }, 'Son dokunduklarım'),
        h('option', { value: 'rating' }, 'Puana göre'),
        h('option', { value: 'title' }, 'Ada göre'),
        h('option', { value: 'creator' }, kind === 'book' ? 'Yazara göre' : 'Stüdyoya göre'),
        h('option', { value: 'series' }, 'Seriye göre'))),
    grid);
  drawGrid();
}
