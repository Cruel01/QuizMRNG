export const GOOGLE_SITES_BODY_MARKUP = `<body id="app-body" class="min-h-screen flex flex-col items-center justify-start px-3 pt-4 pb-20 sm:p-6">
  <div class="w-full max-w-4xl mx-auto min-w-0">

    <!-- 1. LOBBY -->
    <section id="screen-start" aria-label="Beranda Kuis" class="surface-card rounded-2xl p-5 sm:p-9 shadow-xl">
      <div id="lobby-header" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-6 mb-6">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 anim-float-gentle arcade-btn-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6" aria-hidden="true">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Kuis Trivia Nusantara</h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
              <span id="lobby-total-questions" class="font-mono-num text-slate-200 font-semibold">30</span> pertanyaan · <span id="lobby-subtitle-mode">Buff &amp; Debuff real-time</span><span id="lobby-meta-flags"></span>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div id="lobby-mode-status" class="inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
            <svg id="lobby-header-hourglass" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-4 h-4 shrink-0 anim-hourglass-flip">
              <path d="M6 3h12M6 21h12" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
              <path d="M7.5 3v3.8c0 2.1 1.6 3.7 3.7 4.7l.8.5.8-.5c2.1-1 3.7-2.6 3.7-4.7V3" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M7.5 21v-3.8c0-2.1 1.6-3.7 3.7-4.7l.8-.5.8.5c2.1 1 3.7 2.6 3.7 4.7V21" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M9.3 6.2h5.4c-.3 1.4-1.4 2.5-2.7 3.1-1.3-.6-2.4-1.7-2.7-3.1Z" fill="currentColor" fill-opacity="0.45"/>
              <circle cx="12" cy="13.5" r="0.95" fill="currentColor" class="anim-sand-drop"/>
              <path d="M8.8 19.5c.8-1.4 2-2.2 3.2-2.2s2.4.8 3.2 2.2H8.8Z" fill="currentColor" fill-opacity="0.85"/>
            </svg>
            <span id="lobby-mode-text">Menunggu Admin memilih mode kuis</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button type="button" id="btn-lobby-room" onclick="openRoomModal()" title="Ganti Kode Ruangan / Kelas"
              class="hidden arcade-btn px-2.5 py-1.5 rounded-lg bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-sky-400" aria-hidden="true">
                <path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>
              </svg>
              <span id="lobby-room-label" class="font-mono-num">Umum</span>
            </button>

            <button type="button" onclick="toggleMute()" data-mute-btn="true" aria-label="Bisukan suara efek" title="Bisukan suara efek"
              class="arcade-btn p-2 rounded-lg bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-slate-200 cursor-pointer">
            </button>
          </div>
        </div>
      </div>

      <!-- GERBANG KODE KELAS -->
      <div id="lobby-room-gate" class="max-w-lg mx-auto bg-[#0B1120] border border-sky-400/35 rounded-2xl p-6 sm:p-7 text-center space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-sky-400/15 border border-sky-400/30 text-sky-300 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6" aria-hidden="true"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>
        </div>
        <div class="space-y-1.5">
          <h2 class="text-lg sm:text-xl font-extrabold text-white">Masukkan Kode Kelas</h2>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Masukkan kode kelas dari penyelenggara agar kamu dapat mengakses kuis dan ruang tunggu. Ketik <strong class="text-slate-200 font-mono-num">UMUM</strong> jika menggunakan ruang default.
          </p>
        </div>
        <div class="space-y-3 text-left">
          <div>
            <label for="lobby-room-gate-input" class="block text-xs font-semibold text-slate-300 mb-1.5">Kode Kelas / Ruangan</label>
            <input id="lobby-room-gate-input" type="text" maxlength="20" placeholder="Contoh: KELAS8A atau UMUM"
              oninput="this.value=this.value.toUpperCase(); document.getElementById('lobby-room-gate-error').classList.add('hidden')"
              onkeydown="if(event.key==='Enter') submitLobbyRoomGate()"
              class="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-mono-num font-bold text-center text-base sm:text-lg tracking-wider uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400">
            <p id="lobby-room-gate-error" class="hidden text-rose-400 text-xs mt-1.5 font-medium text-center" role="alert"></p>
          </div>
          <button type="button" onclick="submitLobbyRoomGate()" class="arcade-btn w-full bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2">
            Masuk Kelas
          </button>
        </div>
      </div>

      <!-- KONTEN LOBBY SETELAH KODE KELAS DIMASUKKAN -->
      <div id="lobby-unlocked-content" class="hidden">
        <!-- Tab Interaktif: Kategori Soal vs Buff & Debuff -->
        <div class="flex items-center justify-between gap-3 mb-4">
          <div role="tablist" aria-label="Informasi Kuis" class="inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl">
            <button id="tab-btn-categories" type="button" role="tab" aria-selected="true" onclick="switchLobbyTab('categories')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap bg-amber-400 text-slate-950">
              Kategori Soal (3)
            </button>
            <button id="tab-btn-powerups" type="button" role="tab" aria-selected="false" onclick="switchLobbyTab('powerups')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white">
              Buff &amp; Debuff (6)
            </button>
          </div>
          <span id="lobby-cat-hint-label" class="text-[11px] text-slate-400 hidden sm:inline">Klik kartu kategori untuk lihat topik</span>
        </div>

        <!-- Panel Tab: Kategori Soal Dinamis -->
        <div id="lobby-panel-categories" class="mb-6 space-y-3">
          <div id="lobby-categories-grid" class="grid grid-cols-1 sm:grid-cols-3 gap-3"></div>
          <div id="category-hint-drawer" class="hidden bg-[#0B1120] border border-[#23304C] rounded-xl px-4 py-3 text-xs text-slate-300 flex items-center justify-between gap-2">
            <span id="category-hint-text"></span>
            <span class="text-[11px] text-slate-400 shrink-0 font-mono-num">MC · TF · MS · Isian</span>
          </div>
        </div>

        <!-- Panel Tab: Buff & Debuff (Dinamis sesuai pilihan Admin) -->
        <div id="lobby-panel-powerups" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6"></div>

        <!-- Banner Pemulihan Sesi -->
        <div id="recoverable-progress-banner" class="hidden bg-sky-500/10 border border-sky-400/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-bold text-sky-300">Sesi Sebelumnya Ditemukan</h2>
            <p id="recoverable-progress-info" class="text-xs text-slate-300 mt-0.5"></p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="resumeRecoverableProgress()" class="arcade-btn bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap">
              Lanjutkan
            </button>
            <button type="button" onclick="discardRecoverableProgress()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2.5 rounded-lg cursor-pointer whitespace-nowrap">
              Abaikan
            </button>
          </div>
        </div>

        <!-- Status Tunggu Admin -->
        <div id="awaiting-admin-mode-banner" class="bg-[#0B1120] border border-[#23304C] rounded-xl p-6 text-center mb-6">
          <div class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-300 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-6 h-6 anim-hourglass-flip">
              <path d="M6 3h12M6 21h12" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
              <path d="M7.5 3v3.8c0 2.1 1.6 3.7 3.7 4.7l.8.5.8-.5c2.1-1 3.7-2.6 3.7-4.7V3" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M7.5 21v-3.8c0-2.1 1.6-3.7 3.7-4.7l.8-.5.8.5c2.1 1 3.7 2.6 3.7 4.7V21" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M9.3 6.2h5.4c-.3 1.4-1.4 2.5-2.7 3.1-1.3-.6-2.4-1.7-2.7-3.1Z" fill="currentColor" fill-opacity="0.45"/>
              <circle cx="12" cy="13.5" r="0.95" fill="currentColor" class="anim-sand-drop"/>
              <path d="M8.8 19.5c.8-1.4 2-2.2 3.2-2.2s2.4.8 3.2 2.2H8.8Z" fill="currentColor" fill-opacity="0.85"/>
            </svg>
          </div>
          <h2 class="font-bold text-base sm:text-lg text-white">Menunggu Penyelenggara (Admin)</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Kuis belum dibuka. Halaman ini otomatis aktif begitu Admin memilih pelaksanaan secara <strong class="text-emerald-300">Mode Bebas</strong> atau <strong class="text-amber-300">Mode Live</strong>.
          </p>
        </div>

        <!-- Panel Mode Bebas vs Mode Live + Input Nama Pemain & Tim -->
        <div id="lobby-input-container" class="hidden max-w-xl mx-auto mb-6 rounded-2xl border border-emerald-500/35 bg-[#0B1120] overflow-hidden">
          <div id="lobby-mode-panel-header" class="px-5 py-4 border-b border-emerald-500/20 bg-emerald-500/[0.08] flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 id="lobby-mode-panel-title" class="text-sm sm:text-base font-extrabold text-emerald-300">Mode Bebas · Kerjakan Mandiri</h2>
                <span id="lobby-mode-panel-count" class="text-[11px] font-mono-num text-slate-300">Langsung mulai</span>
              </div>
              <p id="lobby-mode-panel-desc" class="text-xs text-slate-300 mt-1 leading-relaxed"></p>
              <div id="lobby-mode-panel-meta" class="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-2 font-mono-num"></div>
            </div>
          </div>

          <div class="p-5 space-y-3.5">
            <div id="lobby-participation-wrap" class="hidden flex items-center justify-between gap-2 bg-[#131C31] border border-[#23304C] p-1.5 rounded-xl">
              <button id="btn-part-solo" type="button" onclick="selectTeamChoice('solo')" class="flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer bg-amber-400 text-slate-950">Solo</button>
              <button id="btn-part-team" type="button" onclick="selectTeamChoice('team')" class="flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer text-slate-300 hover:text-white">Tim / Kru</button>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label id="player-name-label" for="player-name" class="block text-xs sm:text-sm font-semibold text-slate-300">Nama Pemain</label>
                <span id="lobby-replay-hint" class="hidden text-[11px] font-semibold text-emerald-400">Mode Latihan aktif · Boleh main ulang</span>
              </div>
              <input id="player-name" type="text" maxlength="20" placeholder="Masukkan namamu di sini..." onkeydown="if(event.key==='Enter') handleLobbyStartClick()"
                class="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base sm:text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400">
            </div>
            <div id="lobby-team-input-wrap" class="hidden">
              <label for="player-team-name" class="block text-xs sm:text-sm font-semibold text-sky-300 mb-1.5">Nama Tim / Kru Kapal</label>
              <input id="player-team-name" type="text" maxlength="20" placeholder="Contoh: Garuda / Tim Bajak Laut A" onkeydown="if(event.key==='Enter') handleLobbyStartClick()"
                class="w-full px-4 py-3 rounded-xl bg-[#131C31] border border-sky-400/50 text-white font-bold text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400">
            </div>
            <p id="name-error" class="hidden text-rose-400 text-xs mt-1 font-medium" role="alert">Silakan masukkan nama terlebih dahulu.</p>
          </div>
        </div>

        <!-- Banner Sudah Selesai -->
        <div id="already-played-banner" class="hidden bg-[#0B1120] border border-amber-400/30 rounded-xl p-5 text-center mb-6">
          <div class="w-11 h-11 rounded-full bg-amber-400/15 text-amber-300 flex items-center justify-center mx-auto mb-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 class="font-bold text-base sm:text-lg text-amber-300">Kuis Terkunci (Sudah Dikerjakan)</h2>
          <p id="already-played-info" class="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto"></p>
        </div>

        <!-- Aksi Utama Lobby -->
        <div class="flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto">
          <button id="btn-start-quiz" type="button" onclick="handleLobbyStartClick()" disabled
            class="flex-1 bg-slate-800/80 text-slate-400 font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl border border-slate-700 cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap">
            Menunggu Admin...
          </button>
          <button id="btn-lobby-leaderboard" type="button" onclick="playPopClickFx(); showLeaderboardFromLobby()"
            class="hidden arcade-btn bg-[#0B1120] hover:bg-slate-800 text-slate-100 font-semibold text-sm sm:text-base py-3.5 px-5 rounded-xl border border-[#23304C] cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-amber-400" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            <span>Lihat Leaderboard</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 2. WAITING ROOM -->
    <section id="screen-waiting" aria-label="Ruang Tunggu Live" class="hidden relative surface-card border border-amber-400/35 rounded-2xl p-6 sm:p-9 shadow-xl text-center">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#23304C] pb-4 mb-6 text-left">
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono-num">
          <span class="font-bold text-amber-300">Ruang Tunggu Live</span>
          <span class="text-slate-600" aria-hidden="true">·</span>
          <span id="waiting-room-badge" class="text-sky-300 font-bold">Umum</span>
          <span class="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <span id="waiting-gameplay-label" class="hidden sm:inline text-slate-300">Kuis Klasik Serentak</span>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-waiting-live-lb" type="button" onclick="playPopClickFx(); openLiveLeaderboardModal()" class="hidden arcade-btn px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-xs font-bold text-amber-300 hover:bg-slate-800 cursor-pointer">
            Klasemen
          </button>
          <button type="button" onclick="toggleMute()" data-mute-btn="true" aria-label="Bisukan suara efek" title="Bisukan suara efek"
            class="arcade-btn p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-200 hover:bg-slate-800 cursor-pointer">
          </button>
        </div>
      </div>
      <div class="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-9 h-9">
          <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.6" class="anim-radar-ping"/>
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
        </svg>
      </div>
      <h2 class="text-xl sm:text-3xl font-extrabold text-white mb-2">Menunggu Admin Memulai Sesi Live</h2>
      <p class="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
        Tetap buka halaman ini. Layar pertanyaan akan terbuka secara serentak untuk seluruh peserta segera setelah Admin menekan tombol <strong class="text-amber-300">Mulai Live Sekarang</strong>.
      </p>
      <div class="max-w-lg mx-auto mb-4 bg-[#0B1120] border border-[#23304C] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left text-xs">
        <div class="min-w-0">
          <div class="text-[11px] text-slate-400">Identitas Kamu</div>
          <div id="waiting-my-name" class="font-bold text-white truncate">Peserta</div>
        </div>
        <span class="font-mono-num text-[11px] font-bold text-emerald-400">Siap Mulai Serentak</span>
      </div>
      <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-4 sm:p-5 max-w-lg mx-auto mb-6 text-left">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
          <span>Peserta Standby di Ruang Tunggu</span>
          <span id="waiting-count-badge" class="font-mono-num text-emerald-400 font-bold">0 Bergabung</span>
        </div>
        <div id="waiting-players-list" class="flex flex-wrap gap-2 max-h-52 overflow-y-auto"></div>
      </div>
      <button type="button" onclick="playPopClickFx(); leaveWaitingRoom()" class="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white underline py-2 px-4 cursor-pointer">
        Ganti Nama / Keluar Ruang Tunggu
      </button>
    </section>

    <!-- PRE-QUIZ 3-2-1 COUNTDOWN OVERLAY -->
    <div id="pre-countdown-overlay" role="status" aria-live="assertive" class="hidden fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
      <div class="text-xs font-bold uppercase tracking-widest text-amber-300 mb-3">Bersiap Memulai Kuis</div>
      <div id="pre-countdown-number" class="anim-countdown-pop w-28 h-28 rounded-3xl bg-amber-400 text-slate-950 font-mono-num font-extrabold text-6xl flex items-center justify-center arcade-btn-amber">3</div>
      <button type="button" onclick="skipPreCountdown()" class="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer">
        Lewati Hitung Mundur
      </button>
    </div>

    <!-- 3. QUIZ SCREEN -->
    <section id="screen-quiz" aria-label="Arena Kuis" class="hidden space-y-3 sm:space-y-4">
      <div class="surface-card rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-300 min-w-0">
          <span id="quiz-progress-text" class="font-mono-num font-bold text-white shrink-0">1 / 30</span>
          <span class="text-slate-600" aria-hidden="true">·</span>
          <span id="quiz-category-badge" class="font-semibold text-amber-300 truncate">Kategori</span>
          <span class="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <span id="quiz-type-badge" class="text-slate-400 hidden sm:inline">Pilihan Ganda</span>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div id="quiz-active-buffs" class="hidden flex items-center gap-2 text-xs font-bold"></div>
          <div id="quiz-timer-box" class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold font-mono-num text-slate-300">
            <svg id="quiz-hourglass-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-4 h-4 text-amber-300 anim-hourglass-flip">
              <path d="M6 3h12M6 21h12" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>
              <path d="M7.5 3v3.8c0 2.1 1.6 3.7 3.7 4.7l.8.5.8-.5c2.1-1 3.7-2.6 3.7-4.7V3" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M7.5 21v-3.8c0-2.1 1.6-3.7 3.7-4.7l.8-.5.8.5c2.1 1 3.7 2.6 3.7 4.7V21" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M9.3 6.2h5.4c-.3 1.4-1.4 2.5-2.7 3.1-1.3-.6-2.4-1.7-2.7-3.1Z" fill="currentColor" fill-opacity="0.45"/>
              <circle cx="12" cy="13.5" r="0.95" fill="currentColor" class="anim-sand-drop"/>
              <path d="M8.8 19.5c.8-1.4 2-2.2 3.2-2.2s2.4.8 3.2 2.2H8.8Z" fill="currentColor" fill-opacity="0.85"/>
            </svg>
            <span id="timer-text" class="text-white">25d</span>
          </div>
          <div class="relative inline-flex items-center gap-1.5 bg-[#0B1120] border border-[#23304C] px-3 py-1 rounded-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-amber-400" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span id="current-score" class="font-mono-num font-extrabold text-sm sm:text-base text-white">0</span>
            <span id="score-pop-burst" class="hidden pointer-events-none absolute -top-2 right-1 text-[11px] font-mono-num font-extrabold text-emerald-400 whitespace-nowrap anim-score-pop">+0</span>
          </div>
          <button id="btn-quiz-live-lb" type="button" onclick="playPopClickFx(); openLiveLeaderboardModal()" title="Klasemen Sementara"
            class="hidden arcade-btn px-2.5 py-1.5 rounded-lg bg-[#0B1120] border border-[#23304C] text-xs font-bold text-amber-300 hover:bg-slate-800 cursor-pointer">
            Klasemen
          </button>
          <button type="button" onclick="toggleMute()" data-mute-btn="true" aria-label="Bisukan suara efek" title="Bisukan suara efek"
            class="arcade-btn p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer">
          </button>
        </div>
      </div>

      <div class="w-full bg-[#0B1120] border border-[#23304C] h-2 rounded-full overflow-hidden">
        <div id="timer-bar" class="h-full bg-emerald-400 transition-all duration-1000 ease-linear" style="width:100%"></div>
      </div>

      <!-- Roadmap Peta Pelayaran Harta Karun (Tampil di Mode Voyage) -->
      <div id="voyage-roadmap-box" class="hidden surface-card rounded-xl p-3.5 sm:px-4 space-y-2.5"></div>

      <!-- Banner Debuff Puting Beliung -->
      <div id="tornado-banner" role="alert" class="hidden bg-rose-950/90 border border-rose-400/60 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-rose-100 shadow-lg">
        <span id="tornado-banner-text" class="font-bold">Angin Puting Beliung mengguncang kapal!</span>
        <span id="tornado-countdown-badge" class="font-mono-num font-extrabold px-2 py-0.5 rounded bg-rose-400 text-slate-950 shrink-0">5d</span>
      </div>

      <!-- Streak & Powerup Bar -->
      <div id="quiz-gamification-bar" class="surface-card rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div id="quiz-streak-box" class="space-y-1.5 min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span id="streak-counter-badge" class="inline-flex items-center gap-1 font-bold text-amber-300 shrink-0 font-mono-num">
              <svg id="streak-flame-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="w-4 h-4 text-slate-500">
                <path d="M12 2.5c2 3 4.8 5.4 4.8 9.2a4.8 4.8 0 1 1-9.6 0c0-1.9.7-3.4 1.6-4.7.3 1.1 1 1.8 1.9 2.1C10.5 6.8 11 4.5 12 2.5Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 11.2c1 1.3 1.7 2.4 1.7 3.7a1.7 1.7 0 1 1-3.4 0c0-.9.4-1.8 1.7-3.7Z" fill="currentColor"/>
              </svg>
              <span id="streak-counter-text">Streak 0/8</span>
            </span>
            <span id="streak-combo-label" class="hidden font-mono-num font-extrabold text-[11px] text-emerald-400"></span>
            <span class="text-slate-600" aria-hidden="true">·</span>
            <span id="streak-rule-label">Item tiap 8 benar · Debuff #10, #15, #20, #30</span>
          </div>
          <div id="streak-segments" class="grid gap-1 max-w-xs" aria-hidden="true"></div>
        </div>
        <div id="quiz-streak-disabled-note" class="hidden min-w-0 flex-1 text-xs text-slate-300 font-medium"></div>

        <div id="powerup-slots-container" class="grid grid-cols-2 gap-2 w-full sm:w-80 shrink-0"></div>
      </div>

      <!-- Kartu Pertanyaan -->
      <div id="quiz-card" class="relative surface-card rounded-2xl p-5 sm:p-8 shadow-xl overflow-hidden">
        <div id="freeze-overlay" role="alert" class="hidden absolute inset-0 z-30 bg-sky-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border border-sky-400/40 rounded-2xl">
          <div class="w-14 h-14 rounded-2xl bg-sky-400/20 text-sky-300 flex items-center justify-center mb-3 animate-bounce">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8" aria-hidden="true"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>
          </div>
          <h3 class="text-xl sm:text-2xl font-extrabold text-sky-200 mb-1">Layarmu Dibekukan!</h3>
          <p id="freeze-attacker-info" class="text-xs sm:text-sm text-sky-100/90 max-w-sm mb-3"></p>
          <div id="freeze-countdown-text" class="bg-sky-300 text-slate-950 font-extrabold px-4 py-1.5 rounded-lg text-xs sm:text-sm font-mono-num">Mencair dalam 4 detik...</div>
        </div>

        <div class="flex items-center justify-between gap-2 mb-3 text-xs text-slate-400">
          <span id="quiz-type-badge-mobile" class="sm:hidden">Pilihan Ganda</span>
          <span id="quiz-kbd-hint" class="hidden sm:inline text-[11px] text-slate-500">Pintasan keyboard: tekan 1–4 / A–D</span>
        </div>

        <h2 id="question-text" class="text-lg sm:text-2xl font-bold leading-snug text-white mb-5"></h2>

        <!-- Opsional Gambar Soal -->
        <div id="quiz-image-wrap" class="hidden mb-5">
          <div id="quiz-image-box" class="rounded-xl overflow-hidden border border-[#23304C] bg-[#0B1120] max-h-60 flex items-center justify-center">
            <img id="quiz-image-el" alt="Ilustrasi soal" referrerpolicy="no-referrer" onerror="if(window.handleQuizImageError)window.handleQuizImageError()" class="max-h-60 w-auto object-contain mx-auto">
          </div>
          <div id="quiz-image-fallback" class="hidden rounded-xl border border-dashed border-[#23304C] bg-[#0B1120] p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Gambar soal gagal dimuat dari tautan eksternal.</span>
          </div>
        </div>

        <div id="options-container" class="space-y-2.5"></div>

        <div id="submit-complex-container" class="mt-5 hidden">
          <button id="btn-submit-complex" type="button" onclick="submitComplexAnswer()" class="arcade-btn-amber w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3.5 rounded-xl cursor-pointer">
            Kirim Jawaban
          </button>
        </div>

        <div id="feedback-box" role="status" class="hidden mt-6 p-4 sm:p-5 rounded-xl border">
          <div class="flex items-center justify-between gap-3 mb-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div id="feedback-icon" class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"></div>
              <h3 id="feedback-title" class="font-extrabold text-sm sm:text-base"></h3>
            </div>
            <span id="feedback-points" class="font-mono-num font-bold text-xs sm:text-sm text-amber-300 shrink-0"></span>
          </div>
          <p id="feedback-explanation" class="text-xs sm:text-sm text-slate-200 leading-relaxed"></p>
          <button id="btn-next-question" type="button" onclick="playPopClickFx(); nextQuestion()" class="arcade-btn mt-4 w-full bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-sm sm:text-base py-3 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer">
            Lanjut Soal Berikutnya
          </button>
        </div>
      </div>
    </section>

    <!-- 4. LEADERBOARD -->
    <section id="screen-leaderboard" aria-label="Papan Peringkat" class="hidden relative surface-card rounded-2xl p-5 sm:p-9 shadow-xl overflow-hidden">
      <div id="confetti-container" aria-hidden="true" class="hidden pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-5 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 arcade-btn-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-white">Papan Peringkat</h2>
            <p class="text-xs sm:text-sm text-slate-400">Klasemen skor tertinggi seluruh peserta secara real-time</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button id="btn-replay-quiz" type="button" onclick="playPopClickFx(); replayQuizFromLeaderboard()" class="hidden arcade-btn-amber bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
            Main Lagi
          </button>
          <button type="button" onclick="playPopClickFx(); manualRefreshLeaderboard()" class="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-lg border border-[#23304C] cursor-pointer">
            Refresh
          </button>
          <button type="button" onclick="playPopClickFx(); backToLobbyFromLeaderboard()" class="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#23304C] cursor-pointer">
            Beranda
          </button>
          <button type="button" onclick="toggleMute()" data-mute-btn="true" aria-label="Bisukan suara efek" title="Bisukan suara efek"
            class="arcade-btn p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-200 hover:bg-slate-800 cursor-pointer">
          </button>
        </div>
      </div>

      <div id="lb-player-summary" class="hidden relative z-10 bg-[#0B1120] border border-amber-400/35 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div class="text-xs text-slate-400 font-medium">Hasil Permainanmu</div>
          <div id="lb-my-name" class="text-lg sm:text-xl font-extrabold text-white mt-0.5"></div>
          <div id="lb-my-rank-info" class="hidden text-xs font-bold text-amber-300 mt-1 font-mono-num"></div>
        </div>
        <div class="flex items-center gap-6">
          <div>
            <div class="text-xs text-slate-400">Benar</div>
            <div id="lb-my-correct" class="font-mono-num text-lg sm:text-xl font-extrabold text-emerald-400">0/30</div>
          </div>
          <div class="h-8 w-px bg-[#23304C]"></div>
          <div>
            <div class="text-xs text-slate-400">Total Skor</div>
            <div id="lb-my-score" class="font-mono-num text-xl sm:text-2xl font-extrabold text-amber-400">0</div>
          </div>
        </div>
      </div>

      <div id="lb-standings-tabs" class="hidden relative z-10 inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl mb-3">
        <button id="lb-tab-individual" type="button" onclick="switchLeaderboardTab('individual')" class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-amber-400 text-slate-950">Individu</button>
        <button id="lb-tab-team" type="button" onclick="switchLeaderboardTab('team')" class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer text-slate-300 hover:text-white">Tim / Kru</button>
      </div>

      <div class="relative z-10 bg-[#0B1120] border border-[#23304C] rounded-xl overflow-hidden mb-7">
        <div id="leaderboard-table-head" class="grid grid-cols-12 px-4 py-3 text-xs font-semibold text-slate-400 border-b border-[#23304C]">
          <div class="col-span-2 text-center">Rank</div>
          <div class="col-span-5">Nama Pemain</div>
          <div class="col-span-2 text-center">Benar</div>
          <div class="col-span-3 text-right">Skor</div>
        </div>
        <div id="leaderboard-list" class="divide-y divide-[#23304C]/70 max-h-80 overflow-y-auto"></div>
      </div>

      <div id="review-section" class="hidden relative z-10">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 class="text-base sm:text-lg font-extrabold text-white">Kunci Jawaban &amp; Pembahasan</h3>
          <div role="tablist" aria-label="Filter Pembahasan" class="inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl w-fit">
            <button id="btn-review-all" type="button" role="tab" aria-selected="true" onclick="setReviewFilter('all')" class="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer bg-amber-400 text-slate-950">Semua (0)</button>
            <button id="btn-review-wrong" type="button" role="tab" aria-selected="false" onclick="setReviewFilter('wrong')" class="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer text-slate-300 hover:text-white">Salah Saja (0)</button>
          </div>
        </div>
        <div id="review-list" class="space-y-2.5 max-h-96 overflow-y-auto pr-1"></div>
      </div>
    </section>

    <!-- 5. ADMIN DASHBOARD (5 Tabs) -->
    <section id="screen-admin" aria-label="Dashboard Admin" class="hidden surface-card rounded-2xl p-5 sm:p-8 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-5 mb-5">
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="text-xs font-semibold text-amber-300">Panel Penyelenggara</span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-mono-num font-bold">
              Ruang Aktif: <span id="admin-room-badge">Umum (Default)</span>
            </span>
          </div>
          <h2 class="text-xl sm:text-2xl font-extrabold text-white">Kontrol Sesi &amp; Statistik Kuis</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" onclick="playPopClickFx(); exportScoresCsv()" class="arcade-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-lg cursor-pointer whitespace-nowrap">
            Unduh CSV
          </button>
          <button type="button" onclick="playPopClickFx(); closeAdminDashboard()" class="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-lg border border-[#23304C] cursor-pointer whitespace-nowrap">
            Tutup
          </button>
        </div>
      </div>

      <!-- 5 Tabs -->
      <div role="tablist" aria-label="Menu Admin" class="flex flex-nowrap overflow-x-auto sm:flex-wrap gap-1.5 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl mb-6">
        <button id="admin-tab-session" type="button" role="tab" aria-selected="true" onclick="switchAdminTab('session')" class="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap bg-amber-400 text-slate-950">Kontrol Sesi</button>
        <button id="admin-tab-gamification" type="button" role="tab" aria-selected="false" onclick="switchAdminTab('gamification')" class="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white">Gamifikasi</button>
        <button id="admin-tab-settings" type="button" role="tab" aria-selected="false" onclick="switchAdminTab('settings')" class="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white">Pengaturan &amp; Tampilan</button>
        <button id="admin-tab-stats" type="button" role="tab" aria-selected="false" onclick="switchAdminTab('stats')" class="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white">Statistik &amp; Peserta (0)</button>
        <button id="admin-tab-questions" type="button" role="tab" aria-selected="false" onclick="switchAdminTab('questions')" class="px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white">Bank Soal (30)</button>
      </div>

      <!-- TAB 1: KONTROL SESI -->
      <div id="admin-panel-session" class="space-y-5">
        <!-- LANGKAH 1: KODE RUANGAN (PRIORITAS PERTAMA) -->
        <div id="admin-room-step-card" class="bg-[#0B1120] border border-sky-400/50 rounded-xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono-num text-[11px] font-extrabold">LANGKAH 1</span>
              <h3 class="text-base font-bold text-white">Atur &amp; Konfirmasi Kode Ruangan</h3>
            </div>
            <span id="admin-room-status-pill" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">Konfirmasi Ruang Dulu</span>
          </div>

          <div class="bg-[#131C31] border border-[#23304C] rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs text-slate-300">
              Kamu sedang berada di kode ruang:
              <strong id="admin-current-room-display" class="font-mono-num text-sky-300 text-sm ml-1">UMUM (Default)</strong>
              <span id="admin-room-draft-hint" class="hidden ml-2 text-amber-300 font-semibold"></span>
            </div>
            <button type="button" onclick="adminCopyRoomLink()" class="bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-[#23304C] font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap">Salin Link Ruang</button>
          </div>

          <p class="text-xs text-slate-400 mb-3 leading-relaxed">
            Disarankan membuat kode ruangan sendiri (mis. <code class="text-amber-300">KELAS8A</code> atau <code class="text-amber-300">IPA-PAGI</code>) agar bank soal dan leaderboard terpisah, atau klik <strong class="text-slate-200">Buat Kode Acak</strong> untuk generate default. Kosongkan jika ingin tetap memakai Ruang Umum.
          </p>

          <div class="flex flex-wrap gap-2">
            <input id="admin-room-input" type="text" maxlength="20" oninput="onAdminRoomInputChange()" placeholder="Ketik kode buatan sendiri (Kosong = Umum)" class="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-lg bg-[#131C31] border border-[#23304C] text-white font-mono-num font-bold text-xs uppercase">
            <button type="button" onclick="generateAdminRoomCode()" class="bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] font-bold text-xs px-3.5 py-2.5 rounded-lg cursor-pointer whitespace-nowrap">Buat Kode Acak</button>
            <button id="btn-confirm-room-step" type="button" onclick="adminConfirmRoomStep()" class="arcade-btn bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-lg cursor-pointer whitespace-nowrap">Konfirmasi Ruang Ini</button>
          </div>
        </div>

        <!-- LANGKAH 2: MODE PELAKSANAAN -->
        <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono-num text-[11px] font-extrabold">LANGKAH 2</span>
              <h3 class="text-base font-bold text-white">Mode Pelaksanaan (Bebas vs Live Bareng)</h3>
            </div>
            <span id="admin-mode-step-lock-tag" class="text-[11px] font-bold text-amber-300">Selesaikan Langkah 1 dulu</span>
          </div>
          <p class="text-xs text-slate-400 mb-4 leading-relaxed">
            Secara bawaan peserta menunggu pilihan Admin. Jika salah satu mode sudah berjalan dengan peserta aktif/selesai, mode lainnya otomatis terkunci agar sesi tetap konsisten.
          </p>
          <div id="admin-mode-locked-banner" class="mb-4 bg-amber-500/10 border border-amber-400/30 rounded-lg px-4 py-2.5 text-xs text-amber-200">
            Atur atau konfirmasi kode ruangan di <strong>Langkah 1</strong> terlebih dahulu untuk membuka kontrol Mode Pelaksanaan.
          </div>
          <div class="flex flex-wrap gap-2.5 mb-4">
            <button id="btn-mode-free" type="button" onclick="adminSetSessionMode('free')" class="px-4 py-2.5 rounded-lg text-xs font-bold border bg-[#131C31] text-slate-200 border-[#23304C] cursor-pointer whitespace-nowrap">Mode Bebas</button>
            <button id="btn-mode-live-wait" type="button" onclick="adminSetSessionMode('live_waiting')" class="px-4 py-2.5 rounded-lg text-xs font-bold border bg-[#131C31] text-slate-200 border-[#23304C] cursor-pointer whitespace-nowrap">Buka Lobby Live</button>
            <button id="btn-mode-live-start" type="button" onclick="adminSetSessionMode('live_started')" class="px-4 py-2.5 rounded-lg text-xs font-extrabold bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer whitespace-nowrap">Mulai Live Sekarang</button>
            <button id="btn-mode-reset" type="button" onclick="adminResetSessionMode()" class="px-4 py-2.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer whitespace-nowrap">Reset Mode</button>
          </div>
          <div id="admin-session-status-banner" class="bg-[#131C31] border border-[#23304C] rounded-lg px-4 py-3 text-xs text-slate-300"></div>
        </div>

        <!-- Ruang Tunggu Live & Monitor Live (2 Kolom Seimbang) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
            <div class="flex items-center justify-between gap-2 mb-3">
              <div id="admin-waiting-title" class="text-sm font-bold text-white">Peserta di Ruang Tunggu Live (0)</div>
              <span class="text-[11px] font-mono-num text-slate-400">Lobby Live</span>
            </div>
            <div id="admin-waiting-list" class="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1"></div>
          </div>

          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
            <div class="flex items-center justify-between gap-2 mb-3">
              <h3 id="admin-active-count-title" class="text-sm font-bold text-white">Pantau Live: Sedang Mengerjakan (0)</h3>
              <span class="text-[11px] text-slate-400">Update tiap soal</span>
            </div>
            <div id="admin-active-players-list"></div>
          </div>
        </div>

        <!-- Klasemen Leaderboard Live Admin -->
        <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 id="admin-live-lb-title" class="text-sm font-bold text-white">Klasemen Leaderboard Live</h3>
            <div class="inline-flex items-center gap-1 p-1 bg-[#131C31] border border-[#23304C] rounded-lg">
              <button id="admin-lb-tab-ind" type="button" onclick="switchAdminLbTab('individual')" class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer bg-amber-400 text-slate-950">Individu</button>
              <button id="admin-lb-tab-team" type="button" onclick="switchAdminLbTab('team')" class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer text-slate-300 hover:text-white">Tim</button>
            </div>
          </div>
          <div id="admin-live-lb-list" class="max-h-56 overflow-y-auto space-y-1.5 pr-1"></div>
        </div>
      </div>

      <!-- TAB 2: GAMIFIKASI -->
      <div id="admin-panel-gamification" class="hidden space-y-5">
        <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-bold text-white">Aktifkan Fitur Gamifikasi</h3>
              <span id="admin-gamification-status-badge" class="px-2 py-0.5 rounded-md text-[11px] font-extrabold border bg-emerald-500/15 border-emerald-400/35 text-emerald-300">Aktif</span>
            </div>
            <p id="admin-gamification-status-desc" class="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Pemain mendapatkan Streak kombo, Buff (Skor 2x, 50:50, Perisai), serta Debuff serangan lawan (Bekukan #1, Acak Opsi, Puting Beliung) saat kuis berlangsung.
            </p>
          </div>
          <button id="setting-gamification-enabled" type="button" role="switch" aria-checked="true" aria-label="Aktifkan Fitur Gamifikasi" onclick="adminToggleGamification()" class="arcade-btn px-4 py-2.5 rounded-lg text-xs font-extrabold border inline-flex items-center gap-2.5 cursor-pointer shrink-0 whitespace-nowrap bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-300">
            <span id="admin-gamification-switch-track" class="w-8 h-4 rounded-full p-0.5 transition-colors inline-flex items-center bg-slate-950/30 justify-end">
              <span class="w-3 h-3 rounded-full bg-white shadow"></span>
            </span>
            <span id="admin-gamification-switch-text">Gamifikasi ON</span>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-bold text-white">Mode Gameplay</span>
              <span id="admin-voyage-island-badge" class="text-[11px] font-mono-num text-sky-300 font-bold"></span>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <button id="btn-gameplay-classic" type="button" onclick="adminSetGameplayMode('classic')" class="px-3.5 py-2.5 rounded-lg text-xs font-bold border cursor-pointer bg-amber-400 text-slate-950 border-amber-300">Kuis Klasik</button>
              <button id="btn-gameplay-voyage" type="button" onclick="adminSetGameplayMode('voyage')" class="px-3.5 py-2.5 rounded-lg text-xs font-bold border cursor-pointer bg-[#131C31] text-slate-300 border-[#23304C]">Berlayar Harta Karun</button>
            </div>
            <p id="admin-gameplay-gamification-note" class="text-xs text-slate-400 leading-relaxed">
              Pada mode Berlayar Harta Karun, setiap 5 soal kapal berlayar 3 langkah dan berlabuh di pulau minigame untuk meraih Buff atau Debuff.
            </p>
          </div>

          <div id="admin-part-card" class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3 transition-opacity">
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-bold text-white">Kepesertaan (Solo / Tim)</div>
              <span id="admin-part-scope-note" class="text-[11px] font-mono-num text-slate-400">Khusus Mode Berlayar</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button id="btn-part-mode-either" type="button" onclick="adminSetParticipationMode('either')" class="px-3 py-2.5 rounded-lg text-xs font-bold border cursor-pointer bg-emerald-400 text-slate-950 border-emerald-300">Bebas</button>
              <button id="btn-part-mode-solo" type="button" onclick="adminSetParticipationMode('solo')" class="px-3 py-2.5 rounded-lg text-xs font-bold border cursor-pointer bg-[#131C31] text-slate-300 border-[#23304C]">Solo Saja</button>
              <button id="btn-part-mode-team" type="button" onclick="adminSetParticipationMode('team')" class="px-3 py-2.5 rounded-lg text-xs font-bold border cursor-pointer bg-[#131C31] text-slate-300 border-[#23304C]">Tim Saja</button>
            </div>
            <p id="admin-part-desc" class="text-xs text-slate-400 leading-relaxed">
              Saat memakai Kuis Klasik, seluruh peserta otomatis bermain individu dan pilihan Solo / Tim disembunyikan dari beranda.
            </p>
          </div>
        </div>

        <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 id="admin-gamification-catalog-title" class="text-sm font-bold text-white">Pilih Fitur Buff &amp; Debuff (6/6 Aktif)</h3>
            <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono-num">
              <span id="admin-gamification-streak-rule" class="px-2 py-0.5 rounded bg-[#131C31] border border-[#23304C] text-amber-300">Streak: 8 benar</span>
              <span id="admin-gamification-debuff-rule" class="px-2 py-0.5 rounded bg-[#131C31] border border-[#23304C] text-sky-300">Drop Debuff: #10, #15, #20, #30</span>
            </div>
          </div>

          <div id="admin-gamification-mechanics-row" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity">
            <button id="setting-streak-enabled" type="button" role="switch" aria-checked="true" onclick="adminToggleGamificationMechanic('streakEnabled')" class="p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer bg-amber-400/10 border-amber-400/35">
              <div>
                <div id="setting-streak-title" class="text-xs font-bold text-white">Hadiah Streak Benar</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Beri Buff/Debuff aktif setiap menjawab benar beruntun.</div>
              </div>
              <span id="setting-streak-badge" class="px-2 py-0.5 rounded text-[11px] font-mono-num font-extrabold shrink-0 bg-emerald-500/20 text-emerald-300">ON</span>
            </button>
            <button id="setting-milestone-drops-enabled" type="button" role="switch" aria-checked="true" onclick="adminToggleGamificationMechanic('milestoneDropsEnabled')" class="p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer bg-sky-400/10 border-sky-400/35">
              <div>
                <div class="text-xs font-bold text-white">Drop Debuff Milestone Soal</div>
                <div id="setting-milestone-desc" class="text-[11px] text-slate-400 mt-0.5">Beri Debuff acak di tengah kuis agar persaingan seru.</div>
              </div>
              <span id="setting-milestone-badge" class="px-2 py-0.5 rounded text-[11px] font-mono-num font-extrabold shrink-0 bg-emerald-500/20 text-emerald-300">ON</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span class="text-xs text-slate-400">Klik item di bawah untuk menyalakan/mematikan satu per satu, atau pilih cepat:</span>
            <div id="admin-gamification-presets" class="flex flex-wrap items-center gap-1.5">
              <button type="button" data-preset="all" onclick="adminApplyPowerupPreset('all')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer bg-amber-400 text-slate-950 border-amber-300">Semua (6)</button>
              <button type="button" data-preset="buffs" onclick="adminApplyPowerupPreset('buffs')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]">Buff Saja</button>
              <button type="button" data-preset="double" onclick="adminApplyPowerupPreset('double')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]">Hanya Skor 2x</button>
              <button type="button" data-preset="none" onclick="adminApplyPowerupPreset('none')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]">Kosongkan</button>
            </div>
          </div>

          <div id="admin-gamification-catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 transition-opacity"></div>
        </div>
      </div>

      <!-- TAB 3: PENGATURAN & TAMPILAN -->
      <div id="admin-panel-settings" class="hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
          <div class="text-sm font-bold text-white">Pengaturan Kuis, Timer &amp; Tampilan</div>

          <div class="p-3 rounded-lg bg-[#131C31] border border-[#23304C] space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-white">Timer Kuis Global (Menit)</span>
              <span id="admin-timer-mode-badge" class="text-[11px] font-mono-num font-bold text-slate-400">Per-Soal</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button type="button" onclick="adminSetDurationMinutes(0)" class="px-2.5 py-1 rounded bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-[11px] font-mono-num font-bold text-slate-200 cursor-pointer">Per-Soal (0)</button>
              <button type="button" onclick="adminSetDurationMinutes(15)" class="px-2.5 py-1 rounded bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-[11px] font-mono-num font-bold text-slate-200 cursor-pointer">15m</button>
              <button type="button" onclick="adminSetDurationMinutes(30)" class="px-2.5 py-1 rounded bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-[11px] font-mono-num font-bold text-amber-300 cursor-pointer">30m</button>
              <button type="button" onclick="adminSetDurationMinutes(45)" class="px-2.5 py-1 rounded bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-[11px] font-mono-num font-bold text-slate-200 cursor-pointer">45m</button>
              <button type="button" onclick="adminSetDurationMinutes(60)" class="px-2.5 py-1 rounded bg-[#0B1120] hover:bg-slate-800 border border-[#23304C] text-[11px] font-mono-num font-bold text-slate-200 cursor-pointer">60m</button>
            </div>
            <div class="flex items-center gap-1.5 pt-1">
              <input id="setting-quiz-duration" type="number" min="0" max="180" value="0" class="w-20 px-2.5 py-1.5 rounded bg-[#0B1120] border border-[#23304C] text-white text-xs font-mono-num font-bold text-center">
              <button type="button" onclick="adminApplyDurationCustom()" class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded cursor-pointer">Simpan Timer</button>
            </div>
          </div>

          <label class="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
            <div>
              <div class="text-xs font-bold text-white">Tampilkan Leaderboard Live ke Pemain</div>
              <div class="text-[11px] text-slate-400">Menambahkan tombol Klasemen di layar tunggu &amp; kuis peserta.</div>
            </div>
            <input id="setting-show-live-lb" type="checkbox" onchange="adminToggleSetting('showLiveLeaderboardToPlayers', this.checked)" class="mt-1 accent-amber-400 w-4 h-4 cursor-pointer">
          </label>

          <label class="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
            <div>
              <div class="text-xs font-bold text-white">Mode Latihan (Boleh Main Ulang)</div>
              <div class="text-[11px] text-slate-400">Buka kunci 1x per perangkat agar peserta bisa mengulang kuis.</div>
            </div>
            <input id="setting-allow-replay" type="checkbox" onchange="adminToggleSetting('allowReplay', this.checked)" class="mt-1 accent-amber-400 w-4 h-4 cursor-pointer">
          </label>

          <label class="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
            <div>
              <div class="text-xs font-bold text-white">Acak Urutan Soal per Pemain</div>
              <div class="text-[11px] text-slate-400">Mencegah saling contek urutan nomor antar peserta.</div>
            </div>
            <input id="setting-shuffle-questions" type="checkbox" onchange="adminToggleSetting('shuffleQuestions', this.checked)" class="mt-1 accent-amber-400 w-4 h-4 cursor-pointer">
          </label>

          <label class="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
            <div>
              <div class="text-xs font-bold text-white">Acak Posisi Opsi A–D</div>
              <div class="text-[11px] text-slate-400">Posisi opsi pilihan ganda &amp; multi-pilih diacak otomatis.</div>
            </div>
            <input id="setting-shuffle-options" type="checkbox" onchange="adminToggleSetting('shuffleOptions', this.checked)" class="mt-1 accent-amber-400 w-4 h-4 cursor-pointer">
          </label>

          <label class="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
            <div>
              <div class="text-xs font-bold text-white">Mode Ringkas (Embed Google Sites)</div>
              <div class="text-[11px] text-slate-400">Menghemat padding vertikal untuk bingkai situs sempit.</div>
            </div>
            <input id="setting-compact-mode" type="checkbox" onchange="adminToggleSetting('compactMode', this.checked)" class="mt-1 accent-amber-400 w-4 h-4 cursor-pointer">
          </label>

          <div class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
            <div>
              <label for="setting-question-limit" class="text-xs font-bold text-white block">Batas Jumlah Soal / Sesi</label>
              <span id="setting-limit-hint" class="text-[11px] text-slate-400">Isi 0 untuk memakai semua soal.</span>
            </div>
            <div class="flex items-center gap-1.5">
              <input id="setting-question-limit" type="number" min="0" max="200" value="0" class="w-16 px-2.5 py-1.5 rounded bg-[#0B1120] border border-[#23304C] text-white text-xs font-mono-num font-bold text-center">
              <button type="button" onclick="adminApplyQuestionLimit()" class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded cursor-pointer">Terapkan</button>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
            <div class="text-sm font-bold text-white">Ubah PIN Admin</div>
            <p class="text-xs text-slate-400 leading-relaxed">PIN ini digunakan untuk membuka Panel Penyelenggara di ruangan aktif saat ini.</p>
            <div class="flex gap-2">
              <input id="admin-change-pin-input" type="text" maxlength="10" placeholder="Minimal 4 karakter" class="flex-1 px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white font-mono-num font-bold text-xs tracking-widest">
              <button type="button" onclick="adminSaveNewPin()" class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap">Simpan PIN</button>
            </div>
          </div>

          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
            <div class="text-sm font-bold text-white">Pemulihan Bank Soal Bawaan</div>
            <p class="text-xs text-slate-400 leading-relaxed">Kembalikan daftar soal pada ruangan aktif menjadi 30 soal trivia Nusantara bawaan apabila ingin memulai ulang materi.</p>
            <button type="button" onclick="askResetDefaultQuestions()" class="w-full bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer whitespace-nowrap">
              Muat Ulang 30 Soal Default
            </button>
          </div>

          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-2.5">
            <div class="text-sm font-bold text-white">Ringkasan Konfigurasi Aktif</div>
            <dl class="divide-y divide-[#23304C]/70 text-xs">
              <div class="py-2 flex items-center justify-between gap-2">
                <dt class="text-slate-400">Ruang Aktif</dt>
                <dd id="admin-summary-room" class="font-mono-num font-bold text-sky-300">UMUM</dd>
              </div>
              <div class="py-2 flex items-center justify-between gap-2">
                <dt class="text-slate-400">Fitur Gamifikasi</dt>
                <dd id="admin-summary-gamification" class="font-mono-num font-bold text-emerald-400">Aktif</dd>
              </div>
              <div class="py-2 flex items-center justify-between gap-2">
                <dt class="text-slate-400">Mode Gameplay</dt>
                <dd id="admin-summary-gameplay" class="font-mono-num font-bold text-white">Kuis Klasik</dd>
              </div>
              <div class="py-2 flex items-center justify-between gap-2">
                <dt class="text-slate-400">Timer Kuis</dt>
                <dd id="admin-summary-timer" class="font-mono-num font-bold text-amber-300">Per-Soal</dd>
              </div>
              <div class="py-2 flex items-center justify-between gap-2">
                <dt class="text-slate-400">Tampilan &amp; Soal</dt>
                <dd id="admin-summary-display" class="font-mono-num font-bold text-slate-200 text-right">30 Soal · Normal</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- TAB 2: STATISTIK & PESERTA -->
      <div id="admin-panel-stats" class="hidden space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-num">
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-4"><div class="text-xs text-slate-400 font-sans">Total Peserta</div><div id="stat-total-players" class="text-2xl sm:text-3xl font-extrabold text-white mt-1">0</div></div>
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-4"><div class="text-xs text-slate-400 font-sans">Rata-rata Skor</div><div id="stat-avg-score" class="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">0</div></div>
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-4"><div class="text-xs text-slate-400 font-sans">Skor Tertinggi</div><div id="stat-max-score" class="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">0</div></div>
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-4"><div class="text-xs text-slate-400 font-sans">Rata-rata Benar</div><div id="stat-avg-correct" class="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-1">0%</div></div>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white mb-3">Statistik Ketepatan Per Soal</h3>
          <div id="admin-question-stats" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1"></div>
        </div>
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 class="text-sm font-bold text-white">Data Peserta &amp; Kontrol Kunci Perangkat</h3>
            <button type="button" onclick="askResetAllParticipants()" class="text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold px-3 py-1.5 rounded-lg w-fit cursor-pointer">
              Reset Semua Skor Peserta
            </button>
          </div>
          <div class="bg-[#0B1120] border border-[#23304C] rounded-xl overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="text-slate-400 border-b border-[#23304C] text-xs">
                <tr>
                  <th class="py-3 px-4">Rank</th><th class="py-3 px-4">Nama Peserta</th><th class="py-3 px-4 text-center">Benar</th><th class="py-3 px-4 text-right">Skor</th><th class="py-3 px-4">Waktu Selesai</th><th class="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="admin-participants-tbody" class="divide-y divide-[#23304C]/70"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: BANK SOAL CRUD & CSV IMPORT -->
      <div id="admin-panel-questions" class="hidden space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 id="admin-bank-title" class="text-base font-bold text-white">Kelola Bank Soal (30 Soal)</h3>
            <p class="text-xs text-slate-400">Target streak &amp; milestone debuff otomatis menyesuaikan jumlah soal.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" onclick="playPopClickFx(); openImportModal()" class="arcade-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-3.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
              Impor CSV / Excel
            </button>
            <button type="button" onclick="playPopClickFx(); exportQuestionsCsv()" class="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-[#23304C] font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
              Ekspor Soal CSV
            </button>
            <button type="button" onclick="playPopClickFx(); openCrudModal(-1)" class="arcade-btn-amber bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-3.5 rounded-lg cursor-pointer whitespace-nowrap">
              + Tambah Soal
            </button>
          </div>
        </div>

        <!-- Search & Filter Bank Soal -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-[#0B1120] border border-[#23304C] rounded-xl p-3">
          <div class="sm:col-span-6">
            <input id="admin-q-search" type="search" aria-label="Cari pertanyaan di bank soal" oninput="renderAdminBankSoal()" placeholder="Cari teks soal atau kata kunci..."
              class="w-full px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400">
          </div>
          <div class="sm:col-span-3">
            <select id="admin-q-cat-filter" aria-label="Filter kategori soal" onchange="renderAdminBankSoal()" class="w-full px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white text-xs font-semibold"></select>
          </div>
          <div class="sm:col-span-3">
            <select id="admin-q-type-filter" aria-label="Filter tipe soal" onchange="renderAdminBankSoal()" class="w-full px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white text-xs font-semibold">
              <option value="ALL">Semua Tipe</option>
              <option value="MC">Pilihan Ganda (MC)</option>
              <option value="TF">Benar/Salah (TF)</option>
              <option value="MS">Pilih Beberapa (MS)</option>
              <option value="TEXT">Isian Singkat (TEXT)</option>
            </select>
          </div>
        </div>

        <div id="admin-questions-list" class="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1"></div>
      </div>
    </section>
  </div>

  <!-- FLOATING STATUS & ADMIN -->
  <div class="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 z-40">
    <div class="bg-[#131C31]/95 text-slate-300 text-[11px] px-3 py-1.5 rounded-lg border border-[#23304C] flex items-center gap-1.5 shadow-lg">
      <span id="cloud-status-dot" class="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
      <span id="cloud-status-text" class="truncate">Menghubungkan Cloud...</span>
    </div>
    <button type="button" onclick="playPopClickFx(); openAdminPinModal()" class="bg-[#131C31]/95 hover:bg-slate-800 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 shadow-lg cursor-pointer">
      <span>Admin</span>
    </button>
  </div>

  <!-- MODAL RUANGAN / KELAS -->
  <div id="modal-room" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="surface-card rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
      <button type="button" aria-label="Tutup modal ruangan" onclick="closeRoomModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">✕</button>
      <h3 class="text-lg font-extrabold text-white mb-1">Pilih Ruangan / Kelas</h3>
      <p class="text-xs text-slate-400 mb-4">Masukkan kode ruangan dari penyelenggara, atau kosongkan untuk ruang umum.</p>
      <input id="room-modal-input" type="text" maxlength="20" onkeydown="if(event.key==='Enter') applyRoomFromModal()" placeholder="Contoh: KELAS8A (Kosong = Umum)"
        class="w-full px-4 py-3 rounded-xl bg-white text-slate-950 font-mono-num font-bold text-center text-sm tracking-wider mb-4 uppercase focus:outline-none focus:ring-2 focus:ring-sky-400">
      <div class="flex gap-2">
        <button type="button" onclick="closeRoomModal()" class="flex-1 bg-[#0B1120] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl border border-[#23304C] cursor-pointer">Batal</button>
        <button type="button" onclick="playPopClickFx(); applyRoomFromModal()" class="flex-1 bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold py-2.5 rounded-xl cursor-pointer">Masuk Ruang</button>
      </div>
    </div>
  </div>

  <!-- MODAL ADMIN PIN -->
  <div id="modal-admin-pin" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="surface-card rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
      <button type="button" aria-label="Tutup modal admin" onclick="closeAdminPinModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">✕</button>
      <h3 class="text-lg font-extrabold text-white mb-1">Akses Dashboard Admin</h3>
      <p class="text-xs text-slate-400 mb-4">Masukkan PIN Admin untuk mengontrol sesi Live &amp; kelola bank soal.</p>
      <input id="admin-pin-input" type="password" maxlength="10" onkeydown="if(event.key==='Enter') verifyAdminPin()" placeholder="Masukkan PIN Admin"
        class="w-full px-4 py-3 rounded-xl bg-white text-slate-950 font-mono-num font-bold text-center text-lg tracking-widest mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
      <p id="admin-pin-error" class="hidden text-rose-400 text-xs mb-3" role="alert">PIN salah! Silakan coba lagi.</p>
      <div class="flex gap-2 mt-4">
        <button type="button" onclick="closeAdminPinModal()" class="flex-1 bg-[#0B1120] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl border border-[#23304C] cursor-pointer">Batal</button>
        <button type="button" onclick="verifyAdminPin()" class="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-2.5 rounded-xl cursor-pointer">Masuk</button>
      </div>
    </div>
  </div>

  <!-- MODAL DETAIL PESERTA -->
  <div id="modal-player-detail" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
    <div class="surface-card rounded-2xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex items-start justify-between gap-3 border-b border-[#23304C] pb-4 mb-4">
        <div>
          <div class="text-xs text-amber-300 font-semibold">Analisis Detail Peserta</div>
          <h3 id="detail-player-name" class="text-xl font-extrabold text-white mt-0.5"></h3>
          <p id="detail-player-meta" class="text-xs text-slate-400 mt-0.5 break-all"></p>
        </div>
        <button type="button" onclick="closePlayerDetailModal()" class="px-3 py-1.5 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer text-xs font-bold">Tutup</button>
      </div>
      <div id="detail-metrics-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 font-mono-num"></div>
      <div id="detail-history-list" class="space-y-2 max-h-72 overflow-y-auto pr-1"></div>
    </div>
  </div>

  <!-- MODAL KONFIRMASI HAPUS / RESET (IN-PAGE) -->
  <div id="modal-confirm-action" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
    <div class="bg-[#131C31] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 id="confirm-action-title" class="text-lg font-extrabold text-white mb-1"></h3>
      <p id="confirm-action-desc" class="text-xs text-slate-300 mb-5"></p>
      <div class="flex gap-2">
        <button type="button" onclick="closeConfirmActionModal()" class="flex-1 bg-[#0B1120] text-white font-bold py-2.5 rounded-lg border border-[#23304C] cursor-pointer">Batal</button>
        <button id="confirm-action-submit" type="button" onclick="executeConfirmAction()" class="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-extrabold py-2.5 rounded-lg cursor-pointer">Ya, Lanjutkan</button>
      </div>
    </div>
  </div>

  <!-- MODAL CRUD SOAL -->
  <div id="modal-admin-crud" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
    <div class="surface-card rounded-2xl p-5 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 id="crud-modal-title" class="text-lg font-extrabold text-white">Tambah Soal Baru</h3>
        <button type="button" onclick="closeCrudModal()" class="text-slate-400 hover:text-white cursor-pointer">✕</button>
      </div>
      <input type="hidden" id="crud-edit-index" value="-1">
      <div class="space-y-3.5 text-sm">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label for="crud-category" class="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
            <select id="crud-category" onchange="toggleCrudCustomCategory()" class="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-semibold"></select>
          </div>
          <div>
            <label for="crud-type" class="block text-xs font-semibold text-slate-300 mb-1">Tipe Soal</label>
            <select id="crud-type" onchange="toggleCrudTypeFields()" class="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-semibold">
              <option value="MC">Multiple Choice</option>
              <option value="TF">True or False</option>
              <option value="MS">Multiple Select</option>
              <option value="TEXT">Isian Singkat</option>
            </select>
          </div>
          <div>
            <label for="crud-time" class="block text-xs font-semibold text-slate-300 mb-1">Waktu (Detik)</label>
            <input id="crud-time" type="number" min="10" max="120" value="25" class="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-mono-num font-bold">
          </div>
        </div>
        <div id="crud-custom-cat-wrap" class="hidden">
          <label for="crud-custom-category" class="block text-xs font-semibold text-slate-300 mb-1">Nama Kategori Baru</label>
          <input id="crud-custom-category" type="text" placeholder="Contoh: Sejarah Kemerdekaan" class="w-full px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-bold">
        </div>
        <div>
          <label for="crud-question" class="block text-xs font-semibold text-slate-300 mb-1">Teks Pertanyaan</label>
          <textarea id="crud-question" rows="2" placeholder="Tulis pertanyaan di sini..." class="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-950 font-semibold text-sm"></textarea>
        </div>
        <div>
          <label for="crud-image-url" class="block text-xs font-semibold text-slate-300 mb-1">URL Gambar Soal (Opsional)</label>
          <input id="crud-image-url" type="url" placeholder="https://contoh.com/gambar-peta.jpg" class="w-full px-3.5 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs">
        </div>
        <div id="crud-options-wrapper" class="space-y-2">
          <div class="text-xs font-semibold text-slate-300">Opsi Jawaban (A - D)</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="flex items-center gap-2 bg-[#0B1120] border border-[#23304C] p-1.5 rounded-lg"><span class="w-7 h-7 rounded bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">A</span><input id="crud-opt-0" type="text" placeholder="Opsi A..." class="w-full px-2.5 py-1.5 rounded bg-white text-slate-950 text-xs font-semibold"></div>
            <div class="flex items-center gap-2 bg-[#0B1120] border border-[#23304C] p-1.5 rounded-lg"><span class="w-7 h-7 rounded bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">B</span><input id="crud-opt-1" type="text" placeholder="Opsi B..." class="w-full px-2.5 py-1.5 rounded bg-white text-slate-950 text-xs font-semibold"></div>
            <div class="flex items-center gap-2 bg-[#0B1120] border border-[#23304C] p-1.5 rounded-lg"><span class="w-7 h-7 rounded bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">C</span><input id="crud-opt-2" type="text" placeholder="Opsi C..." class="w-full px-2.5 py-1.5 rounded bg-white text-slate-950 text-xs font-semibold"></div>
            <div class="flex items-center gap-2 bg-[#0B1120] border border-[#23304C] p-1.5 rounded-lg"><span class="w-7 h-7 rounded bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">D</span><input id="crud-opt-3" type="text" placeholder="Opsi D..." class="w-full px-2.5 py-1.5 rounded bg-white text-slate-950 text-xs font-semibold"></div>
          </div>
        </div>
        <div id="crud-answer-mc-wrap">
          <label for="crud-answer-mc" class="block text-xs font-semibold text-slate-300 mb-1">Kunci Jawaban Benar</label>
          <select id="crud-answer-mc" class="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-bold">
            <option value="0">Opsi A</option><option value="1">Opsi B</option><option value="2">Opsi C</option><option value="3">Opsi D</option>
          </select>
        </div>
        <div id="crud-answer-tf-wrap" class="hidden">
          <label for="crud-answer-tf" class="block text-xs font-semibold text-slate-300 mb-1">Kunci Jawaban Benar</label>
          <select id="crud-answer-tf" class="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-bold">
            <option value="0">Benar (True)</option><option value="1">Salah (False)</option>
          </select>
        </div>
        <div id="crud-answer-ms-wrap" class="hidden">
          <div class="text-xs font-semibold text-slate-300 mb-1">Centang Kunci Jawaban Benar</div>
          <div class="flex flex-wrap gap-4 bg-[#0B1120] border border-[#23304C] p-3 rounded-lg text-xs">
            <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" class="crud-ms-chk" value="0"> Opsi A</label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" class="crud-ms-chk" value="1"> Opsi B</label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" class="crud-ms-chk" value="2"> Opsi C</label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" class="crud-ms-chk" value="3"> Opsi D</label>
          </div>
        </div>
        <div id="crud-answer-text-wrap" class="hidden">
          <label for="crud-answer-text" class="block text-xs font-semibold text-slate-300 mb-1">Kata Kunci Diterima (pisahkan koma)</label>
          <input id="crud-answer-text" type="text" placeholder="Contoh: jakarta, dki jakarta" class="w-full px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-semibold">
        </div>
        <div>
          <label for="crud-explanation" class="block text-xs font-semibold text-slate-300 mb-1">Penjelasan / Pembahasan</label>
          <textarea id="crud-explanation" rows="2" placeholder="Penjelasan singkat jawaban benar..." class="w-full px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-medium"></textarea>
        </div>
        <p id="crud-error" class="hidden text-rose-400 text-xs font-semibold"></p>
        <div class="flex gap-2 pt-2">
          <button type="button" onclick="closeCrudModal()" class="flex-1 bg-[#0B1120] hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg border border-[#23304C] cursor-pointer">Batal</button>
          <button type="button" onclick="saveCrudQuestion()" class="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold py-2.5 rounded-lg cursor-pointer">Simpan Soal</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL IMPOR CSV / SPREADSHEET / JSON -->
  <div id="modal-admin-import" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="surface-card rounded-2xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
      <div class="flex items-start justify-between gap-3 border-b border-[#23304C] pb-4">
        <div>
          <div class="text-xs font-semibold text-emerald-400 mb-0.5">Konversi Otomatis Bank Soal</div>
          <h3 class="text-lg sm:text-xl font-extrabold text-white">Impor Soal dari CSV / Excel / Google Sheets</h3>
          <p class="text-xs text-slate-400 mt-1">Mendukung file <code class="text-amber-300">.csv</code> (koma atau titik-koma Excel Indonesia), salinan tabel Google Sheets / Excel, maupun <code class="text-amber-300">.json</code>.</p>
        </div>
        <button type="button" aria-label="Tutup modal impor" onclick="closeImportModal()" class="px-2.5 py-1 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer text-xs font-bold">✕</button>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5">
        <div class="flex flex-wrap items-center gap-2">
          <label class="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
            <span>Pilih File CSV / TXT / JSON</span>
            <input type="file" accept=".csv,.tsv,.txt,.json,text/csv,text/plain,application/json" onchange="handleImportFileUpload(event)" class="sr-only">
          </label>
          <span id="import-file-name" class="text-xs text-emerald-300 font-semibold"></span>
        </div>
        <button type="button" onclick="downloadQuestionCsvTemplate()" class="bg-[#131C31] hover:bg-slate-800 text-sky-300 border border-[#23304C] font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer">
          Unduh Template CSV
        </button>
      </div>
      <div class="text-[11px] text-slate-400 bg-[#0B1120]/70 border border-[#23304C] rounded-lg px-3.5 py-2.5 leading-relaxed">
        Urutan kolom: <code class="text-slate-200 font-mono-num">kategori, tipe, waktu, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban, pembahasan, gambar</code>. Kolom <strong class="text-slate-200">gambar</strong> bersifat opsional (URL).
      </div>
      <div>
        <label for="csv-import-textarea" class="block text-xs font-semibold text-slate-300 mb-1.5">Atau tempel isi CSV / salinan sel Excel &amp; Google Sheets di sini</label>
        <textarea id="csv-import-textarea" rows="5" oninput="updateImportPreview()" placeholder="kategori,tipe,waktu,pertanyaan,opsi_a,opsi_b,opsi_c,opsi_d,jawaban,pembahasan,gambar" class="w-full p-3 rounded-xl bg-[#050914] border border-[#23304C] text-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"></textarea>
      </div>
      <div id="import-preview-summary" class="hidden space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span id="import-valid-count" class="font-bold text-emerald-400"></span>
          <span id="import-error-count" class="hidden font-bold text-rose-400"></span>
        </div>
        <div id="import-errors-box" class="hidden bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 max-h-28 overflow-y-auto space-y-1 text-xs text-rose-200"></div>
        <div id="import-preview-list" class="hidden bg-[#0B1120] border border-[#23304C] rounded-xl p-3 max-h-44 overflow-y-auto space-y-2"></div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 pt-2">
        <button id="btn-import-append" type="button" disabled onclick="confirmQuestionImport('append')" class="flex-1 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl cursor-pointer disabled:cursor-not-allowed">Tambahkan ke Bank Soal (+0)</button>
        <button id="btn-import-replace" type="button" disabled onclick="confirmQuestionImport('replace')" class="flex-1 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl cursor-pointer disabled:cursor-not-allowed">Gantikan Bank Soal (0 Soal)</button>
        <button type="button" onclick="closeImportModal()" class="bg-[#0B1120] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-[#23304C] cursor-pointer">Batal</button>
      </div>
    </div>
  </div>

  <!-- MODAL MINIGAME PULAU HARTA KARUN -->
  <div id="modal-island-minigame" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="surface-card border border-cyan-400/40 rounded-2xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-center">
      <div>
        <div id="island-minigame-sub" class="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">Berlabuh di Pulau</div>
        <h3 id="island-minigame-title" class="text-xl font-extrabold text-white"></h3>
        <p id="island-minigame-desc" class="text-xs text-slate-300 mt-1"></p>
      </div>
      <div id="island-minigame-body" class="space-y-3"></div>
    </div>
  </div>

  <!-- MODAL KLASEMEN LIVE (UNTUK PEMAIN) -->
  <div id="modal-live-leaderboard" role="dialog" aria-modal="true" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="surface-card rounded-2xl p-5 sm:p-6 max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl">
      <div class="flex items-center justify-between gap-3 border-b border-[#23304C] pb-3.5 mb-4">
        <div>
          <h3 class="text-base sm:text-lg font-extrabold text-white">Klasemen Sementara (Live)</h3>
          <p class="text-[11px] text-slate-400">Menggabungkan peserta yang sedang bermain &amp; yang sudah selesai</p>
        </div>
        <button type="button" onclick="closeLiveLeaderboardModal()" class="p-1.5 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer text-xs font-bold">✕</button>
      </div>
      <div class="inline-flex items-center gap-1 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl w-fit mb-3">
        <button id="live-lb-tab-ind" type="button" onclick="switchLiveLbModalTab('individual')" class="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer bg-amber-400 text-slate-950">Individu</button>
        <button id="live-lb-tab-team" type="button" onclick="switchLiveLbModalTab('team')" class="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer text-slate-300 hover:text-white">Tim / Kru</button>
      </div>
      <div id="live-lb-modal-body" class="flex-1 overflow-y-auto bg-[#0B1120] border border-[#23304C] rounded-xl divide-y divide-[#23304C]/70"></div>
    </div>
  </div>

  <div id="toast-banner" role="status" class="hidden fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#131C31] text-white border border-amber-400/50 px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-bold max-w-[calc(100vw-2rem)] text-center"></div>
`;
