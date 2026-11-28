import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  DoorOpen,
  Download,
  FileSpreadsheet,
  Flame,
  Gamepad2,
  Hourglass,
  KeyRound,
  Lock,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Shield,
  Ship,
  Shuffle,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Tornado,
  Trash2,
  Trophy,
  Unlock,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  aggregateTeamLeaderboard,
  buildCsvContent,
  buildVoyageCheckpoints,
  computeAdminStats,
  filterFreshActivePlayers,
  filterQuestionsForAdmin,
  generateDefaultRoomCode,
  getCorrectAnswerDisplay,
  getDebuffMilestones,
  getDynamicCategoryStats,
  getEnabledPowerups,
  getSessionLockFlags,
  getStreakRewardTarget,
  isGamificationActive,
  mergeLiveAndFinishedLeaderboard,
  sanitizeImageUrl,
  sanitizeRoomCode,
  togglePowerupInList,
} from '../quiz/engine';
import { ALL_POWERUP_IDS, POWERUP_CATALOG } from '../quiz/questions';
import {
  buildQuestionCsvTemplate,
  exportQuestionsToCsv,
  parseQuestionsImport,
} from '../quiz/questionImport';
import { generateGoogleSitesHtml } from '../quiz/googleSitesExport';
import { playPopClickFx } from '../quiz/soundFx';
import type {
  ActivePlayer,
  PlayerRecord,
  PowerupId,
  Question,
  QuestionType,
  QuizSettings,
  SessionMode,
  WaitingPlayer,
} from '../quiz/types';

type AdminTab =
  | 'session'
  | 'gamification'
  | 'settings'
  | 'stats'
  | 'questions'
  | 'googlesites';

interface AdminDashboardProps {
  questions: Question[];
  leaderboard: PlayerRecord[];
  sessionMode: SessionMode;
  settings: QuizSettings;
  roomCode: string;
  waitingPlayers: WaitingPlayer[];
  activePlayers: ActivePlayer[];
  onSetSessionMode: (mode: SessionMode) => void;
  onResetSessionMode: () => void;
  onUpdateSettings: (next: QuizSettings) => void;
  onSwitchRoom: (nextRoom: string) => void;
  onResetDefaultQuestions: () => void;
  onImportQuestions: (imported: Question[], mode: 'append' | 'replace') => void;
  onSaveQuestion: (editIndex: number, question: Question) => void;
  onDeleteQuestion: (index: number) => void;
  onDeleteParticipant: (player: PlayerRecord) => void;
  onResetAllLeaderboard: () => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  questions,
  leaderboard,
  sessionMode,
  settings,
  roomCode,
  waitingPlayers,
  activePlayers,
  onSetSessionMode,
  onResetSessionMode,
  onUpdateSettings,
  onSwitchRoom,
  onResetDefaultQuestions,
  onImportQuestions,
  onSaveQuestion,
  onDeleteQuestion,
  onDeleteParticipant,
  onResetAllLeaderboard,
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('session');
  const [detailPlayer, setDetailPlayer] = useState<PlayerRecord | null>(null);
  const [pendingDeleteOne, setPendingDeleteOne] = useState<PlayerRecord | null>(
    null
  );
  const [pendingDeleteQuestionIdx, setPendingDeleteQuestionIdx] = useState<
    number | null
  >(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  // Settings & Room local draft inputs
  const [pinDraft, setPinDraft] = useState(settings.adminPin || '6767');
  const [roomDraft, setRoomDraft] = useState(roomCode);
  const [roomConfirmed, setRoomConfirmed] = useState(false);
  const [limitDraft, setLimitDraft] = useState(String(settings.questionLimit || 0));
  const [durationDraft, setDurationDraft] = useState(
    String(settings.quizDurationMinutes || 0)
  );
  const [adminLbTab, setAdminLbTab] = useState<'individual' | 'team'>(
    'individual'
  );

  useEffect(() => {
    setRoomDraft(roomCode);
  }, [roomCode]);

  useEffect(() => {
    setPinDraft(settings.adminPin || '6767');
  }, [settings.adminPin]);

  useEffect(() => {
    setLimitDraft(String(settings.questionLimit || 0));
  }, [settings.questionLimit]);

  useEffect(() => {
    setDurationDraft(String(settings.quizDurationMinutes || 0));
  }, [settings.quizDurationMinutes]);

  // Bank Soal Search & Filter
  const [qSearch, setQSearch] = useState('');
  const [qCatFilter, setQCatFilter] = useState('ALL');
  const [qTypeFilter, setQTypeFilter] = useState('ALL');

  // CRUD Modal State
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudEditIndex, setCrudEditIndex] = useState(-1);
  const [crudCategory, setCrudCategory] = useState('Manusia & Hewan');
  const [crudCustomCategory, setCrudCustomCategory] = useState('');
  const [crudType, setCrudType] = useState<QuestionType>('MC');
  const [crudTime, setCrudTime] = useState(25);
  const [crudQuestion, setCrudQuestion] = useState('');
  const [crudImageUrl, setCrudImageUrl] = useState('');
  const [crudOpts, setCrudOpts] = useState(['', '', '', '']);
  const [crudAnswerMc, setCrudAnswerMc] = useState(0);
  const [crudAnswerTf, setCrudAnswerTf] = useState(0);
  const [crudAnswerMs, setCrudAnswerMs] = useState<number[]>([]);
  const [crudAnswerText, setCrudAnswerText] = useState('');
  const [crudExplanation, setCrudExplanation] = useState('');
  const [crudError, setCrudError] = useState('');

  const [copiedSitesHtml, setCopiedSitesHtml] = useState(false);

  // Bulk Import CSV / Spreadsheet Modal State
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');

  const importPreview = useMemo(
    () => parseQuestionsImport(importText),
    [importText]
  );

  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [leaderboard]
  );

  const freshActivePlayers = useMemo(
    () =>
      [...filterFreshActivePlayers(activePlayers)].sort(
        (a, b) => (b.score || 0) - (a.score || 0)
      ),
    [activePlayers]
  );

  const dynamicCategories = useMemo(
    () => getDynamicCategoryStats(questions),
    [questions]
  );

  const filteredQuestions = useMemo(
    () =>
      filterQuestionsForAdmin(questions, qSearch, qCatFilter, qTypeFilter),
    [questions, qSearch, qCatFilter, qTypeFilter]
  );

  const stats = useMemo(
    () => computeAdminStats(sortedLeaderboard, questions),
    [sortedLeaderboard, questions]
  );

  const lockFlags = useMemo(
    () =>
      getSessionLockFlags(
        sessionMode,
        waitingPlayers,
        activePlayers,
        sortedLeaderboard
      ),
    [sessionMode, waitingPlayers, activePlayers, sortedLeaderboard]
  );

  const mergedAdminLeaderboard = useMemo(
    () =>
      mergeLiveAndFinishedLeaderboard(
        sortedLeaderboard,
        activePlayers,
        questions.length
      ),
    [sortedLeaderboard, activePlayers, questions.length]
  );

  const teamAdminLeaderboard = useMemo(
    () => aggregateTeamLeaderboard(mergedAdminLeaderboard),
    [mergedAdminLeaderboard]
  );

  const effectiveDeckSize = useMemo(() => {
    const lim = Math.max(0, Math.floor(Number(settings.questionLimit) || 0));
    return lim > 0 && lim < questions.length ? lim : questions.length;
  }, [questions.length, settings.questionLimit]);

  const previewIslandCount = useMemo(
    () => buildVoyageCheckpoints(effectiveDeckSize).length,
    [effectiveDeckSize]
  );

  const gamificationActive = isGamificationActive(settings);
  const configuredPowerups = useMemo(
    () =>
      Array.isArray(settings.enabledPowerups)
        ? settings.enabledPowerups.filter((id) => id in POWERUP_CATALOG)
        : ALL_POWERUP_IDS,
    [settings.enabledPowerups]
  );
  const activePowerups = useMemo(
    () => getEnabledPowerups(settings),
    [settings]
  );
  const streakEnabledSetting = settings.streakEnabled !== false;
  const milestoneDropsEnabledSetting = settings.milestoneDropsEnabled !== false;
  const hasEnabledDebuffs = configuredPowerups.some(
    (id) => POWERUP_CATALOG[id]?.kind === 'debuff'
  );
  const streakTargetPreview = useMemo(
    () => getStreakRewardTarget(effectiveDeckSize),
    [effectiveDeckSize]
  );
  const debuffMilestonesPreview = useMemo(
    () => getDebuffMilestones(effectiveDeckSize),
    [effectiveDeckSize]
  );

  const renderCatalogIcon = (id: PowerupId) => {
    switch (id) {
      case 'DOUBLE_SCORE':
        return <Zap className="w-4 h-4 text-amber-300 shrink-0" />;
      case 'FIFTY_FIFTY':
        return <Scissors className="w-4 h-4 text-sky-300 shrink-0" />;
      case 'SHIELD':
        return <Shield className="w-4 h-4 text-emerald-300 shrink-0" />;
      case 'FREEZE_LEADER':
        return <Snowflake className="w-4 h-4 text-cyan-300 shrink-0" />;
      case 'GLITCH_SHUFFLE':
        return <Shuffle className="w-4 h-4 text-fuchsia-300 shrink-0" />;
      case 'TORNADO':
        return <Tornado className="w-4 h-4 text-rose-300 shrink-0" />;
    }
  };

  const googleSitesHtml = useMemo(
    () => generateGoogleSitesHtml(questions, settings, roomCode),
    [questions, settings, roomCode]
  );

  const handleExportCsv = () => {
    const csv = buildCsvContent(sortedLeaderboard, questions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hasil_kuis_nusantara_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('File CSV berhasil diunduh!');
  };

  const handleCopySitesHtml = async () => {
    try {
      await navigator.clipboard.writeText(googleSitesHtml);
      setCopiedSitesHtml(true);
      onNotify('Kode HTML siap tempel di Google Sites berhasil disalin!');
      setTimeout(() => setCopiedSitesHtml(false), 2500);
    } catch {
      onNotify('Gagal menyalin otomatis, silakan unduh file HTML.');
    }
  };

  const handleDownloadSitesHtml = () => {
    const blob = new Blob([googleSitesHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kuis-nusantara-google-sites.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('File HTML Google Sites berhasil diunduh!');
  };

  const handleDownloadGithubPagesHtml = () => {
    const blob = new Blob([googleSitesHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('File index.html siap upload ke GitHub Pages berhasil diunduh!');
  };

  const triggerCsvDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadQuestionTemplate = () => {
    triggerCsvDownload(buildQuestionCsvTemplate(), 'template_soal_kuis.csv');
    onNotify('Template CSV soal berhasil diunduh!');
  };

  const handleExportQuestionsCsv = () => {
    triggerCsvDownload(
      exportQuestionsToCsv(questions),
      `bank_soal_kuis_${new Date().toISOString().slice(0, 10)}.csv`
    );
    onNotify(`${questions.length} soal berhasil diekspor ke CSV!`);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportText(reader.result);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleConfirmImport = (mode: 'append' | 'replace') => {
    if (importPreview.questions.length === 0) return;
    onImportQuestions(importPreview.questions, mode);
    setImportOpen(false);
    setImportText('');
    setImportFileName('');
  };

  const handleSavePin = () => {
    const trimmed = pinDraft.trim();
    if (trimmed.length < 4 || trimmed.length > 10) {
      onNotify('PIN Admin harus 4–10 karakter.');
      return;
    }
    onUpdateSettings({ ...settings, adminPin: trimmed });
    onNotify('PIN Admin berhasil diperbarui & disimpan ke Cloud!');
  };

  const handleGenerateRoomCode = () => {
    const generated = generateDefaultRoomCode('RUANG');
    setRoomDraft(generated);
    onNotify(
      `Kode acak #${generated} dibuat di kolom input — ubah bila perlu, lalu klik "Buka & Konfirmasi Ruang".`
    );
  };

  const handleConfirmRoomStep = () => {
    const clean = sanitizeRoomCode(roomDraft);
    if (clean !== roomCode) {
      onSwitchRoom(clean);
    }
    setRoomDraft(clean);
    setRoomConfirmed(true);
    onNotify(
      clean
        ? `Ruang #${clean} aktif & terkonfirmasi! Kamu sekarang bisa mengatur Mode Pelaksanaan.`
        : 'Ruang Utama (Umum) dikonfirmasi! Kamu sekarang bisa mengatur Mode Pelaksanaan.'
    );
  };

  const handleCopyRoomLink = async () => {
    const clean = sanitizeRoomCode(roomDraft);
    try {
      const url = new URL(window.location.href);
      if (clean) url.searchParams.set('room', clean);
      else url.searchParams.delete('room');
      await navigator.clipboard.writeText(url.toString());
      onNotify('Tautan undangan ruangan berhasil disalin!');
    } catch {
      onNotify('Gunakan parameter ?room=KODE di URL.');
    }
  };

  const openCrudModal = (editIdx = -1) => {
    setCrudEditIndex(editIdx);
    setCrudError('');
    if (editIdx >= 0 && questions[editIdx]) {
      const q = questions[editIdx];
      const existingCats = dynamicCategories.map((c) => c.key);
      if (existingCats.includes(q.category)) {
        setCrudCategory(q.category);
        setCrudCustomCategory('');
      } else {
        setCrudCategory('__CUSTOM__');
        setCrudCustomCategory(q.category);
      }
      setCrudType(q.type);
      setCrudTime(q.time || 25);
      setCrudQuestion(q.question);
      setCrudImageUrl(q.imageUrl || '');
      setCrudExplanation(q.explanation || '');
      if (q.type === 'MC' || q.type === 'MS') {
        setCrudOpts([0, 1, 2, 3].map((i) => q.options?.[i] || ''));
      } else {
        setCrudOpts(['', '', '', '']);
      }
      setCrudAnswerMc(q.type === 'MC' && typeof q.answer === 'number' ? q.answer : 0);
      setCrudAnswerTf(q.type === 'TF' && typeof q.answer === 'number' ? q.answer : 0);
      setCrudAnswerMs(q.type === 'MS' && Array.isArray(q.answer) ? q.answer : []);
      setCrudAnswerText(
        q.type === 'TEXT' ? (q.acceptedAnswers || []).join(', ') : ''
      );
    } else {
      setCrudCategory(dynamicCategories[0]?.key || 'Manusia & Hewan');
      setCrudCustomCategory('');
      setCrudType('MC');
      setCrudTime(25);
      setCrudQuestion('');
      setCrudImageUrl('');
      setCrudOpts(['', '', '', '']);
      setCrudAnswerMc(0);
      setCrudAnswerTf(0);
      setCrudAnswerMs([]);
      setCrudAnswerText('');
      setCrudExplanation('');
    }
    setCrudOpen(true);
  };

  const handleSaveCrud = () => {
    const qText = crudQuestion.trim();
    if (!qText) {
      setCrudError('Teks pertanyaan wajib diisi.');
      return;
    }
    const resolvedCategory =
      crudCategory === '__CUSTOM__'
        ? crudCustomCategory.trim()
        : crudCategory.trim();
    if (!resolvedCategory) {
      setCrudError('Nama kategori baru wajib diisi.');
      return;
    }

    const cleanImg = sanitizeImageUrl(crudImageUrl);
    if (crudImageUrl.trim() && !cleanImg) {
      setCrudError('URL gambar harus diawali https://, http://, atau /');
      return;
    }

    const expText =
      crudExplanation.trim() || 'Jawaban sesuai kunci yang ditetapkan admin.';

    const base: Question = {
      id:
        crudEditIndex >= 0
          ? questions[crudEditIndex]?.id || `custom-${Date.now()}`
          : `custom-${Date.now()}`,
      category: resolvedCategory,
      type: crudType,
      time: Math.max(10, Math.min(120, Number(crudTime) || 25)),
      question: qText,
      explanation: expText,
    };
    if (cleanImg) base.imageUrl = cleanImg;

    if (crudType === 'MC') {
      const cleanOpts = crudOpts.map((o) => o.trim());
      if (cleanOpts.some((o) => !o)) {
        setCrudError('Keempat opsi jawaban A–D wajib diisi.');
        return;
      }
      base.options = cleanOpts;
      base.answer = crudAnswerMc;
    } else if (crudType === 'TF') {
      base.options = ['Benar (True)', 'Salah (False)'];
      base.answer = crudAnswerTf;
    } else if (crudType === 'MS') {
      const cleanOpts = crudOpts.map((o) => o.trim());
      if (cleanOpts.some((o) => !o) || crudAnswerMs.length === 0) {
        setCrudError('Isi semua opsi A–D dan pilih minimal 1 jawaban benar.');
        return;
      }
      base.options = cleanOpts;
      base.answer = [...crudAnswerMs].sort((a, b) => a - b);
    } else {
      const accepted = crudAnswerText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (accepted.length === 0) {
        setCrudError('Masukkan minimal 1 kata kunci jawaban.');
        return;
      }
      base.acceptedAnswers = accepted;
    }

    onSaveQuestion(crudEditIndex, base);
    setCrudOpen(false);
  };

  // Detail Modal Helpers
  const detailMetrics = useMemo(() => {
    if (!detailPlayer) return null;
    const hist = Array.isArray(detailPlayer.history) ? detailPlayer.history : [];
    let totalDuration = 0;
    let fastestNum: number | null = null;
    let fastestTime = Infinity;

    hist.forEach((h, i) => {
      if (typeof h.timeTaken === 'number') {
        totalDuration += h.timeTaken;
        if (h.timeTaken < fastestTime) {
          fastestTime = h.timeTaken;
          fastestNum = i + 1;
        }
      }
    });

    return {
      hist,
      totalDuration,
      fastestLabel:
        fastestNum !== null ? `Soal #${fastestNum} (${fastestTime}d)` : '-',
    };
  }, [detailPlayer]);

  return (
    <section
      aria-label="Dashboard Admin"
      className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-8 shadow-xl"
    >
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304C] pb-5 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-amber-300">
              Panel Penyelenggara
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-mono-num font-bold">
              <DoorOpen className="w-3.5 h-3.5" />
              Ruang Aktif: {roomCode ? `#${roomCode}` : 'Umum (Default)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Kontrol Sesi &amp; Statistik Kuis
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              handleExportCsv();
            }}
            className="arcade-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" /> Unduh CSV
          </button>
          <button
            type="button"
            onClick={() => {
              playPopClickFx();
              onClose();
            }}
            className="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <X className="w-4 h-4" /> Tutup
          </button>
        </div>
      </div>

      {/* Navigasi Tab Admin */}
      <div
        role="tablist"
        aria-label="Menu Admin"
        className="flex flex-nowrap overflow-x-auto sm:flex-wrap gap-1.5 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl mb-6"
      >
        {(
          [
            { id: 'session', label: 'Kontrol Sesi' },
            { id: 'gamification', label: 'Gamifikasi' },
            { id: 'settings', label: 'Pengaturan & Tampilan' },
            { id: 'stats', label: `Statistik & Peserta (${sortedLeaderboard.length})` },
            { id: 'questions', label: `Bank Soal (${questions.length})` },
            { id: 'googlesites', label: 'Publish & Embed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              playPopClickFx();
              setActiveTab(tab.id);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: KONTROL SESI */}
      {activeTab === 'session' && (
        <div className="space-y-5">
          {/* LANGKAH 1: KODE RUANGAN (PRIORITAS PERTAMA) */}
          <div
            className={`bg-[#0B1120] border rounded-xl p-5 transition ${
              roomConfirmed ? 'border-emerald-500/35' : 'border-sky-400/50'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono-num text-[11px] font-extrabold">
                  LANGKAH 1
                </span>
                <h3 className="text-base font-bold text-white">
                  Atur &amp; Konfirmasi Kode Ruangan
                </h3>
              </div>

              {roomConfirmed ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ruang Terkonfirmasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> Konfirmasi Ruang Dulu
                </span>
              )}
            </div>

            <div className="bg-[#131C31] border border-[#23304C] rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-300">
                Kamu sedang berada di kode ruang:{' '}
                <strong className="font-mono-num text-sky-300 text-sm">
                  {roomCode ? `#${roomCode}` : 'UMUM (Default)'}
                </strong>
                {sanitizeRoomCode(roomDraft) !== roomCode && (
                  <span className="ml-2 text-amber-300 font-semibold">
                    (Draf baru: {sanitizeRoomCode(roomDraft) ? `#${sanitizeRoomCode(roomDraft)}` : 'UMUM'} — belum diterapkan)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  handleCopyRoomLink();
                }}
                className="bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-[#23304C] font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" /> Salin Link Ruang
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Disarankan membuat kode ruangan sendiri (mis.{' '}
              <code className="text-amber-300">KELAS8A</code> atau{' '}
              <code className="text-amber-300">IPA-PAGI</code>) agar bank soal
              dan leaderboard terpisah, atau klik{' '}
              <strong className="text-slate-200">Buat Kode Acak</strong> untuk
              generate default. Kosongkan jika ingin tetap memakai Ruang Umum.
            </p>

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                aria-label="Kode Ruangan"
                value={roomDraft}
                onChange={(e) => setRoomDraft(e.target.value.toUpperCase())}
                placeholder="Ketik kode buatan sendiri (Kosong = Umum)"
                maxLength={20}
                className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-lg bg-[#131C31] border border-[#23304C] text-white font-mono-num font-bold text-xs uppercase focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  handleGenerateRoomCode();
                }}
                className="bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] font-bold text-xs px-3.5 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" /> Buat Kode Acak
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  handleConfirmRoomStep();
                }}
                className="arcade-btn bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />{' '}
                {sanitizeRoomCode(roomDraft) !== roomCode
                  ? 'Buka & Konfirmasi Ruang'
                  : 'Konfirmasi Ruang Ini'}
              </button>
            </div>
          </div>

          {/* LANGKAH 2: MODE PELAKSANAAN (TERKUNCI SEBELUM RUANG DIKONFIRMASI) */}
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono-num text-[11px] font-extrabold">
                  LANGKAH 2
                </span>
                <h3 className="text-base font-bold text-white">
                  Mode Pelaksanaan (Bebas vs Live Bareng)
                </h3>
              </div>
              {!roomConfirmed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                  <Lock className="w-3.5 h-3.5" /> Selesaikan Langkah 1 dulu
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Secara bawaan peserta menunggu pilihan Admin. Jika salah satu mode
              sudah berjalan dengan peserta aktif/selesai, mode lainnya otomatis
              terkunci agar sesi tetap konsisten.
            </p>

            {!roomConfirmed && (
              <div className="mb-4 bg-amber-500/10 border border-amber-400/30 rounded-lg px-4 py-2.5 text-xs text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  Atur atau konfirmasi kode ruangan di <strong>Langkah 1</strong>{' '}
                  terlebih dahulu untuk membuka kontrol Mode Pelaksanaan.
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 mb-4">
              <button
                type="button"
                disabled={!roomConfirmed || lockFlags.isFreeLockedOut}
                onClick={() => {
                  playPopClickFx();
                  onSetSessionMode('free');
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                  !roomConfirmed || lockFlags.isFreeLockedOut
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : sessionMode === 'free'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 cursor-pointer'
                      : 'bg-[#131C31] text-slate-200 border-[#23304C] hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {!roomConfirmed ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Mode Bebas
                  </>
                ) : lockFlags.isFreeLockedOut ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Mode Bebas (Terkunci)
                  </>
                ) : (
                  'Mode Bebas'
                )}
              </button>

              <button
                type="button"
                disabled={!roomConfirmed || lockFlags.isLiveLockedOut}
                onClick={() => {
                  playPopClickFx();
                  onSetSessionMode('live_waiting');
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                  !roomConfirmed || lockFlags.isLiveLockedOut
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : sessionMode === 'live_waiting'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 cursor-pointer'
                      : 'bg-[#131C31] text-slate-200 border-[#23304C] hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {!roomConfirmed ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Buka Lobby Live
                  </>
                ) : lockFlags.isLiveLockedOut ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Live Terkunci
                  </>
                ) : (
                  <>
                    <Hourglass className="w-3.5 h-3.5" /> Buka Lobby Live
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={
                  !roomConfirmed ||
                  lockFlags.isLiveLockedOut ||
                  sessionMode === 'unconfigured' ||
                  sessionMode === 'free'
                }
                onClick={() => {
                  playPopClickFx();
                  onSetSessionMode('live_started');
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                  !roomConfirmed ||
                  lockFlags.isLiveLockedOut ||
                  sessionMode === 'unconfigured' ||
                  sessionMode === 'free'
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Mulai Live Sekarang
              </button>

              <button
                type="button"
                disabled={!roomConfirmed}
                onClick={() => {
                  playPopClickFx();
                  onResetSessionMode();
                }}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 whitespace-nowrap ${
                  !roomConfirmed
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 cursor-pointer'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" /> Reset Mode
              </button>
            </div>

            <div className="bg-[#131C31] border border-[#23304C] rounded-lg px-4 py-3 text-xs text-slate-300">
              {sessionMode === 'unconfigured' && (
                <span>
                  Status: <strong className="text-amber-300">Menunggu Admin</strong>{' '}
                  — Beranda peserta terkunci sampai kamu memilih Mode Bebas atau
                  Buka Lobby Live.
                </span>
              )}
              {sessionMode === 'free' && (
                <span>
                  Status: <strong className="text-emerald-400">Mode Bebas Aktif</strong>{' '}
                  — {lockFlags.freshActiveCount} peserta sedang bermain,{' '}
                  {sortedLeaderboard.length} peserta selesai.
                </span>
              )}
              {sessionMode === 'live_waiting' && (
                <span>
                  Status:{' '}
                  <strong className="text-amber-300">Lobby Live Terbuka</strong> —{' '}
                  {waitingPlayers.length} peserta di ruang tunggu siap dimulai.
                </span>
              )}
              {sessionMode === 'live_started' && (
                <span>
                  Status:{' '}
                  <strong className="text-rose-400">Live Berlangsung</strong> —{' '}
                  {lockFlags.freshActiveCount} peserta aktif bermain.
                </span>
              )}
            </div>
          </div>

          {/* Ruang Tunggu Live & Monitor Live (2 Kolom Seimbang) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Peserta di Ruang Tunggu Live ({waitingPlayers.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono-num text-slate-400">
                  Lobby Live
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {waitingPlayers.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Belum ada peserta menunggu di lobby live.
                  </p>
                ) : (
                  waitingPlayers.map((p) => (
                    <span
                      key={p.deviceId}
                      className="px-2.5 py-1 rounded-md bg-[#131C31] border border-[#23304C] text-xs text-slate-200 font-semibold"
                    >
                      {p.name}
                      {p.teamName ? (
                        <span className="ml-1 text-[11px] text-sky-300">
                          ({p.teamName})
                        </span>
                      ) : null}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Pantau Live: Sedang Mengerjakan ({freshActivePlayers.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Update tiap soal
                </span>
              </div>

              {freshActivePlayers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Belum ada peserta yang sedang aktif menjawab kuis saat ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {freshActivePlayers.map((ap) => (
                    <div
                      key={ap.deviceId}
                      className="bg-[#131C31] border border-[#23304C] rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {ap.name}
                          {ap.teamName ? (
                            <span className="ml-1 text-[11px] text-sky-300">
                              ({ap.teamName})
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          Soal {ap.currentQuestion || 1}/
                          {ap.totalQuestions || questions.length}
                        </div>
                      </div>
                      <div className="font-mono-num font-extrabold text-amber-400 shrink-0">
                        {ap.score ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Klasemen Live di Panel Admin */}
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Klasemen Leaderboard Live ({mergedAdminLeaderboard.length})
                </h3>
              </div>
              <div className="inline-flex items-center gap-1 p-1 bg-[#131C31] border border-[#23304C] rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    setAdminLbTab('individual');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                    adminLbTab === 'individual'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Individu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    setAdminLbTab('team');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                    adminLbTab === 'team'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3" /> Tim ({teamAdminLeaderboard.length})
                </button>
              </div>
            </div>

            {mergedAdminLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada skor peserta yang tercatat di ruangan ini.
              </p>
            ) : adminLbTab === 'individual' ? (
              <div className="divide-y divide-[#23304C]/70 max-h-56 overflow-y-auto rounded-lg border border-[#23304C] bg-[#131C31]">
                {mergedAdminLeaderboard.map((row, idx) => (
                  <div
                    key={row.deviceId}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono-num font-extrabold text-amber-300 w-6 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate">
                          {row.name}
                        </span>
                        {row.teamName && (
                          <span className="ml-1.5 text-[11px] text-sky-300">
                            · Tim {row.teamName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono-num">
                      <span
                        className={`text-[11px] ${
                          row.status === 'finished'
                            ? 'text-emerald-400'
                            : 'text-sky-300'
                        }`}
                      >
                        {row.status === 'finished'
                          ? `Selesai (${row.correct}/${row.totalQuestions})`
                          : `Soal ${row.currentQuestion}/${row.totalQuestions}`}
                      </span>
                      <span className="font-extrabold text-amber-400 min-w-[40px] text-right">
                        {row.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#23304C]/70 max-h-56 overflow-y-auto rounded-lg border border-[#23304C] bg-[#131C31]">
                {teamAdminLeaderboard.map((t, idx) => (
                  <div
                    key={t.teamName}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono-num font-extrabold text-sky-300 w-6 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {t.teamName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {t.memberCount} anggota · {t.members.join(', ')}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-num font-extrabold text-amber-400 shrink-0">
                      {t.totalScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GAMIFIKASI */}
      {activeTab === 'gamification' && (
        <div className="space-y-5">
          {/* Master Saklar Gamifikasi */}
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Aktifkan Fitur Gamifikasi
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                    gamificationActive
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {gamificationActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                {gamificationActive
                  ? 'Pemain mendapatkan Streak kombo, Buff (Skor 2x, 50:50, Perisai), serta Debuff serangan lawan (Bekukan #1, Acak Opsi, Puting Beliung) saat kuis berlangsung.'
                  : 'Mode kuis murni tanpa item Buff, Debuff, sabotase lawan, maupun pelacak Streak. Skor murni dihitung dari ketepatan jawaban dan kecepatan.'}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={gamificationActive}
              aria-label="Aktifkan Fitur Gamifikasi"
              onClick={() => {
                playPopClickFx();
                const nextEnabled = !gamificationActive;
                onUpdateSettings({
                  ...settings,
                  gamificationEnabled: nextEnabled,
                });
                onNotify(
                  nextEnabled
                    ? 'Fitur Gamifikasi (Buff, Debuff & Streak) diaktifkan.'
                    : 'Fitur Gamifikasi dimatikan (mode kuis murni).'
                );
              }}
              className={`arcade-btn px-4 py-2.5 rounded-lg text-xs font-extrabold border inline-flex items-center gap-2.5 cursor-pointer shrink-0 whitespace-nowrap ${
                gamificationActive
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-300'
                  : 'bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]'
              }`}
            >
              <span
                className={`w-8 h-4 rounded-full p-0.5 transition-colors inline-flex items-center ${
                  gamificationActive
                    ? 'bg-slate-950/30 justify-end'
                    : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white shadow" />
              </span>
              <span>{gamificationActive ? 'Gamifikasi ON' : 'Gamifikasi OFF'}</span>
            </button>
          </div>

          {/* Mode Gameplay & Kepesertaan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-white inline-flex items-center gap-2">
                  <Ship className="w-4 h-4 text-sky-400" />
                  <span>Mode Gameplay</span>
                </div>
                <span className="text-[11px] font-mono-num text-sky-300">
                  {previewIslandCount} Pulau ({effectiveDeckSize} soal ÷ 5)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    onUpdateSettings({ ...settings, gameplayMode: 'classic' });
                    onNotify('Mode gameplay diatur ke Kuis Klasik.');
                  }}
                  className={`px-3.5 py-2.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    settings.gameplayMode !== 'voyage'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-[#131C31] text-slate-300 border-[#23304C] hover:text-white'
                  }`}
                >
                  Kuis Klasik
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    onUpdateSettings({ ...settings, gameplayMode: 'voyage' });
                    onNotify('Mode gameplay diatur ke Berlayar Harta Karun.');
                  }}
                  className={`px-3.5 py-2.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    settings.gameplayMode === 'voyage'
                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                      : 'bg-[#131C31] text-slate-300 border-[#23304C] hover:text-white'
                  }`}
                >
                  Berlayar Harta Karun
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {gamificationActive
                  ? 'Pada mode Berlayar Harta Karun, setiap 5 soal kapal berlayar 3 langkah dan berlabuh di pulau minigame untuk meraih Buff atau Debuff.'
                  : 'Mode Berlayar Harta Karun tetap menampilkan peta pelayaran & pulau minigame, namun hadiah hanya berupa bonus poin tanpa Buff/Debuff.'}
              </p>
            </div>

            <div
              className={`bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3 transition-opacity ${
                settings.gameplayMode === 'voyage' ? 'opacity-100' : 'opacity-65'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-white inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Kepesertaan (Solo / Tim)</span>
                </div>
                <span className="text-[11px] font-mono-num text-slate-400">
                  {settings.gameplayMode === 'voyage'
                    ? 'Aktif di Berlayar'
                    : 'Khusus Mode Berlayar'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'either', label: 'Bebas' },
                    { id: 'solo', label: 'Solo Saja' },
                    { id: 'team', label: 'Tim Saja' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={settings.gameplayMode !== 'voyage'}
                    onClick={() => {
                      playPopClickFx();
                      onUpdateSettings({
                        ...settings,
                        participationMode: opt.id,
                      });
                    }}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold border ${
                      settings.gameplayMode !== 'voyage'
                        ? 'cursor-not-allowed opacity-60 bg-[#131C31] text-slate-400 border-[#23304C]'
                        : (settings.participationMode || 'either') === opt.id
                          ? 'cursor-pointer bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'cursor-pointer bg-[#131C31] text-slate-300 border-[#23304C] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.gameplayMode === 'voyage'
                  ? 'Atur apakah pelaut boleh memilih bermain Solo atau Tim / Kru di halaman beranda.'
                  : 'Saat memakai Kuis Klasik, seluruh peserta otomatis bermain individu dan pilihan Solo / Tim disembunyikan dari beranda.'}
              </p>
            </div>
          </div>

          {/* Ringkasan Mekanik & Pilih Fitur Gamifikasi */}
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Pilih Fitur Buff &amp; Debuff ({configuredPowerups.length}/
                  {ALL_POWERUP_IDS.length} Aktif)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-num">
                <span className="px-2 py-0.5 rounded bg-[#131C31] border border-[#23304C] text-amber-300">
                  Streak: {streakEnabledSetting ? `${streakTargetPreview} benar` : 'OFF'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#131C31] border border-[#23304C] text-sky-300">
                  Drop Debuff:{' '}
                  {milestoneDropsEnabledSetting &&
                  hasEnabledDebuffs &&
                  debuffMilestonesPreview.length > 0
                    ? `#${debuffMilestonesPreview.join(', #')}`
                    : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Kontrol Mekanik Sumber Item */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity ${
                gamificationActive ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <button
                type="button"
                role="switch"
                aria-checked={streakEnabledSetting}
                disabled={!gamificationActive}
                onClick={() => {
                  playPopClickFx();
                  const nextVal = !streakEnabledSetting;
                  onUpdateSettings({ ...settings, streakEnabled: nextVal });
                  onNotify(
                    nextVal
                      ? 'Hadiah Streak jawaban benar diaktifkan.'
                      : 'Hadiah Streak jawaban benar dimatikan.'
                  );
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${
                  !gamificationActive
                    ? 'cursor-not-allowed bg-[#131C31] border-[#23304C]'
                    : streakEnabledSetting
                      ? 'cursor-pointer bg-amber-400/10 border-amber-400/35 hover:border-amber-400/60'
                      : 'cursor-pointer bg-[#131C31] border-[#23304C] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    Hadiah Streak Benar ({streakTargetPreview}x)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Beri Buff/Debuff aktif setiap menjawab benar beruntun.
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono-num font-extrabold shrink-0 ${
                    streakEnabledSetting
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {streakEnabledSetting ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={milestoneDropsEnabledSetting}
                disabled={!gamificationActive}
                onClick={() => {
                  playPopClickFx();
                  const nextVal = !milestoneDropsEnabledSetting;
                  onUpdateSettings({
                    ...settings,
                    milestoneDropsEnabled: nextVal,
                  });
                  onNotify(
                    nextVal
                      ? 'Drop Debuff otomatis di milestone soal diaktifkan.'
                      : 'Drop Debuff otomatis di milestone soal dimatikan.'
                  );
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${
                  !gamificationActive
                    ? 'cursor-not-allowed bg-[#131C31] border-[#23304C]'
                    : milestoneDropsEnabledSetting
                      ? 'cursor-pointer bg-sky-400/10 border-sky-400/35 hover:border-sky-400/60'
                      : 'cursor-pointer bg-[#131C31] border-[#23304C] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    Drop Debuff Milestone Soal
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {hasEnabledDebuffs
                      ? 'Beri Debuff acak di tengah kuis agar persaingan seru.'
                      : 'Aktifkan minimal 1 item Debuff di bawah agar drop berjalan.'}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono-num font-extrabold shrink-0 ${
                    milestoneDropsEnabledSetting && hasEnabledDebuffs
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {milestoneDropsEnabledSetting ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Preset Cepat Pilihan Item */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-400">
                Klik item di bawah untuk menyalakan/mematikan satu per satu, atau
                pilih cepat:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    id: 'all',
                    label: 'Semua (6)',
                    list: [...ALL_POWERUP_IDS] as PowerupId[],
                    msg: 'Semua 6 item Buff & Debuff diaktifkan.',
                  },
                  {
                    id: 'buffs',
                    label: 'Buff Saja',
                    list: ['DOUBLE_SCORE', 'FIFTY_FIFTY', 'SHIELD'] as PowerupId[],
                    msg: 'Hanya item Buff (Skor 2x, 50:50, Perisai) yang diaktifkan.',
                  },
                  {
                    id: 'double',
                    label: 'Hanya Skor 2x',
                    list: ['DOUBLE_SCORE'] as PowerupId[],
                    msg: 'Hanya Buff Skor 2x yang dinyalakan.',
                  },
                  {
                    id: 'none',
                    label: 'Kosongkan',
                    list: [] as PowerupId[],
                    msg: 'Semua item Buff & Debuff dimatikan.',
                  },
                ].map((preset) => {
                  const isExactMatch =
                    configuredPowerups.length === preset.list.length &&
                    preset.list.every((pid) => configuredPowerups.includes(pid));
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={!gamificationActive}
                      onClick={() => {
                        playPopClickFx();
                        onUpdateSettings({
                          ...settings,
                          enabledPowerups: preset.list,
                        });
                        onNotify(preset.msg);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        !gamificationActive
                          ? 'cursor-not-allowed opacity-50 bg-[#131C31] text-slate-400 border-[#23304C]'
                          : isExactMatch
                            ? 'cursor-pointer bg-amber-400 text-slate-950 border-amber-300'
                            : 'cursor-pointer bg-[#131C31] hover:bg-slate-800 text-slate-200 border-[#23304C]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Toggle Setiap Item Buff / Debuff */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 transition-opacity ${
                gamificationActive ? 'opacity-100' : 'opacity-50'
              }`}
            >
              {Object.values(POWERUP_CATALOG).map((item) => {
                const isItemOn = configuredPowerups.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isItemOn}
                    disabled={!gamificationActive}
                    onClick={() => {
                      playPopClickFx();
                      const nextList = togglePowerupInList(
                        configuredPowerups,
                        item.id
                      );
                      onUpdateSettings({
                        ...settings,
                        enabledPowerups: nextList,
                      });
                      const turnedOn = nextList.includes(item.id);
                      onNotify(
                        turnedOn
                          ? `${item.name} dinyalakan.`
                          : `${item.name} dimatikan.`
                      );
                    }}
                    className={`rounded-xl p-3.5 border text-left flex items-start justify-between gap-2.5 transition-all ${
                      !gamificationActive
                        ? 'cursor-not-allowed bg-[#131C31] border-[#23304C]'
                        : isItemOn
                          ? item.kind === 'buff'
                            ? 'cursor-pointer bg-[#131C31] border-emerald-400/50 hover:border-emerald-300'
                            : 'cursor-pointer bg-[#131C31] border-sky-400/50 hover:border-sky-300'
                          : 'cursor-pointer bg-[#0B1120] border-[#23304C] opacity-60 hover:opacity-85'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0B1120] border border-[#23304C] flex items-center justify-center shrink-0">
                        {renderCatalogIcon(item.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <span className="truncate">{item.name}</span>
                          <span className="text-slate-500" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={
                              item.kind === 'buff'
                                ? 'text-emerald-400'
                                : 'text-sky-400'
                            }
                          >
                            {item.kind === 'buff' ? 'Buff' : 'Debuff'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-extrabold shrink-0 ${
                        isItemOn
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isItemOn ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENGATURAN & TAMPILAN */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Kolom Kiri: Pengaturan Waktu, Soal & Tampilan */}
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Pengaturan Kuis, Timer &amp; Tampilan</span>
            </div>

            {/* Timer Kuis Global (Menit) */}
            <div className="p-3 rounded-lg bg-[#131C31] border border-[#23304C] space-y-2.5">
              <div>
                <label
                  htmlFor="admin-quiz-duration"
                  className="text-xs font-bold text-white inline-flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Timer Kuis Global (Menit)</span>
                </label>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Isi &gt; 0 (mis. 30 menit) untuk mematikan timer per-soal dan
                  memakai 1 timer kuis gabungan.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[0, 15, 30, 45, 60].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      playPopClickFx();
                      setDurationDraft(String(preset));
                      onUpdateSettings({
                        ...settings,
                        quizDurationMinutes: preset,
                      });
                      onNotify(
                        preset === 0
                          ? 'Timer dikembalikan ke hitungan per-soal.'
                          : `Timer kuis global diatur ke ${preset} menit.`
                      );
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono-num font-bold border cursor-pointer ${
                      Number(settings.quizDurationMinutes || 0) === preset
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-[#0B1120] text-slate-300 border-[#23304C] hover:text-white'
                    }`}
                  >
                    {preset === 0 ? 'Per-Soal' : `${preset}m`}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    id="admin-quiz-duration"
                    type="number"
                    min={0}
                    max={180}
                    value={durationDraft}
                    onChange={(e) => setDurationDraft(e.target.value)}
                    className="w-14 px-2 py-1 rounded bg-[#0B1120] border border-[#23304C] text-white text-xs font-mono-num font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      playPopClickFx();
                      const val = Math.max(
                        0,
                        Math.min(180, Math.floor(Number(durationDraft) || 0))
                      );
                      setDurationDraft(String(val));
                      onUpdateSettings({
                        ...settings,
                        quizDurationMinutes: val,
                      });
                      onNotify(
                        val === 0
                          ? 'Timer dikembalikan ke hitungan per-soal.'
                          : `Timer kuis global diatur ke ${val} menit.`
                      );
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
              <div>
                <div className="text-xs font-bold text-white">
                  Tampilkan Leaderboard Live ke Pemain
                </div>
                <div className="text-[11px] text-slate-400">
                  Izinkan peserta melihat klasemen sementara di Lobby &amp; saat
                  kuis berlangsung.
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.showLiveLeaderboardToPlayers)}
                onChange={(e) => {
                  playPopClickFx();
                  onUpdateSettings({
                    ...settings,
                    showLiveLeaderboardToPlayers: e.target.checked,
                  });
                }}
                className="mt-1 accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
              <div>
                <div className="text-xs font-bold text-white">
                  Mode Latihan (Boleh Main Ulang)
                </div>
                <div className="text-[11px] text-slate-400">
                  Buka kunci 1x per perangkat agar peserta bisa mengulang kuis.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowReplay}
                onChange={(e) => {
                  playPopClickFx();
                  onUpdateSettings({ ...settings, allowReplay: e.target.checked });
                }}
                className="mt-1 accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
              <div>
                <div className="text-xs font-bold text-white">
                  Acak Urutan Soal per Pemain
                </div>
                <div className="text-[11px] text-slate-400">
                  Mencegah saling contek urutan nomor antar peserta.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.shuffleQuestions}
                onChange={(e) => {
                  playPopClickFx();
                  onUpdateSettings({
                    ...settings,
                    shuffleQuestions: e.target.checked,
                  });
                }}
                className="mt-1 accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
              <div>
                <div className="text-xs font-bold text-white">
                  Acak Posisi Opsi A–D
                </div>
                <div className="text-[11px] text-slate-400">
                  Posisi opsi pilihan ganda &amp; multi-pilih diacak otomatis.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.shuffleOptions}
                onChange={(e) => {
                  playPopClickFx();
                  onUpdateSettings({
                    ...settings,
                    shuffleOptions: e.target.checked,
                  });
                }}
                className="mt-1 accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
              <div>
                <div className="text-xs font-bold text-white">
                  Mode Ringkas (Embed Google Sites)
                </div>
                <div className="text-[11px] text-slate-400">
                  Menghemat padding vertikal untuk bingkai situs sempit.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => {
                  playPopClickFx();
                  onUpdateSettings({
                    ...settings,
                    compactMode: e.target.checked,
                  });
                }}
                className="mt-1 accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#131C31] border border-[#23304C]">
              <div>
                <label
                  htmlFor="admin-q-limit"
                  className="text-xs font-bold text-white block"
                >
                  Batas Jumlah Soal / Sesi
                </label>
                <span className="text-[11px] text-slate-400">
                  Isi 0 untuk memakai semua ({questions.length}) soal.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  id="admin-q-limit"
                  type="number"
                  min={0}
                  max={200}
                  value={limitDraft}
                  onChange={(e) => setLimitDraft(e.target.value)}
                  className="w-16 px-2.5 py-1.5 rounded bg-[#0B1120] border border-[#23304C] text-white text-xs font-mono-num font-bold text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    const val = Math.max(0, Math.floor(Number(limitDraft) || 0));
                    setLimitDraft(String(val));
                    onUpdateSettings({ ...settings, questionLimit: val });
                    onNotify('Batas jumlah soal disimpan.');
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Keamanan Admin, Bank Default & Ringkasan */}
          <div className="space-y-4">
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Ubah PIN Admin</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                PIN ini digunakan untuk membuka Panel Penyelenggara di ruangan
                aktif saat ini.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="PIN Admin Baru"
                  value={pinDraft}
                  onChange={(e) => setPinDraft(e.target.value)}
                  maxLength={10}
                  placeholder="Minimal 4 karakter"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white font-mono-num font-bold text-xs tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => {
                    playPopClickFx();
                    handleSavePin();
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Simpan PIN
                </button>
              </div>
            </div>

            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
              <div className="text-sm font-bold text-white">
                Pemulihan Bank Soal Bawaan
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kembalikan daftar soal pada ruangan aktif menjadi 30 soal trivia
                Nusantara bawaan apabila ingin memulai ulang materi.
              </p>
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  onResetDefaultQuestions();
                }}
                className="w-full bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] font-bold text-xs px-4 py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Muat Ulang 30 Soal Default
              </button>
            </div>

            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-2.5">
              <div className="text-sm font-bold text-white">
                Ringkasan Konfigurasi Aktif
              </div>
              <dl className="divide-y divide-[#23304C]/70 text-xs">
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-400">Ruang Aktif</dt>
                  <dd className="font-mono-num font-bold text-sky-300">
                    {roomCode ? `#${roomCode}` : 'UMUM'}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-400">Fitur Gamifikasi</dt>
                  <dd
                    className={`font-mono-num font-bold ${
                      gamificationActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {gamificationActive
                      ? `Aktif (${activePowerups.length}/${ALL_POWERUP_IDS.length} item)`
                      : 'Nonaktif'}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-400">Mode Gameplay</dt>
                  <dd className="font-mono-num font-bold text-white">
                    {settings.gameplayMode === 'voyage'
                      ? `Berlayar (${previewIslandCount} Pulau)`
                      : 'Kuis Klasik'}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-400">Timer Kuis</dt>
                  <dd className="font-mono-num font-bold text-amber-300">
                    {settings.quizDurationMinutes > 0
                      ? `Global ${settings.quizDurationMinutes} Menit`
                      : 'Per-Soal'}
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-2">
                  <dt className="text-slate-400">Tampilan &amp; Soal</dt>
                  <dd className="font-mono-num font-bold text-slate-200 text-right">
                    {effectiveDeckSize} Soal ·{' '}
                    {settings.compactMode ? 'Ringkas' : 'Normal'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATISTIK & PESERTA */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-num">
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4">
              <div className="text-xs text-slate-400 font-sans">Total Peserta</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {stats.totalPlayers}
              </div>
            </div>
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4">
              <div className="text-xs text-slate-400 font-sans">Rata-rata Skor</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                {stats.avgScore}
              </div>
            </div>
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4">
              <div className="text-xs text-slate-400 font-sans">Skor Tertinggi</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                {stats.maxScore}
              </div>
            </div>
            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-4">
              <div className="text-xs text-slate-400 font-sans">Rata-rata Benar</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-1">
                {stats.avgCorrectPct}%
              </div>
            </div>
          </div>

          {/* Ketepatan Per Soal */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">
              Statistik Ketepatan Per Soal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {stats.questionStats.map((qs) => (
                <div
                  key={qs.index}
                  className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3"
                >
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">
                      Soal {qs.index + 1} · {qs.category}
                    </span>
                    <span className="font-mono-num text-emerald-400">
                      {qs.accuracyPct}% ({qs.correctTimes}/{qs.answeredCount})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-2">
                    {qs.question}
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full"
                      style={{ width: `${qs.accuracyPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Peserta */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-white">
                Data Peserta &amp; Kontrol Kunci Perangkat
              </h3>
              <button
                type="button"
                onClick={() => setConfirmResetAll(true)}
                className="text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Semua Skor Peserta
              </button>
            </div>

            <div className="bg-[#0B1120] border border-[#23304C] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-slate-400 border-b border-[#23304C] text-xs">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Nama Peserta</th>
                    <th className="py-3 px-4 text-center">Benar</th>
                    <th className="py-3 px-4 text-right">Skor</th>
                    <th className="py-3 px-4">Waktu Selesai</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23304C]/70">
                  {sortedLeaderboard.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400 text-xs"
                      >
                        Belum ada data peserta.
                      </td>
                    </tr>
                  ) : (
                    sortedLeaderboard.map((p, idx) => (
                      <tr key={p.deviceId || idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono-num font-bold">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          <div>{p.name}</div>
                          {p.teamName && (
                            <div className="text-[11px] text-sky-300 font-semibold">
                              Tim {p.teamName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono-num text-emerald-400 font-bold">
                          {p.correct}/{p.totalQuestions || questions.length}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-extrabold text-amber-400">
                          {p.score}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {p.completedAt
                            ? new Date(p.completedAt).toLocaleString('id-ID')
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailPlayer(p)}
                              className="bg-[#131C31] hover:bg-slate-800 text-sky-300 border border-[#23304C] text-xs font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Search className="w-3 h-3" /> Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteOne(p)}
                              className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BANK SOAL CRUD */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Kelola Bank Soal ({questions.length} Soal)
              </h3>
              <p className="text-xs text-slate-400">
                Target streak &amp; milestone debuff otomatis menyesuaikan jumlah
                soal.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  setImportOpen(true);
                }}
                className="arcade-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-3.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-4 h-4" /> Impor CSV / Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  handleExportQuestionsCsv();
                }}
                className="arcade-btn bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-[#23304C] font-bold text-xs sm:text-sm py-2.5 px-3.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-sky-400" /> Ekspor Soal CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  playPopClickFx();
                  openCrudModal(-1);
                }}
                className="arcade-btn-amber bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-3.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Tambah Soal
              </button>
            </div>
          </div>

          {/* Pencarian & Filter Bank Soal */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-[#0B1120] border border-[#23304C] rounded-xl p-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Cari pertanyaan di bank soal"
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Cari teks soal atau kata kunci..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                aria-label="Filter kategori soal"
                value={qCatFilter}
                onChange={(e) => setQCatFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white text-xs font-semibold"
              >
                <option value="ALL">Semua Kategori ({questions.length})</option>
                {dynamicCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({c.count})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                aria-label="Filter tipe soal"
                value={qTypeFilter}
                onChange={(e) => setQTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#131C31] border border-[#23304C] text-white text-xs font-semibold"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="MC">Pilihan Ganda (MC)</option>
                <option value="TF">Benar/Salah (TF)</option>
                <option value="MS">Pilih Beberapa (MS)</option>
                <option value="TEXT">Isian Singkat (TEXT)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
            {filteredQuestions.length === 0 ? (
              <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-6 text-center text-xs text-slate-400">
                Tidak ada soal yang cocok dengan pencarian/filter saat ini.
              </div>
            ) : (
              filteredQuestions.map(({ question: q, index: idx }) => (
                <div
                  key={q.id || idx}
                  className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1">
                      <span className="font-mono-num font-bold text-white">
                        #{idx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300 font-semibold">
                        {q.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">
                        {q.type} ({q.time}d)
                      </span>
                      {q.imageUrl && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-sky-400 font-semibold">
                            Bergambar
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-100">
                      {q.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playPopClickFx();
                        openCrudModal(idx);
                      }}
                      aria-label={`Edit soal ${idx + 1}`}
                      className="bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playPopClickFx();
                        setPendingDeleteQuestionIdx(idx);
                      }}
                      aria-label={`Hapus soal ${idx + 1}`}
                      className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PUBLISH & EMBED */}
      {activeTab === 'googlesites' && (
        <div className="space-y-4">
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Publish ke GitHub Pages &amp; Embed Google Sites
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  File mandiri ini membawa UI pop &amp; suara interaktif, countdown 3-2-1, pengaturan sesi terbaru, {questions.length} soal aktif, PIN Admin, serta ruangan{' '}
                  <strong className="text-slate-200">{roomCode || 'Umum'}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#131C31] border border-[#23304C] rounded-lg p-3.5">
                <div className="text-xs font-extrabold text-amber-300 mb-1.5">
                  Opsi 1 · GitHub Pages (Upload 1 File, Tanpa Terminal)
                </div>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>
                    Klik <strong>Unduh index.html (GitHub Pages)</strong> di bawah.
                  </li>
                  <li>
                    Buat repositori publik baru di <strong>github.com</strong> →{' '}
                    <strong>Add file → Upload files</strong> → upload{' '}
                    <code className="text-amber-300">index.html</code> →{' '}
                    <strong>Commit changes</strong>.
                  </li>
                  <li>
                    Buka <strong>Settings → Pages</strong> → Source{' '}
                    <strong>Deploy from a branch</strong> → pilih branch{' '}
                    <strong>main</strong> &amp; folder <strong>/ (root)</strong> →{' '}
                    <strong>Save</strong>.
                  </li>
                </ol>
              </div>

              <div className="bg-[#131C31] border border-[#23304C] rounded-lg p-3.5">
                <div className="text-xs font-extrabold text-emerald-300 mb-1.5">
                  Opsi 2 · Embed Langsung ke Google Sites
                </div>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>
                    Klik <strong>Salin Kode HTML Google Sites</strong> di bawah.
                  </li>
                  <li>
                    Di <strong>Google Sites</strong> → <strong>Sisipkan</strong> →{' '}
                    <strong>Sematkan (Embed)</strong> → tab{' '}
                    <strong>Sematkan Kode</strong> (atau tempel link GitHub Pages
                    lewat tab <strong>Berdasarkan URL</strong>).
                  </li>
                  <li>
                    Klik <strong>Berikutnya → Sisipkan</strong>, lalu tarik bingkai
                    hingga penuh &amp; publikasikan.
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleDownloadGithubPagesHtml}
                className="arcade-btn bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh index.html (GitHub Pages)
              </button>
              <button
                type="button"
                onClick={handleCopySitesHtml}
                className="arcade-btn-amber bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSitesHtml ? (
                  <>
                    <Check className="w-4 h-4" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Kode HTML Google Sites
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadSitesHtml}
                className="arcade-btn bg-[#131C31] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh .html (Google Sites)
              </button>
            </div>

            <textarea
              readOnly
              aria-label="Kode HTML Embed & Publish"
              value={googleSitesHtml}
              rows={7}
              className="w-full p-3 rounded-lg bg-[#050914] border border-[#23304C] text-slate-300 font-mono text-[11px] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Modal Detail Analisis Peserta */}
      {detailPlayer && detailMetrics && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#23304C] pb-4 mb-4">
              <div>
                <div className="text-xs text-amber-300 font-semibold">
                  Analisis Detail Peserta
                </div>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {detailPlayer.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 break-all">
                  ID: {detailPlayer.deviceId} · Selesai:{' '}
                  {detailPlayer.completedAt
                    ? new Date(detailPlayer.completedAt).toLocaleString('id-ID')
                    : '-'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup detail peserta"
                onClick={() => setDetailPlayer(null)}
                className="p-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 font-mono-num">
              <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-sans">Skor</div>
                <div className="text-lg font-extrabold text-amber-400">
                  {detailPlayer.score}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-sans">Akurasi</div>
                <div className="text-lg font-extrabold text-emerald-400">
                  {detailPlayer.correct}/{detailPlayer.totalQuestions || questions.length}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-sans">Tercepat</div>
                <div className="text-sm font-extrabold text-sky-400 mt-0.5">
                  {detailMetrics.fastestLabel}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-sans">Total Waktu</div>
                <div className="text-lg font-extrabold text-slate-200">
                  {detailMetrics.totalDuration > 0
                    ? `${detailMetrics.totalDuration}d`
                    : '-'}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {detailMetrics.hist.map((h, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs ${
                    h.isCorrect
                      ? 'bg-emerald-500/5 border-emerald-400/30'
                      : 'bg-rose-500/5 border-rose-400/30'
                  }`}
                >
                  <div className="flex justify-between font-bold mb-1">
                    <span
                      className={
                        h.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }
                    >
                      Soal #{i + 1} · {h.isCorrect ? 'BENAR' : 'SALAH'}
                    </span>
                    <span className="font-mono-num text-slate-300">
                      {h.timeTaken}d · +{h.pointsEarned}
                    </span>
                  </div>
                  <p className="font-semibold text-white mb-1">{h.question}</p>
                  <div className="text-slate-300">
                    Jawaban: <strong>{h.userAnswer}</strong>
                    {!h.isCorrect && (
                      <span className="text-emerald-300 ml-2">
                        (Kunci: {h.correctAnswer})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Soal */}
      {crudOpen && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-white">
                {crudEditIndex >= 0
                  ? `Edit Soal #${crudEditIndex + 1}`
                  : 'Tambah Soal Baru'}
              </h3>
              <button
                type="button"
                aria-label="Tutup form soal"
                onClick={() => setCrudOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="crud-category"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Kategori
                  </label>
                  <select
                    id="crud-category"
                    value={crudCategory}
                    onChange={(e) => setCrudCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-semibold"
                  >
                    {dynamicCategories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Kategori Baru...</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="crud-type"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Tipe Soal
                  </label>
                  <select
                    id="crud-type"
                    value={crudType}
                    onChange={(e) => setCrudType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-semibold"
                  >
                    <option value="MC">Multiple Choice</option>
                    <option value="TF">True or False</option>
                    <option value="MS">Multiple Select</option>
                    <option value="TEXT">Isian Singkat</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="crud-time"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Waktu (Detik)
                  </label>
                  <input
                    id="crud-time"
                    type="number"
                    min={10}
                    max={120}
                    value={crudTime}
                    onChange={(e) => setCrudTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-mono-num font-bold"
                  />
                </div>
              </div>

              {crudCategory === '__CUSTOM__' && (
                <div>
                  <label
                    htmlFor="crud-custom-category"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Nama Kategori Baru
                  </label>
                  <input
                    id="crud-custom-category"
                    type="text"
                    value={crudCustomCategory}
                    onChange={(e) => setCrudCustomCategory(e.target.value)}
                    placeholder="Contoh: Sejarah Kemerdekaan"
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-bold"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="crud-question"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Teks Pertanyaan
                </label>
                <textarea
                  id="crud-question"
                  rows={2}
                  value={crudQuestion}
                  onChange={(e) => setCrudQuestion(e.target.value)}
                  placeholder="Tulis pertanyaan di sini..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-950 font-semibold text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="crud-image-url"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  URL Gambar Soal (Opsional)
                </label>
                <input
                  id="crud-image-url"
                  type="url"
                  value={crudImageUrl}
                  onChange={(e) => setCrudImageUrl(e.target.value)}
                  placeholder="https://contoh.com/gambar-peta.jpg"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs"
                />
              </div>

              {(crudType === 'MC' || crudType === 'MS') && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Opsi Jawaban (A - D)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((letter, i) => (
                      <div
                        key={letter}
                        className="flex items-center gap-2 bg-[#0B1120] border border-[#23304C] p-1.5 rounded-lg"
                      >
                        <span className="w-7 h-7 rounded bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          aria-label={`Opsi ${letter}`}
                          value={crudOpts[i]}
                          onChange={(e) => {
                            const next = [...crudOpts];
                            next[i] = e.target.value;
                            setCrudOpts(next);
                          }}
                          placeholder={`Opsi ${letter}...`}
                          className="w-full px-2.5 py-1.5 rounded bg-white text-slate-950 text-xs font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {crudType === 'MC' && (
                <div>
                  <label
                    htmlFor="crud-mc-ans"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Kunci Jawaban Benar
                  </label>
                  <select
                    id="crud-mc-ans"
                    value={crudAnswerMc}
                    onChange={(e) => setCrudAnswerMc(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-bold"
                  >
                    <option value={0}>Opsi A</option>
                    <option value={1}>Opsi B</option>
                    <option value={2}>Opsi C</option>
                    <option value={3}>Opsi D</option>
                  </select>
                </div>
              )}

              {crudType === 'TF' && (
                <div>
                  <label
                    htmlFor="crud-tf-ans"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Kunci Jawaban Benar
                  </label>
                  <select
                    id="crud-tf-ans"
                    value={crudAnswerTf}
                    onChange={(e) => setCrudAnswerTf(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-[#23304C] text-white text-xs font-bold"
                  >
                    <option value={0}>Benar (True)</option>
                    <option value={1}>Salah (False)</option>
                  </select>
                </div>
              )}

              {crudType === 'MS' && (
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-1">
                    Centang Kunci Jawaban Benar
                  </div>
                  <div className="flex flex-wrap gap-4 bg-[#0B1120] border border-[#23304C] p-3 rounded-lg text-xs">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <label
                        key={letter}
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={crudAnswerMs.includes(idx)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCrudAnswerMs([...crudAnswerMs, idx]);
                            } else {
                              setCrudAnswerMs(
                                crudAnswerMs.filter((x) => x !== idx)
                              );
                            }
                          }}
                        />
                        Opsi {letter}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {crudType === 'TEXT' && (
                <div>
                  <label
                    htmlFor="crud-text-ans"
                    className="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Kata Kunci Diterima (pisahkan koma)
                  </label>
                  <input
                    id="crud-text-ans"
                    type="text"
                    value={crudAnswerText}
                    onChange={(e) => setCrudAnswerText(e.target.value)}
                    placeholder="Contoh: jakarta, dki jakarta"
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-semibold"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="crud-exp"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Penjelasan / Pembahasan
                </label>
                <textarea
                  id="crud-exp"
                  rows={2}
                  value={crudExplanation}
                  onChange={(e) => setCrudExplanation(e.target.value)}
                  placeholder="Penjelasan singkat jawaban benar..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-medium"
                />
              </div>

              {crudError && (
                <p className="text-rose-400 text-xs font-semibold">{crudError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCrudOpen(false)}
                  className="flex-1 bg-[#0B1120] hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg border border-[#23304C] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrud}
                  className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold py-2.5 rounded-lg cursor-pointer"
                >
                  Simpan Soal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Soal */}
      {pendingDeleteQuestionIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#131C31] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              Hapus Soal #{pendingDeleteQuestionIdx + 1}?
            </h3>
            <p className="text-xs text-slate-300 mb-5 line-clamp-3">
              {questions[pendingDeleteQuestionIdx]?.question}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteQuestionIdx(null)}
                className="flex-1 bg-[#0B1120] text-white font-bold py-2.5 rounded-lg border border-[#23304C] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = pendingDeleteQuestionIdx;
                  setPendingDeleteQuestionIdx(null);
                  onDeleteQuestion(idx);
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-extrabold py-2.5 rounded-lg cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus 1 Peserta */}
      {pendingDeleteOne && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131C31] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              Hapus Peserta Ini?
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Skor milik <strong>{pendingDeleteOne.name}</strong> (
              {pendingDeleteOne.score} poin) akan dihapus dan perangkatnya
              diizinkan bermain lagi.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteOne(null)}
                className="flex-1 bg-[#0B1120] text-white font-bold py-2.5 rounded-lg border border-[#23304C] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = pendingDeleteOne;
                  setPendingDeleteOne(null);
                  onDeleteParticipant(target);
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-extrabold py-2.5 rounded-lg cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Semua */}
      {confirmResetAll && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131C31] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              Reset Semua Data Peserta?
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Seluruh skor di Leaderboard akan dihapus sehingga peserta dapat
              bermain kembali dari awal.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="flex-1 bg-[#0B1120] text-white font-bold py-2.5 rounded-lg border border-[#23304C] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmResetAll(false);
                  onResetAllLeaderboard();
                }}
                className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-extrabold py-2.5 rounded-lg cursor-pointer"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impor Soal CSV / Spreadsheet / JSON */}
      {importOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-modal-title"
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-[#131C31] border border-[#23304C] rounded-2xl p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#23304C] pb-4">
              <div>
                <div className="text-xs font-semibold text-emerald-400 mb-0.5">
                  Konversi Otomatis Bank Soal
                </div>
                <h3
                  id="import-modal-title"
                  className="text-lg sm:text-xl font-extrabold text-white"
                >
                  Impor Soal dari CSV / Excel / Google Sheets
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mendukung file <code className="text-amber-300">.csv</code>{' '}
                  (koma atau titik-koma Excel Indonesia), salinan tabel Google
                  Sheets / Excel, maupun <code className="text-amber-300">.json</code>.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal impor soal"
                onClick={() => setImportOpen(false)}
                className="p-1.5 rounded-lg bg-[#0B1120] border border-[#23304C] text-slate-300 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File CSV / TXT / JSON</span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,.json,text/csv,text/plain,application/json"
                    onChange={handleImportFileChange}
                    className="sr-only"
                  />
                </label>
                {importFileName && (
                  <span className="text-xs text-emerald-300 font-semibold">
                    File: {importFileName}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownloadQuestionTemplate}
                className="bg-[#131C31] hover:bg-slate-800 text-sky-300 border border-[#23304C] font-bold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Template CSV
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-[#0B1120]/70 border border-[#23304C] rounded-lg px-3.5 py-2.5 leading-relaxed">
              Urutan kolom:{' '}
              <code className="text-slate-200 font-mono-num">
                kategori, tipe, waktu, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban, pembahasan, gambar
              </code>
              . Kolom <strong className="text-slate-200">gambar</strong> bersifat opsional (URL).
            </div>

            <div>
              <label
                htmlFor="csv-import-textarea"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Atau tempel isi CSV / salinan sel Excel &amp; Google Sheets di sini
              </label>
              <textarea
                id="csv-import-textarea"
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'kategori,tipe,waktu,pertanyaan,opsi_a,opsi_b,opsi_c,opsi_d,jawaban,pembahasan,gambar\nWawasan Nusantara,MC,25,Ibu kota Kalimantan Timur?,Balikpapan,Samarinda,Pontianak,Banjarmasin,B,Samarinda adalah ibu kota resmi Kalimantan Timur.,'}
                className="w-full p-3 rounded-xl bg-[#050914] border border-[#23304C] text-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {importText.trim().length > 0 && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-emerald-400">
                    {importPreview.questions.length} soal valid siap dikonversi (
                    {importPreview.format.toUpperCase()})
                  </span>
                  {importPreview.errors.length > 0 && (
                    <span className="font-bold text-rose-400 inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {importPreview.errors.length} baris dilewati
                    </span>
                  )}
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 max-h-28 overflow-y-auto space-y-1 text-xs text-rose-200">
                    {importPreview.errors.map((err, i) => (
                      <div key={i}>
                        <strong>Baris {err.rowNumber}:</strong> {err.message}
                      </div>
                    ))}
                  </div>
                )}

                {importPreview.questions.length > 0 && (
                  <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3 max-h-44 overflow-y-auto space-y-2">
                    {importPreview.questions.slice(0, 20).map((q, idx) => (
                      <div
                        key={idx}
                        className="border-b border-[#23304C]/70 last:border-none pb-2 last:pb-0 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-slate-400 mb-0.5">
                          <span>
                            <strong className="text-white font-mono-num">
                              #{idx + 1}
                            </strong>{' '}
                            · <span className="text-amber-300">{q.category}</span> ·{' '}
                            {q.type} ({q.time}d)
                          </span>
                          <span className="text-emerald-400 font-semibold truncate max-w-[14rem]">
                            Kunci: {getCorrectAnswerDisplay(q)}
                          </span>
                        </div>
                        <p className="text-slate-100 font-semibold truncate">
                          {q.question}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                disabled={importPreview.questions.length === 0}
                onClick={() => handleConfirmImport('append')}
                className="flex-1 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl cursor-pointer disabled:cursor-not-allowed"
              >
                Tambahkan ke Bank Soal (+{importPreview.questions.length})
              </button>
              <button
                type="button"
                disabled={importPreview.questions.length === 0}
                onClick={() => handleConfirmImport('replace')}
                className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-xl cursor-pointer disabled:cursor-not-allowed"
              >
                Gantikan Bank Soal ({importPreview.questions.length} Soal)
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="bg-[#0B1120] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-[#23304C] cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
