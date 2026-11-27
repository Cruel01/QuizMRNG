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
  imageUrl?: string;
  options?: string[];
  answer?: number | number[];
  acceptedAnswers?: string[];
  explanation: string;
}

export type GameplayMode = 'classic' | 'voyage';

export type ParticipationMode = 'solo' | 'team' | 'either';

export interface QuizSettings {
  allowReplay: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionLimit: number;
  compactMode: boolean;
  adminPin: string;
  quizDurationMinutes: number;
  gameplayMode: GameplayMode;
  participationMode: ParticipationMode;
  showLiveLeaderboardToPlayers: boolean;
  updatedAt?: number;
}

export type PowerupId =
  | 'DOUBLE_SCORE'
  | 'FIFTY_FIFTY'
  | 'SHIELD'
  | 'FREEZE_LEADER'
  | 'GLITCH_SHUFFLE'
  | 'TORNADO';

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
  teamName?: string;
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
  teamName?: string;
  joinedAt: number;
}

export interface ActivePlayer {
  deviceId: string;
  name: string;
  teamName?: string;
  mode: SessionMode;
  score?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  startedAt: number;
  lastSeen?: number;
}

export interface SabotageEvent {
  targetDeviceId: string;
  targetName: string;
  attackerDeviceId: string;
  attackerName: string;
  type: 'FREEZE_LEADER' | 'GLITCH_SHUFFLE' | 'TORNADO';
  createdAt: number;
}

export interface InProgressState {
  deviceId: string;
  playerName: string;
  teamName?: string;
  runId: string;
  roomCode?: string;
  questionIds?: string[];
  currentQuestionIndex: number;
  score: number;
  correctCount: number;
  playerHistory: QuestionHistoryItem[];
  powerupInventory: (PowerupId | null)[];
  currentStreak: number;
  immuneQuestionsRemaining: number;
  awardedDebuffMilestones: number[];
  glitchShuffleActiveForNext: boolean;
  globalTimeLeftSeconds?: number;
  visitedIslands?: number[];
  savedAt: number;
}

export interface VoyageCheckpoint {
  islandIndex: number;
  islandNumber: number;
  name: string;
  questionNumber: number;
  legStartQuestion: number;
  positionPercent: number;
}

export interface VoyageProgressState {
  checkpoints: VoyageCheckpoint[];
  totalIslands: number;
  completedIslands: number;
  currentLegIndex: number;
  legStep: 0 | 1 | 2 | 3;
  nextIsland: VoyageCheckpoint | null;
  dockedIsland: VoyageCheckpoint | null;
  shipPercent: number;
}

export interface TeamLeaderboardEntry {
  teamName: string;
  isSolo: boolean;
  memberCount: number;
  members: string[];
  totalScore: number;
  avgScore: number;
  totalCorrect: number;
}

export interface MergedLeaderboardRow {
  deviceId: string;
  name: string;
  teamName?: string;
  score: number;
  correct: number;
  currentQuestion: number;
  totalQuestions: number;
  status: 'finished' | 'playing';
}

export type CloudStatus = 'connecting' | 'connected' | 'error';

export type ScreenName =
  | 'lobby'
  | 'waiting'
  | 'quiz'
  | 'leaderboard'
  | 'admin';
