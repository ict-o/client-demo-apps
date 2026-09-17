// 表示フォーマット系ユーティリティ

/** YYYY-MM-DD → 2026/09/15 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
}

/** YYYY-MM-DD → 令和8年9月15日（帳票用の和暦表記） */
export function formatJpDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const reiwa = y - 2018;
  return `令和${reiwa}年${m}月${d}日`;
}

/** ISO日時 → 2026/09/10 14:32 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 3桁区切りの円表記 */
export function formatYen(v: number): string {
  return `¥${Math.round(v).toLocaleString('ja-JP')}`;
}

/** 3桁区切り（単位なし） */
export function formatNumber(v: number): string {
  return v.toLocaleString('ja-JP');
}

/** 現在時刻のISO文字列（履歴記録用） */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 今日の YYYY-MM-DD */
export function todayIso(): string {
  const d = new Date();
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
