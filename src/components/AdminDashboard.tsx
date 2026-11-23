import React, { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileSpreadsheet,
  Hourglass,
  Lock,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import {
  buildCsvContent,
  computeAdminStats,
  getSessionLockFlags,
} from '../quiz/engine';
import { generateGoogleSitesHtml } from '../quiz/googleSitesExport';
import type {
  ActivePlayer,
  PlayerRecord,
  Question,
  QuestionType,
  SessionMode,
  WaitingPlayer,
} from '../quiz/types';

type AdminTab = 'session' | 'stats' | 'questions' | 'googlesites';

interface AdminDashboardProps {
  questions: Question[];
  leaderboard: PlayerRecord[];
  sessionMode: SessionMode;
  waitingPlayers: WaitingPlayer[];
  activePlayers: ActivePlayer[];
  onSetSessionMode: (mode: SessionMode) => void;
  onResetSessionMode: () => void;
  onResetDefaultQuestions: () => void;
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
  waitingPlayers,
  activePlayers,
  onSetSessionMode,
  onResetSessionMode,
  onResetDefaultQuestions,
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
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  // CRUD Modal State
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudEditIndex, setCrudEditIndex] = useState(-1);
  const [crudCategory, setCrudCategory] = useState('Manusia & Hewan');
  const [crudType, setCrudType] = useState<QuestionType>('MC');
  const [crudTime, setCrudTime] = useState(25);
  const [crudQuestion, setCrudQuestion] = useState('');
  const [crudOpts, setCrudOpts] = useState(['', '', '', '']);
  const [crudAnswerMc, setCrudAnswerMc] = useState(0);
  const [crudAnswerTf, setCrudAnswerTf] = useState(0);
  const [crudAnswerMs, setCrudAnswerMs] = useState<number[]>([]);
  const [crudAnswerText, setCrudAnswerText] = useState('');
  const [crudExplanation, setCrudExplanation] = useState('');
  const [crudError, setCrudError] = useState('');

  const [copiedSitesHtml, setCopiedSitesHtml] = useState(false);

  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [leaderboard]
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

  const googleSitesHtml = useMemo(
    () => generateGoogleSitesHtml(questions),
    [questions]
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

  const openCrudModal = (editIdx = -1) => {
    setCrudEditIndex(editIdx);
    setCrudError('');
    if (editIdx >= 0 && questions[editIdx]) {
      const q = questions[editIdx];
      setCrudCategory(q.category);
      setCrudType(q.type);
      setCrudTime(q.time || 25);
      setCrudQuestion(q.question);
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
      setCrudCategory('Manusia & Hewan');
      setCrudType('MC');
      setCrudTime(25);
      setCrudQuestion('');
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
    const expText =
      crudExplanation.trim() || 'Jawaban sesuai kunci yang ditetapkan admin.';

    const base: Question = {
      id:
        crudEditIndex >= 0
          ? questions[crudEditIndex]?.id || `custom-${Date.now()}`
          : `custom-${Date.now()}`,
      category: crudCategory,
      type: crudType,
      time: Math.max(10, Math.min(120, Number(crudTime) || 25)),
      question: qText,
      explanation: expText,
    };

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
    const wrongNums: number[] = [];

    hist.forEach((h, i) => {
      if (typeof h.timeTaken === 'number') {
        totalDuration += h.timeTaken;
        if (h.timeTaken < fastestTime) {
          fastestTime = h.timeTaken;
          fastestNum = i + 1;
        }
      }
      if (!h.isCorrect) wrongNums.push(i + 1);
    });

    return {
      hist,
      totalDuration,
      fastestLabel:
        fastestNum !== null ? `Soal #${fastestNum} (${fastestTime}d)` : '-',
      wrongNums,
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
          <div className="text-xs font-semibold text-amber-300 mb-1">
            Panel Penyelenggara
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Kontrol Sesi &amp; Statistik Kuis
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" /> Unduh CSV
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#0B1120] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-lg border border-[#23304C] transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <X className="w-4 h-4" /> Tutup
          </button>
        </div>
      </div>

      {/* Navigasi Tab Admin */}
      <div
        role="tablist"
        aria-label="Menu Admin"
        className="flex flex-wrap gap-1.5 p-1 bg-[#0B1120] border border-[#23304C] rounded-xl mb-6"
      >
        {(
          [
            { id: 'session', label: 'Kontrol Sesi' },
            { id: 'stats', label: `Statistik & Peserta (${sortedLeaderboard.length})` },
            { id: 'questions', label: `Bank Soal (${questions.length})` },
            { id: 'googlesites', label: 'Embed Google Sites' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5">
            <h3 className="text-base font-bold text-white mb-1">
              Mode Pelaksanaan (Bebas vs Live Bareng)
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Secara bawaan peserta menunggu pilihan Admin. Jika salah satu mode
              sudah berjalan dengan peserta aktif/selesai, mode lainnya otomatis
              terkunci agar sesi tetap konsisten.
            </p>

            <div className="flex flex-wrap gap-2.5 mb-4">
              <button
                type="button"
                disabled={lockFlags.isFreeLockedOut}
                onClick={() => onSetSessionMode('free')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                  lockFlags.isFreeLockedOut
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : sessionMode === 'free'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 cursor-pointer'
                      : 'bg-[#131C31] text-slate-200 border-[#23304C] hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {lockFlags.isFreeLockedOut ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Mode Bebas (Terkunci)
                  </>
                ) : (
                  'Mode Bebas'
                )}
              </button>

              <button
                type="button"
                disabled={lockFlags.isLiveLockedOut}
                onClick={() => onSetSessionMode('live_waiting')}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition whitespace-nowrap ${
                  lockFlags.isLiveLockedOut
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : sessionMode === 'live_waiting'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 cursor-pointer'
                      : 'bg-[#131C31] text-slate-200 border-[#23304C] hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {lockFlags.isLiveLockedOut ? (
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
                  lockFlags.isLiveLockedOut ||
                  sessionMode === 'unconfigured' ||
                  sessionMode === 'free'
                }
                onClick={() => onSetSessionMode('live_started')}
                className={`px-4 py-2.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
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
                onClick={onResetSessionMode}
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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

          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">
                Peserta di Ruang Tunggu Live ({waitingPlayers.length})
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {waitingPlayers.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    Belum ada peserta menunggu di lobby live.
                  </span>
                ) : (
                  waitingPlayers.map((p) => (
                    <span
                      key={p.deviceId}
                      className="px-2.5 py-1 rounded-md bg-[#131C31] border border-[#23304C] text-xs text-slate-200 font-semibold"
                    >
                      {p.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onResetDefaultQuestions}
              className="bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] font-bold text-xs px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Muat Ulang 30 Soal Default
            </button>
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
                          {p.name}
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
            <button
              type="button"
              onClick={() => openCrudModal(-1)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-lg inline-flex items-center gap-1.5 cursor-pointer w-fit whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Tambah Soal Baru
            </button>
          </div>

          <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-[#0B1120] border border-[#23304C] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
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
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-100">
                    {q.question}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCrudModal(idx)}
                    aria-label={`Edit soal ${idx + 1}`}
                    className="bg-[#131C31] hover:bg-slate-800 text-amber-300 border border-[#23304C] text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteQuestion(idx)}
                    aria-label={`Hapus soal ${idx + 1}`}
                    className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EMBED GOOGLE SITES */}
      {activeTab === 'googlesites' && (
        <div className="space-y-4">
          <div className="bg-[#0B1120] border border-[#23304C] rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Ekspor HTML Siap Tempel untuk Google Sites
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Kode ini sudah menyertakan seluruh revisi (perbaikan sabotase
                  live antar pemain aktif, unduh CSV aman di iframe, indikator
                  buff aktif, dan {questions.length} soal terbarumu) dengan
                  konfigurasi Firebase <strong className="text-slate-200">quizmrng</strong>.
                </p>
              </div>
            </div>

            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-[#131C31] border border-[#23304C] rounded-lg p-3.5">
              <li>Klik tombol <strong>Salin Kode HTML</strong> di bawah.</li>
              <li>
                Buka editor <strong>Google Sites</strong> → menu{' '}
                <strong>Sisipkan (Insert)</strong> → <strong>Sematkan (Embed)</strong> → tab{' '}
                <strong>Sematkan Kode (Embed Code)</strong>.
              </li>
              <li>
                Tempelkan kode, klik <strong>Berikutnya</strong> →{' '}
                <strong>Sisipkan</strong>, lalu tarik bingkai embed hingga penuh
                dan publikasikan.
              </li>
            </ol>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleCopySitesHtml}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
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
                className="bg-[#131C31] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg border border-[#23304C] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh .html
              </button>
            </div>

            <textarea
              readOnly
              aria-label="Kode HTML Embed Google Sites"
              value={googleSitesHtml}
              rows={8}
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
                    <option value="Manusia & Hewan">Manusia &amp; Hewan</option>
                    <option value="Logika & Hitungan">Logika &amp; Hitungan</option>
                    <option value="Wawasan Nusantara">Wawasan Nusantara</option>
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
    </section>
  );
};
