// Alıntı dosyasını (Word'den çıkan düz metin) alıntılara böler.
// Beklenen yapı (esnek):
//   BÖLÜM BAŞLIĞI (BÜYÜK HARF)
//   Türkçe metin
//   /
//   Orijinal metin
//   Kaynak satırı (ör. "A Game Of Thrones - Bran I - 20" ya da "-Way of Kings,Dalinar-66")
//   ------------------------------   (alıntılar arası ayraç)
//    *
//   * *                              (bölümler arası ayraç)

import { norm } from './util.js';

const SECTION_SPLIT = /^[ \t]*\*[ \t]*\n[ \t]*\*[ \t]*\*[ \t]*$/m;
const QUOTE_SPLIT = /^[ \t]*[-–—_]{5,}[ \t]*$/m;
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const TR_WORDS = /\b(ve|bir|bu|da|de|için|ama|gibi|diye|çok|değil|ne|ile)\b/gi;

function isHeadingLine(l) {
  const s = l.trim();
  if (s.length < 4 || s.length > 70) return false;
  if (!/[A-ZÇĞİÖŞÜ]/.test(s)) return false;
  if (/\.\s/.test(s) || /[.!?…"“”,;:]$/.test(s)) return false;
  return s === s.toLocaleUpperCase('tr');
}

// Bir bölüm metnini, önünde boş satır olan büyük harfli başlıklardan da böler
// (bazı başlıkların önünde "* * *" ayracı olmayabiliyor).
function splitByHeadings(lines) {
  const parts = [];
  let cur = { head: [], lines: [] };
  const hasBody = () => cur.lines.some((x) => x.trim());
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (isHeadingLine(l)) {
      const prev = i === 0 ? '' : lines[i - 1];
      const afterBreak = !prev.trim() || QUOTE_SPLIT_LINE.test(prev);
      if (cur.head.length && !hasBody() && cur.head.length < 3) {
        cur.head.push(l);
        continue;
      }
      if (afterBreak || !hasBody()) {
        if (cur.head.length || hasBody()) parts.push(cur);
        cur = { head: [l], lines: [] };
        continue;
      }
    }
    cur.lines.push(l);
  }
  if (cur.head.length || hasBody()) parts.push(cur);
  return parts;
}
const QUOTE_SPLIT_LINE = /^[ \t]*[-–—_]{5,}[ \t]*$/;

function looksLikeSource(l) {
  const s = l.trim();
  if (!s || s.length > 110) return false;
  if (/^page\s*\d+$/i.test(s) || /^sayfa\s*\d+$/i.test(s)) return true;
  if (/[.!?…"“”’'»]$/.test(s)) return false;
  if (/^[-–—]\s*\S/.test(s)) return true;
  if (/\bpage\s*\d+/i.test(s)) return true;
  return / [-–—] /.test(s) || (s.includes(',') && s.split(/\s+/).length <= 12);
}

function isTurkish(text) {
  if (TR_CHARS.test(text)) return true;
  return (text.match(TR_WORDS) || []).length >= 3;
}

// PDF/Word kopyalarında satır sonu boşlukla biten satırlar aslında aynı paragrafın devamıdır.
function clean(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    while (/\S[ \t]+$/.test(l) && i + 1 < lines.length) {
      let j = i + 1;
      if (!lines[j].trim() && j + 1 < lines.length && lines[j + 1].trim()) j++;
      if (!lines[j].trim()) break;
      l = l.replace(/[ \t]+$/, ' ') + lines[j].trimStart();
      i = j;
    }
    out.push(l.trimEnd());
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function prettyHeading(lines) {
  return lines
    .map((l) => l.trim().toLocaleLowerCase('en').replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()))
    .join(' — ');
}

function parseLocation(source) {
  const m = source.match(/page\s*(\d+)/i) || source.match(/sayfa\s*(\d+)/i);
  return m ? 's. ' + m[1] : '';
}

/**
 * @param {string} text  Dosyanın düz metni
 * @param {(s: string) => string|null} match  Kaynak satırından kitap kimliği bulan fonksiyon
 */
export function parseQuotes(text, match) {
  const src = String(text).replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
  const sections = src.split(SECTION_SPLIT);
  const quotes = [];
  let seq = 0;
  const stamp = Date.now().toString(36);

  for (const part of sections.flatMap((sec) => splitByHeadings(sec.split('\n')))) {
    const section = part.head.length ? prettyHeading(part.head) : '';
    const sectionBook = section ? match(section) : null;
    let current = sectionBook;
    const body = part.lines.join('\n');
    for (const chunk of body.split(QUOTE_SPLIT)) {
      let cl = chunk.split('\n');
      while (cl.length && !cl[cl.length - 1].trim()) cl.pop();
      while (cl.length && !cl[0].trim()) cl.shift();
      if (!cl.length) continue;

      let source = '';
      if (cl.length > 1 && looksLikeSource(cl[cl.length - 1])) {
        source = cl.pop().trim().replace(/^[-–—]\s*/, '');
      }
      const slash = cl.findIndex((l) => l.trim() === '/');
      let tr = '';
      let orig = '';
      if (slash >= 0) {
        let a = cl.slice(0, slash);
        while (a.length && !a[a.length - 1].trim()) a.pop();
        if (!source && a.length > 1 && looksLikeSource(a[a.length - 1])) source = a.pop().trim().replace(/^[-–—]\s*/, '');
        tr = clean(a);
        orig = clean(cl.slice(slash + 1));
        if (tr && !isTurkish(tr) && isTurkish(orig)) [tr, orig] = [orig, tr];
      } else {
        const t = clean(cl);
        if (isTurkish(t)) tr = t;
        else orig = t;
      }
      if (!tr && !orig) continue;
      if ((tr + orig).replace(/[\s*]/g, '').length < 12) continue;

      let bookId = source ? match(source) : null;
      if (bookId) current = bookId;
      else bookId = current;

      quotes.push({
        id: `q-${stamp}-${(seq++).toString(36)}`,
        bookId: bookId || null,
        section,
        source,
        loc: source ? parseLocation(source) : '',
        tr,
        orig,
      });
    }
  }
  return quotes;
}

/** Kitap listesinden eşleştirici kurar. books: [{id, title, titleTr, aliases}] */
export function makeMatcher(books) {
  const keys = [];
  for (const b of books) {
    for (const k of [b.title, b.titleTr, ...(b.aliases || [])]) {
      const n = norm(k);
      if (n.length >= 4) keys.push([n, b.id]);
    }
  }
  keys.sort((a, b) => b[0].length - a[0].length);
  return (s) => {
    const t = ' ' + norm(s) + ' ';
    for (const [k, id] of keys) if (t.includes(' ' + k + ' ')) return id;
    return null;
  };
}
