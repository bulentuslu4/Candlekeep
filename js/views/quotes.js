// Alıntılar: dosyadan içe aktarma, kitaba göre gruplama, arama, kitabı düzeltme.

import { h, toast, openDrawer, closeDrawer, readFile, norm } from '../util.js';
import * as store from '../store.js';
import { CATALOG, CATALOG_BY_ID } from '../catalog/index.js';
import { parseQuotes, makeMatcher } from '../quotes-parser.js';
import { pdfToText } from '../pdf-text.js';

function bookTitle(id) {
  const it = store.getItem(id) || CATALOG_BY_ID.get(id);
  return it ? it.title : 'Bilinmeyen kitap';
}

export function quoteBlock(q, { compact = false, showBook = false, onMove } = {}) {
  const both = q.tr && q.orig;
  return h('figure', { class: 'quote' + (both ? ' two' : '') },
    h('div', { class: 'quote-texts' },
      q.tr && h('blockquote', { lang: 'tr' }, q.tr),
      q.orig && h('blockquote', { class: 'orig' }, q.orig)),
    h('figcaption', null,
      showBook && q.bookId && h('span', { class: 'q-book' }, bookTitle(q.bookId)),
      q.source && h('span', { class: 'q-src' }, q.source),
      !compact && h('span', { class: 'q-actions' },
        onMove && h('button', { type: 'button', class: 'link', onclick: () => onMove(q) }, 'Kitabı değiştir'),
        h('button', {
          type: 'button', class: 'link',
          onclick: () => {
            const r = store.removeQuote(q.id);
            toast('Alıntı silindi', { label: 'Geri al', run: () => store.restoreQuote(r) });
          },
        }, 'Sil'))));
}

/* ---------- İçe aktarma ---------- */

function bookMatcher() {
  const own = store.itemsOf('book').filter((i) => !i.catalogId);
  return makeMatcher([...CATALOG.filter((c) => c.kind === 'book'), ...own]);
}

async function fileToText(file) {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return pdfToText(await readFile(file, 'buffer'));
  const isDocx = /\.docx$/i.test(file.name);
  if (!isDocx) return readFile(file);
  if (!window.mammoth) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      s.onload = res;
      s.onerror = () => rej(new Error('Word okuyucu yüklenemedi'));
      document.head.append(s);
    });
  }
  const buf = await readFile(file, 'buffer');
  const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
  return r.value;
}

export function importQuotesFlow() {
  const input = h('input', { type: 'file', accept: '.pdf,.docx,.txt,.md,application/pdf,text/plain', hidden: true });
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    let text;
    try {
      text = await fileToText(file);
    } catch (e) {
      toast(`${e.message}. İnternet bağlantını kontrol et ya da dosyayı .txt olarak kaydedip onu yükle.`);
      return;
    }
    const quotes = parseQuotes(text, bookMatcher());
    if (!quotes.length) {
      toast('Dosyada alıntı bulunamadı. Alıntılar "-----" çizgileriyle ayrılmış olmalı.');
      return;
    }
    preview(quotes);
  };
  document.body.append(input);
  input.click();
  setTimeout(() => input.remove(), 60000);
}

function preview(quotes) {
  const books = new Map();
  for (const q of quotes) if (q.bookId) books.set(q.bookId, (books.get(q.bookId) || 0) + 1);
  const other = quotes.filter((q) => !q.bookId).length;
  const picks = new Map();
  let mode = store.getState().quotes.length ? 'replace' : 'add';

  const rows = [...books.entries()].map(([id, n]) => {
    const inList = store.getItem(id);
    const box = h('input', { type: 'checkbox', checked: !inList, disabled: !!inList });
    picks.set(id, box);
    return h('label', { class: 'pick-row' + (inList ? ' muted' : '') },
      box,
      h('span', { class: 'pick-title' }, bookTitle(id)),
      h('span', { class: 'pick-meta' }, inList ? `rafta: ${store.statusLabel('book', inList.status)}` : `${n} alıntı`));
  });

  const hasOld = store.getState().quotes.length > 0;
  const body = h('div', { class: 'detail' },
    h('h2', null, 'Alıntıları içe aktar'),
    h('p', null, `${quotes.length} alıntı bulundu. ${books.size} kitapla eşleşti${other ? `, ${other} tanesi "Diğer alıntılar" köşesine gidecek` : ''}.`),
    h('section', { class: 'detail-sec' },
      h('h3', null, 'Rafa "Okudum" olarak eklensin'),
      h('div', { class: 'pick-list' }, rows)),
    hasOld && h('section', { class: 'detail-sec' },
      h('h3', null, 'Mevcut alıntılar'),
      h('label', { class: 'pick-row' }, h('input', { type: 'radio', name: 'qmode', checked: true, onchange: () => { mode = 'replace'; } }),
        h('span', null, 'Yenileriyle değiştir (dosyan ana kaynaksa bunu seç)')),
      h('label', { class: 'pick-row' }, h('input', { type: 'radio', name: 'qmode', onchange: () => { mode = 'add'; } }),
        h('span', null, 'Mevcutların yanına ekle'))),
    h('footer', { class: 'detail-foot' },
      h('button', {
        type: 'button', class: 'btn primary',
        onclick: () => {
          let added = 0;
          for (const [id, box] of picks) if (box.checked && !box.disabled && !store.getItem(id)) {
            store.addFromCatalog(id, 'read');
            added++;
          }
          store.setQuotes(quotes, mode);
          closeDrawer();
          toast(`${quotes.length} alıntı içe aktarıldı${added ? `, ${added} kitap rafa eklendi` : ''}`);
        },
      }, 'İçe aktar')));
  openDrawer(body);
}

/* ---------- Kitabı değiştir ---------- */

function moveQuote(q) {
  const books = [...store.itemsOf('book')].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  const sel = h('select', { value: q.bookId || '' },
    h('option', { value: '' }, 'Diğer alıntılar (kitapsız)'),
    books.map((b) => h('option', { value: b.id }, b.title)));
  openDrawer(h('div', { class: 'detail' },
    h('h2', null, 'Alıntı hangi kitaptan?'),
    h('p', { class: 'muted' }, 'Listede sadece rafındaki kitaplar var.'),
    sel,
    h('footer', { class: 'detail-foot' }, h('button', {
      type: 'button', class: 'btn primary',
      onclick: () => { store.updateQuote(q.id, { bookId: sel.value || null }); closeDrawer(); toast('Alıntı taşındı'); },
    }, 'Kaydet'))));
}

/* ---------- Ekran ---------- */

export function renderQuotes(root) {
  const quotes = store.getState().quotes;
  if (!quotes.length) {
    root.replaceChildren(h('section', { class: 'empty' },
      h('h1', null, 'Alıntı defterin burada duracak'),
      h('p', null, 'PDF, Word (.docx) ya da düz metin (.txt) halini yükle. Her alıntıyı kitabıyla eşleştirip Türkçe ve orijinalini yan yana koyarım. Dosya sadece bu tarayıcıda kalır, GitHub\'a gitmez.'),
      h('button', { type: 'button', class: 'btn primary', onclick: importQuotesFlow }, 'Alıntı dosyasını yükle')));
    return;
  }

  let filter = '';
  let book = '';
  const list = h('div', { class: 'quote-groups' });

  const groupsOf = (qs) => {
    const m = new Map();
    for (const q of qs) {
      const key = q.bookId || 'other:' + (q.section || 'Diğer');
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(q);
    }
    return m;
  };

  const draw = () => {
    const f = norm(filter);
    const qs = quotes.filter((q) => (!book || (q.bookId || 'other') === book)
      && (!f || norm(q.tr + ' ' + q.orig + ' ' + q.source).includes(f)));
    if (!qs.length) {
      list.replaceChildren(h('p', { class: 'muted' }, 'Bu aramayla eşleşen alıntı yok.'));
      return;
    }
    const groups = [...groupsOf(qs).entries()].sort((a, b) => a[0].startsWith('other:') - b[0].startsWith('other:'));
    list.replaceChildren(...groups.map(([key, arr]) => h('section', { class: 'quote-group' },
      h('h2', { class: 'group-title' },
        key.startsWith('other:') ? key.slice(6) : bookTitle(key),
        h('span', { class: 'count' }, arr.length)),
      arr.map((q) => quoteBlock(q, { onMove: moveQuote })))));
  };

  const bookIds = [...new Set(quotes.map((q) => q.bookId || 'other'))];
  root.replaceChildren(
    h('div', { class: 'toolbar' },
      h('input', { type: 'search', placeholder: 'Alıntılarda ara', 'aria-label': 'Alıntılarda ara', oninput: (e) => { filter = e.target.value; draw(); } }),
      h('select', { 'aria-label': 'Kitap', onchange: (e) => { book = e.target.value; draw(); } },
        h('option', { value: '' }, `Bütün kitaplar (${quotes.length})`),
        bookIds.map((id) => h('option', { value: id }, id === 'other' ? 'Diğer alıntılar' : bookTitle(id)))),
      h('span', { class: 'spacer' }),
      h('button', { type: 'button', class: 'btn', onclick: importQuotesFlow }, 'Dosyadan yeniden yükle')),
    list);
  draw();
}
