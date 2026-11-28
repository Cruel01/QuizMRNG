export function buildGoogleSitesScripts(
  serializedQuestions: string,
  serializedConfig: string,
  defaultAppId: string,
  serializedSettings: string,
  initialRoomCode: string
): string {
  return String.raw`  <script>
    var DEFAULT_QUESTIONS_DATA = ${serializedQuestions};
    var FIREBASE_CONFIG = ${serializedConfig};
    var DEFAULT_APP_ID = ${JSON.stringify(defaultAppId)};
    var DEFAULT_QUIZ_SETTINGS = ${serializedSettings};
    var INITIAL_ROOM_CODE = ${JSON.stringify(initialRoomCode)};
    var STALE_ACTIVE_PLAYER_MS = 30 * 60 * 1000;
    var MUTE_STORAGE_KEY = 'quiz_sfx_muted_v1';
    var ROOM_CODE_STORAGE_KEY = 'quiz_active_room_code_v1';

    var ALL_POWERUP_IDS = ['DOUBLE_SCORE', 'FIFTY_FIFTY', 'SHIELD', 'FREEZE_LEADER', 'GLITCH_SHUFFLE', 'TORNADO'];
    var POWERUPS = {
      DOUBLE_SCORE: { id: 'DOUBLE_SCORE', name: 'Skor 2x', kind: 'buff', weight: 10, desc: 'Menggandakan poin pada soal aktif ini!' },
      FIFTY_FIFTY: { id: 'FIFTY_FIFTY', name: '50:50', kind: 'buff', weight: 25, desc: 'Menghapus 2 opsi jawaban yang salah.' },
      SHIELD: { id: 'SHIELD', name: 'Perisai', kind: 'buff', weight: 20, desc: 'Menangkal otomatis serangan Debuff lawan.' },
      FREEZE_LEADER: { id: 'FREEZE_LEADER', name: 'Bekukan #1', kind: 'debuff', weight: 18, desc: 'Membekukan layar peringkat #1 aktif selama 4 detik!' },
      GLITCH_SHUFFLE: { id: 'GLITCH_SHUFFLE', name: 'Acak Opsi', kind: 'debuff', weight: 20, desc: 'Mengacak posisi tombol opsi lawan pada soal berikutnya.' },
      TORNADO: { id: 'TORNADO', name: 'Puting Beliung', kind: 'debuff', weight: 22, desc: 'Badai angin 5 detik mengguncang layar & mengacak opsi lawan!' }
    };
    function getPowerupSvgHtml(id) {
      if (id === 'DOUBLE_SCORE') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-amber-300" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>';
      if (id === 'FIFTY_FIFTY') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-sky-300" aria-hidden="true"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>';
      if (id === 'SHIELD') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-emerald-300" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';
      if (id === 'FREEZE_LEADER') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-cyan-300" aria-hidden="true"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>';
      if (id === 'GLITCH_SHUFFLE') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-fuchsia-300" aria-hidden="true"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></svg>';
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-rose-300" aria-hidden="true"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/></svg>';
    }

    var memoryStorage = {};
    function safeGetStorage(k) {
      try { return window.localStorage.getItem(k); } catch (e) { return memoryStorage[k] || null; }
    }
    function safeSetStorage(k, v) {
      memoryStorage[k] = v;
      try { window.localStorage.setItem(k, v); } catch (e) {}
    }
    function safeRemoveStorage(k) {
      delete memoryStorage[k];
      try { window.localStorage.removeItem(k); } catch (e) {}
    }
    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function sanitizeRoomCode(raw) {
      return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20);
    }
    function getRoomFirebaseAppId(code) {
      var clean = sanitizeRoomCode(code);
      if (!clean || clean === 'DEFAULT') return DEFAULT_APP_ID;
      return 'quizmrng-room-' + clean;
    }
    function sanitizeImageUrl(raw) {
      if (typeof raw !== 'string') return '';
      var t = raw.trim();
      if (!t) return '';
      if (t.indexOf('https://') === 0 || t.indexOf('http://') === 0 || t.indexOf('data:image/') === 0 || t.indexOf('/') === 0) {
        return t;
      }
      return '';
    }
    function readUrlParam(name) {
      try {
        var params = new URLSearchParams(window.location.search);
        return params.get(name);
      } catch (e) { return null; }
    }

    function getOrCreateDeviceId() {
      var k = 'quiz_device_fingerprint_v1';
      var id = safeGetStorage(k);
      if (!id) {
        var tz = 'UTC';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
        var raw = [navigator.userAgent || 'UA', screen.width + 'x' + screen.height, tz, Math.random().toString(36).slice(2, 10)].join('|');
        var h = 0;
        for (var i = 0; i < raw.length; i++) { h = ((h << 5) - h + raw.charCodeAt(i)) | 0; }
        id = 'DEV-' + Math.abs(h).toString(36).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
        safeSetStorage(k, id);
      }
      return id;
    }

    var myDeviceId = getOrCreateDeviceId();
    var initialParamRoom = readUrlParam('room');
    var activeRoomCode = initialParamRoom !== null
      ? sanitizeRoomCode(initialParamRoom)
      : sanitizeRoomCode(safeGetStorage(ROOM_CODE_STORAGE_KEY) || INITIAL_ROOM_CODE || '');
    var initialCompactFlag = readUrlParam('compact') === '1';
    var isAutostartDemo = readUrlParam('autostart') === '1';

    function getStorageScope() { return activeRoomCode || 'default'; }
    function getCustomQuestionsKey() { return 'quiz_custom_questions_v2_' + getStorageScope(); }
    function getSettingsKey() { return 'quiz_settings_v1_' + getStorageScope(); }
    function getCompletedRecordKey() { return 'quiz_completed_record_' + getStorageScope() + '_' + myDeviceId; }
    function getInProgressKey() { return 'quiz_in_progress_v1_' + getStorageScope() + '_' + myDeviceId; }

    var questions = DEFAULT_QUESTIONS_DATA.slice();
    var settings = Object.assign({}, DEFAULT_QUIZ_SETTINGS);
    if (initialCompactFlag) settings.compactMode = true;

    function loadScopedLocalState() {
      var qRaw = safeGetStorage(getCustomQuestionsKey()) || (!activeRoomCode ? safeGetStorage('quiz_custom_questions_v2') : null);
      if (qRaw) {
        try {
          var qp = JSON.parse(qRaw);
          if (Array.isArray(qp) && qp.length > 0) questions = qp;
          else questions = DEFAULT_QUESTIONS_DATA.slice();
        } catch (e) { questions = DEFAULT_QUESTIONS_DATA.slice(); }
      } else {
        questions = DEFAULT_QUESTIONS_DATA.slice();
      }

      var sRaw = safeGetStorage(getSettingsKey());
      settings = Object.assign({}, DEFAULT_QUIZ_SETTINGS);
      if (sRaw) {
        try {
          var sp = JSON.parse(sRaw);
          if (sp && typeof sp === 'object') Object.assign(settings, sp);
        } catch (e) {}
      }
      if (initialCompactFlag) settings.compactMode = true;

      var recRaw = safeGetStorage(getCompletedRecordKey()) || (!activeRoomCode ? safeGetStorage('quiz_completed_record_' + myDeviceId) : null);
      mySavedRecord = null;
      if (recRaw) {
        try { mySavedRecord = JSON.parse(recRaw); } catch (e) { mySavedRecord = null; }
      }
      hasPlayedThisDevice = Boolean(mySavedRecord);

      recoverableProgress = null;
      var ipRaw = safeGetStorage(getInProgressKey());
      if (ipRaw) {
        try {
          var parsedIp = JSON.parse(ipRaw);
          if (parsedIp && parsedIp.playerName && (Date.now() - (parsedIp.savedAt || 0) < STALE_ACTIVE_PLAYER_MS)) {
            recoverableProgress = parsedIp;
          }
        } catch (e) {}
      }
    }

    var mySavedRecord = null;
    var hasPlayedThisDevice = false;
    var recoverableProgress = null;
    loadScopedLocalState();

    // Runtime Game State
    var roomGateUnlocked = (initialParamRoom !== null) || isAutostartDemo;
    var currentSessionMode = isAutostartDemo ? 'free' : 'unconfigured';
    var currentLiveRunId = isAutostartDemo ? 'autostart' : 'default';
    var waitingPlayers = [];
    var activePlayers = [];
    var cloudLeaderboard = [];
    var activeScreen = 'lobby';
    var lobbyTab = 'categories';
    var selectedCategoryHint = null;
    var adminTab = 'session';
    var adminRoomConfirmed = false;
    var reviewFilter = 'all';

    var playDeck = questions.slice();
    var playerName = '';
    var teamModeChoice = 'solo';
    var teamName = '';
    var currentQuestionIndex = 0;
    var score = 0;
    var correctCount = 0;
    var timeLeft = 25;
    var timerInterval = null;
    var globalTimeLeft = 0;
    var totalGlobalSeconds = 0;
    var globalTimerInterval = null;
    var preCountdownValue = null;
    var preCountdownTimer = null;
    var playerHistory = [];
    var powerupInventory = [null, null];
    var currentStreak = 0;
    var doubleScoreActive = false;
    var powerupUsedThisQuestion = false;
    var immuneQuestionsRemaining = 0;
    var glitchShuffleForNext = false;
    var awardedDebuffMilestones = [];
    var isFrozen = false;
    var freezeInterval = null;
    var tornadoCountdown = 0;
    var tornadoAttackerName = '';
    var tornadoInterval = null;
    var dockedIslandModal = null;
    var visitedIslands = [];
    var helmAnimInterval = null;
    var lbStandingsTab = 'individual';
    var adminLbTab = 'individual';
    var liveLbModalTab = 'individual';
    var currentOptionOrder = [0, 1, 2, 3];
    var eliminatedIndices = [];
    var selectedMultipleIndices = [];
    var questionFeedbackShown = false;
    var pendingConfirmCallback = null;
    var importPreviewResult = { questions: [], errors: [], format: 'csv' };

    // ==================== WEB AUDIO SYNTH SFX ====================
    var audioCtx = null;
    var isMuted = safeGetStorage(MUTE_STORAGE_KEY) === '1';

    function getAudioCtx() {
      if (!audioCtx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (C) audioCtx = new C();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function() {});
      }
      return audioCtx;
    }
    function playTone(freq, dur, type, gainVal, delay, endFreq) {
      if (isMuted) return;
      var ctx = getAudioCtx();
      if (!ctx) return;
      try {
        var now = ctx.currentTime + (delay || 0);
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq && endFreq !== freq) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + dur);
        }
        g.gain.setValueAtTime(gainVal || 0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + dur + 0.02);
      } catch (e) {}
    }
    function playPopClickFx() { playTone(460, 0.06, 'sine', 0.045, 0, 680); }
    function playCountdownTickFx(step) { playTone(step === 3 ? 440 : step === 2 ? 523.25 : 659.25, 0.14, 'triangle', 0.09, 0); }
    function playCountdownGoFx() {
      playTone(523.25, 0.09, 'triangle', 0.08, 0);
      playTone(783.99, 0.11, 'triangle', 0.09, 0.07);
      playTone(1046.5, 0.22, 'triangle', 0.1, 0.14);
    }
    function playUrgentTickFx() { playTone(880, 0.045, 'square', 0.025, 0, 660); }
    function playCorrectFx() {
      playTone(523.25, 0.1, 'triangle', 0.09, 0);
      playTone(659.25, 0.12, 'triangle', 0.09, 0.07);
      playTone(783.99, 0.18, 'sine', 0.08, 0.14);
    }
    function playStreakComboFx(streak) {
      var boost = Math.min(8, Math.max(0, streak - 2));
      var root = 587.33 * Math.pow(2, boost / 12);
      playTone(root, 0.1, 'sine', 0.07, 0);
      playTone(root * 1.25, 0.12, 'triangle', 0.08, 0.06);
      playTone(root * 1.5, 0.18, 'triangle', 0.08, 0.12);
    }
    function playWrongFx() {
      playTone(230, 0.16, 'sawtooth', 0.055, 0, 175);
      playTone(170, 0.22, 'sawtooth', 0.05, 0.1, 130);
    }
    function playPowerupFx() {
      playTone(587.33, 0.09, 'sine', 0.08, 0);
      playTone(880, 0.11, 'triangle', 0.08, 0.06);
      playTone(1174.66, 0.18, 'sine', 0.07, 0.12);
    }
    function playFreezeFx() {
      playTone(987.77, 0.08, 'sine', 0.07, 0);
      playTone(740, 0.12, 'sine', 0.07, 0.06);
      playTone(523.25, 0.22, 'sine', 0.06, 0.12);
    }
    function playTornadoFx() {
      playTone(170, 0.25, 'sawtooth', 0.065, 0, 340);
      playTone(320, 0.28, 'triangle', 0.06, 0.14, 150);
      playTone(220, 0.3, 'sawtooth', 0.05, 0.3, 120);
    }
    function playIslandDockFx() {
      playTone(392.0, 0.1, 'triangle', 0.08, 0);
      playTone(493.88, 0.12, 'triangle', 0.085, 0.08);
      playTone(587.33, 0.15, 'triangle', 0.09, 0.16);
      playTone(783.99, 0.24, 'sine', 0.08, 0.24);
    }
    function playChestRewardFx() {
      playTone(587.33, 0.09, 'sine', 0.08, 0);
      playTone(783.99, 0.11, 'triangle', 0.085, 0.07);
      playTone(1046.5, 0.22, 'triangle', 0.095, 0.14);
    }
    function playFinishFx() {
      playTone(523.25, 0.11, 'triangle', 0.08, 0);
      playTone(659.25, 0.11, 'triangle', 0.08, 0.09);
      playTone(783.99, 0.13, 'triangle', 0.08, 0.18);
      playTone(1046.5, 0.28, 'triangle', 0.095, 0.28);
      playTone(1318.51, 0.32, 'sine', 0.065, 0.36);
    }

    var MUTE_ON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-emerald-400" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
    var MUTE_OFF_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-rose-400" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>';

    function updateMuteButtonsUI() {
      var btns = document.querySelectorAll('[data-mute-btn="true"]');
      for (var i = 0; i < btns.length; i++) {
        btns[i].innerHTML = isMuted ? MUTE_OFF_SVG : MUTE_ON_SVG;
        var label = isMuted ? 'Aktifkan suara efek' : 'Bisukan suara efek';
        btns[i].setAttribute('aria-label', label);
        btns[i].setAttribute('title', label);
      }
    }
    function toggleMute() {
      isMuted = !isMuted;
      safeSetStorage(MUTE_STORAGE_KEY, isMuted ? '1' : '0');
      updateMuteButtonsUI();
      if (!isMuted) playPopClickFx();
    }

    var toastTimer = null;
    function showToast(msg) {
      var el = document.getElementById('toast-banner');
      if (!el) return;
      el.textContent = msg;
      el.classList.remove('hidden');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { el.classList.add('hidden'); }, 3400);
    }

    function applyCompactModeUI() {
      var body = document.getElementById('app-body');
      var lobby = document.getElementById('screen-start');
      var quizCard = document.getElementById('quiz-card');
      var qText = document.getElementById('question-text');
      if (body) {
        body.className = 'min-h-screen flex flex-col items-center justify-start px-3 pb-20 ' + (settings.compactMode ? 'pt-2 sm:p-4' : 'pt-4 sm:p-6');
      }
      if (lobby) {
        lobby.className = 'surface-card rounded-2xl shadow-xl ' + (settings.compactMode ? 'p-4 sm:p-6' : 'p-5 sm:p-9') + (activeScreen !== 'lobby' ? ' hidden' : '');
      }
      if (quizCard) {
        quizCard.className = 'relative surface-card rounded-2xl shadow-xl overflow-hidden ' + (settings.compactMode ? 'p-4 sm:p-6' : 'p-5 sm:p-8');
      }
      if (qText) {
        qText.className = 'font-bold leading-snug text-white ' + (settings.compactMode ? 'text-base sm:text-xl mb-4' : 'text-lg sm:text-2xl mb-5');
      }
    }

    function showScreen(name) {
      activeScreen = name;
      var ids = ['lobby', 'waiting', 'quiz', 'leaderboard', 'admin'];
      for (var i = 0; i < ids.length; i++) {
        var sec = document.getElementById(ids[i] === 'lobby' ? 'screen-start' : 'screen-' + ids[i]);
        if (sec) sec.classList.toggle('hidden', ids[i] !== name);
      }
      window.scrollTo(0, 0);
    }

    // ==================== ENGINE HELPERS ====================
    function getDynamicCategoryStats(qList) {
      var counts = {};
      var order = [];
      for (var i = 0; i < qList.length; i++) {
        var key = String(qList[i].category || 'Umum').trim() || 'Umum';
        if (!counts[key]) { counts[key] = 0; order.push(key); }
        counts[key]++;
      }
      var known = {
        'Manusia & Hewan': { hint: 'Anatomi tubuh, satwa unik, dan adaptasi biologi.', accent: 'text-emerald-400', kind: 'animals' },
        'Logika & Hitungan': { hint: 'Teka-teki logika, deret angka, dan aritmatika cepat.', accent: 'text-sky-400', kind: 'logic' },
        'Wawasan Nusantara': { hint: 'Geografi kepulauan, flora-fauna endemik, dan budaya.', accent: 'text-amber-400', kind: 'nusantara' }
      };
      var customAccents = ['text-fuchsia-400', 'text-cyan-400', 'text-rose-400', 'text-emerald-400'];
      var cIdx = 0;
      return order.map(function(key) {
        var k = known[key];
        if (k) return { key: key, label: key, count: counts[key], hint: k.hint, accent: k.accent, kind: k.kind };
        var acc = customAccents[cIdx % customAccents.length]; cIdx++;
        return { key: key, label: key, count: counts[key], hint: 'Topik khusus kategori ' + key + ' (' + counts[key] + ' pertanyaan siap dikerjakan).', accent: acc, kind: 'custom' };
      });
    }

    function prepareQuizDeck(src, cfg) {
      var deck = src.slice();
      if (cfg.shuffleQuestions) {
        for (var i = deck.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
        }
      }
      var limit = Math.max(0, Math.floor(Number(cfg.questionLimit) || 0));
      if (limit > 0 && limit < deck.length) return deck.slice(0, limit);
      return deck;
    }

    function computeShuffledOrder(len, shouldShuffle) {
      var arr = [];
      for (var i = 0; i < len; i++) arr.push(i);
      if (shouldShuffle && arr.length > 1) {
        for (var k = arr.length - 1; k > 0; k--) {
          var j = Math.floor(Math.random() * (k + 1));
          var tmp = arr[k]; arr[k] = arr[j]; arr[j] = tmp;
        }
      }
      return arr;
    }

    function getStreakRewardTarget(n) { return Math.max(3, Math.round((n || 30) * 0.25)); }
    function getDebuffMilestones(n) {
      var ms = [];
      if (n >= 6) ms.push(Math.ceil(n / 2));
      for (var m = 10; m <= n; m += 10) { if (ms.indexOf(m) === -1) ms.push(m); }
      return ms.sort(function(a, b) { return a - b; });
    }
    function getCorrectAnswerDisplay(q) {
      if (q.type === 'MC' || q.type === 'TF') return (q.options || [])[q.answer] || '';
      if (q.type === 'MS') return (q.answer || []).map(function(i) { return (q.options || [])[i]; }).filter(Boolean).join(', ');
      return ((q.acceptedAnswers || [])[0] || '').toUpperCase();
    }
    function filterFreshActivePlayers(list) {
      var now = Date.now();
      return (list || []).filter(function(p) {
        var ref = p.lastSeen || p.startedAt || 0;
        return now - ref <= STALE_ACTIVE_PLAYER_MS;
      });
    }
    function isFreeSessionMode(m) {
      return m === 'free_waiting' || m === 'free';
    }
    function isLiveSessionMode(m) {
      return m === 'live_waiting' || m === 'live_started';
    }
    function getSessionLockFlags() {
      var fresh = filterFreshActivePlayers(activePlayers);
      var hasFree = cloudLeaderboard.length > 0 || fresh.some(function(p) { return p.mode === 'free' || !p.mode; });
      var hasLive = currentSessionMode === 'live_started' || fresh.some(function(p) { return p.mode === 'live_started'; }) || (cloudLeaderboard.length > 0 && isLiveSessionMode(currentSessionMode));
      return {
        hasFreeEngagement: hasFree,
        hasLiveEngagement: hasLive,
        isFreeLockedOut: isLiveSessionMode(currentSessionMode) && hasLive,
        isLiveLockedOut: isFreeSessionMode(currentSessionMode) && hasFree,
        freshActiveCount: fresh.length,
        waitingCount: waitingPlayers.length
      };
    }
    function getConfiguredPowerups() {
      if (!settings || settings.enabledPowerups === undefined || !Array.isArray(settings.enabledPowerups)) {
        return ALL_POWERUP_IDS.slice();
      }
      var seen = {};
      var res = [];
      for (var i = 0; i < settings.enabledPowerups.length; i++) {
        var pid = settings.enabledPowerups[i];
        if (POWERUPS[pid] && !seen[pid]) {
          seen[pid] = true;
          res.push(pid);
        }
      }
      return res;
    }
    function getEnabledPowerups() {
      if (!isGamificationActive()) return [];
      return getConfiguredPowerups();
    }
    function isPowerupEnabled(id) {
      return getEnabledPowerups().indexOf(id) !== -1;
    }
    function isStreakRewardActive() {
      if (!isGamificationActive()) return false;
      if (settings && settings.streakEnabled === false) return false;
      return getEnabledPowerups().length > 0;
    }
    function isMilestoneDropActive() {
      if (!isGamificationActive()) return false;
      if (settings && settings.milestoneDropsEnabled === false) return false;
      var list = getEnabledPowerups();
      for (var i = 0; i < list.length; i++) {
        if (POWERUPS[list[i]] && POWERUPS[list[i]].kind === 'debuff') return true;
      }
      return false;
    }
    function rollPowerup(onlyKind) {
      var allowed = getEnabledPowerups();
      var pool = allowed.map(function(k) { return POWERUPS[k]; }).filter(function(p) { return p && (!onlyKind || p.kind === onlyKind); });
      if (pool.length === 0) return null;
      var total = pool.reduce(function(s, p) { return s + p.weight; }, 0);
      var r = Math.random() * total;
      for (var i = 0; i < pool.length; i++) {
        if (r < pool[i].weight) return pool[i].id;
        r -= pool[i].weight;
      }
      return pool[0] ? pool[0].id : null;
    }

    function isGlobalQuizTimerActive() {
      var mins = Number(settings.quizDurationMinutes) || 0;
      return mins > 0 && currentSessionMode !== 'unconfigured';
    }
    function formatCountdownClock(totalSecs) {
      var safe = Math.max(0, Math.floor(Number(totalSecs) || 0));
      var m = Math.floor(safe / 60);
      var s = safe % 60;
      return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    var VOYAGE_ISLAND_NAMES = [
      'Pulau Rempah Maluku',
      'Teluk Karang Raja Ampat',
      'Tanjung Komodo',
      'Selat Keris Jawa',
      'Pantai Zamrud Sumatera',
      'Pulau Harta Karun Nusantara'
    ];
    function buildVoyageCheckpoints(totalQ) {
      var safeTotal = Math.max(1, Math.floor(Number(totalQ) || 1));
      var totalIslands = safeTotal < 5 ? 1 : Math.floor(safeTotal / 5);
      var cps = [];
      for (var i = 0; i < totalIslands; i++) {
        var qNum = safeTotal < 5 ? safeTotal : Math.min(safeTotal, (i + 1) * 5);
        var prevQ = i === 0 ? 0 : cps[i - 1].questionNumber;
        var base = i === totalIslands - 1 ? VOYAGE_ISLAND_NAMES[VOYAGE_ISLAND_NAMES.length - 1] : VOYAGE_ISLAND_NAMES[i % (VOYAGE_ISLAND_NAMES.length - 1)];
        cps.push({
          islandIndex: i,
          islandNumber: i + 1,
          name: (totalIslands > VOYAGE_ISLAND_NAMES.length && i < totalIslands - 1) ? (base + ' ' + (Math.floor(i / (VOYAGE_ISLAND_NAMES.length - 1)) + 1)) : base,
          questionNumber: qNum,
          legStartQuestion: prevQ + 1,
          positionPercent: Math.round((qNum / safeTotal) * 100)
        });
      }
      return cps;
    }
    function getVoyageProgressState(answeredCnt, totalQ) {
      var safeTotal = Math.max(1, Math.floor(Number(totalQ) || 1));
      var safeAns = Math.max(0, Math.min(safeTotal, Math.floor(answeredCnt || 0)));
      var cps = buildVoyageCheckpoints(safeTotal);
      var totalIslands = cps.length;
      var completedIslands = 0;
      var dockedIsland = null;
      for (var i = 0; i < cps.length; i++) {
        if (safeAns >= cps[i].questionNumber) completedIslands++;
        if (safeAns > 0 && cps[i].questionNumber === safeAns) dockedIsland = cps[i];
      }
      var curLeg = Math.min(totalIslands - 1, completedIslands >= totalIslands ? totalIslands - 1 : completedIslands);
      var target = cps[curLeg] || null;
      var legStart = target ? target.legStartQuestion - 1 : 0;
      var legEnd = target ? target.questionNumber : safeTotal;
      var legSpan = Math.max(1, legEnd - legStart);
      var qInLeg = dockedIsland ? legSpan : Math.max(0, safeAns - legStart);
      var legStep = 0;
      if (dockedIsland || qInLeg >= legSpan) legStep = 3;
      else if (qInLeg >= Math.max(3, Math.ceil(legSpan * 0.6))) legStep = 2;
      else if (qInLeg >= 1) legStep = 1;
      return {
        checkpoints: cps, totalIslands: totalIslands, completedIslands: completedIslands,
        currentLegIndex: curLeg, legStep: legStep, nextIsland: target, dockedIsland: dockedIsland,
        shipPercent: Math.min(100, Math.round((safeAns / safeTotal) * 100))
      };
    }
    function isGamificationActive() {
      return !settings || settings.gamificationEnabled !== false;
    }
    function isTeamParticipationAvailable() {
      return settings && settings.gameplayMode === 'voyage';
    }
    function getEffectiveParticipationMode() {
      if (!isTeamParticipationAvailable()) return 'solo';
      return (settings && settings.participationMode) || 'either';
    }
    function parseClassGateInput(raw) {
      var clean = sanitizeRoomCode(raw);
      if (!clean) {
        return { valid: false, roomCode: '', displayLabel: '', error: 'Silakan masukkan kode kelas terlebih dahulu (misalnya KELAS8A atau UMUM).' };
      }
      if (clean === 'UMUM' || clean === 'DEFAULT') {
        return { valid: true, roomCode: '', displayLabel: 'Umum' };
      }
      return { valid: true, roomCode: clean, displayLabel: '#' + clean };
    }
    function aggregateTeamLeaderboard(records) {
      var map = {};
      var order = [];
      (records || []).forEach(function(rec) {
        var rawTeam = String(rec.teamName || '').trim();
        var isSolo = !rawTeam;
        var key = isSolo ? ('SOLO::' + String(rec.name || 'Peserta').trim().toLowerCase()) : ('TEAM::' + rawTeam.toLowerCase());
        var disp = isSolo ? ('Solo · ' + (rec.name || 'Peserta')) : rawTeam;
        if (!map[key]) {
          map[key] = { teamName: disp, isSolo: isSolo, memberCount: 1, members: [rec.name || 'Peserta'], totalScore: rec.score || 0, avgScore: rec.score || 0, totalCorrect: rec.correct || 0 };
          order.push(key);
        } else {
          var ex = map[key];
          ex.memberCount++;
          ex.members.push(rec.name || 'Peserta');
          ex.totalScore += (rec.score || 0);
          ex.totalCorrect += (rec.correct || 0);
          ex.avgScore = Math.round(ex.totalScore / ex.memberCount);
        }
      });
      return order.map(function(k) { return map[k]; }).sort(function(a, b) { return b.totalScore - a.totalScore; });
    }
    function mergeLiveAndFinishedLeaderboard(finished, activeList, defaultTotal) {
      var map = {};
      var keys = [];
      (finished || []).forEach(function(p) {
        var id = p.deviceId || p.id;
        map[id] = { deviceId: id, name: p.name, teamName: p.teamName || '', score: p.score || 0, correct: p.correct || 0, currentQuestion: p.totalQuestions || defaultTotal, totalQuestions: p.totalQuestions || defaultTotal, status: 'finished' };
        keys.push(id);
      });
      filterFreshActivePlayers(activeList).forEach(function(ap) {
        if (!ap.deviceId || map[ap.deviceId]) return;
        map[ap.deviceId] = { deviceId: ap.deviceId, name: ap.name, teamName: ap.teamName || '', score: ap.score || 0, correct: ap.correct || 0, currentQuestion: ap.currentQuestion || 1, totalQuestions: ap.totalQuestions || defaultTotal, status: 'playing' };
        keys.push(ap.deviceId);
      });
      return keys.map(function(k) { return map[k]; }).sort(function(a, b) { return b.score - a.score; });
    }
    function getResolvedTeamName() {
      var pm = getEffectiveParticipationMode();
      if (pm === 'solo') return '';
      if (pm === 'team') return (teamName || '').trim();
      return teamModeChoice === 'team' ? (teamName || '').trim() : '';
    }

    // ==================== LOBBY RENDERING & ROOM MODAL ====================
    function getCatGlyphSvg(cat) {
      if (cat.kind === 'animals') {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>';
      }
      if (cat.kind === 'logic') {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>';
      }
      if (cat.kind === 'nusantara') {
        return '<svg viewBox="0 0 24 24" fill="none" class="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M15.8 8.2l-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/></svg>';
      }
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0 ' + cat.accent + '" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>';
    }

    function renderLobbyCategories() {
      var cats = getDynamicCategoryStats(questions);
      var tabBtn = document.getElementById('tab-btn-categories');
      if (tabBtn) tabBtn.textContent = 'Kategori Soal (' + cats.length + ')';

      var grid = document.getElementById('lobby-categories-grid');
      if (!grid) return;
      grid.innerHTML = cats.map(function(cat) {
        var isSel = selectedCategoryHint === cat.key;
        var cls = 'arcade-btn text-left rounded-xl p-4 border flex sm:flex-col items-center sm:items-start justify-between gap-2 cursor-pointer ' +
          (isSel ? 'bg-slate-800/80 border-amber-400/70' : 'bg-[#0B1120] border-[#23304C] hover:border-slate-500');
        return '<button type="button" onclick="toggleCategoryHint(\'' + encodeURIComponent(cat.key).replace(/'/g, '%27') + '\')" aria-expanded="' + (isSel ? 'true' : 'false') + '" class="' + cls + '">' +
          '<div class="flex items-center gap-2 text-slate-200 text-xs sm:text-sm font-medium min-w-0">' + getCatGlyphSvg(cat) + '<span class="truncate">' + escapeHtml(cat.label) + '</span></div>' +
          '<div class="font-mono-num font-bold text-base sm:text-xl text-white shrink-0">' + cat.count + ' Soal</div>' +
        '</button>';
      }).join('');

      var drawer = document.getElementById('category-hint-drawer');
      var txt = document.getElementById('category-hint-text');
      var found = cats.filter(function(c) { return c.key === selectedCategoryHint; })[0];
      if (found && drawer && txt) {
        drawer.classList.remove('hidden');
        txt.innerHTML = '<strong class="' + found.accent + '">' + escapeHtml(found.label) + ':</strong> ' + escapeHtml(found.hint);
      } else if (drawer) {
        drawer.classList.add('hidden');
      }
    }

    function toggleCategoryHint(encodedKey) {
      playPopClickFx();
      var key = decodeURIComponent(encodedKey);
      selectedCategoryHint = selectedCategoryHint === key ? null : key;
      renderLobbyCategories();
    }

    function switchLobbyTab(tab) {
      playPopClickFx();
      lobbyTab = tab;
      var btnCat = document.getElementById('tab-btn-categories');
      var btnPow = document.getElementById('tab-btn-powerups');
      var pCat = document.getElementById('lobby-panel-categories');
      var pPow = document.getElementById('lobby-panel-powerups');
      var hintLbl = document.getElementById('lobby-cat-hint-label');
      var activeCls = 'px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap bg-amber-400 text-slate-950';
      var idleCls = 'px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white';
      btnCat.className = tab === 'categories' ? activeCls : idleCls;
      btnPow.className = tab === 'powerups' ? activeCls : idleCls;
      btnCat.setAttribute('aria-selected', tab === 'categories' ? 'true' : 'false');
      btnPow.setAttribute('aria-selected', tab === 'powerups' ? 'true' : 'false');
      pCat.classList.toggle('hidden', tab !== 'categories');
      pPow.classList.toggle('hidden', tab !== 'powerups');
      if (hintLbl) hintLbl.classList.toggle('hidden', tab !== 'categories');
    }

    function submitLobbyRoomGate() {
      playPopClickFx();
      var inp = document.getElementById('lobby-room-gate-input');
      var errEl = document.getElementById('lobby-room-gate-error');
      var res = parseClassGateInput(inp ? inp.value : '');
      if (!res.valid) {
        if (errEl) {
          errEl.textContent = res.error;
          errEl.classList.remove('hidden');
        }
        if (inp) inp.focus();
        return;
      }
      if (errEl) errEl.classList.add('hidden');
      switchRoomScope(res.roomCode);
      roomGateUnlocked = true;
      updateLobbyUI();
      showToast('Berhasil masuk kelas ' + res.displayLabel + '!');
    }

    function renderLobbyPowerups() {
      var panel = document.getElementById('lobby-panel-powerups');
      var btnPow = document.getElementById('tab-btn-powerups');
      var enabled = getEnabledPowerups();
      if (btnPow) btnPow.textContent = 'Buff & Debuff (' + enabled.length + ')';
      if (!panel) return;
      panel.innerHTML = enabled.map(function(id) {
        var item = POWERUPS[id];
        if (!item) return '';
        var isBuff = item.kind === 'buff';
        return '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5 flex items-start gap-3">' +
          '<div class="w-8 h-8 rounded-lg bg-[#131C31] border border-[#23304C] flex items-center justify-center shrink-0">' + getPowerupSvgHtml(item.id) + '</div>' +
          '<div class="min-w-0">' +
            '<div class="flex items-center gap-2 text-xs font-bold text-white"><span>' + escapeHtml(item.name) + '</span><span class="text-slate-500">·</span><span class="' + (isBuff ? 'text-emerald-400' : 'text-sky-400') + '">' + (isBuff ? 'Buff' : 'Debuff') + '</span></div>' +
            '<p class="text-xs text-slate-400 mt-0.5 leading-snug">' + escapeHtml(item.desc) + '</p>' +
          '</div></div>';
      }).join('');
    }

    function updateLobbyUI() {
      applyCompactModeUI();
      renderLobbyCategories();
      renderLobbyPowerups();

      var gateBox = document.getElementById('lobby-room-gate');
      var unlockedBox = document.getElementById('lobby-unlocked-content');
      var btnRoomHeader = document.getElementById('btn-lobby-room');
      var statusEl = document.getElementById('lobby-mode-status');
      var textEl = document.getElementById('lobby-mode-text');
      var hgEl = document.getElementById('lobby-header-hourglass');

      var gamActive = isGamificationActive();
      var enabledPow = getEnabledPowerups();
      var showPowTab = gamActive && enabledPow.length > 0;
      var voyageMode = isTeamParticipationAvailable();
      var limit = Math.max(0, Math.floor(Number(settings.questionLimit) || 0));
      var effectiveCount = (limit > 0 && limit < questions.length) ? limit : questions.length;
      var targetStr = (limit > 0 && limit < questions.length) ? (limit + ' dari ' + questions.length) : String(questions.length);
      var durMins = Number(settings.quizDurationMinutes) || 0;

      document.getElementById('lobby-total-questions').textContent = targetStr;
      var subModeEl = document.getElementById('lobby-subtitle-mode');
      if (subModeEl) {
        if (voyageMode) {
          subModeEl.textContent = 'Berlayar Harta Karun';
          subModeEl.className = 'text-sky-300 font-semibold';
        } else if (!gamActive || enabledPow.length === 0) {
          subModeEl.textContent = 'Kuis interaktif real-time';
          subModeEl.className = '';
        } else if (enabledPow.length === 1) {
          subModeEl.textContent = 'Fitur ' + POWERUPS[enabledPow[0]].name + ' aktif';
          subModeEl.className = '';
        } else {
          var hasDebuff = enabledPow.some(function(pid) { return POWERUPS[pid] && POWERUPS[pid].kind === 'debuff'; });
          subModeEl.textContent = hasDebuff ? 'Buff & Debuff real-time' : 'Buff real-time aktif';
          subModeEl.className = '';
        }
      }
      var flagsStr = (voyageMode ? (' · ' + buildVoyageCheckpoints(effectiveCount).length + ' Pulau') : '') +
        (durMins > 0 ? (' · Timer ' + durMins + ' Menit') : '') +
        (settings.allowReplay ? ' · Mode Latihan' : '') +
        (settings.shuffleQuestions ? ' · Soal Acak' : '');
      document.getElementById('lobby-meta-flags').textContent = flagsStr;
      document.getElementById('lobby-room-label').textContent = activeRoomCode ? ('#' + activeRoomCode) : 'Umum';
      document.getElementById('admin-room-badge').textContent = activeRoomCode ? ('#' + activeRoomCode) : 'Umum (Default)';

      if (gateBox) gateBox.classList.toggle('hidden', roomGateUnlocked);
      if (unlockedBox) unlockedBox.classList.toggle('hidden', !roomGateUnlocked);
      if (btnRoomHeader) btnRoomHeader.classList.toggle('hidden', !roomGateUnlocked);
      if (statusEl) statusEl.classList.toggle('hidden', !roomGateUnlocked);

      var btnPowTab = document.getElementById('tab-btn-powerups');
      if (btnPowTab) btnPowTab.classList.toggle('hidden', !showPowTab);
      if (!showPowTab && lobbyTab === 'powerups') {
        lobbyTab = 'categories';
        var btnCatEl = document.getElementById('tab-btn-categories');
        var pCatEl = document.getElementById('lobby-panel-categories');
        var pPowEl = document.getElementById('lobby-panel-powerups');
        var hintEl = document.getElementById('lobby-cat-hint-label');
        if (btnCatEl) {
          btnCatEl.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap bg-amber-400 text-slate-950';
          btnCatEl.setAttribute('aria-selected', 'true');
        }
        if (pCatEl) pCatEl.classList.remove('hidden');
        if (pPowEl) pPowEl.classList.add('hidden');
        if (hintEl) hintEl.classList.remove('hidden');
      }

      var effectivePartMode = getEffectiveParticipationMode();
      var showPartChoice = voyageMode && effectivePartMode === 'either';
      var showTeamInp = voyageMode && (effectivePartMode === 'team' || (effectivePartMode === 'either' && teamModeChoice === 'team'));
      var partWrap = document.getElementById('lobby-participation-wrap');
      var teamWrap = document.getElementById('lobby-team-input-wrap');
      var pNameLbl = document.getElementById('player-name-label');
      if (partWrap) partWrap.classList.toggle('hidden', !showPartChoice);
      if (teamWrap) teamWrap.classList.toggle('hidden', !showTeamInp);
      if (pNameLbl) pNameLbl.textContent = showTeamInp ? 'Nama Pelaut / Anggota' : 'Nama Pemain';

      var btnSolo = document.getElementById('btn-part-solo');
      var btnTeam = document.getElementById('btn-part-team');
      if (btnSolo && btnTeam) {
        btnSolo.className = 'flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ' + (teamModeChoice === 'solo' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
        btnTeam.className = 'flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ' + (teamModeChoice === 'team' ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:text-white');
      }
      var btnWaitLb = document.getElementById('btn-waiting-live-lb');
      if (btnWaitLb) btnWaitLb.classList.toggle('hidden', !settings.showLiveLeaderboardToPlayers);

      if (currentSessionMode === 'unconfigured') {
        statusEl.className = 'inline-flex items-center gap-2 text-xs font-semibold text-amber-300' + (roomGateUnlocked ? '' : ' hidden');
        textEl.textContent = 'Menunggu Admin memilih mode kuis';
        hgEl.classList.remove('hidden');
      } else if (currentSessionMode === 'free_waiting') {
        statusEl.className = 'inline-flex items-center gap-2 text-xs font-semibold text-emerald-300' + (roomGateUnlocked ? '' : ' hidden');
        textEl.textContent = 'Mode Bebas · Menunggu Start Admin';
        hgEl.classList.remove('hidden');
      } else if (currentSessionMode === 'free') {
        statusEl.className = 'inline-flex items-center gap-2 text-xs font-semibold text-emerald-400' + (roomGateUnlocked ? '' : ' hidden');
        textEl.textContent = 'Mode Bebas · Kuis Dibuka';
        hgEl.classList.add('hidden');
      } else if (currentSessionMode === 'live_waiting') {
        statusEl.className = 'inline-flex items-center gap-2 text-xs font-semibold text-amber-300' + (roomGateUnlocked ? '' : ' hidden');
        textEl.textContent = 'Mode Live · Ruang Tunggu Dibuka';
        hgEl.classList.remove('hidden');
      } else {
        statusEl.className = 'inline-flex items-center gap-2 text-xs font-semibold text-rose-400' + (roomGateUnlocked ? '' : ' hidden');
        textEl.textContent = 'Mode Live · Sesi Berlangsung';
        hgEl.classList.add('hidden');
      }

      var effectiveLocked = hasPlayedThisDevice && !settings.allowReplay;
      var recBanner = document.getElementById('recoverable-progress-banner');
      if (recoverableProgress && !effectiveLocked && roomGateUnlocked) {
        recBanner.classList.remove('hidden');
        document.getElementById('recoverable-progress-info').innerHTML =
          'Lanjutkan sebagai <strong class="text-white">' + escapeHtml(recoverableProgress.playerName) + '</strong> di soal #' +
          ((recoverableProgress.currentQuestionIndex || 0) + 1) + ' (Skor <span class="font-mono-num">' + (recoverableProgress.score || 0) + '</span>).';
      } else {
        recBanner.classList.add('hidden');
      }

      var awaitBanner = document.getElementById('awaiting-admin-mode-banner');
      var inputBox = document.getElementById('lobby-input-container');
      var modeHeader = document.getElementById('lobby-mode-panel-header');
      var modeTitle = document.getElementById('lobby-mode-panel-title');
      var modeCount = document.getElementById('lobby-mode-panel-count');
      var modeDesc = document.getElementById('lobby-mode-panel-desc');
      var modeMeta = document.getElementById('lobby-mode-panel-meta');
      var playedBanner = document.getElementById('already-played-banner');
      var replayHint = document.getElementById('lobby-replay-hint');
      var btnStart = document.getElementById('btn-start-quiz');
      var btnLb = document.getElementById('btn-lobby-leaderboard');
      var freshCnt = filterFreshActivePlayers(activePlayers).length;

      if (btnLb) btnLb.classList.toggle('hidden', !(cloudLeaderboard.length > 0 || freshCnt > 0 || hasPlayedThisDevice || settings.showLiveLeaderboardToPlayers));

      if (effectiveLocked) {
        awaitBanner.classList.add('hidden');
        inputBox.classList.add('hidden');
        playedBanner.classList.remove('hidden');
        document.getElementById('already-played-info').textContent = mySavedRecord
          ? ('Kamu sudah menyelesaikan kuis sebagai ' + mySavedRecord.name + ' dengan skor ' + mySavedRecord.score + ' (' + mySavedRecord.correct + '/' + (mySavedRecord.totalQuestions || questions.length) + ' benar).')
          : 'Perangkat ini sudah menyelesaikan kuis 1 kali dan terekam di Leaderboard.';
        btnStart.disabled = true;
        btnStart.className = 'flex-1 bg-slate-800/80 text-slate-500 font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl border border-slate-700 cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap';
        btnStart.textContent = 'Kuis Sudah Selesai';
      } else if (currentSessionMode === 'unconfigured') {
        awaitBanner.classList.remove('hidden');
        inputBox.classList.add('hidden');
        playedBanner.classList.add('hidden');
        btnStart.disabled = true;
        btnStart.className = 'flex-1 bg-slate-800/80 text-slate-400 font-bold text-sm sm:text-base py-3.5 px-6 rounded-xl border border-slate-700 cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap';
        btnStart.textContent = 'Menunggu Admin...';
      } else {
        var isLive = isLiveSessionMode(currentSessionMode);
        awaitBanner.classList.add('hidden');
        inputBox.classList.remove('hidden');
        playedBanner.classList.add('hidden');
        inputBox.className = 'max-w-xl mx-auto mb-6 rounded-2xl border bg-[#0B1120] overflow-hidden ' + (isLive ? 'border-amber-400/35' : 'border-emerald-500/35');
        if (modeHeader) {
          modeHeader.className = 'px-5 py-4 border-b flex items-start gap-3 ' + (isLive ? 'bg-amber-400/[0.08] border-amber-400/20' : 'bg-emerald-500/[0.08] border-emerald-500/20');
        }
        if (modeTitle) {
          modeTitle.className = 'text-sm sm:text-base font-extrabold ' + (isLive ? 'text-amber-300' : 'text-emerald-300');
          modeTitle.textContent = currentSessionMode === 'free_waiting'
            ? 'Mode Bebas · Siap (Menunggu Start Admin)'
            : currentSessionMode === 'free'
              ? 'Mode Bebas · Kerjakan Mandiri'
              : currentSessionMode === 'live_waiting'
                ? 'Mode Live · Ruang Tunggu Serentak'
                : 'Mode Live · Arena Sedang Berlangsung';
        }
        if (modeCount) {
          modeCount.textContent = isLive
            ? (currentSessionMode === 'live_waiting' ? (waitingPlayers.length + ' di ruang tunggu') : (freshCnt + ' sedang bermain'))
            : (currentSessionMode === 'free_waiting' ? (waitingPlayers.length + ' standby · Tunggu Start') : (freshCnt + ' sedang bermain'));
        }
        if (modeDesc) {
          modeDesc.textContent = currentSessionMode === 'free_waiting'
            ? 'Admin sedang menyiapkan konfigurasi Mode Bebas. Masukkan namamu untuk masuk daftar standby—kuis baru bisa dimulai setelah Admin menekan tombol Start.'
            : currentSessionMode === 'free'
              ? 'Akses Mode Bebas sudah dibuka Admin! Kerjakan kapan saja sesuai kecepatanmu sendiri sambil memantau klasemen real-time.'
              : currentSessionMode === 'live_waiting'
                ? 'Masukkan namamu untuk masuk ke Ruang Tunggu Live. Kuis akan dimulai serentak ketika Admin menekan Mulai Live.'
                : 'Sesi Live sudah dimulai! Masukkan namamu untuk langsung menyusul masuk bersama peserta lainnya.';
        }
        if (modeMeta) {
          var timerLbl = durMins > 0 ? ('Timer ' + durMins + ' Menit') : 'Timer per soal';
          if (!isLive) {
            modeMeta.innerHTML = '<span>' + (currentSessionMode === 'free_waiting' ? 'Menunggu tombol Start Admin' : 'Leaderboard real-time aktif') + '</span><span>·</span><span>' + timerLbl + '</span>' + (settings.allowReplay ? '<span>·</span><span class="text-emerald-300">Boleh ulang</span>' : '');
          } else {
            var standbyNames = waitingPlayers.slice(0, 3).map(function(w) { return escapeHtml(w.name); }).join(', ');
            var extraStandby = waitingPlayers.length > 3 ? (' +' + (waitingPlayers.length - 3)) : '';
            modeMeta.innerHTML = '<span class="text-amber-200">Sesi serentak</span><span>·</span><span>' + timerLbl + '</span>' +
              ((currentSessionMode === 'live_waiting' && waitingPlayers.length > 0) ? ('<span>·</span><span>Standby: ' + standbyNames + extraStandby + '</span>') : '');
          }
        }
        if (replayHint) replayHint.classList.toggle('hidden', !(settings.allowReplay && hasPlayedThisDevice));
        btnStart.disabled = false;
        if (currentSessionMode === 'free_waiting') {
          btnStart.className = 'arcade-btn flex-1 bg-emerald-400/90 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap';
          btnStart.textContent = 'Siap & Tunggu Start Admin';
        } else if (currentSessionMode === 'free') {
          btnStart.className = 'arcade-btn flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap';
          btnStart.textContent = (hasPlayedThisDevice && settings.allowReplay)
            ? 'Main Lagi Sekarang'
            : (voyageMode ? 'Mulai Berlayar Mandiri' : 'Mulai Kuis Mandiri');
        } else {
          btnStart.className = 'arcade-btn-amber flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap';
          btnStart.textContent = currentSessionMode === 'live_waiting' ? 'Masuk Ruang Tunggu Live' : 'Gabung Arena Live Sekarang';
        }
      }

      if (activeScreen === 'waiting' && (currentSessionMode === 'live_started' || currentSessionMode === 'free') && !effectiveLocked && playerName) {
        startGameplay(playerName, currentSessionMode, currentLiveRunId, false, false);
      }
      if (activeScreen === 'waiting') {
        renderWaitingRoom();
      }
      if (activeScreen === 'admin') {
        renderAdminSessionControls();
        renderAdminGamificationControls();
        renderAdminSettingsControls();
      }
    }

    function selectTeamChoice(mode) {
      playPopClickFx();
      teamModeChoice = mode === 'team' ? 'team' : 'solo';
      updateLobbyUI();
    }

    function openRoomModal() {
      playPopClickFx();
      document.getElementById('room-modal-input').value = activeRoomCode;
      document.getElementById('modal-room').classList.remove('hidden');
      setTimeout(function() { document.getElementById('room-modal-input').focus(); }, 40);
    }
    function closeRoomModal() {
      document.getElementById('modal-room').classList.add('hidden');
    }
    function switchRoomScope(rawCode) {
      var san = sanitizeRoomCode(rawCode);
      var clean = (san === 'UMUM' || san === 'DEFAULT') ? '' : san;
      if (clean === activeRoomCode) return;
      activeRoomCode = clean;
      safeSetStorage(ROOM_CODE_STORAGE_KEY, clean);
      cloudLeaderboard = [];
      waitingPlayers = [];
      activePlayers = [];
      currentSessionMode = 'unconfigured';
      loadScopedLocalState();
      if (window.switchFirebaseRoom) window.switchFirebaseRoom(clean);
      updateLobbyUI();
      renderWaitingRoom();
      if (activeScreen === 'admin') {
        renderAdminSessionControls();
        renderAdminStats();
        renderAdminBankSoal();
      }
    }
    function applyRoomFromModal() {
      playPopClickFx();
      var val = document.getElementById('room-modal-input').value;
      switchRoomScope(val);
      roomGateUnlocked = true;
      closeRoomModal();
      updateLobbyUI();
      showToast(activeRoomCode ? ('Bergabung ke Ruangan #' + activeRoomCode) : 'Beralih ke Ruangan Umum');
    }

    function handleLobbyStartClick() {
      playPopClickFx();
      var effectiveLocked = hasPlayedThisDevice && !settings.allowReplay;
      if (effectiveLocked || currentSessionMode === 'unconfigured') return;
      var inp = document.getElementById('player-name');
      var teamInp = document.getElementById('player-team-name');
      var name = (inp.value || '').trim();
      var tVal = teamInp ? (teamInp.value || '').trim() : '';
      var err = document.getElementById('name-error');
      if (!name) { err.textContent = 'Silakan masukkan nama terlebih dahulu.'; err.classList.remove('hidden'); inp.focus(); return; }
      var pm = getEffectiveParticipationMode();
      if ((pm === 'team' || (pm === 'either' && teamModeChoice === 'team')) && !tVal) {
        err.textContent = 'Silakan masukkan nama tim / kru terlebih dahulu.';
        err.classList.remove('hidden');
        if (teamInp) teamInp.focus();
        return;
      }
      err.classList.add('hidden');
      playerName = name;
      teamName = tVal;

      var resolvedTeam = getResolvedTeamName();
      if (currentSessionMode === 'live_waiting' || currentSessionMode === 'free_waiting') {
        showScreen('waiting');
        renderWaitingRoom();
        if (window.joinWaitingRoomCloud) window.joinWaitingRoomCloud({ deviceId: myDeviceId, name: name, teamName: resolvedTeam || undefined, joinedAt: Date.now() });
      } else {
        startGameplay(name, currentSessionMode, currentLiveRunId, false, false);
      }
    }

    function renderWaitingRoom() {
      var badge = document.getElementById('waiting-count-badge');
      var listEl = document.getElementById('waiting-players-list');
      var roomBadge = document.getElementById('waiting-room-badge');
      var gmLbl = document.getElementById('waiting-gameplay-label');
      var myNameEl = document.getElementById('waiting-my-name');
      var waitSec = document.getElementById('screen-waiting');
      var modeBadge = document.getElementById('waiting-mode-badge');
      var iconBox = document.getElementById('waiting-icon-box');
      var headingEl = document.getElementById('waiting-heading');
      var descEl = document.getElementById('waiting-desc');
      var statusTagEl = document.getElementById('waiting-status-tag');
      var isVoy = isTeamParticipationAvailable();
      var resolvedTeam = getResolvedTeamName();
      var isFreeWait = currentSessionMode === 'free_waiting' || currentSessionMode === 'free';
      var isUnconf = currentSessionMode === 'unconfigured';

      if (waitSec) {
        waitSec.className = (activeScreen === 'waiting' ? '' : 'hidden ') + 'relative surface-card rounded-2xl p-6 sm:p-9 shadow-xl text-center border ' + (isFreeWait ? 'border-emerald-400/35' : 'border-amber-400/35');
      }
      if (modeBadge) {
        modeBadge.textContent = isFreeWait ? 'Ruang Tunggu · Mode Bebas' : 'Ruang Tunggu · Mode Live';
        modeBadge.className = 'font-bold ' + (isFreeWait ? 'text-emerald-300' : 'text-amber-300');
      }
      if (iconBox) {
        iconBox.className = 'w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ' +
          (isFreeWait ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300' : 'bg-amber-400/15 border-amber-400/30 text-amber-300');
      }
      if (headingEl) {
        headingEl.textContent = isUnconf
          ? 'Menunggu Admin Memilih Mode'
          : isFreeWait
            ? 'Mode Bebas Siap · Menunggu Start Admin'
            : 'Menunggu Admin Memulai Sesi Live';
      }
      if (descEl) {
        descEl.innerHTML = isUnconf
          ? 'Admin sedang meninjau ulang mode pelaksanaan. Tampilan ini akan otomatis menyesuaikan secara real-time.'
          : isFreeWait
            ? 'Admin memilih <strong class="text-emerald-300">Mode Bebas</strong>. Kuis akan langsung terbuka otomatis segera setelah Admin menekan tombol <strong class="text-emerald-300">Mulai Mode Bebas</strong>.'
            : 'Tetap buka halaman ini. Layar pertanyaan akan terbuka secara serentak untuk seluruh peserta segera setelah Admin menekan tombol <strong class="text-amber-300">Mulai Live Sekarang</strong>.';
      }
      if (statusTagEl) {
        statusTagEl.textContent = isFreeWait ? 'Standby Mode Bebas' : 'Siap Mulai Serentak';
      }

      if (roomBadge) roomBadge.textContent = activeRoomCode ? ('#' + activeRoomCode) : 'Umum';
      if (gmLbl) gmLbl.textContent = isVoy ? 'Berlayar Harta Karun' : (isFreeWait ? 'Kuis Mandiri' : 'Kuis Klasik Serentak');
      if (myNameEl) {
        myNameEl.textContent = (playerName || 'Peserta') + (isVoy ? (resolvedTeam ? (' · Tim ' + resolvedTeam) : ' · Solo') : '');
      }
      if (badge) badge.textContent = waitingPlayers.length + ' Bergabung';
      if (!listEl) return;
      if (waitingPlayers.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-slate-500 text-center py-4 w-full">Menghubungkan ke daftar ruang tunggu...</p>';
        return;
      }
      listEl.innerHTML = waitingPlayers.map(function(p) {
        var isMe = p.deviceId === myDeviceId;
        var cls = isMe ? 'bg-amber-400 text-slate-950' : 'bg-[#131C31] text-slate-200 border border-[#23304C]';
        var tTag = (isVoy && p.teamName) ? (' · ' + escapeHtml(p.teamName)) : '';
        return '<span class="px-3 py-1.5 rounded-lg text-xs font-bold ' + cls + '">' + escapeHtml(p.name) + tTag + (isMe ? ' (Kamu)' : '') + '</span>';
      }).join('');
    }
    function leaveWaitingRoom() {
      if (window.leaveWaitingRoomCloud) window.leaveWaitingRoomCloud(myDeviceId);
      showScreen('lobby');
    }

    function resumeRecoverableProgress() {
      if (!recoverableProgress) return;
      playPopClickFx();
      var src = questions.length > 0 ? questions : DEFAULT_QUESTIONS_DATA;
      playDeck = src.slice();
      var nextIdx = recoverableProgress.currentQuestionIndex || 0;
      if ((recoverableProgress.playerHistory || []).length > nextIdx) nextIdx++;
      if (nextIdx >= playDeck.length) nextIdx = playDeck.length - 1;
      playerName = recoverableProgress.playerName;
      if (recoverableProgress.teamName) { teamModeChoice = 'team'; teamName = recoverableProgress.teamName; }
      if (typeof recoverableProgress.globalTimeLeftSeconds === 'number' && recoverableProgress.globalTimeLeftSeconds > 0) {
        totalGlobalSeconds = Math.max(recoverableProgress.globalTimeLeftSeconds, (Number(settings.quizDurationMinutes) || 0) * 60);
        globalTimeLeft = recoverableProgress.globalTimeLeftSeconds;
      }
      visitedIslands = recoverableProgress.visitedIslands || [];
      score = recoverableProgress.score || 0;
      correctCount = recoverableProgress.correctCount || 0;
      playerHistory = recoverableProgress.playerHistory || [];
      powerupInventory = recoverableProgress.powerupInventory || [null, null];
      currentStreak = recoverableProgress.currentStreak || 0;
      immuneQuestionsRemaining = recoverableProgress.immuneQuestionsRemaining || 0;
      awardedDebuffMilestones = recoverableProgress.awardedDebuffMilestones || [];
      glitchShuffleForNext = Boolean(recoverableProgress.glitchShuffleActiveForNext);
      currentQuestionIndex = nextIdx;
      recoverableProgress = null;
      preCountdownValue = null;
      document.getElementById('pre-countdown-overlay').classList.add('hidden');
      showScreen('quiz');
      loadQuestion();
      startGlobalTimer();
      showToast('Sesi sebelumnya dipulihkan!');
    }
    function discardRecoverableProgress() {
      playPopClickFx();
      safeRemoveStorage(getInProgressKey());
      recoverableProgress = null;
      updateLobbyUI();
    }

    // ==================== COUNTDOWN & QUIZ ENGINE ====================
    function startPreCountdown() {
      clearTimeout(preCountdownTimer);
      clearInterval(timerInterval);
      clearInterval(globalTimerInterval);
      preCountdownValue = 3;
      var ov = document.getElementById('pre-countdown-overlay');
      var num = document.getElementById('pre-countdown-number');
      ov.classList.remove('hidden');
      num.textContent = '3';
      playCountdownTickFx(3);

      function step() {
        preCountdownTimer = setTimeout(function() {
          if (preCountdownValue === null) return;
          if (preCountdownValue <= 1) {
            preCountdownValue = null;
            ov.classList.add('hidden');
            playCountdownGoFx();
            startQuestionTimer();
            startGlobalTimer();
          } else {
            preCountdownValue = preCountdownValue - 1;
            num.classList.remove('anim-countdown-pop');
            void num.offsetWidth;
            num.classList.add('anim-countdown-pop');
            num.textContent = String(preCountdownValue);
            playCountdownTickFx(preCountdownValue);
            step();
          }
        }, 850);
      }
      step();
    }
    function skipPreCountdown() {
      clearTimeout(preCountdownTimer);
      preCountdownValue = null;
      document.getElementById('pre-countdown-overlay').classList.add('hidden');
      playCountdownGoFx();
      startQuestionTimer();
      startGlobalTimer();
    }

    function startGameplay(name, modeUsed, runIdUsed, localOnly, skipCountdown) {
      playerName = name;
      var resolvedTeam = getResolvedTeamName();
      var src = questions.length > 0 ? questions : DEFAULT_QUESTIONS_DATA;
      playDeck = prepareQuizDeck(src, settings);

      var globalEnabled = (Number(settings.quizDurationMinutes) || 0) > 0 && modeUsed !== 'unconfigured';
      totalGlobalSeconds = globalEnabled ? Math.max(60, Math.round(Number(settings.quizDurationMinutes) * 60)) : 0;
      globalTimeLeft = totalGlobalSeconds;

      if (!localOnly) {
        if (window.leaveWaitingRoomCloud) window.leaveWaitingRoomCloud(myDeviceId);
        if (window.upsertActivePlayerCloud) {
          window.upsertActivePlayerCloud({
            deviceId: myDeviceId, name: name, teamName: resolvedTeam || undefined,
            mode: modeUsed, score: 0, correct: 0, currentQuestion: 1, totalQuestions: playDeck.length,
            startedAt: Date.now(), lastSeen: Date.now()
          });
        }
      }

      currentQuestionIndex = 0;
      score = 0;
      correctCount = 0;
      playerHistory = [];
      powerupInventory = [null, null];
      currentStreak = 0;
      awardedDebuffMilestones = [];
      immuneQuestionsRemaining = 0;
      glitchShuffleForNext = false;
      isFrozen = false;
      tornadoCountdown = 0;
      tornadoAttackerName = '';
      dockedIslandModal = null;
      visitedIslands = [];
      clearInterval(freezeInterval);
      clearInterval(tornadoInterval);
      clearInterval(globalTimerInterval);
      document.getElementById('freeze-overlay').classList.add('hidden');
      document.getElementById('tornado-banner').classList.add('hidden');
      document.getElementById('modal-island-minigame').classList.add('hidden');
      document.getElementById('confetti-container').classList.add('hidden');
      recoverableProgress = null;

      showScreen('quiz');
      loadQuestion();

      if (skipCountdown) {
        preCountdownValue = null;
        document.getElementById('pre-countdown-overlay').classList.add('hidden');
        startQuestionTimer();
        startGlobalTimer();
      } else {
        startPreCountdown();
      }

      if (!localOnly) {
        safeSetStorage(getInProgressKey(), JSON.stringify({
          deviceId: myDeviceId, playerName: name, teamName: resolvedTeam || undefined,
          runId: runIdUsed, roomCode: activeRoomCode,
          currentQuestionIndex: 0, score: 0, correctCount: 0,
          playerHistory: [], powerupInventory: [null, null], currentStreak: 0,
          immuneQuestionsRemaining: 0, awardedDebuffMilestones: [],
          glitchShuffleActiveForNext: false, globalTimeLeftSeconds: totalGlobalSeconds || undefined,
          visitedIslands: [], savedAt: Date.now()
        }));
      }
    }

    function renderPowerupSlots() {
      var gamBar = document.getElementById('quiz-gamification-bar');
      var gamActive = isGamificationActive();
      var enabledList = getEnabledPowerups();
      var showBar = gamActive && enabledList.length > 0;
      if (gamBar) gamBar.classList.toggle('hidden', !showBar);
      var buffsElGate = document.getElementById('quiz-active-buffs');
      if (!showBar) {
        if (buffsElGate) buffsElGate.classList.add('hidden');
        return;
      }

      var container = document.getElementById('powerup-slots-container');
      var html = '';
      for (var i = 0; i < 2; i++) {
        var id = powerupInventory[i];
        var spec = id ? POWERUPS[id] : null;
        if (!spec) {
          html += '<div class="rounded-lg border border-dashed border-[#23304C] bg-[#0B1120]/60 px-3 py-2 text-[11px] text-slate-500 text-center font-medium">Slot ' + (i + 1) + ' Kosong</div>';
        } else {
          var dis = powerupUsedThisQuestion || isFrozen || questionFeedbackShown;
          html += '<div title="' + escapeHtml(spec.desc) + '" class="rounded-lg border border-amber-400/40 bg-[#0B1120] px-2.5 py-1.5 flex items-center justify-between gap-2">' +
            '<span class="text-xs font-bold text-slate-100 truncate">' + escapeHtml(spec.name) + '</span>' +
            '<button type="button" ' + (dis ? 'disabled' : '') + ' onclick="activatePowerup(' + i + ')" class="arcade-btn-amber text-[11px] font-extrabold px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0">Pakai</button>' +
          '</div>';
        }
      }
      container.innerHTML = html;

      var streakBox = document.getElementById('quiz-streak-box');
      var streakOffNote = document.getElementById('quiz-streak-disabled-note');
      var streakOn = !(settings && settings.streakEnabled === false);
      if (streakBox) streakBox.classList.toggle('hidden', !streakOn);
      if (streakOffNote) {
        streakOffNote.classList.toggle('hidden', streakOn);
        if (!streakOn) {
          streakOffNote.innerHTML = 'Fitur aktif: <span class="text-amber-300 font-bold">' +
            enabledList.map(function(pid) { return escapeHtml(POWERUPS[pid].name); }).join(', ') + '</span>';
        }
      }

      var streakTarget = getStreakRewardTarget(playDeck.length);
      var milestones = getDebuffMilestones(playDeck.length);
      var showMs = isMilestoneDropActive() && milestones.length > 0;
      document.getElementById('streak-counter-text').textContent = 'Streak ' + currentStreak + '/' + streakTarget;
      var comboEl = document.getElementById('streak-combo-label');
      if (currentStreak >= 2) {
        comboEl.textContent = 'Kombo x' + currentStreak + '!';
        comboEl.classList.remove('hidden');
      } else {
        comboEl.classList.add('hidden');
      }
      var flameSvg = document.getElementById('streak-flame-svg');
      if (flameSvg) {
        flameSvg.className.baseVal = 'w-4 h-4 ' + (currentStreak > 0 ? 'text-amber-400 anim-flame-dance' : 'text-slate-500');
      }
      var rewardPrefix = enabledList.length === 1 ? (POWERUPS[enabledList[0]].name + ' tiap ' + streakTarget + ' benar') : ('Item tiap ' + streakTarget + ' benar');
      document.getElementById('streak-rule-label').textContent = rewardPrefix + (showMs ? ' · Debuff #' + milestones.join(', #') : '');

      var segs = document.getElementById('streak-segments');
      segs.style.gridTemplateColumns = 'repeat(' + streakTarget + ', minmax(0, 1fr))';
      var sHtml = '';
      for (var k = 0; k < streakTarget; k++) {
        sHtml += '<div class="h-1 rounded-full ' + (k < currentStreak ? 'bg-amber-400' : 'bg-[#0B1120]') + '"></div>';
      }
      segs.innerHTML = sHtml;

      var buffsEl = document.getElementById('quiz-active-buffs');
      var tags = [];
      if (doubleScoreActive) tags.push('<span class="text-amber-300">2x</span>');
      if (immuneQuestionsRemaining > 0) tags.push('<span class="text-emerald-300">Perisai</span>');
      if (tags.length > 0) {
        buffsEl.innerHTML = tags.join(' ');
        buffsEl.classList.remove('hidden');
      } else {
        buffsEl.classList.add('hidden');
      }
    }

    function grantPowerupToSlot(id, reason) {
      var idx = powerupInventory.indexOf(null);
      if (idx === -1) {
        score += 50;
        document.getElementById('current-score').textContent = String(score);
        showToast('Slot penuh! ' + reason + ' dikonversi menjadi +50 poin.');
        return;
      }
      powerupInventory[idx] = id;
      renderPowerupSlots();
      showToast(reason + ': Dapat item ' + POWERUPS[id].name + '!');
    }

    function handleQuizImageError() {
      document.getElementById('quiz-image-box').classList.add('hidden');
      document.getElementById('quiz-image-fallback').classList.remove('hidden');
    }

    function loadQuestion() {
      clearInterval(timerInterval);
      var q = playDeck[currentQuestionIndex];
      if (!q) return;

      questionFeedbackShown = false;
      doubleScoreActive = false;
      powerupUsedThisQuestion = false;
      eliminatedIndices = [];
      selectedMultipleIndices = [];
      if (immuneQuestionsRemaining > 0) immuneQuestionsRemaining--;

      var qNum = currentQuestionIndex + 1;
      if (isMilestoneDropActive()) {
        var ms = getDebuffMilestones(playDeck.length);
        if (ms.indexOf(qNum) !== -1 && awardedDebuffMilestones.indexOf(qNum) === -1) {
          var rolledMs = rollPowerup('debuff');
          if (rolledMs) {
            awardedDebuffMilestones.push(qNum);
            grantPowerupToSlot(rolledMs, 'Bonus Soal #' + qNum);
          }
        }
      }

      document.getElementById('quiz-progress-text').textContent = qNum + ' / ' + playDeck.length;
      document.getElementById('quiz-category-badge').textContent = q.category;
      var typeNames = { MC: 'Pilihan Ganda', TF: 'Benar / Salah', MS: 'Pilih Beberapa', TEXT: 'Isian Singkat' };
      document.getElementById('quiz-type-badge').textContent = typeNames[q.type] || q.type;
      document.getElementById('quiz-type-badge-mobile').textContent = typeNames[q.type] || q.type;
      document.getElementById('current-score').textContent = String(score);
      document.getElementById('score-pop-burst').classList.add('hidden');
      document.getElementById('question-text').textContent = q.question;
      document.getElementById('feedback-box').classList.add('hidden');

      var kbdHint = document.getElementById('quiz-kbd-hint');
      if (kbdHint) {
        if (q.type === 'TEXT') kbdHint.classList.add('hidden');
        else if (q.type === 'MS') { kbdHint.classList.remove('hidden'); kbdHint.textContent = 'Pintasan keyboard: 1–4 / A–D pilih opsi, Enter kirim'; }
        else { kbdHint.classList.remove('hidden'); kbdHint.textContent = 'Pintasan keyboard: tekan 1–' + (q.type === 'TF' ? '2 / A–B' : '4 / A–D'); }
      }

      // Optional image
      var imgWrap = document.getElementById('quiz-image-wrap');
      var imgBox = document.getElementById('quiz-image-box');
      var imgEl = document.getElementById('quiz-image-el');
      var imgFallback = document.getElementById('quiz-image-fallback');
      var safeUrl = sanitizeImageUrl(q.imageUrl);
      if (safeUrl) {
        imgWrap.classList.remove('hidden');
        imgBox.classList.remove('hidden');
        imgFallback.classList.add('hidden');
        imgEl.alt = 'Ilustrasi soal ' + qNum;
        imgEl.src = safeUrl;
      } else {
        imgWrap.classList.add('hidden');
        imgEl.removeAttribute('src');
      }

      timeLeft = q.time || 25;
      updateTimerDisplay();
      renderPowerupSlots();
      renderVoyageRoadmap();
      var btnQuizLb = document.getElementById('btn-quiz-live-lb');
      if (btnQuizLb) btnQuizLb.classList.toggle('hidden', !settings.showLiveLeaderboardToPlayers);

      var optLen = (q.options || []).length;
      var canGlitch = isGamificationActive() && glitchShuffleForNext;
      var shouldShuffleOpts = (q.type === 'MC' || q.type === 'MS') && (canGlitch || settings.shuffleOptions);
      currentOptionOrder = computeShuffledOrder(optLen, shouldShuffleOpts);

      var optContainer = document.getElementById('options-container');
      if (canGlitch && (q.type === 'MC' || q.type === 'MS')) {
        glitchShuffleForNext = false;
        optContainer.classList.add('glitch-active');
        setTimeout(function() { optContainer.classList.remove('glitch-active'); }, 750);
      } else {
        glitchShuffleForNext = false;
      }

      renderQuestionOptions();
    }

    function renderVoyageRoadmap() {
      var box = document.getElementById('voyage-roadmap-box');
      if (!box) return;
      if (settings.gameplayMode !== 'voyage') {
        box.classList.add('hidden');
        return;
      }
      box.classList.remove('hidden');
      var vp = getVoyageProgressState(playerHistory.length, playDeck.length);
      var rTeam = getResolvedTeamName();
      var shipLeft = Math.max(4, Math.min(94, vp.shipPercent));
      var stepsHtml = [1, 2, 3].map(function(step) {
        var reached = vp.legStep >= step;
        return '<span class="px-2 py-0.5 rounded font-mono-num text-[10px] font-bold border ' +
          (reached ? 'bg-cyan-400/20 border-cyan-400/60 text-cyan-200' : 'bg-[#0B1120] border-[#23304C] text-slate-500') + '">' +
          step + (step === 3 ? ' · Berlabuh' : '') + '</span>';
      }).join('');
      var islandsHtml = vp.checkpoints.map(function(cp) {
        var visited = playerHistory.length >= cp.questionNumber;
        var isNext = vp.nextIsland && vp.nextIsland.islandNumber === cp.islandNumber;
        return '<div class="rounded-lg border px-2 py-1.5 text-center transition-colors ' +
          (visited ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300' :
          isNext ? 'bg-amber-400/15 border-amber-400/50 text-amber-200' :
          'bg-[#0B1120] border-[#23304C] text-slate-500') + '">' +
          '<div class="font-mono-num text-[10px] font-extrabold">P' + cp.islandNumber + ' #' + cp.questionNumber + '</div>' +
          '<div class="text-[10px] font-semibold truncate">' + escapeHtml(cp.name) + '</div>' +
        '</div>';
      }).join('');
      box.innerHTML =
        '<div class="flex flex-wrap items-center justify-between gap-2 text-xs">' +
          '<div class="flex items-center gap-2 font-bold text-cyan-300"><span>Peta Pelayaran Harta Karun</span>' +
            (rTeam ? '<span class="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[11px] font-bold">Tim ' + escapeHtml(rTeam) + '</span>' : '') +
          '</div>' +
          '<div class="font-mono-num text-[11px] text-slate-300 font-bold">Pulau ' + vp.completedIslands + '/' + vp.totalIslands + ' · Langkah ' + vp.legStep + '/3</div>' +
        '</div>' +
        '<div class="relative pt-4 pb-1"><div class="h-2.5 w-full rounded-full bg-[#0B1120] border border-[#23304C] overflow-hidden"><div class="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 transition-all duration-500" style="width:' + vp.shipPercent + '%"></div></div>' +
          '<div class="absolute -top-0.5 -translate-x-1/2 transition-all duration-500 pointer-events-none" style="left:' + shipLeft + '%"><div class="w-7 h-7 rounded-full bg-amber-400 text-slate-950 border-2 border-[#0B1120] shadow-lg flex items-center justify-center font-black text-xs anim-ship-bob" title="Kapal Kamu">⛵</div></div>' +
        '</div>' +
        '<div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">' +
          '<div class="flex items-center gap-1.5">' + stepsHtml + '</div>' +
          (vp.nextIsland ? '<span class="text-slate-300 font-medium">Menuju: <strong class="text-amber-300">' + escapeHtml(vp.nextIsland.name) + '</strong> (Soal #' + vp.nextIsland.questionNumber + ')</span>' : '') +
        '</div>' +
        '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">' + islandsHtml + '</div>';
    }

    function renderQuestionOptions() {
      var q = playDeck[currentQuestionIndex];
      var optContainer = document.getElementById('options-container');
      var submitContainer = document.getElementById('submit-complex-container');
      var letters = ['A', 'B', 'C', 'D'];
      optContainer.innerHTML = '';

      if (q.type === 'MC' || q.type === 'TF') {
        submitContainer.classList.add('hidden');
        for (var i = 0; i < currentOptionOrder.length; i++) {
          (function(dispIdx, origIdx) {
            var isElim = eliminatedIndices.indexOf(origIdx) !== -1;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.origIdx = String(origIdx);
            btn.disabled = isElim || isFrozen || questionFeedbackShown;
            btn.className = 'arcade-btn w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] cursor-pointer disabled:cursor-default ' +
              (isElim ? 'bg-[#0B1120] border-[#23304C] text-slate-500 opacity-25 line-through' : 'bg-[#0B1120] hover:bg-slate-800/90 border-[#23304C] text-slate-100');
            btn.innerHTML = '<span class="w-8 h-8 rounded-lg bg-[#131C31] text-slate-300 border border-[#23304C] flex items-center justify-center font-extrabold text-xs shrink-0">' + letters[dispIdx] + '</span><span class="flex-1">' + escapeHtml((q.options || [])[origIdx]) + '</span>';
            btn.onclick = function() { selectSingleAnswer(origIdx, btn); };
            optContainer.appendChild(btn);
          })(i, currentOptionOrder[i]);
        }
      } else if (q.type === 'MS') {
        submitContainer.classList.remove('hidden');
        for (var m = 0; m < currentOptionOrder.length; m++) {
          (function(dispIdx, origIdx) {
            var isElim = eliminatedIndices.indexOf(origIdx) !== -1;
            var isSel = selectedMultipleIndices.indexOf(origIdx) !== -1;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.origIdx = String(origIdx);
            btn.disabled = isElim || isFrozen || questionFeedbackShown;
            btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
            btn.className = 'arcade-btn w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center justify-between gap-3.5 min-h-[52px] cursor-pointer disabled:cursor-default ' +
              (isElim ? 'bg-[#0B1120] border-[#23304C] text-slate-500 opacity-25 line-through' :
              isSel ? 'bg-amber-400/15 border-amber-400 text-white' : 'bg-[#0B1120] hover:bg-slate-800/80 border-[#23304C] text-slate-100');
            btn.innerHTML = '<div class="flex items-center gap-3 min-w-0"><span class="w-7 h-7 rounded-lg bg-[#131C31] text-slate-300 border border-[#23304C] flex items-center justify-center font-extrabold text-xs shrink-0">' + letters[dispIdx] + '</span><span>' + escapeHtml((q.options || [])[origIdx]) + '</span></div>' +
              '<span class="w-6 h-6 rounded border flex items-center justify-center shrink-0 ' + (isSel ? 'bg-amber-400 border-amber-400 text-slate-950 font-black' : 'border-slate-600') + '">' + (isSel ? '✓' : '') + '</span>';
            btn.onclick = function() { playPopClickFx(); toggleMultipleOption(origIdx); };
            optContainer.appendChild(btn);
          })(m, currentOptionOrder[m]);
        }
      } else {
        submitContainer.classList.remove('hidden');
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.id = 'text-answer-input';
        inp.placeholder = 'Ketik jawabanmu di sini...';
        inp.autocomplete = 'off';
        inp.disabled = isFrozen || questionFeedbackShown;
        inp.className = 'w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base sm:text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-200';
        inp.onkeydown = function(e) { if (e.key === 'Enter' && !questionFeedbackShown) submitComplexAnswer(); };
        optContainer.appendChild(inp);
        setTimeout(function() { if (!isFrozen && !questionFeedbackShown) inp.focus(); }, 60);
      }
      updateSubmitComplexDisabled();
    }

    function toggleMultipleOption(origIdx) {
      if (questionFeedbackShown || isFrozen || preCountdownValue !== null) return;
      var pos = selectedMultipleIndices.indexOf(origIdx);
      if (pos === -1) selectedMultipleIndices.push(origIdx);
      else selectedMultipleIndices.splice(pos, 1);
      renderQuestionOptions();
    }
    function updateSubmitComplexDisabled() {
      var q = playDeck[currentQuestionIndex];
      var btn = document.getElementById('btn-submit-complex');
      if (!btn || !q) return;
      var dis = isFrozen || questionFeedbackShown;
      if (q.type === 'MS') dis = dis || selectedMultipleIndices.length === 0;
      btn.disabled = dis;
    }

    function updateTimerDisplay() {
      var isGlobal = isGlobalQuizTimerActive();
      var q = playDeck[currentQuestionIndex];
      var total = isGlobal ? Math.max(1, totalGlobalSeconds) : ((q && q.time) || 25);
      var rem = isGlobal ? globalTimeLeft : timeLeft;
      var pct = Math.max(0, Math.min(100, (rem / total) * 100));
      var tEl = document.getElementById('timer-text');
      var bar = document.getElementById('timer-bar');
      var box = document.getElementById('quiz-timer-box');
      var hg = document.getElementById('quiz-hourglass-svg');
      var urgentThreshold = isGlobal ? 30 : 5;
      var isUrgent = (!questionFeedbackShown || isGlobal) && !isFrozen && !dockedIslandModal && rem <= urgentThreshold && rem > 0;
      tEl.textContent = isGlobal ? ('Sisa Kuis ' + formatCountdownClock(rem)) : (Math.max(0, rem) + 'd');
      tEl.className = rem <= urgentThreshold ? 'text-rose-400 font-bold' : 'text-white';
      bar.style.width = pct + '%';
      bar.className = 'h-full transition-all duration-1000 ease-linear ' + (rem <= urgentThreshold ? 'bg-rose-500' : pct <= 45 ? 'bg-amber-400' : 'bg-emerald-400');
      if (box) box.className = 'inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold font-mono-num ' + (isUrgent ? 'text-rose-400 anim-urgent-tick' : 'text-slate-300');
      if (hg) hg.className.baseVal = 'w-4 h-4 ' + (isUrgent ? 'text-rose-400 anim-hourglass-fast' : 'text-amber-300 anim-hourglass-flip');
    }

    function startQuestionTimer() {
      clearInterval(timerInterval);
      if (isGlobalQuizTimerActive() || isFrozen || dockedIslandModal || questionFeedbackShown || preCountdownValue !== null) return;
      timerInterval = setInterval(function() {
        if (isGlobalQuizTimerActive() || isFrozen || dockedIslandModal || questionFeedbackShown || preCountdownValue !== null) return;
        timeLeft--;
        if (timeLeft <= 5 && timeLeft > 0) playUrgentTickFx();
        updateTimerDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          handleTimeout();
        }
      }, 1000);
    }

    function startGlobalTimer() {
      clearInterval(globalTimerInterval);
      if (!isGlobalQuizTimerActive() || totalGlobalSeconds <= 0) return;
      updateTimerDisplay();
      globalTimerInterval = setInterval(function() {
        if (activeScreen !== 'quiz' || preCountdownValue !== null || isFrozen || dockedIslandModal) return;
        globalTimeLeft--;
        if (globalTimeLeft <= 10 && globalTimeLeft > 0) playUrgentTickFx();
        updateTimerDisplay();
        if (globalTimeLeft <= 0) {
          clearInterval(globalTimerInterval);
          showToast('Waktu kuis global habis! Mengumpulkan hasil...');
          finishQuiz();
        }
      }, 1000);
    }

    function selectSingleAnswer(origIdx, clickedBtn) {
      if (questionFeedbackShown || isFrozen || preCountdownValue !== null) return;
      clearInterval(timerInterval);
      var q = playDeck[currentQuestionIndex];
      var ok = origIdx === q.answer;
      var btns = document.getElementById('options-container').querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
        var bOrig = Number(btns[i].dataset.origIdx);
        if (bOrig === q.answer) {
          btns[i].className = 'w-full text-left p-4 rounded-xl border font-extrabold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] bg-emerald-500 border-emerald-300 text-slate-950';
        } else if (btns[i] === clickedBtn && !ok) {
          btns[i].className = 'w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] bg-rose-600 border-rose-400 text-white';
        } else {
          btns[i].className = 'w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
        }
      }
      finalizeQuestion(ok, (q.options || [])[origIdx] || '', (q.options || [])[q.answer] || '', false);
    }

    function submitComplexAnswer() {
      if (questionFeedbackShown || isFrozen || preCountdownValue !== null) return;
      var q = playDeck[currentQuestionIndex];
      if (q.type === 'MS') {
        if (selectedMultipleIndices.length === 0) return;
        clearInterval(timerInterval);
        var sortedSel = selectedMultipleIndices.slice().sort(function(a, b) { return a - b; });
        var sortedAns = (q.answer || []).slice().sort(function(a, b) { return a - b; });
        var ok = sortedSel.length === sortedAns.length && sortedSel.every(function(v, i) { return v === sortedAns[i]; });
        var btns = document.getElementById('options-container').querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          btns[i].disabled = true;
          var bOrig = Number(btns[i].dataset.origIdx);
          if (sortedAns.indexOf(bOrig) !== -1) {
            btns[i].className = 'w-full text-left p-4 rounded-xl border font-extrabold text-sm sm:text-base flex items-center justify-between gap-3.5 min-h-[52px] bg-emerald-500 border-emerald-300 text-slate-950';
          } else if (sortedSel.indexOf(bOrig) !== -1) {
            btns[i].className = 'w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center justify-between gap-3.5 min-h-[52px] bg-rose-600 border-rose-400 text-white';
          } else {
            btns[i].className = 'w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center justify-between gap-3.5 min-h-[52px] bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
          }
        }
        document.getElementById('submit-complex-container').classList.add('hidden');
        var uTxt = sortedSel.map(function(i) { return (q.options || [])[i]; }).join(', ');
        var cTxt = sortedAns.map(function(i) { return (q.options || [])[i]; }).join(', ');
        finalizeQuestion(ok, uTxt, cTxt, false);
      } else if (q.type === 'TEXT') {
        var inp = document.getElementById('text-answer-input');
        var raw = (inp ? inp.value : '').trim();
        if (!raw) { if (inp) inp.focus(); return; }
        clearInterval(timerInterval);
        inp.disabled = true;
        document.getElementById('submit-complex-container').classList.add('hidden');
        var norm = raw.toLowerCase().replace(/\s+/g, ' ');
        var accepted = (q.acceptedAnswers || []).map(function(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); });
        var okText = accepted.indexOf(norm) !== -1;
        finalizeQuestion(okText, raw, ((q.acceptedAnswers || [])[0] || '').toUpperCase(), false);
      }
    }

    function handleTimeout() {
      if (questionFeedbackShown) return;
      var q = playDeck[currentQuestionIndex];
      document.getElementById('submit-complex-container').classList.add('hidden');
      if (q.type === 'MC' || q.type === 'TF') {
        var btns = document.getElementById('options-container').querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          btns[i].disabled = true;
          if (Number(btns[i].dataset.origIdx) === q.answer) {
            btns[i].className = 'w-full text-left p-4 rounded-xl border font-extrabold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] bg-emerald-500 border-emerald-300 text-slate-950';
          } else {
            btns[i].className = 'w-full text-left p-4 rounded-xl border font-semibold text-sm sm:text-base flex items-center gap-3.5 min-h-[52px] bg-[#0B1120] border-[#23304C] text-slate-400 opacity-40';
          }
        }
      } else if (q.type === 'TEXT') {
        var inp = document.getElementById('text-answer-input');
        if (inp) inp.disabled = true;
      }
      finalizeQuestion(false, 'Waktu Habis', getCorrectAnswerDisplay(q), true);
    }

    function finalizeQuestion(isCorrect, userAns, correctAns, isTimeout) {
      questionFeedbackShown = true;
      var isGlobal = isGlobalQuizTimerActive();
      var q = playDeck[currentQuestionIndex];
      var qDur = q.time || 25;
      var total = isGlobal ? Math.max(1, totalGlobalSeconds) : qDur;
      var rem = isGlobal ? globalTimeLeft : timeLeft;
      var timeTaken = isTimeout ? total : (isGlobal ? Math.max(1, Math.min(qDur, 25)) : Math.max(1, qDur - timeLeft));
      var earned = 0;
      if (isCorrect) {
        var clamped = Math.max(0, Math.min(total, rem));
        earned = isGlobal ? (850 + Math.round((clamped / total) * 150)) : (600 + Math.round((clamped / total) * 400));
        if (doubleScoreActive) earned *= 2;
      }

      if (isCorrect) {
        correctCount++;
        score += earned;
        if (isStreakRewardActive()) {
          currentStreak++;
          if (currentStreak >= 2) playStreakComboFx(currentStreak);
          else playCorrectFx();
        } else {
          currentStreak = 0;
          playCorrectFx();
        }

        var pop = document.getElementById('score-pop-burst');
        if (pop && earned > 0) {
          pop.textContent = '+' + earned;
          pop.classList.remove('hidden', 'anim-score-pop');
          void pop.offsetWidth;
          pop.classList.add('anim-score-pop');
        }

        if (isStreakRewardActive()) {
          var streakTarget = getStreakRewardTarget(playDeck.length);
          if (currentStreak >= streakTarget) {
            currentStreak = 0;
            var rolledSt = rollPowerup(null);
            if (rolledSt) grantPowerupToSlot(rolledSt, 'Streak ' + streakTarget + ' Benar');
          }
        }
      } else {
        playWrongFx();
        currentStreak = 0;
      }

      document.getElementById('current-score').textContent = String(score);
      renderPowerupSlots();

      playerHistory.push({
        questionId: q.id,
        questionIndex: currentQuestionIndex,
        question: q.question,
        category: q.category,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect: isCorrect,
        timeTaken: timeTaken,
        maxTime: qDur,
        pointsEarned: earned,
        explanation: q.explanation
      });

      renderVoyageRoadmap();

      var resolvedTeam = getResolvedTeamName();
      if (!isAutostartDemo) {
        if (window.upsertActivePlayerCloud) {
          window.upsertActivePlayerCloud({
            deviceId: myDeviceId, name: playerName, teamName: resolvedTeam || undefined, mode: currentSessionMode, score: score, correct: correctCount,
            currentQuestion: currentQuestionIndex + 1, totalQuestions: playDeck.length, startedAt: Date.now(), lastSeen: Date.now()
          });
        }
        safeSetStorage(getInProgressKey(), JSON.stringify({
          deviceId: myDeviceId, playerName: playerName, teamName: resolvedTeam || undefined, runId: currentLiveRunId, roomCode: activeRoomCode,
          currentQuestionIndex: currentQuestionIndex, score: score, correctCount: correctCount,
          playerHistory: playerHistory, powerupInventory: powerupInventory, currentStreak: currentStreak,
          immuneQuestionsRemaining: immuneQuestionsRemaining, awardedDebuffMilestones: awardedDebuffMilestones,
          glitchShuffleActiveForNext: glitchShuffleForNext, globalTimeLeftSeconds: isGlobal ? globalTimeLeft : undefined,
          visitedIslands: visitedIslands, savedAt: Date.now()
        }));
      }

      var box = document.getElementById('feedback-box');
      var card = document.getElementById('feedback-card');
      var inner = document.getElementById('feedback-inner');
      var ico = document.getElementById('feedback-icon');
      var title = document.getElementById('feedback-title');
      var pts = document.getElementById('feedback-points');
      var exp = document.getElementById('feedback-explanation');
      var nextBtn = document.getElementById('btn-next-question');
      box.classList.remove('hidden');
      if (isCorrect) {
        if (card) card.className = 'w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#131C31] rounded-2xl border shadow-2xl border-emerald-400/50';
        if (inner) inner.className = 'p-5 sm:p-6 bg-emerald-500/10';
        ico.className = 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-400 text-slate-950 font-black';
        ico.textContent = '✓';
        title.className = 'font-extrabold text-sm sm:text-base text-emerald-300';
        title.textContent = 'Jawaban Benar!';
      } else {
        if (card) card.className = 'w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#131C31] rounded-2xl border shadow-2xl border-rose-400/50';
        if (inner) inner.className = 'p-5 sm:p-6 bg-rose-500/10';
        ico.className = 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-rose-500 text-white font-black';
        ico.textContent = '✕';
        title.className = 'font-extrabold text-sm sm:text-base text-rose-300';
        title.textContent = isTimeout ? ('Waktu Habis! (Jawaban: ' + correctAns + ')') : ('Kurang Tepat (Jawaban: ' + correctAns + ')');
      }
      pts.textContent = '+' + earned + ' poin';
      exp.textContent = q.explanation || '';

      var vp = settings.gameplayMode === 'voyage' ? getVoyageProgressState(playerHistory.length, playDeck.length) : null;
      var willDock = Boolean(vp && vp.dockedIsland && visitedIslands.indexOf(vp.dockedIsland.islandNumber) === -1);
      nextBtn.textContent = willDock ? ('Berlabuh di ' + vp.dockedIsland.name) : ((currentQuestionIndex + 1 < playDeck.length) ? 'Lanjut Soal Berikutnya' : 'Lihat Hasil & Leaderboard');
    }

    function advanceAfterQuestion() {
      currentQuestionIndex++;
      if (currentQuestionIndex < playDeck.length) {
        loadQuestion();
        startQuestionTimer();
      } else {
        finishQuiz();
      }
    }

    function nextQuestion() {
      var vp = settings.gameplayMode === 'voyage' ? getVoyageProgressState(playerHistory.length, playDeck.length) : null;
      if (vp && vp.dockedIsland && visitedIslands.indexOf(vp.dockedIsland.islandNumber) === -1) {
        document.getElementById('feedback-box').classList.add('hidden');
        playIslandDockFx();
        openIslandMinigameModal(vp.dockedIsland);
        return;
      }
      advanceAfterQuestion();
    }

    function openIslandMinigameModal(island) {
      dockedIslandModal = island;
      clearInterval(helmAnimInterval);
      var ov = document.getElementById('modal-island-minigame');
      var sub = document.getElementById('island-minigame-sub');
      var ttl = document.getElementById('island-minigame-title');
      var desc = document.getElementById('island-minigame-desc');
      var body = document.getElementById('island-minigame-body');
      sub.textContent = 'Berlabuh di Pulau #' + island.islandNumber;
      ttl.textContent = island.name;
      ov.classList.remove('hidden');

      var kindIdx = island.islandIndex % 3;
      if (kindIdx === 0) {
        desc.textContent = isGamificationActive()
          ? 'Pilih 1 dari 3 peti harta karun kuno untuk memperoleh Buff atau Debuff!'
          : 'Pilih 1 dari 3 peti harta karun kuno untuk memperoleh bonus poin pelayaran!';
        body.innerHTML = '<div class="grid grid-cols-3 gap-2.5">' +
          [0, 1, 2].map(function(idx) {
            return '<button type="button" onclick="resolveIslandMinigameReward(80)" class="arcade-btn bg-[#0B1120] hover:bg-amber-400/15 border border-[#23304C] hover:border-amber-400 rounded-xl p-4 flex flex-col items-center gap-1.5 cursor-pointer">' +
              '<span class="text-2xl">🎁</span><span class="text-xs font-extrabold text-white">Peti #' + (idx + 1) + '</span></button>';
          }).join('') + '</div>';
      } else if (kindIdx === 1) {
        desc.textContent = 'Hentikan jarum kemudi di zona tengah yang tenang untuk hadiah maksimal!';
        body.innerHTML = '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-4 space-y-3">' +
          '<div class="relative h-6 rounded-full bg-slate-900 border border-[#23304C] overflow-hidden">' +
            '<div class="absolute inset-y-0 bg-emerald-400/30 border-x border-emerald-400/60" style="left:38%;width:24%"></div>' +
            '<div id="helm-needle-el" class="absolute inset-y-0 w-2 bg-amber-400 rounded-full" style="left:20%"></div>' +
          '</div>' +
          '<button type="button" onclick="stopHelmMinigame()" class="arcade-btn-amber w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-2.5 rounded-xl cursor-pointer">Tahan Kemudi Sekarang!</button>' +
        '</div>';
        var pos = 12, dir = 1;
        window._helmPos = 12;
        helmAnimInterval = setInterval(function() {
          pos += dir * 6;
          if (pos >= 92) { pos = 92; dir = -1; }
          if (pos <= 8) { pos = 8; dir = 1; }
          window._helmPos = pos;
          var n = document.getElementById('helm-needle-el');
          if (n) n.style.left = 'calc(' + pos + '% - 4px)';
        }, 48);
      } else {
        var dirs = ['Utara', 'Timur', 'Selatan', 'Barat'];
        var tgt = dirs[Math.floor(Math.random() * dirs.length)];
        window._compassTarget = tgt;
        desc.textContent = 'Bidik arah bintang penuntun (' + tgt + ') agar kapal melaju kencang!';
        body.innerHTML = '<div class="grid grid-cols-2 gap-2.5">' +
          dirs.map(function(d) {
            return '<button type="button" onclick="resolveCompassMinigame(\'' + d + '\')" class="arcade-btn bg-[#0B1120] hover:bg-sky-400/15 border border-[#23304C] hover:border-sky-400 rounded-xl p-3 text-xs font-extrabold text-white cursor-pointer">Arah ' + d + '</button>';
          }).join('') + '</div>';
      }
    }
    function stopHelmMinigame() {
      clearInterval(helmAnimInterval);
      var p = window._helmPos || 50;
      var inCenter = p >= 38 && p <= 62;
      resolveIslandMinigameReward(inCenter ? 120 : 60);
    }
    function resolveCompassMinigame(picked) {
      resolveIslandMinigameReward(picked === window._compassTarget ? 120 : 60);
    }
    function resolveIslandMinigameReward(bonusPts) {
      playChestRewardFx();
      var gamActive = isGamificationActive();
      var itemId = gamActive ? rollPowerup(null) : null;
      var spec = itemId ? POWERUPS[itemId] : null;
      var body = document.getElementById('island-minigame-body');
      window._pendingIslandReward = { powerupId: itemId, bonusPoints: bonusPts };
      body.innerHTML = '<div class="bg-emerald-500/10 border border-emerald-400/40 rounded-xl p-4 space-y-2">' +
        '<div class="text-xs font-bold uppercase text-emerald-300">Harta Karun Ditemukan!</div>' +
        '<div class="text-lg font-extrabold text-white">' + escapeHtml(spec ? spec.name : 'Harta Karun Ekspedisi') + '</div>' +
        '<p class="text-xs text-slate-300">' + escapeHtml(spec ? spec.desc : 'Ekspedisi pulau berhasil! Bonus poin langsung ditambahkan ke skor pelayaranmu.') + '</p>' +
        '<div class="font-mono-num text-sm font-extrabold text-amber-300">+' + bonusPts + ' Poin Pelayaran</div>' +
      '</div>' +
      '<button type="button" onclick="claimIslandMinigameReward()" class="arcade-btn-amber w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-3 rounded-xl cursor-pointer">Lanjutkan Berlayar</button>';
    }
    function claimIslandMinigameReward() {
      playPopClickFx();
      clearInterval(helmAnimInterval);
      var rew = window._pendingIslandReward || { powerupId: null, bonusPoints: 80 };
      var docked = dockedIslandModal;
      if (docked && visitedIslands.indexOf(docked.islandNumber) === -1) visitedIslands.push(docked.islandNumber);
      dockedIslandModal = null;
      document.getElementById('modal-island-minigame').classList.add('hidden');
      score += rew.bonusPoints;
      if (rew.powerupId && isGamificationActive()) {
        grantPowerupToSlot(rew.powerupId, 'Berlabuh di ' + (docked ? docked.name : 'Pulau'));
      } else {
        showToast('Berlabuh di ' + (docked ? docked.name : 'Pulau') + ': +' + rew.bonusPoints + ' poin ekspedisi!');
      }
      document.getElementById('current-score').textContent = String(score);
      advanceAfterQuestion();
    }

    function activatePowerup(slotIdx) {
      if (!isGamificationActive()) return;
      if (powerupUsedThisQuestion || isFrozen || questionFeedbackShown || preCountdownValue !== null) return;
      var id = powerupInventory[slotIdx];
      var q = playDeck[currentQuestionIndex];
      if (!id || !q) return;
      if (id === 'FIFTY_FIFTY' && q.type !== 'MC' && q.type !== 'MS') {
        showToast('Item 50:50 hanya bisa dipakai pada soal pilihan ganda!');
        return;
      }
      powerupInventory[slotIdx] = null;
      powerupUsedThisQuestion = true;
      playPowerupFx();
      renderPowerupSlots();

      if (id === 'DOUBLE_SCORE') {
        doubleScoreActive = true;
        renderPowerupSlots();
        showToast('Skor 2x aktif untuk soal ini!');
      } else if (id === 'FIFTY_FIFTY') {
        var corr = Array.isArray(q.answer) ? q.answer : [q.answer];
        var wrong = [];
        for (var i = 0; i < (q.options || []).length; i++) {
          if (corr.indexOf(i) === -1) wrong.push(i);
        }
        wrong.sort(function() { return Math.random() - 0.5; });
        eliminatedIndices = wrong.slice(0, 2);
        renderQuestionOptions();
        showToast('2 opsi jawaban yang salah telah dihapus!');
      } else if (id === 'SHIELD') {
        immuneQuestionsRemaining = Math.max(immuneQuestionsRemaining, 2);
        renderPowerupSlots();
        showToast('Perisai aktif! Kamu kebal terhadap Debuff lawan.');
      } else if (id === 'FREEZE_LEADER' || id === 'GLITCH_SHUFFLE' || id === 'TORNADO') {
        var freshOpp = filterFreshActivePlayers(activePlayers).filter(function(p) { return p.deviceId && p.deviceId !== myDeviceId; });
        var target = null;
        if (freshOpp.length > 0) {
          freshOpp.sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
          target = freshOpp[0];
        } else {
          var lbOpp = cloudLeaderboard.filter(function(p) { return p.deviceId && p.deviceId !== myDeviceId; });
          if (lbOpp.length > 0) {
            lbOpp.sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
            target = lbOpp[0];
          }
        }
        if (!target) {
          score += 100;
          document.getElementById('current-score').textContent = String(score);
          showToast('Belum ada lawan aktif — kamu mendapat +100 poin bonus!');
        } else {
          if (window.sendSabotageToCloud) {
            window.sendSabotageToCloud({
              targetDeviceId: target.deviceId, targetName: target.name,
              attackerDeviceId: myDeviceId, attackerName: playerName, type: id, createdAt: Date.now()
            });
          }
          showToast('Debuff ' + POWERUPS[id].name + ' dikirim ke ' + target.name + '!');
        }
      }
    }

    function triggerIncomingFreeze(attacker) {
      if (activeScreen !== 'quiz' || !isGamificationActive()) return;
      if (immuneQuestionsRemaining > 0) {
        showToast('Perisai menangkis serangan ' + (attacker || 'lawan') + '!');
        return;
      }
      immuneQuestionsRemaining = 1;
      isFrozen = true;
      clearInterval(timerInterval);
      clearInterval(freezeInterval);
      playFreezeFx();
      var ov = document.getElementById('freeze-overlay');
      ov.classList.remove('hidden');
      document.getElementById('freeze-attacker-info').textContent = (attacker || 'Pemain lain') + ' mengirim serangan es! Timer dijeda sementara hingga es mencair.';
      var left = 4;
      document.getElementById('freeze-countdown-text').textContent = 'Mencair dalam ' + left + ' detik...';
      renderPowerupSlots();
      renderQuestionOptions();
      freezeInterval = setInterval(function() {
        left--;
        document.getElementById('freeze-countdown-text').textContent = 'Mencair dalam ' + Math.max(0, left) + ' detik...';
        if (left <= 0) {
          clearInterval(freezeInterval);
          isFrozen = false;
          ov.classList.add('hidden');
          renderPowerupSlots();
          renderQuestionOptions();
          if (!questionFeedbackShown) startQuestionTimer();
        }
      }, 1000);
    }

    function triggerIncomingTornado(attacker) {
      if (activeScreen !== 'quiz' || !isGamificationActive()) return;
      if (immuneQuestionsRemaining > 0) {
        showToast('Perisai menangkis badai dari ' + (attacker || 'lawan') + '!');
        return;
      }
      immuneQuestionsRemaining = 1;
      playTornadoFx();
      clearInterval(tornadoInterval);
      tornadoCountdown = 5;
      tornadoAttackerName = attacker || 'Pemain lain';
      var q = playDeck[currentQuestionIndex];
      if (!questionFeedbackShown && q && (q.type === 'MC' || q.type === 'MS')) {
        currentOptionOrder = computeShuffledOrder((q.options || []).length, true);
        renderQuestionOptions();
      }
      var card = document.getElementById('quiz-card');
      var banner = document.getElementById('tornado-banner');
      var bText = document.getElementById('tornado-banner-text');
      var bBadge = document.getElementById('tornado-countdown-badge');
      if (card) card.classList.add('tornado-storm-active');
      if (banner) banner.classList.remove('hidden');
      if (bText) bText.textContent = 'Angin Puting Beliung dari ' + tornadoAttackerName + ' mengguncang layar & mengacak opsi!';
      if (bBadge) bBadge.textContent = '5d';
      showToast('Puting Beliung dari ' + tornadoAttackerName + ' menyerang 5 detik!');
      tornadoInterval = setInterval(function() {
        tornadoCountdown--;
        if (bBadge) bBadge.textContent = Math.max(0, tornadoCountdown) + 'd';
        if (tornadoCountdown <= 0) {
          clearInterval(tornadoInterval);
          if (card) card.classList.remove('tornado-storm-active');
          if (banner) banner.classList.add('hidden');
        }
      }, 1000);
    }

    // Keyboard shortcuts on Quiz screen
    window.addEventListener('keydown', function(e) {
      if (activeScreen !== 'quiz' || isFrozen || preCountdownValue !== null || dockedIslandModal) return;
      var t = e.target;
      var isTyping = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (questionFeedbackShown) {
        if (e.key === 'Enter') { e.preventDefault(); nextQuestion(); }
        return;
      }
      if (isTyping) return;
      var q = playDeck[currentQuestionIndex];
      if (!q) return;
      var keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      var k = String(e.key || '').toLowerCase();
      if (q.type === 'MC' || q.type === 'TF') {
        if (k in keyMap && keyMap[k] < currentOptionOrder.length) {
          var origIdx = currentOptionOrder[keyMap[k]];
          if (eliminatedIndices.indexOf(origIdx) === -1) {
            e.preventDefault();
            var btns = document.getElementById('options-container').querySelectorAll('button');
            for (var i = 0; i < btns.length; i++) {
              if (Number(btns[i].dataset.origIdx) === origIdx) { selectSingleAnswer(origIdx, btns[i]); break; }
            }
          }
        }
      } else if (q.type === 'MS') {
        if (k in keyMap && keyMap[k] < currentOptionOrder.length) {
          var mOrig = currentOptionOrder[keyMap[k]];
          if (eliminatedIndices.indexOf(mOrig) === -1) {
            e.preventDefault();
            playPopClickFx();
            toggleMultipleOption(mOrig);
          }
        } else if (e.key === 'Enter' && selectedMultipleIndices.length > 0) {
          e.preventDefault();
          submitComplexAnswer();
        }
      }
    });

    // ==================== LEADERBOARD & CONFETTI ====================
    function renderConfetti(active) {
      var box = document.getElementById('confetti-container');
      if (!box) return;
      if (!active) { box.classList.add('hidden'); box.innerHTML = ''; return; }
      var pieces = [
        ['6%', '0s', 'bg-amber-400', 'w-2 h-3'],
        ['14%', '0.25s', 'bg-emerald-400', 'w-2.5 h-2.5 rounded-full'],
        ['22%', '0.1s', 'bg-sky-400', 'w-2 h-3'],
        ['31%', '0.35s', 'bg-rose-400', 'w-2 h-2.5'],
        ['42%', '0.15s', 'bg-amber-300', 'w-2.5 h-2.5 rounded-full'],
        ['53%', '0.4s', 'bg-emerald-300', 'w-2 h-3'],
        ['64%', '0.08s', 'bg-fuchsia-400', 'w-2 h-2.5'],
        ['74%', '0.3s', 'bg-sky-300', 'w-2.5 h-2.5 rounded-full'],
        ['84%', '0.18s', 'bg-amber-400', 'w-2 h-3'],
        ['92%', '0.42s', 'bg-emerald-400', 'w-2 h-2.5']
      ];
      box.innerHTML = pieces.map(function(p) {
        return '<span class="absolute top-0 rounded-sm anim-confetti ' + p[2] + ' ' + p[3] + '" style="left:' + p[0] + ';animation-delay:' + p[1] + '"></span>';
      }).join('');
      box.classList.remove('hidden');
    }

    function finishQuiz() {
      clearInterval(timerInterval);
      clearInterval(globalTimerInterval);
      clearInterval(tornadoInterval);
      clearInterval(helmAnimInterval);
      playFinishFx();
      renderConfetti(true);
      if (!isAutostartDemo && window.unregisterActivePlayerCloud) window.unregisterActivePlayerCloud(myDeviceId);
      safeRemoveStorage(getInProgressKey());
      recoverableProgress = null;

      var resolvedTeam = getResolvedTeamName();
      var rec = {
        id: myDeviceId, deviceId: myDeviceId, name: playerName,
        teamName: resolvedTeam || undefined,
        score: score, correct: correctCount, totalQuestions: playDeck.length,
        history: playerHistory, completedAt: new Date().toISOString()
      };
      if (!isAutostartDemo) safeSetStorage(getCompletedRecordKey(), JSON.stringify(rec));
      mySavedRecord = rec;
      hasPlayedThisDevice = true;

      var idx = -1;
      for (var i = 0; i < cloudLeaderboard.length; i++) {
        if (cloudLeaderboard[i].deviceId === myDeviceId) { idx = i; break; }
      }
      if (idx >= 0) cloudLeaderboard[idx] = rec;
      else cloudLeaderboard.push(rec);

      showScreen('leaderboard');
      renderLeaderboardScreen();
      if (!isAutostartDemo && window.saveScoreToCloud) window.saveScoreToCloud(rec);
    }

    function showLeaderboardFromLobby() {
      renderConfetti(false);
      showScreen('leaderboard');
      renderLeaderboardScreen();
    }
    function backToLobbyFromLeaderboard() {
      renderConfetti(false);
      showScreen('lobby');
      updateLobbyUI();
    }
    function replayQuizFromLeaderboard() {
      renderConfetti(false);
      var nameToUse = (playerName || (mySavedRecord && mySavedRecord.name) || '').trim();
      if (nameToUse) {
        startGameplay(nameToUse, currentSessionMode, currentLiveRunId, isAutostartDemo, false);
      } else {
        showScreen('lobby');
        updateLobbyUI();
      }
    }
    function manualRefreshLeaderboard() {
      if (window.fetchCloudLeaderboardOnce) {
        window.fetchCloudLeaderboardOnce().then(function(list) {
          if (list) { cloudLeaderboard = list; renderLeaderboardScreen(); }
        });
      } else {
        renderLeaderboardScreen();
      }
    }

    function setReviewFilter(mode) {
      playPopClickFx();
      reviewFilter = mode;
      renderReviewSection();
    }

    function renderReviewSection() {
      var revSec = document.getElementById('review-section');
      var revList = document.getElementById('review-list');
      if (!mySavedRecord || !Array.isArray(mySavedRecord.history) || mySavedRecord.history.length === 0) {
        revSec.classList.add('hidden');
        return;
      }
      revSec.classList.remove('hidden');
      var hist = mySavedRecord.history;
      var wrongCount = hist.filter(function(h) { return !h.isCorrect; }).length;
      var btnAll = document.getElementById('btn-review-all');
      var btnWrong = document.getElementById('btn-review-wrong');
      btnAll.textContent = 'Semua (' + hist.length + ')';
      btnWrong.textContent = 'Salah Saja (' + wrongCount + ')';
      btnAll.className = 'px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (reviewFilter === 'all' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
      btnWrong.className = 'px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (reviewFilter === 'wrong' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:text-white');
      btnAll.setAttribute('aria-selected', reviewFilter === 'all' ? 'true' : 'false');
      btnWrong.setAttribute('aria-selected', reviewFilter === 'wrong' ? 'true' : 'false');

      var items = [];
      for (var i = 0; i < hist.length; i++) {
        if (reviewFilter === 'all' || !hist[i].isCorrect) items.push({ item: hist[i], idx: i });
      }
      if (items.length === 0) {
        revList.innerHTML = '<div class="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-5 text-center text-sm text-emerald-300 font-semibold">Sempurna! Tidak ada jawaban yang salah pada sesi ini.</div>';
        return;
      }
      revList.innerHTML = items.map(function(entry) {
        var h = entry.item; var idx = entry.idx;
        return '<div class="p-4 rounded-xl border ' + (h.isCorrect ? 'bg-emerald-500/5 border-emerald-400/30' : 'bg-rose-500/5 border-rose-400/30') + '">' +
          '<div class="flex items-center justify-between gap-2 text-xs mb-1.5">' +
            '<span class="font-bold ' + (h.isCorrect ? 'text-emerald-400' : 'text-rose-400') + '">Soal ' + (idx + 1) + ' · ' + (h.isCorrect ? 'Benar' : 'Salah') + '</span>' +
            '<span class="text-slate-400">' + escapeHtml(h.category) + '</span>' +
          '</div>' +
          '<p class="font-bold text-sm text-white mb-2">' + escapeHtml(h.question) + '</p>' +
          '<div class="text-xs space-y-1 mb-2">' +
            '<div class="' + (h.isCorrect ? 'text-emerald-300' : 'text-rose-300') + '"><strong>Jawabanmu:</strong> ' + escapeHtml(h.userAnswer) + '</div>' +
            (!h.isCorrect ? '<div class="text-emerald-300"><strong>Kunci Jawaban:</strong> ' + escapeHtml(h.correctAnswer) + '</div>' : '') +
          '</div>' +
          '<p class="text-xs text-slate-300 bg-[#0B1120] border border-[#23304C] p-2.5 rounded-lg">' + escapeHtml(h.explanation) + '</p>' +
        '</div>';
      }).join('');
    }

    function switchLeaderboardTab(tab) {
      playPopClickFx();
      lbStandingsTab = tab === 'team' ? 'team' : 'individual';
      renderLeaderboardScreen();
    }

    function openLiveLeaderboardModal() {
      document.getElementById('modal-live-leaderboard').classList.remove('hidden');
      renderLiveLeaderboardModal();
    }
    function closeLiveLeaderboardModal() {
      document.getElementById('modal-live-leaderboard').classList.add('hidden');
    }
    function switchLiveLbModalTab(tab) {
      playPopClickFx();
      liveLbModalTab = tab === 'team' ? 'team' : 'individual';
      renderLiveLeaderboardModal();
    }
    function renderLiveLeaderboardModal() {
      var modal = document.getElementById('modal-live-leaderboard');
      if (!modal || modal.classList.contains('hidden')) return;
      var indBtn = document.getElementById('live-lb-tab-ind');
      var teamBtn = document.getElementById('live-lb-tab-team');
      var body = document.getElementById('live-lb-modal-body');
      var merged = mergeLiveAndFinishedLeaderboard(cloudLeaderboard, activePlayers, playDeck.length || questions.length);
      var teams = aggregateTeamLeaderboard(merged);
      indBtn.textContent = 'Individu (' + merged.length + ')';
      teamBtn.textContent = 'Tim / Kru (' + teams.length + ')';
      indBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (liveLbModalTab === 'individual' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
      teamBtn.className = 'px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (liveLbModalTab === 'team' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
      if (liveLbModalTab === 'individual') {
        body.innerHTML = merged.length === 0
          ? '<div class="p-6 text-center text-xs text-slate-400">Belum ada peserta aktif maupun selesai.</div>'
          : merged.map(function(row, idx) {
              var isMe = row.deviceId === myDeviceId;
              return '<div class="flex items-center justify-between gap-2 px-4 py-2.5 text-xs ' + (isMe ? 'bg-amber-400/10' : '') + '">' +
                '<div class="flex items-center gap-2.5 min-w-0"><span class="font-mono-num font-bold text-slate-300 w-7">#' + (idx + 1) + '</span>' +
                '<div class="min-w-0"><div class="font-bold text-white truncate">' + escapeHtml(row.name) + (isMe ? ' <span class="text-amber-300">(Kamu)</span>' : '') + '</div>' +
                '<div class="text-[11px] text-slate-400">' + (row.teamName ? ('Tim ' + escapeHtml(row.teamName) + ' · ') : '') + (row.status === 'finished' ? 'Selesai' : ('Soal ' + row.currentQuestion + '/' + row.totalQuestions)) + '</div></div></div>' +
                '<span class="font-mono-num font-extrabold text-amber-400 shrink-0">' + row.score + '</span></div>';
            }).join('');
      } else {
        body.innerHTML = teams.length === 0
          ? '<div class="p-6 text-center text-xs text-slate-400">Belum ada tim atau peserta.</div>'
          : teams.map(function(t, idx) {
              return '<div class="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">' +
                '<div class="flex items-center gap-2.5 min-w-0"><span class="font-mono-num font-bold text-sky-300 w-7">#' + (idx + 1) + '</span>' +
                '<div class="min-w-0"><div class="font-bold text-white truncate">' + escapeHtml(t.teamName) + '</div>' +
                '<div class="text-[11px] text-slate-400 truncate">' + t.memberCount + ' anggota: ' + escapeHtml(t.members.join(', ')) + '</div></div></div>' +
                '<span class="font-mono-num font-extrabold text-amber-400 shrink-0">' + t.totalScore + '</span></div>';
            }).join('');
      }
    }

    function renderLeaderboardScreen() {
      var sorted = mergeLiveAndFinishedLeaderboard(cloudLeaderboard, activePlayers, playDeck.length || questions.length);
      var replayBtn = document.getElementById('btn-replay-quiz');
      if (replayBtn) {
        var canReplay = settings.allowReplay && (currentSessionMode === 'free' || currentSessionMode === 'live_started');
        replayBtn.classList.toggle('hidden', !canReplay);
      }

      var hasTeams = sorted.some(function(p) { return Boolean(p.teamName && String(p.teamName).trim()); });
      var tabsWrap = document.getElementById('lb-standings-tabs');
      var tInd = document.getElementById('lb-tab-individual');
      var tTeam = document.getElementById('lb-tab-team');
      var teams = aggregateTeamLeaderboard(sorted);
      if (tabsWrap) tabsWrap.classList.toggle('hidden', !hasTeams);
      if (tInd && tTeam) {
        tInd.textContent = 'Individu (' + sorted.length + ')';
        tTeam.textContent = 'Tim / Kru (' + teams.length + ')';
        tInd.className = 'px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ' + (lbStandingsTab === 'individual' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
        tTeam.className = 'px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ' + (lbStandingsTab === 'team' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
      }

      var sumBox = document.getElementById('lb-player-summary');
      if (mySavedRecord) {
        sumBox.classList.remove('hidden');
        document.getElementById('lb-my-name').innerHTML = escapeHtml(mySavedRecord.name) + (mySavedRecord.teamName ? (' <span class="text-xs font-bold text-sky-300">· Tim ' + escapeHtml(mySavedRecord.teamName) + '</span>') : '');
        document.getElementById('lb-my-correct').textContent = mySavedRecord.correct + '/' + (mySavedRecord.totalQuestions || playDeck.length || questions.length);
        document.getElementById('lb-my-score').textContent = String(mySavedRecord.score);
        var rankIdx = -1;
        for (var r = 0; r < sorted.length; r++) { if (sorted[r].deviceId === myDeviceId) { rankIdx = r; break; } }
        var rankEl = document.getElementById('lb-my-rank-info');
        if (rankIdx >= 0) {
          rankEl.classList.remove('hidden');
          rankEl.textContent = 'Peringkatmu saat ini: #' + (rankIdx + 1) + ' dari ' + sorted.length + ' peserta';
        } else {
          rankEl.classList.add('hidden');
        }
      } else {
        sumBox.classList.add('hidden');
      }

      var headEl = document.getElementById('leaderboard-table-head');
      var listEl = document.getElementById('leaderboard-list');
      if (hasTeams && lbStandingsTab === 'team') {
        if (headEl) headEl.innerHTML = '<div class="col-span-2 text-center">Rank</div><div class="col-span-5">Tim / Kru</div><div class="col-span-2 text-center">Anggota</div><div class="col-span-3 text-right">Total Skor</div>';
        listEl.innerHTML = teams.map(function(t, idx) {
          return '<div class="grid grid-cols-12 items-center px-4 py-3 text-sm">' +
            '<div class="col-span-2 text-center font-mono-num font-bold text-sky-300">#' + (idx + 1) + '</div>' +
            '<div class="col-span-5 truncate pr-2"><div class="font-bold text-white truncate">' + escapeHtml(t.teamName) + '</div><div class="text-[11px] text-slate-400 truncate">' + escapeHtml(t.members.join(', ')) + '</div></div>' +
            '<div class="col-span-2 text-center font-mono-num text-slate-300">' + t.memberCount + '</div>' +
            '<div class="col-span-3 text-right font-mono-num font-extrabold text-amber-400">' + t.totalScore + '</div></div>';
        }).join('');
      } else {
        if (headEl) headEl.innerHTML = '<div class="col-span-2 text-center">Rank</div><div class="col-span-5">Nama Pemain</div><div class="col-span-2 text-center">Benar</div><div class="col-span-3 text-right">Skor</div>';
        if (sorted.length === 0) {
          listEl.innerHTML = '<div class="p-8 text-center text-sm text-slate-400">Belum ada peserta yang bermain atau menyelesaikan kuis.</div>';
        } else {
          listEl.innerHTML = sorted.map(function(p, i) {
            var rank = i + 1;
            var isMe = p.deviceId === myDeviceId;
            var badge = rank === 1 ? '<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black">#1</span>' :
              rank === 2 ? '<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black">#2</span>' :
              rank === 3 ? '<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black">#3</span>' :
              '<span class="text-slate-300 font-bold">#' + rank + '</span>';
            var statusLbl = p.status === 'finished'
              ? '<span class="text-emerald-400">Selesai</span>'
              : '<span class="text-sky-300">Bermain · Soal ' + p.currentQuestion + '/' + p.totalQuestions + '</span>';
            return '<div class="grid grid-cols-12 items-center px-4 py-3 text-sm ' + (isMe ? 'bg-amber-400/10 font-bold' : '') + '">' +
              '<div class="col-span-2 flex justify-center font-mono-num">' + badge + '</div>' +
              '<div class="col-span-5 truncate pr-2 text-white"><div class="truncate">' + escapeHtml(p.name) + (isMe ? ' <span class="text-xs text-amber-300 font-semibold">(Kamu)</span>' : '') + '</div>' +
                '<div class="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold truncate">' +
                  (p.teamName ? ('<span class="text-sky-300">Tim ' + escapeHtml(p.teamName) + ' ·</span>') : '') +
                  '<span class="font-mono-num">' + statusLbl + '</span>' +
                '</div></div>' +
              '<div class="col-span-2 text-center font-mono-num text-emerald-400 font-semibold">' + (p.correct || 0) + '/' + (p.totalQuestions || questions.length) + '</div>' +
              '<div class="col-span-3 text-right font-mono-num font-extrabold text-amber-400">' + (p.score || 0) + '</div>' +
            '</div>';
          }).join('');
        }
      }
      renderReviewSection();
    }

    // ==================== ADMIN DASHBOARD (3 TABS ONLY) ====================
    function openAdminPinModal() {
      document.getElementById('admin-pin-input').value = '';
      document.getElementById('admin-pin-error').classList.add('hidden');
      document.getElementById('modal-admin-pin').classList.remove('hidden');
      setTimeout(function() { document.getElementById('admin-pin-input').focus(); }, 40);
    }
    function closeAdminPinModal() { document.getElementById('modal-admin-pin').classList.add('hidden'); }
    function verifyAdminPin() {
      var val = (document.getElementById('admin-pin-input').value || '').trim();
      var validPin = settings.adminPin || DEFAULT_QUIZ_SETTINGS.adminPin || '6767';
      if (val === validPin) {
        playPopClickFx();
        closeAdminPinModal();
        adminRoomConfirmed = false;
        var ri = document.getElementById('admin-room-input');
        if (ri) ri.value = activeRoomCode;
        showScreen('admin');
        switchAdminTab(adminTab);
        renderAdminSessionControls();
        renderAdminStats();
        renderAdminBankSoal();
      } else {
        playWrongFx();
        document.getElementById('admin-pin-error').classList.remove('hidden');
      }
    }
    function closeAdminDashboard() { roomGateUnlocked = true; showScreen('lobby'); updateLobbyUI(); }

    function switchAdminTab(tab) {
      playPopClickFx();
      adminTab = tab;
      var tabs = ['session', 'gamification', 'settings', 'stats', 'questions'];
      var activeCls = 'px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap bg-amber-400 text-slate-950';
      var idleCls = 'px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap text-slate-300 hover:text-white';
      for (var i = 0; i < tabs.length; i++) {
        var t = tabs[i];
        var btn = document.getElementById('admin-tab-' + t);
        var panel = document.getElementById('admin-panel-' + t);
        if (btn) {
          btn.className = t === tab ? activeCls : idleCls;
          btn.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        }
        if (panel) panel.classList.toggle('hidden', t !== tab);
      }
      if (tab === 'session') renderAdminSessionControls();
      else if (tab === 'gamification') renderAdminGamificationControls();
      else if (tab === 'settings') renderAdminSettingsControls();
      else if (tab === 'stats') renderAdminStats();
      else renderAdminBankSoal();
    }

    function updateAdminRoomStepUI() {
      var curDisplay = document.getElementById('admin-current-room-display');
      var statusPill = document.getElementById('admin-room-status-pill');
      var stepCard = document.getElementById('admin-room-step-card');
      var inp = document.getElementById('admin-room-input');
      var confirmBtn = document.getElementById('btn-confirm-room-step');
      var draftHint = document.getElementById('admin-room-draft-hint');
      var cleanDraft = sanitizeRoomCode(inp ? inp.value : activeRoomCode);

      if (curDisplay) curDisplay.textContent = activeRoomCode ? ('#' + activeRoomCode) : 'UMUM (Default)';
      if (statusPill) {
        statusPill.textContent = adminRoomConfirmed ? 'Ruang Terkonfirmasi' : 'Konfirmasi Ruang Dulu';
        statusPill.className = adminRoomConfirmed
          ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold'
          : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold';
      }
      if (stepCard) {
        stepCard.className = 'bg-[#0B1120] border rounded-xl p-5 ' + (adminRoomConfirmed ? 'border-emerald-500/35' : 'border-sky-400/50');
      }
      if (confirmBtn) {
        confirmBtn.textContent = cleanDraft !== activeRoomCode ? 'Buka & Konfirmasi Ruang' : 'Konfirmasi Ruang Ini';
      }
      if (draftHint) {
        if (cleanDraft !== activeRoomCode) {
          draftHint.textContent = '(Draf baru: ' + (cleanDraft ? ('#' + cleanDraft) : 'UMUM') + ' — belum diterapkan)';
          draftHint.classList.remove('hidden');
        } else {
          draftHint.classList.add('hidden');
        }
      }
    }

    function renderAdminSessionControls() {
      var flags = getSessionLockFlags();
      updateAdminRoomStepUI();

      var lockTag = document.getElementById('admin-mode-step-lock-tag');
      var lockBanner = document.getElementById('admin-mode-locked-banner');
      if (lockTag) lockTag.classList.toggle('hidden', adminRoomConfirmed);
      if (lockBanner) lockBanner.classList.toggle('hidden', adminRoomConfirmed);

      var btnFree = document.getElementById('btn-mode-free');
      var btnWait = document.getElementById('btn-mode-live-wait');
      var btnStart = document.getElementById('btn-mode-live-start');
      var btnReset = document.getElementById('btn-mode-reset');

      var freeDis = !adminRoomConfirmed || flags.isFreeLockedOut;
      btnFree.disabled = freeDis;
      btnFree.textContent = !adminRoomConfirmed ? 'Mode Bebas (Terkunci)' : (flags.isFreeLockedOut ? 'Mode Bebas (Terkunci)' : 'Mode Bebas');
      btnFree.className = 'px-4 py-2.5 rounded-lg text-xs font-bold border whitespace-nowrap ' +
        (freeDis ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed' :
        isFreeSessionMode(currentSessionMode) ? 'bg-emerald-400 text-slate-950 border-emerald-300 cursor-pointer' : 'bg-[#131C31] text-slate-200 border-[#23304C] cursor-pointer');

      var waitDis = !adminRoomConfirmed || flags.isLiveLockedOut;
      btnWait.disabled = waitDis;
      btnWait.textContent = !adminRoomConfirmed ? 'Mode Live (Terkunci)' : (flags.isLiveLockedOut ? 'Mode Live (Terkunci)' : 'Mode Live');
      btnWait.className = 'px-4 py-2.5 rounded-lg text-xs font-bold border whitespace-nowrap ' +
        (waitDis ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed' :
        isLiveSessionMode(currentSessionMode) ? 'bg-amber-400 text-slate-950 border-amber-300 cursor-pointer' : 'bg-[#131C31] text-slate-200 border-[#23304C] cursor-pointer');

      var startDis = !adminRoomConfirmed || (currentSessionMode !== 'free_waiting' && currentSessionMode !== 'live_waiting');
      btnStart.disabled = startDis;
      btnStart.textContent = currentSessionMode === 'free_waiting'
        ? 'Mulai Mode Bebas'
        : currentSessionMode === 'live_waiting'
          ? 'Mulai Live Sekarang'
          : (currentSessionMode === 'free' || currentSessionMode === 'live_started')
            ? 'Kuis Sedang Berjalan'
            : 'Mulai Kuis Sekarang';
      btnStart.className = 'px-4 py-2.5 rounded-lg text-xs font-extrabold whitespace-nowrap ' +
        (startDis ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer');

      if (btnReset) {
        btnReset.disabled = !adminRoomConfirmed;
        btnReset.className = 'px-4 py-2.5 rounded-lg text-xs font-bold border whitespace-nowrap ' +
          (!adminRoomConfirmed ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed' : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 cursor-pointer');
      }

      var banner = document.getElementById('admin-session-status-banner');
      if (currentSessionMode === 'unconfigured') banner.innerHTML = 'Status: <strong class="text-amber-300">Menunggu Admin</strong> — Pilih <strong>Mode Bebas</strong> atau <strong>Mode Live</strong> terlebih dahulu.';
      else if (currentSessionMode === 'free_waiting') banner.innerHTML = 'Status: <strong class="text-emerald-300">Mode Bebas Siap (Menunggu Start)</strong> — ' + waitingPlayers.length + ' peserta standby. Kamu masih bebas mengubah pengaturan atau ganti ke Mode Live sebelum menekan <strong>Mulai Mode Bebas</strong>.';
      else if (currentSessionMode === 'free') banner.innerHTML = 'Status: <strong class="text-emerald-400">Mode Bebas Berlangsung</strong> — ' + flags.freshActiveCount + ' peserta sedang bermain, ' + cloudLeaderboard.length + ' peserta selesai.';
      else if (currentSessionMode === 'live_waiting') banner.innerHTML = 'Status: <strong class="text-amber-300">Mode Live Siap (Ruang Tunggu Dibuka)</strong> — ' + waitingPlayers.length + ' peserta standby. Kamu masih bisa beralih ke Mode Bebas sebelum menekan <strong>Mulai Live Sekarang</strong>.';
      else banner.innerHTML = 'Status: <strong class="text-rose-400">Live Berlangsung</strong> — ' + flags.freshActiveCount + ' peserta aktif bermain.';

      // Live Monitor
      var fresh = filterFreshActivePlayers(activePlayers).sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
      document.getElementById('admin-active-count-title').textContent = 'Pantau Live: Sedang Mengerjakan (' + fresh.length + ')';
      var activeBox = document.getElementById('admin-active-players-list');
      if (fresh.length === 0) {
        activeBox.innerHTML = '<p class="text-xs text-slate-500">Belum ada peserta yang sedang aktif menjawab kuis saat ini.</p>';
      } else {
        activeBox.innerHTML = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">' +
          fresh.map(function(ap) {
            return '<div class="bg-[#131C31] border border-[#23304C] rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs">' +
              '<div class="min-w-0"><div class="font-bold text-white truncate">' + escapeHtml(ap.name) + (ap.teamName ? (' <span class="text-sky-300">(' + escapeHtml(ap.teamName) + ')</span>') : '') + '</div><div class="text-[11px] text-slate-400 font-mono-num">Soal ' + (ap.currentQuestion || 1) + '/' + (ap.totalQuestions || questions.length) + '</div></div>' +
              '<div class="font-mono-num font-extrabold text-amber-400 shrink-0">' + (ap.score || 0) + '</div>' +
            '</div>';
          }).join('') + '</div>';
      }

      renderAdminLiveLeaderboard();

      // Waiting list summary in Kontrol Sesi
      var wTitle = document.getElementById('admin-waiting-title');
      if (wTitle) wTitle.textContent = 'Peserta Standby di Ruang Tunggu (' + waitingPlayers.length + ')';
      var wModeBadge = document.getElementById('admin-waiting-mode-badge');
      if (wModeBadge) {
        wModeBadge.textContent = isFreeSessionMode(currentSessionMode) ? 'Standby Mode Bebas' : isLiveSessionMode(currentSessionMode) ? 'Standby Live' : 'Standby';
      }
      var wBox = document.getElementById('admin-waiting-list');
      if (wBox) {
        wBox.innerHTML = waitingPlayers.length === 0
          ? '<span class="text-xs text-slate-500">Belum ada peserta standby di ruang tunggu.</span>'
          : waitingPlayers.map(function(p) { return '<span class="px-2.5 py-1 rounded-md bg-[#131C31] border border-[#23304C] text-xs text-slate-200 font-semibold">' + escapeHtml(p.name) + (p.teamName ? (' · ' + escapeHtml(p.teamName)) : '') + '</span>'; }).join('');
      }

      renderAdminGamificationControls();
      renderAdminSettingsControls();
    }

    function renderAdminGamificationControls() {
      var gamActive = isGamificationActive();
      var gm = settings.gameplayMode || 'classic';
      var pm = settings.participationMode || 'either';
      var effectiveCount = (Number(settings.questionLimit) > 0 && Number(settings.questionLimit) < questions.length) ? Number(settings.questionLimit) : questions.length;
      var islandCount = buildVoyageCheckpoints(effectiveCount).length;

      var swBtn = document.getElementById('setting-gamification-enabled');
      var swBadge = document.getElementById('admin-gamification-status-badge');
      var swDesc = document.getElementById('admin-gamification-status-desc');
      var swTrack = document.getElementById('admin-gamification-switch-track');
      var swText = document.getElementById('admin-gamification-switch-text');
      if (swBtn) {
        swBtn.setAttribute('aria-checked', gamActive ? 'true' : 'false');
        swBtn.className = 'arcade-btn px-4 py-2.5 rounded-lg text-xs font-extrabold border inline-flex items-center gap-2.5 cursor-pointer shrink-0 whitespace-nowrap ' +
          (gamActive ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-300' : 'bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]');
      }
      if (swBadge) {
        swBadge.textContent = gamActive ? 'Aktif' : 'Nonaktif';
        swBadge.className = 'px-2 py-0.5 rounded-md text-[11px] font-extrabold border ' +
          (gamActive ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400');
      }
      if (swDesc) {
        swDesc.textContent = gamActive
          ? 'Pemain mendapatkan Streak kombo, Buff (Skor 2x, 50:50, Perisai), serta Debuff serangan lawan (Bekukan #1, Acak Opsi, Puting Beliung) saat kuis berlangsung.'
          : 'Mode kuis murni tanpa item Buff, Debuff, sabotase lawan, maupun pelacak Streak. Skor murni dihitung dari ketepatan jawaban dan kecepatan.';
      }
      if (swTrack) {
        swTrack.className = 'w-8 h-4 rounded-full p-0.5 transition-colors inline-flex items-center ' + (gamActive ? 'bg-slate-950/30 justify-end' : 'bg-slate-700 justify-start');
      }
      if (swText) swText.textContent = gamActive ? 'Gamifikasi ON' : 'Gamifikasi OFF';

      var islandBadge = document.getElementById('admin-voyage-island-badge');
      if (islandBadge) islandBadge.textContent = islandCount + ' Pulau (' + effectiveCount + ' soal ÷ 5)';
      var gmNote = document.getElementById('admin-gameplay-gamification-note');
      if (gmNote) {
        gmNote.textContent = gamActive
          ? 'Pada mode Berlayar Harta Karun, setiap 5 soal kapal berlayar 3 langkah dan berlabuh di pulau minigame untuk meraih Buff atau Debuff.'
          : 'Mode Berlayar Harta Karun tetap menampilkan peta pelayaran & pulau minigame, namun hadiah hanya berupa bonus poin tanpa Buff/Debuff.';
      }
      var btnGmC = document.getElementById('btn-gameplay-classic');
      var btnGmV = document.getElementById('btn-gameplay-voyage');
      if (btnGmC && btnGmV) {
        btnGmC.className = 'px-3.5 py-2.5 rounded-lg text-xs font-bold border cursor-pointer ' + (gm === 'classic' ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-[#131C31] text-slate-300 border-[#23304C]');
        btnGmV.className = 'px-3.5 py-2.5 rounded-lg text-xs font-bold border cursor-pointer ' + (gm === 'voyage' ? 'bg-sky-400 text-slate-950 border-sky-300' : 'bg-[#131C31] text-slate-300 border-[#23304C]');
      }
      var isVoy = gm === 'voyage';
      var partCard = document.getElementById('admin-part-card');
      var partNote = document.getElementById('admin-part-scope-note');
      var partDesc = document.getElementById('admin-part-desc');
      if (partCard) partCard.className = 'bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3 transition-opacity ' + (isVoy ? 'opacity-100' : 'opacity-65');
      if (partNote) partNote.textContent = isVoy ? 'Aktif di Berlayar' : 'Khusus Mode Berlayar';
      if (partDesc) {
        partDesc.textContent = isVoy
          ? 'Atur apakah pelaut boleh memilih bermain Solo atau Tim / Kru di halaman beranda.'
          : 'Saat memakai Kuis Klasik, seluruh peserta otomatis bermain individu dan pilihan Solo / Tim disembunyikan dari beranda.';
      }
      ['either', 'solo', 'team'].forEach(function(pKey) {
        var b = document.getElementById('btn-part-mode-' + pKey);
        if (b) {
          b.disabled = !isVoy;
          b.className = 'px-3 py-2.5 rounded-lg text-xs font-bold border ' +
            (!isVoy
              ? 'cursor-not-allowed opacity-60 bg-[#131C31] text-slate-400 border-[#23304C]'
              : (pm === pKey ? 'cursor-pointer bg-emerald-400 text-slate-950 border-emerald-300' : 'cursor-pointer bg-[#131C31] text-slate-300 border-[#23304C]'));
        }
      });

      var confList = getConfiguredPowerups();
      var streakOn = !(settings && settings.streakEnabled === false);
      var msOn = !(settings && settings.milestoneDropsEnabled === false);
      var hasDebuffs = confList.some(function(id) { return POWERUPS[id] && POWERUPS[id].kind === 'debuff'; });

      var catTitle = document.getElementById('admin-gamification-catalog-title');
      if (catTitle) catTitle.textContent = 'Pilih Fitur Buff & Debuff (' + confList.length + '/' + ALL_POWERUP_IDS.length + ' Aktif)';
      var streakRule = document.getElementById('admin-gamification-streak-rule');
      var debuffRule = document.getElementById('admin-gamification-debuff-rule');
      var stTarget = getStreakRewardTarget(effectiveCount);
      var dbMs = getDebuffMilestones(effectiveCount);
      if (streakRule) streakRule.textContent = 'Streak: ' + (streakOn ? (stTarget + ' benar') : 'OFF');
      if (debuffRule) debuffRule.textContent = 'Drop Debuff: ' + (msOn && hasDebuffs && dbMs.length ? ('#' + dbMs.join(', #')) : 'Nonaktif');

      var mechRow = document.getElementById('admin-gamification-mechanics-row');
      if (mechRow) mechRow.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity ' + (gamActive ? 'opacity-100' : 'opacity-50');
      var stBtn = document.getElementById('setting-streak-enabled');
      var stTitle = document.getElementById('setting-streak-title');
      var stBadge = document.getElementById('setting-streak-badge');
      if (stTitle) stTitle.textContent = 'Hadiah Streak Benar (' + stTarget + 'x)';
      if (stBtn) {
        stBtn.disabled = !gamActive;
        stBtn.setAttribute('aria-checked', streakOn ? 'true' : 'false');
        stBtn.className = 'p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ' +
          (!gamActive ? 'cursor-not-allowed bg-[#131C31] border-[#23304C]' : streakOn ? 'cursor-pointer bg-amber-400/10 border-amber-400/35' : 'cursor-pointer bg-[#131C31] border-[#23304C]');
      }
      if (stBadge) {
        stBadge.textContent = streakOn ? 'ON' : 'OFF';
        stBadge.className = 'px-2 py-0.5 rounded text-[11px] font-mono-num font-extrabold shrink-0 ' + (streakOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400');
      }
      var msBtn = document.getElementById('setting-milestone-drops-enabled');
      var msDesc = document.getElementById('setting-milestone-desc');
      var msBadge = document.getElementById('setting-milestone-badge');
      if (msDesc) msDesc.textContent = hasDebuffs ? 'Beri Debuff acak di tengah kuis agar persaingan seru.' : 'Aktifkan minimal 1 item Debuff di bawah agar drop berjalan.';
      if (msBtn) {
        msBtn.disabled = !gamActive;
        msBtn.setAttribute('aria-checked', msOn ? 'true' : 'false');
        msBtn.className = 'p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ' +
          (!gamActive ? 'cursor-not-allowed bg-[#131C31] border-[#23304C]' : msOn ? 'cursor-pointer bg-sky-400/10 border-sky-400/35' : 'cursor-pointer bg-[#131C31] border-[#23304C]');
      }
      if (msBadge) {
        msBadge.textContent = msOn ? 'ON' : 'OFF';
        msBadge.className = 'px-2 py-0.5 rounded text-[11px] font-mono-num font-extrabold shrink-0 ' + (msOn && hasDebuffs ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400');
      }

      var presetMap = {
        all: ALL_POWERUP_IDS,
        buffs: ['DOUBLE_SCORE', 'FIFTY_FIFTY', 'SHIELD'],
        double: ['DOUBLE_SCORE'],
        none: []
      };
      var presetsWrap = document.getElementById('admin-gamification-presets');
      if (presetsWrap) {
        var pBtns = presetsWrap.querySelectorAll('[data-preset]');
        for (var pi = 0; pi < pBtns.length; pi++) {
          var pKey = pBtns[pi].getAttribute('data-preset');
          var targetArr = presetMap[pKey] || [];
          var isMatch = confList.length === targetArr.length && targetArr.every(function(x) { return confList.indexOf(x) !== -1; });
          pBtns[pi].disabled = !gamActive;
          pBtns[pi].className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ' +
            (!gamActive ? 'cursor-not-allowed opacity-50 bg-[#131C31] text-slate-400 border-[#23304C]' : isMatch ? 'cursor-pointer bg-amber-400 text-slate-950 border-amber-300' : 'cursor-pointer bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]');
        }
      }

      var catGrid = document.getElementById('admin-gamification-catalog-grid');
      if (catGrid) {
        catGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 transition-opacity ' + (gamActive ? 'opacity-100' : 'opacity-50');
        catGrid.innerHTML = ALL_POWERUP_IDS.map(function(key) {
          var item = POWERUPS[key];
          var isBuff = item.kind === 'buff';
          var isItemOn = confList.indexOf(key) !== -1;
          var cardCls = !gamActive
            ? 'cursor-not-allowed bg-[#131C31] border-[#23304C]'
            : isItemOn
              ? (isBuff ? 'cursor-pointer bg-[#131C31] border-emerald-400/50 hover:border-emerald-300' : 'cursor-pointer bg-[#131C31] border-sky-400/50 hover:border-sky-300')
              : 'cursor-pointer bg-[#0B1120] border-[#23304C] opacity-60 hover:opacity-85';
          return '<button type="button" ' + (!gamActive ? 'disabled ' : '') + 'aria-pressed="' + (isItemOn ? 'true' : 'false') + '" onclick="adminTogglePowerupItem(\'' + key + '\')" class="rounded-xl p-3.5 border text-left flex items-start justify-between gap-2.5 transition-all ' + cardCls + '">' +
            '<div class="flex items-start gap-3 min-w-0">' +
              '<div class="w-8 h-8 rounded-lg bg-[#0B1120] border border-[#23304C] flex items-center justify-center shrink-0">' + getPowerupSvgHtml(key) + '</div>' +
              '<div class="min-w-0">' +
                '<div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-bold text-white"><span>' + escapeHtml(item.name) + '</span><span class="text-slate-500">·</span><span class="' + (isBuff ? 'text-emerald-400' : 'text-sky-400') + '">' + (isBuff ? 'Buff' : 'Debuff') + '</span></div>' +
                '<p class="text-[11px] text-slate-400 mt-1 leading-snug">' + escapeHtml(item.desc) + '</p>' +
              '</div>' +
            '</div>' +
            '<span class="px-2 py-0.5 rounded text-[10px] font-mono-num font-extrabold shrink-0 ' + (isItemOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400') + '">' + (isItemOn ? 'ON' : 'OFF') + '</span>' +
          '</button>';
        }).join('');
      }
    }

    function adminTogglePowerupItem(id) {
      if (!isGamificationActive()) return;
      playPopClickFx();
      var cur = getConfiguredPowerups();
      var nextList;
      if (cur.indexOf(id) !== -1) {
        nextList = cur.filter(function(x) { return x !== id; });
      } else {
        nextList = ALL_POWERUP_IDS.filter(function(x) { return x === id || cur.indexOf(x) !== -1; });
      }
      saveAndSyncSettings(Object.assign({}, settings, { enabledPowerups: nextList }));
      renderAdminGamificationControls();
      renderAdminSettingsControls();
      showToast(nextList.indexOf(id) !== -1 ? (POWERUPS[id].name + ' dinyalakan.') : (POWERUPS[id].name + ' dimatikan.'));
    }

    function adminApplyPowerupPreset(preset) {
      if (!isGamificationActive()) return;
      playPopClickFx();
      var list = ALL_POWERUP_IDS.slice();
      var msg = 'Semua 6 item Buff & Debuff diaktifkan.';
      if (preset === 'buffs') {
        list = ['DOUBLE_SCORE', 'FIFTY_FIFTY', 'SHIELD'];
        msg = 'Hanya item Buff (Skor 2x, 50:50, Perisai) yang diaktifkan.';
      } else if (preset === 'double') {
        list = ['DOUBLE_SCORE'];
        msg = 'Hanya Buff Skor 2x yang dinyalakan.';
      } else if (preset === 'none') {
        list = [];
        msg = 'Semua item Buff & Debuff dimatikan.';
      }
      saveAndSyncSettings(Object.assign({}, settings, { enabledPowerups: list }));
      renderAdminGamificationControls();
      renderAdminSettingsControls();
      showToast(msg);
    }

    function adminToggleGamificationMechanic(key) {
      if (!isGamificationActive()) return;
      playPopClickFx();
      var curVal = !(settings && settings[key] === false);
      var patch = {};
      patch[key] = !curVal;
      saveAndSyncSettings(Object.assign({}, settings, patch));
      renderAdminGamificationControls();
      showToast(key === 'streakEnabled'
        ? (!curVal ? 'Hadiah Streak jawaban benar diaktifkan.' : 'Hadiah Streak jawaban benar dimatikan.')
        : (!curVal ? 'Drop Debuff otomatis diaktifkan.' : 'Drop Debuff otomatis dimatikan.'));
    }

    function renderAdminSettingsControls() {
      var durMins = Number(settings.quizDurationMinutes) || 0;
      var effectiveCount = (Number(settings.questionLimit) > 0 && Number(settings.questionLimit) < questions.length) ? Number(settings.questionLimit) : questions.length;
      var islandCount = buildVoyageCheckpoints(effectiveCount).length;

      var timerBadge = document.getElementById('admin-timer-mode-badge');
      if (timerBadge) timerBadge.textContent = durMins > 0 ? (durMins + ' Menit Global') : 'Per-Soal';
      var durInp = document.getElementById('setting-quiz-duration');
      if (durInp) durInp.value = String(durMins);
      var liveLbChk = document.getElementById('setting-show-live-lb');
      if (liveLbChk) liveLbChk.checked = Boolean(settings.showLiveLeaderboardToPlayers);

      var replayChk = document.getElementById('setting-allow-replay');
      if (replayChk) replayChk.checked = Boolean(settings.allowReplay);
      var shufQChk = document.getElementById('setting-shuffle-questions');
      if (shufQChk) shufQChk.checked = Boolean(settings.shuffleQuestions);
      var shufOChk = document.getElementById('setting-shuffle-options');
      if (shufOChk) shufOChk.checked = Boolean(settings.shuffleOptions);
      var compChk = document.getElementById('setting-compact-mode');
      if (compChk) compChk.checked = Boolean(settings.compactMode);
      var qLimInp = document.getElementById('setting-question-limit');
      if (qLimInp) qLimInp.value = String(settings.questionLimit || 0);
      var limHint = document.getElementById('setting-limit-hint');
      if (limHint) limHint.textContent = 'Isi 0 untuk memakai semua (' + questions.length + ') soal.';
      var pinInp = document.getElementById('admin-change-pin-input');
      if (pinInp) pinInp.value = settings.adminPin || '6767';

      var sumRoom = document.getElementById('admin-summary-room');
      var sumGam = document.getElementById('admin-summary-gamification');
      var sumPlay = document.getElementById('admin-summary-gameplay');
      var sumTimer = document.getElementById('admin-summary-timer');
      var sumDisp = document.getElementById('admin-summary-display');
      if (sumRoom) sumRoom.textContent = activeRoomCode ? ('#' + activeRoomCode) : 'UMUM';
      if (sumGam) {
        var gActive = isGamificationActive();
        var gCount = getEnabledPowerups().length;
        sumGam.textContent = gActive ? ('Aktif (' + gCount + '/' + ALL_POWERUP_IDS.length + ' item)') : 'Nonaktif';
        sumGam.className = 'font-mono-num font-bold ' + (gActive ? 'text-emerald-400' : 'text-slate-400');
      }
      if (sumPlay) sumPlay.textContent = settings.gameplayMode === 'voyage' ? ('Berlayar (' + islandCount + ' Pulau)') : 'Kuis Klasik';
      if (sumTimer) sumTimer.textContent = durMins > 0 ? ('Global ' + durMins + ' Menit') : 'Per-Soal';
      if (sumDisp) sumDisp.textContent = effectiveCount + ' Soal · ' + (settings.compactMode ? 'Ringkas' : 'Normal');
    }

    function adminToggleGamification() {
      playPopClickFx();
      var nextVal = !isGamificationActive();
      var next = Object.assign({}, settings, { gamificationEnabled: nextVal });
      saveAndSyncSettings(next);
      renderAdminGamificationControls();
      renderAdminSettingsControls();
      showToast(nextVal ? 'Fitur Gamifikasi (Buff, Debuff & Streak) diaktifkan!' : 'Fitur Gamifikasi dimatikan (mode kuis murni).');
    }

    function switchAdminLbTab(tab) {
      playPopClickFx();
      adminLbTab = tab === 'team' ? 'team' : 'individual';
      renderAdminLiveLeaderboard();
    }
    function renderAdminLiveLeaderboard() {
      var listEl = document.getElementById('admin-live-lb-list');
      var indBtn = document.getElementById('admin-lb-tab-ind');
      var teamBtn = document.getElementById('admin-lb-tab-team');
      if (!listEl) return;
      var merged = mergeLiveAndFinishedLeaderboard(cloudLeaderboard, activePlayers, questions.length);
      var teams = aggregateTeamLeaderboard(merged);
      if (indBtn && teamBtn) {
        indBtn.textContent = 'Individu (' + merged.length + ')';
        teamBtn.textContent = 'Tim (' + teams.length + ')';
        indBtn.className = 'px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ' + (adminLbTab === 'individual' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
        teamBtn.className = 'px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ' + (adminLbTab === 'team' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white');
      }
      if (adminLbTab === 'individual') {
        listEl.innerHTML = merged.length === 0
          ? '<p class="text-xs text-slate-500 py-4 text-center">Belum ada data skor live maupun selesai.</p>'
          : merged.map(function(r, i) {
              return '<div class="flex items-center justify-between gap-2 bg-[#131C31] border border-[#23304C] rounded-lg px-3 py-1.5 text-xs">' +
                '<div class="min-w-0 flex items-center gap-2"><span class="font-mono-num font-bold text-slate-300">#' + (i + 1) + '</span>' +
                '<span class="font-bold text-white truncate">' + escapeHtml(r.name) + '</span>' +
                (r.teamName ? ('<span class="text-[10px] text-sky-300 truncate">(' + escapeHtml(r.teamName) + ')</span>') : '') + '</div>' +
                '<div class="flex items-center gap-2 shrink-0"><span class="text-[10px] ' + (r.status === 'finished' ? 'text-emerald-400' : 'text-amber-300') + '">' + (r.status === 'finished' ? 'Selesai' : ('Soal ' + r.currentQuestion)) + '</span><span class="font-mono-num font-extrabold text-amber-400">' + r.score + '</span></div></div>';
            }).join('');
      } else {
        listEl.innerHTML = teams.length === 0
          ? '<p class="text-xs text-slate-500 py-4 text-center">Belum ada data tim.</p>'
          : teams.map(function(t, i) {
              return '<div class="flex items-center justify-between gap-2 bg-[#131C31] border border-[#23304C] rounded-lg px-3 py-1.5 text-xs">' +
                '<div class="min-w-0"><div class="font-bold text-white truncate">#' + (i + 1) + ' · ' + escapeHtml(t.teamName) + '</div>' +
                '<div class="text-[10px] text-slate-400 truncate">' + t.memberCount + ' anggota</div></div>' +
                '<span class="font-mono-num font-extrabold text-amber-400 shrink-0">' + t.totalScore + '</span></div>';
            }).join('');
      }
    }

    function saveAndSyncSettings(next) {
      settings = next;
      safeSetStorage(getSettingsKey(), JSON.stringify(next));
      if (window.saveQuizSettingsToCloud) window.saveQuizSettingsToCloud(next);
      updateLobbyUI();
    }
    function adminToggleSetting(key, checked) {
      playPopClickFx();
      var next = Object.assign({}, settings);
      next[key] = Boolean(checked);
      saveAndSyncSettings(next);
    }
    function adminSetGameplayMode(mode) {
      playPopClickFx();
      var next = Object.assign({}, settings, { gameplayMode: mode === 'voyage' ? 'voyage' : 'classic' });
      saveAndSyncSettings(next);
      showToast(next.gameplayMode === 'voyage' ? 'Mode Berlayar Harta Karun diaktifkan!' : 'Mode Kuis Klasik diaktifkan!');
    }
    function adminSetParticipationMode(mode) {
      playPopClickFx();
      var next = Object.assign({}, settings, { participationMode: mode });
      saveAndSyncSettings(next);
      showToast('Mode kepesertaan diatur ke: ' + mode.toUpperCase());
    }
    function adminSetDurationMinutes(mins) {
      playPopClickFx();
      var clean = Math.max(0, Math.min(180, Math.floor(Number(mins) || 0)));
      var inp = document.getElementById('setting-quiz-duration');
      if (inp) inp.value = String(clean);
      var next = Object.assign({}, settings, { quizDurationMinutes: clean });
      saveAndSyncSettings(next);
      showToast(clean > 0 ? ('Timer kuis global diatur ke ' + clean + ' menit!') : 'Timer kembali ke mode Per-Soal.');
    }
    function adminApplyDurationCustom() {
      var val = document.getElementById('setting-quiz-duration').value;
      adminSetDurationMinutes(val);
    }
    function adminApplyQuestionLimit() {
      playPopClickFx();
      var val = Math.max(0, Math.floor(Number(document.getElementById('setting-question-limit').value) || 0));
      document.getElementById('setting-question-limit').value = String(val);
      var next = Object.assign({}, settings, { questionLimit: val });
      saveAndSyncSettings(next);
      showToast('Batas jumlah soal disimpan.');
    }
    function onAdminRoomInputChange() {
      updateAdminRoomStepUI();
    }
    function generateAdminRoomCode() {
      playPopClickFx();
      var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      var suffix = '';
      for (var i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
      var generated = sanitizeRoomCode('RUANG-' + suffix);
      var inp = document.getElementById('admin-room-input');
      if (inp) inp.value = generated;
      updateAdminRoomStepUI();
      showToast('Kode acak #' + generated + ' dibuat — ubah bila perlu, lalu klik Konfirmasi Ruang.');
    }
    function adminConfirmRoomStep() {
      playPopClickFx();
      var inp = document.getElementById('admin-room-input');
      var raw = inp ? inp.value : '';
      var clean = sanitizeRoomCode(raw);
      if (inp) inp.value = clean;
      adminRoomConfirmed = true;
      if (clean !== activeRoomCode) {
        switchRoomScope(clean);
      } else {
        renderAdminSessionControls();
      }
      showToast(clean ? ('Ruang #' + clean + ' dikonfirmasi! Sekarang kamu bisa mengatur Mode Pelaksanaan.') : 'Ruang Utama (Umum) dikonfirmasi! Sekarang kamu bisa mengatur Mode Pelaksanaan.');
    }
    function adminCopyRoomLink() {
      playPopClickFx();
      var clean = sanitizeRoomCode(document.getElementById('admin-room-input').value);
      try {
        var u = new URL(window.location.href);
        if (clean) u.searchParams.set('room', clean); else u.searchParams.delete('room');
        navigator.clipboard.writeText(u.toString()).then(function() { showToast('Tautan undangan ruangan berhasil disalin!'); });
      } catch (e) { showToast('Gunakan parameter ?room=KODE di URL.'); }
    }
    function adminSaveNewPin() {
      playPopClickFx();
      var val = (document.getElementById('admin-change-pin-input').value || '').trim();
      if (val.length < 4 || val.length > 10) { showToast('PIN Admin harus 4–10 karakter.'); return; }
      var next = Object.assign({}, settings, { adminPin: val });
      saveAndSyncSettings(next);
      showToast('PIN Admin berhasil diperbarui & disimpan ke Cloud!');
    }

    function adminSetSessionMode(newMode) {
      playPopClickFx();
      if (!adminRoomConfirmed) { showToast('Konfirmasi Kode Ruangan di Langkah 1 terlebih dahulu.'); return; }
      var flags = getSessionLockFlags();
      if (isFreeSessionMode(newMode) && flags.isFreeLockedOut) { showToast('Mode Bebas terkunci karena sesi Live sudah berjalan!'); return; }
      if (isLiveSessionMode(newMode) && flags.isLiveLockedOut) { showToast('Mode Live terkunci karena sudah ada peserta mengerjakan di Mode Bebas!'); return; }
      if (newMode === 'live_started') currentLiveRunId = 'LIVE-' + Date.now();
      else if (newMode === 'free') currentLiveRunId = 'FREE-' + Date.now();
      currentSessionMode = newMode;
      if (window.saveSessionStateToCloud) window.saveSessionStateToCloud({ mode: newMode, runId: currentLiveRunId, updatedAt: Date.now() });
      updateLobbyUI();
      var msgs = {
        free_waiting: 'Mode Bebas dipilih! Atur konfigurasi lalu klik Mulai Mode Bebas agar peserta dapat bermain.',
        free: 'Mode Bebas DIMULAI! Seluruh peserta kini dapat mengerjakan kuis.',
        live_waiting: 'Mode Live dipilih! Ruang tunggu dibuka — klik Mulai Live Sekarang untuk memulai serentak.',
        live_started: 'Kuis Live DIMULAI serentak!'
      };
      showToast(msgs[newMode] || 'Mode diperbarui.');
    }
    function adminStartConfiguredMode() {
      if (currentSessionMode === 'free_waiting') adminSetSessionMode('free');
      else if (currentSessionMode === 'live_waiting') adminSetSessionMode('live_started');
    }
    function adminResetSessionMode() {
      playPopClickFx();
      if (!adminRoomConfirmed) { showToast('Konfirmasi Kode Ruangan di Langkah 1 terlebih dahulu.'); return; }
      currentSessionMode = 'unconfigured';
      currentLiveRunId = 'reset-' + Date.now();
      if (window.saveSessionStateToCloud) window.saveSessionStateToCloud({ mode: 'unconfigured', runId: currentLiveRunId, updatedAt: Date.now() });
      if (window.clearActiveSessionPlayersCloud) window.clearActiveSessionPlayersCloud();
      updateLobbyUI();
      showToast('Mode sesi dikembalikan ke Menunggu Admin.');
    }

    function openConfirmActionModal(title, desc, cb) {
      pendingConfirmCallback = cb;
      document.getElementById('confirm-action-title').textContent = title;
      document.getElementById('confirm-action-desc').textContent = desc;
      document.getElementById('modal-confirm-action').classList.remove('hidden');
    }
    function closeConfirmActionModal() {
      pendingConfirmCallback = null;
      document.getElementById('modal-confirm-action').classList.add('hidden');
    }
    function executeConfirmAction() {
      var cb = pendingConfirmCallback;
      closeConfirmActionModal();
      if (cb) cb();
    }

    function askResetDefaultQuestions() {
      playPopClickFx();
      openConfirmActionModal('Muat Ulang 30 Soal Default?', 'Bank soal saat ini akan diganti dengan 30 soal bawaan.', function() {
        syncQuestionsToStorageAndCloud(DEFAULT_QUESTIONS_DATA.slice());
        showToast('30 soal default berhasil dimuat ulang!');
      });
    }

    function renderAdminStats() {
      var sorted = cloudLeaderboard.slice().sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
      document.getElementById('admin-tab-stats').textContent = 'Statistik & Peserta (' + sorted.length + ')';
      var total = sorted.length;
      document.getElementById('stat-total-players').textContent = String(total);
      if (total === 0) {
        document.getElementById('stat-avg-score').textContent = '0';
        document.getElementById('stat-max-score').textContent = '0';
        document.getElementById('stat-avg-correct').textContent = '0%';
      } else {
        var sum = sorted.reduce(function(a, p) { return a + (p.score || 0); }, 0);
        var mx = Math.max.apply(null, sorted.map(function(p) { return p.score || 0; }));
        var avgPct = Math.round(sorted.reduce(function(a, p) { return a + ((p.correct || 0) / (p.totalQuestions || questions.length || 1)) * 100; }, 0) / total);
        document.getElementById('stat-avg-score').textContent = String(Math.round(sum / total));
        document.getElementById('stat-max-score').textContent = String(mx);
        document.getElementById('stat-avg-correct').textContent = avgPct + '%';
      }

      var qStatsEl = document.getElementById('admin-question-stats');
      qStatsEl.innerHTML = questions.map(function(q, idx) {
        var ansCount = 0; var corrCount = 0;
        for (var i = 0; i < sorted.length; i++) {
          var hist = sorted[i].history;
          if (!Array.isArray(hist)) continue;
          var match = hist.filter(function(h) { return (q.id && h.questionId === q.id) || h.question === q.question; })[0] || hist[idx];
          if (match) { ansCount++; if (match.isCorrect) corrCount++; }
        }
        var pct = ansCount > 0 ? Math.round((corrCount / ansCount) * 100) : 0;
        return '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3">' +
          '<div class="flex justify-between text-xs font-semibold mb-1"><span class="text-slate-300">Soal ' + (idx + 1) + ' · ' + escapeHtml(q.category) + '</span><span class="font-mono-num text-emerald-400">' + pct + '% (' + corrCount + '/' + ansCount + ')</span></div>' +
          '<p class="text-xs text-slate-400 truncate mb-2">' + escapeHtml(q.question) + '</p>' +
          '<div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div class="bg-emerald-400 h-full" style="width:' + pct + '%"></div></div>' +
        '</div>';
      }).join('');

      var tbody = document.getElementById('admin-participants-tbody');
      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400 text-xs">Belum ada data peserta.</td></tr>';
      } else {
        tbody.innerHTML = sorted.map(function(p, idx) {
          var tStr = p.completedAt ? new Date(p.completedAt).toLocaleString('id-ID') : '-';
          return '<tr class="hover:bg-slate-800/30">' +
            '<td class="py-3 px-4 font-mono-num font-bold">#' + (idx + 1) + '</td>' +
            '<td class="py-3 px-4 font-bold text-white">' + escapeHtml(p.name) + '</td>' +
            '<td class="py-3 px-4 text-center font-mono-num text-emerald-400 font-bold">' + (p.correct || 0) + '/' + (p.totalQuestions || questions.length) + '</td>' +
            '<td class="py-3 px-4 text-right font-mono-num font-extrabold text-amber-400">' + (p.score || 0) + '</td>' +
            '<td class="py-3 px-4 text-xs text-slate-400">' + escapeHtml(tStr) + '</td>' +
            '<td class="py-3 px-4 text-center"><div class="inline-flex items-center gap-1.5">' +
              '<button type="button" onclick="openPlayerDetail(\'' + escapeHtml(p.deviceId || p.id) + '\')" class="bg-[#131C31] hover:bg-slate-800 text-sky-300 border border-[#23304C] text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">Detail</button>' +
              '<button type="button" onclick="askDeleteParticipant(\'' + escapeHtml(p.deviceId || p.id) + '\')" class="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">Hapus</button>' +
            '</div></td>' +
          '</tr>';
        }).join('');
      }
    }

    function openPlayerDetail(devId) {
      var p = cloudLeaderboard.filter(function(item) { return (item.deviceId || item.id) === devId; })[0];
      if (!p) return;
      document.getElementById('detail-player-name').textContent = p.name;
      document.getElementById('detail-player-meta').textContent = 'ID: ' + (p.deviceId || '-') + ' · Selesai: ' + (p.completedAt ? new Date(p.completedAt).toLocaleString('id-ID') : '-');
      var hist = Array.isArray(p.history) ? p.history : [];
      var totalDur = 0; var fastIdx = null; var fastTime = Infinity;
      for (var i = 0; i < hist.length; i++) {
        if (typeof hist[i].timeTaken === 'number') {
          totalDur += hist[i].timeTaken;
          if (hist[i].timeTaken < fastTime) { fastTime = hist[i].timeTaken; fastIdx = i + 1; }
        }
      }
      document.getElementById('detail-metrics-grid').innerHTML =
        '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3"><div class="text-[11px] text-slate-400 font-sans">Skor</div><div class="text-lg font-extrabold text-amber-400">' + (p.score || 0) + '</div></div>' +
        '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3"><div class="text-[11px] text-slate-400 font-sans">Akurasi</div><div class="text-lg font-extrabold text-emerald-400">' + (p.correct || 0) + '/' + (p.totalQuestions || questions.length) + '</div></div>' +
        '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3"><div class="text-[11px] text-slate-400 font-sans">Tercepat</div><div class="text-sm font-extrabold text-sky-400 mt-0.5">' + (fastIdx ? ('Soal #' + fastIdx + ' (' + fastTime + 'd)') : '-') + '</div></div>' +
        '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3"><div class="text-[11px] text-slate-400 font-sans">Total Waktu</div><div class="text-lg font-extrabold text-slate-200">' + (totalDur > 0 ? (totalDur + 'd') : '-') + '</div></div>';

      document.getElementById('detail-history-list').innerHTML = hist.map(function(h, idx) {
        return '<div class="p-3 rounded-xl border text-xs ' + (h.isCorrect ? 'bg-emerald-500/5 border-emerald-400/30' : 'bg-rose-500/5 border-rose-400/30') + '">' +
          '<div class="flex justify-between font-bold mb-1"><span class="' + (h.isCorrect ? 'text-emerald-300' : 'text-rose-300') + '">Soal #' + (idx + 1) + ' · ' + (h.isCorrect ? 'BENAR' : 'SALAH') + '</span><span class="font-mono-num text-slate-300">' + h.timeTaken + 'd · +' + h.pointsEarned + '</span></div>' +
          '<p class="font-semibold text-white mb-1">' + escapeHtml(h.question) + '</p>' +
          '<div class="text-slate-300">Jawaban: <strong>' + escapeHtml(h.userAnswer) + '</strong>' + (!h.isCorrect ? (' <span class="text-emerald-300 ml-2">(Kunci: ' + escapeHtml(h.correctAnswer) + ')</span>') : '') + '</div>' +
        '</div>';
      }).join('');
      document.getElementById('modal-player-detail').classList.remove('hidden');
    }
    function closePlayerDetailModal() { document.getElementById('modal-player-detail').classList.add('hidden'); }

    function askDeleteParticipant(devId) {
      var p = cloudLeaderboard.filter(function(item) { return (item.deviceId || item.id) === devId; })[0];
      if (!p) return;
      openConfirmActionModal('Hapus Peserta Ini?', 'Skor milik ' + p.name + ' (' + p.score + ' poin) akan dihapus dan perangkatnya diizinkan bermain lagi.', function() {
        cloudLeaderboard = cloudLeaderboard.filter(function(item) { return (item.deviceId || item.id) !== devId; });
        if (devId === myDeviceId) {
          safeRemoveStorage(getCompletedRecordKey());
          if (!activeRoomCode) safeRemoveStorage('quiz_completed_record_' + myDeviceId);
          mySavedRecord = null;
          hasPlayedThisDevice = false;
        }
        if (window.deleteSingleParticipantFromCloud) window.deleteSingleParticipantFromCloud(devId);
        renderAdminStats();
        updateLobbyUI();
        showToast('Data & kunci perangkat untuk ' + p.name + ' berhasil dihapus.');
      });
    }

    function askResetAllParticipants() {
      openConfirmActionModal('Reset Semua Data Peserta?', 'Seluruh skor di Leaderboard akan dihapus sehingga peserta dapat bermain kembali dari awal.', function() {
        safeRemoveStorage(getCompletedRecordKey());
        if (!activeRoomCode) safeRemoveStorage('quiz_completed_record_' + myDeviceId);
        mySavedRecord = null;
        hasPlayedThisDevice = false;
        cloudLeaderboard = [];
        if (window.resetCloudLeaderboard) window.resetCloudLeaderboard();
        renderAdminStats();
        updateLobbyUI();
        showToast('Seluruh skor peserta & kunci perangkat berhasil direset.');
      });
    }

    // ==================== BANK SOAL, CRUD & CSV/JSON IMPORT ====================
    function renderAdminBankSoal() {
      document.getElementById('admin-tab-questions').textContent = 'Bank Soal (' + questions.length + ')';
      document.getElementById('admin-bank-title').textContent = 'Kelola Bank Soal (' + questions.length + ' Soal)';

      var cats = getDynamicCategoryStats(questions);
      var catSel = document.getElementById('admin-q-cat-filter');
      var prevCat = catSel.value || 'ALL';
      catSel.innerHTML = '<option value="ALL">Semua Kategori (' + questions.length + ')</option>' +
        cats.map(function(c) { return '<option value="' + escapeHtml(c.key) + '">' + escapeHtml(c.label) + ' (' + c.count + ')</option>'; }).join('');
      catSel.value = cats.some(function(c) { return c.key === prevCat; }) ? prevCat : 'ALL';

      var query = (document.getElementById('admin-q-search').value || '').trim().toLowerCase();
      var catFilter = catSel.value || 'ALL';
      var typeFilter = document.getElementById('admin-q-type-filter').value || 'ALL';

      var matched = [];
      for (var i = 0; i < questions.length; i++) {
        var q = questions[i];
        if (catFilter !== 'ALL' && q.category !== catFilter) continue;
        if (typeFilter !== 'ALL' && q.type !== typeFilter) continue;
        if (query) {
          var hay = (q.question + ' ' + q.category + ' ' + (q.explanation || '')).toLowerCase();
          if (hay.indexOf(query) === -1) continue;
        }
        matched.push({ q: q, idx: i });
      }

      var listEl = document.getElementById('admin-questions-list');
      if (matched.length === 0) {
        listEl.innerHTML = '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-6 text-center text-xs text-slate-400">Tidak ada soal yang cocok dengan pencarian/filter saat ini.</div>';
        return;
      }
      listEl.innerHTML = matched.map(function(entry) {
        var q = entry.q; var idx = entry.idx;
        return '<div class="bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
          '<div class="min-w-0">' +
            '<div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1">' +
              '<span class="font-mono-num font-bold text-white">#' + (idx + 1) + '</span><span>·</span>' +
              '<span class="text-amber-300 font-semibold">' + escapeHtml(q.category) + '</span><span>·</span>' +
              '<span class="font-mono-num">' + q.type + ' (' + (q.time || 25) + 'd)</span>' +
              (q.imageUrl ? '<span>·</span><span class="text-sky-400 font-semibold">Bergambar</span>' : '') +
            '</div>' +
            '<p class="text-xs sm:text-sm font-semibold text-slate-100">' + escapeHtml(q.question) + '</p>' +
          '</div>' +
          '<div class="flex items-center gap-2 shrink-0">' +
            '<button type="button" onclick="playPopClickFx(); openCrudModal(' + idx + ')" class="bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">Edit</button>' +
            '<button type="button" onclick="playPopClickFx(); askDeleteQuestion(' + idx + ')" class="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer">Hapus</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function syncQuestionsToStorageAndCloud(nextList) {
      questions = nextList;
      safeSetStorage(getCustomQuestionsKey(), JSON.stringify(nextList));
      if (window.saveQuestionsToCloud) window.saveQuestionsToCloud(nextList);
      renderAdminBankSoal();
      updateLobbyUI();
    }

    function toggleCrudCustomCategory() {
      var val = document.getElementById('crud-category').value;
      document.getElementById('crud-custom-cat-wrap').classList.toggle('hidden', val !== '__CUSTOM__');
    }
    function toggleCrudTypeFields() {
      var tp = document.getElementById('crud-type').value;
      document.getElementById('crud-options-wrapper').classList.toggle('hidden', tp !== 'MC' && tp !== 'MS');
      document.getElementById('crud-answer-mc-wrap').classList.toggle('hidden', tp !== 'MC');
      document.getElementById('crud-answer-tf-wrap').classList.toggle('hidden', tp !== 'TF');
      document.getElementById('crud-answer-ms-wrap').classList.toggle('hidden', tp !== 'MS');
      document.getElementById('crud-answer-text-wrap').classList.toggle('hidden', tp !== 'TEXT');
    }

    function openCrudModal(editIdx) {
      document.getElementById('crud-edit-index').value = String(editIdx);
      document.getElementById('crud-modal-title').textContent = editIdx >= 0 ? ('Edit Soal #' + (editIdx + 1)) : 'Tambah Soal Baru';
      document.getElementById('crud-error').classList.add('hidden');

      var cats = getDynamicCategoryStats(questions);
      var catSel = document.getElementById('crud-category');
      catSel.innerHTML = cats.map(function(c) { return '<option value="' + escapeHtml(c.key) + '">' + escapeHtml(c.label) + '</option>'; }).join('') +
        '<option value="__CUSTOM__">+ Kategori Baru...</option>';

      if (editIdx >= 0 && questions[editIdx]) {
        var q = questions[editIdx];
        if (cats.some(function(c) { return c.key === q.category; })) {
          catSel.value = q.category;
          document.getElementById('crud-custom-category').value = '';
        } else {
          catSel.value = '__CUSTOM__';
          document.getElementById('crud-custom-category').value = q.category || '';
        }
        document.getElementById('crud-type').value = q.type;
        document.getElementById('crud-time').value = String(q.time || 25);
        document.getElementById('crud-question').value = q.question || '';
        document.getElementById('crud-image-url').value = q.imageUrl || '';
        document.getElementById('crud-explanation').value = q.explanation || '';
        for (var i = 0; i < 4; i++) document.getElementById('crud-opt-' + i).value = (q.options && q.options[i]) || '';
        document.getElementById('crud-answer-mc').value = String(q.type === 'MC' ? (q.answer || 0) : 0);
        document.getElementById('crud-answer-tf').value = String(q.type === 'TF' ? (q.answer || 0) : 0);
        var chks = document.querySelectorAll('.crud-ms-chk');
        for (var k = 0; k < chks.length; k++) chks[k].checked = q.type === 'MS' && Array.isArray(q.answer) && q.answer.indexOf(Number(chks[k].value)) !== -1;
        document.getElementById('crud-answer-text').value = q.type === 'TEXT' ? (q.acceptedAnswers || []).join(', ') : '';
      } else {
        catSel.value = cats[0] ? cats[0].key : '__CUSTOM__';
        document.getElementById('crud-custom-category').value = '';
        document.getElementById('crud-type').value = 'MC';
        document.getElementById('crud-time').value = '25';
        document.getElementById('crud-question').value = '';
        document.getElementById('crud-image-url').value = '';
        document.getElementById('crud-explanation').value = '';
        for (var j = 0; j < 4; j++) document.getElementById('crud-opt-' + j).value = '';
        document.getElementById('crud-answer-mc').value = '0';
        document.getElementById('crud-answer-tf').value = '0';
        var chks2 = document.querySelectorAll('.crud-ms-chk');
        for (var m = 0; m < chks2.length; m++) chks2[m].checked = false;
        document.getElementById('crud-answer-text').value = '';
      }
      toggleCrudCustomCategory();
      toggleCrudTypeFields();
      document.getElementById('modal-admin-crud').classList.remove('hidden');
    }
    function closeCrudModal() { document.getElementById('modal-admin-crud').classList.add('hidden'); }

    function saveCrudQuestion() {
      var editIdx = Number(document.getElementById('crud-edit-index').value);
      var qText = (document.getElementById('crud-question').value || '').trim();
      var errEl = document.getElementById('crud-error');
      function fail(m) { errEl.textContent = m; errEl.classList.remove('hidden'); }
      if (!qText) return fail('Teks pertanyaan wajib diisi.');

      var catVal = document.getElementById('crud-category').value;
      var resolvedCat = catVal === '__CUSTOM__' ? (document.getElementById('crud-custom-category').value || '').trim() : catVal.trim();
      if (!resolvedCat) return fail('Nama kategori baru wajib diisi.');

      var rawImg = (document.getElementById('crud-image-url').value || '').trim();
      var cleanImg = sanitizeImageUrl(rawImg);
      if (rawImg && !cleanImg) return fail('URL gambar harus diawali https://, http://, atau /');

      var tp = document.getElementById('crud-type').value;
      var timeVal = Math.max(10, Math.min(120, Number(document.getElementById('crud-time').value) || 25));
      var expText = (document.getElementById('crud-explanation').value || '').trim() || 'Jawaban sesuai kunci yang ditetapkan admin.';

      var entry = {
        id: (editIdx >= 0 && questions[editIdx] && questions[editIdx].id) ? questions[editIdx].id : ('custom-' + Date.now()),
        category: resolvedCat, type: tp, time: timeVal, question: qText, explanation: expText
      };
      if (cleanImg) entry.imageUrl = cleanImg;

      if (tp === 'MC') {
        var opts = [0, 1, 2, 3].map(function(i) { return (document.getElementById('crud-opt-' + i).value || '').trim(); });
        if (opts.some(function(o) { return !o; })) return fail('Keempat opsi jawaban A–D wajib diisi.');
        entry.options = opts;
        entry.answer = Number(document.getElementById('crud-answer-mc').value) || 0;
      } else if (tp === 'TF') {
        entry.options = ['Benar (True)', 'Salah (False)'];
        entry.answer = Number(document.getElementById('crud-answer-tf').value) || 0;
      } else if (tp === 'MS') {
        var msOpts = [0, 1, 2, 3].map(function(i) { return (document.getElementById('crud-opt-' + i).value || '').trim(); });
        var chks = document.querySelectorAll('.crud-ms-chk');
        var msAns = [];
        for (var i = 0; i < chks.length; i++) { if (chks[i].checked) msAns.push(Number(chks[i].value)); }
        if (msOpts.some(function(o) { return !o; }) || msAns.length === 0) return fail('Isi semua opsi A–D dan pilih minimal 1 jawaban benar.');
        entry.options = msOpts;
        entry.answer = msAns.sort(function(a, b) { return a - b; });
      } else {
        var acc = (document.getElementById('crud-answer-text').value || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        if (acc.length === 0) return fail('Masukkan minimal 1 kata kunci jawaban.');
        entry.acceptedAnswers = acc;
      }

      var next = questions.slice();
      if (editIdx >= 0) next[editIdx] = entry;
      else next.push(entry);
      syncQuestionsToStorageAndCloud(next);
      closeCrudModal();
      showToast(editIdx >= 0 ? ('Soal #' + (editIdx + 1) + ' diperbarui!') : 'Soal baru berhasil ditambahkan!');
    }

    function askDeleteQuestion(idx) {
      if (questions.length <= 1) { showToast('Minimal harus tersisa 1 soal di dalam kuis!'); return; }
      openConfirmActionModal('Hapus Soal #' + (idx + 1) + '?', questions[idx] ? questions[idx].question : '', function() {
        var next = questions.filter(function(_, i) { return i !== idx; });
        syncQuestionsToStorageAndCloud(next);
        showToast('Soal berhasil dihapus.');
      });
    }

    // ==================== CSV / TSV / JSON IMPORTER & EXPORTER ====================
    function detectCsvDelimiter(rawText) {
      var line = rawText.replace(/^\uFEFF/, '').split(/\r?\n/).filter(function(l) { return l.trim().length > 0; })[0] || '';
      var inQ = false, tabs = 0, semis = 0, commas = 0;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') inQ = !inQ;
        else if (!inQ) {
          if (ch === '\t') tabs++;
          else if (ch === ';') semis++;
          else if (ch === ',') commas++;
        }
      }
      if (tabs > 0 && tabs >= commas && tabs >= semis) return '\t';
      if (semis > 0 && semis >= commas) return ';';
      return ',';
    }
    function parseTabularRows(rawText) {
      var clean = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      var delimiter = detectCsvDelimiter(clean);
      var rows = [], row = [], cell = '', inQ = false;
      for (var i = 0; i < clean.length; i++) {
        var ch = clean[i], nx = clean[i + 1];
        if (inQ) {
          if (ch === '"' && nx === '"') { cell += '"'; i++; }
          else if (ch === '"') inQ = false;
          else cell += ch;
        } else {
          if (ch === '"') inQ = true;
          else if (ch === delimiter) { row.push(cell.trim()); cell = ''; }
          else if (ch === '\n') {
            row.push(cell.trim());
            if (row.some(function(c) { return c.length > 0; })) rows.push(row);
            row = []; cell = '';
          } else cell += ch;
        }
      }
      row.push(cell.trim());
      if (row.some(function(c) { return c.length > 0; })) rows.push(row);
      return { delimiter: delimiter, rows: rows };
    }
    function normQType(raw) {
      var v = String(raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
      if (!v || v === 'MC' || v === 'PG' || v === 'PILIHAN GANDA' || v === 'MULTIPLE CHOICE') return 'MC';
      if (v === 'TF' || v === 'BS' || v === 'BENAR SALAH' || v === 'BENAR/SALAH' || v === 'TRUE FALSE' || v === 'TRUE/FALSE' || v === 'TRUE OR FALSE') return 'TF';
      if (v === 'MS' || v === 'PGK' || v === 'PILIH BEBERAPA' || v === 'MULTIPLE SELECT' || v === 'CHECKBOX') return 'MS';
      if (v === 'TEXT' || v === 'ISIAN' || v === 'ISIAN SINGKAT' || v === 'ESSAY' || v === 'JAWABAN SINGKAT') return 'TEXT';
      return null;
    }
    function parseQuestionsImportClient(rawText) {
      var trimmed = String(rawText || '').trim();
      if (!trimmed) return { questions: [], errors: [], format: 'csv' };
      if (trimmed[0] === '[' || trimmed[0] === '{') {
        try {
          var p = JSON.parse(trimmed);
          var arr = Array.isArray(p) ? p : (Array.isArray(p.items) ? p.items : (Array.isArray(p.questions) ? p.questions : null));
          if (!arr) return { questions: [], errors: [{ rowNumber: 1, message: 'Format JSON harus berupa array soal ([...]).' }], format: 'json' };
          var jq = [], je = [];
          arr.forEach(function(item, i) {
            var qTxt = typeof item.question === 'string' ? item.question.trim() : '';
            var qTp = normQType(item.type || 'MC');
            if (!qTxt || !qTp) { je.push({ rowNumber: i + 1, message: 'Pertanyaan atau tipe soal JSON tidak valid.' }); return; }
            var ent = {
              id: item.id || ('imp-' + Date.now() + '-' + i),
              category: (item.category || 'Wawasan Nusantara').trim(),
              type: qTp,
              time: Math.max(10, Math.min(120, Math.round(Number(item.time) || 25))),
              question: qTxt,
              explanation: (item.explanation || 'Jawaban sesuai kunci yang ditetapkan admin.').trim()
            };
            var img = sanitizeImageUrl(item.imageUrl || item.gambar || '');
            if (img) ent.imageUrl = img;
            if (qTp === 'TEXT') {
              ent.acceptedAnswers = Array.isArray(item.acceptedAnswers) ? item.acceptedAnswers.map(function(s) { return String(s).trim(); }).filter(Boolean) : [];
              if (ent.acceptedAnswers.length === 0) { je.push({ rowNumber: i + 1, message: 'Soal TEXT wajib memiliki acceptedAnswers.' }); return; }
            } else {
              ent.options = Array.isArray(item.options) ? item.options.map(function(s) { return String(s).trim(); }).filter(Boolean) : ['Benar (True)', 'Salah (False)'];
              ent.answer = qTp === 'MS' ? (Array.isArray(item.answer) ? item.answer.map(Number) : [0]) : (Number(item.answer) || 0);
            }
            jq.push(ent);
          });
          return { questions: jq, errors: je, format: 'json' };
        } catch (e) {
          return { questions: [], errors: [{ rowNumber: 1, message: 'JSON tidak valid.' }], format: 'json' };
        }
      }

      var tab = parseTabularRows(trimmed);
      var fmt = tab.delimiter === '\t' ? 'tsv' : tab.delimiter === ';' ? 'semicolon-csv' : 'csv';
      if (tab.rows.length === 0) return { questions: [], errors: [], format: fmt };
      var firstKeys = tab.rows[0].map(function(h) { return h.trim().toLowerCase().replace(/[\s-]+/g, '_'); });
      var headerHits = ['pertanyaan', 'question', 'soal', 'kategori', 'category', 'jawaban', 'kunci', 'answer', 'opsi_a'];
      var hasHeader = firstKeys.some(function(k) { return headerHits.indexOf(k) !== -1; });
      function fc(aliases, fb) {
        if (!hasHeader) return fb;
        for (var i = 0; i < firstKeys.length; i++) { if (aliases.indexOf(firstKeys[i]) !== -1) return i; }
        return -1;
      }
      var cols = {
        cat: fc(['kategori', 'category'], 0), tp: fc(['tipe', 'type', 'jenis', 'format'], 1),
        tm: fc(['waktu', 'time', 'durasi', 'detik'], 2), q: fc(['pertanyaan', 'question', 'soal', 'teks_pertanyaan'], 3),
        a: fc(['opsi_a', 'opsi1', 'pilihan_a', 'a', 'option_a'], 4), b: fc(['opsi_b', 'opsi2', 'pilihan_b', 'b', 'option_b'], 5),
        c: fc(['opsi_c', 'opsi3', 'pilihan_c', 'c', 'option_c'], 6), d: fc(['opsi_d', 'opsi4', 'pilihan_d', 'd', 'option_d'], 7),
        ans: fc(['jawaban', 'kunci', 'kunci_jawaban', 'answer', 'correct'], 8),
        exp: fc(['pembahasan', 'penjelasan', 'explanation', 'keterangan'], 9),
        img: fc(['gambar', 'image', 'image_url', 'url_gambar', 'foto'], 10)
      };

      var outQ = [], outE = [], lMap = { A: 0, B: 1, C: 2, D: 3 };
      function resChoice(tok, opts) {
        var u = tok.trim().toUpperCase();
        if (!u) return null;
        if (u in lMap && lMap[u] < opts.length) return lMap[u];
        if (/^[1-4]$/.test(u)) { var n = Number(u) - 1; if (n < opts.length) return n; }
        for (var i = 0; i < opts.length; i++) { if (opts[i].toLowerCase() === tok.trim().toLowerCase()) return i; }
        return null;
      }
      for (var r = (hasHeader ? 1 : 0); r < tab.rows.length; r++) {
        var row = tab.rows[r], rn = r + 1;
        function g(idx) { return (idx >= 0 && idx < row.length) ? row[idx].trim() : ''; }
        var qt = g(cols.q);
        if (!qt) { outE.push({ rowNumber: rn, message: 'Teks pertanyaan kosong.' }); continue; }
        var pt = normQType(g(cols.tp));
        if (!pt) { outE.push({ rowNumber: rn, message: 'Tipe soal tidak dikenali.' }); continue; }
        var cat = g(cols.cat) || 'Wawasan Nusantara';
        var tmRaw = Number(g(cols.tm));
        var tm = (isFinite(tmRaw) && tmRaw > 0) ? Math.max(10, Math.min(120, Math.round(tmRaw))) : 25;
        var exp = g(cols.exp) || 'Jawaban sesuai kunci yang ditetapkan admin.';
        var imgUrl = sanitizeImageUrl(g(cols.img));
        var rAns = g(cols.ans);
        var oA = g(cols.a), oB = g(cols.b), oC = g(cols.c), oD = g(cols.d);

        var entry = { id: 'imp-' + Date.now() + '-' + r, category: cat, type: pt, time: tm, question: qt, explanation: exp };
        if (imgUrl) entry.imageUrl = imgUrl;

        if (pt === 'MC') {
          var opts = [oA, oB, oC, oD].filter(Boolean);
          var ci = resChoice(rAns, opts);
          if (opts.length < 2 || ci === null) { outE.push({ rowNumber: rn, message: 'Soal MC wajib minimal 2 opsi & kunci valid.' }); continue; }
          entry.options = opts; entry.answer = ci;
        } else if (pt === 'TF') {
          var tfOpts = [oA || 'Benar (True)', oB || 'Salah (False)'];
          var u = rAns.toUpperCase();
          var tfi = (u === 'B' || u === 'SALAH' || u === 'FALSE' || u === 'S' || u === '2' || u === 'TIDAK' || u === 'F') ? 1 :
            (u === 'A' || u === '0' || u === '1' || u === 'BENAR' || u === 'TRUE' || u === 'YA' || u === 'T') ? 0 : null;
          if (tfi === null) { outE.push({ rowNumber: rn, message: 'Kunci TF tidak valid.' }); continue; }
          entry.options = tfOpts; entry.answer = tfi;
        } else if (pt === 'MS') {
          var msOpts = [oA, oB, oC, oD].filter(Boolean);
          var toks = rAns.split(/[,;|+&]+/).map(function(s) { return s.trim(); }).filter(Boolean);
          var idxs = [];
          for (var ti = 0; ti < toks.length; ti++) {
            var idx = resChoice(toks[ti], msOpts);
            if (idx !== null && idxs.indexOf(idx) === -1) idxs.push(idx);
          }
          idxs.sort(function(a, b) { return a - b; });
          if (msOpts.length < 2 || idxs.length === 0) { outE.push({ rowNumber: rn, message: 'Soal MS wajib minimal 2 opsi & kunci valid.' }); continue; }
          entry.options = msOpts; entry.answer = idxs;
        } else {
          var acc = rAns.split(/[;|,]+/).map(function(s) { return s.trim(); }).filter(Boolean);
          if (acc.length === 0) { outE.push({ rowNumber: rn, message: 'Soal TEXT wajib mengisi kunci jawaban.' }); continue; }
          entry.acceptedAnswers = acc;
        }
        outQ.push(entry);
      }
      return { questions: outQ, errors: outE, format: fmt };
    }

    function openImportModal() {
      document.getElementById('csv-import-textarea').value = '';
      document.getElementById('import-file-name').textContent = '';
      updateImportPreview();
      document.getElementById('modal-admin-import').classList.remove('hidden');
    }
    function closeImportModal() { document.getElementById('modal-admin-import').classList.add('hidden'); }
    function handleImportFileUpload(ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      document.getElementById('import-file-name').textContent = 'File: ' + file.name;
      var reader = new FileReader();
      reader.onload = function() {
        document.getElementById('csv-import-textarea').value = String(reader.result || '');
        updateImportPreview();
      };
      reader.readAsText(file, 'utf-8');
      ev.target.value = '';
    }
    function updateImportPreview() {
      var raw = document.getElementById('csv-import-textarea').value || '';
      var sumBox = document.getElementById('import-preview-summary');
      var bApp = document.getElementById('btn-import-append');
      var bRep = document.getElementById('btn-import-replace');
      if (!raw.trim()) {
        sumBox.classList.add('hidden');
        bApp.disabled = true; bRep.disabled = true;
        bApp.textContent = 'Tambahkan ke Bank Soal (+0)';
        bRep.textContent = 'Gantikan Bank Soal (0 Soal)';
        return;
      }
      importPreviewResult = parseQuestionsImportClient(raw);
      var qc = importPreviewResult.questions.length;
      var ec = importPreviewResult.errors.length;
      sumBox.classList.remove('hidden');
      document.getElementById('import-valid-count').textContent = qc + ' soal valid siap dikonversi (' + importPreviewResult.format.toUpperCase() + ')';
      var errCntEl = document.getElementById('import-error-count');
      var errBox = document.getElementById('import-errors-box');
      if (ec > 0) {
        errCntEl.classList.remove('hidden'); errCntEl.textContent = ec + ' baris dilewati';
        errBox.classList.remove('hidden');
        errBox.innerHTML = importPreviewResult.errors.map(function(er) { return '<div><strong>Baris ' + er.rowNumber + ':</strong> ' + escapeHtml(er.message) + '</div>'; }).join('');
      } else {
        errCntEl.classList.add('hidden'); errBox.classList.add('hidden');
      }
      var listBox = document.getElementById('import-preview-list');
      if (qc > 0) {
        listBox.classList.remove('hidden');
        listBox.innerHTML = importPreviewResult.questions.slice(0, 20).map(function(q, i) {
          return '<div class="border-b border-[#23304C]/70 last:border-none pb-2 last:pb-0 text-xs">' +
            '<div class="flex justify-between text-slate-400"><span><strong class="text-white">#' + (i + 1) + '</strong> · ' + escapeHtml(q.category) + ' · ' + q.type + '</span><span class="text-emerald-400 font-semibold">Kunci: ' + escapeHtml(getCorrectAnswerDisplay(q)) + '</span></div>' +
            '<p class="text-slate-100 font-semibold truncate">' + escapeHtml(q.question) + '</p></div>';
        }).join('');
      } else listBox.classList.add('hidden');

      bApp.disabled = qc === 0; bRep.disabled = qc === 0;
      bApp.textContent = 'Tambahkan ke Bank Soal (+' + qc + ')';
      bRep.textContent = 'Gantikan Bank Soal (' + qc + ' Soal)';
    }
    function confirmQuestionImport(mode) {
      var imp = importPreviewResult.questions;
      if (!imp || imp.length === 0) return;
      var next = mode === 'replace' ? imp : questions.concat(imp);
      syncQuestionsToStorageAndCloud(next);
      closeImportModal();
      showToast(mode === 'replace' ? ('Bank soal diganti dengan ' + imp.length + ' soal!') : (imp.length + ' soal berhasil ditambahkan!'));
    }

    function exportQuestionsToCsvString(qList) {
      var headers = ['kategori', 'tipe', 'waktu', 'pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'jawaban', 'pembahasan', 'gambar'];
      var letters = ['A', 'B', 'C', 'D'];
      function esc(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
      var rows = qList.map(function(q) {
        var opts = q.options || [];
        var ans = '';
        if (q.type === 'MC' || q.type === 'TF') ans = letters[q.answer] || 'A';
        else if (q.type === 'MS') ans = (q.answer || []).map(function(i) { return letters[i]; }).filter(Boolean).join(',');
        else ans = (q.acceptedAnswers || []).join('; ');
        return [
          esc(q.category), esc(q.type), q.time || 25, esc(q.question),
          esc(q.type === 'TEXT' ? '' : (opts[0] || '')), esc(q.type === 'TEXT' ? '' : (opts[1] || '')),
          esc(q.type === 'TEXT' ? '' : (opts[2] || '')), esc(q.type === 'TEXT' ? '' : (opts[3] || '')),
          esc(ans), esc(q.explanation || ''), esc(q.imageUrl || '')
        ].join(',');
      });
      return '\uFEFF' + [headers.join(',')].concat(rows).join('\n');
    }
    function triggerCsvDownload(content, filename) {
      var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }
    function exportQuestionsCsv() {
      triggerCsvDownload(exportQuestionsToCsvString(questions), 'bank_soal_kuis_' + new Date().toISOString().slice(0, 10) + '.csv');
      showToast(questions.length + ' soal berhasil diekspor ke CSV!');
    }
    function downloadQuestionCsvTemplate() {
      var tpl = [
        { category: 'Wawasan Nusantara', type: 'MC', time: 25, question: 'Apa nama ibu kota Provinsi Kalimantan Timur?', options: ['Balikpapan', 'Samarinda', 'Pontianak', 'Banjarmasin'], answer: 1, explanation: 'Samarinda adalah ibu kota resmi Kalimantan Timur.' },
        { category: 'Manusia & Hewan', type: 'TF', time: 20, question: 'Lumba-lumba bernapas menggunakan paru-paru.', options: ['Benar (True)', 'Salah (False)'], answer: 0, explanation: 'Lumba-lumba adalah mamalia laut.' }
      ];
      triggerCsvDownload(exportQuestionsToCsvString(tpl), 'template_soal_kuis.csv');
      showToast('Template CSV soal berhasil diunduh!');
    }
    function exportScoresCsv() {
      var sorted = cloudLeaderboard.slice().sort(function(a, b) { return (b.score || 0) - (a.score || 0); });
      var headers = ['Rank', 'Nama Peserta', 'Tim', 'Benar', 'Total Soal', 'Skor', 'Soal Salah', 'Total Waktu (Detik)', 'Waktu Selesai', 'ID Perangkat'];
      function esc(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
      var rows = sorted.map(function(p, idx) {
        var hist = Array.isArray(p.history) ? p.history : [];
        var wrong = hist.map(function(h, i) { return !h.isCorrect ? ('No.' + (i + 1)) : null; }).filter(Boolean).join('; ') || 'Tidak ada';
        var totalSec = hist.reduce(function(s, h) { return s + (Number(h.timeTaken) || 0); }, 0);
        return [idx + 1, esc(p.name), esc(p.teamName || 'Solo'), p.correct || 0, p.totalQuestions || questions.length, p.score || 0, esc(wrong), totalSec || '-', esc(p.completedAt ? new Date(p.completedAt).toLocaleString('id-ID') : '-'), esc(p.deviceId || '-')].join(',');
      });
      triggerCsvDownload('\uFEFF' + [headers.join(',')].concat(rows).join('\n'), 'hasil_kuis_nusantara_' + new Date().toISOString().slice(0, 10) + '.csv');
      showToast('File CSV berhasil diunduh!');
    }

    // ==================== CLOUD CALLBACKS ====================
    window.onCloudStatus = function(ok, msg) {
      var dot = document.getElementById('cloud-status-dot');
      var txt = document.getElementById('cloud-status-text');
      if (dot) dot.className = 'w-2 h-2 rounded-full shrink-0 ' + (ok ? 'bg-emerald-400' : 'bg-rose-500');
      if (txt) txt.textContent = msg;
    };
    window.onCloudLeaderboard = function(list) {
      cloudLeaderboard = list || [];
      var found = null;
      for (var i = 0; i < cloudLeaderboard.length; i++) {
        if (cloudLeaderboard[i].deviceId === myDeviceId) { found = cloudLeaderboard[i]; break; }
      }
      if (found) {
        mySavedRecord = found;
        hasPlayedThisDevice = true;
        safeSetStorage(getCompletedRecordKey(), JSON.stringify(found));
      } else if (!isAutostartDemo) {
        if (safeGetStorage(getCompletedRecordKey())) safeRemoveStorage(getCompletedRecordKey());
        mySavedRecord = null;
        hasPlayedThisDevice = false;
      }
      updateLobbyUI();
      renderLiveLeaderboardModal();
      if (activeScreen === 'leaderboard') renderLeaderboardScreen();
      if (activeScreen === 'admin') { renderAdminStats(); renderAdminLiveLeaderboard(); }
    };
    window.onCloudQuestions = function(items) {
      if (Array.isArray(items) && items.length > 0) {
        questions = items;
        safeSetStorage(getCustomQuestionsKey(), JSON.stringify(items));
        updateLobbyUI();
        if (activeScreen === 'admin') renderAdminBankSoal();
      }
    };
    window.onCloudSession = function(s) {
      if (isAutostartDemo || !s || !s.mode) return;
      currentSessionMode = s.mode;
      currentLiveRunId = s.runId || 'default';
      updateLobbyUI();
    };
    window.onCloudSettings = function(cfg) {
      if (isAutostartDemo || !cfg || typeof cfg !== 'object') return;
      settings = Object.assign({}, DEFAULT_QUIZ_SETTINGS, cfg);
      if (initialCompactFlag) settings.compactMode = true;
      safeSetStorage(getSettingsKey(), JSON.stringify(settings));
      updateLobbyUI();
    };
    window.onCloudWaiting = function(list) {
      waitingPlayers = list || [];
      renderWaitingRoom();
      if (activeScreen === 'admin') renderAdminSessionControls();
    };
    window.onCloudActive = function(list) {
      activePlayers = list || [];
      updateLobbyUI();
      renderLiveLeaderboardModal();
      if (activeScreen === 'leaderboard') renderLeaderboardScreen();
      if (activeScreen === 'admin') renderAdminSessionControls();
    };
    window.onCloudSabotage = function(ev) {
      if (!ev || ev.targetDeviceId !== myDeviceId || activeScreen !== 'quiz' || !isPowerupEnabled(ev.type)) return;
      if (ev.type === 'FREEZE_LEADER') triggerIncomingFreeze(ev.attackerName);
      else if (ev.type === 'TORNADO') triggerIncomingTornado(ev.attackerName);
      else if (ev.type === 'GLITCH_SHUFFLE') {
        if (immuneQuestionsRemaining > 0) {
          showToast('Perisai menangkis serangan ' + (ev.attackerName || 'lawan') + '!');
        } else {
          immuneQuestionsRemaining = 1;
          playFreezeFx();
          glitchShuffleForNext = true;
          showToast('Opsi jawabanmu akan diacak oleh ' + (ev.attackerName || 'lawan') + ' pada soal berikutnya!');
        }
      }
    };

    // Init UI immediately
    updateMuteButtonsUI();
    if (isAutostartDemo) {
      if (readUrlParam('voyage') === '1') settings.gameplayMode = 'voyage';
      var tParam = Number(readUrlParam('timer') || 0);
      if (isFinite(tParam) && tParam > 0) settings.quizDurationMinutes = tParam;
      var tmParam = (readUrlParam('team') || '').trim();
      if (tmParam) { teamModeChoice = 'team'; teamName = tmParam; }
      if (readUrlParam('live_lb') === '1') settings.showLiveLeaderboardToPlayers = true;
      var gamParam = readUrlParam('gamification');
      if (gamParam === '0') settings.gamificationEnabled = false;
      else if (gamParam === '1') settings.gamificationEnabled = true;
      updateLobbyUI();
      startGameplay('Pemain Uji', 'free', 'autostart', true, true);
    } else {
      updateLobbyUI();
    }
  </script>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

    var db = null;
    var currentRoomAppId = window.getRoomFirebaseAppId ? window.getRoomFirebaseAppId(window.activeRoomCode || '') : ${JSON.stringify(defaultAppId)};
    var activeUnsubs = [];
    var lastSabotageTs = 0;

    function clearSubscriptions() {
      activeUnsubs.forEach(function(u) { try { u(); } catch (e) {} });
      activeUnsubs = [];
    }

    function subscribeRoom(code) {
      if (!db) return;
      clearSubscriptions();
      currentRoomAppId = window.getRoomFirebaseAppId ? window.getRoomFirebaseAppId(code) : ${JSON.stringify(defaultAppId)};
      var base = ['artifacts', currentRoomAppId, 'public', 'data'];

      activeUnsubs.push(onSnapshot(collection(db, base[0], base[1], base[2], base[3], 'leaderboard'), function(snap) {
        if (window.onCloudStatus) window.onCloudStatus(true, 'Cloud Terhubung');
        var list = [];
        snap.forEach(function(d) { list.push(d.data()); });
        if (window.onCloudLeaderboard) window.onCloudLeaderboard(list);
      }, function() {
        if (window.onCloudStatus) window.onCloudStatus(false, 'Cek Rules Firestore!');
      }));

      activeUnsubs.push(onSnapshot(doc(db, base[0], base[1], base[2], base[3], 'config', 'questions_v2'), function(snap) {
        if (snap.exists() && snap.data().items && window.onCloudQuestions) window.onCloudQuestions(snap.data().items);
      }));
      activeUnsubs.push(onSnapshot(doc(db, base[0], base[1], base[2], base[3], 'config', 'session'), function(snap) {
        if (!window.onCloudSession) return;
        if (snap.exists()) window.onCloudSession(snap.data());
        else window.onCloudSession({ mode: 'unconfigured', runId: 'default', updatedAt: 0 });
      }));
      activeUnsubs.push(onSnapshot(doc(db, base[0], base[1], base[2], base[3], 'config', 'settings'), function(snap) {
        if (snap.exists() && window.onCloudSettings) window.onCloudSettings(snap.data());
      }));
      activeUnsubs.push(onSnapshot(collection(db, base[0], base[1], base[2], base[3], 'waiting_room'), function(snap) {
        var list = [];
        snap.forEach(function(d) { list.push(d.data()); });
        list.sort(function(a, b) { return (a.joinedAt || 0) - (b.joinedAt || 0); });
        if (window.onCloudWaiting) window.onCloudWaiting(list);
      }));
      activeUnsubs.push(onSnapshot(collection(db, base[0], base[1], base[2], base[3], 'active_players'), function(snap) {
        var list = [];
        snap.forEach(function(d) { list.push(d.data()); });
        if (window.onCloudActive) window.onCloudActive(list);
      }));
      activeUnsubs.push(onSnapshot(doc(db, base[0], base[1], base[2], base[3], 'sabotage', window.myDeviceId), function(snap) {
        if (snap.exists()) {
          var s = snap.data();
          if (s && s.createdAt && s.createdAt > lastSabotageTs && Date.now() - s.createdAt < 20000) {
            lastSabotageTs = s.createdAt;
            if (window.onCloudSabotage) window.onCloudSabotage(s);
          }
        }
      }));
    }

    (async function initCloud() {
      try {
        var app = initializeApp(window.FIREBASE_CONFIG);
        var auth = getAuth(app);
        db = getFirestore(app);
        try { await signInAnonymously(auth); } catch (e) {}
        subscribeRoom(window.activeRoomCode || '');
      } catch (err) {
        if (window.onCloudStatus) window.onCloudStatus(false, 'Mode Offline / Lokal');
      }
    })();

    function stripUndefined(val) {
      if (Array.isArray(val)) return val.map(stripUndefined);
      if (val && typeof val === 'object') {
        var out = {};
        Object.keys(val).forEach(function(k) {
          if (val[k] !== undefined) out[k] = stripUndefined(val[k]);
        });
        return out;
      }
      return val;
    }

    window.switchFirebaseRoom = function(newCode) { subscribeRoom(newCode); };
    window.saveSessionStateToCloud = async function(payload) { if (!db) return; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'config', 'session'), stripUndefined(payload)); } catch (e) {} };
    window.saveQuizSettingsToCloud = async function(cfg) { if (!db) return; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'config', 'settings'), stripUndefined(Object.assign({}, cfg, { updatedAt: Date.now() }))); } catch (e) {} };
    window.joinWaitingRoomCloud = async function(p) { if (!db) return; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'waiting_room', p.deviceId), stripUndefined(p)); } catch (e) {} };
    window.leaveWaitingRoomCloud = async function(id) { if (!db || !id) return; try { await deleteDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'waiting_room', id)); } catch (e) {} };
    window.upsertActivePlayerCloud = async function(p) { if (!db || !p.deviceId) return; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'active_players', p.deviceId), stripUndefined(p)); } catch (e) {} };
    window.unregisterActivePlayerCloud = async function(id) { if (!db || !id) return; try { await deleteDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'active_players', id)); } catch (e) {} };
    window.clearActiveSessionPlayersCloud = async function() {
      if (!db) return;
      try {
        var sA = await getDocs(collection(db, 'artifacts', currentRoomAppId, 'public', 'data', 'active_players'));
        var sW = await getDocs(collection(db, 'artifacts', currentRoomAppId, 'public', 'data', 'waiting_room'));
        var dels = [];
        sA.forEach(function(d) { dels.push(deleteDoc(d.ref)); });
        sW.forEach(function(d) { dels.push(deleteDoc(d.ref)); });
        await Promise.all(dels);
      } catch (e) {}
    };
    window.saveScoreToCloud = async function(rec) { if (!db) return false; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'leaderboard', rec.deviceId), stripUndefined(rec)); return true; } catch (e) { return false; } };
    window.fetchCloudLeaderboardOnce = async function() {
      if (!db) return null;
      try {
        var snap = await getDocs(collection(db, 'artifacts', currentRoomAppId, 'public', 'data', 'leaderboard'));
        var list = []; snap.forEach(function(d) { list.push(d.data()); });
        return list;
      } catch (e) { return null; }
    };
    window.saveQuestionsToCloud = async function(items) { if (!db) return false; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'config', 'questions_v2'), stripUndefined({ items: items, updatedAt: new Date().toISOString() })); return true; } catch (e) { return false; } };
    window.sendSabotageToCloud = async function(payload) { if (!db || !payload.targetDeviceId) return; try { await setDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'sabotage', payload.targetDeviceId), stripUndefined(payload)); } catch (e) {} };
    window.deleteSingleParticipantFromCloud = async function(id) { if (!db || !id) return; try { await deleteDoc(doc(db, 'artifacts', currentRoomAppId, 'public', 'data', 'leaderboard', id)); } catch (e) {} };
    window.resetCloudLeaderboard = async function() {
      if (!db) return;
      try {
        var snap = await getDocs(collection(db, 'artifacts', currentRoomAppId, 'public', 'data', 'leaderboard'));
        var dels = []; snap.forEach(function(d) { dels.push(deleteDoc(d.ref)); });
        await Promise.all(dels);
      } catch (e) {}
    };
  </script>
</body>`;
}
