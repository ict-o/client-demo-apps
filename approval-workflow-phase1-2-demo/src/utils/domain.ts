// ステータスの表示メタ情報と、契約期限まわりの判定

import type { Contract, Member, Request, RequestStatus, Role, StepStatus } from '../types';
import { daysUntil } from './format';

export function requestStatusMeta(status: RequestStatus): { label: string; tone: string } {
  switch (status) {
    case 'pending':
      return { label: '承認待ち', tone: 'warning' };
    case 'approved':
      return { label: '承認済（締結待ち）', tone: 'info' };
    case 'signing':
      return { label: '電子契約 署名手続き中', tone: 'accent' };
    case 'completed':
      return { label: '締結完了', tone: 'success' };
    case 'rejected':
      return { label: '差戻し', tone: 'error' };
  }
}

export function stepStatusMeta(status: StepStatus): { label: string; tone: string } {
  switch (status) {
    case 'waiting':
      return { label: '未着手', tone: 'muted' };
    case 'current':
      return { label: '承認待ち', tone: 'warning' };
    case 'approved':
      return { label: '承認済', tone: 'success' };
    case 'rejected':
      return { label: '差戻し', tone: 'error' };
  }
}

/** 現在承認待ちの段階を返す */
export function currentStep(req: Request) {
  return req.steps.find(s => s.status === 'current');
}

/** 権限（ロール）で承認操作が許可されているか */
export function canApproveByRole(role: Role): boolean {
  return role === 'admin' || role === 'approver';
}

/** 権限（ロール）で申請の起票・登録操作が許可されているか */
export function canWriteByRole(role: Role): boolean {
  return role !== 'viewer';
}

/** その利用者がこの申請を今すぐ承認できるか */
export function canAct(req: Request, viewer: Member, members: Member[]): { ok: boolean; reason: string } {
  const step = currentStep(req);
  if (!step || req.status !== 'pending') {
    return { ok: false, reason: 'この申請は承認待ちではありません' };
  }
  if (!canApproveByRole(viewer.role)) {
    return { ok: false, reason: 'ログイン中の利用者には承認の権限がありません（権限: 申請者・閲覧者）' };
  }
  if (step.approverId === viewer.id) {
    return { ok: true, reason: '' };
  }
  const approver = members.find(m => m.id === step.approverId);
  const name = approver ? `${approver.name}（${approver.title}）` : '担当者';
  return {
    ok: false,
    reason: `現在の承認者は${name}です。画面右上の利用者切替で承認者に切り替えると操作できます`,
  };
}

/** 申請が承認待ちのまま何日滞留しているか */
export function stagnantDays(req: Request): number {
  if (req.status !== 'pending') return 0;
  const step = currentStep(req);
  const since = step?.actedAt ?? req.appliedAt;
  return Math.max(0, -daysUntil(since.slice(0, 10)));
}

export type ContractPhase = 'expired' | 'active';

/**
 * 契約のステータス（契約期間中 / 満了済）。
 * 更新期限が近い契約の抽出とアラートはフェーズ3の対象です。
 */
export function contractPhase(c: Contract): ContractPhase {
  return daysUntil(c.endDate) < 0 ? 'expired' : 'active';
}

export function contractPhaseMeta(phase: ContractPhase): { label: string; tone: string } {
  switch (phase) {
    case 'expired':
      return { label: '満了済', tone: 'muted' };
    case 'active':
      return { label: '契約期間中', tone: 'success' };
  }
}

/** 相手先と契約種別から保管フォルダを自動決定する（自動振り分け） */
export function autoFolder(counterparty: string, contractType: string): string {
  const cp = counterparty.trim() === '' ? '未設定' : counterparty.trim();
  return `${contractType}／${cp}`;
}

/** 契約書に自動付与するタグ */
export function autoTags(contractType: string, property: string, rentMonthly: number): string[] {
  const tags = [contractType];
  if (property.trim() !== '') tags.push('物件あり');
  if (rentMonthly > 0) tags.push('賃料発生');
  return tags;
}
