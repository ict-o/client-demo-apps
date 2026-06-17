export type EstimateStatus = 'draft' | 'presented' | 'confirmed' | 'cancelled';

export interface EstimateItem {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  note?: string;
}

export interface Discount {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percent';
  baseItemId?: string;
}

export interface Estimate {
  id: string;
  customerName: string;
  weddingDate: string;
  preferredSeason: string;
  preferredDayOfWeek: string;
  preferredTimeSlot: string;
  venue: string;
  ceremonyType: string;
  adultCount: number;
  childCount: number;
  budget: number;
  items: EstimateItem[];
  discounts: Discount[];
  serviceRatePercent: number;
  taxRatePercent: number;
  status: EstimateStatus;
  updatedAt: string;
  plannerComment: string;
  notes: string;
}

export interface WizardFormData {
  customerName: string;
  weddingDate: string;
  preferredSeason: string;
  preferredDayOfWeek: string;
  preferredTimeSlot: string;
  venue: string;
  ceremonyType: string;
  adultCount: number;
  childCount: number;
  budget: number;
  selectedOptions: string[];
}

export const SEASONS = ['春', '夏', '秋', '冬', '未定'];
export const DAYS_OF_WEEK = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日', '未定'];
export const TIME_SLOTS = ['午前', '午後', '夕方・ナイト', '未定'];
export const VENUES = ['グランドチャペル', 'ガーデンテラス', 'クリスタルホール', 'ローズガーデン', 'その他'];
export const CEREMONY_TYPES = ['チャペル式', '神前式', '人前式', '仏前式'];

export const OPTION_CATEGORIES = [
  { id: 'food', label: '料理' },
  { id: 'drink', label: '飲料' },
  { id: 'flower', label: '装花' },
  { id: 'costume', label: '衣装' },
  { id: 'photo', label: '写真' },
  { id: 'video', label: '映像' },
];

export const STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: '作成中',
  presented: '提示済み',
  confirmed: '成約',
  cancelled: 'キャンセル',
};

export const STATUS_COLORS: Record<EstimateStatus, string> = {
  draft: '#8A9BB0',
  presented: '#B89B72',
  confirmed: '#7A9B72',
  cancelled: '#B07A7A',
};
