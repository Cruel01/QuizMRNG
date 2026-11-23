export type QuestionCategory =
  | 'Manusia & Hewan'
  | 'Logika & Hitungan'
  | 'Wawasan Nusantara';

export type QuestionType = 'MC' | 'TF' | 'MS' | 'TEXT';

export interface Question {
  id?: string;
  category: QuestionCategory | string;
  type: QuestionType;
  time: number;
  question: string;
  options?: string[];
  answer?: number | number[];
  acceptedAnswers?: string[];
  explanation: string;
}

export type PowerupId =
  | 'DOUBLE_SCORE'
  | 'FIFTY_FIFTY'
  | 'SHIELD'
  | 'FREEZE_LEADER'
  | 'GLITCH_SHUFFLE';

export type PowerupKind = 'buff' | 'debuff';

export interface PowerupSpec {
  id: PowerupId;
  name: string;
  kind: PowerupKind;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  weight: number;
  desc: string;
}

export interface QuestionHistoryItem {
  questionId?: string;
  questionIndex: number;
  question: string;
  category: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  maxTime: number;
  pointsEarned: number;
  explanation: string;
}

export interface PlayerRecord {
  id: string;
  deviceId: string;
  name: string;
  score: number;
  correct: number;
  totalQuestions: number;
  history: QuestionHistoryItem[];
  completedAt: string;
}

export type SessionMode =
  | 'unconfigured'
  | 'free'
  | 'live_waiting'
  | 'live_started';

export interface SessionState {
  mode: SessionMode;
  runId: string;
  updatedAt: number;
}

export interface WaitingPlayer {
  deviceId: string;
  name: string;
  joinedAt: number;
}

export interface ActivePlayer {
  deviceId: string;
  name: string;
  mode: SessionMode;
  score?: number;
  currentQuestion?: number;
  startedAt: number;
  lastSeen?: number;
}

export interface SabotageEvent {
  targetDeviceId: string;
  targetName: string;
  attackerDeviceId: string;
  attackerName: string;
  type: 'FREEZE_LEADER' | 'GLITCH_SHUFFLE';
  createdAt: number;
}

export interface InProgressState {
  deviceId: string;
  playerName: string;
  runId: string;
  currentQuestionIndex: number;
  score: number;
  correctCount: number;
  playerHistory: QuestionHistoryItem[];
  powerupInventory: (PowerupId | null)[];
  currentStreak: number;
  immuneQuestionsRemaining: number;
  awardedDebuffMilestones: number[];
  glitchShuffleActiveForNext: boolean;
  savedAt: number;
}

export type CloudStatus = 'connecting' | 'connected' | 'error';

export type ScreenName =
  | 'lobby'
  | 'waiting'
  | 'quiz'
  | 'leaderboard'
  | 'admin';
