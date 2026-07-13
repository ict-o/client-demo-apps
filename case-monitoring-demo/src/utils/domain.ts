// ドメインロジック — 案件の進捗率・状態をチェック項目から導出する

import type { Case, CaseStatus, Checkpoint } from '../types';

/** 完了したチェック項目の割合（0-100 の整数） */
export function progressPercent(cp: Checkpoint[]): number {
  if (cp.length === 0) return 0;
  const done = cp.filter(c => c.status === 'done').length;
  return Math.round((done / cp.length) * 100);
}

/** チェック項目の状態から案件全体の状態を導出する */
export function caseStatus(cp: Checkpoint[]): CaseStatus {
  if (cp.length > 0 && cp.every(c => c.status === 'done')) return 'done';
  if (cp.some(c => c.status === 'delayed')) return 'delayed';
  if (cp.some(c => c.status === 'flagged')) return 'attention';
  return 'active';
}

/** 「次にやるべき」チェック項目（未完了で最も期限が近いもの） */
export function nextCheckpoint(cp: Checkpoint[]): Checkpoint | undefined {
  return cp
    .filter(c => c.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

/** 案件に「対応が必要」か（遅延 or 不備を含む） */
export function needsAttention(c: Case): boolean {
  const s = caseStatus(c.checkpoints);
  return s === 'delayed' || s === 'attention';
}
