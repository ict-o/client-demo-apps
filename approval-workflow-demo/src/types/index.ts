// ドメイン型定義 — 承認ワークフロー・電子契約管理システム（デモ）

/** 申請種別 */
export type RequestKind = 'ringi' | 'seal';

/** 申請ステータス */
export type RequestStatus =
  | 'pending'    // 承認待ち（回覧中）
  | 'approved'   // 全段階承認済（締結・捺印待ち）
  | 'completed'  // 締結完了（契約書に登録済）
  | 'rejected';  // 差戻し

/** 承認段階のステータス */
export type StepStatus = 'waiting' | 'current' | 'approved' | 'rejected' | 'delegated';

/** 契約種別 */
export type ContractType = '賃貸借契約' | '売買契約' | '管理受託契約' | '工事請負契約' | '業務委託契約';

/** 締結方法 */
export type SealMethod = 'esign' | 'paper';

/** 社内メンバー（承認者・申請者） */
export interface Member {
  id: string;
  name: string;
  department: string;
  title: string;
  /** 不在（出張・休暇）フラグ。true の間は代理承認者が承認できる */
  absent: boolean;
  /** 不在時の代理承認者ID */
  delegateId?: string;
  /** 実印・銀行印の保有者（紙契約の捺印はこの担当のみ実施可） */
  holdsSeal?: boolean;
}

/** 承認段階 */
export interface ApprovalStep {
  id: string;
  /** 段階名（例: 部門長承認） */
  name: string;
  approverId: string;
  status: StepStatus;
  /** 承認・差戻しの実施日時（ISO） */
  actedAt?: string;
  /** 実際に処理した人のID（代理承認時は代理者） */
  actedById?: string;
  comment?: string;
}

/** 履歴イベント */
export interface HistoryEvent {
  id: string;
  at: string;
  actor: string;
  text: string;
}

/** 申請（稟議書 / 捺印申請） */
export interface Request {
  id: string;
  code: string;
  kind: RequestKind;
  title: string;
  purpose: string;
  applicantId: string;
  department: string;
  appliedAt: string;
  /** 金額（円）。承認ルートの自動判定に使う */
  amount: number;
  contractType: ContractType;
  counterparty: string;
  /** 相手先が電子契約に対応しているか */
  counterpartyEsign: boolean;
  property?: string;
  rentMonthly?: number;
  startDate?: string;
  endDate?: string;
  steps: ApprovalStep[];
  status: RequestStatus;
  /** 締結方法（承認完了後に選択） */
  sealMethod?: SealMethod;
  /** 締結後に生成された契約書ID */
  contractId?: string;
  events: HistoryEvent[];
}

/** 会計システム連携状態 */
export type AccountingLink = 'unlinked' | 'linked';

/** 契約書 */
export interface Contract {
  id: string;
  code: string;
  title: string;
  counterparty: string;
  contractType: ContractType;
  property: string;
  /** 月額賃料（円）。賃料の発生しない契約は 0 */
  rentMonthly: number;
  /** 契約金額（円） */
  amount: number;
  startDate: string;
  endDate: string;
  /** 自動更新の有無 */
  autoRenew: boolean;
  /** 原本の保管形態 */
  origin: 'esign' | 'scan';
  /** AI項目抽出を通して登録されたか */
  aiExtracted: boolean;
  /** 自動振り分け先フォルダ */
  folder: string;
  tags: string[];
  accounting: AccountingLink;
  /** 生成元の申請コード */
  sourceRequestCode?: string;
  registeredAt: string;
}

/** 承認ルート定義（設定画面で参照する条件マスタ） */
export interface RouteRule {
  id: string;
  condition: string;
  steps: string[];
  note: string;
}

/** AI抽出の対象となる取込ファイル（デモ用の疑似ファイル） */
export interface InboxFile {
  id: string;
  fileName: string;
  source: '複合機スキャン' | 'メール添付' | '電子契約サービス連携';
  receivedAt: string;
  pages: number;
  /** AIが抽出する想定値 */
  extracted: {
    title: string;
    counterparty: string;
    contractType: ContractType;
    property: string;
    rentMonthly: number;
    amount: number;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
  };
  /** 項目ごとの抽出確度（%） */
  confidence: Record<string, number>;
}
