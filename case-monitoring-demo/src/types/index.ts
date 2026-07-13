// 案件進捗モニタリングシステム — 型定義
//
// 受注した案件が完了までに通る「確認事項（チェック項目）」の進捗を、
// 管理者が遠隔でリアルタイムに監視する。遅延・不備が起きると管理者へ
// 通知（アラート）が飛ぶ、という業務を表現するためのモデル。

/** チェック項目の状態 */
export type CheckStatus =
  | 'pending'      // 未着手
  | 'in_progress'  // 進行中
  | 'done'         // 完了
  | 'delayed'      // 遅延（期限超過）
  | 'flagged';     // 要確認（不備報告あり）

/** 案件全体の状態（チェック項目から導出する） */
export type CaseStatus =
  | 'active'     // 順調（進行中）
  | 'attention'  // 要確認（不備あり）
  | 'delayed'    // 遅延あり
  | 'done';      // 完了

/** アラートの種別 */
export type AlertKind =
  | 'delay'     // 遅延検知
  | 'defect'    // 不備報告
  | 'due_soon'; // 期限接近

/** アラートの重要度 */
export type AlertLevel = 'high' | 'medium';

/** アラートの対応状況 */
export type AlertStatus =
  | 'open'      // 未対応
  | 'ack'       // 確認済
  | 'resolved'; // 対応済

/** 案件に紐づくチェック項目（確認事項） */
export interface Checkpoint {
  id: string;
  /** 確認事項名（例: 契約書締結、着手金入金確認） */
  name: string;
  /** 担当者（架空の社員名） */
  owner: string;
  /** 期限 YYYY-MM-DD */
  dueDate: string;
  status: CheckStatus;
  /** 完了日 YYYY-MM-DD（完了時のみ） */
  completedDate?: string;
  /** 不備報告の内容（flagged のとき） */
  note?: string;
}

/** 案件の活動履歴（監査ログ的なもの） */
export interface CaseEvent {
  id: string;
  /** ISO日時 */
  at: string;
  /** 操作者（架空名） */
  actor: string;
  /** 表示テキスト（日本語） */
  text: string;
}

/** 受注案件 */
export interface Case {
  id: string;
  /** 案件番号（データ値としてのコード。英数字可） */
  code: string;
  /** 案件名（日本語） */
  title: string;
  /** 顧客名（架空の会社名） */
  client: string;
  /** 主担当者（架空の社員名） */
  owner: string;
  /** 担当部署 */
  department: string;
  /** 受注日 YYYY-MM-DD */
  orderDate: string;
  /** 完了期限 YYYY-MM-DD */
  dueDate: string;
  /** 受注金額（円） */
  amount: number;
  checkpoints: Checkpoint[];
  events: CaseEvent[];
}

/** 管理者に届く通知 */
export interface Alert {
  id: string;
  caseId: string;
  /** 表示用の案件番号 */
  caseCode: string;
  /** 表示用の案件名 */
  caseTitle: string;
  kind: AlertKind;
  level: AlertLevel;
  status: AlertStatus;
  /** 通知メッセージ（日本語） */
  message: string;
  /** 対象のチェック項目名 */
  checkpointName: string;
  /** 発生日時 ISO */
  at: string;
}

// ===== ラベル・トーン定義 =====

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  pending: '未着手',
  in_progress: '進行中',
  done: '完了',
  delayed: '遅延',
  flagged: '要確認',
};

export const CHECK_STATUS_TONE: Record<CheckStatus, string> = {
  pending: 'muted',
  in_progress: 'info',
  done: 'success',
  delayed: 'error',
  flagged: 'warning',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  active: '順調',
  attention: '要確認',
  delayed: '遅延',
  done: '完了',
};

export const CASE_STATUS_TONE: Record<CaseStatus, string> = {
  active: 'info',
  attention: 'warning',
  delayed: 'error',
  done: 'success',
};

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  delay: '遅延',
  defect: '不備',
  due_soon: '期限接近',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: '未対応',
  ack: '確認済',
  resolved: '対応済',
};

export const ALERT_STATUS_TONE: Record<AlertStatus, string> = {
  open: 'error',
  ack: 'warning',
  resolved: 'success',
};
