// Quiz paketleri. Her soru, `req` alanındaki eser rafında bitmiş olarak işaretliyse açılır;
// böylece okumadığın/oynamadığın yerden asla soru gelmez.
// d: zorluk (1 kolay, 2 orta, 3 zor). a[0] doğru cevaptır, şıklar ekranda karıştırılır.

const Q = (id, req, d, q, a, ex = '') => ({ id, req, d, q, a, ex });

const AGOT = 'b-a-game-of-thrones';
const ACOK = 'b-a-clash-of-kings';
const ASOS = 'b-a-storm-of-swords';
const AFFC = 'b-a-feast-for-crows';
const ADWD = 'b-a-dance-with-dragons';
const HEDGE = 'b-the-hedge-knight';
const WOK = 'b-the-way-of-kings';
const WOR = 'b-words-of-radiance';
const W1 = 'b-the-last-wish';
const W2 = 'b-sword-of-destiny';
const W3 = 'b-blood-of-elves';
const W4 = 'b-time-of-contempt';
const W5 = 'b-baptism-of-fire';
const W6 = 'b-the-tower-of-the-swallow';
const W7 = 'b-the-lady-of-the-lake';
const HP1 = 'b-harry-potter-and-the-philosopher-s-stone';
const HP3 = 'b-harry-potter-and-the-prisoner-of-azkaban';
const HP4 = 'b-harry-potter-and-the-goblet-of-fire';
const HP5 = 'b-harry-potter-and-the-order-of-the-phoenix';
const HP6 = 'b-harry-potter-and-the-half-blood-prince';
const HP7 = 'b-harry-potter-and-the-deathly-hallows';
const MC = 'b-le-comte-de-monte-cristo';
const BG3 = 'g-baldur-s-gate-3';
const ER = 'g-elden-ring';
const TW3 = 'g-the-witcher-3-wild-hunt';
const RDR2 = 'g-red-dead-redemption-2';

export const PACKS = [
  {
    id: 'asoiaf', universe: 'asoiaf', kind: 'book', title: 'A Song of Ice and Fire', sub: 'Ana seri ve Dunk & Egg',
    questions: [
      Q('agot-1', AGOT, 1, 'Stark Hanedanı\'nın sözü nedir?', ['Winter is Coming', 'Fire and Blood', 'Hear Me Roar', 'We Do Not Sow']),
      Q('agot-2', AGOT, 1, 'Bran\'ı kulenin penceresinden kim iter?', ['Jaime Lannister', 'Tyrion Lannister', 'Sandor Clegane', 'Theon Greyjoy']),
      Q('agot-3', AGOT, 2, 'Arya\'nın kılıcının adı nedir ve onu kim yaptırmıştır?', ['Needle, Jon', 'Needle, Syrio', 'Ice, Ned', 'Oathkeeper, Robb'], 'Jon, Winterfell\'den ayrılmadan önce verir.'),
      Q('agot-4', AGOT, 2, 'Syrio Forel hangi şehrin İlk Kılıcı\'ydı?', ['Braavos', 'Pentos', 'Volantis', 'Lys']),
      Q('agot-5', AGOT, 2, 'Daenerys\'e ejderha yumurtalarını düğün hediyesi olarak kim verir?', ['Magister Illyrio', 'Ser Jorah Mormont', 'Khal Drogo', 'Viserys']),
      Q('agot-6', AGOT, 3, 'Jon Arryn ölmeden önce hangi kitabı inceliyordu?', ['Yedi Krallık\'ın büyük hanedanlarının soy kütükleri', 'Ejderhaların tarihi', 'Valyria\'nın Kıyameti', 'Hisar\'ın tıp kitapları']),
      Q('agot-7', AGOT, 3, 'Eyrie\'de Tyrion\'un yerine düelloya çıkan kimdir?', ['Bronn', 'Ser Rodrik Cassel', 'Shagga', 'Ser Vardis Egen'], 'Rakibi Ser Vardis Egen\'dir.'),
      Q('agot-8', AGOT, 3, 'Khal Drogo\'yu iyileştirmeye çalışan maegi kimdir?', ['Mirri Maz Duur', 'Quaithe', 'Doreah', 'Irri']),
      Q('acok-1', ACOK, 1, 'Blackwater Savaşı\'nda Stannis\'in donanmasını yakan yeşil ateşin adı nedir?', ['Wildfire', 'Dragonfire', 'Greek fire', 'Shadowfire']),
      Q('acok-2', ACOK, 2, 'Theon Greyjoy hangi kaleyi ele geçirir?', ['Winterfell', 'Riverrun', 'Moat Cailin', 'The Twins']),
      Q('acok-3', ACOK, 2, 'Jaqen H\'ghar, Arya\'ya kaç ölüm borçludur?', ['Üç', 'İki', 'Bir', 'Yedi']),
      Q('acok-4', ACOK, 2, 'Stannis\'in yanından ayrılmayan kızıl rahibe kimdir?', ['Melisandre', 'Thoros', 'Quaithe', 'Kinvara']),
      Q('acok-5', ACOK, 3, 'Daenerys, Qarth\'ta hangi yapıya girer?', ['House of the Undying', 'House of Black and White', 'The Temple of the Graces', 'The Pyramid of Mhysa']),
      Q('acok-6', ACOK, 3, 'Jon\'un Frostfangs\'te birlikte keşfe çıktığı efsanevi korucu kimdir?', ['Qhorin Halfhand', 'Benjen Stark', 'Jeor Mormont', 'Alliser Thorne']),
      Q('asos-1', ASOS, 1, 'Robb Stark\'ın öldüğü düğün tarihe hangi adla geçer?', ['Red Wedding', 'Purple Wedding', 'Black Wedding', 'Grey Wedding']),
      Q('asos-2', ASOS, 2, 'Oberyn Martell yargılamada kime karşı dövüşür?', ['Gregor Clegane', 'Sandor Clegane', 'Ser Meryn Trant', 'Ser Ilyn Payne']),
      Q('asos-3', ASOS, 2, 'Jaime\'nin elinin kesilmesini kim emreder?', ['Vargo Hoat', 'Roose Bolton', 'Locke', 'Rorge'], 'Kılıcı sallayan Zollo\'dur.'),
      Q('asos-4', ASOS, 2, 'Sam, bir Öteki\'yi neyle öldürür?', ['Obsidyen (dragonglass) hançer', 'Valyria çeliği kılıç', 'Ateşli ok', 'Kadim bir balta']),
      Q('asos-5', ASOS, 3, 'Joffrey\'yi öldüren zehrin adı nedir?', ['The Strangler', 'Tears of Lys', 'Essence of Nightshade', 'Sweetsleep']),
      Q('asos-6', ASOS, 3, 'Daenerys, Unsullied ordusunu hangi şehirde satın alır?', ['Astapor', 'Yunkai', 'Meereen', 'Qarth']),
      Q('asos-7', ASOS, 3, 'Tywin Lannister nerede öldürülür?', ['Helada', 'Taht odasında', 'Yatağında', 'Septte']),
      Q('affc-1', AFFC, 1, 'Brienne bu kitap boyunca kimi arar?', ['Sansa Stark', 'Arya Stark', 'Jaime Lannister', 'Podrick Payne']),
      Q('affc-2', AFFC, 2, 'Arya Braavos\'ta hangi tapınağa katılır?', ['House of Black and White', 'Temple of the Moonsingers', 'Sept of Baelor', 'House of the Undying']),
      Q('affc-3', AFFC, 2, 'Sansa, Vale\'de hangi sahte adı kullanır?', ['Alayne Stone', 'Jeyne Poole', 'Lady Snow', 'Alys Karstark']),
      Q('affc-4', AFFC, 2, 'Sam, maester olmak için nereye gönderilir?', ['Oldtown\'daki Citadel', 'Braavos', 'Dragonstone', 'Highgarden']),
      Q('affc-5', AFFC, 3, 'Euron Greyjoy\'un lakabı nedir?', ['Crow\'s Eye', 'Kraken\'s Hand', 'The Reaver', 'Damphair']),
      Q('affc-6', AFFC, 3, 'Demir Adalar\'da yeni kralın seçildiği toplantının adı nedir?', ['Kingsmoot', 'Great Council', 'Driftwood Throne', 'Ironmeet']),
      Q('affc-7', AFFC, 3, 'Myrcella\'yı kraliçe ilan etme planını kim kurar?', ['Arianne Martell', 'Doran Martell', 'Obara Sand', 'Ellaria Sand']),
      Q('adwd-1', ADWD, 1, 'Daenerys bu kitapta hangi şehirde hüküm sürer?', ['Meereen', 'Astapor', 'Volantis', 'Pentos']),
      Q('adwd-2', ADWD, 2, '"Reek" adıyla anılan, Ramsay\'in esiri kimdir?', ['Theon Greyjoy', 'Jeyne Poole', 'Rickon Stark', 'Asha Greyjoy']),
      Q('adwd-3', ADWD, 2, 'Tyrion\'un yol arkadaşı Young Griff kim olduğunu iddia eder?', ['Aegon Targaryen', 'Viserys\'in oğlu', 'Daario Naharis', 'Jon Connington']),
      Q('adwd-4', ADWD, 3, 'Quentyn Martell\'i hangi ejderha yakar?', ['Rhaegal', 'Viserion', 'Drogon', 'Balerion']),
      Q('adwd-5', ADWD, 3, 'Cersei\'nin Red Keep\'e kadar çıplak yürütüldüğü cezanın adı nedir?', ['Kefaret yürüyüşü (walk of atonement)', 'Yedilerin Yargısı', 'Septon\'un Mili', 'İnancın Duruşması']),
      Q('hedge-1', HEDGE, 1, 'Dunk\'ın yanındaki küçük seyis Egg aslında kimdir?', ['Aegon Targaryen', 'Baelor Targaryen', 'Daeron Targaryen', 'Aerion Targaryen']),
      Q('hedge-2', HEDGE, 2, 'Hikâyedeki turnuva nerede düzenlenir?', ['Ashford', 'Harrenhal', 'Lannisport', 'Highgarden']),
      Q('hedge-3', HEDGE, 3, 'Dunk\'ın masumiyeti için yapılan yargılama türü nedir?', ['Yedilerin Yargılaması', 'Teke tek düello', 'Kralın Adaleti', 'Septonların Yargısı']),
    ],
  },
  {
    id: 'stormlight', universe: 'stormlight', kind: 'book', title: 'The Stormlight Archive', sub: 'The Way of Kings ve Words of Radiance',
    questions: [
      Q('wok-1', WOK, 1, 'Kaladin\'e eşlik eden spren\'in adı nedir?', ['Syl', 'Pattern', 'Wyndle', 'Glys']),
      Q('wok-2', WOK, 1, 'Kaladin\'in liderliğini yaptığı köprü ekibi hangisidir?', ['Bridge Four', 'Bridge Seventeen', 'Bridge Two', 'Bridge Eighteen']),
      Q('wok-3', WOK, 2, 'Shallan kimin öğrencisi olmak için Kharbranth\'a gelir?', ['Jasnah Kholin', 'Navani Kholin', 'Taravangian', 'Wit']),
      Q('wok-4', WOK, 2, 'Dalinar\'ın ilham aldığı, adını seriye de veren kitap hangisidir?', ['The Way of Kings', 'Words of Radiance', 'The Arts and Majesty', 'Codes of War']),
      Q('wok-5', WOK, 2, 'Parçalanmış Ovalar\'da orduların yarıştığı ödül nedir?', ['Uçurum canavarlarının mücevher kalpleri', 'Parça zırhlar', 'Kayıp şehirler', 'Fırtına ışığı küreleri']),
      Q('wok-6', WOK, 3, 'Kaladin\'in kaybettiği küçük kardeşinin adı nedir?', ['Tien', 'Lirin', 'Teft', 'Moash']),
      Q('wok-7', WOK, 3, 'Shallan, Jasnah\'tan hangi fabrial\'ı çalmayı planlar?', ['Soulcaster', 'Spanreed', 'Halfshard', 'Painrial']),
      Q('wok-8', WOK, 3, 'Szeth hangi lakapla anılır?', ['Assassin in White', 'Truthless of Gavilar', 'The Shardless', 'Herald\'s Shadow']),
      Q('wor-1', WOR, 1, 'Shallan\'ın desenli spren\'inin adı nedir?', ['Pattern', 'Syl', 'Ivory', 'Timbre']),
      Q('wor-2', WOR, 2, 'Shallan, Ghostbloods\'a sızarken hangi kimliğe bürünür?', ['Veil', 'Radiant', 'Tyn', 'Jasnah']),
      Q('wor-3', WOR, 2, 'Kaladin neden hapse atılır?', ['Kralın önünde Amaram\'ı suçlayıp ona meydan okuduğu için', 'Sadeas\'ın adamlarına saldırdığı için', 'Görevden kaçtığı için', 'Bir Shardblade çaldığı için']),
      Q('wor-4', WOR, 3, 'Dalinar\'ın ordusunun sonunda ulaştığı kayıp şehir hangisidir?', ['Urithiru', 'Feverstone Keep', 'Stormseat', 'Kholinar']),
      Q('wor-5', WOR, 3, 'Kitabın sonundaki çatışmada Syl, Kaladin için neye dönüşür?', ['Bir Shardblade\'e', 'Bir kalkana', 'Bir Parça zırha', 'Fırtına ışığına']),
    ],
  },
  {
    id: 'witcher', universe: 'witcher', kind: 'book', title: 'The Witcher', sub: 'Ana saga (1–7)',
    questions: [
      Q('wi-1', W1, 1, 'Ozanın İngilizce çevirideki adı nedir?', ['Dandelion', 'Buttercup', 'Daisy', 'Thistle'], 'Lehçe aslı Jaskier.'),
      Q('wi-2', W1, 1, 'Geralt\'ın bütün atlarına verdiği ad (İngilizce çeviride) nedir?', ['Roach', 'Kelpie', 'Pegasus', 'Scorpion']),
      Q('wi-3', W1, 2, 'Geralt ile Yennefer\'i bağlayan şey nedir?', ['Bir cine dilenen son dilek', 'Bir büyücü yemini', 'Kader Kılıcı', 'Bir elf laneti']),
      Q('wi-4', W2, 2, 'Ciri\'nin büyükannesi olan "Cintra\'nın Dişi Aslanı" kimdir?', ['Calanthe', 'Pavetta', 'Meve', 'Adda']),
      Q('wi-5', W3, 2, 'Witcher\'ların yetiştirildiği kale hangisidir?', ['Kaer Morhen', 'Aretuza', 'Stygga', 'Montecalvo']),
      Q('wi-6', W3, 3, 'Ciri\'nin taşıdığı, kehanetlerle anılan kan hangisidir?', ['Lara Dorren\'in soyundan gelen Kadim Kan', 'Cintra kraliyet kanı', 'Dryad kanı', 'Ejder kanı']),
      Q('wi-7', W4, 2, 'Büyücülerin toplantısının kanlı bir darbeye dönüştüğü ada hangisidir?', ['Thanedd', 'Skellige', 'Ard Skellig', 'Inis Vala']),
      Q('wi-8', W4, 3, 'Ciri\'nin katıldığı genç haydut çetesinin adı nedir?', ['The Rats', 'The Wolves', 'The Crows', 'The Foxes']),
      Q('wi-9', W5, 2, 'Geralt\'ın yol arkadaşları arasındaki vampir berber-cerrah kimdir?', ['Regis', 'Dettlaff', 'Orianna', 'Gharasham']),
      Q('wi-10', W5, 3, 'Ciri, çetedeyken hangi adı kullanır?', ['Falka', 'Zireael', 'Pavetta', 'Mistle']),
      Q('wi-11', W6, 3, 'Yaralı Ciri\'ye bataklıktaki kulübesinde bakan münzevi kimdir?', ['Vysogota', 'Bonhart', 'Vilgefortz', 'Avallac\'h']),
      Q('wi-12', W7, 3, 'Ciri\'nin içine düştüğü dünyadaki elflerin kralı kimdir?', ['Auberon Muircetach', 'Eredin', 'Avallac\'h', 'Francesca Findabair']),
      Q('wi-13', W3, 1, 'Ciri\'nin elf dilindeki adı "Zireael" ne anlama gelir?', ['Kırlangıç', 'Kartal', 'Yıldız', 'Kurt']),
    ],
  },
  {
    id: 'hp', universe: 'hp', kind: 'book', title: 'Harry Potter', sub: '7 kitap',
    questions: [
      Q('hp-1', HP1, 1, 'Harry\'nin baykuşunun adı nedir?', ['Hedwig', 'Errol', 'Pigwidgeon', 'Hermes']),
      Q('hp-2', HP1, 1, 'Harry, Quidditch takımında hangi mevkide oynar?', ['Arayıcı', 'Vurucu', 'Avcı', 'Tutucu']),
      Q('hp-3', HP3, 2, 'Sirius Black\'in animagus biçimi nedir?', ['Büyük siyah bir köpek', 'Geyik', 'Fare', 'Kedi']),
      Q('hp-4', HP4, 2, 'Harry\'nin adını Ateş Kadehi\'ne kim atar?', ['Barty Crouch Jr.', 'Igor Karkaroff', 'Ludo Bagman', 'Peter Pettigrew']),
      Q('hp-5', HP5, 2, 'Dumbledore\'un Ordusu nerede toplanır?', ['İhtiyaç Odası', 'Sırlar Odası', 'Bağıran Baraka', 'Astronomi Kulesi']),
      Q('hp-6', HP6, 2, '"Melez Prens" kimdir?', ['Severus Snape', 'Tom Riddle', 'Remus Lupin', 'Horace Slughorn']),
      Q('hp-7', HP6, 3, 'Voldemort ruhunu kaç parçaya bölmeyi hedefler?', ['Yedi', 'Altı', 'Üç', 'On üç']),
      Q('hp-8', HP7, 3, 'Hufflepuff\'ın kupası nerede saklanmaktadır?', ['Bellatrix\'in Gringotts kasasında', 'Gaunt\'ların evinde', 'Hogwarts\'ta', 'Malfoy Malikânesi\'nde']),
      Q('hp-9', HP7, 2, 'Hangisi Ölüm Yadigârları\'ndan biri değildir?', ['Felsefe Taşı', 'Mürver Asa', 'Diriliş Taşı', 'Görünmezlik Pelerini']),
      Q('hp-10', HP3, 3, 'Harry\'nin Patronus\'u hangi biçimdedir?', ['Geyik', 'Köpek', 'Su samuru', 'Anka kuşu']),
    ],
  },
  {
    id: 'monte', universe: 'monte', kind: 'book', title: 'The Count of Monte Cristo', sub: 'Alexandre Dumas',
    questions: [
      Q('mc-1', MC, 1, 'Edmond Dantès hangi kaleye hapsedilir?', ['Château d\'If', 'Bastille', 'Conciergerie', 'Mont-Saint-Michel']),
      Q('mc-2', MC, 1, 'Dantès\'e hapiste ders veren ve hazineyi anlatan rahip kimdir?', ['Abbé Faria', 'Abbé Busoni', 'Abbé Prévost', 'Lord Wilmore']),
      Q('mc-3', MC, 2, 'Dantès\'i ihbar eden mektubu kim yazar?', ['Danglars', 'Fernand', 'Caderousse', 'Villefort']),
      Q('mc-4', MC, 2, 'Mercédès, Dantès hapisteyken kiminle evlenir?', ['Fernand Mondego', 'Danglars', 'Villefort', 'Caderousse']),
      Q('mc-5', MC, 3, 'Felçli Noirtier çevresiyle nasıl anlaşır?', ['Gözleriyle', 'Yazarak', 'Bir zille', 'İşaret diliyle']),
      Q('mc-6', MC, 3, 'Romanın son satırındaki öğüt nedir?', ['Bekle ve umut et', 'Affet ve unut', 'Sabır her şeydir', 'İntikam soğuk yenir']),
    ],
  },
  {
    id: 'bg3', universe: 'bg3', kind: 'game', title: "Baldur's Gate 3", sub: 'Larian Studios',
    questions: [
      Q('bg-1', BG3, 1, 'Oyunun başında beynine yerleştirilen şey nedir?', ['Mind flayer iribaşı', 'Bir lanetli rün', 'Netherese küresi', 'Şeytan sözleşmesi']),
      Q('bg-2', BG3, 1, 'Seni kaçıran uçan gemi türü nedir?', ['Nautiloid', 'Spelljammer', 'Githyanki ejderhası', 'Elemental gemi']),
      Q('bg-3', BG3, 2, 'Shadowheart başlangıçta hangi tanrıçaya hizmet eder?', ['Shar', 'Selûne', 'Lolth', 'Mystra']),
      Q('bg-4', BG3, 2, 'Astarion\'u vampir yapan efendisi kimdir?', ['Cazador Szarr', 'Raphael', 'Ketheric Thorm', 'Lord Gortash']),
      Q('bg-5', BG3, 2, 'Githyanki\'lerin lich kraliçesi kimdir?', ['Vlaakith', 'Orpheus', 'Voss', 'Lae\'zel']),
      Q('bg-6', BG3, 2, 'Hangisi Ölü Üçlü\'nün Seçilmişlerinden biri değildir?', ['Raphael', 'Ketheric Thorm', 'Enver Gortash', 'Orin']),
      Q('bg-7', BG3, 3, 'Gale\'in göğsünde taşıdığı tehlikeli şey nedir?', ['Netherese küresi', 'Bir Illithid iribaşı', 'Bir şeytan kalbi', 'Mystra\'nın gözyaşı']),
      Q('bg-8', BG3, 3, 'Karlach, Avernus\'ta hangi Arşidük\'ün savaşlarında savaşmıştır?', ['Zariel', 'Mephistopheles', 'Asmodeus', 'Bel']),
      Q('bg-9', BG3, 3, 'Wyll\'in sözleşme yaptığı şeytan patron kimdir?', ['Mizora', 'Haarlep', 'Raphael', 'Yurgir']),
    ],
  },
  {
    id: 'eldenring', universe: 'eldenring', kind: 'game', title: 'Elden Ring', sub: 'FromSoftware',
    questions: [
      Q('er-1', ER, 1, 'Oyuncu karakterinin unvanı nedir?', ['Tarnished', 'Unkindled', 'Chosen Undead', 'Hunter']),
      Q('er-2', ER, 1, 'Sana Torrent\'i veren ve yol gösteren kız kimdir?', ['Melina', 'Ranni', 'Fia', 'Nepheli']),
      Q('er-3', ER, 2, 'Elden Ring\'in kırılmasının ardından yarıgodların paylaştığı parçalar nedir?', ['Great Runes', 'Remembrances', 'Golden Seeds', 'Sacred Tears']),
      Q('er-4', ER, 2, 'Elden Ring\'in kırılmasının ardından çıkan savaşın adı nedir?', ['The Shattering', 'Night of the Black Knives', 'The Age of Fire', 'The Crumbling']),
      Q('er-5', ER, 2, 'General Radahn hangi unvanla anılır?', ['Starscourge', 'Lord of Blood', 'Omen King', 'Blade of Miquella']),
      Q('er-6', ER, 3, 'Malenia\'nın ikiz kardeşi kimdir?', ['Miquella', 'Mohg', 'Morgott', 'Rykard']),
      Q('er-7', ER, 3, 'Marika\'nın "diğer yarısı" olduğu ortaya çıkan kimdir?', ['Radagon', 'Godfrey', 'Rennala', 'Maliketh']),
      Q('er-8', ER, 3, 'Ranni\'nin sadık yarı kurt savaşçısı kimdir?', ['Blaidd', 'Iji', 'Seluvis', 'Alexander']),
    ],
  },
  {
    id: 'witcher3', universe: 'witcher3', kind: 'game', title: 'The Witcher 3: Wild Hunt', sub: 'Ek paketler dahil',
    questions: [
      Q('tw-1', TW3, 1, 'Geralt oyun boyunca kimi arar?', ['Ciri', 'Yennefer', 'Dandelion', 'Triss']),
      Q('tw-2', TW3, 1, 'Oyundaki kart oyununun adı nedir?', ['Gwent', 'Orbstone', 'Dice poker', 'Pazaak']),
      Q('tw-3', TW3, 2, 'Wild Hunt\'ın kralı kimdir?', ['Eredin', 'Avallac\'h', 'Caranthir', 'Imlerith']),
      Q('tw-4', TW3, 2, 'Velen\'deki Bloody Baron kimleri aramaktadır?', ['Karısını ve kızını', 'Kayıp oğlunu', 'Kardeşini', 'Çalınan hazinesini']),
      Q('tw-5', TW3, 2, 'Crookback Bog\'daki üç cadı hangi adla bilinir?', ['Ladies of the Wood', 'Sisters of Fate', 'The Weavers', 'Mothers of Velen']),
      Q('tw-6', TW3, 3, 'Hearts of Stone\'da Geralt\'ın sözleşme yaptığı gizemli adam kimdir?', ['Gaunter O\'Dimm', 'Olgierd von Everec', 'Shani', 'Ewald Borsodi']),
      Q('tw-7', TW3, 3, 'Blood and Wine hangi düklükte geçer?', ['Toussaint', 'Kovir', 'Nilfgaard', 'Redania']),
      Q('tw-8', TW3, 3, 'Kral Bran\'ın ardından Skellige tahtı için yarışan an Craite kardeşler kimlerdir?', ['Hjalmar ve Cerys', 'Svanrige ve Udalryk', 'Crach ve Birna', 'Holger ve Madman Lugos']),
    ],
  },
  {
    id: 'rdr2', universe: 'rdr2', kind: 'game', title: 'Red Dead Redemption 2', sub: 'Rockstar Games',
    questions: [
      Q('rd-1', RDR2, 1, 'Çetenin lideri kimdir?', ['Dutch van der Linde', 'Hosea Matthews', 'Micah Bell', 'Arthur Morgan']),
      Q('rd-2', RDR2, 1, 'Çetenin kaçmasına yol açan başarısız soygun hangi kasabadadır?', ['Blackwater', 'Valentine', 'Rhodes', 'Strawberry']),
      Q('rd-3', RDR2, 2, 'Oyunun başında çetenin sığındığı karlı dağlık bölge hangisidir?', ['Colter', 'Annesburg', 'Tumbleweed', 'Emerald Ranch']),
      Q('rd-4', RDR2, 2, 'Arthur\'a konan hastalık teşhisi nedir?', ['Tüberküloz', 'Kolera', 'Sarıhumma', 'Sıtma']),
      Q('rd-5', RDR2, 2, 'Çeteyi kovalayan Pinkerton ajanı kimdir?', ['Andrew Milton', 'Leopold Strauss', 'Leviticus Cornwall', 'Angelo Bronte']),
      Q('rd-6', RDR2, 3, 'Arthur\'ın eski sevgilisi kimdir?', ['Mary Linton', 'Sadie Adler', 'Abigail Roberts', 'Tilly Jackson']),
      Q('rd-7', RDR2, 3, 'Çeteye ihanet eden muhbir kimdir?', ['Micah Bell', 'Bill Williamson', 'Javier Escuella', 'Sean MacGuire']),
      Q('rd-8', RDR2, 3, 'Sonsözde John\'un çiftliğini kurduğu yer neresidir?', ['Beecher\'s Hope', 'Hanging Dog Ranch', 'Pronghorn Ranch', 'Clawson\'s Rest']),
    ],
  },
];
