// 作業予定管理システム — 型定義

/** 利用者の役割（三者間で日程調整するため役割を切り替えて閲覧できる） */
export type Role = 'company' | 'customer' | 'partner';

export const ROLE_LABELS: Record<Role, string> = {
  company: '当社（元請け）',
  customer: '顧客',
  partner: '協力業者',
};

/** 作業案件のステータス（業務フローの進行段階） */
export type WorkStatus =
  | 'draft'          // 予定登録（候補日提示前）
  | 'proposed'       // 候補日提示中（顧客回答待ち）
  | 'rescheduling'   // 再調整中（顧客NG後の再提示待ち）
  | 'confirmed'      // 日程確定
  | 'in_progress'    // 作業中
  | 'reported';      // 報告書提出済み（完了）

export const STATUS_LABELS: Record<WorkStatus, string> = {
  draft: '予定登録',
  proposed: '候補日提示中',
  rescheduling: '再調整中',
  confirmed: '日程確定',
  in_progress: '作業中',
  reported: '報告書提出済み',
};

/** バッジ配色に使うトークン名 */
export const STATUS_TONE: Record<WorkStatus, 'muted' | 'info' | 'warning' | 'accent' | 'success'> = {
  draft: 'muted',
  proposed: 'info',
  rescheduling: 'warning',
  confirmed: 'accent',
  in_progress: 'warning',
  reported: 'success',
};

/** 候補日1件への顧客回答 */
export type SlotResponse = 'pending' | 'ok' | 'ng';

export interface CandidateSlot {
  id: string;
  date: string;      // YYYY-MM-DD
  timeSlot: string;  // 例「午前（9:00〜12:00）」
  response: SlotResponse;
  comment?: string;  // 顧客からのNG理由等
}

/** 作業チェック項目（作業中に消化） */
export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

/** 現場写真（デモのため実ファイルではなくプレースホルダ画像で表現） */
export interface WorkPhoto {
  id: string;
  kind: 'before' | 'after';
  caption: string;
}

/** 作業報告 */
export interface WorkReport {
  summary: string;      // 実施内容
  result: string;       // 実施結果・所見
  nextAdvice: string;   // 次回への申し送り
  photos: WorkPhoto[];
  submittedAt?: string; // 提出日時
  submittedBy?: string;
}

/** 履歴（誰が・いつ・何を） */
export interface HistoryEntry {
  id: string;
  at: string;        // ISO文字列
  actorRole: Role;
  actorName: string;
  action: string;    // 例「候補日を3件提示しました」
}

/** 作業種別 */
export const WORK_TYPES = [
  '定期清掃',
  '設備点検',
  '空調保守',
  '貯水槽清掃',
  '消防設備点検',
  '害虫防除',
  'エレベーター保守',
  '外壁・窓ガラス清掃',
] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const TIME_SLOTS = [
  '午前（9:00〜12:00）',
  '午後（13:00〜17:00）',
  '夜間（18:00〜22:00）',
  '早朝（6:00〜9:00）',
];

/** 案件（作業オーダー） */
export interface WorkOrder {
  id: string;                 // 作業番号 例「WO-2026-0142」
  customerCompany: string;    // 顧客企業名（架空）
  facility: string;           // 対象施設・建物名
  location: string;           // 作業場所（フロア・区画）
  workType: WorkType;
  companyStaff: string;       // 当社担当者
  partnerCompany: string;     // 協力業者名
  partnerStaff: string;       // 協力業者担当者
  createdAt: string;          // 登録日 YYYY-MM-DD
  desiredNote: string;        // 顧客の希望・特記
  status: WorkStatus;
  candidates: CandidateSlot[];
  confirmedSlotId?: string;   // 確定した候補日ID
  tasks: TaskItem[];
  report: WorkReport;
  history: HistoryEntry[];
}

/** 顧客マスタ（新規登録の選択肢用・架空） */
export interface CustomerMaster {
  company: string;
  facilities: { name: string; locations: string[] }[];
}

/** 協力業者マスタ（架空） */
export interface PartnerMaster {
  company: string;
  staff: string;
  specialties: WorkType[];
}
