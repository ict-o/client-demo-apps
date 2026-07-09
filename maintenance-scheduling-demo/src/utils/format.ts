// 表示フォーマット系ユーティリティ

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** YYYY-MM-DD → 2026/07/15（金） */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}（${WEEKDAYS[date.getDay()]}）`;
}

/** YYYY-MM-DD → 07/15（短縮） */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-');
  if (!m || !d) return iso;
  return `${m}/${d}`;
}

/** ISO日時 → 2026/07/09 14:32 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 3桁区切りの円表記 */
export function formatYen(v: number): string {
  return `¥${v.toLocaleString('ja-JP')}`;
}

/** 現在時刻のISO文字列（履歴記録用） */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 今日の YYYY-MM-DD */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
