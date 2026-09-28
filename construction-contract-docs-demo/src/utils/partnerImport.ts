// 取引先の一括登録：Excel（.xlsx）・CSV ファイルを読み取り、登録内容を組み立てる

import { unzipSync, strFromU8 } from 'fflate';
import type { Partner } from '../types';

/** 取り込める列。見出しの呼び方が多少違っても読めるよう、別名も持たせる */
export const IMPORT_COLUMNS: { key: keyof Omit<Partner, 'id'>; label: string; required: boolean; aliases: string[] }[] = [
  { key: 'name', label: '会社名', required: true, aliases: ['会社名', '取引先名', '取引先', '社名'] },
  { key: 'department', label: '部署', required: false, aliases: ['部署', '部署名', '所属'] },
  { key: 'contactName', label: '担当者名', required: true, aliases: ['担当者名', '担当者', 'ご担当者'] },
  { key: 'postalCode', label: '郵便番号', required: false, aliases: ['郵便番号', '〒'] },
  { key: 'address', label: '所在地', required: true, aliases: ['所在地', '住所'] },
  { key: 'tel', label: '電話番号', required: true, aliases: ['電話番号', '電話', 'TEL', 'tel'] },
  { key: 'paymentTerms', label: '支払条件', required: false, aliases: ['支払条件', '支払い条件', '支払方法'] },
];

export type ImportAction = 'new' | 'update' | 'error';

export interface ImportRow {
  /** ファイル上の行番号（見出し行を1行目とする） */
  line: number;
  values: Omit<Partner, 'id'>;
  action: ImportAction;
  errors: string[];
  /** 更新の場合、上書きする既存の取引先ID */
  existingId?: string;
}

export class ImportError extends Error {}

/** ファイルを読み取り、見出し行を含む2次元の表にする */
export async function readTable(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xls')) {
    throw new ImportError('Excel 97-2003 形式（.xls）には対応していません。Excel で「.xlsx」または「CSV」形式で保存し直してください。');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (name.endsWith('.xlsx')) return readXlsx(bytes);
  if (name.endsWith('.csv') || name.endsWith('.txt')) return parseCsv(decodeText(bytes));
  throw new ImportError('読み込めるのは Excel（.xlsx）か CSV（.csv）のファイルです。');
}

/** 文字コードを判定して文字列にする（UTF-8 と、Excel が既定で使う Shift_JIS に対応） */
function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return new TextDecoder('shift_jis').decode(bytes);
  }
}

/** CSV を読み取る（ダブルクォートで囲まれたカンマ・改行にも対応） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Excel（.xlsx）の1枚目のシートを読み取る */
function readXlsx(bytes: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new ImportError('Excel ファイルを開けませんでした。ファイルが壊れていないか確認してください。');
  }
  const xml = (path: string) => (files[path] ? new DOMParser().parseFromString(strFromU8(files[path]), 'application/xml') : null);

  const shared: string[] = [];
  const sst = xml('xl/sharedStrings.xml');
  if (sst) {
    for (const si of Array.from(sst.getElementsByTagName('si'))) {
      shared.push(Array.from(si.getElementsByTagName('t')).map(t => t.textContent ?? '').join(''));
    }
  }

  const sheetPath = firstSheetPath(files, xml);
  const sheet = sheetPath ? xml(sheetPath) : null;
  if (!sheet) throw new ImportError('Excel ファイルにシートが見つかりませんでした。');

  const rows: string[][] = [];
  for (const r of Array.from(sheet.getElementsByTagName('row'))) {
    const rowIndex = Number(r.getAttribute('r') ?? rows.length + 1) - 1;
    const cells: string[] = [];
    let next = 0;
    for (const c of Array.from(r.getElementsByTagName('c'))) {
      const ref = c.getAttribute('r');
      const col = ref ? columnIndex(ref) : next;
      next = col + 1;
      const type = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      let value: string;
      if (type === 's') value = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') value = Array.from(c.getElementsByTagName('t')).map(t => t.textContent ?? '').join('');
      else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
      else value = v;
      cells[col] = value;
    }
    rows[rowIndex] = Array.from(cells, x => x ?? '');
  }
  return Array.from(rows, x => x ?? []);
}

/** workbook.xml の並び順で1枚目のシートのファイルを探す */
function firstSheetPath(
  files: Record<string, Uint8Array>,
  xml: (path: string) => Document | null,
): string | undefined {
  const wb = xml('xl/workbook.xml');
  const rels = xml('xl/_rels/workbook.xml.rels');
  const first = wb?.getElementsByTagName('sheet')[0];
  const rid = first?.getAttribute('r:id') ?? first?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  if (rid && rels) {
    const rel = Array.from(rels.getElementsByTagName('Relationship')).find(x => x.getAttribute('Id') === rid);
    const target = rel?.getAttribute('Target');
    if (target) {
      const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
      if (files[path]) return path;
    }
  }
  return Object.keys(files).filter(f => /^xl\/worksheets\/[^/]+\.xml$/.test(f)).sort()[0];
}

/** "B12" → 1（列Bは0始まりで1） */
function columnIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, '');
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const normalizeName = (s: string) => s.replace(/[\s\u3000]/g, '');

/**
 * 読み取った表を、登録内容（新規・更新・登録できない）に振り分ける。
 * 会社名が既存の取引先と一致したものは「更新」として扱う。
 */
export function buildImportRows(table: string[][], partners: Partner[]): ImportRow[] {
  const headerIndex = table.findIndex(r => r.some(c => c.trim() !== ''));
  if (headerIndex < 0) throw new ImportError('ファイルが空です。1行目に見出し、2行目から取引先を入力してください。');

  const header = table[headerIndex].map(h => normalizeName(h));
  const colOf: Partial<Record<keyof Omit<Partner, 'id'>, number>> = {};
  for (const col of IMPORT_COLUMNS) {
    const i = header.findIndex(h => col.aliases.some(a => normalizeName(a) === h));
    if (i >= 0) colOf[col.key] = i;
  }
  const missing = IMPORT_COLUMNS.filter(c => c.required && colOf[c.key] === undefined).map(c => `「${c.label}」`);
  if (missing.length > 0) {
    throw new ImportError(`見出しに ${missing.join('・')} の列が見つかりません。ひな形の見出しと同じ名前にしてください。`);
  }

  const byName = new Map(partners.map(p => [normalizeName(p.name), p]));
  const seen = new Set<string>();
  const rows: ImportRow[] = [];

  table.slice(headerIndex + 1).forEach((cells, i) => {
    if (cells.every(c => c.trim() === '')) return;
    const get = (key: keyof Omit<Partner, 'id'>) => {
      const idx = colOf[key];
      return idx === undefined ? '' : (cells[idx] ?? '').trim();
    };
    const values: Omit<Partner, 'id'> = {
      name: get('name'),
      department: get('department'),
      contactName: get('contactName'),
      postalCode: get('postalCode'),
      address: get('address'),
      tel: get('tel'),
      paymentTerms: get('paymentTerms'),
    };
    const errors = IMPORT_COLUMNS.filter(c => c.required && !values[c.key]).map(c => `${c.label}が空欄です`);
    const key = normalizeName(values.name);
    if (key && seen.has(key)) errors.push('同じ会社名がファイル内に2回以上あります');
    if (key) seen.add(key);

    const existing = key ? byName.get(key) : undefined;
    rows.push({
      line: headerIndex + i + 2,
      values,
      errors,
      action: errors.length > 0 ? 'error' : existing ? 'update' : 'new',
      existingId: existing?.id,
    });
  });

  if (rows.length === 0) throw new ImportError('取引先が1件も入力されていません。2行目から取引先を入力してください。');
  return rows;
}

/** ひな形（CSV）。Excel で文字化けしないよう、先頭に BOM を付けた UTF-8 で作る */
export function templateCsv(): Blob {
  const header = IMPORT_COLUMNS.map(c => c.label);
  const example = ['株式会社〇〇商事', '総務部', '山田 太郎', '000-0000', '東京都〇〇区〇〇0-0-0', '03-0000-0000', '月末締め翌月末 銀行振込'];
  const csv = [header, example].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
}

function csvCell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** 実演用のサンプル（新規・更新・登録できない行を含む） */
export const SAMPLE_IMPORT_FILE_NAME = '取引先一覧_2026年9月.csv';

export function sampleImportTable(): string[][] {
  return [
    IMPORT_COLUMNS.map(c => c.label),
    ['株式会社〇〇ハウジング', '工事部', '坂口 美穂', '000-0000', '東京都世田谷区〇〇0-0-0', '03-0000-2468', '月末締め翌月末 銀行振込'],
    ['〇〇産業株式会社', '設備管理課', '成瀬 大輔', '000-0000', '埼玉県草加市〇〇0-0-0', '048-0000-1357', '20日締め翌月10日 銀行振込'],
    ['有限会社〇〇商会', '', '北原 一樹', '000-0000', '千葉県松戸市〇〇0-0-0', '047-0000-8642', '月末締め翌々月10日 銀行振込'],
    ['〇〇不動産株式会社', '施設管理部', '白石 紗代', '000-0000', '神奈川県横浜市西区〇〇0-0-0', '045-0000-3310', '月末締め翌月末 銀行振込'],
    ['株式会社〇〇物流', '総務課', '', '000-0000', '東京都江東区〇〇0-0-0', '03-0000-9753', '月末締め翌月末 銀行振込'],
  ];
}
