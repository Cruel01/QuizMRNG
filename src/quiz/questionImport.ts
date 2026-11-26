import { sanitizeImageUrl } from './engine';
import type { Question, QuestionType } from './types';

export interface QuestionImportError {
  rowNumber: number;
  message: string;
}

export interface QuestionImportResult {
  questions: Question[];
  errors: QuestionImportError[];
  format: 'csv' | 'tsv' | 'semicolon-csv' | 'json';
}

export function detectCsvDelimiter(rawText: string): ',' | ';' | '\t' {
  const firstNonEmptyLine =
    rawText
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0) || '';

  let inQuotes = false;
  let tabs = 0;
  let semis = 0;
  let commas = 0;

  for (let i = 0; i < firstNonEmptyLine.length; i++) {
    const ch = firstNonEmptyLine[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === '\t') tabs++;
      else if (ch === ';') semis++;
      else if (ch === ',') commas++;
    }
  }

  if (tabs > 0 && tabs >= commas && tabs >= semis) return '\t';
  if (semis > 0 && semis >= commas) return ';';
  return ',';
}

export function parseTabularRows(rawText: string): {
  delimiter: ',' | ';' | '\t';
  rows: string[][];
} {
  const clean = rawText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const delimiter = detectCsvDelimiter(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\n') {
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) {
    rows.push(row);
  }

  return { delimiter, rows };
}

function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function normalizeQuestionType(raw: string): QuestionType | null {
  const v = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (
    !v ||
    v === 'MC' ||
    v === 'PG' ||
    v === 'PILIHAN GANDA' ||
    v === 'MULTIPLE CHOICE'
  ) {
    return 'MC';
  }
  if (
    v === 'TF' ||
    v === 'BS' ||
    v === 'BENAR SALAH' ||
    v === 'BENAR/SALAH' ||
    v === 'BENAR / SALAH' ||
    v === 'TRUE FALSE' ||
    v === 'TRUE/FALSE' ||
    v === 'TRUE OR FALSE'
  ) {
    return 'TF';
  }
  if (
    v === 'MS' ||
    v === 'PGK' ||
    v === 'PILIH BEBERAPA' ||
    v === 'MULTIPLE SELECT' ||
    v === 'CHECKBOX'
  ) {
    return 'MS';
  }
  if (
    v === 'TEXT' ||
    v === 'ISIAN' ||
    v === 'ISIAN SINGKAT' ||
    v === 'ESSAY' ||
    v === 'JAWABAN SINGKAT'
  ) {
    return 'TEXT';
  }
  return null;
}

function resolveChoiceIndex(token: string, options: string[]): number | null {
  const cleaned = token.trim();
  if (!cleaned) return null;
  const upper = cleaned.toUpperCase();
  const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  if (upper in letterMap && letterMap[upper] < options.length) {
    return letterMap[upper];
  }
  if (/^[1-4]$/.test(upper)) {
    const idx = Number(upper) - 1;
    if (idx < options.length) return idx;
  }
  if (upper === '0' && options.length > 0) {
    return 0;
  }
  const exactMatch = options.findIndex(
    (opt) => opt.trim().toLowerCase() === cleaned.toLowerCase()
  );
  return exactMatch >= 0 ? exactMatch : null;
}

function resolveTrueFalseWithOptionB(
  token: string,
  options: string[]
): number | null {
  const upper = token.trim().toUpperCase();
  if (!upper) return null;
  if (upper === 'B') return 1;
  if (
    upper === 'A' ||
    upper === '0' ||
    upper === '1' ||
    upper === 'BENAR' ||
    upper === 'TRUE' ||
    upper === 'YA' ||
    upper === 'T'
  ) {
    return 0;
  }
  if (
    upper === 'SALAH' ||
    upper === 'FALSE' ||
    upper === 'S' ||
    upper === '2' ||
    upper === 'TIDAK' ||
    upper === 'F'
  ) {
    return 1;
  }
  const exactMatch = options.findIndex(
    (opt) => opt.trim().toLowerCase() === token.trim().toLowerCase()
  );
  return exactMatch >= 0 ? exactMatch : null;
}

interface ColumnIndices {
  category: number;
  type: number;
  time: number;
  question: number;
  optA: number;
  optB: number;
  optC: number;
  optD: number;
  answer: number;
  explanation: number;
  imageUrl: number;
}

const DEFAULT_COLUMNS: ColumnIndices = {
  category: 0,
  type: 1,
  time: 2,
  question: 3,
  optA: 4,
  optB: 5,
  optC: 6,
  optD: 7,
  answer: 8,
  explanation: 9,
  imageUrl: 10,
};

function detectColumnMapping(firstRow: string[]): {
  hasHeader: boolean;
  cols: ColumnIndices;
} {
  const keys = firstRow.map(normalizeHeaderKey);
  const headerIndicators = [
    'pertanyaan',
    'question',
    'soal',
    'kategori',
    'category',
    'jawaban',
    'kunci',
    'answer',
    'opsi_a',
  ];
  const hasHeader = keys.some((k) => headerIndicators.includes(k));
  if (!hasHeader) {
    return { hasHeader: false, cols: DEFAULT_COLUMNS };
  }

  const findCol = (aliases: string[], fallback: number) => {
    const idx = keys.findIndex((k) => aliases.includes(k));
    return idx >= 0 ? idx : fallback;
  };

  return {
    hasHeader: true,
    cols: {
      category: findCol(['kategori', 'category'], -1),
      type: findCol(['tipe', 'type', 'jenis', 'format'], -1),
      time: findCol(['waktu', 'time', 'durasi', 'detik'], -1),
      question: findCol(
        ['pertanyaan', 'question', 'soal', 'teks_pertanyaan'],
        -1
      ),
      optA: findCol(['opsi_a', 'opsi1', 'pilihan_a', 'a', 'option_a'], -1),
      optB: findCol(['opsi_b', 'opsi2', 'pilihan_b', 'b', 'option_b'], -1),
      optC: findCol(['opsi_c', 'opsi3', 'pilihan_c', 'c', 'option_c'], -1),
      optD: findCol(['opsi_d', 'opsi4', 'pilihan_d', 'd', 'option_d'], -1),
      answer: findCol(
        ['jawaban', 'kunci', 'kunci_jawaban', 'answer', 'correct'],
        -1
      ),
      explanation: findCol(
        ['pembahasan', 'penjelasan', 'explanation', 'keterangan'],
        -1
      ),
      imageUrl: findCol(
        ['gambar', 'image', 'image_url', 'url_gambar', 'foto'],
        -1
      ),
    },
  };
}

function tryImportJson(rawText: string): QuestionImportResult | null {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(trimmed);
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : Array.isArray(parsed?.questions)
          ? parsed.questions
          : null;

    if (!items) {
      return {
        questions: [],
        errors: [
          {
            rowNumber: 1,
            message:
              'Format JSON harus berupa array soal ([...]) atau objek { "items": [...] }.',
          },
        ],
        format: 'json',
      };
    }

    const questions: Question[] = [];
    const errors: QuestionImportError[] = [];

    items.forEach((raw: Record<string, unknown>, i: number) => {
      const rowNum = i + 1;
      const qText = typeof raw?.question === 'string' ? raw.question.trim() : '';
      const qType = normalizeQuestionType(String(raw?.type ?? 'MC'));
      if (!qText || !qType) {
        errors.push({
          rowNumber: rowNum,
          message: 'Pertanyaan atau tipe soal pada JSON tidak valid.',
        });
        return;
      }
      const category =
        typeof raw?.category === 'string' && raw.category.trim()
          ? raw.category.trim()
          : 'Wawasan Nusantara';
      const timeRaw = Number(raw?.time);
      const time = Number.isFinite(timeRaw)
        ? Math.max(10, Math.min(120, Math.round(timeRaw)))
        : 25;
      const explanation =
        typeof raw?.explanation === 'string' && raw.explanation.trim()
          ? raw.explanation.trim()
          : 'Jawaban sesuai kunci yang ditetapkan admin.';
      const imageUrl = sanitizeImageUrl(
        typeof raw?.imageUrl === 'string'
          ? raw.imageUrl
          : typeof raw?.gambar === 'string'
            ? raw.gambar
            : ''
      );

      if (qType === 'TEXT') {
        const accepted = Array.isArray(raw?.acceptedAnswers)
          ? raw.acceptedAnswers.map((s) => String(s).trim()).filter(Boolean)
          : [];
        if (accepted.length === 0) {
          errors.push({
            rowNumber: rowNum,
            message: 'Soal TEXT wajib memiliki minimal 1 acceptedAnswers.',
          });
          return;
        }
        const entry: Question = {
          id: typeof raw?.id === 'string' && raw.id ? raw.id : `imp-${Date.now()}-${i}`,
          category,
          type: 'TEXT',
          time,
          question: qText,
          acceptedAnswers: accepted,
          explanation,
        };
        if (imageUrl) entry.imageUrl = imageUrl;
        questions.push(entry);
      } else {
        const opts = Array.isArray(raw?.options)
          ? raw.options.map((s) => String(s).trim()).filter(Boolean)
          : qType === 'TF'
            ? ['Benar (True)', 'Salah (False)']
            : [];
        if ((qType === 'MC' || qType === 'MS') && opts.length < 2) {
          errors.push({
            rowNumber: rowNum,
            message: `Soal ${qType} wajib memiliki minimal 2 opsi.`,
          });
          return;
        }
        const entry: Question = {
          id: typeof raw?.id === 'string' && raw.id ? raw.id : `imp-${Date.now()}-${i}`,
          category,
          type: qType,
          time,
          question: qText,
          options: opts,
          answer:
            qType === 'MS'
              ? Array.isArray(raw?.answer)
                ? raw.answer.map(Number)
                : [0]
              : Number(raw?.answer) || 0,
          explanation,
        };
        if (imageUrl) entry.imageUrl = imageUrl;
        questions.push(entry);
      }
    });

    return { questions, errors, format: 'json' };
  } catch {
    return {
      questions: [],
      errors: [
        {
          rowNumber: 1,
          message: 'JSON tidak valid (periksa tanda kutip dan koma).',
        },
      ],
      format: 'json',
    };
  }
}

export function parseQuestionsImport(rawText: string): QuestionImportResult {
  const jsonAttempt = tryImportJson(rawText);
  if (jsonAttempt) return jsonAttempt;

  const { delimiter, rows } = parseTabularRows(rawText);
  const format: QuestionImportResult['format'] =
    delimiter === '\t' ? 'tsv' : delimiter === ';' ? 'semicolon-csv' : 'csv';

  if (rows.length === 0) {
    return { questions: [], errors: [], format };
  }

  const { hasHeader, cols } = detectColumnMapping(rows[0]);
  const startIdx = hasHeader ? 1 : 0;
  const questions: Question[] = [];
  const errors: QuestionImportError[] = [];

  for (let r = startIdx; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    const get = (idx: number) =>
      idx >= 0 && idx < row.length ? row[idx].trim() : '';

    const questionText = get(cols.question);
    if (!questionText) {
      errors.push({ rowNumber: rowNum, message: 'Teks pertanyaan kosong.' });
      continue;
    }

    const typeRaw = get(cols.type);
    const parsedType = normalizeQuestionType(typeRaw);
    if (!parsedType) {
      errors.push({
        rowNumber: rowNum,
        message: `Tipe soal "${typeRaw}" tidak dikenali (gunakan MC, TF, MS, atau TEXT).`,
      });
      continue;
    }

    const category = get(cols.category) || 'Wawasan Nusantara';
    const rawTime = Number(get(cols.time));
    const time =
      Number.isFinite(rawTime) && rawTime > 0
        ? Math.max(10, Math.min(120, Math.round(rawTime)))
        : 25;
    const explanation =
      get(cols.explanation) || 'Jawaban sesuai kunci yang ditetapkan admin.';
    const imageUrl = sanitizeImageUrl(get(cols.imageUrl));
    const rawAnswer = get(cols.answer);
    const optA = get(cols.optA);
    const optB = get(cols.optB);
    const optC = get(cols.optC);
    const optD = get(cols.optD);

    if (parsedType === 'MC') {
      const options = [optA, optB, optC, optD].filter(Boolean);
      if (options.length < 2) {
        errors.push({
          rowNumber: rowNum,
          message:
            'Soal MC wajib memiliki minimal Opsi A dan Opsi B (disarankan A–D).',
        });
        continue;
      }
      const ansIdx = resolveChoiceIndex(rawAnswer, options);
      if (ansIdx === null) {
        errors.push({
          rowNumber: rowNum,
          message: `Kunci jawaban "${rawAnswer || '(kosong)'}" tidak cocok dengan opsi MC.`,
        });
        continue;
      }
      const entry: Question = {
        id: `imp-${Date.now()}-${r}`,
        category,
        type: 'MC',
        time,
        question: questionText,
        options,
        answer: ansIdx,
        explanation,
      };
      if (imageUrl) entry.imageUrl = imageUrl;
      questions.push(entry);
    } else if (parsedType === 'TF') {
      const options = [optA || 'Benar (True)', optB || 'Salah (False)'];
      const ansIdx = resolveTrueFalseWithOptionB(rawAnswer, options);
      if (ansIdx === null) {
        errors.push({
          rowNumber: rowNum,
          message: `Kunci jawaban TF "${rawAnswer || '(kosong)'}" tidak valid (gunakan A/B atau Benar/Salah).`,
        });
        continue;
      }
      const entry: Question = {
        id: `imp-${Date.now()}-${r}`,
        category,
        type: 'TF',
        time,
        question: questionText,
        options,
        answer: ansIdx,
        explanation,
      };
      if (imageUrl) entry.imageUrl = imageUrl;
      questions.push(entry);
    } else if (parsedType === 'MS') {
      const options = [optA, optB, optC, optD].filter(Boolean);
      if (options.length < 2) {
        errors.push({
          rowNumber: rowNum,
          message: 'Soal MS wajib memiliki minimal 2 opsi (disarankan A–D).',
        });
        continue;
      }
      const tokens = rawAnswer
        .split(/[,;|+&]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const indices = Array.from(
        new Set(
          tokens
            .map((t) => resolveChoiceIndex(t, options))
            .filter((idx): idx is number => idx !== null)
        )
      ).sort((a, b) => a - b);

      if (indices.length === 0) {
        errors.push({
          rowNumber: rowNum,
          message: `Kunci jawaban MS "${rawAnswer || '(kosong)'}" tidak valid (contoh: "A,C").`,
        });
        continue;
      }
      const entry: Question = {
        id: `imp-${Date.now()}-${r}`,
        category,
        type: 'MS',
        time,
        question: questionText,
        options,
        answer: indices,
        explanation,
      };
      if (imageUrl) entry.imageUrl = imageUrl;
      questions.push(entry);
    } else {
      const accepted = rawAnswer
        .split(/[;|,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (accepted.length === 0) {
        errors.push({
          rowNumber: rowNum,
          message:
            'Soal TEXT wajib mengisi kolom jawaban (pisahkan variasi dengan ; atau ,).',
        });
        continue;
      }
      const entry: Question = {
        id: `imp-${Date.now()}-${r}`,
        category,
        type: 'TEXT',
        time,
        question: questionText,
        acceptedAnswers: accepted,
        explanation,
      };
      if (imageUrl) entry.imageUrl = imageUrl;
      questions.push(entry);
    }
  }

  return { questions, errors, format };
}

function escapeCsvCell(val: string | number): string {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportQuestionsToCsv(questions: Question[]): string {
  const headers = [
    'kategori',
    'tipe',
    'waktu',
    'pertanyaan',
    'opsi_a',
    'opsi_b',
    'opsi_c',
    'opsi_d',
    'jawaban',
    'pembahasan',
    'gambar',
  ];
  const letters = ['A', 'B', 'C', 'D'];

  const rows = questions.map((q) => {
    const opts = q.options || [];
    let answerStr = '';
    if (q.type === 'MC' || q.type === 'TF') {
      const idx = typeof q.answer === 'number' ? q.answer : 0;
      answerStr = letters[idx] || 'A';
    } else if (q.type === 'MS') {
      const arr = Array.isArray(q.answer) ? q.answer : [];
      answerStr = arr.map((idx) => letters[idx]).filter(Boolean).join(',');
    } else {
      answerStr = (q.acceptedAnswers || []).join('; ');
    }

    return [
      escapeCsvCell(q.category),
      escapeCsvCell(q.type),
      q.time || 25,
      escapeCsvCell(q.question),
      escapeCsvCell(q.type === 'TEXT' ? '' : opts[0] || ''),
      escapeCsvCell(q.type === 'TEXT' ? '' : opts[1] || ''),
      escapeCsvCell(q.type === 'TEXT' ? '' : opts[2] || ''),
      escapeCsvCell(q.type === 'TEXT' ? '' : opts[3] || ''),
      escapeCsvCell(answerStr),
      escapeCsvCell(q.explanation || ''),
      escapeCsvCell(q.imageUrl || ''),
    ].join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

export function buildQuestionCsvTemplate(): string {
  const sample: Question[] = [
    {
      category: 'Wawasan Nusantara',
      type: 'MC',
      time: 25,
      question: 'Apa nama ibu kota Provinsi Kalimantan Timur?',
      options: ['Balikpapan', 'Samarinda', 'Pontianak', 'Banjarmasin'],
      answer: 1,
      explanation: 'Samarinda adalah ibu kota resmi Provinsi Kalimantan Timur.',
    },
    {
      category: 'Manusia & Hewan',
      type: 'TF',
      time: 20,
      question: 'Lumba-lumba bernapas menggunakan paru-paru, bukan insang.',
      options: ['Benar (True)', 'Salah (False)'],
      answer: 0,
      explanation:
        'Sebagai mamalia laut, lumba-lumba bernapas menghirup udara dengan paru-paru.',
    },
    {
      category: 'Logika & Hitungan',
      type: 'MS',
      time: 30,
      question:
        'Manakah di antara bilangan berikut yang termasuk bilangan prima?',
      options: ['9', '11', '15', '17'],
      answer: [1, 3],
      explanation: '11 dan 17 hanya habis dibagi 1 dan dirinya sendiri.',
    },
    {
      category: 'Wawasan Nusantara',
      type: 'TEXT',
      time: 25,
      question:
        'Apa nama tari tradisional khas Aceh yang dilakukan secara serempak dan cepat?',
      acceptedAnswers: ['Saman', 'Tari Saman'],
      explanation:
        'Tari Saman berasal dari Suku Gayo di Aceh dan diakui sebagai warisan UNESCO.',
    },
  ];
  return exportQuestionsToCsv(sample);
}
