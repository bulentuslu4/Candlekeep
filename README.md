# Kütüphane

Kitap ve oyun rafım. GitHub Pages'te çalışan, build gerektirmeyen tek sayfalık uygulama.

## Klasörler

```
index.html            sayfa iskeleti
css/style.css         bütün stiller ve 4 tema
js/main.js            giriş, sekmeler arası geçiş
js/store.js           veri (localStorage), yedekle/yükle, olay geçmişi
js/covers.js          kapaklar (Open Library + Steam)
js/quotes-parser.js   alıntı dosyasını ayrıştırma
js/util.js            küçük yardımcılar
js/catalog/books.js   Keşfet'teki kitap listesi
js/catalog/games.js   Keşfet'teki oyun listesi
js/catalog/index.js   katalog birleştirme + ilk açılış listesi
js/views/             ekranlar: shelf, discover, quotes, settings, detail
```

## Notlar

- Veriler sadece tarayıcında durur. Repoya hiçbir kişisel veri gitmez; alıntı dosyası da yalnızca tarayıcıda işlenir.
- Cihaz değiştirirken: Ayarlar > Yedeği indir, öbür cihazda Yedekten yükle.
- Kataloğa eser eklemek için `books.js` / `games.js` içine aynı biçimde yeni satır ekle.
- Bilgisayarda denemek için klasörde `python -m http.server` çalıştırıp `http://localhost:8000` aç. `index.html`'e çift tıklamak modüller yüzünden çalışmaz.
