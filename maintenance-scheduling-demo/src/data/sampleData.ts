import type {
  WorkOrder,
  TaskItem,
  CustomerMaster,
  PartnerMaster,
  WorkType,
} from '../types';

// ─────────────────────────────────────────────
// すべて架空データ（公開デモ用）。実在の企業・個人・施設とは一切関係ありません。
// 運用会社（当社）も架空：「セントラルビルメンテナンス株式会社」
// ─────────────────────────────────────────────

export const OUR_COMPANY = 'セントラルビルメンテナンス株式会社';

// デモ用の固定アカウント（役割を切り替えて同じシステムを三者の視点で確認できる）
export const DEMO_COMPANY_USER = { company: OUR_COMPANY, dept: '工事管理部', name: '川島 涼太' };
export const DEMO_CUSTOMER_ACCOUNT = { company: 'さくら総合病院', dept: '施設管理課', name: '森田' };
export const DEMO_PARTNER_ACCOUNT = { company: 'みどり環境サービス', name: '高橋 健司' };

/** 作業種別ごとの標準チェック項目 */
const TASK_TEMPLATES: Record<string, string[]> = {
  定期清掃: ['共用部 床面洗浄・ワックス', 'エントランスガラス清掃', 'トイレ清掃・消耗品補充', '廊下・階段清掃', 'ゴミ回収・分別処理'],
  空調保守: ['フィルター清掃・交換', '冷媒圧力点検', 'ドレン配管清掃', '室外機フィン点検', '運転動作確認'],
  貯水槽清掃: ['受水槽内 清掃・消毒', '高架水槽内 清掃・消毒', '水質検査（残留塩素・濁度）', '配管・給水弁点検', '満水・通水確認'],
  消防設備点検: ['自動火災報知設備 点検', '消火器 外観・内部点検', '屋内消火栓 放水試験', '誘導灯・非常照明 点検', '点検結果報告書 作成'],
  設備点検: ['受変電設備 点検', '非常用発電機 試運転', '給排水ポンプ 点検', '照明・防犯設備 点検'],
  害虫防除: ['生息状況 調査', 'ベイト剤 設置・交換', '薬剤散布（厨房・共用部）', '侵入経路 封鎖処理', '施工記録 作成'],
  エレベーター保守: ['かご内・扉 点検', '巻上機・ワイヤー点検', '制御盤 点検', '安全装置 動作確認', '戸開閉 調整'],
  '外壁・窓ガラス清掃': ['高所作業 養生設置', '外壁面 洗浄', '窓ガラス 清掃', 'サッシ・網戸 清掃', '周辺養生 撤去・清掃'],
};

/** 新規登録時に作業種別からチェック項目を生成する */
export function createTasks(prefix: string, workType: WorkType): TaskItem[] {
  return makeTasks(prefix, workType, 0);
}

function makeTasks(prefix: string, workType: WorkType, doneCount = 0): TaskItem[] {
  const labels = TASK_TEMPLATES[workType] ?? ['作業実施', '仕上がり確認', '報告書作成'];
  return labels.map((label, i) => ({
    id: `${prefix}-t${i + 1}`,
    label,
    done: i < doneCount,
  }));
}

/** 顧客マスタ（架空） */
export const CUSTOMER_MASTERS: CustomerMaster[] = [
  {
    company: 'さくら総合病院',
    facilities: [
      { name: '本館', locations: ['1F 外来ロビー', '2F 外来診療フロア', '各階 共用トイレ', '地下 機械室'] },
      { name: '西病棟', locations: ['3F 病棟廊下', '屋上 空調室外機', '受水槽室'] },
    ],
  },
  {
    company: 'グランメゾン新緑ホテル',
    facilities: [
      { name: '本館', locations: ['1F ロビー・宴会場', '客室階（5〜9F）', '屋上 空調機械室', 'B1 厨房'] },
      { name: '別館スパ棟', locations: ['大浴場', '機械室', '外構・エントランス'] },
    ],
  },
  {
    company: 'みなとみらいセントラルビル',
    facilities: [
      { name: 'オフィス棟', locations: ['1F エントランス', '基準階（8〜15F）', '屋上 高架水槽', 'B2 受変電室'] },
    ],
  },
  {
    company: '青葉ショッピングモール',
    facilities: [
      { name: '本館', locations: ['1F 共用通路', 'フードコート', '各階 トイレ', '搬入口・バックヤード'] },
      { name: '立体駐車場', locations: ['各階 車路', '防災設備室'] },
    ],
  },
  {
    company: '光陽第一オフィスタワー',
    facilities: [
      { name: 'タワー棟', locations: ['1F ロビー', '低層階（2〜10F）', '高層階（11〜22F）', 'B1 電気室'] },
    ],
  },
  {
    company: 'けやき台総合クリニック',
    facilities: [
      { name: 'クリニック棟', locations: ['1F 受付・待合', '2F 診療室', '厨房・給湯室'] },
    ],
  },
];

/** 協力業者マスタ（架空） */
export const PARTNER_MASTERS: PartnerMaster[] = [
  { company: 'みどり環境サービス', staff: '高橋 健司', specialties: ['定期清掃', '外壁・窓ガラス清掃', '害虫防除'] },
  { company: '東和ビルサービス', staff: '中村 早苗', specialties: ['定期清掃', '貯水槽清掃'] },
  { company: '日進設備工業', staff: '大野 拓也', specialties: ['空調保守', '設備点検', 'エレベーター保守'] },
  { company: '快適空調サービス', staff: '林 美和', specialties: ['空調保守', '設備点検'] },
  { company: '安全防災テック', staff: '斉藤 亮', specialties: ['消防設備点検', '設備点検'] },
];

/** 当社担当者（架空） */
export const COMPANY_STAFF = ['川島 涼太', '三宅 由紀', '岡本 誠'];

// ─────────────────────────────────────────────
// サンプル案件
// ─────────────────────────────────────────────

export const sampleWorkOrders: WorkOrder[] = [
  // 1) 候補日提示中（顧客回答待ち）— デモの主役
  {
    id: 'WO-2026-0142',
    customerCompany: 'さくら総合病院',
    facility: '本館',
    location: '1F 外来ロビー / 各階 共用トイレ',
    workType: '定期清掃',
    companyStaff: '川島 涼太',
    partnerCompany: 'みどり環境サービス',
    partnerStaff: '高橋 健司',
    createdAt: '2026-07-06',
    desiredNote: '外来診療のない土曜午後、または平日夜間を希望。ロビーは患者様導線を確保のこと。',
    status: 'proposed',
    candidates: [
      { id: 'WO-2026-0142-c1', date: '2026-07-18', timeSlot: '午後（13:00〜17:00）', response: 'pending' },
      { id: 'WO-2026-0142-c2', date: '2026-07-21', timeSlot: '夜間（18:00〜22:00）', response: 'pending' },
      { id: 'WO-2026-0142-c3', date: '2026-07-25', timeSlot: '午後（13:00〜17:00）', response: 'pending' },
    ],
    tasks: makeTasks('WO-2026-0142', '定期清掃'),
    report: { summary: '', result: '', nextAdvice: '', photos: [] },
    history: [
      { id: 'h1', at: '2026-07-06T09:12:00', actorRole: 'company', actorName: '川島 涼太', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-07-06T09:20:00', actorRole: 'company', actorName: '川島 涼太', action: '候補日を3件提示し、顧客へ回答を依頼しました' },
    ],
  },

  // 2) 日程確定（未実施・今後の予定）
  {
    id: 'WO-2026-0138',
    customerCompany: 'グランメゾン新緑ホテル',
    facility: '本館',
    location: '屋上 空調機械室 / 客室階',
    workType: '空調保守',
    companyStaff: '三宅 由紀',
    partnerCompany: '日進設備工業',
    partnerStaff: '大野 拓也',
    createdAt: '2026-06-28',
    desiredNote: '稼働率の下がる平日午前を希望。客室階は宿泊への影響が出ないよう配慮。',
    status: 'confirmed',
    candidates: [
      { id: 'WO-2026-0138-c1', date: '2026-07-14', timeSlot: '午前（9:00〜12:00）', response: 'ok' },
      { id: 'WO-2026-0138-c2', date: '2026-07-16', timeSlot: '午前（9:00〜12:00）', response: 'pending' },
    ],
    confirmedSlotId: 'WO-2026-0138-c1',
    tasks: makeTasks('WO-2026-0138', '空調保守'),
    report: { summary: '', result: '', nextAdvice: '', photos: [] },
    history: [
      { id: 'h1', at: '2026-06-28T14:02:00', actorRole: 'company', actorName: '三宅 由紀', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-06-28T14:10:00', actorRole: 'company', actorName: '三宅 由紀', action: '候補日を2件提示しました' },
      { id: 'h3', at: '2026-06-30T10:33:00', actorRole: 'customer', actorName: 'ホテル管理部 佐野', action: '7/14（火）午前 の候補日をOKと回答しました' },
      { id: 'h4', at: '2026-06-30T15:48:00', actorRole: 'company', actorName: '三宅 由紀', action: '7/14（火）午前 で日程を確定しました' },
    ],
  },

  // 3) 作業中（チェック項目の一部消化済み）
  {
    id: 'WO-2026-0131',
    customerCompany: 'みなとみらいセントラルビル',
    facility: 'オフィス棟',
    location: '屋上 高架水槽 / B2 受水槽室',
    workType: '貯水槽清掃',
    companyStaff: '川島 涼太',
    partnerCompany: '東和ビルサービス',
    partnerStaff: '中村 早苗',
    createdAt: '2026-06-20',
    desiredNote: '断水を伴うため、テナント周知済みの7/9で実施。9:00開始厳守。',
    status: 'in_progress',
    candidates: [
      { id: 'WO-2026-0131-c1', date: '2026-07-09', timeSlot: '午前（9:00〜12:00）', response: 'ok' },
    ],
    confirmedSlotId: 'WO-2026-0131-c1',
    tasks: makeTasks('WO-2026-0131', '貯水槽清掃', 3),
    report: {
      summary: '受水槽・高架水槽の清掃を実施。内部の沈殿物を除去し、次亜塩素酸ナトリウムで消毒。',
      result: '',
      nextAdvice: '',
      photos: [
        { id: 'p1', kind: 'before', caption: '受水槽内 清掃前' },
      ],
    },
    history: [
      { id: 'h1', at: '2026-06-20T11:00:00', actorRole: 'company', actorName: '川島 涼太', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-06-20T11:15:00', actorRole: 'company', actorName: '川島 涼太', action: '候補日を提示しました' },
      { id: 'h3', at: '2026-06-23T09:40:00', actorRole: 'customer', actorName: '施設管理課 田口', action: '7/9（木）午前 をOKと回答しました' },
      { id: 'h4', at: '2026-06-23T13:20:00', actorRole: 'company', actorName: '川島 涼太', action: '7/9（木）午前 で日程を確定しました' },
      { id: 'h5', at: '2026-07-09T09:05:00', actorRole: 'partner', actorName: '東和ビルサービス 中村', action: '作業を開始しました' },
    ],
  },

  // 4) 報告書提出済み（完了）
  {
    id: 'WO-2026-0125',
    customerCompany: '青葉ショッピングモール',
    facility: '本館',
    location: '全館 消防設備',
    workType: '消防設備点検',
    companyStaff: '岡本 誠',
    partnerCompany: '安全防災テック',
    partnerStaff: '斉藤 亮',
    createdAt: '2026-06-10',
    desiredNote: '開店前の午前中に実施。誘導灯の点検時は一部区画を消灯します。',
    status: 'reported',
    candidates: [
      { id: 'WO-2026-0125-c1', date: '2026-06-25', timeSlot: '早朝（6:00〜9:00）', response: 'ok' },
    ],
    confirmedSlotId: 'WO-2026-0125-c1',
    tasks: makeTasks('WO-2026-0125', '消防設備点検', 5),
    report: {
      summary: '自動火災報知設備、消火器、屋内消火栓、誘導灯・非常照明の法定点検を実施しました。',
      result: '感知器1個（B1駐車場）に反応遅延を確認し交換。その他は良好。消火器2本を期限により入替えました。',
      nextAdvice: '次回は2026年12月に半期点検を予定。B1駐車場は湿度が高く、感知器の劣化が早い傾向のため重点確認を推奨します。',
      photos: [
        { id: 'p1', kind: 'before', caption: 'B1 感知器 交換前' },
        { id: 'p2', kind: 'after', caption: 'B1 感知器 交換後' },
        { id: 'p3', kind: 'after', caption: '消火器 入替後（設置状況）' },
      ],
      submittedAt: '2026-06-25T11:40:00',
      submittedBy: '安全防災テック 斉藤',
    },
    history: [
      { id: 'h1', at: '2026-06-10T10:00:00', actorRole: 'company', actorName: '岡本 誠', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-06-10T10:12:00', actorRole: 'company', actorName: '岡本 誠', action: '候補日を提示しました' },
      { id: 'h3', at: '2026-06-13T16:20:00', actorRole: 'customer', actorName: '運営管理室 平野', action: '6/25（木）早朝 をOKと回答しました' },
      { id: 'h4', at: '2026-06-13T17:00:00', actorRole: 'company', actorName: '岡本 誠', action: '6/25（木）早朝 で日程を確定しました' },
      { id: 'h5', at: '2026-06-25T06:10:00', actorRole: 'partner', actorName: '安全防災テック 斉藤', action: '作業を開始しました' },
      { id: 'h6', at: '2026-06-25T11:40:00', actorRole: 'partner', actorName: '安全防災テック 斉藤', action: '作業報告書を提出しました' },
    ],
  },

  // 5) 再調整中（顧客NG後）
  {
    id: 'WO-2026-0140',
    customerCompany: '光陽第一オフィスタワー',
    facility: 'タワー棟',
    location: 'B1 電気室 / 各階 照明設備',
    workType: '設備点検',
    companyStaff: '三宅 由紀',
    partnerCompany: '快適空調サービス',
    partnerStaff: '林 美和',
    createdAt: '2026-07-02',
    desiredNote: '受変電設備の点検で瞬時停電が発生します。テナント調整の都合上、月初は不可。',
    status: 'rescheduling',
    candidates: [
      { id: 'WO-2026-0140-c1', date: '2026-07-11', timeSlot: '午前（9:00〜12:00）', response: 'ng', comment: '月初は決算業務で停電不可。月の後半でお願いします。' },
      { id: 'WO-2026-0140-c2', date: '2026-07-12', timeSlot: '午前（9:00〜12:00）', response: 'ng', comment: '同上（休日は入館手続きが煩雑なため避けたい）。' },
    ],
    tasks: makeTasks('WO-2026-0140', '設備点検'),
    report: { summary: '', result: '', nextAdvice: '', photos: [] },
    history: [
      { id: 'h1', at: '2026-07-02T13:30:00', actorRole: 'company', actorName: '三宅 由紀', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-07-02T13:45:00', actorRole: 'company', actorName: '三宅 由紀', action: '候補日を2件提示しました' },
      { id: 'h3', at: '2026-07-04T10:15:00', actorRole: 'customer', actorName: '総務部 佐々木', action: '2件ともNGと回答しました（理由: 月初は停電不可）' },
      { id: 'h4', at: '2026-07-04T14:00:00', actorRole: 'company', actorName: '三宅 由紀', action: '再調整として候補日を見直し中です' },
    ],
  },

  // 6) 予定登録（候補日提示前 = draft）
  {
    id: 'WO-2026-0144',
    customerCompany: 'けやき台総合クリニック',
    facility: 'クリニック棟',
    location: '厨房・給湯室 / 1F 待合',
    workType: '害虫防除',
    companyStaff: '岡本 誠',
    partnerCompany: 'みどり環境サービス',
    partnerStaff: '高橋 健司',
    createdAt: '2026-07-08',
    desiredNote: '診療時間中は薬剤散布不可。休診日（木曜・日曜）での実施を希望。',
    status: 'draft',
    candidates: [],
    tasks: makeTasks('WO-2026-0144', '害虫防除'),
    report: { summary: '', result: '', nextAdvice: '', photos: [] },
    history: [
      { id: 'h1', at: '2026-07-08T16:40:00', actorRole: 'company', actorName: '岡本 誠', action: '作業予定を登録しました（候補日は調整中）' },
    ],
  },

  // 7) 日程確定（別案件）
  {
    id: 'WO-2026-0135',
    customerCompany: '青葉ショッピングモール',
    facility: '立体駐車場',
    location: '各階 車路 / 防災設備室',
    workType: 'エレベーター保守',
    companyStaff: '川島 涼太',
    partnerCompany: '日進設備工業',
    partnerStaff: '大野 拓也',
    createdAt: '2026-06-26',
    desiredNote: '来店ピークを避け、平日午前の実施を希望。1基ずつ停止で対応可。',
    status: 'confirmed',
    candidates: [
      { id: 'WO-2026-0135-c1', date: '2026-07-15', timeSlot: '午前（9:00〜12:00）', response: 'ok' },
    ],
    confirmedSlotId: 'WO-2026-0135-c1',
    tasks: makeTasks('WO-2026-0135', 'エレベーター保守'),
    report: { summary: '', result: '', nextAdvice: '', photos: [] },
    history: [
      { id: 'h1', at: '2026-06-26T09:50:00', actorRole: 'company', actorName: '川島 涼太', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-06-26T10:05:00', actorRole: 'company', actorName: '川島 涼太', action: '候補日を提示しました' },
      { id: 'h3', at: '2026-06-29T11:20:00', actorRole: 'customer', actorName: '運営管理室 平野', action: '7/15（水）午前 をOKと回答しました' },
      { id: 'h4', at: '2026-06-29T13:10:00', actorRole: 'company', actorName: '川島 涼太', action: '7/15（水）午前 で日程を確定しました' },
    ],
  },

  // 8) 候補日提示中（別案件）
  {
    id: 'WO-2026-0143',
    customerCompany: 'さくら総合病院',
    facility: '西病棟',
    location: '屋上 空調室外機',
    workType: '空調保守',
    companyStaff: '三宅 由紀',
    partnerCompany: '快適空調サービス',
    partnerStaff: '林 美和',
    createdAt: '2026-07-07',
    desiredNote: '病棟への騒音・振動を抑えて実施。冷房ピーク前に完了させたい。',
    status: 'proposed',
    candidates: [
      { id: 'WO-2026-0143-c1', date: '2026-07-22', timeSlot: '午前（9:00〜12:00）', response: 'pending' },
      { id: 'WO-2026-0143-c2', date: '2026-07-23', timeSlot: '午前（9:00〜12:00）', response: 'pending' },
    ],
    tasks: makeTasks('WO-2026-0143', '空調保守'),
    report: { summary: '', result: '', nextAdvice: '', photos: [] },
    history: [
      { id: 'h1', at: '2026-07-07T10:20:00', actorRole: 'company', actorName: '三宅 由紀', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-07-07T10:35:00', actorRole: 'company', actorName: '三宅 由紀', action: '候補日を2件提示しました' },
    ],
  },

  // 9) 報告書提出済み（別案件・完了）
  {
    id: 'WO-2026-0129',
    customerCompany: 'グランメゾン新緑ホテル',
    facility: '別館スパ棟',
    location: '外構・エントランス',
    workType: '外壁・窓ガラス清掃',
    companyStaff: '岡本 誠',
    partnerCompany: 'みどり環境サービス',
    partnerStaff: '高橋 健司',
    createdAt: '2026-06-05',
    desiredNote: 'チェックアウト後〜チェックイン前の時間帯で実施希望。',
    status: 'reported',
    candidates: [
      { id: 'WO-2026-0129-c1', date: '2026-06-18', timeSlot: '午後（13:00〜17:00）', response: 'ok' },
    ],
    confirmedSlotId: 'WO-2026-0129-c1',
    tasks: makeTasks('WO-2026-0129', '外壁・窓ガラス清掃', 5),
    report: {
      summary: '別館スパ棟の外壁面および窓ガラス、エントランス自動ドアの清掃を実施しました。',
      result: '経年の水垢・カルキ汚れを除去し、透明度が回復。2F東面のサッシに軽微なシール劣化を確認しました。',
      nextAdvice: '2F東面サッシのシール打ち替えを次回までに別途ご検討ください。外壁清掃は年2回の頻度を推奨します。',
      photos: [
        { id: 'p1', kind: 'before', caption: 'エントランス窓 清掃前' },
        { id: 'p2', kind: 'after', caption: 'エントランス窓 清掃後' },
      ],
      submittedAt: '2026-06-18T16:20:00',
      submittedBy: 'みどり環境サービス 高橋',
    },
    history: [
      { id: 'h1', at: '2026-06-05T14:00:00', actorRole: 'company', actorName: '岡本 誠', action: '作業予定を登録しました' },
      { id: 'h2', at: '2026-06-05T14:20:00', actorRole: 'company', actorName: '岡本 誠', action: '候補日を提示しました' },
      { id: 'h3', at: '2026-06-08T09:30:00', actorRole: 'customer', actorName: 'ホテル管理部 佐野', action: '6/18（木）午後 をOKと回答しました' },
      { id: 'h4', at: '2026-06-08T10:00:00', actorRole: 'company', actorName: '岡本 誠', action: '6/18（木）午後 で日程を確定しました' },
      { id: 'h5', at: '2026-06-18T13:05:00', actorRole: 'partner', actorName: 'みどり環境サービス 高橋', action: '作業を開始しました' },
      { id: 'h6', at: '2026-06-18T16:20:00', actorRole: 'partner', actorName: 'みどり環境サービス 高橋', action: '作業報告書を提出しました' },
    ],
  },
];
