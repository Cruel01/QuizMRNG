import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { QuizScreen, type QuestionFeedbackState } from './components/QuizScreen';
import { WaitingRoomScreen } from './components/WaitingRoomScreen';
import {
  calculateEarnedPoints,
  evaluateAnswer,
  getCorrectAnswerDisplay,
  getDebuffMilestones,
  getOrCreateDeviceId,
  getSessionLockFlags,
  getStreakRewardTarget,
  grantPowerupToSlots,
  pickSabotageTarget,
  rollWeightedPowerup,
  safeGetStorage,
  safeRemoveStorage,
  safeSetStorage,
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
  saveScoreToCloud,
  saveSessionStateToCloud,
  sendSabotageToCloud,
  unregisterActivePlayerCloud,
  upsertActivePlayerCloud,
} from './quiz/firebaseSync';
import { ADMIN_PIN, DEFAULT_QUESTIONS, POWERUP_CATALOG } from './quiz/questions';
import {
  playCorrectFx,
  playFinishFx,
  playFreezeFx,
  playPowerupFx,
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
  SabotageEvent,
  ScreenName,
  SessionMode,
  WaitingPlayer,
} from './quiz/types';

const CUSTOM_QUESTIONS_STORAGE_KEY = 'quiz_custom_questions_v2';
const IN_PROGRESS_KEY_PREFIX = 'quiz_in_progress_v1_';

export default function App() {
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(() => {
    const raw = safeGetStorage(CUSTOM_QUESTIONS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback to default
      }
    }
    return DEFAULT_QUESTIONS;
  });

  // Cloud & Session state
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('connecting');
  const [cloudLabel, setCloudLabel] = useState('Menghubungkan Cloud...');
  const [sessionMode, setSessionMode] = useState<SessionMode>('unconfigured');
  const [liveRunId, setLiveRunId] = useState('default');
  const [waitingPlayers, setWaitingPlayers] = useState<WaitingPlayer[]>([]);
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerRecord[]>([]);

  // Device lock & saved record
  const [savedRecord, setSavedRecord] = useState<PlayerRecord | null>(() => {
    const raw = safeGetStorage('quiz_completed_record_' + deviceId);
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

  // Recoverable mid-quiz state (if user accidentally refreshed Google Sites page)
  const [recoverableProgress, setRecoverableProgress] =
    useState<InProgressState | null>(() => {
      const raw = safeGetStorage(IN_PROGRESS_KEY_PREFIX + deviceId);
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
  const [nameError, setNameError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Admin modal state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);

  // Active Quiz Gameplay state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
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

  // Freeze state
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeCountdown, setFreezeCountdown] = useState(0);
  const [freezeAttackerName, setFreezeAttackerName] = useState('');

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

  // Refs for timers & callbacks without stale closures
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const immuneRef = useRef(immuneQuestionsRemaining);
  immuneRef.current = immuneQuestionsRemaining;
  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  }, []);

  // Load a specific question index cleanly
  const prepareQuestionView = useCallback(
    (
      idx: number,
      qList: Question[],
      shouldShuffleNext: boolean,
      currentInv: (PowerupId | null)[],
      currentScoreVal: number,
      currentMilestones: number[],
      currentImmune: number
    ) => {
      const q = qList[idx];
      if (!q) return;

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

      // Option order (shuffled if hit by Glitch Shuffle debuff)
      const baseOrder = (q.options || []).map((_, i) => i);
      if (shouldShuffleNext && (q.type === 'MC' || q.type === 'MS')) {
        for (let i = baseOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [baseOrder[i], baseOrder[j]] = [baseOrder[j], baseOrder[i]];
        }
        setGlitchShuffleForNext(false);
        setGlitchShake(true);
        window.setTimeout(() => setGlitchShake(false), 750);
      } else if (shouldShuffleNext) {
        setGlitchShuffleForNext(false);
      }
      setOptionOrder(baseOrder);

      // Check debuff milestone reward
      const qNum = idx + 1;
      const milestones = getDebuffMilestones(qList.length);
      if (milestones.includes(qNum) && !currentMilestones.includes(qNum)) {
        const updatedMilestones = [...currentMilestones, qNum];
        setAwardedDebuffMilestones(updatedMilestones);
        const rolled = rollWeightedPowerup('debuff');
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
    [notify]
  );

  const isAutostartDemoRef = useRef(false);

  const startGameplay = useCallback(
    (name: string, modeUsed: SessionMode, runIdUsed: string, localOnly = false) => {
      const activeList = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
      if (!localOnly) {
        leaveWaitingRoomCloud(deviceId);
        upsertActivePlayerCloud({
          deviceId,
          name,
          mode: modeUsed,
          score: 0,
          currentQuestion: 0,
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
      setRecoverableProgress(null);

      setScreen('quiz');
      prepareQuestionView(0, activeList, false, [null, null], 0, [], 0);
      if (!localOnly) {
        safeSetStorage(
          IN_PROGRESS_KEY_PREFIX + deviceId,
          JSON.stringify({
            deviceId,
            playerName: name,
            runId: runIdUsed,
            currentQuestionIndex: 0,
            score: 0,
            correctCount: 0,
            playerHistory: [],
            powerupInventory: [null, null],
            currentStreak: 0,
            immuneQuestionsRemaining: 0,
            awardedDebuffMilestones: [],
            glitchShuffleActiveForNext: false,
            savedAt: Date.now(),
          } satisfies InProgressState)
        );
      }
    },
    [deviceId, prepareQuestionView, questions]
  );

  // Support ?autostart=1 for automated testing & quick local preview launch
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' && !hasPlayedThisDevice) {
        isAutostartDemoRef.current = true;
        setSessionMode('free');
        startGameplay('Pemain Uji', 'free', 'autostart', true);
      }
    } catch {
      // ignore
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Firebase Cloud sync
  useEffect(() => {
    const unsub = initFirebaseSync({
      deviceId,
      onStatusChange: (status, label) => {
        setCloudStatus(status);
        setCloudLabel(label);
      },
      onLeaderboardUpdate: (records, foundSelf) => {
        setLeaderboard(records);
        if (foundSelf) {
          safeSetStorage(
            'quiz_completed_record_' + deviceId,
            JSON.stringify(foundSelf)
          );
          setSavedRecord(foundSelf);
        } else {
          const localRaw = safeGetStorage('quiz_completed_record_' + deviceId);
          if (localRaw) {
            safeRemoveStorage('quiz_completed_record_' + deviceId);
            setSavedRecord(null);
          }
        }
      },
      onQuestionsUpdate: (cloudQuestions) => {
        setQuestions(cloudQuestions);
        safeSetStorage(
          CUSTOM_QUESTIONS_STORAGE_KEY,
          JSON.stringify(cloudQuestions)
        );
      },
      onSessionUpdate: (s) => {
        if (isAutostartDemoRef.current) return;
        setSessionMode(s.mode);
        setLiveRunId(s.runId || 'default');
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
        }
      },
    });

    return unsub;
  }, [deviceId, notify]);

  // Auto-start when Admin clicks Mulai Live while player is in Waiting Room
  useEffect(() => {
    if (
      screen === 'waiting' &&
      sessionMode === 'live_started' &&
      !hasPlayedThisDevice &&
      playerName.trim()
    ) {
      startGameplay(playerName.trim(), 'live_started', liveRunId);
    }
  }, [hasPlayedThisDevice, liveRunId, playerName, screen, sessionMode, startGameplay]);

  // Freeze countdown timer
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

  // Finalize current question result
  const finalizeQuestion = useCallback(
    (
      isCorrect: boolean,
      userAnswerText: string,
      correctAnswerText: string,
      isTimeout: boolean
    ) => {
      const q = questions[currentQuestionIndex];
      if (!q) return;

      const totalTime = q.time || 25;
      const timeTaken = isTimeout
        ? totalTime
        : Math.max(1, totalTime - timeLeft);

      const earned = calculateEarnedPoints(
        isCorrect,
        timeLeft,
        totalTime,
        doubleScoreActive
      );

      let nextScore = score + earned;
      let nextCorrectCount = correctCount;
      let nextStreak = currentStreak;
      let nextInventory = [...powerupInventory];

      if (isCorrect) {
        playCorrectFx();
        nextCorrectCount += 1;
        nextStreak += 1;
        const streakTarget = getStreakRewardTarget(questions.length);
        if (nextStreak >= streakTarget) {
          nextStreak = 0;
          const rolled = rollWeightedPowerup();
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
        maxTime: totalTime,
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
        // Keep active player live score updated in Firestore so opponent Debuffs target true #1
        upsertActivePlayerCloud({
          deviceId,
          name: playerName,
          mode: sessionMode,
          score: nextScore,
          currentQuestion: currentQuestionIndex + 1,
          startedAt: Date.now(),
          lastSeen: Date.now(),
        });

        safeSetStorage(
          IN_PROGRESS_KEY_PREFIX + deviceId,
          JSON.stringify({
            deviceId,
            playerName,
            runId: liveRunId,
            currentQuestionIndex,
            score: nextScore,
            correctCount: nextCorrectCount,
            playerHistory: nextHistory,
            powerupInventory: nextInventory,
            currentStreak: nextStreak,
            immuneQuestionsRemaining,
            awardedDebuffMilestones,
            glitchShuffleActiveForNext: glitchShuffleForNext,
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
      glitchShuffleForNext,
      immuneQuestionsRemaining,
      liveRunId,
      notify,
      playerHistory,
      playerName,
      powerupInventory,
      questions,
      score,
      sessionMode,
      timeLeft,
    ]
  );

  // Question countdown timer
  useEffect(() => {
    if (screen !== 'quiz' || feedback || isFrozen) return;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          const q = questions[currentQuestionIndex];
          if (q) {
            finalizeQuestion(false, 'Waktu Habis', getCorrectAnswerDisplay(q), true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [screen, feedback, isFrozen, currentQuestionIndex, questions, finalizeQuestion]);

  const handleSelectSingle = (origIdx: number) => {
    if (feedback || isFrozen) return;
    const q = questions[currentQuestionIndex];
    if (!q) return;
    setSelectedSingleIndex(origIdx);
    const res = evaluateAnswer(q, origIdx);
    finalizeQuestion(res.isCorrect, res.userAnswerText, res.correctAnswerText, false);
  };

  const handleToggleMultiple = (origIdx: number) => {
    if (feedback || isFrozen) return;
    setSelectedMultipleIndices((prev) =>
      prev.includes(origIdx) ? prev.filter((x) => x !== origIdx) : [...prev, origIdx]
    );
  };

  const handleSubmitComplex = () => {
    if (feedback || isFrozen) return;
    const q = questions[currentQuestionIndex];
    if (!q) return;
    if (q.type === 'MS') {
      if (selectedMultipleIndices.length === 0) return;
      const res = evaluateAnswer(q, selectedMultipleIndices);
      finalizeQuestion(res.isCorrect, res.userAnswerText, res.correctAnswerText, false);
    } else if (q.type === 'TEXT') {
      if (!textAnswer.trim()) return;
      const res = evaluateAnswer(q, textAnswer);
      finalizeQuestion(res.isCorrect, res.userAnswerText, res.correctAnswerText, false);
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentQuestionIndex(nextIdx);
      prepareQuestionView(
        nextIdx,
        questions,
        glitchShuffleForNext,
        powerupInventory,
        score,
        awardedDebuffMilestones,
        immuneQuestionsRemaining
      );
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    playFinishFx();
    if (!isAutostartDemoRef.current) {
      unregisterActivePlayerCloud(deviceId);
    }
    safeRemoveStorage(IN_PROGRESS_KEY_PREFIX + deviceId);
    setRecoverableProgress(null);

    const record: PlayerRecord = {
      id: deviceId,
      deviceId,
      name: playerName,
      score,
      correct: correctCount,
      totalQuestions: questions.length,
      history: playerHistory,
      completedAt: new Date().toISOString(),
    };

    if (!isAutostartDemoRef.current) {
      safeSetStorage('quiz_completed_record_' + deviceId, JSON.stringify(record));
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
  };

  const handleActivatePowerup = (slotIdx: number) => {
    if (powerupUsedThisQuestion || isFrozen || feedback) return;
    const itemId = powerupInventory[slotIdx];
    const q = questions[currentQuestionIndex];
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
    } else if (itemId === 'FREEZE_LEADER' || itemId === 'GLITCH_SHUFFLE') {
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
          itemId === 'FREEZE_LEADER' ? 'Bekukan #1' : 'Acak Opsi';
        notify(`Debuff ${label} dikirim ke ${target.name}!`);
      }
    }
  };

  // Lobby actions
  const handleLobbyStart = () => {
    if (hasPlayedThisDevice || sessionMode === 'unconfigured') return;
    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError('Silakan masukkan nama terlebih dahulu!');
      return;
    }
    setNameError('');

    if (sessionMode === 'live_waiting') {
      setScreen('waiting');
      joinWaitingRoomCloud({
        deviceId,
        name: trimmed,
        joinedAt: Date.now(),
      });
    } else {
      startGameplay(trimmed, sessionMode, liveRunId);
    }
  };

  const handleResumeProgress = () => {
    if (!recoverableProgress) return;
    const resumeIdx = Math.min(
      questions.length - 1,
      recoverableProgress.currentQuestionIndex +
        (recoverableProgress.playerHistory.length >
        recoverableProgress.currentQuestionIndex
          ? 1
          : 0)
    );
    setPlayerName(recoverableProgress.playerName);
    setScore(recoverableProgress.score);
    setCorrectCount(recoverableProgress.correctCount);
    setPlayerHistory(recoverableProgress.playerHistory);
    setPowerupInventory(recoverableProgress.powerupInventory);
    setCurrentStreak(recoverableProgress.currentStreak);
    setAwardedDebuffMilestones(recoverableProgress.awardedDebuffMilestones || []);
    setCurrentQuestionIndex(resumeIdx);
    setScreen('quiz');
    prepareQuestionView(
      resumeIdx,
      questions,
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
    safeRemoveStorage(IN_PROGRESS_KEY_PREFIX + deviceId);
    setRecoverableProgress(null);
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
    safeSetStorage(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(nextList));
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

  const handleDeleteParticipant = (target: PlayerRecord) => {
    const targetId = target.deviceId || target.id;
    setLeaderboard((prev) =>
      prev.filter((p) => (p.deviceId || p.id) !== targetId)
    );
    if (targetId === deviceId) {
      safeRemoveStorage('quiz_completed_record_' + deviceId);
      setSavedRecord(null);
    }
    deleteSingleParticipantFromCloud(targetId);
    notify(`Data & kunci perangkat untuk ${target.name} berhasil dihapus.`);
  };

  const handleResetAllLeaderboard = () => {
    safeRemoveStorage('quiz_completed_record_' + deviceId);
    setSavedRecord(null);
    setLeaderboard([]);
    resetCloudLeaderboard();
    notify('Seluruh skor peserta & kunci perangkat berhasil direset.');
  };

  const handleVerifyAdminPin = () => {
    if (adminPinInput.trim() === ADMIN_PIN) {
      setAdminModalOpen(false);
      setAdminPinError(false);
      setScreen('admin');
    } else {
      setAdminPinError(true);
    }
  };

  const activeQuestion = questions[currentQuestionIndex] || questions[0];

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-start px-3 pt-4 pb-20 sm:p-6">
      <main className="w-full max-w-4xl mx-auto min-w-0">
        {screen === 'lobby' && (
          <LobbyScreen
            questions={questions}
            sessionMode={sessionMode}
            playerName={playerName}
            nameError={nameError}
            hasPlayedThisDevice={hasPlayedThisDevice}
            savedPlayerRecord={savedRecord}
            leaderboardCount={leaderboard.length}
            recoverableProgress={recoverableProgress}
            onPlayerNameChange={(v) => {
              setPlayerName(v);
              if (nameError) setNameError('');
            }}
            onStartClick={handleLobbyStart}
            onResumeProgress={handleResumeProgress}
            onDiscardProgress={handleDiscardProgress}
            onOpenLeaderboard={() => setScreen('leaderboard')}
          />
        )}

        {screen === 'waiting' && (
          <WaitingRoomScreen
            playerName={playerName}
            deviceId={deviceId}
            waitingPlayers={waitingPlayers}
            onLeave={() => {
              leaveWaitingRoomCloud(deviceId);
              setScreen('lobby');
            }}
          />
        )}

        {screen === 'quiz' && activeQuestion && (
          <QuizScreen
            question={activeQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            score={score}
            timeLeft={timeLeft}
            currentStreak={currentStreak}
            powerupInventory={powerupInventory}
            powerupUsedThisQuestion={powerupUsedThisQuestion}
            doubleScoreActive={doubleScoreActive}
            immuneQuestionsRemaining={immuneQuestionsRemaining}
            isFrozen={isFrozen}
            freezeCountdown={freezeCountdown}
            freezeAttackerName={freezeAttackerName}
            optionOrder={optionOrder}
            eliminatedIndices={eliminatedIndices}
            selectedSingleIndex={selectedSingleIndex}
            selectedMultipleIndices={selectedMultipleIndices}
            textAnswer={textAnswer}
            glitchShake={glitchShake}
            feedback={feedback}
            isMuted={isMuted}
            onToggleMute={() => {
              const next = !isMuted;
              setIsMuted(next);
              setSoundMuted(next);
            }}
            onSelectSingle={handleSelectSingle}
            onToggleMultiple={handleToggleMultiple}
            onTextAnswerChange={setTextAnswer}
            onSubmitComplex={handleSubmitComplex}
            onNextQuestion={handleNextQuestion}
            onActivatePowerup={handleActivatePowerup}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            deviceId={deviceId}
            totalQuestions={questions.length}
            leaderboard={leaderboard}
            playerResult={savedRecord}
            onRefresh={async () => {
              const fresh = await fetchCloudLeaderboardOnce();
              if (fresh) setLeaderboard(fresh);
            }}
            onBackToLobby={() => setScreen('lobby')}
          />
        )}

        {screen === 'admin' && (
          <AdminDashboard
            questions={questions}
            leaderboard={leaderboard}
            sessionMode={sessionMode}
            waitingPlayers={waitingPlayers}
            activePlayers={activePlayers}
            onSetSessionMode={handleSetSessionMode}
            onResetSessionMode={handleResetSessionMode}
            onResetDefaultQuestions={handleResetDefaultQuestions}
            onSaveQuestion={handleSaveQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDeleteParticipant={handleDeleteParticipant}
            onResetAllLeaderboard={handleResetAllLeaderboard}
            onClose={() => setScreen('lobby')}
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

        <button
          type="button"
          onClick={() => {
            setAdminPinInput('');
            setAdminPinError(false);
            setAdminModalOpen(true);
          }}
          className="bg-[#131C31]/95 hover:bg-slate-800 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Admin</span>
        </button>
      </div>

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
