// 承認ルートの自動判定 — 申請内容（種別・金額・契約種別）から承認段階を組み立てる

import type { ApprovalStep, ContractType, RequestKind } from '../types';

export interface RouteInput {
  kind: RequestKind;
  amount: number;
  contractType: ContractType;
}

export interface RouteStepPlan {
  name: string;
  approverId: string;
  /** その段階が付与された理由（設定画面・申請画面で根拠として表示する） */
  reason: string;
}

/** 契約書の作成・締結を伴う契約種別（法務確認が必要） */
const LEGAL_REVIEW_TYPES: ContractType[] = ['賃貸借契約', '売買契約', '管理受託契約'];

/** 申請内容から承認ルートを判定する */
export function planRoute(input: RouteInput): RouteStepPlan[] {
  const plan: RouteStepPlan[] = [
    { name: '部門長承認', approverId: 'm2', reason: 'すべての申請で必須' },
  ];

  if (LEGAL_REVIEW_TYPES.includes(input.contractType)) {
    plan.push({
      name: '法務確認',
      approverId: 'm4',
      reason: `契約種別が${input.contractType}のため（法務担当の退職に伴い経営企画室が兼務）`,
    });
  }

  if (input.amount >= 1_000_000) {
    plan.push({ name: '管理本部長承認', approverId: 'm3', reason: '金額が100万円以上のため' });
  }

  if (input.kind === 'seal') {
    plan.push({ name: '代表取締役承認', approverId: 'm5', reason: '実印の捺印を伴う申請のため' });
  } else if (input.amount >= 5_000_000) {
    plan.push({ name: '代表取締役承認', approverId: 'm5', reason: '金額が500万円以上のため' });
  }

  return plan;
}

/** 判定したルートを、先頭が承認待ちの承認段階リストに変換する */
export function buildSteps(input: RouteInput, nextId: (prefix: string) => string): ApprovalStep[] {
  return planRoute(input).map((p, i) => ({
    id: nextId('stp'),
    name: p.name,
    approverId: p.approverId,
    status: i === 0 ? 'current' : 'waiting',
  }));
}
