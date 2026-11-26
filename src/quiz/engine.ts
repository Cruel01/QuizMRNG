import { MAX_POWERUP_SLOTS, POWERUP_CATALOG } from './questions';
import type {
  ActivePlayer,
  PlayerRecord,
  PowerupId,
  PowerupKind,
  Question,
  QuizSettings,
  SessionMode,
  WaitingPlayer,
} from './types';

export const STALE_ACTIVE_PLAYER_MS = 30 * 60 * 1000; // 30 menit
export const DEFAULT_FIREBASE_APP_ID = 'quizmrng-public-v1';

export function sanitizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 20);
}

export function getRoomFirebaseAppId(roomCode: string): string {
  const clean = sanitizeRoomCode(roomCode);
  if (!clean || clean === 'DEFAULT') return DEFAULT_FIREBASE_APP_ID;
  return `quizmrng-room-${clean}`;
}

export function generateDefaultRoomCode(prefix = 'RUANG'): string {
  const cleanPrefix = sanitizeRoomCode(prefix).slice(0, 10) || 'RUANG';
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return sanitizeRoomCode(`${cleanPrefix}-${suffix}`);
}

export function sanitizeImageUrl(raw?: string): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return '';
}

export interface CategorySummaryItem {
  key: string;
  label: string;
  count: number;
  hint: string;
  accent: string;
  kind: 'animals' | 'logic' | 'nusantara' | 'custom';
}

const KNOWN_CATEGORY_META: Record<
  string,
  Pick<CategorySummaryItem, 'hint' | 'accent' | 'kind'>
> = {
  'Manusia & Hewan': {
    hint: 'Anatomi tubuh, satwa unik, dan adaptasi biologi.',
    accent: 'text-emerald-400',
    kind: 'animals',
  },
  'Logika & Hitungan': {
    hint: 'Teka-teki logika, deret angka, dan aritmatika cepat.',
    accent: 'text-sky-400',
    kind: 'logic',
  },
  'Wawasan Nusantara': {
    hint: 'Geografi kepulauan, flora-fauna endemik, dan budaya.',
    accent: 'text-amber-400',
    kind: 'nusantara',
  },
};

export function getDynamicCategoryStats(
  questions: Question[]
): CategorySummaryItem[] {
  const counts = new Map<string, number>();
  questions.forEach((q) => {
    const key = (q.category || 'Umum').trim() || 'Umum';
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const customAccents = [
    'text-fuchsia-400',
    'text-cyan-400',
    'text-rose-400',
    'text-emerald-400',
  ];
  let customIdx = 0;

  return Array.from(counts.entries()).map(([key, count]) => {
    const known = KNOWN_CATEGORY_META[key];
    if (known) {
      return {
        key,
        label: key,
        count,
        hint: known.hint,
        accent: known.accent,
        kind: known.kind,
      };
    }
    const accent = customAccents[customIdx % customAccents.length];
    customIdx++;
    return {
      key,
      label: key,
      count,
      hint: `Topik khusus kategori ${key} (${count} pertanyaan siap dikerjakan).`,
      accent,
      kind: 'custom',
    };
  });
}

export function prepareQuizDeck(
  questions: Question[],
  settings: Pick<QuizSettings, 'shuffleQuestions' | 'questionLimit'>,
  rng: () => number = Math.random
): Question[] {
  const deck = [...questions];
  if (settings.shuffleQuestions) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  const limit = Math.max(0, Math.floor(Number(settings.questionLimit) || 0));
  if (limit > 0 && limit < deck.length) {
    return deck.slice(0, limit);
  }
  return deck;
}

export function computeShuffledOrder(
  length: number,
  shouldShuffle: boolean,
  rng: () => number = Math.random
): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  if (shouldShuffle && arr.length > 1) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}

export function getPlayerRankInfo(
  leaderboard: PlayerRecord[],
  deviceId: string
): { rank: number | null; total: number } {
  const sorted = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));
  const idx = sorted.findIndex((p) => p.deviceId === deviceId);
  return {
    rank: idx >= 0 ? idx + 1 : null,
    total: sorted.length,
  };
}

export function filterQuestionsForAdmin(
  questions: Question[],
  query: string,
  categoryFilter: string = 'ALL',
  typeFilter: string = 'ALL'
): Array<{ question: Question; index: number }> {
  const qLower = query.trim().toLowerCase();
  return questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => {
      if (categoryFilter !== 'ALL' && question.category !== categoryFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && question.type !== typeFilter) {
        return false;
      }
      if (qLower) {
        const hay = `${question.question} ${question.category} ${question.explanation || ''}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
}

export function getStreakRewardTarget(totalQuestions: number): number {
  return Math.max(3, Math.round((totalQuestions || 30) * 0.25));
}

export function getDebuffMilestones(totalQuestions: number): number[] {
  const milestones: number[] = [];
  if (totalQuestions >= 6) {
    milestones.push(Math.ceil(totalQuestions / 2));
  }
  for (let m = 10; m <= totalQuestions; m += 10) {
    if (!milestones.includes(m)) {
      milestones.push(m);
    }
  }
  return milestones.sort((a, b) => a - b);
}

export function normalizeTextAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function evaluateAnswer(
  question: Question,
  selection: number | number[] | string
): {
  isCorrect: boolean;
  userAnswerText: string;
  correctAnswerText: string;
} {
  if (question.type === 'MC' || question.type === 'TF') {
    const selectedIdx = typeof selection === 'number' ? selection : -1;
    const correctIdx = typeof question.answer === 'number' ? question.answer : 0;
    const opts = question.options || [];
    return {
      isCorrect: selectedIdx === correctIdx,
      userAnswerText: opts[selectedIdx] ?? 'Tidak dijawab',
      correctAnswerText: opts[correctIdx] ?? '',
    };
  }

  if (question.type === 'MS') {
    const selectedArr = Array.isArray(selection)
      ? [...selection].sort((a, b) => a - b)
      : [];
    const correctArr = Array.isArray(question.answer)
      ? [...question.answer].sort((a, b) => a - b)
      : [];
    const opts = question.options || [];
    const isCorrect =
      selectedArr.length === correctArr.length &&
      selectedArr.every((v, i) => v === correctArr[i]);
    return {
      isCorrect,
      userAnswerText: selectedArr.map((i) => opts[i]).filter(Boolean).join(', '),
      correctAnswerText: correctArr.map((i) => opts[i]).filter(Boolean).join(', '),
    };
  }

  // TEXT
  const raw = typeof selection === 'string' ? selection : '';
  const normalized = normalizeTextAnswer(raw);
  const accepted = question.acceptedAnswers || [];
  const isCorrect =
    normalized.length > 0 &&
    accepted.some((ans) => normalizeTextAnswer(ans) === normalized);
  return {
    isCorrect,
    userAnswerText: raw.trim(),
    correctAnswerText: (accepted[0] || '').toUpperCase(),
  };
}

export function getCorrectAnswerDisplay(question: Question): string {
  const opts = question.options || [];
  if (question.type === 'MC' || question.type === 'TF') {
    const idx = typeof question.answer === 'number' ? question.answer : 0;
    return opts[idx] ?? '';
  }
  if (question.type === 'MS') {
    const arr = Array.isArray(question.answer) ? question.answer : [];
    return arr.map((i) => opts[i]).filter(Boolean).join(', ');
  }
  return ((question.acceptedAnswers || [])[0] || '').toUpperCase();
}

export function calculateEarnedPoints(
  isCorrect: boolean,
  timeLeft: number,
  totalTime: number,
  doubleScoreActive: boolean
): number {
  if (!isCorrect) return 0;
  const safeTotal = Math.max(1, totalTime);
  const clampedLeft = Math.max(0, Math.min(safeTotal, timeLeft));
  const speedBonus = Math.round((clampedLeft / safeTotal) * 400);
  const base = 600 + speedBonus;
  return doubleScoreActive ? base * 2 : base;
}

export function rollWeightedPowerup(
  onlyKind: PowerupKind | null = null,
  rng: () => number = Math.random
): PowerupId {
  const pool = Object.values(POWERUP_CATALOG).filter(
    (item) => !onlyKind || item.kind === onlyKind
  );
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let r = rng() * totalWeight;
  for (const item of pool) {
    if (r < item.weight) return item.id;
    r -= item.weight;
  }
  return pool[0]?.id ?? 'FIFTY_FIFTY';
}

export function grantPowerupToSlots(
  inventory: (PowerupId | null)[],
  powerupId: PowerupId
): {
  nextInventory: (PowerupId | null)[];
  granted: boolean;
  bonusPoints: number;
} {
  const next = [...inventory];
  while (next.length < MAX_POWERUP_SLOTS) next.push(null);

  const emptyIdx = next.findIndex((slot) => slot === null);
  if (emptyIdx === -1) {
    return {
      nextInventory: next,
      granted: false,
      bonusPoints: 50,
    };
  }
  next[emptyIdx] = powerupId;
  return {
    nextInventory: next,
    granted: true,
    bonusPoints: 0,
  };
}

export function filterFreshActivePlayers(
  activePlayers: ActivePlayer[],
  now: number = Date.now()
): ActivePlayer[] {
  return activePlayers.filter((p) => {
    const refTime = p.lastSeen ?? p.startedAt ?? 0;
    return now - refTime <= STALE_ACTIVE_PLAYER_MS;
  });
}

export function pickSabotageTarget(
  activePlayers: ActivePlayer[],
  leaderboardPlayers: PlayerRecord[],
  selfDeviceId: string,
  now: number = Date.now()
): { deviceId: string; name: string; score: number } | null {
  const freshActive = filterFreshActivePlayers(activePlayers, now).filter(
    (p) => p.deviceId && p.deviceId !== selfDeviceId
  );

  if (freshActive.length > 0) {
    const sorted = [...freshActive].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
    return {
      deviceId: sorted[0].deviceId,
      name: sorted[0].name,
      score: sorted[0].score ?? 0,
    };
  }

  const lbCandidates = leaderboardPlayers.filter(
    (p) => p.deviceId && p.deviceId !== selfDeviceId
  );
  if (lbCandidates.length > 0) {
    const sorted = [...lbCandidates].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
    return {
      deviceId: sorted[0].deviceId,
      name: sorted[0].name,
      score: sorted[0].score ?? 0,
    };
  }

  return null;
}

export function getSessionLockFlags(
  sessionMode: SessionMode,
  waitingPlayers: WaitingPlayer[],
  activePlayers: ActivePlayer[],
  leaderboardPlayers: PlayerRecord[],
  now: number = Date.now()
) {
  const freshActive = filterFreshActivePlayers(activePlayers, now);
  const hasFreeEngagement =
    leaderboardPlayers.length > 0 ||
    freshActive.some((p) => p.mode === 'free' || !p.mode);
  const hasLiveEngagement =
    waitingPlayers.length > 0 ||
    sessionMode === 'live_started' ||
    freshActive.some(
      (p) => p.mode === 'live_waiting' || p.mode === 'live_started'
    );

  const isFreeLockedOut =
    (sessionMode === 'live_waiting' || sessionMode === 'live_started') &&
    hasLiveEngagement;
  const isLiveLockedOut = sessionMode === 'free' && hasFreeEngagement;

  return {
    hasFreeEngagement,
    hasLiveEngagement,
    isFreeLockedOut,
    isLiveLockedOut,
    freshActiveCount: freshActive.length,
  };
}

export function computeAdminStats(
  leaderboard: PlayerRecord[],
  questions: Question[]
) {
  const totalPlayers = leaderboard.length;
  const totalQ = Math.max(1, questions.length);

  if (totalPlayers === 0) {
    return {
      totalPlayers: 0,
      avgScore: 0,
      maxScore: 0,
      avgCorrectPct: 0,
      questionStats: questions.map((q, idx) => ({
        index: idx,
        category: q.category,
        question: q.question,
        answeredCount: 0,
        correctTimes: 0,
        accuracyPct: 0,
      })),
    };
  }

  const sumScore = leaderboard.reduce((acc, p) => acc + (p.score || 0), 0);
  const maxScore = Math.max(...leaderboard.map((p) => p.score || 0));
  const avgCorrectPct = Math.round(
    leaderboard.reduce(
      (acc, p) => acc + ((p.correct || 0) / (p.totalQuestions || totalQ)) * 100,
      0
    ) / totalPlayers
  );

  const questionStats = questions.map((q, idx) => {
    let answeredCount = 0;
    let correctTimes = 0;
    leaderboard.forEach((p) => {
      if (!Array.isArray(p.history)) return;
      const match =
        (q.id && p.history.find((h) => h.questionId === q.id)) ||
        p.history.find((h) => h.question === q.question) ||
        p.history[idx];
      if (match) {
        answeredCount++;
        if (match.isCorrect) correctTimes++;
      }
    });
    return {
      index: idx,
      category: q.category,
      question: q.question,
      answeredCount,
      correctTimes,
      accuracyPct:
        answeredCount > 0 ? Math.round((correctTimes / answeredCount) * 100) : 0,
    };
  });

  return {
    totalPlayers,
    avgScore: Math.round(sumScore / totalPlayers),
    maxScore,
    avgCorrectPct,
    questionStats,
  };
}

export function buildCsvContent(
  leaderboard: PlayerRecord[],
  questions: Question[]
): string {
  const headers = [
    'Rank',
    'Nama Peserta',
    'Benar',
    'Total Soal',
    'Skor',
    'Soal Salah',
    'Soal Tercepat',
    'Total Waktu (Detik)',
    'Waktu Selesai',
    'ID Perangkat',
  ];

  const sorted = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = sorted.map((p, idx) => {
    const hist = Array.isArray(p.history) ? p.history : [];
    const wrongList =
      hist
        .map((h, i) => (!h.isCorrect ? `No.${i + 1}` : null))
        .filter(Boolean)
        .join('; ') || 'Tidak ada';

    let totalSec = 0;
    let fastStr = '-';
    let minSec = Infinity;
    hist.forEach((h, i) => {
      if (typeof h.timeTaken === 'number') {
        totalSec += h.timeTaken;
        if (h.timeTaken < minSec) {
          minSec = h.timeTaken;
          fastStr = `No.${i + 1} (${h.timeTaken}d)`;
        }
      }
    });

    return [
      idx + 1,
      escapeCell(p.name || ''),
      p.correct || 0,
      p.totalQuestions || questions.length,
      p.score || 0,
      escapeCell(wrongList),
      escapeCell(fastStr),
      totalSec || '-',
      escapeCell(
        p.completedAt ? new Date(p.completedAt).toLocaleString('id-ID') : '-'
      ),
      escapeCell(p.deviceId || '-'),
    ].join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

const memoryStorage: Record<string, string> = {};

export function safeGetStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryStorage[key] ?? null;
  }
}

export function safeSetStorage(key: string, value: string): void {
  memoryStorage[key] = value;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore restricted third-party iframe storage errors
  }
}

export function safeRemoveStorage(key: string): void {
  delete memoryStorage[key];
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore restricted third-party iframe storage errors
  }
}

export function getOrCreateDeviceId(): string {
  const key = 'quiz_device_fingerprint_v1';
  let id = safeGetStorage(key);
  if (!id) {
    let tz = 'UTC';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      // ignore
    }
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'UA';
    const sw = typeof screen !== 'undefined' ? screen.width : 0;
    const sh = typeof screen !== 'undefined' ? screen.height : 0;
    const raw = [ua, `${sw}x${sh}`, tz, Math.random().toString(36).slice(2, 10)].join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    id =
      'DEV-' +
      Math.abs(hash).toString(36).toUpperCase() +
      '-' +
      Date.now().toString(36).toUpperCase();
    safeSetStorage(key, id);
  }
  return id;
}
