// 架空サンプルデータ
//
// ここに登場する会社名・担当者名・案件・金額はすべて架空のサンプルです。
// 実在の企業・個人・案件とは一切関係ありません（公開リポジトリのため）。

import type { Alert, Case } from '../types';

/** このシステムを運用している会社（架空） */
export const OPERATING_COMPANY = 'アオイ商事株式会社';

/** ログイン中の管理者（架空） */
export const VIEWER = {
  name: '三宅 亮',
  role: '進捗管理室 マネージャー',
};

/** 案件登録時に自動付与する標準チェック項目のひな形 */
export const CHECKPOINT_TEMPLATE = [
  '契約書締結',
  '着手金入金確認',
  '要件確定・仕様合意',
  '中間進捗報告',
  '納品・検収',
  '請求書発行',
];

/** 発生からの相対時刻（分前）でISO日時を作る。ダッシュボードの「〇分前」表示用 */
function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}

export const sampleCases: Case[] = [
  {
    id: 'c-1',
    code: 'CASE-2026-041',
    title: '基幹システム更改支援',
    client: '青葉テクノ工業株式会社',
    owner: '田村 一輝',
    department: '営業二課',
    orderDate: '2026-06-15',
    dueDate: '2026-08-14',
    amount: 4_820_000,
    checkpoints: [
      { id: 'c1-1', name: '契約書締結', owner: '田村 一輝', dueDate: '2026-06-18', status: 'done', completedDate: '2026-06-17' },
      { id: 'c1-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-06-30', status: 'done', completedDate: '2026-06-27' },
      { id: 'c1-3', name: '要件確定・仕様合意', owner: '中西 大輔', dueDate: '2026-07-10', status: 'delayed', note: '顧客側の承認待ちで期限を超過しています。' },
      { id: 'c1-4', name: '中間進捗報告', owner: '田村 一輝', dueDate: '2026-07-24', status: 'pending' },
      { id: 'c1-5', name: '納品・検収', owner: '中西 大輔', dueDate: '2026-08-10', status: 'pending' },
      { id: 'c1-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-08-14', status: 'pending' },
    ],
    events: [
      { id: 'e1-1', at: '2026-06-17T10:12:00', actor: '田村 一輝', text: '「契約書締結」を完了にしました' },
      { id: 'e1-2', at: '2026-06-27T15:40:00', actor: '経理 川口 花', text: '「着手金入金確認」を完了にしました' },
      { id: 'e1-3', at: minutesAgo(38), actor: 'システム', text: '「要件確定・仕様合意」が期限を超過したため遅延を検知しました' },
    ],
  },
  {
    id: 'c-2',
    code: 'CASE-2026-038',
    title: '店舗向け在庫管理ツール導入',
    client: 'まるみ物産株式会社',
    owner: '鈴木 美咲',
    department: '営業一課',
    orderDate: '2026-06-02',
    dueDate: '2026-07-31',
    amount: 2_640_000,
    checkpoints: [
      { id: 'c2-1', name: '契約書締結', owner: '鈴木 美咲', dueDate: '2026-06-05', status: 'done', completedDate: '2026-06-05' },
      { id: 'c2-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-06-16', status: 'done', completedDate: '2026-06-15' },
      { id: 'c2-3', name: '要件確定・仕様合意', owner: '山口 彩', dueDate: '2026-06-26', status: 'done', completedDate: '2026-06-25' },
      { id: 'c2-4', name: '中間進捗報告', owner: '鈴木 美咲', dueDate: '2026-07-15', status: 'flagged', note: '検証環境で在庫数の同期ずれを確認。顧客報告の前に原因調査が必要です。' },
      { id: 'c2-5', name: '納品・検収', owner: '山口 彩', dueDate: '2026-07-28', status: 'pending' },
      { id: 'c2-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-07-31', status: 'pending' },
    ],
    events: [
      { id: 'e2-1', at: '2026-06-25T11:05:00', actor: '山口 彩', text: '「要件確定・仕様合意」を完了にしました' },
      { id: 'e2-2', at: minutesAgo(95), actor: '鈴木 美咲', text: '「中間進捗報告」に不備報告を登録しました' },
    ],
  },
  {
    id: 'c-3',
    code: 'CASE-2026-045',
    title: '採用サイトリニューアル',
    client: '湊デザイン合同会社',
    owner: '岡田 里奈',
    department: '営業二課',
    orderDate: '2026-06-28',
    dueDate: '2026-08-21',
    amount: 1_980_000,
    checkpoints: [
      { id: 'c3-1', name: '契約書締結', owner: '岡田 里奈', dueDate: '2026-07-01', status: 'done', completedDate: '2026-07-01' },
      { id: 'c3-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-07-14', status: 'in_progress' },
      { id: 'c3-3', name: '要件確定・仕様合意', owner: '山口 彩', dueDate: '2026-07-25', status: 'pending' },
      { id: 'c3-4', name: '中間進捗報告', owner: '岡田 里奈', dueDate: '2026-08-07', status: 'pending' },
      { id: 'c3-5', name: '納品・検収', owner: '山口 彩', dueDate: '2026-08-18', status: 'pending' },
      { id: 'c3-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-08-21', status: 'pending' },
    ],
    events: [
      { id: 'e3-1', at: '2026-07-01T09:30:00', actor: '岡田 里奈', text: '「契約書締結」を完了にしました' },
      { id: 'e3-2', at: minutesAgo(180), actor: '経理 川口 花', text: '「着手金入金確認」を進行中にしました' },
    ],
  },
  {
    id: 'c-4',
    code: 'CASE-2026-033',
    title: '受発注EDI連携開発',
    client: '大栄フーズ株式会社',
    owner: '佐藤 健太',
    department: '営業一課',
    orderDate: '2026-05-20',
    dueDate: '2026-07-17',
    amount: 6_150_000,
    checkpoints: [
      { id: 'c4-1', name: '契約書締結', owner: '佐藤 健太', dueDate: '2026-05-23', status: 'done', completedDate: '2026-05-22' },
      { id: 'c4-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-06-02', status: 'done', completedDate: '2026-06-01' },
      { id: 'c4-3', name: '要件確定・仕様合意', owner: '中西 大輔', dueDate: '2026-06-13', status: 'done', completedDate: '2026-06-12' },
      { id: 'c4-4', name: '中間進捗報告', owner: '佐藤 健太', dueDate: '2026-06-30', status: 'done', completedDate: '2026-06-29' },
      { id: 'c4-5', name: '納品・検収', owner: '中西 大輔', dueDate: '2026-07-11', status: 'delayed', note: '検収テストで連携エラーが残存。修正対応中のため期限を超過しています。' },
      { id: 'c4-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-07-17', status: 'pending' },
    ],
    events: [
      { id: 'e4-1', at: '2026-06-29T16:20:00', actor: '佐藤 健太', text: '「中間進捗報告」を完了にしました' },
      { id: 'e4-2', at: minutesAgo(1560), actor: 'システム', text: '「納品・検収」が期限を超過したため遅延を検知しました' },
    ],
  },
  {
    id: 'c-5',
    code: 'CASE-2026-047',
    title: '営業日報アプリ構築',
    client: '北斗システムズ株式会社',
    owner: '小林 拓也',
    department: '営業一課',
    orderDate: '2026-07-06',
    dueDate: '2026-09-04',
    amount: 3_300_000,
    checkpoints: [
      { id: 'c5-1', name: '契約書締結', owner: '小林 拓也', dueDate: '2026-07-14', status: 'in_progress' },
      { id: 'c5-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-07-24', status: 'pending' },
      { id: 'c5-3', name: '要件確定・仕様合意', owner: '中西 大輔', dueDate: '2026-08-05', status: 'pending' },
      { id: 'c5-4', name: '中間進捗報告', owner: '小林 拓也', dueDate: '2026-08-20', status: 'pending' },
      { id: 'c5-5', name: '納品・検収', owner: '中西 大輔', dueDate: '2026-09-01', status: 'pending' },
      { id: 'c5-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-09-04', status: 'pending' },
    ],
    events: [
      { id: 'e5-1', at: minutesAgo(300), actor: '小林 拓也', text: '案件を登録し「契約書締結」を進行中にしました' },
    ],
  },
  {
    id: 'c-6',
    code: 'CASE-2026-029',
    title: '物流拠点デジタルサイネージ',
    client: '三ツ星機械製作所',
    owner: '鈴木 美咲',
    department: '営業一課',
    orderDate: '2026-05-08',
    dueDate: '2026-06-30',
    amount: 1_540_000,
    checkpoints: [
      { id: 'c6-1', name: '契約書締結', owner: '鈴木 美咲', dueDate: '2026-05-12', status: 'done', completedDate: '2026-05-11' },
      { id: 'c6-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-05-22', status: 'done', completedDate: '2026-05-21' },
      { id: 'c6-3', name: '要件確定・仕様合意', owner: '山口 彩', dueDate: '2026-06-02', status: 'done', completedDate: '2026-06-02' },
      { id: 'c6-4', name: '中間進捗報告', owner: '鈴木 美咲', dueDate: '2026-06-16', status: 'done', completedDate: '2026-06-15' },
      { id: 'c6-5', name: '納品・検収', owner: '山口 彩', dueDate: '2026-06-27', status: 'done', completedDate: '2026-06-26' },
      { id: 'c6-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-06-30', status: 'done', completedDate: '2026-06-30' },
    ],
    events: [
      { id: 'e6-1', at: '2026-06-26T13:00:00', actor: '山口 彩', text: '「納品・検収」を完了にしました' },
      { id: 'e6-2', at: '2026-06-30T17:10:00', actor: '経理 川口 花', text: '「請求書発行」を完了にしました。案件が完了しました' },
    ],
  },
  {
    id: 'c-7',
    code: 'CASE-2026-043',
    title: '会員向けECサイト機能追加',
    client: 'ひなた不動産株式会社',
    owner: '佐藤 健太',
    department: '営業一課',
    orderDate: '2026-06-22',
    dueDate: '2026-08-07',
    amount: 2_970_000,
    checkpoints: [
      { id: 'c7-1', name: '契約書締結', owner: '佐藤 健太', dueDate: '2026-06-25', status: 'done', completedDate: '2026-06-24' },
      { id: 'c7-2', name: '着手金入金確認', owner: '経理 川口 花', dueDate: '2026-07-06', status: 'done', completedDate: '2026-07-06' },
      { id: 'c7-3', name: '要件確定・仕様合意', owner: '中西 大輔', dueDate: '2026-07-16', status: 'in_progress' },
      { id: 'c7-4', name: '中間進捗報告', owner: '佐藤 健太', dueDate: '2026-07-29', status: 'pending' },
      { id: 'c7-5', name: '納品・検収', owner: '中西 大輔', dueDate: '2026-08-04', status: 'pending' },
      { id: 'c7-6', name: '請求書発行', owner: '経理 川口 花', dueDate: '2026-08-07', status: 'pending' },
    ],
    events: [
      { id: 'e7-1', at: '2026-07-06T10:45:00', actor: '経理 川口 花', text: '「着手金入金確認」を完了にしました' },
      { id: 'e7-2', at: minutesAgo(600), actor: '中西 大輔', text: '「要件確定・仕様合意」を進行中にしました' },
    ],
  },
];

export const sampleAlerts: Alert[] = [
  {
    id: 'a-1',
    caseId: 'c-1',
    caseCode: 'CASE-2026-041',
    caseTitle: '基幹システム更改支援',
    kind: 'delay',
    level: 'high',
    status: 'open',
    message: '「要件確定・仕様合意」が期限（07/10）を超過しています。担当: 中西 大輔',
    checkpointName: '要件確定・仕様合意',
    at: minutesAgo(38),
  },
  {
    id: 'a-2',
    caseId: 'c-2',
    caseCode: 'CASE-2026-038',
    caseTitle: '店舗向け在庫管理ツール導入',
    kind: 'defect',
    level: 'high',
    status: 'open',
    message: '「中間進捗報告」に不備報告が登録されました。在庫数の同期ずれを確認。担当: 鈴木 美咲',
    checkpointName: '中間進捗報告',
    at: minutesAgo(95),
  },
  {
    id: 'a-3',
    caseId: 'c-4',
    caseCode: 'CASE-2026-033',
    caseTitle: '受発注EDI連携開発',
    kind: 'delay',
    level: 'high',
    status: 'ack',
    message: '「納品・検収」が期限（07/11）を超過しています。担当: 中西 大輔',
    checkpointName: '納品・検収',
    at: minutesAgo(1560),
  },
  {
    id: 'a-4',
    caseId: 'c-3',
    caseCode: 'CASE-2026-045',
    caseTitle: '採用サイトリニューアル',
    kind: 'due_soon',
    level: 'medium',
    status: 'open',
    message: '「着手金入金確認」の期限が明日（07/14）に迫っています。担当: 経理 川口 花',
    checkpointName: '着手金入金確認',
    at: minutesAgo(240),
  },
  {
    id: 'a-5',
    caseId: 'c-5',
    caseCode: 'CASE-2026-047',
    caseTitle: '営業日報アプリ構築',
    kind: 'due_soon',
    level: 'medium',
    status: 'ack',
    message: '「契約書締結」の期限が明日（07/14）に迫っています。担当: 小林 拓也',
    checkpointName: '契約書締結',
    at: minutesAgo(300),
  },
];
