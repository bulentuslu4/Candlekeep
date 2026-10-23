// Eser detayı: durum, puan, not, ilerleme, etiketler, kapak, alıntılar.
// Var olan eserde her değişiklik kendiliğinden kaydedilir.

import { h, openDrawer, closeDrawer, toast, fmtRating } from '../util.js';
import * as store from '../store.js';
import { STATUS } from '../store.js';
import { CATEGORIES } from '../catalog/index.js';
import { coverBox, editionCovers } from '../covers.js';
import { quoteBlock } from './quotes.js';

const LANGS = [['TR', 'Türkçe'], ['EN', 'İngilizce'], ['DE', 'Almanca'], ['FR', 'Fransızca'], ['XX', 'Diğer']];
const PLATFORMS = ['PC', 'Mobil', 'PC + Mobil', 'Konsol'];

export function parseRating(v) {
  const s = String(v).trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 10) return undefined;
  return Math.round(n * 10) / 10;
}

export function openDetail(id) {
  const item = store.getItem(id);
  if (!item) return;
  render(item, false);
}

export function openNew(kind) {
  render({
    kind, title: '', titleTr: '', creator: '', series: '', seriesNo: null, category: '',
    platform: kind === 'game' ? 'PC' : '', tags: [], langs: [], status: kind === 'book' ? 'read' : 'played',
    rating: null, fav: false, progress: '', note: '', cover: '',
  }, true);
}

function render(item, isNew) {
  const draft = isNew ? item : null;
  const set = (patch) => {
    if (isNew) Object.assign(draft, patch);
    else store.updateItem(item.id, patch);
  };
  const cur = () => (isNew ? draft : store.getItem(item.id));

  const field = (label, control, hint) => h('label', { class: 'field' },
    h('span', { class: 'field-label' }, label), control, hint && h('span', { class: 'field-hint' }, hint));

  const text = (key, opts = {}) => h('input', {
    type: 'text', value: cur()[key] ?? '', placeholder: opts.placeholder || '',
    onchange: (e) => set({ [key]: e.target.value.trim() }),
  });

  /* Kapak */
  const coverWrap = h('div', { class: 'detail-cover' });
  const drawCover = () => coverWrap.replaceChildren(coverBox(cur(), { size: 'large' }));
  drawCover();
  const coverPicker = h('div', { class: 'cover-picker', hidden: true });
  const coverUrl = h('input', {
    type: 'url', placeholder: 'https://… görsel linki', value: cur().cover || '',
    onchange: (e) => { set({ cover: e.target.value.trim() }); drawCover(); },
  });

  async function showEditions() {
    coverPicker.hidden = false;
    coverPicker.replaceChildren(h('p', { class: 'muted' }, 'Baskılar aranıyor…'));
    try {
      const list = await editionCovers(cur());
      if (!list.length) {
        coverPicker.replaceChildren(h('p', { class: 'muted' }, 'Bu kitap için başka kapak bulunamadı. Beğendiğin bir görselin linkini aşağıya yapıştırabilirsin.'));
        return;
      }
      coverPicker.replaceChildren(
        h('p', { class: 'muted' }, `${list.length} baskı kapağı bulundu. Birine dokun.`),
        h('div', { class: 'cover-grid' }, list.map((c) => h('button', {
          class: 'cover-choice', type: 'button',
          onclick: () => { set({ cover: c.full }); coverUrl.value = c.full; drawCover(); toast('Kapak değişti'); },
        }, h('img', { src: c.thumb, alt: '', loading: 'lazy' })))));
    } catch {
      coverPicker.replaceChildren(h('p', { class: 'muted' }, 'Open Library şu an cevap vermiyor. Biraz sonra tekrar dene.'));
    }
  }

  /* Durum */
  const statusRow = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Durum' });
  const drawStatus = () => statusRow.replaceChildren(...STATUS[item.kind].map((s) => h('button', {
    type: 'button', role: 'radio', 'aria-checked': String(cur().status === s.id),
    class: 'seg-btn st-' + s.id + (cur().status === s.id ? ' on' : ''),
    onclick: () => { set({ status: s.id }); drawStatus(); },
  }, s.label)));
  drawStatus();

  /* Puan */
  const ratingInput = h('input', {
    type: 'text', inputmode: 'decimal', class: 'rating-input', placeholder: '–',
    value: fmtRating(cur().rating), 'aria-label': 'Puan (0–10)',
    onchange: (e) => {
      const r = parseRating(e.target.value);
      if (r === undefined) { toast('Puan 0 ile 10 arasında olmalı (ör. 8.5 ya da 9,2)'); e.target.value = fmtRating(cur().rating); return; }
      set({ rating: r });
      e.target.value = fmtRating(r);
    },
  });
  const favBtn = h('button', {
    type: 'button', class: 'fav-toggle' + (cur().fav ? ' on' : ''), 'aria-pressed': String(!!cur().fav),
    onclick: () => { const v = !cur().fav; set({ fav: v }); favBtn.classList.toggle('on', v); favBtn.setAttribute('aria-pressed', String(v)); },
  }, '♥ Favori');

  /* Diller */
  const langRow = h('div', { class: 'chips' });
  const drawLangs = () => langRow.replaceChildren(...LANGS.map(([code, label]) => {
    const on = (cur().langs || []).includes(code);
    return h('button', {
      type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': String(on), title: label,
      onclick: () => {
        const l = new Set(cur().langs || []);
        if (on) l.delete(code); else l.add(code);
        set({ langs: [...l] });
        drawLangs();
      },
    }, label);
  }));
  drawLangs();

  const cats = CATEGORIES[item.kind];
  const head = h('div', { class: 'detail-head' },
    coverWrap,
    h('div', { class: 'detail-title' },
      h('h2', null, cur().title || (isNew ? (item.kind === 'book' ? 'Yeni kitap' : 'Yeni oyun') : '')),
      cur().titleTr && h('p', { class: 'muted' }, cur().titleTr),
      cur().creator && h('p', { class: 'creator' }, cur().creator),
      h('div', { class: 'rating-row' },
        h('label', { class: 'rating-label' }, 'Puan', ratingInput, h('span', { class: 'muted' }, '/ 10')),
        favBtn)));

  const quotes = item.kind === 'book' && !isNew ? store.quotesFor(item.id) : [];

  const body = h('div', { class: 'detail' },
    head,
    h('section', { class: 'detail-sec' }, h('h3', null, 'Durum'), statusRow),
    h('section', { class: 'detail-sec grid-2' },
      field(item.kind === 'book' ? 'Nerede kaldım' : 'İlerleme', text('progress', { placeholder: item.kind === 'book' ? 'ör. 3. kısım, 42. bölüm' : 'ör. 2. bölge, NG+' }),
        'Quiz bu noktanın ötesinden soru sormayacak.'),
      field('Etiketler', h('input', {
        type: 'text', value: (cur().tags || []).join(', '), placeholder: 'virgülle ayır: grimdark, favori seri',
        onchange: (e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }),
      }))),
    item.kind === 'book'
      ? h('section', { class: 'detail-sec' }, h('h3', null, 'Hangi dilde okudum'), langRow)
      : h('section', { class: 'detail-sec' }, field('Platform', h('select', {
        value: cur().platform || 'PC', onchange: (e) => set({ platform: e.target.value }),
      }, PLATFORMS.map((p) => h('option', { value: p }, p))))),
    h('section', { class: 'detail-sec' },
      field('Notum', h('textarea', {
        rows: 4, placeholder: 'Aklında kalanlar, hisler, kime önerirsin…',
        onchange: (e) => set({ note: e.target.value }),
      }, cur().note || ''))),
    h('details', { class: 'detail-sec more', open: isNew },
      h('summary', null, 'Bilgiler ve kapak'),
      h('div', { class: 'grid-2' },
        field(item.kind === 'book' ? 'Ad (orijinal)' : 'Ad', text('title')),
        item.kind === 'book' && field('Türkçe adı', text('titleTr')),
        field(item.kind === 'book' ? 'Yazar' : 'Stüdyo', text('creator')),
        field('Kategori', h('select', { value: cur().category || '', onchange: (e) => set({ category: e.target.value }) },
          h('option', { value: '' }, 'Diğer'), cats.map((c) => h('option', { value: c.id }, c.label)))),
        field('Seri', text('series')),
        field('Serideki sırası', h('input', {
          type: 'text', inputmode: 'decimal', value: cur().seriesNo ?? '',
          onchange: (e) => { const n = parseFloat(e.target.value.replace(',', '.')); set({ seriesNo: Number.isFinite(n) ? n : null }); },
        })),
        item.kind === 'game' && field('Steam numarası', h('input', {
          type: 'text', inputmode: 'numeric', value: cur().steam ?? '', placeholder: 'mağaza linkindeki sayı',
          onchange: (e) => { const n = parseInt(e.target.value, 10); set({ steam: Number.isFinite(n) ? n : null }); drawCover(); },
        }))),
      h('div', { class: 'cover-tools' },
        item.kind === 'book' && !isNew && h('button', { type: 'button', class: 'btn', onclick: showEditions }, 'Başka baskının kapağını seç'),
        field('Kendi kapak görselin', coverUrl, 'Bir görsele sağ tıklayıp "Görsel adresini kopyala" de, buraya yapıştır.'),
        cur().cover && h('button', {
          type: 'button', class: 'btn ghost',
          onclick: () => { set({ cover: '' }); coverUrl.value = ''; drawCover(); },
        }, 'Otomatik kapağa dön')),
      coverPicker),
    quotes.length > 0 && h('section', { class: 'detail-sec' },
      h('h3', null, `Alıntılarım (${quotes.length})`),
      h('div', { class: 'quote-list' }, quotes.map((q) => quoteBlock(q, { compact: true })))),
    h('footer', { class: 'detail-foot' },
      isNew
        ? h('button', {
          type: 'button', class: 'btn primary',
          onclick: () => {
            if (!draft.title.trim()) { toast('Önce bir ad yaz.'); return; }
            const created = store.createCustom(draft);
            closeDrawer();
            toast(`${created.title} rafa eklendi`);
          },
        }, 'Rafa ekle')
        : [
          h('span', { class: 'muted small' }, 'Değişiklikler kendiliğinden kaydedilir.'),
          h('button', {
            type: 'button', class: 'btn danger',
            onclick: () => {
              const removed = store.removeItem(item.id);
              closeDrawer();
              toast(`${removed.title} raftan kaldırıldı`, { label: 'Geri al', run: () => store.restoreItem(removed) });
            },
          }, 'Raftan kaldır'),
        ]));

  openDrawer(body);
}
