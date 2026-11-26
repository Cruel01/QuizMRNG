import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvContent,
  calculateEarnedPoints,
  computeAdminStats,
  evaluateAnswer,
  generateDefaultRoomCode,
  getDebuffMilestones,
  getSessionLockFlags,
  getStreakRewardTarget,
  grantPowerupToSlots,
  pickSabotageTarget,
  rollWeightedPowerup,
  sanitizeRoomCode,
  STALE_ACTIVE_PLAYER_MS,
} from './engine';
import { DEFAULT_QUESTIONS } from './questions';
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

test('calculateEarnedPoints computes speed bonus and 2x multiplier', () => {
  assert.equal(calculateEarnedPoints(false, 20, 25, true), 0);
  assert.equal(calculateEarnedPoints(true, 25, 25, false), 1000);
  assert.equal(calculateEarnedPoints(true, 25, 25, true), 2000);
  assert.equal(calculateEarnedPoints(true, 0, 25, false), 600);
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

test('rollWeightedPowerup filters by kind and returns valid IDs', () => {
  const buff = rollWeightedPowerup('buff', () => 0.5);
  assert.ok(['DOUBLE_SCORE', 'FIFTY_FIFTY', 'SHIELD'].includes(buff));
  const debuff = rollWeightedPowerup('debuff', () => 0.1);
  assert.ok(['FREEZE_LEADER', 'GLITCH_SHUFFLE'].includes(debuff));
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

test('computeAdminStats & buildCsvContent format metrics and handle # safely', () => {
  const records: PlayerRecord[] = [
    {
      id: 'D1',
      deviceId: 'D1',
      name: 'Sari "Pro"',
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
  assert.ok(csv.startsWith('\uFEFFRank,Nama Peserta'));
  assert.ok(csv.includes('"Sari ""Pro"""'));
  assert.ok(csv.includes('No.2 (2d)'));
});

test('generateGoogleSitesHtml embeds current questions, full parity UX, Admin 3-tab CSV import, and excludes Publish & Embed', () => {
  const html = generateGoogleSitesHtml(
    DEFAULT_QUESTIONS,
    {
      allowReplay: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      questionLimit: 10,
      compactMode: false,
      adminPin: '9988',
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

  // Admin Step 1 (Room Priority) & Step 2 (Mode Pelaksanaan lock)
  assert.ok(html.includes('admin-current-room-display'));
  assert.ok(html.includes('admin-mode-locked-banner'));
  assert.ok(html.includes('generateAdminRoomCode'));
  assert.ok(html.includes('adminConfirmRoomStep'));
  assert.ok(html.includes('Buat Kode Acak'));
  assert.ok(html.includes('LANGKAH 1'));
  assert.ok(html.includes('LANGKAH 2'));

  // Admin tabs & CSV import parity without Publish & Embed or browser dialogs
  assert.ok(html.includes('Kontrol Sesi'));
  assert.ok(html.includes('Statistik &amp; Peserta'));
  assert.ok(html.includes('Bank Soal'));
  assert.ok(html.includes('Impor CSV / Excel'));
  assert.ok(html.includes('Ekspor Soal CSV'));
  assert.ok(html.includes('modal-admin-import'));
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
