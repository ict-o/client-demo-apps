// 表示フォーマット系ユーティリティ

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** YYYY-MM-DD → 2026/07/13（月） */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}（${WEEKDAYS[date.getDay()]}）`;
}

/** YYYY-MM-DD → 07/13 */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-');
  if (!m || !d) return iso;
  return `${m}/${d}`;
}

/** ISO日時 → 2026/07/13 14:32 */
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

/** 現在時刻のISO文字列 */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 今日の YYYY-MM-DD */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO日時 → 「たった今 / 5分前 / 2時間前 / 3日前」の相対表記 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  if (Number.isNaN(then)) return iso;
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}日前`;
  return formatDateTime(iso);
}

/**
 * 期限までの残り日数（YYYY-MM-DD 基準・今日=0）。
 * 負値は超過日数を表す。
 */
export function daysUntil(dueDate: string, base = todayIso()): number {
  const [y1, m1, d1] = dueDate.split('-').map(Number);
  const [y2, m2, d2] = base.split('-').map(Number);
  if (!y1 || !y2) return 0;
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((a - b) / 86400000);
}
