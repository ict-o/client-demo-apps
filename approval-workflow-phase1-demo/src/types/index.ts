// ドメイン型定義 — 契約ワークフロー管理システム フェーズ1（デモ）

/** 申請種別 */
export type RequestKind = 'ringi' | 'seal';

/** 申請ステータス */
export type RequestStatus =
  | 'pending'    // 承認待ち（回覧中）
  | 'approved'   // 全段階承認済（締結・捺印待ち）
  | 'signing'    // 電子契約を送信済（署名手続き中）
  | 'completed'  // 締結完了（契約書に登録済）
  | 'rejected';  // 差戻し

/** 承認段階のステータス */
export type StepStatus = 'waiting' | 'current' | 'approved' | 'rejected';

/** 契約種別 */
export type ContractType = '賃貸借契約' | '売買契約' | '管理受託契約' | '工事請負契約' | '業務委託契約';

/** 締結方法 */
export type SealMethod = 'esign' | 'paper';

/** 権限（ロール）。ユーザー・組織・権限管理で付与する */
export type Role = 'admin' | 'approver' | 'applicant' | 'viewer';

/** 社内メンバー（利用者アカウント） */
export interface Member {
  id: string;
  name: string;
  /** ログインID */
  loginId: string;
  email: string;
  department: string;
  title: string;
  /** 付与されている権限 */
  role: Role;
  /** アカウントの有効・無効 */
  active: boolean;
  /** 最終ログイン日時（ISO） */
  lastLoginAt?: string;
  /** 実印・銀行印の保有者（紙契約の捺印はこの担当のみ実施可） */
  holdsSeal?: boolean;
}

/** 組織（部門）マスタ */
export interface Department {
  id: string;
  name: string;
  /** 部門の役割の説明 */
  note: string;
}

/** 権限ごとにできることの一覧（権限マトリクスの表示に使う） */
export interface PermissionRow {
  /** 機能名 */
  feature: string;
  allow: Record<Role, boolean>;
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
  /** 実際に処理した人のID */
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
  /** 電子契約で締結する場合の締結案件ID */
  envelopeId?: string;
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
  /** 原本の保管形態（電子契約で締結／紙の原本をPDF登録） */
  origin: 'esign' | 'scan';
  /** 保管フォルダ（登録時に選択する） */
  folder: string;
  tags: string[];
  accounting: AccountingLink;
  /** 会計システムへCSV出力した日時（ISO）と出力番号 */
  accountingLinkedAt?: string;
  accountingJobCode?: string;
  /** 生成元の申請コード */
  sourceRequestCode?: string;
  /** 電子契約で締結した場合の締結案件コード（合意締結証明書の参照元） */
  envelopeCode?: string;
  registeredAt: string;
}

/** 承認ルート定義（設定画面で参照する条件マスタ） */
export interface RouteRule {
  id: string;
  condition: string;
  steps: string[];
  note: string;
}

/** 登録待ちの受領ファイル（紙契約書をスキャンしたPDF・デモ用の疑似ファイル） */
export interface InboxFile {
  id: string;
  fileName: string;
  source: '複合機スキャン' | 'メール添付' | '郵送受領（原本スキャン）';
  receivedAt: string;
  pages: number;
  /** ファイル名から仮入力する値（AIによる項目抽出はフェーズ2の対象） */
  guess: {
    title: string;
    counterparty: string;
    contractType: ContractType;
  };
}


/* ===== 電子契約（本システム内で完結する締結機能） ===== */

/** 締結案件（電子契約1件）のステータス */
export type EnvelopeStatus =
  | 'sent'       // 送信済（相手先の署名待ち）
  | 'signing'    // 一部署名済（残りの署名者待ち）
  | 'completed'; // 全署名完了（締結済）

/** 署名者の区分 */
export type SignerSide = 'internal' | 'counterparty';

/** 署名者のステータス */
export type SignerStatus = 'waiting' | 'current' | 'signed';

/** 署名者（自社の締結権限者／相手先の契約担当者） */
export interface Signer {
  id: string;
  name: string;
  company: string;
  email: string;
  title: string;
  side: SignerSide;
  /** 署名順（1から） */
  order: number;
  status: SignerStatus;
  signedAt?: string;
  /** 署名に使った表示名（署名欄に表示される） */
  signatureName?: string;
  /** 本人確認方法（フェーズ1はメール認証のみ） */
  auth: 'メール認証';
  /** 開封（書類を閲覧）した日時 */
  viewedAt?: string;
}

/**
 * 書類末尾の署名欄（標準レイアウト固定）。
 * 署名欄を書類上の任意の位置へ配置する機能はフェーズ1の対象外です。
 */
export interface SignField {
  id: string;
  signerId: string;
  kind: 'sign' | 'date';
  /** 署名・日付が入った後の表示値 */
  value?: string;
}

/** 操作履歴の1件（誰が・いつ・何をしたか）。IPアドレス等を含む監査ログはフェーズ2の対象 */
export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
}

/** 締結案件（電子契約） */
export interface Envelope {
  id: string;
  code: string;
  /** 生成元の申請ID（申請を経由せず単独で作成した場合は未設定） */
  requestId?: string;
  requestCode?: string;
  title: string;
  counterparty: string;
  contractType: ContractType;
  property: string;
  amount: number;
  rentMonthly: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: EnvelopeStatus;
  signers: Signer[];
  fields: SignField[];
  /** 送信日時 */
  sentAt: string;
  /** 署名期限（YYYY-MM-DD） */
  deadline: string;
  /** 全署名が完了した日時 */
  completedAt?: string;
  /** 書類のハッシュ値（改ざん検知用。デモ用に生成した値） */
  documentHash: string;
  /** 締結後に登録された契約書ID */
  contractId?: string;
  /** 操作履歴 */
  audit: AuditEvent[];
}

/* ===== 外部連携（本システムで唯一の外部連携先＝会計システム） ===== */

/** 会計システムへのCSV出力（フェーズ1の連携方式） */
export interface AccountingExport {
  id: string;
  code: string;
  fileName: string;
  /** 出力した契約書のコード */
  contractCodes: string[];
  /** 出力した契約金額の合計 */
  totalAmount: number;
  /** 出力区分 */
  kind: '新規登録' | '更新' | '解約';
  exportedAt: string;
  /** 出力を実行した担当者名 */
  exportedBy: string;
}

/** 機能ごとの実現方式（外部連携か、本システム内で完結か） */
export interface CapabilityRow {
  name: string;
  external: boolean;
  /** 外部連携の場合は連携先、内部完結の場合は実現方式 */
  how: string;
}
