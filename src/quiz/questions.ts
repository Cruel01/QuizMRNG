import type { PowerupId, PowerupSpec, Question, QuizSettings } from './types';

export const ADMIN_PIN = '6767';
export const MAX_POWERUP_SLOTS = 2;

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  allowReplay: false,
  shuffleQuestions: false,
  shuffleOptions: false,
  questionLimit: 0,
  compactMode: false,
  adminPin: ADMIN_PIN,
};

export const DEFAULT_QUESTIONS: Question[] = [
  // KATEGORI 1: MANUSIA & HEWAN (10 Soal)
  {
    id: 'mh-01',
    category: 'Manusia & Hewan',
    type: 'MC',
    time: 25,
    question:
      'Hewan laut manakah yang memiliki tiga buah jantung dan darah berwarna biru karena mengandung tembaga (hemosianin)?',
    options: ['Gurita', 'Kuda Laut', 'Ubur-ubur', 'Bintang Laut'],
    answer: 0,
    explanation:
      'Gurita memiliki tiga jantung (dua memompa darah ke insang dan satu ke seluruh tubuh) serta darah berbasis tembaga yang tampak kebiruan.',
  },
  {
    id: 'mh-02',
    category: 'Manusia & Hewan',
    type: 'TF',
    time: 20,
    question:
      'Sidik jari setiap manusia di dunia bersifat unik, bahkan sepasang anak kembar identik pun memiliki pola sidik jari yang berbeda.',
    options: ['Benar (True)', 'Salah (False)'],
    answer: 0,
    explanation:
      'Meskipun kembar identik berbagi DNA yang sama, pola sidik jari terbentuk dari interaksi janin di dalam rahim sehingga tidak pernah sama persis.',
  },
  {
    id: 'mh-03',
    category: 'Manusia & Hewan',
    type: 'MS',
    time: 30,
    question:
      'Manakah dari hewan berikut yang merupakan mamalia bertelur (monotremata)? (Pilih 2 jawaban)',
    options: ['Platipus', 'Armadilo', 'Ekidna', 'Trenggiling'],
    answer: [0, 2],
    explanation:
      'Platipus dan ekidna (landak semut) dari Australia dan Papua adalah satu-satunya kelompok mamalia yang berkembang biak dengan bertelur.',
  },
  {
    id: 'mh-04',
    category: 'Manusia & Hewan',
    type: 'TEXT',
    time: 25,
    question:
      'Apa nama tulang terpanjang sekaligus terkuat di dalam tubuh manusia yang terletak di bagian paha?',
    acceptedAnswers: ['tulang paha', 'femur', 'tulang femur'],
    explanation:
      'Tulang paha (femur) adalah tulang terpanjang dan terkuat pada kerangka manusia yang menopang berat tubuh saat berdiri dan berjalan.',
  },
  {
    id: 'mh-05',
    category: 'Manusia & Hewan',
    type: 'MC',
    time: 25,
    question:
      'Burung kolibri dikenal sangat lincah di udara karena mampu melakukan kemampuan terbang unik yang tidak dimiliki burung lain, yaitu...',
    options: [
      'Terbang menembus awan badai',
      'Terbang mundur',
      'Terbang sambil tidur nyenyak',
      'Terbang tanpa mengepakkan sayap sama sekali',
    ],
    answer: 1,
    explanation:
      'Struktur sendi bahu kolibri memungkinkannya memutar sayap hingga 180 derajat sehingga bisa melayang diam dan terbang mundur.',
  },
  {
    id: 'mh-06',
    category: 'Manusia & Hewan',
    type: 'TF',
    time: 20,
    question:
      'Berang-berang laut sering berpegangan tangan saat tidur mengapung di permukaan air agar tidak saling hanyut terbawa arus.',
    options: ['Benar (True)', 'Salah (False)'],
    answer: 0,
    explanation:
      'Berang-berang laut saling menggenggam tangan atau melilitkan tubuhnya dengan rumput laut agar tetap bersama kelompoknya saat tertidur.',
  },
  {
    id: 'mh-07',
    category: 'Manusia & Hewan',
    type: 'MS',
    time: 30,
    question:
      'Manakah dari organ tubuh manusia berikut yang berperan langsung menyaring racun dan limbah dari darah? (Pilih 2 jawaban)',
    options: ['Hati (Liver)', 'Lambung', 'Ginjal', 'Pankreas'],
    answer: [0, 2],
    explanation:
      'Hati menetralisir zat beracun dalam darah, sementara ginjal menyaring limbah metabolisme untuk dibuang melalui urine.',
  },
  {
    id: 'mh-08',
    category: 'Manusia & Hewan',
    type: 'MC',
    time: 25,
    question:
      "Hewan amfibi asal Meksiko yang dijuluki 'ikan berjalan' dan mampu menumbuhkan kembali anggota tubuhnya yang putus adalah...",
    options: ['Axolotl', 'Salamander Api', 'Katak Kaca', 'Kadal Air'],
    answer: 0,
    explanation:
      'Axolotl memiliki kemampuan regenerasi luar biasa untuk menumbuhkan kembali kaki, ekor, bahkan sebagian jaringan jantung dan otaknya.',
  },
  {
    id: 'mh-09',
    category: 'Manusia & Hewan',
    type: 'TEXT',
    time: 25,
    question:
      'Pigmen alami pada kulit, rambut, dan iris mata manusia yang berfungsi melindungi kulit dari sinar ultraviolet matahari disebut...',
    acceptedAnswers: ['melanin', 'zat melanin'],
    explanation:
      'Melanin adalah pigmen yang diproduksi sel melanosit untuk menentukan warna kulit serta menyerap radiasi sinar UV.',
  },
  {
    id: 'mh-10',
    category: 'Manusia & Hewan',
    type: 'MC',
    time: 25,
    question:
      'Hewan darat manakah yang memiliki indra penciuman luar biasa tajam hingga mampu mendeteksi sumber air dari jarak belasan kilometer?',
    options: ['Gajah Afrika', 'Kuda Nil', 'Banteng', 'Zebra'],
    answer: 0,
    explanation:
      'Gajah memiliki sekitar 2.000 gen reseptor penciuman—jauh lebih banyak daripada anjing—yang memungkinkannya mencium bau air dari kejauhan.',
  },

  // KATEGORI 2: LOGIKA & HITUNGAN (10 Soal)
  {
    id: 'lh-01',
    category: 'Logika & Hitungan',
    type: 'MC',
    time: 25,
    question:
      'Ada 7 lilin menyala di ruang tamu, lalu 2 lilin padam tertiup angin. Jika pintu ditutup rapat agar tidak ada angin masuk lagi, berapa lilin yang tersisa keesokan paginya?',
    options: ['5 lilin', '7 lilin', '2 lilin', '0 lilin'],
    answer: 2,
    explanation:
      '5 lilin yang tetap menyala akan habis meleleh terbakar semalaman, sehingga hanya tersisa 2 lilin yang tadi padam.',
  },
  {
    id: 'lh-02',
    category: 'Logika & Hitungan',
    type: 'TF',
    time: 25,
    question:
      'Jika dibutuhkan waktu 5 menit untuk merebus 1 butir telur hingga matang, maka untuk merebus 5 butir telur sekaligus di panci yang sama dibutuhkan waktu 25 menit.',
    options: ['Benar (True)', 'Salah (False)'],
    answer: 1,
    explanation:
      'Kelima telur direbus secara bersamaan dalam satu panci, sehingga waktunya tetap 5 menit.',
  },
  {
    id: 'lh-03',
    category: 'Logika & Hitungan',
    type: 'TEXT',
    time: 25,
    question:
      'Perhatikan deret angka berikut: 1, 1, 2, 3, 5, 8, ... Berapakah angka berikutnya dalam barisan Fibonacci ini?',
    acceptedAnswers: ['13', 'tiga belas'],
    explanation:
      'Setiap angka pada deret Fibonacci merupakan hasil penjumlahan dua angka sebelumnya: 5 + 8 = 13.',
  },
  {
    id: 'lh-04',
    category: 'Logika & Hitungan',
    type: 'MC',
    time: 30,
    question:
      'Di dalam sebuah laci gelap terdapat 10 kaus kaki hitam dan 10 kaus kaki putih yang tercampur acak. Berapa jumlah minimal kaus kaki yang harus diambil agar pasti mendapatkan 1 pasang warna yang sama?',
    options: ['2 buah', '3 buah', '11 buah', '12 buah'],
    answer: 1,
    explanation:
      'Dengan mengambil 3 buah kaus kaki, karena hanya ada 2 pilihan warna (hitam atau putih), minimal pasti ada 2 buah yang warnanya sama.',
  },
  {
    id: 'lh-05',
    category: 'Logika & Hitungan',
    type: 'MS',
    time: 30,
    question:
      'Manakah dari bilangan berikut yang merupakan bilangan prima (hanya habis dibagi 1 dan dirinya sendiri)? (Pilih 2 jawaban)',
    options: ['27', '29', '31', '33'],
    answer: [1, 2],
    explanation:
      '29 dan 31 adalah bilangan prima, sedangkan 27 habis dibagi 3 dan 9, serta 33 habis dibagi 3 dan 11.',
  },
  {
    id: 'lh-06',
    category: 'Logika & Hitungan',
    type: 'TEXT',
    time: 25,
    question:
      'Aku selalu berada di depanmu setiap saat, tetapi kamu tidak akan pernah bisa melihat atau menyentuhku. Siapakah aku?',
    acceptedAnswers: ['masa depan', 'future'],
    explanation:
      'Masa depan selalu berada di depan perjalanan waktu kita, namun tidak pernah terlihat wujudnya secara langsung.',
  },
  {
    id: 'lh-07',
    category: 'Logika & Hitungan',
    type: 'MC',
    time: 30,
    question:
      'Harga sebuah buku tulis dan sebuah pensil jika dibeli bersama adalah Rp11.000. Harga buku tulis Rp10.000 lebih mahal daripada pensil. Berapa harga pensilnya?',
    options: ['Rp1.000', 'Rp500', 'Rp1.500', 'Rp2.000'],
    answer: 1,
    explanation:
      'Jika pensil Rp500 dan buku tulis Rp10.500, selisihnya tepat Rp10.000 dan total harganya Rp11.000.',
  },
  {
    id: 'lh-08',
    category: 'Logika & Hitungan',
    type: 'TF',
    time: 20,
    question:
      'Di dalam kalender Masehi satu tahun penuh, terdapat tepat 7 bulan yang memiliki jumlah tanggal sampai 31 hari.',
    options: ['Benar (True)', 'Salah (False)'],
    answer: 0,
    explanation:
      'Ketujuh bulan yang memiliki 31 hari adalah Januari, Maret, Mei, Juli, Agustus, Oktober, dan Desember.',
  },
  {
    id: 'lh-09',
    category: 'Logika & Hitungan',
    type: 'MC',
    time: 30,
    question: 'Berapakah hasil dari operasi hitung berikut: 24 ÷ 4 × (2 + 1)?',
    options: ['2', '18', '9', '12'],
    answer: 1,
    explanation:
      'Hitung dalam kurung dulu (2 + 1 = 3), lalu kerjakan pembagian dan perkalian dari kiri ke kanan: 24 ÷ 4 = 6, kemudian 6 × 3 = 18.',
  },
  {
    id: 'lh-10',
    category: 'Logika & Hitungan',
    type: 'MS',
    time: 30,
    question:
      'Manakah dari pernyataan berikut yang menghasilkan nilai tepat sama dengan 25% dari 200? (Pilih 2 jawaban)',
    options: [
      'Seperempat dari 200',
      'Angka 50',
      'Angka 25',
      'Setengah dari 80',
    ],
    answer: [0, 1],
    explanation: '25% sama dengan 1/4, dan 1/4 × 200 = 50.',
  },

  // KATEGORI 3: WAWASAN NUSANTARA (10 Soal)
  {
    id: 'wn-01',
    category: 'Wawasan Nusantara',
    type: 'MC',
    time: 25,
    question:
      'Taman Nasional Lorentz yang merupakan kawasan lindung terluas di Asia Tenggara dan memiliki gletser salju abadi terletak di pulau...',
    options: ['Papua', 'Kalimantan', 'Sulawesi', 'Sumatra'],
    answer: 0,
    explanation:
      'Taman Nasional Lorentz terletak di Papua dan membentang dari puncak gunung bersalju Puncak Jaya hingga perairan pesisir Laut Arafura.',
  },
  {
    id: 'wn-02',
    category: 'Wawasan Nusantara',
    type: 'TF',
    time: 20,
    question:
      'Komodo (Varanus komodoensis) hanya dapat ditemukan hidup secara alami di alam liar di Indonesia dan merupakan kadal terbesar di dunia.',
    options: ['Benar (True)', 'Salah (False)'],
    answer: 0,
    explanation:
      'Komodo adalah satwa endemik Indonesia yang hidup alami di Pulau Komodo, Rinca, Flores, Gili Motang, dan Padar.',
  },
  {
    id: 'wn-03',
    category: 'Wawasan Nusantara',
    type: 'MS',
    time: 30,
    question:
      'Manakah dari provinsi berikut yang terletak di Pulau Kalimantan? (Pilih 2 jawaban)',
    options: [
      'Kalimantan Timur',
      'Gorontalo',
      'Kalimantan Barat',
      'Bengkulu',
    ],
    answer: [0, 2],
    explanation:
      'Kalimantan Timur dan Kalimantan Barat berada di Pulau Kalimantan, sedangkan Gorontalo di Sulawesi dan Bengkulu di Sumatra.',
  },
  {
    id: 'wn-04',
    category: 'Wawasan Nusantara',
    type: 'TEXT',
    time: 25,
    question:
      'Alat musik petik tradisional khas Pulau Rote, Nusa Tenggara Timur, yang terbuat dari daun lontar berbentuk setengah lingkaran adalah...',
    acceptedAnswers: ['sasando', 'alat musik sasando'],
    explanation:
      'Sasando adalah alat musik berdawai dari Pulau Rote (NTT) yang menggunakan wadah resonansi dari anyaman daun lontar.',
  },
  {
    id: 'wn-05',
    category: 'Wawasan Nusantara',
    type: 'MC',
    time: 25,
    question:
      'Selat sempit yang menghubungkan Pulau Jawa bagian timur dengan Pulau Bali bagian barat adalah...',
    options: ['Selat Sunda', 'Selat Bali', 'Selat Lombok', 'Selat Makassar'],
    answer: 1,
    explanation:
      'Selat Bali memisahkan ujung timur Jawa (Banyuwangi) dengan ujung barat Bali (Gilimanuk).',
  },
  {
    id: 'wn-06',
    category: 'Wawasan Nusantara',
    type: 'TF',
    time: 20,
    question:
      'Candi Prambanan di perbatasan Yogyakarta dan Jawa Tengah merupakan kompleks candi Hindu terbesar di Indonesia yang didedikasikan untuk Trimurti.',
    options: ['Benar (True)', 'Salah (False)'],
    answer: 0,
    explanation:
      'Candi Prambanan dibangun pada abad ke-9 dan dipersembahkan untuk tiga dewa utama Hindu: Brahma, Wisnu, dan Siwa.',
  },
  {
    id: 'wn-07',
    category: 'Wawasan Nusantara',
    type: 'MC',
    time: 25,
    question:
      'Bunga raksasa endemik hutan Sumatra yang dikenal sebagai bunga tunggal terbesar di dunia tanpa akar, batang, maupun daun sejati adalah...',
    options: [
      'Bunga Bangkai Raksasa',
      'Rafflesia arnoldii',
      'Anggrek Hitam',
      'Edelweis Jawa',
    ],
    answer: 1,
    explanation:
      'Rafflesia arnoldii merupakan tumbuhan holoparasit dengan diameter bunga mekar dapat mencapai lebih dari 1 meter.',
  },
  {
    id: 'wn-08',
    category: 'Wawasan Nusantara',
    type: 'MS',
    time: 30,
    question:
      'Manakah dari tarian tradisional berikut yang berasal dari Provinsi Bali? (Pilih 2 jawaban)',
    options: ['Tari Kecak', 'Tari Saman', 'Tari Pendet', 'Tari Piring'],
    answer: [0, 2],
    explanation:
      'Tari Kecak dan Tari Pendet berasal dari Bali, sedangkan Tari Saman berasal dari Aceh dan Tari Piring dari Sumatera Barat.',
  },
  {
    id: 'wn-09',
    category: 'Wawasan Nusantara',
    type: 'TEXT',
    time: 25,
    question:
      'Semboyan resmi negara Indonesia yang tertulis pada pita yang dicengkeram oleh burung Garuda Pancasila adalah...',
    acceptedAnswers: ['bhinneka tunggal ika', 'bhineka tunggal ika'],
    explanation:
      "Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karya Mpu Tantular yang bermakna 'Berbeda-beda tetapi tetap satu jua'.",
  },
  {
    id: 'wn-10',
    category: 'Wawasan Nusantara',
    type: 'MC',
    time: 25,
    question:
      'Sungai terpanjang di Indonesia yang mengalir sepanjang lebih dari 1.100 kilometer melintasi Provinsi Kalimantan Barat adalah...',
    options: [
      'Sungai Mahakam',
      'Sungai Kapuas',
      'Sungai Musi',
      'Sungai Barito',
    ],
    answer: 1,
    explanation:
      'Sungai Kapuas di Kalimantan Barat memiliki panjang sekitar 1.143 km dan menjadi sungai terpanjang di Indonesia sekaligus di pulau manapun di dunia.',
  },
];

export const POWERUP_CATALOG: Record<PowerupId, PowerupSpec> = {
  DOUBLE_SCORE: {
    id: 'DOUBLE_SCORE',
    name: 'Skor 2x',
    kind: 'buff',
    rarity: 'LEGENDARY',
    weight: 10,
    desc: 'Menggandakan poin pada soal aktif ini!',
  },
  FIFTY_FIFTY: {
    id: 'FIFTY_FIFTY',
    name: '50:50',
    kind: 'buff',
    rarity: 'COMMON',
    weight: 25,
    desc: 'Menghapus 2 opsi jawaban yang salah.',
  },
  SHIELD: {
    id: 'SHIELD',
    name: 'Perisai',
    kind: 'buff',
    rarity: 'RARE',
    weight: 20,
    desc: 'Menangkal otomatis serangan Debuff lawan.',
  },
  FREEZE_LEADER: {
    id: 'FREEZE_LEADER',
    name: 'Bekukan #1',
    kind: 'debuff',
    rarity: 'RARE',
    weight: 20,
    desc: 'Membekukan layar peringkat #1 aktif selama 4 detik!',
  },
  GLITCH_SHUFFLE: {
    id: 'GLITCH_SHUFFLE',
    name: 'Acak Opsi',
    kind: 'debuff',
    rarity: 'COMMON',
    weight: 25,
    desc: 'Mengacak posisi tombol opsi lawan pada soal berikutnya.',
  },
};
