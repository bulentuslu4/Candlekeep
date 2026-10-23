// Ayarlar: tema, yedekle/yükle, alıntı dosyası, sıfırlama.

import { h, toast, download, readFile, today, openDrawer, closeDrawer } from '../util.js';
import * as store from '../store.js';
import { importQuotesFlow } from './quotes.js';

export const THEMES = [
  { id: 'parsomen', label: 'Parşömen', note: 'Eski kütüphane, mürekkep ve kâğıt' },
  { id: 'souls', label: 'Ateş ve kül', note: 'Karanlık, sade, altın çizgiler' },
  { id: 'modern', label: 'Gece mavisi', note: 'Modern ve temiz koyu tema' },
  { id: 'acik', label: 'Gün ışığı', note: 'Sade açık tema' },
];

export function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#000';
}

function fmtDate(t) {
  return t ? new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
}

function importBackupFlow() {
  const input = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    let text;
    try { text = await readFile(file); JSON.parse(text); } catch {
      toast('Dosya okunamadı. Candlekeep\'ten indirdiğin .json yedeğini seç.');
      return;
    }
    const doIt = (mode) => {
      try {
        store.importBackup(text, mode);
        closeDrawer();
        toast(mode === 'replace' ? 'Yedek yüklendi' : 'Yedek mevcut verilerle birleştirildi');
      } catch (e) { toast(e.message); }
    };
    openDrawer(h('div', { class: 'detail' },
      h('h2', null, 'Yedeği yükle'),
      h('p', null, 'Bu cihazdaki verilerle ne yapalım?'),
      h('div', { class: 'stack' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => doIt('replace') }, 'Yedekle değiştir'),
        h('p', { class: 'muted small' }, 'Bu cihazdaki her şey silinir, yedekteki gelir. Diğer cihazdan taşıyorsan bunu seç.'),
        h('button', { type: 'button', class: 'btn', onclick: () => doIt('merge') }, 'Birleştir'),
        h('p', { class: 'muted small' }, 'İkisini harmanlar. Aynı eser iki tarafta da varsa en son değiştirilen kalır.'))));
  };
  document.body.append(input);
  input.click();
  setTimeout(() => input.remove(), 60000);
}

function dupPanel(root) {
  const dups = store.duplicates();
  if (!dups.length) return null;
  const fmt = (i) => `${store.statusLabel(i.kind, i.status)}${i.rating != null ? ', ' + i.rating : ''}`;
  return h('section', { class: 'panel' },
    h('h2', null, 'Rafta iki kez duranlar'),
    h('p', null, 'Bunları önce elle eklemişsin, sonra katalogdan da işaretlemişsin. Hangisinin bilgilerini tutayım?'),
    dups.map(({ custom, catalog }) => h('div', { class: 'dup-row' },
      h('strong', null, catalog.title),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn', onclick: () => { store.mergeDuplicate(custom.id, catalog.id, 'custom'); toast('Birleştirildi'); renderSettings(root); } },
          `Elle eklediğim (${fmt(custom)})`),
        h('button', { type: 'button', class: 'btn', onclick: () => { store.mergeDuplicate(custom.id, catalog.id, 'catalog'); toast('Birleştirildi'); renderSettings(root); } },
          `Katalogdaki (${fmt(catalog)})`)))));
}

export function renderSettings(root) {
  const s = store.getState();
  const books = store.itemsOf('book').length;
  const games = store.itemsOf('game').length;
  const last = fmtDate(s.settings.lastBackup);

  root.replaceChildren(
    h('header', { class: 'page-head' }, h('h1', null, 'Ayarlar')),

    h('section', { class: 'panel' },
      h('h2', null, 'Tema'),
      h('div', { class: 'theme-grid' }, THEMES.map((t) => h('button', {
        type: 'button', class: 'theme-card' + (s.settings.theme === t.id ? ' on' : ''), 'data-theme': t.id,
        'aria-pressed': String(s.settings.theme === t.id),
        onclick: () => { store.setSetting('theme', t.id); applyTheme(t.id); renderSettings(root); },
      },
      h('span', { class: 'swatch' }, h('i'), h('i'), h('i')),
      h('span', { class: 'theme-name' }, t.label),
      h('span', { class: 'theme-note' }, t.note))))),

    h('section', { class: 'panel' },
      h('h2', null, 'Yedek'),
      h('p', null, `Verilerin sadece bu tarayıcıda duruyor: ${books} kitap, ${games} oyun, ${s.quotes.length} alıntı. `,
        'Telefonla bilgisayar arasında taşımak ya da tarayıcı verisi silinirse kurtarmak için yedek al.'),
      h('p', { class: last ? 'muted' : 'warn' }, last ? `Son yedek: ${last}` : 'Henüz hiç yedek almadın.'),
      h('div', { class: 'row' },
        h('button', {
          type: 'button', class: 'btn primary',
          onclick: () => { download(`candlekeep-yedek-${today()}.json`, store.exportBackup()); toast('Yedek indirildi'); renderSettings(root); },
        }, 'Yedeği indir'),
        h('button', { type: 'button', class: 'btn', onclick: importBackupFlow }, 'Yedekten yükle'))),

    dupPanel(root),

    h('section', { class: 'panel' },
      h('h2', null, 'Alıntı dosyası'),
      h('p', null, 'PDF, Word (.docx) ya da .txt halini yükle. Eşleşen kitaplar istersen rafa "Okudum" olarak eklenir.'),
      h('button', { type: 'button', class: 'btn', onclick: importQuotesFlow }, s.quotes.length ? 'Dosyayı yeniden yükle' : 'Alıntı dosyasını yükle')),

    h('section', { class: 'panel danger-zone' },
      h('h2', null, 'Sıfırla'),
      h('p', null, 'Raf, alıntılar ve ayarlar silinir, uygulama ilk günkü haline döner. Önce yedek almanı öneririm.'),
      h('button', {
        type: 'button', class: 'btn danger',
        onclick: () => {
          if (confirm('Her şey silinsin mi? Bu geri alınamaz.')) { store.resetAll(); applyTheme('parsomen'); toast('Sıfırlandı'); }
        },
      }, 'Her şeyi sil')),

    h('p', { class: 'muted small foot-note' }, 'Candlekeep, sürüm 2.0'));
}
