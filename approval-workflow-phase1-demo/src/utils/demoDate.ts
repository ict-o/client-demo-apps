// デモ用の日付シフト
//
// サンプルデータは 2026-08-20 時点の状況として作成しています。
// そのまま表示すると日が経つほど「滞留日数」「署名期限」が古くなってしまうため、
// 画面表示時に基準日と当日の差分だけ全体をずらし、常に進行中の業務に見えるようにします。

import { todayIso } from './format';

/** サンプルデータを作成した基準日 */
const ANCHOR = '2026-08-20';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^(\d{4}-\d{2}-\d{2})(T.*)$/;

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** 基準日から当日までの日数 */
export function demoDayShift(): number {
  return Math.round((toUtc(todayIso()) - toUtc(ANCHOR)) / 86_400_000);
}

function shiftValue(value: string, days: number): string {
  if (DATE_ONLY.test(value)) return addDays(value, days);
  const m = DATE_TIME.exec(value);
  if (m) return `${addDays(m[1], days)}${m[2]}`;
  return value;
}

/** サンプルデータ内の日付・日時をまとめて基準日からの差分だけずらす */
export function shiftDates<T>(value: T, days: number = demoDayShift()): T {
  if (days === 0) return value;
  if (typeof value === 'string') return shiftValue(value, days) as unknown as T;
  if (Array.isArray(value)) return value.map(v => shiftDates(v, days)) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = shiftDates(v, days);
    }
    return out as unknown as T;
  }
  return value;
}
