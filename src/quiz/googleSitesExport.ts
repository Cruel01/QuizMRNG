import { ADMIN_PIN } from './questions';
import { FIREBASE_APP_ID, FIREBASE_CONFIG } from './firebaseSync';
import type { Question } from './types';

/**
 * Generates a self-contained single-file HTML document ready to be pasted into
 * Google Sites ("Embed -> Embed Code"), including:
 * - Current question bank (including any Admin CRUD edits)
 * - Fixed live sabotage targeting active in-game players (not just finished ones)
 * - Fixed Blob CSV download (works safely with '#' characters inside iframes)
 * - Fixed active buff/debuff HUD status indicators
 * - Google Sites iframe-friendly top-aligned layout and localStorage fallback
 */
export function generateGoogleSitesHtml(questions: Question[]): string {
  const serializedQuestions = JSON.stringify(questions, null, 2);
  const serializedConfig = JSON.stringify(FIREBASE_CONFIG, null, 2);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kuis Interaktif Nusantara &amp; Trivia</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    html, body {
      overflow-x: hidden;
      max-width: 100%;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background-color: #0b1120;
      color: #f1f5f9;
      -webkit-tap-highlight-color: transparent;
    }
    h1, h2, h3, .font-display { font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; }
    .tabular-num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
    .surface-card {
      background: #131c31;
      border: 1px solid #23304c;
    }
    .option-btn { transition: transform 0.16s ease, background-color 0.16s ease, border-color 0.16s ease; touch-action: manipulation; }
    .option-btn:hover:not(:disabled) { transform: translateY(-1px); }
    .option-btn:active:not(:disabled) { transform: scale(0.985); }
    @keyframes glitchShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
    @keyframes hourglassFlip { 0%, 55% { transform: rotate(0deg); } 75%, 100% { transform: rotate(180deg); } }
    @keyframes sandDrop { 0% { transform: translateY(-2px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(6px); opacity: 0; } }
    @keyframes radarPing { 0% { transform: scale(0.75); opacity: 0.7; } 100% { transform: scale(1.65); opacity: 0; } }
    @keyframes flameDance { 0%, 100% { transform: scale(1) rotate(-2deg); } 50% { transform: scale(1.1) rotate(3deg); } }
    @keyframes floatGentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    .glitch-active { animation: glitchShake 0.35s ease-in-out 2; }
    .anim-hourglass-flip { transform-origin: center; animation: hourglassFlip 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
    .anim-sand-drop { animation: sandDrop 1.4s ease-in infinite; }
    .anim-radar-ping { transform-origin: center; animation: radarPing 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
    .anim-flame-dance { transform-origin: bottom center; animation: flameDance 1.1s ease-in-out infinite; }
    .anim-float-gentle { animation: floatGentle 2.6s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .glitch-active, .anim-hourglass-flip, .anim-sand-drop, .anim-radar-ping, .anim-flame-dance, .anim-float-gentle { animation: none; }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col items-center justify-start px-3 pt-4 pb-20 sm:p-6">
  <div class="w-full max-w-4xl mx-auto min-w-0">

    <!-- 1. LOBBY -->
    <section id="screen-start" class="surface-card rounded-2xl p-5 sm:p-10 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-extrabold shrink-0">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h1 class="text-xl sm:text-3xl font-extrabold tracking-tight text-white">Kuis Trivia Nusantara</h1>
            <p class="text-xs text-slate-400 mt-0.5"><span id="lobby-total-questions">${questions.length}</span> pertanyaan · Buff &amp; Debuff real-time</p>
          </div>
        </div>
        <div id="lobby-mode-text" class="text-xs font-semibold text-amber-300">Menunggu Admin memilih mode</div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-xs sm:text-sm">
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5 flex sm:block items-center justify-between">
          <span class="text-slate-400">Manusia &amp; Hewan</span>
          <div id="lobby-count-cat1" class="font-bold text-slate-100 mt-0.5 tabular-num">10 Soal</div>
        </div>
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5 flex sm:block items-center justify-between">
          <span class="text-slate-400">Logika &amp; Hitungan</span>
          <div id="lobby-count-cat2" class="font-bold text-slate-100 mt-0.5 tabular-num">10 Soal</div>
        </div>
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5 flex sm:block items-center justify-between">
          <span class="text-slate-400">Wawasan Nusantara</span>
          <div id="lobby-count-cat3" class="font-bold text-slate-100 mt-0.5 tabular-num">10 Soal</div>
        </div>
      </div>

      <div id="awaiting-admin-mode-banner" class="bg-[#0b1120] border border-slate-800 rounded-xl p-5 text-center mb-5">
        <div class="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 flex items-center justify-center mx-auto mb-2.5">
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 anim-hourglass-flip"><path d="M6 3h12M6 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7.5 3v3.8c0 2.1 1.6 3.7 3.7 4.7l.8.5.8-.5c2.1-1 3.7-2.6 3.7-4.7V3M7.5 21v-3.8c0-2.1 1.6-3.7 3.7-4.7l.8-.5.8.5c2.1 1 3.7 2.6 3.7 4.7V21" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13.5" r="0.95" fill="currentColor" class="anim-sand-drop"/><path d="M8.8 19.5c.8-1.4 2-2.2 3.2-2.2s2.4.8 3.2 2.2H8.8Z" fill="currentColor"/></svg>
        </div>
        <h3 class="font-bold text-base text-slate-100">Menunggu Penyelenggara (Admin)</h3>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">Halaman otomatis aktif begitu Admin membuka Mode Bebas atau Ruang Tunggu Live.</p>
      </div>

      <div id="lobby-input-container" class="hidden space-y-2 mb-5">
        <label for="player-name" class="block text-xs font-semibold text-slate-300">Nama Pemain / Tim</label>
        <input id="player-name" type="text" maxlength="20" placeholder="Masukkan namamu..."
          class="w-full px-4 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400">
        <p id="name-error" class="hidden text-rose-400 text-xs">Silakan masukkan nama terlebih dahulu.</p>
      </div>

      <div id="already-played-banner" class="hidden bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 text-center mb-5">
        <h3 class="font-bold text-base text-amber-300">Kuis Terkunci (Sudah Dikerjakan)</h3>
        <p id="already-played-info" class="text-xs sm:text-sm text-slate-300 mt-1"></p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <button id="btn-start-quiz" disabled onclick="handleLobbyStartClick()" class="flex-1 bg-slate-800 text-slate-500 font-bold py-3.5 px-6 rounded-xl cursor-not-allowed">
          Menunggu Admin...
        </button>
        <button id="btn-lobby-leaderboard" onclick="showLeaderboardOnly()" class="hidden bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 px-5 rounded-xl border border-slate-700 cursor-pointer">
          Lihat Leaderboard
        </button>
      </div>
    </section>

    <!-- 1B. WAITING ROOM -->
    <section id="screen-waiting-room" class="hidden surface-card rounded-2xl p-5 sm:p-10 text-center">
      <div class="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-3">
        <svg viewBox="0 0 32 32" fill="none" class="w-8 h-8"><circle cx="16" cy="16" r="10" stroke="currentColor" stroke-width="1.6" class="anim-radar-ping"/><circle cx="16" cy="16" r="4.5" fill="currentColor"/><path d="M9.5 11.2a8 8 0 0 0 0 9.6M22.5 11.2a8 8 0 0 1 0 9.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <h2 class="text-xl sm:text-3xl font-extrabold mb-2">Menunggu Admin Memulai Kuis</h2>
      <p class="text-slate-400 text-xs sm:text-sm mb-5">Kamu bergabung sebagai <strong id="waiting-my-name" class="text-amber-300">Pemain</strong>.</p>
      <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-4 max-w-lg mx-auto mb-5">
        <div class="flex justify-between text-xs font-semibold text-slate-400 mb-3">
          <span>Peserta di Ruang Tunggu</span>
          <span id="waiting-players-count" class="text-emerald-400 tabular-num">0 Bergabung</span>
        </div>
        <div id="waiting-players-list" class="flex flex-wrap justify-center gap-2 max-h-48 overflow-y-auto"></div>
      </div>
      <button onclick="leaveWaitingRoom()" class="text-xs text-slate-400 hover:text-white underline py-2 px-4 cursor-pointer">Keluar Ruang Tunggu</button>
    </section>

    <!-- 2. QUIZ -->
    <section id="screen-quiz" class="hidden space-y-3">
      <div class="surface-card rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <span id="question-counter" class="font-bold text-white tabular-num">1 / ${questions.length}</span>
          <span class="text-slate-600">·</span>
          <span id="category-badge" class="font-semibold text-amber-300">Kategori</span>
          <span class="text-slate-600 hidden sm:inline">·</span>
          <span id="question-type-label" class="hidden sm:inline text-slate-400">Multiple Choice</span>
        </div>
        <div class="flex items-center gap-3">
          <div id="active-status-pills" class="flex flex-wrap items-center gap-1.5 text-[11px] font-bold"></div>
          <div class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-300 tabular-num">
            <svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 text-amber-300 anim-hourglass-flip"><path d="M6 3h12M6 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7.5 3v3.8c0 2.1 1.6 3.7 3.7 4.7l.8.5.8-.5c2.1-1 3.7-2.6 3.7-4.7V3M7.5 21v-3.8c0-2.1 1.6-3.7 3.7-4.7l.8-.5.8.5c2.1 1 3.7 2.6 3.7 4.7V21" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13.5" r="0.95" fill="currentColor" class="anim-sand-drop"/></svg>
            <span id="timer-text" class="text-white">25</span>d
          </div>
          <div class="bg-[#0b1120] border border-slate-700 px-3 py-1 rounded-lg font-extrabold text-amber-400 tabular-num">
            <span id="current-score">0</span>
          </div>
        </div>
      </div>

      <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
        <div id="timer-bar" class="bg-amber-400 h-full transition-all duration-1000 ease-linear" style="width:100%"></div>
      </div>

      <div class="surface-card rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="text-xs text-slate-300">
          <strong class="text-amber-300">Streak: <span id="hud-streak-count" class="tabular-num">0</span>/<span id="hud-streak-target" class="tabular-num">8</span></strong>
          <span id="hud-milestone-hint" class="text-slate-400 ml-2"></span>
        </div>
        <div id="inventory-slots" class="grid grid-cols-2 gap-2 w-full sm:w-80"></div>
      </div>

      <div class="relative surface-card rounded-2xl p-5 sm:p-8 overflow-hidden">
        <div id="freeze-overlay" class="hidden absolute inset-0 z-30 bg-sky-950/95 flex flex-col items-center justify-center text-center p-6">
          <i class="fa-solid fa-snowflake text-4xl text-sky-300 mb-3 animate-bounce"></i>
          <h3 class="text-xl font-extrabold text-sky-200 mb-1">Layarmu Dibekukan!</h3>
          <p id="freeze-attacker-text" class="text-xs sm:text-sm text-sky-100/90 max-w-sm mb-3"></p>
          <div class="bg-sky-300 text-slate-950 font-extrabold px-4 py-1.5 rounded-lg text-xs">
            Mencair dalam <span id="freeze-countdown">4</span> detik...
          </div>
        </div>

        <h2 id="question-text" class="text-lg sm:text-2xl font-bold leading-snug mb-6 text-white"></h2>
        <div id="options-container" class="space-y-2.5"></div>
        <div id="submit-action-container" class="mt-5 hidden">
          <button onclick="submitComplexAnswer()" class="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3.5 rounded-xl cursor-pointer">Kirim Jawaban</button>
        </div>

        <div id="feedback-box" class="hidden mt-5 p-4 rounded-xl border">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <h3 id="feedback-title" class="font-bold text-sm sm:text-base"></h3>
            <span id="feedback-points" class="text-xs font-extrabold tabular-num"></span>
          </div>
          <p id="feedback-explanation" class="text-xs sm:text-sm text-slate-200 leading-relaxed"></p>
          <button onclick="nextQuestion()" class="mt-4 w-full bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-sm py-3 rounded-xl cursor-pointer">Lanjut Soal Berikutnya</button>
        </div>
      </div>
    </section>

    <!-- 3. LEADERBOARD -->
    <section id="screen-leaderboard" class="hidden surface-card rounded-2xl p-5 sm:p-10">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl sm:text-3xl font-extrabold">Papan Peringkat</h2>
          <p class="text-xs sm:text-sm text-slate-400">Klasemen skor tertinggi peserta secara real-time</p>
        </div>
        <div class="flex gap-2">
          <button onclick="manualRefreshLeaderboard()" class="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer">Refresh</button>
          <button onclick="backToLockedLobby()" class="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer">Beranda</button>
        </div>
      </div>

      <div id="player-result-card" class="hidden bg-[#0b1120] border border-slate-800 rounded-xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div class="text-xs text-slate-400">Hasil Permainanmu</div>
          <div id="result-player-name" class="text-lg font-extrabold text-white"></div>
        </div>
        <div class="flex items-center gap-6 tabular-num">
          <div><div class="text-xs text-slate-400">Benar</div><div id="result-correct-count" class="text-lg font-extrabold text-emerald-400"></div></div>
          <div><div class="text-xs text-slate-400">Skor</div><div id="result-total-score" class="text-xl font-extrabold text-amber-400"></div></div>
        </div>
      </div>

      <div class="bg-[#0b1120] border border-slate-800 rounded-xl overflow-hidden mb-6">
        <div class="grid grid-cols-12 px-4 py-2.5 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div class="col-span-2 text-center">Rank</div>
          <div class="col-span-5">Nama</div>
          <div class="col-span-2 text-center">Benar</div>
          <div class="col-span-3 text-right">Skor</div>
        </div>
        <div id="leaderboard-list" class="divide-y divide-slate-800/80 max-h-80 overflow-y-auto"></div>
      </div>

      <div id="answer-review-section" class="hidden">
        <h3 class="text-base sm:text-lg font-extrabold mb-3">Kunci Jawaban &amp; Pembahasan</h3>
        <div id="answer-review-list" class="space-y-2.5 max-h-96 overflow-y-auto"></div>
      </div>
    </section>

    <!-- 4. ADMIN DASHBOARD -->
    <section id="screen-admin" class="hidden surface-card rounded-2xl p-5 sm:p-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <h2 class="text-xl sm:text-2xl font-extrabold">Panel Penyelenggara (Admin)</h2>
          <p class="text-xs text-slate-400">Kontrol mode sesi, statistik peserta, dan ekspor CSV</p>
        </div>
        <div class="flex gap-2">
          <button onclick="exportAdminCSV()" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2 px-3.5 rounded-lg cursor-pointer">Unduh CSV</button>
          <button onclick="closeAdminDashboard()" class="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg cursor-pointer">Tutup</button>
        </div>
      </div>

      <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-4 mb-6 space-y-3">
        <div class="flex flex-wrap gap-2">
          <button id="btn-mode-free" onclick="setSessionMode('free')" class="px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer">Mode Bebas</button>
          <button id="btn-mode-live-wait" onclick="setSessionMode('live_waiting')" class="px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer">Buka Lobby Live</button>
          <button id="btn-mode-live-start" onclick="setSessionMode('live_started')" class="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer">Mulai Live Sekarang</button>
          <button onclick="resetSessionModeSelection()" class="px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-500/30 cursor-pointer">Reset Mode</button>
          <button onclick="confirmResetLeaderboard()" class="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 text-rose-300 border border-slate-700 cursor-pointer">Reset Semua Skor</button>
        </div>
        <div id="admin-lock-status-banner" class="text-xs text-amber-300"></div>
        <div class="text-xs text-slate-400">Ruang tunggu live: <strong id="admin-waiting-count" class="text-white">0 orang</strong> <span id="admin-waiting-names"></span></div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 tabular-num">
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5"><div class="text-xs text-slate-400">Total Peserta</div><div id="stat-total-players" class="text-2xl font-extrabold">0</div></div>
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5"><div class="text-xs text-slate-400">Rata-rata Skor</div><div id="stat-avg-score" class="text-2xl font-extrabold text-amber-400">0</div></div>
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5"><div class="text-xs text-slate-400">Skor Tertinggi</div><div id="stat-max-score" class="text-2xl font-extrabold text-emerald-400">0</div></div>
        <div class="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5"><div class="text-xs text-slate-400">Rata-rata Benar</div><div id="stat-avg-correct" class="text-2xl font-extrabold text-sky-400">0%</div></div>
      </div>

      <div class="bg-[#0b1120] border border-slate-800 rounded-xl overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-slate-400 border-b border-slate-800">
            <tr><th class="py-2.5 px-3">Rank</th><th class="py-2.5 px-3">Nama</th><th class="py-2.5 px-3 text-center">Benar</th><th class="py-2.5 px-3 text-right">Skor</th><th class="py-2.5 px-3 text-center">Aksi</th></tr>
          </thead>
          <tbody id="admin-participants-table" class="divide-y divide-slate-800"></tbody>
        </table>
      </div>
    </section>

    <!-- Floating Footer -->
    <div class="fixed bottom-3 right-3 flex items-center gap-2 z-40">
      <div class="bg-slate-900/95 text-slate-300 text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
        <span id="cloud-status-dot" class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span id="cloud-status-text">Menghubungkan Cloud...</span>
      </div>
      <button onclick="openAdminModal()" class="bg-slate-900/95 hover:bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer">
        Admin
      </button>
    </div>

    <!-- Modal Login Admin -->
    <div id="modal-admin-login" class="hidden fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
      <div class="surface-card rounded-2xl p-6 max-w-sm w-full text-center">
        <h3 class="text-lg font-extrabold mb-1">Akses Dashboard Admin</h3>
        <p class="text-xs text-slate-400 mb-4">Masukkan PIN Admin</p>
        <input id="admin-pin-input" type="password" maxlength="10" placeholder="PIN Admin" class="w-full px-4 py-3 rounded-xl bg-white text-slate-900 font-bold text-center text-lg mb-2">
        <p id="admin-pin-error" class="hidden text-rose-400 text-xs mb-3">PIN salah!</p>
        <div class="flex gap-2 mt-3">
          <button onclick="closeAdminModal()" class="flex-1 bg-slate-800 text-white font-semibold py-2.5 rounded-xl cursor-pointer">Batal</button>
          <button onclick="verifyAdminPin()" class="flex-1 bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl cursor-pointer">Masuk</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div id="toast-notification" class="hidden fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-amber-400/50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xl">
      <span id="toast-message"></span>
    </div>
  </div>

  <script>
    const ADMIN_PIN = ${JSON.stringify(ADMIN_PIN)};
    const STALE_MS = 30 * 60 * 1000;
    const DEFAULT_QUESTIONS = ${serializedQuestions};
    const POWERUP_CATALOG = {
      DOUBLE_SCORE: { id: 'DOUBLE_SCORE', name: 'Skor 2x', kind: 'buff', weight: 10, desc: 'Menggandakan poin pada soal aktif ini!' },
      FIFTY_FIFTY: { id: 'FIFTY_FIFTY', name: '50:50', kind: 'buff', weight: 25, desc: 'Menghapus 2 opsi salah.' },
      SHIELD: { id: 'SHIELD', name: 'Perisai', kind: 'buff', weight: 20, desc: 'Menangkal Debuff lawan.' },
      FREEZE_LEADER: { id: 'FREEZE_LEADER', name: 'Bekukan #1', kind: 'debuff', weight: 20, desc: 'Membekukan layar lawan #1 selama 4 detik!' },
      GLITCH_SHUFFLE: { id: 'GLITCH_SHUFFLE', name: 'Acak Opsi', kind: 'debuff', weight: 25, desc: 'Mengacak tombol opsi lawan pada soal berikutnya.' }
    };

    const memoryStorage = {};
    function safeGet(k) { try { return localStorage.getItem(k); } catch { return memoryStorage[k] || null; } }
    function safeSet(k, v) { memoryStorage[k] = v; try { localStorage.setItem(k, v); } catch {} }
    function safeDel(k) { delete memoryStorage[k]; try { localStorage.removeItem(k); } catch {} }
    function escapeHtml(s) { return typeof s === 'string' ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : s; }

    function getDeviceId() {
      let id = safeGet('quiz_device_fingerprint_v1');
      if (!id) {
        id = 'DEV-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
        safeSet('quiz_device_fingerprint_v1', id);
      }
      return id;
    }
    const DEVICE_ID = getDeviceId();

    let quizQuestions = [...DEFAULT_QUESTIONS];
    let currentPlayerName = '';
    let currentQuestionIndex = 0;
    let score = 0;
    let correctCount = 0;
    let timerInterval = null;
    let timeLeft = 25;
    let selectedMultipleIndices = [];
    let playerHistory = [];
    let hasPlayedThisDevice = false;
    let savedPlayerRecord = null;
    let globalLeaderboardData = [];
    let sessionMode = 'unconfigured';
    let liveSessionRunId = 'default';
    let isInWaitingRoom = false;
    let waitingRoomPlayers = [];
    let activePlayers = [];

    let powerupInventory = [null, null];
    let currentStreak = 0;
    let doubleScoreActiveThisQuestion = false;
    let powerupUsedThisQuestion = false;
    let isFrozenByOpponent = false;
    let freezeTimerInterval = null;
    let glitchShuffleActiveForNext = false;
    let immuneQuestionsRemaining = 0;
    let awardedDebuffMilestones = new Set();

    function getStreakTarget() { return Math.max(3, Math.round((quizQuestions.length || 30) * 0.25)); }
    function getDebuffMilestones() {
      const total = quizQuestions.length;
      const ms = [];
      if (total >= 6) ms.push(Math.ceil(total / 2));
      for (let m = 10; m <= total; m += 10) if (!ms.includes(m)) ms.push(m);
      return ms.sort((a,b) => a-b);
    }

    function showToast(msg) {
      const t = document.getElementById('toast-notification');
      document.getElementById('toast-message').innerText = msg;
      t.classList.remove('hidden');
      clearTimeout(window._t);
      window._t = setTimeout(() => t.classList.add('hidden'), 3200);
    }

    function updateLobbyCounts() {
      document.getElementById('lobby-total-questions').innerText = quizQuestions.length;
      document.getElementById('lobby-count-cat1').innerText = quizQuestions.filter(q => q.category === 'Manusia & Hewan').length + ' Soal';
      document.getElementById('lobby-count-cat2').innerText = quizQuestions.filter(q => q.category === 'Logika & Hitungan').length + ' Soal';
      document.getElementById('lobby-count-cat3').innerText = quizQuestions.filter(q => q.category === 'Wawasan Nusantara').length + ' Soal';
      const ms = getDebuffMilestones();
      document.getElementById('hud-milestone-hint').innerText = ms.length ? ('Debuff di soal #' + ms.join(', #')) : '';
    }

    function getSessionLockFlags() {
      const now = Date.now();
      const fresh = activePlayers.filter(p => now - (p.lastSeen || p.startedAt || 0) <= STALE_MS);
      const hasFree = globalLeaderboardData.length > 0 || fresh.some(p => p.mode === 'free');
      const hasLive = waitingRoomPlayers.length > 0 || sessionMode === 'live_started' || fresh.some(p => p.mode === 'live_waiting' || p.mode === 'live_started');
      return {
        isFreeLockedOut: (sessionMode === 'live_waiting' || sessionMode === 'live_started') && hasLive,
        isLiveLockedOut: sessionMode === 'free' && hasFree
      };
    }

    function applySessionModeUI() {
      const modeText = document.getElementById('lobby-mode-text');
      const startBtn = document.getElementById('btn-start-quiz');
      const awaitBanner = document.getElementById('awaiting-admin-mode-banner');
      const inputBox = document.getElementById('lobby-input-container');
      const { isFreeLockedOut, isLiveLockedOut } = getSessionLockFlags();

      const labels = {
        unconfigured: 'Menunggu Admin memilih mode',
        free: 'Mode Bebas · Langsung Main',
        live_waiting: 'Mode Live · Menunggu Aba-aba Admin',
        live_started: 'Live Sedang Berlangsung'
      };
      if (modeText) modeText.innerText = labels[sessionMode] || labels.unconfigured;

      if (!hasPlayedThisDevice) {
        if (sessionMode === 'unconfigured') {
          awaitBanner.classList.remove('hidden');
          inputBox.classList.add('hidden');
          startBtn.disabled = true;
          startBtn.className = 'flex-1 bg-slate-800 text-slate-500 font-bold py-3.5 px-6 rounded-xl cursor-not-allowed';
          startBtn.innerText = 'Menunggu Admin...';
        } else {
          awaitBanner.classList.add('hidden');
          inputBox.classList.remove('hidden');
          startBtn.disabled = false;
          startBtn.className = 'flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl cursor-pointer';
          startBtn.innerText = sessionMode === 'live_waiting' ? 'Gabung Ruang Tunggu Live' : 'Mulai Kuis Sekarang';
        }
      }

      const bFree = document.getElementById('btn-mode-free');
      const bWait = document.getElementById('btn-mode-live-wait');
      const bStart = document.getElementById('btn-mode-live-start');
      if (bFree && bWait && bStart) {
        bFree.disabled = isFreeLockedOut;
        bWait.disabled = isLiveLockedOut;
        bStart.disabled = isLiveLockedOut || sessionMode === 'unconfigured' || sessionMode === 'free';
        bFree.className = 'px-3 py-2 rounded-lg text-xs font-bold border ' + (sessionMode === 'free' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-800 text-slate-200 border-slate-700');
        bWait.className = 'px-3 py-2 rounded-lg text-xs font-bold border ' + (sessionMode === 'live_waiting' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-800 text-slate-200 border-slate-700');
        bStart.className = 'px-3 py-2 rounded-lg text-xs font-bold ' + (bStart.disabled ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-400 text-slate-950 cursor-pointer');
      }
      const lockBanner = document.getElementById('admin-lock-status-banner');
      if (lockBanner) lockBanner.innerText = 'Status: ' + (labels[sessionMode] || sessionMode);

      if (isInWaitingRoom && sessionMode === 'live_started' && !hasPlayedThisDevice) {
        isInWaitingRoom = false;
        document.getElementById('screen-waiting-room').classList.add('hidden');
        beginQuizGameplay(currentPlayerName);
      }
    }

    function setSessionMode(mode) {
      sessionMode = mode;
      if (mode === 'live_started') liveSessionRunId = 'LIVE-' + Date.now();
      applySessionModeUI();
      if (window.saveSessionStateToCloud) window.saveSessionStateToCloud({ mode, runId: liveSessionRunId, updatedAt: Date.now() });
      showToast('Mode diperbarui');
    }

    function resetSessionModeSelection() {
      sessionMode = 'unconfigured';
      applySessionModeUI();
      if (window.saveSessionStateToCloud) window.saveSessionStateToCloud({ mode: 'unconfigured', runId: 'reset-' + Date.now(), updatedAt: Date.now() });
      if (window.clearActiveSessionPlayersCloud) window.clearActiveSessionPlayersCloud();
    }

    function handleLobbyStartClick() {
      if (hasPlayedThisDevice || sessionMode === 'unconfigured') return;
      const val = document.getElementById('player-name').value.trim();
      if (!val) { document.getElementById('name-error').classList.remove('hidden'); return; }
      document.getElementById('name-error').classList.add('hidden');
      currentPlayerName = val;
      if (sessionMode === 'live_waiting') {
        isInWaitingRoom = true;
        document.getElementById('waiting-my-name').innerText = val;
        document.getElementById('screen-start').classList.add('hidden');
        document.getElementById('screen-waiting-room').classList.remove('hidden');
        if (window.joinWaitingRoomCloud) window.joinWaitingRoomCloud({ deviceId: DEVICE_ID, name: val, joinedAt: Date.now() });
      } else {
        beginQuizGameplay(val);
      }
    }

    function leaveWaitingRoom() {
      isInWaitingRoom = false;
      document.getElementById('screen-waiting-room').classList.add('hidden');
      document.getElementById('screen-start').classList.remove('hidden');
      if (window.leaveWaitingRoomCloud) window.leaveWaitingRoomCloud(DEVICE_ID);
    }

    function beginQuizGameplay(name) {
      if (window.leaveWaitingRoomCloud) window.leaveWaitingRoomCloud(DEVICE_ID);
      if (window.upsertActivePlayerCloud) window.upsertActivePlayerCloud({ deviceId: DEVICE_ID, name, mode: sessionMode, score: 0, currentQuestion: 0, startedAt: Date.now(), lastSeen: Date.now() });
      currentPlayerName = name; currentQuestionIndex = 0; score = 0; correctCount = 0; playerHistory = [];
      powerupInventory = [null, null]; currentStreak = 0; doubleScoreActiveThisQuestion = false; powerupUsedThisQuestion = false;
      isFrozenByOpponent = false; glitchShuffleActiveForNext = false; immuneQuestionsRemaining = 0; awardedDebuffMilestones = new Set();
      document.getElementById('current-score').innerText = '0';
      document.getElementById('screen-start').classList.add('hidden');
      document.getElementById('screen-quiz').classList.remove('hidden');
      renderHud();
      loadQuestion();
    }

    function renderHud() {
      document.getElementById('hud-streak-count').innerText = currentStreak;
      document.getElementById('hud-streak-target').innerText = getStreakTarget();
      const pills = [];
      if (doubleScoreActiveThisQuestion) pills.push('<span class="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">Skor 2x Aktif</span>');
      if (immuneQuestionsRemaining > 0) pills.push('<span class="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded">Perisai Aktif</span>');
      document.getElementById('active-status-pills').innerHTML = pills.join('');

      const slots = document.getElementById('inventory-slots');
      slots.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const id = powerupInventory[i];
        const div = document.createElement('div');
        if (!id) {
          div.className = 'rounded-lg border border-dashed border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-500 text-center';
          div.innerText = 'Slot ' + (i + 1) + ' Kosong';
        } else {
          const spec = POWERUP_CATALOG[id];
          div.className = 'rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs';
          div.innerHTML = '<span class="font-bold text-amber-300 truncate">' + spec.name + '</span><button onclick="activatePowerupSlot(' + i + ')" ' + (powerupUsedThisQuestion || isFrozenByOpponent ? 'disabled' : '') + ' class="bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded text-[11px] cursor-pointer">Pakai</button>';
        }
        slots.appendChild(div);
      }
    }

    function rollPowerup(kind = null) {
      const pool = Object.values(POWERUP_CATALOG).filter(p => !kind || p.kind === kind);
      const total = pool.reduce((s, p) => s + p.weight, 0);
      let r = Math.random() * total;
      for (const p of pool) { if (r < p.weight) return p.id; r -= p.weight; }
      return pool[0].id;
    }

    function grantPowerup(id, label) {
      const idx = powerupInventory.findIndex(s => s === null);
      if (idx === -1) {
        score += 50;
        document.getElementById('current-score').innerText = score;
        showToast('Slot penuh! +50 poin bonus');
      } else {
        powerupInventory[idx] = id;
        showToast((label ? label + ': ' : '') + 'Dapat ' + POWERUP_CATALOG[id].name + '!');
      }
      renderHud();
    }

    function activatePowerupSlot(idx) {
      if (powerupUsedThisQuestion || isFrozenByOpponent) return;
      if (!document.getElementById('feedback-box').classList.contains('hidden')) return;
      const id = powerupInventory[idx];
      if (!id) return;
      const q = quizQuestions[currentQuestionIndex];
      if (id === 'FIFTY_FIFTY' && q.type !== 'MC' && q.type !== 'MS') { showToast('50:50 hanya untuk soal pilihan ganda'); return; }
      powerupInventory[idx] = null;
      powerupUsedThisQuestion = true;
      if (id === 'DOUBLE_SCORE') { doubleScoreActiveThisQuestion = true; showToast('Skor 2x aktif!'); }
      else if (id === 'FIFTY_FIFTY') {
        const correct = Array.isArray(q.answer) ? q.answer : [q.answer];
        const wrong = Array.from(document.querySelectorAll('#options-container button')).filter(b => !correct.includes(parseInt(b.dataset.origIdx, 10)));
        wrong.sort(() => Math.random() - 0.5).slice(0, 2).forEach(b => { b.disabled = true; b.classList.add('opacity-20', 'line-through'); });
      } else if (id === 'SHIELD') { immuneQuestionsRemaining = Math.max(immuneQuestionsRemaining, 2); showToast('Perisai aktif!'); }
      else if (id === 'FREEZE_LEADER' || id === 'GLITCH_SHUFFLE') {
        const now = Date.now();
        const fresh = activePlayers.filter(p => p.deviceId !== DEVICE_ID && now - (p.lastSeen || p.startedAt || 0) <= STALE_MS).sort((a,b) => (b.score||0)-(a.score||0));
        const target = fresh[0] || globalLeaderboardData.filter(p => p.deviceId !== DEVICE_ID).sort((a,b) => (b.score||0)-(a.score||0))[0];
        if (!target) { score += 100; document.getElementById('current-score').innerText = score; showToast('Belum ada lawan aktif (+100 poin)'); }
        else {
          if (window.sendSabotageToCloud) window.sendSabotageToCloud({ targetDeviceId: target.deviceId, targetName: target.name, attackerDeviceId: DEVICE_ID, attackerName: currentPlayerName, type: id, createdAt: Date.now() });
          showToast('Debuff dikirim ke ' + target.name + '!');
        }
      }
      renderHud();
    }

    window.handleIncomingSabotage = function(ev) {
      if (!ev || ev.targetDeviceId !== DEVICE_ID || document.getElementById('screen-quiz').classList.contains('hidden')) return;
      if (immuneQuestionsRemaining > 0) { showToast('Perisai menangkis serangan ' + ev.attackerName + '!'); return; }
      immuneQuestionsRemaining = 1;
      if (ev.type === 'FREEZE_LEADER') {
        isFrozenByOpponent = true;
        let rem = 4;
        clearInterval(timerInterval);
        document.getElementById('freeze-attacker-text').innerText = ev.attackerName + ' membekukan layarmu!';
        document.getElementById('freeze-countdown').innerText = rem;
        document.getElementById('freeze-overlay').classList.remove('hidden');
        clearInterval(freezeTimerInterval);
        freezeTimerInterval = setInterval(() => {
          rem--;
          document.getElementById('freeze-countdown').innerText = Math.max(0, rem);
          if (rem <= 0) {
            clearInterval(freezeTimerInterval);
            isFrozenByOpponent = false;
            document.getElementById('freeze-overlay').classList.add('hidden');
            startOrResumeTimer();
          }
        }, 1000);
      } else {
        glitchShuffleActiveForNext = true;
        showToast('Opsi soal berikutnya akan diacak oleh ' + ev.attackerName + '!');
      }
      renderHud();
    };

    function startOrResumeTimer() {
      const q = quizQuestions[currentQuestionIndex];
      const total = q.time || 25;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (isFrozenByOpponent) return;
        timeLeft--;
        document.getElementById('timer-text').innerText = Math.max(0, timeLeft);
        document.getElementById('timer-bar').style.width = Math.max(0, (timeLeft / total) * 100) + '%';
        if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeOut(); }
      }, 1000);
    }

    function loadQuestion() {
      clearInterval(timerInterval);
      selectedMultipleIndices = [];
      doubleScoreActiveThisQuestion = false;
      powerupUsedThisQuestion = false;
      if (immuneQuestionsRemaining > 0) immuneQuestionsRemaining--;
      const qNum = currentQuestionIndex + 1;
      if (getDebuffMilestones().includes(qNum) && !awardedDebuffMilestones.has(qNum)) {
        awardedDebuffMilestones.add(qNum);
        grantPowerup(rollPowerup('debuff'), 'Bonus #' + qNum);
      }
      renderHud();
      const q = quizQuestions[currentQuestionIndex];
      document.getElementById('question-counter').innerText = qNum + ' / ' + quizQuestions.length;
      document.getElementById('category-badge').innerText = q.category;
      document.getElementById('question-type-label').innerText = q.type;
      document.getElementById('question-text').innerText = q.question;
      document.getElementById('feedback-box').classList.add('hidden');
      document.getElementById('submit-action-container').classList.add('hidden');
      const container = document.getElementById('options-container');
      container.innerHTML = '';

      const shuffle = glitchShuffleActiveForNext && (q.type === 'MC' || q.type === 'MS');
      if (glitchShuffleActiveForNext) { glitchShuffleActiveForNext = false; container.classList.add('glitch-active'); setTimeout(() => container.classList.remove('glitch-active'), 800); }

      if (q.type === 'MC' || q.type === 'TF') {
        const indices = q.options.map((_, i) => i);
        if (shuffle) indices.sort(() => Math.random() - 0.5);
        const letters = ['A', 'B', 'C', 'D'];
        indices.forEach((origIdx, dispIdx) => {
          const btn = document.createElement('button');
          btn.dataset.origIdx = String(origIdx);
          btn.className = 'option-btn w-full text-left p-4 rounded-xl bg-[#0b1120] hover:bg-slate-800 border border-slate-700 font-bold text-sm sm:text-base flex items-center gap-3 cursor-pointer';
          btn.innerHTML = '<span class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-extrabold shrink-0">' + letters[dispIdx] + '</span><span>' + escapeHtml(q.options[origIdx]) + '</span>';
          btn.onclick = () => handleSingleChoice(origIdx);
          container.appendChild(btn);
        });
      } else if (q.type === 'MS') {
        const indices = q.options.map((_, i) => i);
        if (shuffle) indices.sort(() => Math.random() - 0.5);
        indices.forEach(origIdx => {
          const btn = document.createElement('button');
          btn.id = 'ms-opt-' + origIdx;
          btn.dataset.origIdx = String(origIdx);
          btn.className = 'option-btn w-full text-left p-4 rounded-xl bg-[#0b1120] border border-slate-700 font-bold text-sm sm:text-base flex items-center justify-between gap-3 cursor-pointer';
          btn.innerHTML = '<span>' + escapeHtml(q.options[origIdx]) + '</span><span id="ms-check-' + origIdx + '" class="w-6 h-6 rounded border border-slate-600 flex items-center justify-center text-xs"></span>';
          btn.onclick = () => toggleMs(origIdx);
          container.appendChild(btn);
        });
        document.getElementById('submit-action-container').classList.remove('hidden');
      } else {
        container.innerHTML = '<input id="text-answer-input" type="text" placeholder="Ketik jawabanmu..." class="w-full px-4 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-base">';
        document.getElementById('submit-action-container').classList.remove('hidden');
      }

      timeLeft = q.time || 25;
      document.getElementById('timer-text').innerText = timeLeft;
      document.getElementById('timer-bar').style.width = '100%';
      startOrResumeTimer();
    }

    function toggleMs(idx) {
      const btn = document.getElementById('ms-opt-' + idx);
      const chk = document.getElementById('ms-check-' + idx);
      const pos = selectedMultipleIndices.indexOf(idx);
      if (pos === -1) { selectedMultipleIndices.push(idx); btn.classList.add('border-amber-400'); chk.innerText = '✓'; }
      else { selectedMultipleIndices.splice(pos, 1); btn.classList.remove('border-amber-400'); chk.innerText = ''; }
    }

    function handleSingleChoice(idx) {
      if (isFrozenByOpponent) return;
      clearInterval(timerInterval);
      const q = quizQuestions[currentQuestionIndex];
      const ok = idx === q.answer;
      document.querySelectorAll('#options-container button').forEach(b => {
        b.disabled = true;
        const orig = parseInt(b.dataset.origIdx, 10);
        if (orig === q.answer) b.className = 'w-full text-left p-4 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm sm:text-base flex items-center gap-3';
        else if (orig === idx && !ok) b.className = 'w-full text-left p-4 rounded-xl bg-rose-600 text-white font-bold text-sm sm:text-base flex items-center gap-3';
        else b.classList.add('opacity-40');
      });
      finalizeResult(ok, q.options[idx], q.options[q.answer], false);
    }

    function submitComplexAnswer() {
      if (isFrozenByOpponent) return;
      const q = quizQuestions[currentQuestionIndex];
      if (q.type === 'MS') {
        if (!selectedMultipleIndices.length) return;
        clearInterval(timerInterval);
        document.getElementById('submit-action-container').classList.add('hidden');
        const sel = [...selectedMultipleIndices].sort((a,b) => a-b);
        const cor = [...q.answer].sort((a,b) => a-b);
        const ok = JSON.stringify(sel) === JSON.stringify(cor);
        finalizeResult(ok, sel.map(i => q.options[i]).join(', '), cor.map(i => q.options[i]).join(', '), false);
      } else {
        const inp = document.getElementById('text-answer-input');
        const val = inp ? inp.value.trim() : '';
        if (!val) return;
        clearInterval(timerInterval);
        inp.disabled = true;
        document.getElementById('submit-action-container').classList.add('hidden');
        const ok = q.acceptedAnswers.some(a => a.toLowerCase().trim() === val.toLowerCase());
        finalizeResult(ok, val, q.acceptedAnswers[0].toUpperCase(), false);
      }
    }

    function handleTimeOut() {
      const q = quizQuestions[currentQuestionIndex];
      document.getElementById('submit-action-container').classList.add('hidden');
      const cor = (q.type === 'MC' || q.type === 'TF') ? q.options[q.answer] : q.type === 'MS' ? q.answer.map(i => q.options[i]).join(', ') : q.acceptedAnswers[0].toUpperCase();
      finalizeResult(false, 'Waktu Habis', cor, true);
    }

    function finalizeResult(ok, userAns, corAns, timeout) {
      const q = quizQuestions[currentQuestionIndex];
      const total = q.time || 25;
      let pts = 0;
      if (ok) {
        correctCount++; currentStreak++;
        pts = 600 + Math.round((timeLeft / total) * 400);
        if (doubleScoreActiveThisQuestion) pts *= 2;
        score += pts;
        document.getElementById('current-score').innerText = score;
        if (currentStreak >= getStreakTarget()) { currentStreak = 0; grantPowerup(rollPowerup(), 'Streak'); }
      } else { currentStreak = 0; }
      renderHud();
      if (window.upsertActivePlayerCloud) window.upsertActivePlayerCloud({ deviceId: DEVICE_ID, name: currentPlayerName, mode: sessionMode, score, currentQuestion: currentQuestionIndex + 1, startedAt: Date.now(), lastSeen: Date.now() });
      playerHistory.push({ questionIndex: currentQuestionIndex, question: q.question, category: q.category, userAnswer: userAns, correctAnswer: corAns, isCorrect: ok, timeTaken: timeout ? total : Math.max(1, total - timeLeft), maxTime: total, pointsEarned: pts, explanation: q.explanation });
      const fb = document.getElementById('feedback-box');
      fb.className = 'mt-5 p-4 rounded-xl border ' + (ok ? 'bg-emerald-500/15 border-emerald-400/40' : 'bg-rose-500/15 border-rose-400/40');
      document.getElementById('feedback-title').innerText = ok ? 'Jawaban Benar!' : (timeout ? 'Waktu Habis!' : 'Kurang Tepat (' + corAns + ')');
      document.getElementById('feedback-points').innerText = '+' + pts + ' poin';
      document.getElementById('feedback-explanation').innerText = q.explanation;
      fb.classList.remove('hidden');
    }

    function nextQuestion() {
      currentQuestionIndex++;
      if (currentQuestionIndex < quizQuestions.length) loadQuestion();
      else finishQuiz();
    }

    function finishQuiz() {
      document.getElementById('screen-quiz').classList.add('hidden');
      document.getElementById('screen-leaderboard').classList.remove('hidden');
      if (window.unregisterActivePlayerCloud) window.unregisterActivePlayerCloud(DEVICE_ID);
      const rec = { id: DEVICE_ID, deviceId: DEVICE_ID, name: currentPlayerName, score, correct: correctCount, totalQuestions: quizQuestions.length, history: playerHistory, completedAt: new Date().toISOString() };
      safeSet('quiz_completed_record_' + DEVICE_ID, JSON.stringify(rec));
      applyDeviceLockUI(rec);
      document.getElementById('player-result-card').classList.remove('hidden');
      document.getElementById('result-player-name').innerText = currentPlayerName;
      document.getElementById('result-correct-count').innerText = correctCount + '/' + quizQuestions.length;
      document.getElementById('result-total-score').innerText = score;
      renderReview();
      if (window.saveScoreToCloud) window.saveScoreToCloud(rec);
    }

    function applyDeviceLockUI(rec) {
      hasPlayedThisDevice = true; savedPlayerRecord = rec;
      document.getElementById('awaiting-admin-mode-banner').classList.add('hidden');
      document.getElementById('lobby-input-container').classList.add('hidden');
      document.getElementById('already-played-banner').classList.remove('hidden');
      document.getElementById('already-played-info').innerText = rec.name + ' · Skor ' + rec.score + ' (' + rec.correct + '/' + rec.totalQuestions + ')';
      const btn = document.getElementById('btn-start-quiz');
      btn.disabled = true; btn.innerText = 'Kuis Sudah Selesai';
      document.getElementById('btn-lobby-leaderboard').classList.remove('hidden');
    }

    function unlockDeviceUI() {
      safeDel('quiz_completed_record_' + DEVICE_ID);
      hasPlayedThisDevice = false; savedPlayerRecord = null;
      document.getElementById('already-played-banner').classList.add('hidden');
      applySessionModeUI();
    }

    function renderReview() {
      document.getElementById('answer-review-section').classList.remove('hidden');
      document.getElementById('answer-review-list').innerHTML = playerHistory.map((h, i) => '<div class="p-3.5 rounded-xl border ' + (h.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30') + '"><div class="text-xs font-bold mb-1">Soal ' + (i+1) + ' · ' + (h.isCorrect ? 'Benar' : 'Salah') + '</div><p class="text-sm font-bold text-white mb-1">' + escapeHtml(h.question) + '</p><p class="text-xs text-slate-300">' + escapeHtml(h.explanation) + '</p></div>').join('');
    }

    function renderLeaderboardList(list) {
      globalLeaderboardData = [...list].sort((a,b) => (b.score||0)-(a.score||0));
      applySessionModeUI();
      if (globalLeaderboardData.length > 0) document.getElementById('btn-lobby-leaderboard').classList.remove('hidden');
      const el = document.getElementById('leaderboard-list');
      el.innerHTML = globalLeaderboardData.length === 0
        ? '<div class="p-6 text-center text-xs text-slate-400">Belum ada peserta selesai.</div>'
        : globalLeaderboardData.map((p, i) => '<div class="grid grid-cols-12 px-4 py-3 text-sm ' + (p.deviceId === DEVICE_ID ? 'bg-slate-800/70 font-bold' : '') + '"><div class="col-span-2 text-center tabular-num">#' + (i+1) + '</div><div class="col-span-5 truncate">' + escapeHtml(p.name) + '</div><div class="col-span-2 text-center text-emerald-400 tabular-num">' + p.correct + '/' + (p.totalQuestions||quizQuestions.length) + '</div><div class="col-span-3 text-right text-amber-400 font-extrabold tabular-num">' + p.score + '</div></div>').join('');
    }

    function showLeaderboardOnly() { document.getElementById('screen-start').classList.add('hidden'); document.getElementById('screen-leaderboard').classList.remove('hidden'); renderLeaderboardList(globalLeaderboardData); }
    function backToLockedLobby() { document.getElementById('screen-leaderboard').classList.add('hidden'); document.getElementById('screen-start').classList.remove('hidden'); }
    function manualRefreshLeaderboard() { if (window.fetchCloudLeaderboardOnce) window.fetchCloudLeaderboardOnce(); }

    function openAdminModal() { document.getElementById('admin-pin-input').value = ''; document.getElementById('modal-admin-login').classList.remove('hidden'); }
    function closeAdminModal() { document.getElementById('modal-admin-login').classList.add('hidden'); }
    function verifyAdminPin() {
      if (document.getElementById('admin-pin-input').value.trim() === ADMIN_PIN) {
        closeAdminModal();
        document.getElementById('screen-start').classList.add('hidden');
        document.getElementById('screen-admin').classList.remove('hidden');
        renderAdminStats();
      } else { document.getElementById('admin-pin-error').classList.remove('hidden'); }
    }
    function closeAdminDashboard() { document.getElementById('screen-admin').classList.add('hidden'); document.getElementById('screen-start').classList.remove('hidden'); }

    function renderAdminStats() {
      const total = globalLeaderboardData.length;
      document.getElementById('stat-total-players').innerText = total;
      document.getElementById('stat-avg-score').innerText = total ? Math.round(globalLeaderboardData.reduce((s,p) => s + (p.score||0), 0) / total) : 0;
      document.getElementById('stat-max-score').innerText = total ? Math.max(...globalLeaderboardData.map(p => p.score||0)) : 0;
      document.getElementById('stat-avg-correct').innerText = (total ? Math.round(globalLeaderboardData.reduce((s,p) => s + ((p.correct||0)/(p.totalQuestions||quizQuestions.length)*100), 0) / total) : 0) + '%';
      document.getElementById('admin-participants-table').innerHTML = globalLeaderboardData.map((p, i) => '<tr><td class="py-2.5 px-3">#' + (i+1) + '</td><td class="py-2.5 px-3 font-bold">' + escapeHtml(p.name) + '</td><td class="py-2.5 px-3 text-center">' + p.correct + '/' + (p.totalQuestions||quizQuestions.length) + '</td><td class="py-2.5 px-3 text-right font-bold text-amber-400">' + p.score + '</td><td class="py-2.5 px-3 text-center"><button onclick="deleteOne(' + i + ')" class="text-rose-400 hover:underline cursor-pointer">Hapus</button></td></tr>').join('');
    }
    function deleteOne(i) {
      const p = globalLeaderboardData[i]; if (!p) return;
      if (window.deleteSingleParticipantFromCloud) window.deleteSingleParticipantFromCloud(p.deviceId);
      if (p.deviceId === DEVICE_ID) unlockDeviceUI();
      renderLeaderboardList(globalLeaderboardData.filter((_, idx) => idx !== i));
      renderAdminStats();
    }
    function confirmResetLeaderboard() {
      unlockDeviceUI();
      renderLeaderboardList([]);
      renderAdminStats();
      if (window.resetCloudLeaderboard) window.resetCloudLeaderboard();
      showToast('Leaderboard direset');
    }
    function exportAdminCSV() {
      const headers = ['Rank','Nama','Benar','Total Soal','Skor','Waktu Selesai','ID Perangkat'];
      const rows = globalLeaderboardData.map((p, i) => [i+1, '"'+(p.name||'').replace(/"/g,'""')+'"', p.correct||0, p.totalQuestions||quizQuestions.length, p.score||0, '"'+(p.completedAt||'-')+'"', '"'+(p.deviceId||'-')+'"'].join(','));
      const csv = '\\uFEFF' + [headers.join(','), ...rows].join('\\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'hasil_kuis_nusantara.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    updateLobbyCounts();
    const savedLocal = safeGet('quiz_completed_record_' + DEVICE_ID);
    if (savedLocal) { try { applyDeviceLockUI(JSON.parse(savedLocal)); } catch {} }
    applySessionModeUI();
  </script>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

    const firebaseConfig = ${serializedConfig};
    const appId = ${JSON.stringify(FIREBASE_APP_ID)};
    let db = null;

    function setBadge(ok, txt) {
      document.getElementById('cloud-status-text').innerText = txt;
      document.getElementById('cloud-status-dot').className = 'w-2 h-2 rounded-full ' + (ok === true ? 'bg-emerald-400' : ok === false ? 'bg-rose-500' : 'bg-amber-400 animate-pulse');
    }

    async function init() {
      try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        db = getFirestore(app);
        try { await signInAnonymously(auth); } catch {}

        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'), (snap) => {
          setBadge(true, 'Cloud Terhubung');
          const list = []; let found = false;
          snap.forEach(d => { const data = d.data(); list.push(data); if (data.deviceId === DEVICE_ID) { found = true; applyDeviceLockUI(data); } });
          if (!found && hasPlayedThisDevice) unlockDeviceUI();
          renderLeaderboardList(list);
        }, () => setBadge(false, 'Cek Rules Firestore!'));

        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'session'), (d) => {
          if (d.exists() && d.data().mode) { sessionMode = d.data().mode; applySessionModeUI(); }
        });
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'waiting_room'), (snap) => {
          waitingRoomPlayers = []; snap.forEach(d => waitingRoomPlayers.push(d.data()));
          document.getElementById('waiting-players-count').innerText = waitingRoomPlayers.length + ' Bergabung';
          document.getElementById('waiting-players-list').innerHTML = waitingRoomPlayers.map(p => '<span class="px-2.5 py-1 rounded bg-slate-800 text-xs font-bold">' + escapeHtml(p.name) + '</span>').join('');
          document.getElementById('admin-waiting-count').innerText = waitingRoomPlayers.length + ' orang';
          applySessionModeUI();
        });
        onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'active_players'), (snap) => {
          activePlayers = []; snap.forEach(d => activePlayers.push(d.data())); applySessionModeUI();
        });
        let lastSab = 0;
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'sabotage', DEVICE_ID), (d) => {
          if (d.exists()) { const s = d.data(); if (s.createdAt > lastSab && Date.now() - s.createdAt < 20000) { lastSab = s.createdAt; window.handleIncomingSabotage(s); } }
        });
      } catch { setBadge(false, 'Mode Offline'); }
    }

    window.saveSessionStateToCloud = (p) => db && setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'session'), p);
    window.joinWaitingRoomCloud = (p) => db && setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'waiting_room', p.deviceId), p);
    window.leaveWaitingRoomCloud = (id) => db && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'waiting_room', id));
    window.upsertActivePlayerCloud = (p) => db && setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'active_players', p.deviceId), p);
    window.unregisterActivePlayerCloud = (id) => db && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'active_players', id));
    window.clearActiveSessionPlayersCloud = async () => {
      if (!db) return;
      const [a, w] = await Promise.all([getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'active_players')), getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'waiting_room'))]);
      const dels = []; a.forEach(d => dels.push(deleteDoc(d.ref))); w.forEach(d => dels.push(deleteDoc(d.ref))); await Promise.all(dels);
    };
    window.saveScoreToCloud = (r) => db && setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', r.deviceId), r);
    window.fetchCloudLeaderboardOnce = async () => {
      if (!db) return;
      const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'));
      const list = []; snap.forEach(d => list.push(d.data())); renderLeaderboardList(list);
    };
    window.sendSabotageToCloud = (p) => db && setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sabotage', p.targetDeviceId), p);
    window.deleteSingleParticipantFromCloud = (id) => db && deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', id));
    window.resetCloudLeaderboard = async () => {
      if (!db) return;
      const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'));
      const dels = []; snap.forEach(d => dels.push(deleteDoc(d.ref))); await Promise.all(dels);
    };

    init();
  </script>
</body>
</html>`;
}
