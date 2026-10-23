// PDF'ten düz metin çıkarır (pdf.js ile). Satır kaydırmalarını geri birleştirebilmek için
// sağ kenara kadar dolu satırların sonuna boşluk bırakır; ayrıştırıcı bunları paragrafa çevirir.

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

const MARKER = /^\s*(\/|[-–—_]{5,}|\*|\*\s*\*)\s*$/;

/** pages: [[{str, x, y, w}]] — sayfa sayfa metin parçaları */
export function linesFromPages(pages) {
  const out = [];
  for (const items of pages) {
    // Aynı yükseklikteki parçaları satırlarda topla
    const rows = [];
    for (const it of items) {
      if (!it.str) continue;
      let row = rows.find((r) => Math.abs(r.y - it.y) < 2.5);
      if (!row) rows.push((row = { y: it.y, parts: [] }));
      row.parts.push(it);
    }
    rows.sort((a, b) => b.y - a.y);
    const lines = rows.map((r) => {
      r.parts.sort((a, b) => a.x - b.x);
      let text = '';
      let end = null;
      for (const p of r.parts) {
        if (end !== null && p.x - end > 1 && !text.endsWith(' ') && !p.str.startsWith(' ')) text += ' ';
        text += p.str;
        end = p.x + p.w;
      }
      return { text: text.replace(/\s+$/, ''), left: r.parts[0].x, right: end, y: r.y };
    }).filter((l) => l.text.trim());

    // Sayfa numaralarını at (sayfanın ilk/son satırında tek başına duran sayı)
    for (const i of [0, lines.length - 1]) {
      if (lines[i] && /^\d{1,4}$/.test(lines[i].text.trim())) lines[i].drop = true;
    }
    const body = lines.filter((l) => !l.drop);
    if (!body.length) continue;
    const left = Math.min(...body.map((l) => l.left));
    const right = Math.max(...body.map((l) => l.right));
    const full = right - (right - left) * 0.1;

    body.forEach((l, i) => {
      const next = body[i + 1]?.text || '';
      const nextStartsNew = MARKER.test(next) || /^(page|sayfa)\s*\d/i.test(next)
        || /^[-–—]\s*\S/.test(next) || (next.length > 3 && next === next.toLocaleUpperCase('tr') && /\p{Lu}/u.test(next));
      const wrapped = l.right >= full && !MARKER.test(l.text) && !nextStartsNew;
      out.push(l.text + (wrapped ? ' ' : ''));
    });
  }
  return out.join('\n');
}

async function loadLib() {
  if (window.pdfjsLib) return window.pdfjsLib;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PDFJS + 'pdf.min.js';
    s.onload = res;
    s.onerror = () => rej(new Error('PDF okuyucu yüklenemedi'));
    document.head.append(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
  return window.pdfjsLib;
}

export async function pdfToText(buffer, lib) {
  const pdfjs = lib || (await loadLib());
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    pages.push(tc.items.map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width })));
  }
  return linesFromPages(pages);
}
