// Keşfet: hazır katalogdan tek tıkla işaretleme. İşaretlenen her şey doğrudan rafa girer.

import { h, norm, toast, $$ } from '../util.js';
import * as store from '../store.js';
import { DONE, statusLabel } from '../store.js';
import { CATALOG, CATEGORIES } from '../catalog/index.js';
import { coverBox } from '../covers.js';

const ui = { kind: 'book', q: '', hideMarked: false };

const WORDS = {
  book: { done: 'Okudum', doneId: 'read', want: 'Okuyacağım', all: 'Hepsini okudum' },
  game: { done: 'Oynadım', doneId: 'played', want: 'Oynayacağım', all: 'Hepsini oynadım' },
};

function stateOf(cid) {
  const it = store.getItem(cid);
  if (it) return { item: it, done: DONE[it.kind].includes(it.status), want: it.status === 'want' };
  return { item: null, dismissed: !!store.getState().dismissed[cid] };
}

function act(entry, action) {
  const w = WORDS[entry.kind];
  const before = store.getItem(entry.id);
  const wasDismissed = !!store.getState().dismissed[entry.id];
  const undo = () => {
    if (before) store.restoreItem({ ...before });
    else store.removeItem(entry.id);
    store.setDismissed(entry.id, wasDismissed);
  };
  const s = stateOf(entry.id);

  if (action === 'skip') {
    if (s.dismissed) { store.setDismissed(entry.id, false); return; }
    if (before) store.removeItem(entry.id);
    store.setDismissed(entry.id, true);
    return;
  }
  const target = action === 'done' ? w.doneId : 'want';
  const isActive = action === 'done' ? s.done : s.want;
  if (isActive) {
    store.removeItem(entry.id);
    toast(`${entry.title} raftan kaldırıldı`, { label: 'Geri al', run: undo });
  } else if (before) {
    store.updateItem(entry.id, { status: target });
  } else {
    store.addFromCatalog(entry.id, target);
  }
}

function refreshCard(el) {
  const cid = el.dataset.cid;
  const s = stateOf(cid);
  el.classList.toggle('is-done', !!s.done);
  el.classList.toggle('is-want', !!s.want);
  el.classList.toggle('is-other', !!(s.item && !s.done && !s.want));
  el.classList.toggle('is-skip', !!s.dismissed);
  const [b1, b2, b3] = el.querySelectorAll('.dact');
  b1.setAttribute('aria-pressed', String(!!s.done));
  b2.setAttribute('aria-pressed', String(!!s.want));
  b3.setAttribute('aria-pressed', String(!!s.dismissed));
  const tag = el.querySelector('.dtag');
  tag.textContent = s.item && !s.done && !s.want ? statusLabel(s.item.kind, s.item.status) : '';
  if (ui.hideMarked && (s.item || s.dismissed)) el.classList.add('fade-out');
}

function dcard(entry) {
  const w = WORDS[entry.kind];
  const el = h('article', { class: 'dcard', dataset: { cid: entry.id } },
    h('div', { class: 'dcover' }, coverBox(entry), h('span', { class: 'dtag' })),
    h('div', { class: 'dmeta' },
      h('span', { class: 'card-title' }, entry.title),
      h('span', { class: 'card-sub' }, entry.series && entry.seriesNo != null && h('span', { class: 'sno' }, `#${entry.seriesNo}`), entry.creator)),
    h('div', { class: 'dactions' },
      h('button', { type: 'button', class: 'dact done', title: w.done, onclick: () => act(entry, 'done') }, w.done),
      h('button', { type: 'button', class: 'dact want', title: w.want, onclick: () => act(entry, 'want') }, 'Sonra'),
      h('button', { type: 'button', class: 'dact skip', title: 'İlgilenmiyorum', onclick: () => act(entry, 'skip') }, 'Geç')));
  refreshCard(el);
  el.classList.remove('fade-out');
  return el;
}

function seriesBlock(name, entries) {
  const w = WORDS[entries[0].kind];
  const markAll = () => {
    const changed = entries.filter((e) => !store.getItem(e.id));
    if (!changed.length) { toast('Serinin hepsi zaten rafta'); return; }
    changed.forEach((e) => store.addFromCatalog(e.id, w.doneId));
    toast(`${name}: ${changed.length} eser rafa eklendi`, {
      label: 'Geri al', run: () => changed.forEach((e) => store.removeItem(e.id)),
    });
  };
  return h('div', { class: 'series' },
    h('div', { class: 'series-head' },
      h('h3', null, name, h('span', { class: 'count' }, entries.length)),
      h('button', { type: 'button', class: 'link', onclick: markAll }, w.all)),
    h('div', { class: 'dgrid' }, entries.map(dcard)));
}

export function renderDiscover(root) {
  const kind = ui.kind;
  const f = norm(ui.q);
  const entries = CATALOG.filter((e) => e.kind === kind
    && (!f || norm(`${e.title} ${e.titleTr} ${e.creator} ${e.series}`).includes(f))
    && (!ui.hideMarked || (!store.getItem(e.id) && !store.getState().dismissed[e.id])));

  const marked = CATALOG.filter((e) => e.kind === kind && (store.getItem(e.id) || store.getState().dismissed[e.id])).length;
  const total = CATALOG.filter((e) => e.kind === kind).length;

  const sections = CATEGORIES[kind].map((cat) => {
    const list = entries.filter((e) => e.category === cat.id);
    if (!list.length) return null;
    const blocks = [];
    const loose = [];
    const seen = new Set();
    for (const e of list) {
      if (!e.series) { loose.push(e); continue; }
      if (seen.has(e.series)) continue;
      seen.add(e.series);
      blocks.push(seriesBlock(e.series, list.filter((x) => x.series === e.series)));
    }
    return h('section', { class: 'dsection', id: 'kat-' + cat.id },
      h('h2', { class: 'section-title' }, cat.label),
      blocks,
      loose.length > 0 && h('div', { class: 'dgrid' }, loose.map(dcard)));
  });

  const kindTab = (k, label) => h('button', {
    type: 'button', role: 'tab', 'aria-selected': String(kind === k), class: 'tab' + (kind === k ? ' on' : ''),
    onclick: () => { ui.kind = k; renderDiscover(root); window.scrollTo(0, 0); },
  }, label);

  root.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', null, 'Keşfet'),
      h('p', { class: 'lede' }, kind === 'book'
        ? 'Okuduklarına dokun, rafına girsin. "Sonra" okuma listene ekler, "Geç" ise ilgilenmediklerini kenara ayırır.'
        : 'Oynadıklarına dokun, rafına girsin. "Sonra" istek listene ekler, "Geç" ise ilgilenmediklerini kenara ayırır.'),
      h('p', { class: 'progress-line' },
        h('span', { class: 'bar' }, h('span', { style: { width: `${Math.round((marked / total) * 100)}%` } })),
        `${total} eserden ${marked} tanesine baktın`)),
    h('div', { class: 'shelf-head' },
      h('div', { class: 'tabs', role: 'tablist' }, kindTab('book', 'Kitaplar'), kindTab('game', 'Oyunlar'))),
    h('div', { class: 'toolbar sticky' },
      h('input', {
        type: 'search', placeholder: 'Katalogda ara', 'aria-label': 'Katalogda ara', value: ui.q,
        oninput: (e) => { ui.q = e.target.value; clearTimeout(ui.t); ui.t = setTimeout(() => { renderDiscover(root); root.querySelector('input[type=search]').focus(); }, 200); },
      }),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: ui.hideMarked, onchange: (e) => { ui.hideMarked = e.target.checked; renderDiscover(root); } }),
        'Baktıklarımı gizle'),
      h('nav', { class: 'jump', 'aria-label': 'Kategoriler' },
        CATEGORIES[kind].map((c) => h('a', {
          href: '#kat-' + c.id,
          onclick: (e) => { e.preventDefault(); document.getElementById('kat-' + c.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
        }, c.label)))),
    ...(sections.some(Boolean)
      ? sections.filter(Boolean)
      : [h('p', { class: 'muted empty inline' }, ui.hideMarked ? 'Bu bölümde bakmadığın eser kalmadı.' : 'Aramanla eşleşen eser yok. Katalogda yoksa Rafım\'dan kendin ekleyebilirsin.')]),
    h('p', { class: 'muted small foot-note' }, 'Listede olmayan bir şeyi Rafım sekmesindeki "Kitap ekle" / "Oyun ekle" ile ekleyebilirsin.'));
}

// Kartları tek tek güncelle (bütün sayfayı yeniden çizmeden)
export function onDiscoverChange(change) {
  if (change.type !== 'item') return false;
  for (const el of $$(`.dcard[data-cid="${CSS.escape(change.id)}"]`)) refreshCard(el);
  const line = document.querySelector('.progress-line');
  if (line) {
    const kind = ui.kind;
    const total = CATALOG.filter((e) => e.kind === kind).length;
    const marked = CATALOG.filter((e) => e.kind === kind && (store.getItem(e.id) || store.getState().dismissed[e.id])).length;
    line.querySelector('.bar span').style.width = `${Math.round((marked / total) * 100)}%`;
    line.lastChild.textContent = `${total} eserden ${marked} tanesine baktın`;
  }
  return true;
}
