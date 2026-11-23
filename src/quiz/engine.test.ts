import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCsvContent,
  calculateEarnedPoints,
  computeAdminStats,
  evaluateAnswer,
  getDebuffMilestones,
  getSessionLockFlags,
  getStreakRewardTarget,
  grantPowerupToSlots,
  pickSabotageTarget,
  rollWeightedPowerup,
  STALE_ACTIVE_PLAYER_MS,
} from './engine';
import { DEFAULT_QUESTIONS } from './questions';
import { generateGoogleSitesHtml } from './googleSitesExport';
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

test('generateGoogleSitesHtml embeds current questions and quizmrng Firebase config', () => {
  const html = generateGoogleSitesHtml(DEFAULT_QUESTIONS);
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('quizmrng.firebaseapp.com'));
  assert.ok(html.includes('Gurita'));
  assert.ok(html.includes('URL.createObjectURL'));
});
