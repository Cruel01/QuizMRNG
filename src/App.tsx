import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { DoorOpen, ShieldCheck, X } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { IslandMinigameModal, type IslandMinigameReward } from './components/IslandMinigameModal';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { LiveLeaderboardModal } from './components/LiveLeaderboardModal';
import { LobbyScreen } from './components/LobbyScreen';
import { QuizScreen, type QuestionFeedbackState } from './components/QuizScreen';
import { WaitingRoomScreen } from './components/WaitingRoomScreen';
import {
  calculateEarnedPoints,
  computeShuffledOrder,
  evaluateAnswer,
  getCorrectAnswerDisplay,
  getDebuffMilestones,
  getEffectiveParticipationMode,
  getEnabledPowerups,
  getOrCreateDeviceId,
  getSessionLockFlags,
  getStreakRewardTarget,
  getVoyageProgressState,
  grantPowerupToSlots,
  isGamificationActive,
  isGlobalQuizTimerActive,
  isMilestoneDropActive,
  isPowerupEnabled,
  isStreakRewardActive,
  parseClassGateInput,
  pickSabotageTarget,
  prepareQuizDeck,
  rollAllowedPowerup,
  safeGetStorage,
  safeRemoveStorage,
  safeSetStorage,
  sanitizeRoomCode,
} from './quiz/engine';
import {
  clearActiveSessionPlayersCloud,
  deleteSingleParticipantFromCloud,
  fetchCloudLeaderboardOnce,
  initFirebaseSync,
  joinWaitingRoomCloud,
  leaveWaitingRoomCloud,
  resetCloudLeaderboard,
  saveQuestionsToCloud,
  saveQuizSettingsToCloud,
  saveScoreToCloud,
  saveSessionStateToCloud,
  sendSabotageToCloud,
  unregisterActivePlayerCloud,
  upsertActivePlayerCloud,
} from './quiz/firebaseSync';
import {
  DEFAULT_QUESTIONS,
  DEFAULT_QUIZ_SETTINGS,
  POWERUP_CATALOG,
} from './quiz/questions';
import {
  getSoundMuted,
  playCorrectFx,
  playCountdownGoFx,
  playCountdownTickFx,
  playFinishFx,
  playFreezeFx,
  playIslandDockFx,
  playPopClickFx,
  playPowerupFx,
  playStreakComboFx,
  playTornadoFx,
  playUrgentTickFx,
  playWrongFx,
  setSoundMuted,
} from './quiz/soundFx';
import type {
  ActivePlayer,
  CloudStatus,
  InProgressState,
  PlayerRecord,
  PowerupId,
  Question,
  QuestionHistoryItem,
  QuizSettings,
  SabotageEvent,
  ScreenName,
  SessionMode,
  VoyageCheckpoint,
  WaitingPlayer,
} from './quiz/types';

const CUSTOM_QUESTIONS_STORAGE_KEY_PREFIX = 'quiz_custom_questions_v2_';
const SETTINGS_STORAGE_KEY_PREFIX = 'quiz_settings_v1_';
const IN_PROGRESS_KEY_PREFIX = 'quiz_in_progress_v1_';
const ROOM_CODE_STORAGE_KEY = 'quiz_active_room_code_v1';

function readInitialRoomCode(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramRoom = params.get('room');
    if (paramRoom !== null) {
      return sanitizeRoomCode(paramRoom);
    }
  } catch {
    // ignore
  }
  return sanitizeRoomCode(safeGetStorage(ROOM_CODE_STORAGE_KEY) || '');
}

function readInitialCompactParam(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('compact') === '1';
  } catch {
    return false;
  }
}

function hasExplicitRoomOrAutostartParam(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') !== null || params.get('autostart') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [roomCode, setRoomCode] = useState<string>(() => readInitialRoomCode());
  const [roomGateUnlocked, setRoomGateUnlocked] = useState<boolean>(() =>
    hasExplicitRoomOrAutostartParam()
  );
  const [roomGateInput, setRoomGateInput] = useState<string>('');
  const [roomGateError, setRoomGateError] = useState<string>('');

  const storageScope = roomCode || 'default';

  const [questions, setQuestions] = useState<Question[]>(() => {
    const raw =
      safeGetStorage(CUSTOM_QUESTIONS_STORAGE_KEY_PREFIX + storageScope) ||
      (!roomCode ? safeGetStorage('quiz_custom_questions_v2') : null);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return DEFAULT_QUESTIONS;
  });

  const [settings, setSettings] = useState<QuizSettings>(() => {
    const compactParam = readInitialCompactParam();
    const raw = safeGetStorage(SETTINGS_STORAGE_KEY_PREFIX + storageScope);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<QuizSettings>;
        return {
          ...DEFAULT_QUIZ_SETTINGS,
          ...parsed,
          compactMode: compactParam || Boolean(parsed.compactMode),
        };
      } catch {
        // ignore
      }
    }
    return { ...DEFAULT_QUIZ_SETTINGS, compactMode: compactParam };
  });

  // Cloud & Session state
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');
  const [cloudLabel, setCloudLabel] = useState('Menghubungkan Cloud...');
  const [sessionMode, setSessionMode] = useState<SessionMode>('unconfigured');
  const [liveRunId, setLiveRunId] = useState('default');
  const [waitingPlayers, setWaitingPlayers] = useState<WaitingPlayer[]>([]);
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerRecord[]>([]);

  // Device lock & saved record (scoped per room)
  const completedRecordKey = `quiz_completed_record_${storageScope}_${deviceId}`;
  const [savedRecord, setSavedRecord] = useState<PlayerRecord | null>(() => {
    const raw =
      safeGetStorage(completedRecordKey) ||
      (!roomCode ? safeGetStorage('quiz_completed_record_' + deviceId) : null);
    if (raw) {
      try {
        return JSON.parse(raw) as PlayerRecord;
      } catch {
        return null;
      }
    }
    return null;
  });
  const hasPlayedThisDevice = Boolean(savedRecord);

  // Recoverable mid-quiz state
  const inProgressKey = `${IN_PROGRESS_KEY_PREFIX}${storageScope}_${deviceId}`;
  const [recoverableProgress, setRecoverableProgress] =
    useState<InProgressState | null>(() => {
      const raw = safeGetStorage(inProgressKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as InProgressState;
          if (
            parsed &&
            parsed.playerName &&
            Date.now() - (parsed.savedAt || 0) < 30 * 60 * 1000
          ) {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
      return null;
    });

  // Navigation & UI state
  const [screen, setScreen] = useState<ScreenName>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [teamModeChoice, setTeamModeChoice] = useState<'solo' | 'team'>('solo');
  const [teamName, setTeamName] = useState('');
  const [nameError, setNameError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(() => getSoundMuted());
  const [showConfetti, setShowConfetti] = useState(false);
  const [liveLbModalOpen, setLiveLbModalOpen] = useState(false);

  // Admin & Room modal state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomInputDraft, setRoomInputDraft] = useState(roomCode);

  // Pre-Quiz 3-2-1 Countdown Overlay state
  const [preCountdown, setPreCountdown] = useState<number | null>(null);

  // Active Quiz Gameplay Deck & state
  const [playDeck, setPlayDeck] = useState<Question[]>(questions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(0);
  const [totalGlobalSeconds, setTotalGlobalSeconds] = useState(0);
  const [playerHistory, setPlayerHistory] = useState<QuestionHistoryItem[]>([]);
  const [powerupInventory, setPowerupInventory] = useState<(PowerupId | null)[]>([
    null,
    null,
  ]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [doubleScoreActive, setDoubleScoreActive] = useState(false);
  const [powerupUsedThisQuestion, setPowerupUsedThisQuestion] = useState(false);
  const [immuneQuestionsRemaining, setImmuneQuestionsRemaining] = useState(0);
  const [glitchShuffleForNext, setGlitchShuffleForNext] = useState(false);
  const [glitchShake, setGlitchShake] = useState(false);
  const [awardedDebuffMilestones, setAwardedDebuffMilestones] = useState<number[]>(
    []
  );

  // Voyage & Island Minigame state
  const [dockedIslandModal, setDockedIslandModal] =
    useState<VoyageCheckpoint | null>(null);
  const [visitedIslands, setVisitedIslands] = useState<number[]>([]);

  // Freeze & Tornado debuff state
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeCountdown, setFreezeCountdown] = useState(0);
  const [freezeAttackerName, setFreezeAttackerName] = useState('');
  const [tornadoCountdown, setTornadoCountdown] = useState(0);
  const [tornadoAttackerName, setTornadoAttackerName] = useState('');

  // Question interaction state
  const [optionOrder, setOptionOrder] = useState<number[]>([0, 1, 2, 3]);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [selectedSingleIndex, setSelectedSingleIndex] = useState<number | null>(
    null
  );
  const [selectedMultipleIndices, setSelectedMultipleIndices] = useState<number[]>(
    []
  );
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState<QuestionFeedbackState | null>(null);

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const immuneRef = useRef(immuneQuestionsRemaining);
  immuneRef.current = immuneQuestionsRemaining;
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const playDeckRef = useRef(playDeck);
  playDeckRef.current = playDeck;
  const currentQIdxRef = useRef(currentQuestionIndex);
  currentQIdxRef.current = currentQuestionIndex;
  const toastTimerRef = useRef<number | null>(null);
  const isAutostartDemoRef = useRef(false);

  const gamificationActive = isGamificationActive(settings);
  const enabledPowerups = useMemo(
    () => getEnabledPowerups(settings),
    [settings]
  );
  const streakEnabled = settings.streakEnabled !== false;
  const milestoneDropsEnabled = settings.milestoneDropsEnabled !== false;

  const isGlobalTimer = useMemo(
    () => isGlobalQuizTimerActive(sessionMode, settings),
    [sessionMode, settings]
  );

  const effectivePartMode = useMemo(
    () => getEffectiveParticipationMode(settings),
    [settings]
  );

  const resolvedTeamName = useMemo(() => {
    if (effectivePartMode === 'solo') return '';
    if (effectivePartMode === 'team') return teamName.trim();
    return teamModeChoice === 'team' ? teamName.trim() : '';
  }, [effectivePartMode, teamModeChoice, teamName]);

  const voyageProgress = useMemo(() => {
    if (settings.gameplayMode !== 'voyage') return null;
    return getVoyageProgressState(playerHistory.length, playDeck.length);
  }, [settings.gameplayMode, playerHistory.length, playDeck.length]);

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  }, []);

  const prepareQuestionView = useCallback(
    (
      idx: number,
      qList: Question[],
      shouldGlitchShuffle: boolean,
      currentInv: (PowerupId | null)[],
      currentScoreVal: number,
      currentMilestones: number[],
      currentImmune: number,
      settingsOverride?: QuizSettings
    ) => {
      const q = qList[idx];
      if (!q) return;
      const effectiveSettings = settingsOverride || settings;
      const effectiveGamification = isGamificationActive(effectiveSettings);

      setSelectedSingleIndex(null);
      setSelectedMultipleIndices([]);
      setTextAnswer('');
      setEliminatedIndices([]);
      setFeedback(null);
      setDoubleScoreActive(false);
      setPowerupUsedThisQuestion(false);
      setTimeLeft(q.time || 25);

      const nextImmune = Math.max(0, currentImmune - 1);
      setImmuneQuestionsRemaining(nextImmune);

      const optLen = (q.options || []).length;
      const shouldShuffleOpts =
        (q.type === 'MC' || q.type === 'MS') &&
        ((effectiveGamification && shouldGlitchShuffle) ||
          effectiveSettings.shuffleOptions);
      setOptionOrder(computeShuffledOrder(optLen, shouldShuffleOpts));

      if (
        effectiveGamification &&
        shouldGlitchShuffle &&
        (q.type === 'MC' || q.type === 'MS')
      ) {
        setGlitchShuffleForNext(false);
        setGlitchShake(true);
        window.setTimeout(() => setGlitchShake(false), 750);
      } else if (shouldGlitchShuffle) {
        setGlitchShuffleForNext(false);
      }

      if (!isMilestoneDropActive(effectiveSettings)) return;

      const qNum = idx + 1;
      const milestones = getDebuffMilestones(qList.length);
      if (milestones.includes(qNum) && !currentMilestones.includes(qNum)) {
        const rolled = rollAllowedPowerup(
          'debuff',
          getEnabledPowerups(effectiveSettings)
        );
        if (!rolled) return;
        const updatedMilestones = [...currentMilestones, qNum];
        setAwardedDebuffMilestones(updatedMilestones);
        const grantRes = grantPowerupToSlots(currentInv, rolled);
        setPowerupInventory(grantRes.nextInventory);
        if (grantRes.bonusPoints > 0) {
          setScore(currentScoreVal + grantRes.bonusPoints);
          notify(
            `Slot penuh! Bonus Soal #${qNum} dikonversi menjadi +${grantRes.bonusPoints} poin.`
          );
        } else {
          notify(`Bonus Soal #${qNum}: Dapat item ${POWERUP_CATALOG[rolled].name}!`);
        }
      }
    },
    [notify, settings]
  );

  const startGameplay = useCallback(
    (
      name: string,
      modeUsed: SessionMode,
      runIdUsed: string,
      localOnly = false,
      skipCountdown = false,
      settingsOverride?: QuizSettings,
      teamOverride?: string
    ) => {
      const activeSettings = settingsOverride || settings;
      const effectiveTeam =
        teamOverride !== undefined ? teamOverride : resolvedTeamName;
      const sourceList = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
      const deck = prepareQuizDeck(sourceList, activeSettings);
      setPlayDeck(deck);

      const globalEnabled = isGlobalQuizTimerActive(modeUsed, activeSettings);
      const initialGlobalSecs = globalEnabled
        ? Math.max(60, Math.round((activeSettings.quizDurationMinutes || 0) * 60))
        : 0;
      setTotalGlobalSeconds(initialGlobalSecs);
      setGlobalTimeLeft(initialGlobalSecs);

      if (!localOnly) {
        leaveWaitingRoomCloud(deviceId);
        upsertActivePlayerCloud({
          deviceId,
          name,
          teamName: effectiveTeam || undefined,
          mode: modeUsed,
          score: 0,
          currentQuestion: 1,
          totalQuestions: deck.length,
          startedAt: Date.now(),
          lastSeen: Date.now(),
        });
      }

      setPlayerName(name);
      setCurrentQuestionIndex(0);
      setScore(0);
      setCorrectCount(0);
      setPlayerHistory([]);
      setPowerupInventory([null, null]);
      setCurrentStreak(0);
      setAwardedDebuffMilestones([]);
      setImmuneQuestionsRemaining(0);
      setGlitchShuffleForNext(false);
      setIsFrozen(false);
      setFreezeCountdown(0);
      setTornadoCountdown(0);
      setTornadoAttackerName('');
      setDockedIslandModal(null);
      setVisitedIslands([]);
      setRecoverableProgress(null);
      setShowConfetti(false);

      setScreen('quiz');
      prepareQuestionView(
        0,
        deck,
        false,
        [null, null],
        0,
        [],
        0,
        activeSettings
      );

      if (!skipCountdown) {
        setPreCountdown(3);
        playCountdownTickFx(3);
      } else {
        setPreCountdown(null);
      }

      if (!localOnly) {
        safeSetStorage(
          inProgressKey,
          JSON.stringify({
            deviceId,
            playerName: name,
            teamName: effectiveTeam || undefined,
            runId: runIdUsed,
            roomCode,
            questionIds: deck.map((q) => q.id || q.question),
            currentQuestionIndex: 0,
            score: 0,
            correctCount: 0,
            playerHistory: [],
            powerupInventory: [null, null],
            currentStreak: 0,
            immuneQuestionsRemaining: 0,
            awardedDebuffMilestones: [],
            glitchShuffleActiveForNext: false,
            globalTimeLeftSeconds: initialGlobalSecs || undefined,
            visitedIslands: [],
            savedAt: Date.now(),
          } satisfies InProgressState)
        );
      }
    },
    [
      deviceId,
      inProgressKey,
      prepareQuestionView,
      questions,
      resolvedTeamName,
      roomCode,
      settings,
    ]
  );

  // Support ?autostart=1 for automated testing & quick local preview launch
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        isAutostartDemoRef.current = true;
        const voyageFlag = params.get('voyage') === '1';
        const timerParam = Number(params.get('timer') || 0);
        const teamParam = (params.get('team') || '').trim();
        const showLbParam = params.get('live_lb') === '1';
        const gamificationParam = params.get('gamification');

        const demoSettings: QuizSettings = {
          ...settings,
          gameplayMode: voyageFlag ? 'voyage' : settings.gameplayMode,
          quizDurationMinutes:
            Number.isFinite(timerParam) && timerParam > 0
              ? timerParam
              : settings.quizDurationMinutes,
          showLiveLeaderboardToPlayers:
            showLbParam || settings.showLiveLeaderboardToPlayers,
          gamificationEnabled:
            gamificationParam === '0'
              ? false
              : gamificationParam === '1'
                ? true
                : settings.gamificationEnabled,
        };
        if (teamParam) {
          setTeamModeChoice('team');
          setTeamName(teamParam);
        }
        setSettings(demoSettings);
        setSessionMode('free');
        startGameplay(
          'Pemain Uji',
          'free',
          'autostart',
          true,
          true,
          demoSettings,
          teamParam
        );
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-quiz 3-2-1 countdown effect
  useEffect(() => {
    if (preCountdown === null) return;
    const t = window.setTimeout(() => {
      if (preCountdown <= 1) {
        setPreCountdown(null);
        playCountdownGoFx();
      } else {
        const nextStep = preCountdown - 1;
        setPreCountdown(nextStep);
        playCountdownTickFx(nextStep);
      }
    }, 850);
    return () => window.clearTimeout(t);
  }, [preCountdown]);

  // Initialize / Re-initialize Firebase Cloud sync when roomCode changes
  useEffect(() => {
    setCloudStatus('connecting');
    setCloudLabel('Menghubungkan Cloud...');
    const unsub = initFirebaseSync({
      deviceId,
      roomCode,
      onStatusChange: (status, label) => {
        setCloudStatus(status);
        setCloudLabel(label);
      },
      onLeaderboardUpdate: (records, foundSelf) => {
        setLeaderboard(records);
        if (foundSelf) {
          safeSetStorage(completedRecordKey, JSON.stringify(foundSelf));
          setSavedRecord(foundSelf);
        } else if (!isAutostartDemoRef.current) {
          const localRaw = safeGetStorage(completedRecordKey);
          if (localRaw) {
            safeRemoveStorage(completedRecordKey);
            setSavedRecord(null);
          }
        }
      },
      onQuestionsUpdate: (cloudQuestions) => {
        setQuestions(cloudQuestions);
        safeSetStorage(
          CUSTOM_QUESTIONS_STORAGE_KEY_PREFIX + storageScope,
          JSON.stringify(cloudQuestions)
        );
      },
      onSessionUpdate: (s) => {
        if (isAutostartDemoRef.current) return;
        setSessionMode(s.mode);
        setLiveRunId(s.runId || 'default');
      },
      onSettingsUpdate: (cloudSettings) => {
        if (isAutostartDemoRef.current) return;
        const merged: QuizSettings = {
          ...DEFAULT_QUIZ_SETTINGS,
          ...cloudSettings,
          compactMode: readInitialCompactParam() || Boolean(cloudSettings.compactMode),
        };
        setSettings(merged);
        safeSetStorage(
          SETTINGS_STORAGE_KEY_PREFIX + storageScope,
          JSON.stringify(merged)
        );
      },
      onWaitingPlayersUpdate: (players) => {
        setWaitingPlayers(players);
      },
      onActivePlayersUpdate: (players) => {
        setActivePlayers(players);
      },
      onIncomingSabotage: (ev: SabotageEvent) => {
        if (ev.targetDeviceId !== deviceId) return;
        if (screenRef.current !== 'quiz') return;
        if (!isPowerupEnabled(settingsRef.current, ev.type)) return;

        if (immuneRef.current > 0) {
          notify(`Perisai menangkis serangan ${ev.attackerName || 'lawan'}!`);
          return;
        }

        setImmuneQuestionsRemaining(1);
        if (ev.type === 'FREEZE_LEADER') {
          playFreezeFx();
          setIsFrozen(true);
          setFreezeCountdown(4);
          setFreezeAttackerName(ev.attackerName || 'Pemain lain');
        } else if (ev.type === 'GLITCH_SHUFFLE') {
          playFreezeFx();
          setGlitchShuffleForNext(true);
          notify(
            `Opsi jawabanmu akan diacak oleh ${ev.attackerName || 'lawan'} pada soal berikutnya!`
          );
        } else if (ev.type === 'TORNADO') {
          playTornadoFx();
          setTornadoCountdown(5);
          setTornadoAttackerName(ev.attackerName || 'Pemain lain');
          const curQ = playDeckRef.current[currentQIdxRef.current];
          if (
            !feedbackRef.current &&
            curQ &&
            (curQ.type === 'MC' || curQ.type === 'MS')
          ) {
            setOptionOrder(computeShuffledOrder((curQ.options || []).length, true));
          }
          notify(
            `Angin Puting Beliung dari ${ev.attackerName || 'lawan'} mengguncang dek kapal selama 5 detik!`
          );
        }
      },
    });

    return unsub;
  }, [completedRecordKey, deviceId, notify, roomCode, storageScope]);

  // Auto-start when Admin clicks Mulai Live while player is in Waiting Room
  useEffect(() => {
    const effectiveLocked = hasPlayedThisDevice && !settings.allowReplay;
    if (
      screen === 'waiting' &&
      sessionMode === 'live_started' &&
      !effectiveLocked &&
      playerName.trim()
    ) {
      startGameplay(playerName.trim(), 'live_started', liveRunId);
    }
  }, [
    hasPlayedThisDevice,
    liveRunId,
    playerName,
    screen,
    sessionMode,
    settings.allowReplay,
    startGameplay,
  ]);

  // Freeze & Tornado countdown timers
  useEffect(() => {
    if (!isFrozen) return;
    const interval = window.setInterval(() => {
      setFreezeCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsFrozen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isFrozen]);

  useEffect(() => {
    if (tornadoCountdown <= 0) return;
    const interval = window.setInterval(() => {
      setTornadoCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [tornadoCountdown > 0]);

  // Finalize current question result
  const finalizeQuestion = useCallback(
    (
      isCorrect: boolean,
      userAnswerText: string,
      correctAnswerText: string,
      isTimeout: boolean
    ) => {
      const q = playDeck[currentQuestionIndex];
      if (!q) return;

      const totalTime = isGlobalTimer
        ? Math.max(1, totalGlobalSeconds)
        : q.time || 25;
      const remainingForCalc = isGlobalTimer ? globalTimeLeft : timeLeft;
      const timeTaken = isTimeout
        ? totalTime
        : isGlobalTimer
          ? Math.max(1, Math.min(q.time || 25, 25))
          : Math.max(1, totalTime - timeLeft);

      const earned = calculateEarnedPoints(
        isCorrect,
        remainingForCalc,
        totalTime,
        doubleScoreActive,
        isGlobalTimer
      );

      let nextScore = score + earned;
      let nextCorrectCount = correctCount;
      let nextStreak = currentStreak;
      let nextInventory = [...powerupInventory];

      if (isCorrect) {
        nextCorrectCount += 1;
        if (isStreakRewardActive(settings)) {
          nextStreak += 1;
          if (nextStreak >= 2) {
            playStreakComboFx(nextStreak);
          } else {
            playCorrectFx();
          }
          const streakTarget = getStreakRewardTarget(playDeck.length);
          if (nextStreak >= streakTarget) {
            nextStreak = 0;
            const rolled = rollAllowedPowerup(null, enabledPowerups);
            if (rolled) {
              const res = grantPowerupToSlots(nextInventory, rolled);
              nextInventory = res.nextInventory;
              if (res.bonusPoints > 0) {
                nextScore += res.bonusPoints;
                notify(
                  `Slot penuh! Streak ${streakTarget} Benar dikonversi menjadi +${res.bonusPoints} poin.`
                );
              } else {
                notify(
                  `Streak ${streakTarget} Benar: Dapat item ${POWERUP_CATALOG[rolled].name}!`
                );
              }
            }
          }
        } else {
          nextStreak = 0;
          playCorrectFx();
        }
      } else {
        playWrongFx();
        nextStreak = 0;
      }

      const historyItem: QuestionHistoryItem = {
        questionId: q.id,
        questionIndex: currentQuestionIndex,
        question: q.question,
        category: q.category,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
        timeTaken,
        maxTime: q.time || 25,
        pointsEarned: earned,
        explanation: q.explanation,
      };

      const nextHistory = [...playerHistory, historyItem];

      setScore(nextScore);
      setCorrectCount(nextCorrectCount);
      setCurrentStreak(nextStreak);
      setPowerupInventory(nextInventory);
      setPlayerHistory(nextHistory);
      setFeedback({
        isCorrect,
        isTimeout,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        pointsEarned: earned,
        explanation: q.explanation,
      });

      if (!isAutostartDemoRef.current) {
        upsertActivePlayerCloud({
          deviceId,
          name: playerName,
          teamName: resolvedTeamName || undefined,
          mode: sessionMode,
          score: nextScore,
          currentQuestion: currentQuestionIndex + 1,
          totalQuestions: playDeck.length,
          startedAt: Date.now(),
          lastSeen: Date.now(),
        });

        safeSetStorage(
          inProgressKey,
          JSON.stringify({
            deviceId,
            playerName,
            teamName: resolvedTeamName || undefined,
            runId: liveRunId,
            roomCode,
            questionIds: playDeck.map((item) => item.id || item.question),
            currentQuestionIndex,
            score: nextScore,
            correctCount: nextCorrectCount,
            playerHistory: nextHistory,
            powerupInventory: nextInventory,
            currentStreak: nextStreak,
            immuneQuestionsRemaining,
            awardedDebuffMilestones,
            glitchShuffleActiveForNext: glitchShuffleForNext,
            globalTimeLeftSeconds: isGlobalTimer ? globalTimeLeft : undefined,
            visitedIslands,
            savedAt: Date.now(),
          } satisfies InProgressState)
        );
      }
    },
    [
      awardedDebuffMilestones,
      correctCount,
      currentQuestionIndex,
      currentStreak,
      deviceId,
      doubleScoreActive,
      gamificationActive,
      glitchShuffleForNext,
      globalTimeLeft,
      immuneQuestionsRemaining,
      inProgressKey,
      isGlobalTimer,
      liveRunId,
      notify,
      playDeck,
      playerHistory,
      playerName,
      powerupInventory,
      resolvedTeamName,
      roomCode,
      score,
      sessionMode,
      timeLeft,
      totalGlobalSeconds,
      visitedIslands,
    ]
  );

  // Per-question countdown timer (disabled when Global Quiz Timer is active)
  useEffect(() => {
    if (
      isGlobalTimer ||
      screen !== 'quiz' ||
      feedback ||
      isFrozen ||
      dockedIslandModal ||
      preCountdown !== null
    ) {
      return;
    }
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          const q = playDeck[currentQuestionIndex];
          if (q) {
            finalizeQuestion(
              false,
              'Waktu Habis',
              getCorrectAnswerDisplay(q),
              true
            );
          }
          return 0;
        }
        const nextVal = prev - 1;
        if (nextVal <= 5 && nextVal > 0) {
          playUrgentTickFx();
        }
        return nextVal;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [
    isGlobalTimer,
    screen,
    feedback,
    isFrozen,
    dockedIslandModal,
    preCountdown,
    currentQuestionIndex,
    playDeck,
    finalizeQuestion,
  ]);

  const handleSelectSingle = (origIdx: number) => {
    if (feedback || isFrozen || preCountdown !== null) return;
    const q = playDeck[currentQuestionIndex];
    if (!q) return;
    setSelectedSingleIndex(origIdx);
    const res = evaluateAnswer(q, origIdx);
    finalizeQuestion(
      res.isCorrect,
      res.userAnswerText,
      res.correctAnswerText,
      false
    );
  };

  const handleToggleMultiple = (origIdx: number) => {
    if (feedback || isFrozen || preCountdown !== null) return;
    setSelectedMultipleIndices((prev) =>
      prev.includes(origIdx) ? prev.filter((x) => x !== origIdx) : [...prev, origIdx]
    );
  };

  const handleSubmitComplex = () => {
    if (feedback || isFrozen || preCountdown !== null) return;
    const q = playDeck[currentQuestionIndex];
    if (!q) return;
    if (q.type === 'MS') {
      if (selectedMultipleIndices.length === 0) return;
      const res = evaluateAnswer(q, selectedMultipleIndices);
      finalizeQuestion(
        res.isCorrect,
        res.userAnswerText,
        res.correctAnswerText,
        false
      );
    } else if (q.type === 'TEXT') {
      if (!textAnswer.trim()) return;
      const res = evaluateAnswer(q, textAnswer);
      finalizeQuestion(
        res.isCorrect,
        res.userAnswerText,
        res.correctAnswerText,
        false
      );
    }
  };

  const finishQuiz = useCallback(
    (overrideFinalScore?: number) => {
      playFinishFx();
      setShowConfetti(true);
      setDockedIslandModal(null);
      if (!isAutostartDemoRef.current) {
        unregisterActivePlayerCloud(deviceId);
      }
      safeRemoveStorage(inProgressKey);
      setRecoverableProgress(null);

      const finalScore =
        typeof overrideFinalScore === 'number' ? overrideFinalScore : score;

      const record: PlayerRecord = {
        id: deviceId,
        deviceId,
        name: playerName,
        teamName: resolvedTeamName || undefined,
        score: finalScore,
        correct: correctCount,
        totalQuestions: playDeck.length,
        history: playerHistory,
        completedAt: new Date().toISOString(),
      };

      if (!isAutostartDemoRef.current) {
        safeSetStorage(completedRecordKey, JSON.stringify(record));
      }
      setSavedRecord(record);
      setLeaderboard((prev) => {
        const idx = prev.findIndex((p) => p.deviceId === record.deviceId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = record;
          return copy;
        }
        return [...prev, record];
      });
      setScreen('leaderboard');

      if (!isAutostartDemoRef.current) {
        saveScoreToCloud(record).then((ok) => {
          if (!ok && cloudStatus === 'error') {
            notify('Gagal simpan ke Firebase: periksa tab Rules di Firestore!');
          }
        });
      }
    },
    [
      cloudStatus,
      completedRecordKey,
      correctCount,
      deviceId,
      inProgressKey,
      notify,
      playDeck.length,
      playerHistory,
      playerName,
      resolvedTeamName,
      score,
    ]
  );

  const finishQuizRef = useRef(finishQuiz);
  finishQuizRef.current = finishQuiz;

  // Global Quiz Timer effect (1 shared timer for entire quiz)
  useEffect(() => {
    if (
      !isGlobalTimer ||
      screen !== 'quiz' ||
      preCountdown !== null ||
      isFrozen ||
      dockedIslandModal ||
      totalGlobalSeconds <= 0
    ) {
      return;
    }
    const interval = window.setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          notify('Waktu kuis global habis! Mengumpulkan hasil...');
          window.setTimeout(() => finishQuizRef.current(), 0);
          return 0;
        }
        const nextVal = prev - 1;
        if (nextVal <= 10 && nextVal > 0) {
          playUrgentTickFx();
        }
        return nextVal;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [
    isGlobalTimer,
    screen,
    preCountdown,
    isFrozen,
    dockedIslandModal,
    totalGlobalSeconds,
    notify,
  ]);

  const advanceAfterQuestion = useCallback(
    (overrideScore?: number) => {
      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < playDeck.length) {
        setCurrentQuestionIndex(nextIdx);
        prepareQuestionView(
          nextIdx,
          playDeck,
          glitchShuffleForNext,
          powerupInventory,
          typeof overrideScore === 'number' ? overrideScore : score,
          awardedDebuffMilestones,
          immuneQuestionsRemaining
        );
      } else {
        finishQuiz(overrideScore);
      }
    },
    [
      awardedDebuffMilestones,
      currentQuestionIndex,
      finishQuiz,
      glitchShuffleForNext,
      immuneQuestionsRemaining,
      playDeck,
      powerupInventory,
      prepareQuestionView,
      score,
    ]
  );

  const handleNextQuestion = () => {
    if (
      settings.gameplayMode === 'voyage' &&
      voyageProgress?.dockedIsland &&
      !visitedIslands.includes(voyageProgress.dockedIsland.islandNumber)
    ) {
      playIslandDockFx();
      setDockedIslandModal(voyageProgress.dockedIsland);
      return;
    }
    advanceAfterQuestion();
  };

  const handleIslandMinigameComplete = (reward: IslandMinigameReward) => {
    const docked = dockedIslandModal;
    if (!docked) return;
    setVisitedIslands((prev) =>
      prev.includes(docked.islandNumber) ? prev : [...prev, docked.islandNumber]
    );
    setDockedIslandModal(null);

    if (!reward.powerupId || !gamificationActive) {
      const nextScore = score + reward.bonusPoints;
      setScore(nextScore);
      notify(
        `Berlabuh di ${reward.islandName}: +${reward.bonusPoints} poin ekspedisi!`
      );
      advanceAfterQuestion(nextScore);
      return;
    }

    const grantRes = grantPowerupToSlots(powerupInventory, reward.powerupId);
    const totalBonus = reward.bonusPoints + grantRes.bonusPoints;
    const nextScore = score + totalBonus;
    setScore(nextScore);
    setPowerupInventory(grantRes.nextInventory);

    if (grantRes.bonusPoints > 0) {
      notify(
        `Berlabuh di ${reward.islandName}: +${totalBonus} poin (slot penuh dikonversi)!`
      );
    } else {
      notify(
        `Berlabuh di ${reward.islandName}: Dapat ${POWERUP_CATALOG[reward.powerupId].name} + ${reward.bonusPoints} poin!`
      );
    }

    advanceAfterQuestion(nextScore);
  };

  const handleActivatePowerup = (slotIdx: number) => {
    if (!gamificationActive) return;
    if (
      powerupUsedThisQuestion ||
      isFrozen ||
      feedback ||
      preCountdown !== null
    )
      return;
    const itemId = powerupInventory[slotIdx];
    const q = playDeck[currentQuestionIndex];
    if (!itemId || !q) return;

    if (itemId === 'FIFTY_FIFTY' && q.type !== 'MC' && q.type !== 'MS') {
      notify('Item 50:50 hanya bisa dipakai pada soal pilihan ganda!');
      return;
    }

    const nextInv = [...powerupInventory];
    nextInv[slotIdx] = null;
    setPowerupInventory(nextInv);
    setPowerupUsedThisQuestion(true);
    playPowerupFx();

    if (itemId === 'DOUBLE_SCORE') {
      setDoubleScoreActive(true);
      notify('Skor 2x aktif untuk soal ini!');
    } else if (itemId === 'FIFTY_FIFTY') {
      const correctIndices = Array.isArray(q.answer)
        ? q.answer
        : typeof q.answer === 'number'
          ? [q.answer]
          : [];
      const wrongIndices = (q.options || [])
        .map((_, idx) => idx)
        .filter((idx) => !correctIndices.includes(idx));
      wrongIndices.sort(() => Math.random() - 0.5);
      setEliminatedIndices(wrongIndices.slice(0, 2));
      notify('2 opsi jawaban yang salah telah dihapus!');
    } else if (itemId === 'SHIELD') {
      setImmuneQuestionsRemaining((prev) => Math.max(prev, 2));
      notify('Perisai aktif! Kamu kebal terhadap Debuff lawan.');
    } else if (
      itemId === 'FREEZE_LEADER' ||
      itemId === 'GLITCH_SHUFFLE' ||
      itemId === 'TORNADO'
    ) {
      const target = pickSabotageTarget(activePlayers, leaderboard, deviceId);
      if (!target) {
        setScore((s) => s + 100);
        notify('Belum ada lawan aktif — kamu mendapat +100 poin bonus!');
      } else {
        sendSabotageToCloud({
          targetDeviceId: target.deviceId,
          targetName: target.name,
          attackerDeviceId: deviceId,
          attackerName: playerName,
          type: itemId,
          createdAt: Date.now(),
        });
        const label =
          itemId === 'FREEZE_LEADER'
            ? 'Bekukan #1'
            : itemId === 'TORNADO'
              ? 'Puting Beliung'
              : 'Acak Opsi';
        notify(`Debuff ${label} dikirim ke ${target.name}!`);
      }
    }
  };

  const handleSubmitRoomGate = () => {
    const res = parseClassGateInput(roomGateInput);
    if (!res.valid) {
      setRoomGateError(res.error || 'Masukkan kode kelas terlebih dahulu.');
      return;
    }
    setRoomGateError('');
    handleSwitchRoom(res.roomCode);
    setRoomGateUnlocked(true);
    notify(`Berhasil masuk kelas ${res.displayLabel}!`);
  };

  // Lobby actions
  const handleLobbyStart = () => {
    const effectiveLocked = hasPlayedThisDevice && !settings.allowReplay;
    if (effectiveLocked || sessionMode === 'unconfigured') return;
    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError('Silakan masukkan nama terlebih dahulu!');
      return;
    }
    const needsTeam =
      effectivePartMode === 'team' ||
      (effectivePartMode === 'either' && teamModeChoice === 'team');
    if (needsTeam && !teamName.trim()) {
      setNameError('Silakan masukkan nama tim / kru terlebih dahulu!');
      return;
    }
    setNameError('');

    if (sessionMode === 'live_waiting') {
      setScreen('waiting');
      joinWaitingRoomCloud({
        deviceId,
        name: trimmed,
        teamName: resolvedTeamName || undefined,
        joinedAt: Date.now(),
      });
    } else {
      startGameplay(trimmed, sessionMode, liveRunId);
    }
  };

  const handleResumeProgress = () => {
    if (!recoverableProgress) return;
    const deck = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
    setPlayDeck(deck);
    const resumeIdx = Math.min(
      deck.length - 1,
      recoverableProgress.currentQuestionIndex +
        (recoverableProgress.playerHistory.length >
        recoverableProgress.currentQuestionIndex
          ? 1
          : 0)
    );
    setPlayerName(recoverableProgress.playerName);
    if (recoverableProgress.teamName) {
      setTeamModeChoice('team');
      setTeamName(recoverableProgress.teamName);
    }
    if (
      typeof recoverableProgress.globalTimeLeftSeconds === 'number' &&
      recoverableProgress.globalTimeLeftSeconds > 0
    ) {
      const fullSecs = Math.max(
        recoverableProgress.globalTimeLeftSeconds,
        (settings.quizDurationMinutes || 0) * 60
      );
      setTotalGlobalSeconds(fullSecs);
      setGlobalTimeLeft(recoverableProgress.globalTimeLeftSeconds);
    }
    setVisitedIslands(recoverableProgress.visitedIslands || []);
    setScore(recoverableProgress.score);
    setCorrectCount(recoverableProgress.correctCount);
    setPlayerHistory(recoverableProgress.playerHistory);
    setPowerupInventory(recoverableProgress.powerupInventory);
    setCurrentStreak(recoverableProgress.currentStreak);
    setAwardedDebuffMilestones(recoverableProgress.awardedDebuffMilestones || []);
    setCurrentQuestionIndex(resumeIdx);
    setPreCountdown(null);
    setScreen('quiz');
    prepareQuestionView(
      resumeIdx,
      deck,
      recoverableProgress.glitchShuffleActiveForNext,
      recoverableProgress.powerupInventory,
      recoverableProgress.score,
      recoverableProgress.awardedDebuffMilestones || [],
      recoverableProgress.immuneQuestionsRemaining || 0
    );
    setRecoverableProgress(null);
    notify('Sesi sebelumnya dipulihkan!');
  };

  const handleDiscardProgress = () => {
    safeRemoveStorage(inProgressKey);
    setRecoverableProgress(null);
  };

  const handleSwitchRoom = (nextRoomRaw: string) => {
    const sanitized = sanitizeRoomCode(nextRoomRaw);
    const clean = sanitized === 'UMUM' || sanitized === 'DEFAULT' ? '' : sanitized;
    if (clean === roomCode) return;
    safeSetStorage(ROOM_CODE_STORAGE_KEY, clean);
    setRoomCode(clean);
    setLeaderboard([]);
    setWaitingPlayers([]);
    setActivePlayers([]);
    setSessionMode('unconfigured');
    const nextScope = clean || 'default';
    const localRecRaw = safeGetStorage(`quiz_completed_record_${nextScope}_${deviceId}`);
    if (localRecRaw) {
      try {
        setSavedRecord(JSON.parse(localRecRaw) as PlayerRecord);
      } catch {
        setSavedRecord(null);
      }
    } else {
      setSavedRecord(null);
    }
    const localQRaw = safeGetStorage(CUSTOM_QUESTIONS_STORAGE_KEY_PREFIX + nextScope);
    if (localQRaw) {
      try {
        const parsed = JSON.parse(localQRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }
    setQuestions(DEFAULT_QUESTIONS);
  };

  const handleUpdateSettings = (next: QuizSettings) => {
    setSettings(next);
    safeSetStorage(
      SETTINGS_STORAGE_KEY_PREFIX + storageScope,
      JSON.stringify(next)
    );
    saveQuizSettingsToCloud(next);
  };

  // Admin handlers
  const handleSetSessionMode = (newMode: SessionMode) => {
    const flags = getSessionLockFlags(
      sessionMode,
      waitingPlayers,
      activePlayers,
      leaderboard
    );
    if (newMode === 'free' && flags.isFreeLockedOut) {
      notify('Mode Bebas terkunci karena sesi Live sudah memiliki peserta!');
      return;
    }
    if (
      (newMode === 'live_waiting' || newMode === 'live_started') &&
      flags.isLiveLockedOut
    ) {
      notify('Fitur Live terkunci karena sudah ada peserta di Mode Bebas!');
      return;
    }

    const nextRunId =
      newMode === 'live_started' ? `LIVE-${Date.now()}` : liveRunId;
    setSessionMode(newMode);
    setLiveRunId(nextRunId);
    saveSessionStateToCloud({
      mode: newMode,
      runId: nextRunId,
      updatedAt: Date.now(),
    });
    const msgs: Record<SessionMode, string> = {
      unconfigured: 'Mode dikembalikan ke Menunggu Admin.',
      free: 'Mode Bebas aktif! Peserta dapat langsung mulai.',
      live_waiting: 'Ruang Tunggu Live dibuka!',
      live_started: 'Kuis Live DIMULAI serentak!',
    };
    notify(msgs[newMode]);
  };

  const handleResetSessionMode = () => {
    setSessionMode('unconfigured');
    const resetRunId = `reset-${Date.now()}`;
    setLiveRunId(resetRunId);
    saveSessionStateToCloud({
      mode: 'unconfigured',
      runId: resetRunId,
      updatedAt: Date.now(),
    });
    clearActiveSessionPlayersCloud();
    notify('Mode sesi dikembalikan ke Menunggu Admin.');
  };

  const syncQuestions = (nextList: Question[]) => {
    setQuestions(nextList);
    safeSetStorage(
      CUSTOM_QUESTIONS_STORAGE_KEY_PREFIX + storageScope,
      JSON.stringify(nextList)
    );
    saveQuestionsToCloud(nextList);
  };

  const handleSaveQuestion = (editIndex: number, q: Question) => {
    const next = [...questions];
    if (editIndex >= 0) next[editIndex] = q;
    else next.push(q);
    syncQuestions(next);
    notify(
      editIndex >= 0
        ? `Soal #${editIndex + 1} diperbarui!`
        : 'Soal baru berhasil ditambahkan!'
    );
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      notify('Minimal harus tersisa 1 soal di dalam kuis!');
      return;
    }
    const next = questions.filter((_, i) => i !== idx);
    syncQuestions(next);
    notify('Soal berhasil dihapus.');
  };

  const handleResetDefaultQuestions = () => {
    syncQuestions(DEFAULT_QUESTIONS);
    notify('30 soal default berhasil dimuat ulang!');
  };

  const handleImportQuestions = (
    imported: Question[],
    mode: 'append' | 'replace'
  ) => {
    if (imported.length === 0) return;
    const next = mode === 'replace' ? imported : [...questions, ...imported];
    syncQuestions(next);
    notify(
      mode === 'replace'
        ? `Bank soal diganti dengan ${imported.length} soal hasil impor!`
        : `${imported.length} soal hasil impor berhasil ditambahkan (Total ${next.length} soal)!`
    );
  };

  const handleDeleteParticipant = (target: PlayerRecord) => {
    const targetId = target.deviceId || target.id;
    setLeaderboard((prev) =>
      prev.filter((p) => (p.deviceId || p.id) !== targetId)
    );
    if (targetId === deviceId) {
      safeRemoveStorage(completedRecordKey);
      if (!roomCode) safeRemoveStorage('quiz_completed_record_' + deviceId);
      setSavedRecord(null);
    }
    deleteSingleParticipantFromCloud(targetId);
    notify(`Data & kunci perangkat untuk ${target.name} berhasil dihapus.`);
  };

  const handleResetAllLeaderboard = () => {
    safeRemoveStorage(completedRecordKey);
    if (!roomCode) safeRemoveStorage('quiz_completed_record_' + deviceId);
    setSavedRecord(null);
    setLeaderboard([]);
    resetCloudLeaderboard();
    notify('Seluruh skor peserta & kunci perangkat berhasil direset.');
  };

  const handleVerifyAdminPin = () => {
    const validPin = settings.adminPin || DEFAULT_QUIZ_SETTINGS.adminPin;
    if (adminPinInput.trim() === validPin) {
      playPopClickFx();
      setAdminModalOpen(false);
      setAdminPinError(false);
      setScreen('admin');
    } else {
      playWrongFx();
      setAdminPinError(true);
    }
  };

  const activeQuestion = playDeck[currentQuestionIndex] || playDeck[0];

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-start px-3 pb-20 ${
          settings.compactMode ? 'pt-2 sm:p-4' : 'pt-4 sm:p-6'
        }`}
      >
        <main className="w-full max-w-4xl mx-auto min-w-0">
          {screen === 'lobby' && (
            <LobbyScreen
              questions={questions}
              sessionMode={sessionMode}
              settings={settings}
              roomCode={roomCode}
              roomGateUnlocked={roomGateUnlocked}
              roomGateInput={roomGateInput}
              roomGateError={roomGateError}
              waitingPlayers={waitingPlayers}
              activePlayers={activePlayers}
              playerName={playerName}
              teamModeChoice={teamModeChoice}
              teamName={teamName}
              nameError={nameError}
              hasPlayedThisDevice={hasPlayedThisDevice}
              savedPlayerRecord={savedRecord}
              leaderboardCount={leaderboard.length}
              recoverableProgress={recoverableProgress}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onRoomGateInputChange={(v) => {
                setRoomGateInput(v);
                if (roomGateError) setRoomGateError('');
              }}
              onSubmitRoomGate={handleSubmitRoomGate}
              onOpenRoomModal={() => {
                setRoomInputDraft(roomCode);
                setRoomModalOpen(true);
              }}
              onPlayerNameChange={(v) => {
                setPlayerName(v);
                if (nameError) setNameError('');
              }}
              onTeamModeChoiceChange={(mode) => {
                setTeamModeChoice(mode);
                if (nameError) setNameError('');
              }}
              onTeamNameChange={(v) => {
                setTeamName(v);
                if (nameError) setNameError('');
              }}
              onStartClick={handleLobbyStart}
              onResumeProgress={handleResumeProgress}
              onDiscardProgress={handleDiscardProgress}
              onOpenLeaderboard={() => {
                setShowConfetti(false);
                setScreen('leaderboard');
              }}
            />
          )}

          {screen === 'waiting' && (
            <WaitingRoomScreen
              playerName={playerName}
              teamName={resolvedTeamName || undefined}
              roomCode={roomCode}
              gameplayMode={settings.gameplayMode}
              deviceId={deviceId}
              waitingPlayers={waitingPlayers}
              showLiveLeaderboardToPlayers={settings.showLiveLeaderboardToPlayers}
              onOpenLiveLeaderboard={() => setLiveLbModalOpen(true)}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onLeave={() => {
                leaveWaitingRoomCloud(deviceId);
                setScreen('lobby');
              }}
            />
          )}

          {screen === 'quiz' && activeQuestion && (
            <div className="relative">
              {preCountdown !== null && (
                <div
                  role="status"
                  aria-live="assertive"
                  className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-3">
                    Bersiap Memulai Kuis
                  </div>
                  <div
                    key={preCountdown}
                    className="anim-countdown-pop w-28 h-28 rounded-3xl bg-amber-400 text-slate-950 font-mono-num font-extrabold text-6xl flex items-center justify-center arcade-btn-amber"
                  >
                    {preCountdown}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreCountdown(null);
                      playCountdownGoFx();
                    }}
                    className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Lewati Hitung Mundur
                  </button>
                </div>
              )}

              <QuizScreen
                question={activeQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={playDeck.length}
                answeredCount={playerHistory.length}
                score={score}
                timeLeft={timeLeft}
                isGlobalTimer={isGlobalTimer}
                globalTimeLeft={globalTimeLeft}
                totalGlobalSeconds={totalGlobalSeconds}
                gameplayMode={settings.gameplayMode}
                voyageProgress={voyageProgress}
                teamName={resolvedTeamName || undefined}
                activePlayers={activePlayers}
                selfDeviceId={deviceId}
                showLiveLeaderboardToPlayers={settings.showLiveLeaderboardToPlayers}
                onOpenLiveLeaderboard={() => setLiveLbModalOpen(true)}
                gamificationEnabled={gamificationActive}
                enabledPowerups={enabledPowerups}
                streakEnabled={streakEnabled}
                milestoneDropsEnabled={milestoneDropsEnabled}
                currentStreak={currentStreak}
                compactMode={settings.compactMode}
                powerupInventory={powerupInventory}
                powerupUsedThisQuestion={powerupUsedThisQuestion}
                doubleScoreActive={doubleScoreActive}
                immuneQuestionsRemaining={immuneQuestionsRemaining}
                isFrozen={isFrozen}
                freezeCountdown={freezeCountdown}
                freezeAttackerName={freezeAttackerName}
                tornadoCountdown={tornadoCountdown}
                tornadoAttackerName={tornadoAttackerName}
                optionOrder={optionOrder}
                eliminatedIndices={eliminatedIndices}
                selectedSingleIndex={selectedSingleIndex}
                selectedMultipleIndices={selectedMultipleIndices}
                textAnswer={textAnswer}
                glitchShake={glitchShake}
                feedback={feedback}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onSelectSingle={handleSelectSingle}
                onToggleMultiple={handleToggleMultiple}
                onTextAnswerChange={setTextAnswer}
                onSubmitComplex={handleSubmitComplex}
                onNextQuestion={handleNextQuestion}
                onActivatePowerup={handleActivatePowerup}
              />

              {dockedIslandModal && (
                <IslandMinigameModal
                  island={dockedIslandModal}
                  gamificationEnabled={gamificationActive}
                  enabledPowerups={enabledPowerups}
                  onComplete={handleIslandMinigameComplete}
                />
              )}
            </div>
          )}

          {screen === 'leaderboard' && (
            <LeaderboardScreen
              deviceId={deviceId}
              totalQuestions={playDeck.length || questions.length}
              leaderboard={leaderboard}
              playerResult={savedRecord}
              allowReplay={
                settings.allowReplay &&
                sessionMode !== 'unconfigured' &&
                sessionMode !== 'live_waiting'
              }
              showConfetti={showConfetti}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onRefresh={async () => {
                const fresh = await fetchCloudLeaderboardOnce();
                if (fresh) setLeaderboard(fresh);
              }}
              onReplay={() => {
                setShowConfetti(false);
                if (playerName.trim()) {
                  startGameplay(playerName.trim(), sessionMode, liveRunId);
                } else {
                  setScreen('lobby');
                }
              }}
              onBackToLobby={() => {
                setShowConfetti(false);
                setScreen('lobby');
              }}
            />
          )}

          {screen === 'admin' && (
            <AdminDashboard
              questions={questions}
              leaderboard={leaderboard}
              sessionMode={sessionMode}
              settings={settings}
              roomCode={roomCode}
              waitingPlayers={waitingPlayers}
              activePlayers={activePlayers}
              onSetSessionMode={handleSetSessionMode}
              onResetSessionMode={handleResetSessionMode}
              onUpdateSettings={handleUpdateSettings}
              onSwitchRoom={handleSwitchRoom}
              onResetDefaultQuestions={handleResetDefaultQuestions}
              onImportQuestions={handleImportQuestions}
              onSaveQuestion={handleSaveQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onDeleteParticipant={handleDeleteParticipant}
              onResetAllLeaderboard={handleResetAllLeaderboard}
              onClose={() => {
                setRoomGateUnlocked(true);
                setScreen('lobby');
              }}
              onNotify={notify}
            />
          )}
        </main>

        {/* Bottom Floating Status & Admin Access */}
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 z-40">
          <div className="bg-[#131C31]/95 text-slate-300 text-[11px] px-3 py-1.5 rounded-lg border border-[#23304C] flex items-center gap-1.5 shadow-lg">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                cloudStatus === 'connected'
                  ? 'bg-emerald-400'
                  : cloudStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="truncate">{cloudLabel}</span>
          </div>

          {screen !== 'admin' && (
            <button
              type="button"
              onClick={() => {
                playPopClickFx();
                setAdminPinInput('');
                setAdminPinError(false);
                setAdminModalOpen(true);
              }}
              className="bg-[#131C31]/95 hover:bg-slate-800 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Modal Ganti Kode Ruangan (Dari Lobby) */}
        {roomModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-modal-title"
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#131C31] border border-[#23304C] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
              <button
                type="button"
                aria-label="Tutup modal ruangan"
                onClick={() => setRoomModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-sky-400/15 text-sky-300 flex items-center justify-center mx-auto mb-3">
                <DoorOpen className="w-6 h-6" />
              </div>
              <h3 id="room-modal-title" className="text-lg font-extrabold text-white mb-1">
                Pilih Ruangan / Kelas
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Masukkan kode ruangan dari penyelenggara, atau kosongkan untuk bergabung ke ruang umum.
              </p>
              <input
                type="text"
                aria-label="Kode Ruangan Kelas"
                maxLength={20}
                autoFocus
                value={roomInputDraft}
                onChange={(e) => setRoomInputDraft(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSwitchRoom(roomInputDraft);
                    setRoomModalOpen(false);
                  }
                }}
                placeholder="Contoh: KELAS8A (Kosong = Umum)"
                className="w-full px-4 py-3 rounded-xl bg-white text-slate-950 font-mono-num font-bold text-center text-sm tracking-wider mb-4 uppercase focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="flex-1 bg-[#0B1120] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl border border-[#23304C] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    handleSwitchRoom(roomInputDraft);
                    setRoomModalOpen(false);
                  }}
                  className="flex-1 bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold py-2.5 rounded-xl cursor-pointer"
                >
                  Masuk Ruang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Login Admin */}
        {adminModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#131C31] border border-[#23304C] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
              <button
                type="button"
                aria-label="Tutup modal admin"
                onClick={() => setAdminModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 id="admin-login-title" className="text-lg font-extrabold text-white mb-1">
                Akses Dashboard Admin
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Masukkan PIN Admin untuk mengontrol sesi Live, kelola soal &amp;
                ekspor Google Sites.
              </p>
              <label htmlFor="admin-pin-input" className="sr-only">
                PIN Admin
              </label>
              <input
                id="admin-pin-input"
                type="password"
                maxLength={10}
                autoFocus
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  if (adminPinError) setAdminPinError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyAdminPin();
                }}
                placeholder="Masukkan PIN Admin"
                className="w-full px-4 py-3 rounded-xl bg-white text-slate-950 font-mono-num font-bold text-center text-lg tracking-widest mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {adminPinError && (
                <p className="text-rose-400 text-xs mb-3" role="alert">
                  PIN salah! Silakan coba lagi.
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="flex-1 bg-[#0B1120] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl border border-[#23304C] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleVerifyAdminPin}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold py-2.5 rounded-xl cursor-pointer"
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Klasemen Live (Jika Diaktifkan Admin) */}
        <LiveLeaderboardModal
          isOpen={liveLbModalOpen}
          onClose={() => setLiveLbModalOpen(false)}
          leaderboard={leaderboard}
          activePlayers={activePlayers}
          totalQuestions={playDeck.length || questions.length}
          selfDeviceId={deviceId}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#131C31] text-white border border-amber-400/50 px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-bold max-w-[calc(100vw-2rem)] text-center"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
