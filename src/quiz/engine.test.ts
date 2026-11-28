import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateTeamLeaderboard,
  buildCsvContent,
  buildVoyageCheckpoints,
  calculateEarnedPoints,
  computeAdminStats,
  evaluateAnswer,
  formatCountdownClock,
  generateDefaultRoomCode,
  getDebuffMilestones,
  getEffectiveParticipationMode,
  getEnabledPowerups,
  getSessionLockFlags,
  getStreakRewardTarget,
  getVoyageProgressState,
  grantPowerupToSlots,
  isFreeSessionMode,
  isGamificationActive,
  isGlobalQuizTimerActive,
  isLiveSessionMode,
  isMilestoneDropActive,
  isPowerupEnabled,
  isSessionStarted,
  isStreakRewardActive,
  isTeamParticipationAvailable,
  mergeLiveAndFinishedLeaderboard,
  parseClassGateInput,
  pickSabotageTarget,
  rollAllowedPowerup,
  rollIslandRewardPowerup,
  rollWeightedPowerup,
  sanitizeRoomCode,
  STALE_ACTIVE_PLAYER_MS,
  togglePowerupInList,
} from './engine';
import { ALL_POWERUP_IDS, DEFAULT_QUESTIONS } from './questions';
import { generateGoogleSitesHtml } from './googleSitesExport';
import {
  buildQuestionCsvTemplate,
  exportQuestionsToCsv,
  parseQuestionsImport,
} from './questionImport';
import type { ActivePlayer, PlayerRecord } from './types';

test('streak target & debuff milestones scale cleanly with question count', () => {
  assert.equal(getStreakRewardTarget(30), 8);
  assert.equal(getStreakRewardTarget(10), 3);
  assert.deepEqual(getDebuffMilestones(30), [10, 15, 20, 30]);
  assert.deepEqual(getDebuffMilestones(10), [5, 10]);
});

test('evaluateAnswer handles MC, TF, MS, and normalized TEXT answers', () => {
  const mc = DEFAULT_QUESTIONS[0];
  assert.equal(evaluateAnswer(mc, 0).isCorrect, true);
  assert.equal(evaluateAnswer(mc, 2).isCorrect, false);

  const ms = DEFAULT_QUESTIONS[2]; // answer [0, 2]
  assert.equal(evaluateAnswer(ms, [2, 0]).isCorrect, true);
  assert.equal(evaluateAnswer(ms, [0, 1]).isCorrect, false);

  const txt = DEFAULT_QUESTIONS[3]; // femur / tulang paha
  assert.equal(evaluateAnswer(txt, '  Femur  ').isCorrect, true);
  assert.equal(evaluateAnswer(txt, 'tulang kering').isCorrect, false);
});

test('calculateEarnedPoints computes speed bonus, global timer flat curve, and 2x multiplier', () => {
  assert.equal(calculateEarnedPoints(false, 20, 25, true), 0);
  assert.equal(calculateEarnedPoints(true, 25, 25, false), 1000);
  assert.equal(calculateEarnedPoints(true, 25, 25, true), 2000);
  assert.equal(calculateEarnedPoints(true, 0, 25, false), 600);
  // Global timer mode gives 850 base + up to 150 pace bonus
  assert.equal(calculateEarnedPoints(true, 1800, 1800, false, true), 1000);
  assert.equal(calculateEarnedPoints(true, 0, 1800, false, true), 850);
  assert.equal(calculateEarnedPoints(true, 0, 1800, true, true), 1700);
});

test('isGlobalQuizTimerActive & formatCountdownClock behave accurately', () => {
  assert.equal(isGlobalQuizTimerActive('free', { quizDurationMinutes: 0 }), false);
  assert.equal(isGlobalQuizTimerActive('unconfigured', { quizDurationMinutes: 30 }), false);
  assert.equal(isGlobalQuizTimerActive('live_started', { quizDurationMinutes: 30 }), true);
  assert.equal(isGlobalQuizTimerActive('free', { quizDurationMinutes: 15 }), true);

  assert.equal(formatCountdownClock(1800), '30:00');
  assert.equal(formatCountdownClock(65), '01:05');
  assert.equal(formatCountdownClock(-5), '00:00');
});

test('isGamificationActive defaults to true and respects explicit false', () => {
  assert.equal(isGamificationActive(undefined), true);
  assert.equal(isGamificationActive(null), true);
  assert.equal(isGamificationActive({ gamificationEnabled: true }), true);
  assert.equal(isGamificationActive({ gamificationEnabled: false }), false);
});

test('selective gamification controls filter enabled powerups, streak rewards, milestone drops, and island rewards', () => {
  assert.deepEqual(getEnabledPowerups(undefined), ALL_POWERUP_IDS);
  assert.deepEqual(getEnabledPowerups({ gamificationEnabled: false, enabledPowerups: ['DOUBLE_SCORE'] }), []);
  assert.deepEqual(getEnabledPowerups({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE'] }), ['DOUBLE_SCORE']);
  assert.deepEqual(getEnabledPowerups({ gamificationEnabled: true, enabledPowerups: [] }), []);
  // Ignores unknown/invalid IDs safely
  assert.deepEqual(
    getEnabledPowerups({
      gamificationEnabled: true,
      enabledPowerups: ['DOUBLE_SCORE', 'UNKNOWN_POWERUP' as unknown as 'DOUBLE_SCORE'],
    }),
    ['DOUBLE_SCORE']
  );

  assert.equal(isPowerupEnabled({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE'] }, 'DOUBLE_SCORE'), true);
  assert.equal(isPowerupEnabled({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE'] }, 'TORNADO'), false);

  assert.equal(isStreakRewardActive({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE'], streakEnabled: true }), true);
  assert.equal(isStreakRewardActive({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE'], streakEnabled: false }), false);
  assert.equal(isStreakRewardActive({ gamificationEnabled: true, enabledPowerups: [], streakEnabled: true }), false);

  // Milestone drops require at least one enabled debuff AND milestoneDropsEnabled !== false
  assert.equal(isMilestoneDropActive({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE'], milestoneDropsEnabled: true }), false);
  assert.equal(isMilestoneDropActive({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE', 'TORNADO'], milestoneDropsEnabled: true }), true);
  assert.equal(isMilestoneDropActive({ gamificationEnabled: true, enabledPowerups: ['DOUBLE_SCORE', 'TORNADO'], milestoneDropsEnabled: false }), false);

  // Rolling strictly respects enabledPowerups
  assert.equal(rollAllowedPowerup(null, ['DOUBLE_SCORE'], () => 0.99), 'DOUBLE_SCORE');
  assert.equal(rollAllowedPowerup('debuff', ['DOUBLE_SCORE'], () => 0.5), null);
  assert.equal(rollAllowedPowerup(null, [], () => 0.5), null);
  assert.equal(rollIslandRewardPowerup(true, ['DOUBLE_SCORE'], true, () => 0.1), 'DOUBLE_SCORE');
  assert.equal(rollIslandRewardPowerup(false, ['DOUBLE_SCORE'], true, () => 0.1), null);
  assert.equal(rollIslandRewardPowerup(true, [], false, () => 0.5), null);

  // togglePowerupInList maintains canonical order
  const toggledOff = togglePowerupInList([...ALL_POWERUP_IDS], 'FIFTY_FIFTY');
  assert.ok(!toggledOff.includes('FIFTY_FIFTY'));
  const toggledOn = togglePowerupInList(toggledOff, 'FIFTY_FIFTY');
  assert.deepEqual(toggledOn, ALL_POWERUP_IDS);
});

test('isTeamParticipationAvailable & getEffectiveParticipationMode restrict teams strictly to voyage mode', () => {
  assert.equal(isTeamParticipationAvailable(undefined), false);
  assert.equal(isTeamParticipationAvailable({ gameplayMode: 'classic' }), false);
  assert.equal(isTeamParticipationAvailable({ gameplayMode: 'voyage' }), true);

  assert.equal(
    getEffectiveParticipationMode({ gameplayMode: 'classic', participationMode: 'team' }),
    'solo'
  );
  assert.equal(
    getEffectiveParticipationMode({ gameplayMode: 'classic', participationMode: 'either' }),
    'solo'
  );
  assert.equal(
    getEffectiveParticipationMode({ gameplayMode: 'voyage', participationMode: 'team' }),
    'team'
  );
  assert.equal(
    getEffectiveParticipationMode({ gameplayMode: 'voyage', participationMode: 'either' }),
    'either'
  );
});

test('parseClassGateInput validates codes, maps UMUM/DEFAULT to empty room, and sanitizes custom codes', () => {
  const emptyRes = parseClassGateInput('   ');
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.error && emptyRes.error.length > 0);

  const umumRes = parseClassGateInput('umum');
  assert.equal(umumRes.valid, true);
  assert.equal(umumRes.roomCode, '');
  assert.equal(umumRes.displayLabel, 'Umum');

  const defaultRes = parseClassGateInput('default');
  assert.equal(defaultRes.valid, true);
  assert.equal(defaultRes.roomCode, '');

  const customRes = parseClassGateInput(' kelas 8a! ');
  assert.equal(customRes.valid, true);
  assert.equal(customRes.roomCode, 'KELAS8A');
  assert.equal(customRes.displayLabel, '#KELAS8A');
});

test('buildVoyageCheckpoints scales islands cleanly as totalQuestions / 5', () => {
  const cp30 = buildVoyageCheckpoints(30);
  assert.equal(cp30.length, 6);
  assert.deepEqual(
    cp30.map((c) => c.questionNumber),
    [5, 10, 15, 20, 25, 30]
  );

  const cp12 = buildVoyageCheckpoints(12);
  assert.equal(cp12.length, 2);
  assert.deepEqual(
    cp12.map((c) => c.questionNumber),
    [5, 10]
  );

  const cp3 = buildVoyageCheckpoints(3);
  assert.equal(cp3.length, 1);
  assert.equal(cp3[0].questionNumber, 3);
});

test('getVoyageProgressState advances through 3 steps per 5-question leg and docks at island', () => {
  const s0 = getVoyageProgressState(0, 30);
  assert.equal(s0.legStep, 0);
  assert.equal(s0.dockedIsland, null);
  assert.equal(s0.completedIslands, 0);

  const s1 = getVoyageProgressState(1, 30);
  assert.equal(s1.legStep, 1);
  assert.equal(s1.dockedIsland, null);

  const s3 = getVoyageProgressState(3, 30);
  assert.equal(s3.legStep, 2);
  assert.equal(s3.dockedIsland, null);

  const s5 = getVoyageProgressState(5, 30);
  assert.equal(s5.legStep, 3);
  assert.equal(s5.completedIslands, 1);
  assert.equal(s5.dockedIsland?.islandNumber, 1);
  assert.equal(s5.dockedIsland?.name, 'Pulau Rempah Maluku');

  const s6 = getVoyageProgressState(6, 30);
  assert.equal(s6.currentLegIndex, 1);
  assert.equal(s6.legStep, 1);
  assert.equal(s6.dockedIsland, null);
});

test('grantPowerupToSlots caps at 2 slots and converts overflow to +50 pts', () => {
  const step1 = grantPowerupToSlots([null, null], 'SHIELD');
  assert.equal(step1.granted, true);
  assert.deepEqual(step1.nextInventory, ['SHIELD', null]);

  const step2 = grantPowerupToSlots(step1.nextInventory, 'DOUBLE_SCORE');
  assert.equal(step2.granted, true);
  assert.deepEqual(step2.nextInventory, ['SHIELD', 'DOUBLE_SCORE']);

  const step3 = grantPowerupToSlots(step2.nextInventory, 'FIFTY_FIFTY');
  assert.equal(step3.granted, false);
  assert.equal(step3.bonusPoints, 50);
  assert.deepEqual(step3.nextInventory, ['SHIELD', 'DOUBLE_SCORE']);
});

test('rollWeightedPowerup filters by kind and includes TORNADO debuff', () => {
  const buff = rollWeightedPowerup('buff', () => 0.5);
  assert.ok(['DOUBLE_SCORE', 'FIFTY_FIFTY', 'SHIELD'].includes(buff));
  const debuffLow = rollWeightedPowerup('debuff', () => 0.1);
  const debuffHigh = rollWeightedPowerup('debuff', () => 0.99);
  assert.ok(['FREEZE_LEADER', 'GLITCH_SHUFFLE', 'TORNADO'].includes(debuffLow));
  assert.equal(debuffHigh, 'TORNADO');
});

test('aggregateTeamLeaderboard & mergeLiveAndFinishedLeaderboard combine solo/team and active/finished players', () => {
  const finished: PlayerRecord[] = [
    {
      id: 'P1',
      deviceId: 'D1',
      name: 'Budi',
      teamName: 'Garuda',
      score: 2000,
      correct: 3,
      totalQuestions: 5,
      history: [],
      completedAt: '',
    },
    {
      id: 'P2',
      deviceId: 'D2',
      name: 'Sari',
      teamName: 'Garuda',
      score: 1500,
      correct: 2,
      totalQuestions: 5,
      history: [],
      completedAt: '',
    },
    {
      id: 'P3',
      deviceId: 'D3',
      name: 'Andi',
      score: 1800,
      correct: 3,
      totalQuestions: 5,
      history: [],
      completedAt: '',
    },
  ];
  const now = 1_000_000_000;
  const active: ActivePlayer[] = [
    {
      deviceId: 'D1',
      name: 'Budi',
      teamName: 'Garuda',
      mode: 'live_started',
      score: 900,
      currentQuestion: 2,
      totalQuestions: 5,
      startedAt: now,
      lastSeen: now,
    },
    {
      deviceId: 'D4',
      name: 'Citra',
      teamName: 'Elang',
      mode: 'live_started',
      score: 2500,
      currentQuestion: 4,
      totalQuestions: 5,
      startedAt: now,
      lastSeen: now,
    },
  ];

  const merged = mergeLiveAndFinishedLeaderboard(finished, active, 5, now);
  assert.equal(merged.length, 4);
  assert.equal(merged[0].name, 'Citra');
  assert.equal(merged[0].status, 'playing');
  // Finished D1 overrides stale active D1
  const budi = merged.find((r) => r.deviceId === 'D1');
  assert.equal(budi?.status, 'finished');
  assert.equal(budi?.score, 2000);

  const teams = aggregateTeamLeaderboard(merged);
  assert.equal(teams[0].teamName, 'Garuda');
  assert.equal(teams[0].memberCount, 2);
  assert.equal(teams[0].totalScore, 3500);
  assert.equal(teams[0].avgScore, 1750);
  assert.equal(teams[1].teamName, 'Elang');
  assert.equal(teams[2].isSolo, true);
});

test('pickSabotageTarget prioritizes fresh active in-game leader over finished leaderboard', () => {
  const now = 1_000_000_000;
  const active: ActivePlayer[] = [
    { deviceId: 'SELF', name: 'Aku', mode: 'live_started', score: 3000, startedAt: now, lastSeen: now },
    { deviceId: 'OPP1', name: 'Sinta', mode: 'live_started', score: 1800, startedAt: now, lastSeen: now },
    { deviceId: 'OPP2', name: 'Raka', mode: 'live_started', score: 2500, startedAt: now, lastSeen: now },
    { deviceId: 'STALE', name: 'Hantu', mode: 'live_started', score: 9999, startedAt: now - STALE_ACTIVE_PLAYER_MS - 1000, lastSeen: now - STALE_ACTIVE_PLAYER_MS - 1000 },
  ];
  const lb: PlayerRecord[] = [
    { id: 'FIN1', deviceId: 'FIN1', name: 'Budi', score: 5000, correct: 10, totalQuestions: 30, history: [], completedAt: '' },
  ];

  const target = pickSabotageTarget(active, lb, 'SELF', now);
  assert.deepEqual(target, { deviceId: 'OPP2', name: 'Raka', score: 2500 });

  // Fallback to leaderboard when no fresh active opponents exist
  const fallback = pickSabotageTarget([], lb, 'SELF', now);
  assert.deepEqual(fallback, { deviceId: 'FIN1', name: 'Budi', score: 5000 });
});

test('getSessionLockFlags ignores stale active players and locks opposing modes cleanly', () => {
  const now = 1_000_000_000;
  const staleOnly: ActivePlayer[] = [
    { deviceId: 'OLD', name: 'Old', mode: 'free', startedAt: now - STALE_ACTIVE_PLAYER_MS - 5000 },
  ];
  const unlocked = getSessionLockFlags('free', [], staleOnly, [], now);
  assert.equal(unlocked.isLiveLockedOut, false);
  assert.equal(unlocked.isFreeLockedOut, false);

  const lockedLive = getSessionLockFlags(
    'free',
    [],
    [{ deviceId: 'A1', name: 'A1', mode: 'free', startedAt: now, lastSeen: now }],
    [],
    now
  );
  assert.equal(lockedLive.isLiveLockedOut, true);
  assert.equal(lockedLive.isFreeLockedOut, false);
});

test('computeAdminStats & buildCsvContent format metrics, team column, and handle # safely', () => {
  const records: PlayerRecord[] = [
    {
      id: 'D1',
      deviceId: 'D1',
      name: 'Sari "Pro"',
      teamName: 'Garuda',
      score: 1800,
      correct: 2,
      totalQuestions: 2,
      completedAt: '2026-11-23T06:00:00.000Z',
      history: [
        {
          questionId: 'mh-01',
          questionIndex: 0,
          question: 'Q1',
          category: 'Manusia & Hewan',
          userAnswer: 'Gurita',
          correctAnswer: 'Gurita',
          isCorrect: true,
          timeTaken: 4,
          maxTime: 25,
          pointsEarned: 900,
          explanation: 'Exp1',
        },
        {
          questionId: 'mh-02',
          questionIndex: 1,
          question: 'Q2',
          category: 'Manusia & Hewan',
          userAnswer: 'Benar',
          correctAnswer: 'Benar',
          isCorrect: true,
          timeTaken: 2,
          maxTime: 20,
          pointsEarned: 900,
          explanation: 'Exp2',
        },
      ],
    },
  ];
  const stats = computeAdminStats(records, DEFAULT_QUESTIONS.slice(0, 2));
  assert.equal(stats.totalPlayers, 1);
  assert.equal(stats.avgScore, 1800);
  assert.equal(stats.avgCorrectPct, 100);

  const csv = buildCsvContent(records, DEFAULT_QUESTIONS.slice(0, 2));
  assert.ok(csv.startsWith('\uFEFFRank,Nama Peserta,Tim,'));
  assert.ok(csv.includes('"Sari ""Pro"""'));
  assert.ok(csv.includes('"Garuda"'));
  assert.ok(csv.includes('No.2 (2d)'));
});

test('generateGoogleSitesHtml embeds current questions, Voyage/Timer/Tornado parity, Admin 3-tab CSV import, and excludes Publish & Embed', () => {
  const html = generateGoogleSitesHtml(
    DEFAULT_QUESTIONS,
    {
      allowReplay: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      questionLimit: 10,
      compactMode: false,
      adminPin: '9988',
      quizDurationMinutes: 30,
      gameplayMode: 'voyage',
      participationMode: 'either',
      showLiveLeaderboardToPlayers: true,
      gamificationEnabled: true,
    },
    'KELAS8A'
  );
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('quizmrng.firebaseapp.com'));
  assert.ok(html.includes('Gurita'));
  assert.ok(html.includes('URL.createObjectURL'));
  assert.ok(!html.includes('font-awesome'));

  // Parity UI & UX features: arcade buttons, countdown, mute, rooms, confetti, review filter, image support
  assert.ok(html.includes('arcade-btn-amber'));
  assert.ok(html.includes('pre-countdown-overlay'));
  assert.ok(html.includes('Lewati Hitung Mundur'));
  assert.ok(html.includes('toggleMute()'));
  assert.ok(html.includes('modal-room'));
  assert.ok(html.includes('KELAS8A'));
  assert.ok(html.includes('9988'));
  assert.ok(html.includes('confetti-container'));
  assert.ok(html.includes('Salah Saja'));
  assert.ok(html.includes('crud-image-url'));
  assert.ok(html.includes('admin-q-search'));
  assert.ok(html.includes('Pantau Live: Sedang Mengerjakan'));
  assert.ok(html.includes('setting-allow-replay'));
  assert.ok(html.includes('setting-question-limit'));
  assert.ok(html.includes('modal-confirm-action'));

  // Global Timer, Voyage Harta Karun, Puting Beliung, Solo/Tim, Live Leaderboard parity
  assert.ok(html.includes('Berlayar Harta Karun'));
  assert.ok(html.includes('Puting Beliung'));
  assert.ok(html.includes('modal-island-minigame'));
  assert.ok(html.includes('modal-live-leaderboard'));
  assert.ok(html.includes('voyage-roadmap-box'));
  assert.ok(html.includes('tornado-banner'));
  assert.ok(html.includes('Timer Kuis Global'));
  assert.ok(html.includes('Klasemen Leaderboard Live'));

  // Admin Step 1 (Room Priority) & Step 2 (Mode Pelaksanaan lock)
  assert.ok(html.includes('admin-current-room-display'));
  assert.ok(html.includes('admin-mode-locked-banner'));
  assert.ok(html.includes('generateAdminRoomCode'));
  assert.ok(html.includes('adminConfirmRoomStep'));
  assert.ok(html.includes('Buat Kode Acak'));
  assert.ok(html.includes('LANGKAH 1'));
  assert.ok(html.includes('LANGKAH 2'));

  // Admin tabs (5 tabs including Gamifikasi & Pengaturan & Tampilan) & CSV import parity without Publish & Embed or browser dialogs
  assert.ok(html.includes('Kontrol Sesi'));
  assert.ok(html.includes('admin-tab-gamification'));
  assert.ok(html.includes('admin-tab-settings'));
  assert.ok(html.includes('Pengaturan &amp; Tampilan'));
  assert.ok(html.includes('setting-gamification-enabled'));
  assert.ok(html.includes('setting-streak-enabled'));
  assert.ok(html.includes('setting-milestone-drops-enabled'));
  assert.ok(html.includes('adminTogglePowerupItem'));
  assert.ok(html.includes('adminApplyPowerupPreset'));
  assert.ok(html.includes('adminToggleGamificationMechanic'));
  assert.ok(html.includes('Hanya Skor 2x'));
  assert.ok(html.includes('renderLobbyPowerups'));
  assert.ok(html.includes('quiz-gamification-bar'));
  assert.ok(html.includes('Statistik &amp; Peserta'));
  assert.ok(html.includes('Bank Soal'));
  assert.ok(html.includes('Impor CSV / Excel'));
  assert.ok(html.includes('Ekspor Soal CSV'));
  assert.ok(html.includes('modal-admin-import'));
  // Class room gate, mode differentiation, and waiting room parity
  assert.ok(html.includes('lobby-room-gate'));
  assert.ok(html.includes('lobby-room-gate-input'));
  assert.ok(html.includes('submitLobbyRoomGate'));
  assert.ok(html.includes('lobby-mode-panel-title'));
  assert.ok(html.includes('waiting-room-badge'));
  assert.ok(html.includes('waiting-mode-badge'));
  assert.ok(html.includes('free_waiting'));
  assert.ok(html.includes('Siap & Tunggu Start Admin'));
  assert.ok(html.includes('adminStartConfiguredMode'));
  assert.ok(html.includes('mergeLiveAndFinishedLeaderboard(cloudLeaderboard'));
  assert.ok(!html.includes('Publish &amp; Embed'));
  assert.ok(!html.includes('Publish & Embed'));
  assert.ok(!html.includes('window.alert('));
  assert.ok(!html.includes('window.confirm('));

  const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scriptMatches.length >= 1);
  // Ensure the inline quiz script parses cleanly with zero SyntaxError
  new Function(scriptMatches[0][1]);
});

test('generateDefaultRoomCode generates valid uppercase room codes', () => {
  const c1 = generateDefaultRoomCode('KELAS');
  const c2 = generateDefaultRoomCode('ipa pagi!');
  assert.match(c1, /^KELAS-[A-Z0-9]{4}$/);
  assert.match(c2, /^IPAPAGI-[A-Z0-9]{4}$/);
  assert.equal(sanitizeRoomCode(c1), c1);
});

test('parseQuestionsImport handles comma CSV, Indonesian semicolon CSV, TSV paste, and JSON', () => {
  // 1. Comma CSV with quoted comma and all 4 question types
  const csv = [
    'kategori,tipe,waktu,pertanyaan,opsi_a,opsi_b,opsi_c,opsi_d,jawaban,pembahasan',
    '"Wawasan Nusantara",MC,30,"Apa ibu kota Kalimantan Timur, Indonesia?",Balikpapan,Samarinda,Pontianak,Banjarmasin,B,"Samarinda resmi menjadi ibu kota."',
    'Manusia & Hewan,TF,20,Paus termasuk mamalia laut.,Benar,Salah,,,Benar,Paus melahirkan dan menyusui.',
    'Logika & Hitungan,MS,25,Mana bilangan genap?,3,4,7,8,"B,D",4 dan 8 habis dibagi 2.',
    'Wawasan Nusantara,TEXT,25,Tari serempak dari Aceh?, , , , ,Saman; Tari Saman,Berasal dari suku Gayo.',
  ].join('\n');

  const resCsv = parseQuestionsImport(csv);
  assert.equal(resCsv.format, 'csv');
  assert.equal(resCsv.errors.length, 0);
  assert.equal(resCsv.questions.length, 4);
  assert.equal(resCsv.questions[0].answer, 1);
  assert.equal(resCsv.questions[1].type, 'TF');
  assert.equal(resCsv.questions[1].answer, 0);
  assert.deepEqual(resCsv.questions[2].answer, [1, 3]);
  assert.deepEqual(resCsv.questions[3].acceptedAnswers, ['Saman', 'Tari Saman']);

  // 2. Indonesian Excel semicolon CSV + invalid row reporting
  const semi = [
    'kategori;tipe;waktu;pertanyaan;opsi_a;opsi_b;opsi_c;opsi_d;jawaban;pembahasan',
    'Logika & Hitungan;MC;15;2 + 5 = ?;6;7;8;9;B;Penjumlahan dasar.',
    'Logika & Hitungan;MC;15;Soal tanpa opsi cukup;Hanya satu;;;;A;Harus error.',
  ].join('\n');
  const resSemi = parseQuestionsImport(semi);
  assert.equal(resSemi.format, 'semicolon-csv');
  assert.equal(resSemi.questions.length, 1);
  assert.equal(resSemi.errors.length, 1);
  assert.equal(resSemi.errors[0].rowNumber, 3);

  // 3. Google Sheets / Excel copy-paste (tab-delimited)
  const tsv = 'Wawasan Nusantara\tMC\t20\tGunung tertinggi di Jawa?\tMerapi\tSemeru\tBromo\tRinjani\tB\tMahameru.';
  const resTsv = parseQuestionsImport(tsv);
  assert.equal(resTsv.format, 'tsv');
  assert.equal(resTsv.questions.length, 1);
  assert.equal(resTsv.questions[0].answer, 1);

  // 4. Template & round-trip export
  const tpl = buildQuestionCsvTemplate();
  const parsedTpl = parseQuestionsImport(tpl);
  assert.equal(parsedTpl.questions.length, 4);
  assert.equal(parsedTpl.errors.length, 0);

  const exportedAll = exportQuestionsToCsv(DEFAULT_QUESTIONS);
  const reimported = parseQuestionsImport(exportedAll);
  assert.equal(reimported.questions.length, DEFAULT_QUESTIONS.length);
  assert.equal(reimported.errors.length, 0);
});

test('pre-start session mode helpers & lock flags allow free switching before Start and lock after Start', () => {
  assert.equal(isFreeSessionMode('free_waiting'), true);
  assert.equal(isFreeSessionMode('free'), true);
  assert.equal(isFreeSessionMode('live_waiting'), false);

  assert.equal(isLiveSessionMode('live_waiting'), true);
  assert.equal(isLiveSessionMode('live_started'), true);
  assert.equal(isLiveSessionMode('free_waiting'), false);

  assert.equal(isSessionStarted('unconfigured'), false);
  assert.equal(isSessionStarted('free_waiting'), false);
  assert.equal(isSessionStarted('live_waiting'), false);
  assert.equal(isSessionStarted('free'), true);
  assert.equal(isSessionStarted('live_started'), true);

  assert.equal(isGlobalQuizTimerActive('free_waiting', { quizDurationMinutes: 20 }), true);

  const standbyPlayers = [
    { deviceId: 'w1', name: 'Budi', joinedAt: Date.now() },
  ];

  // With standby users in free_waiting or live_waiting (before Start), neither mode is locked out
  const freePreFlags = getSessionLockFlags('free_waiting', standbyPlayers, [], []);
  assert.equal(freePreFlags.isLiveLockedOut, false);
  assert.equal(freePreFlags.isFreeLockedOut, false);
  assert.equal(freePreFlags.waitingCount, 1);

  const livePreFlags = getSessionLockFlags('live_waiting', standbyPlayers, [], []);
  assert.equal(livePreFlags.isFreeLockedOut, false);
  assert.equal(livePreFlags.isLiveLockedOut, false);

  // Once live_started begins, Mode Bebas locks out
  const liveStartedFlags = getSessionLockFlags('live_started', [], [], []);
  assert.equal(liveStartedFlags.isFreeLockedOut, true);

  // Once an active free player starts, Mode Live locks out
  const freeStartedFlags = getSessionLockFlags(
    'free',
    [],
    [
      {
        deviceId: 'a1',
        name: 'Sari',
        mode: 'free',
        score: 900,
        correct: 1,
        currentQuestion: 1,
        totalQuestions: 30,
        startedAt: Date.now(),
        lastSeen: Date.now(),
      },
    ],
    []
  );
  assert.equal(freeStartedFlags.isLiveLockedOut, true);
});

test('mergeLiveAndFinishedLeaderboard preserves live correct count in Mode Bebas & prioritizes finished record', () => {
  const now = Date.now();
  const active: ActivePlayer[] = [
    {
      deviceId: 'dev-a',
      name: 'Andi',
      mode: 'free',
      score: 1850,
      correct: 2,
      currentQuestion: 3,
      totalQuestions: 30,
      startedAt: now,
      lastSeen: now,
    },
    {
      deviceId: 'dev-b',
      name: 'Bima',
      mode: 'free',
      score: 900,
      correct: 1,
      currentQuestion: 2,
      totalQuestions: 30,
      startedAt: now,
      lastSeen: now,
    },
  ];
  const finished: PlayerRecord[] = [
    {
      id: 'dev-b',
      deviceId: 'dev-b',
      name: 'Bima',
      score: 2500,
      correct: 3,
      totalQuestions: 30,
      history: [],
      completedAt: new Date(now).toISOString(),
    },
  ];

  const merged = mergeLiveAndFinishedLeaderboard(finished, active, 30, now);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].deviceId, 'dev-b');
  assert.equal(merged[0].status, 'finished');
  assert.equal(merged[0].correct, 3);
  assert.equal(merged[1].deviceId, 'dev-a');
  assert.equal(merged[1].status, 'playing');
  assert.equal(merged[1].correct, 2);
  assert.equal(merged[1].currentQuestion, 3);
});

