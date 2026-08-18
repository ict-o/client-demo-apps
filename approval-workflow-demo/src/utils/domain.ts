// ステータスの表示メタ情報と、契約期限まわりの判定

import type { Contract, Member, Request, RequestStatus, StepStatus } from '../types';
import { daysUntil } from './format';

export function requestStatusMeta(status: RequestStatus): { label: string; tone: string } {
  switch (status) {
    case 'pending':
      return { label: '承認待ち', tone: 'warning' };
    case 'approved':
      return { label: '承認済（締結待ち）', tone: 'info' };
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
    case 'delegated':
      return { label: '代理承認済', tone: 'accent' };
    case 'rejected':
      return { label: '差戻し', tone: 'error' };
  }
}

/** 現在承認待ちの段階を返す */
export function currentStep(req: Request) {
  return req.steps.find(s => s.status === 'current');
}

/** その利用者がこの申請を今すぐ承認できるか（本人 or 不在者の代理） */
export function canAct(req: Request, viewer: Member, members: Member[]): { ok: boolean; asDelegate: boolean; reason: string } {
  const step = currentStep(req);
  if (!step || req.status !== 'pending') {
    return { ok: false, asDelegate: false, reason: 'この申請は承認待ちではありません' };
  }
  if (step.approverId === viewer.id) {
    return { ok: true, asDelegate: false, reason: '' };
  }
  const approver = members.find(m => m.id === step.approverId);
  if (approver?.absent && approver.delegateId === viewer.id) {
    return { ok: true, asDelegate: true, reason: '' };
  }
  const name = approver ? `${approver.name}（${approver.title}）` : '担当者';
  return {
    ok: false,
    asDelegate: false,
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

export type ContractPhase = 'expired' | 'expiring' | 'active';

/** 契約の期限状態（期限切れ / 60日以内 / 有効） */
export function contractPhase(c: Contract): ContractPhase {
  const rest = daysUntil(c.endDate);
  if (rest < 0) return 'expired';
  if (rest <= 60) return 'expiring';
  return 'active';
}

export function contractPhaseMeta(phase: ContractPhase): { label: string; tone: string } {
  switch (phase) {
    case 'expired':
      return { label: '期限切れ', tone: 'error' };
    case 'expiring':
      return { label: '更新期限が近い', tone: 'warning' };
    case 'active':
      return { label: '有効', tone: 'success' };
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
