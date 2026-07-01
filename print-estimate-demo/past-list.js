/*
 * past-list.js — 同顧客の過去見積一覧パネル
 *
 * print-estimate-demo の app.js バンドルをそのまま利用し、
 * 顧客名入力欄に連動して同顧客の過去見積一覧を画面下部に挿入します。
 * データはすべて架空データです。実在の顧客・案件情報は含みません。
 */
(function () {
  'use strict';

  /* ─── 架空の過去見積データ ─────────────────────────────── */
  var PAST_ESTIMATES = [
    /* 株式会社サンプリント商事 (S0312) */
    { id: 'Q2024-0891', date: '2024-11-14', customerCode: 'S0312', customer: '株式会社サンプリント商事', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 134000, grossMarginRate: 36.8, sales: '佐藤' },
    { id: 'Q2024-0510', date: '2024-06-03', customerCode: 'S0312', customer: '株式会社サンプリント商事', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 131000, grossMarginRate: 35.2, sales: '佐藤' },
    { id: 'Q2024-0122', date: '2024-02-08', customerCode: 'S0312', customer: '株式会社サンプリント商事', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 2000,  process: '折り',   amount: 168000, grossMarginRate: 38.5, sales: '佐藤' },
    { id: 'Q2023-0889', date: '2023-10-27', customerCode: 'S0312', customer: '株式会社サンプリント商事', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: 'なし',   amount: 97000,  grossMarginRate: 34.9, sales: '鈴木' },
    { id: 'Q2023-0412', date: '2023-05-15', customerCode: 'S0312', customer: '株式会社サンプリント商事', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '片面4色', quantity: 5000,  process: '断裁',   amount: 148000, grossMarginRate: 37.1, sales: '佐藤' },

    /* 丸山印刷販売株式会社 (M0156) */
    { id: 'Q2024-0734', date: '2024-09-02', customerCode: 'M0156', customer: '丸山印刷販売株式会社', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 3000,  process: '折り',   amount: 198000, grossMarginRate: 41.2, sales: '鈴木' },
    { id: 'Q2024-0301', date: '2024-03-19', customerCode: 'M0156', customer: '丸山印刷販売株式会社', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 3000,  process: '折り',   amount: 194000, grossMarginRate: 40.6, sales: '鈴木' },
    { id: 'Q2023-0955', date: '2023-11-08', customerCode: 'M0156', customer: '丸山印刷販売株式会社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 126000, grossMarginRate: 38.0, sales: '鈴木' },
    { id: 'Q2023-0603', date: '2023-07-14', customerCode: 'M0156', customer: '丸山印刷販売株式会社', printType: 'チラシ',     size: 'B4', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: 'なし',   amount: 112000, grossMarginRate: 37.4, sales: '田中' },
    { id: 'Q2022-1201', date: '2022-12-21', customerCode: 'M0156', customer: '丸山印刷販売株式会社', printType: 'カタログ',   size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 1000,  process: '中綴じ', amount: 284000, grossMarginRate: 42.3, sales: '鈴木' },

    /* 株式会社東洋プロモーション (T0089) */
    { id: 'Q2024-0612', date: '2024-07-18', customerCode: 'T0089', customer: '株式会社東洋プロモーション', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: '断裁',   amount: 156000, grossMarginRate: 33.5, sales: '田中' },
    { id: 'Q2024-0283', date: '2024-03-29', customerCode: 'T0089', customer: '株式会社東洋プロモーション', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 149000, grossMarginRate: 32.8, sales: '田中' },
    { id: 'Q2023-1005', date: '2023-11-30', customerCode: 'T0089', customer: '株式会社東洋プロモーション', printType: 'パンフレット', size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 2000,  process: '折り',   amount: 173000, grossMarginRate: 35.7, sales: '山本' },
    { id: 'Q2023-0711', date: '2023-08-22', customerCode: 'T0089', customer: '株式会社東洋プロモーション', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 10000, process: '断裁',   amount: 201000, grossMarginRate: 34.2, sales: '田中' },
    { id: 'Q2023-0208', date: '2023-02-16', customerCode: 'T0089', customer: '株式会社東洋プロモーション', printType: 'チラシ',     size: 'A4', paper: 'マットコート紙', color: '片面4色', quantity: 3000,  process: 'なし',   amount: 94000,  grossMarginRate: 33.0, sales: '田中' },

    /* 北斗広告株式会社 (H0074) */
    { id: 'Q2024-0501', date: '2024-06-05', customerCode: 'H0074', customer: '北斗広告株式会社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 10000, process: 'なし',   amount: 218000, grossMarginRate: 38.9, sales: '高橋' },
    { id: 'Q2024-0188', date: '2024-02-14', customerCode: 'H0074', customer: '北斗広告株式会社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 10000, process: 'なし',   amount: 214000, grossMarginRate: 38.1, sales: '高橋' },
    { id: 'Q2023-0844', date: '2023-09-19', customerCode: 'H0074', customer: '北斗広告株式会社', printType: 'パンフレット', size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: '折り',   amount: 289000, grossMarginRate: 39.5, sales: '高橋' },
    { id: 'Q2023-0420', date: '2023-05-08', customerCode: 'H0074', customer: '北斗広告株式会社', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: '断裁',   amount: 162000, grossMarginRate: 37.3, sales: '山本' },
    { id: 'Q2022-1088', date: '2022-11-30', customerCode: 'H0074', customer: '北斗広告株式会社', printType: 'カタログ',   size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 1000,  process: '中綴じ', amount: 256000, grossMarginRate: 40.2, sales: '高橋' },

    /* 株式会社明和エージェンシー (A0203) */
    { id: 'Q2024-0389', date: '2024-04-22', customerCode: 'A0203', customer: '株式会社明和エージェンシー', printType: 'パンフレット', size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 1000,  process: '折り',   amount: 128000, grossMarginRate: 42.1, sales: '伊藤' },
    { id: 'Q2024-0055', date: '2024-01-17', customerCode: 'A0203', customer: '株式会社明和エージェンシー', printType: 'パンフレット', size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 1000,  process: '折り',   amount: 125000, grossMarginRate: 41.8, sales: '伊藤' },
    { id: 'Q2023-0789', date: '2023-09-05', customerCode: 'A0203', customer: '株式会社明和エージェンシー', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: 'なし',   amount: 98000,  grossMarginRate: 40.3, sales: '伊藤' },
    { id: 'Q2023-0311', date: '2023-03-27', customerCode: 'A0203', customer: '株式会社明和エージェンシー', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 2000,  process: '折り',   amount: 178000, grossMarginRate: 43.0, sales: '田中' },

    /* セントラル印刷工業株式会社 (C0091) */
    { id: 'Q2024-0201', date: '2024-02-28', customerCode: 'C0091', customer: 'セントラル印刷工業株式会社', printType: '冊子',     size: 'A4', paper: '上質紙',       color: '両面4色', quantity: 1000,  process: '中綴じ', amount: 245000, grossMarginRate: 39.7, sales: '山本' },
    { id: 'Q2023-1133', date: '2023-12-04', customerCode: 'C0091', customer: 'セントラル印刷工業株式会社', printType: '冊子',     size: 'A4', paper: '上質紙',       color: '両面4色', quantity: 1000,  process: '中綴じ', amount: 238000, grossMarginRate: 39.1, sales: '山本' },
    { id: 'Q2023-0722', date: '2023-08-10', customerCode: 'C0091', customer: 'セントラル印刷工業株式会社', printType: 'チラシ',   size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 132000, grossMarginRate: 37.5, sales: '山本' },
    { id: 'Q2023-0281', date: '2023-03-14', customerCode: 'C0091', customer: 'セントラル印刷工業株式会社', printType: 'チラシ',   size: 'A3', paper: 'コート紙',     color: '片面4色', quantity: 3000,  process: '断裁',   amount: 119000, grossMarginRate: 36.8, sales: '伊藤' },

    /* 株式会社グローバルデザイン (G0445) */
    { id: 'Q2023-1142', date: '2023-12-11', customerCode: 'G0445', customer: '株式会社グローバルデザイン', printType: 'チラシ',     size: 'A4', paper: 'マットコート紙', color: '片面4色', quantity: 3000,  process: 'なし',   amount: 89000,  grossMarginRate: 35.4, sales: '佐藤' },
    { id: 'Q2023-0858', date: '2023-10-02', customerCode: 'G0445', customer: '株式会社グローバルデザイン', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: 'なし',   amount: 95000,  grossMarginRate: 34.8, sales: '佐藤' },
    { id: 'Q2023-0534', date: '2023-06-20', customerCode: 'G0445', customer: '株式会社グローバルデザイン', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 1000,  process: '折り',   amount: 138000, grossMarginRate: 37.0, sales: '高橋' },
    { id: 'Q2023-0102', date: '2023-01-25', customerCode: 'G0445', customer: '株式会社グローバルデザイン', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '片面4色', quantity: 5000,  process: 'なし',   amount: 78000,  grossMarginRate: 33.9, sales: '佐藤' },

    /* 株式会社アドバンスマーケティング (A0117) */
    { id: 'Q2023-0998', date: '2023-10-30', customerCode: 'A0117', customer: '株式会社アドバンスマーケティング', printType: 'パンフレット', size: 'B4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: '折り',   amount: 312000, grossMarginRate: 37.8, sales: '鈴木' },
    { id: 'Q2023-0744', date: '2023-08-29', customerCode: 'A0117', customer: '株式会社アドバンスマーケティング', printType: 'パンフレット', size: 'B4', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: '折り',   amount: 224000, grossMarginRate: 37.2, sales: '鈴木' },
    { id: 'Q2023-0399', date: '2023-04-18', customerCode: 'A0117', customer: '株式会社アドバンスマーケティング', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 10000, process: '断裁',   amount: 193000, grossMarginRate: 36.5, sales: '山本' },
    { id: 'Q2022-1301', date: '2022-12-05', customerCode: 'A0117', customer: '株式会社アドバンスマーケティング', printType: 'カタログ',   size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 2000,  process: '中綴じ', amount: 378000, grossMarginRate: 39.1, sales: '鈴木' },

    /* 有限会社クリエイティブワークス (C0278) */
    { id: 'Q2023-0812', date: '2023-08-17', customerCode: 'C0278', customer: '有限会社クリエイティブワークス', printType: '名刺',     size: '名刺サイズ', paper: '特殊紙',     color: '片面4色', quantity: 500,   process: 'PP加工', amount: 48000,  grossMarginRate: 44.2, sales: '田中' },
    { id: 'Q2023-0590', date: '2023-06-30', customerCode: 'C0278', customer: '有限会社クリエイティブワークス', printType: '名刺',     size: '名刺サイズ', paper: '特殊紙',     color: '片面4色', quantity: 500,   process: 'PP加工', amount: 47000,  grossMarginRate: 43.8, sales: '田中' },
    { id: 'Q2023-0215', date: '2023-02-22', customerCode: 'C0278', customer: '有限会社クリエイティブワークス', printType: 'チラシ',   size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 1000,  process: 'なし',   amount: 72000,  grossMarginRate: 42.5, sales: '田中' },
    { id: 'Q2022-1055', date: '2022-11-14', customerCode: 'C0278', customer: '有限会社クリエイティブワークス', printType: '名刺',     size: '名刺サイズ', paper: '上質紙',     color: '片面4色', quantity: 300,   process: 'なし',   amount: 28000,  grossMarginRate: 41.0, sales: '高橋' },

    /* 株式会社ベストプリンティング (B0332) */
    { id: 'Q2023-0671', date: '2023-07-06', customerCode: 'B0332', customer: '株式会社ベストプリンティング', printType: '封筒',     size: 'B4', paper: '上質紙',     color: '片面1色', quantity: 3000,  process: 'なし',   amount: 67000,  grossMarginRate: 31.2, sales: '高橋' },
    { id: 'Q2023-0421', date: '2023-04-27', customerCode: 'B0332', customer: '株式会社ベストプリンティング', printType: '封筒',     size: 'B4', paper: '上質紙',     color: '片面1色', quantity: 5000,  process: 'なし',   amount: 95000,  grossMarginRate: 30.8, sales: '高橋' },
    { id: 'Q2023-0088', date: '2023-01-18', customerCode: 'B0332', customer: '株式会社ベストプリンティング', printType: 'チラシ',   size: 'A4', paper: 'コート紙',   color: '両面4色', quantity: 3000,  process: 'なし',   amount: 98000,  grossMarginRate: 33.5, sales: '伊藤' },
    { id: 'Q2022-0880', date: '2022-09-09', customerCode: 'B0332', customer: '株式会社ベストプリンティング', printType: '封筒',     size: 'B4', paper: '上質紙',     color: '片面1色', quantity: 3000,  process: 'なし',   amount: 64000,  grossMarginRate: 30.5, sales: '高橋' },

    /* テクノプリント株式会社 (T0521) */
    { id: 'Q2023-0524', date: '2023-05-19', customerCode: 'T0521', customer: 'テクノプリント株式会社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 119000, grossMarginRate: 36.1, sales: '伊藤' },
    { id: 'Q2023-0230', date: '2023-03-01', customerCode: 'T0521', customer: 'テクノプリント株式会社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: 'なし',   amount: 91000,  grossMarginRate: 35.5, sales: '伊藤' },
    { id: 'Q2022-1188', date: '2022-12-12', customerCode: 'T0521', customer: 'テクノプリント株式会社', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 2000,  process: '折り',   amount: 164000, grossMarginRate: 37.8, sales: '山本' },
    { id: 'Q2022-0822', date: '2022-08-24', customerCode: 'T0521', customer: 'テクノプリント株式会社', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: '断裁',   amount: 155000, grossMarginRate: 36.8, sales: '伊藤' },

    /* 株式会社日本プロモーション (N0688) */
    { id: 'Q2023-0401', date: '2023-04-03', customerCode: 'N0688', customer: '株式会社日本プロモーション', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: '断裁',   amount: 141000, grossMarginRate: 38.5, sales: '山本' },
    { id: 'Q2023-0122', date: '2023-01-31', customerCode: 'N0688', customer: '株式会社日本プロモーション', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 135000, grossMarginRate: 37.9, sales: '山本' },
    { id: 'Q2022-1199', date: '2022-12-16', customerCode: 'N0688', customer: '株式会社日本プロモーション', printType: 'パンフレット', size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 2000,  process: '折り',   amount: 172000, grossMarginRate: 39.2, sales: '佐藤' },
    { id: 'Q2022-0901', date: '2022-09-21', customerCode: 'N0688', customer: '株式会社日本プロモーション', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '片面4色', quantity: 5000,  process: 'なし',   amount: 103000, grossMarginRate: 36.4, sales: '山本' },
    { id: 'Q2022-0601', date: '2022-06-07', customerCode: 'N0688', customer: '株式会社日本プロモーション', printType: 'チラシ',     size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 3000,  process: 'なし',   amount: 96000,  grossMarginRate: 36.0, sales: '山本' },

    /* 株式会社中央広告社 (C0140) */
    { id: 'Q2022-1089', date: '2022-11-28', customerCode: 'C0140', customer: '株式会社中央広告社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 125000, grossMarginRate: 37.2, sales: '佐藤' },
    { id: 'Q2022-0800', date: '2022-08-19', customerCode: 'C0140', customer: '株式会社中央広告社', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 122000, grossMarginRate: 36.8, sales: '佐藤' },
    { id: 'Q2022-0480', date: '2022-05-12', customerCode: 'C0140', customer: '株式会社中央広告社', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 1000,  process: '折り',   amount: 142000, grossMarginRate: 38.4, sales: '伊藤' },
    { id: 'Q2021-1200', date: '2021-12-08', customerCode: 'C0140', customer: '株式会社中央広告社', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '片面4色', quantity: 3000,  process: 'なし',   amount: 85000,  grossMarginRate: 35.5, sales: '佐藤' },

    /* 株式会社ファーストコミュニケーション (F0509) */
    { id: 'Q2022-0834', date: '2022-08-10', customerCode: 'F0509', customer: '株式会社ファーストコミュニケーション', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 3000,  process: 'PP加工', amount: 228000, grossMarginRate: 43.6, sales: '鈴木' },
    { id: 'Q2022-0561', date: '2022-05-24', customerCode: 'F0509', customer: '株式会社ファーストコミュニケーション', printType: 'パンフレット', size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 2000,  process: 'PP加工', amount: 192000, grossMarginRate: 43.0, sales: '鈴木' },
    { id: 'Q2022-0210', date: '2022-02-22', customerCode: 'F0509', customer: '株式会社ファーストコミュニケーション', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 128000, grossMarginRate: 40.1, sales: '田中' },
    { id: 'Q2021-1100', date: '2021-11-10', customerCode: 'F0509', customer: '株式会社ファーストコミュニケーション', printType: 'カタログ',   size: 'A4', paper: 'マットコート紙', color: '両面4色', quantity: 1000,  process: '中綴じ', amount: 305000, grossMarginRate: 44.2, sales: '鈴木' },

    /* 株式会社ビジョンクリエイト (V0063) */
    { id: 'Q2022-0612', date: '2022-06-22', customerCode: 'V0063', customer: '株式会社ビジョンクリエイト', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '両面4色', quantity: 3000,  process: '折り',   amount: 104000, grossMarginRate: 32.8, sales: '田中' },
    { id: 'Q2022-0350', date: '2022-03-29', customerCode: 'V0063', customer: '株式会社ビジョンクリエイト', printType: 'チラシ',     size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 5000,  process: 'なし',   amount: 118000, grossMarginRate: 33.5, sales: '田中' },
    { id: 'Q2022-0101', date: '2022-01-21', customerCode: 'V0063', customer: '株式会社ビジョンクリエイト', printType: 'パンフレット', size: 'A4', paper: 'コート紙',     color: '両面4色', quantity: 2000,  process: '折り',   amount: 159000, grossMarginRate: 34.1, sales: '高橋' },
    { id: 'Q2021-0950', date: '2021-10-05', customerCode: 'V0063', customer: '株式会社ビジョンクリエイト', printType: 'チラシ',     size: 'A3', paper: 'コート紙',     color: '片面4色', quantity: 3000,  process: 'なし',   amount: 86000,  grossMarginRate: 31.9, sales: '山本' },
  ];

  /* ─── ユーティリティ ────────────────────────────────── */
  function fmt(n) {
    return n.toLocaleString('ja-JP') + '円';
  }

  function getByCustomer(name) {
    if (!name || name.trim() === '') return [];
    var trimmed = name.trim();
    return PAST_ESTIMATES.filter(function (e) {
      return e.customer === trimmed;
    }).sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
  }

  /* ─── パネル生成 ────────────────────────────────── */
  var PANEL_ID = 'pl-past-estimate-panel';

  function buildTable(records) {
    var rows = records.map(function (r) {
      var margin = parseFloat(r.grossMarginRate);
      var marginColor = margin >= 40 ? '#16A34A' : margin >= 35 ? '#2563EB' : '#DC2626';
      return (
        '<tr style="border-bottom:1px solid #E8EDF3;">' +
        '<td style="padding:7px 10px;white-space:nowrap;font-weight:500;color:#2F80ED;">' + r.id + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.date + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.printType + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.size + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.paper + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.color + '</td>' +
        '<td style="padding:7px 8px;white-space:nowrap;text-align:right;">' + r.quantity.toLocaleString() + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.process + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;text-align:right;font-weight:600;">' + fmt(r.amount) + '</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;text-align:right;color:' + marginColor + ';font-weight:600;">' + margin.toFixed(1) + '%</td>' +
        '<td style="padding:7px 10px;white-space:nowrap;">' + r.sales + '</td>' +
        '</tr>'
      );
    }).join('');

    return (
      '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;color:#374151;">' +
      '<thead>' +
      '<tr style="background:#F1F5F9;border-bottom:1px solid #D8DEE9;">' +
      ['見積No', '見積日', '種別', 'サイズ', '用紙', '色数', '部数', '加工', '見積金額', '粗利率', '担当者'].map(function (h) {
        return '<th style="padding:7px 10px;white-space:nowrap;font-weight:600;color:#475569;text-align:left;">' + h + '</th>';
      }).join('') +
      '</tr>' +
      '</thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function buildSummary(records) {
    var total = records.length;
    var avgAmount = Math.round(records.reduce(function (s, r) { return s + r.amount; }, 0) / total);
    var avgMargin = (records.reduce(function (s, r) { return s + parseFloat(r.grossMarginRate); }, 0) / total).toFixed(1);
    return (
      '<div style="display:flex;gap:24px;padding:10px 16px;background:#F8FAFC;border-bottom:1px solid #E8EDF3;font-size:12px;flex-wrap:wrap;">' +
      '<span style="color:#64748B;">取引件数：<strong style="color:#1A1F2B;">' + total + '件</strong></span>' +
      '<span style="color:#64748B;">平均見積金額：<strong style="color:#1A1F2B;">' + fmt(avgAmount) + '</strong></span>' +
      '<span style="color:#64748B;">平均粗利率：<strong style="color:#2F80ED;">' + avgMargin + '%</strong></span>' +
      '</div>'
    );
  }

  function renderPanel(customerName) {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    var records = getByCustomer(customerName);

    if (records.length === 0) {
      panel.style.display = 'none';
      return;
    }

    var customerCode = records[0].customerCode;

    panel.style.display = 'block';
    panel.innerHTML =
      '<div style="padding:10px 14px;background:#1E293B;border-radius:6px 6px 0 0;display:flex;align-items:center;gap:8px;">' +
      '<span style="font-size:13px;font-weight:700;color:#F8FAFC;letter-spacing:0.03em;">同顧客の過去見積一覧</span>' +
      '<span style="font-size:11px;color:#94A3B8;margin-left:4px;">' + customerName + '（' + customerCode + '）</span>' +
      '</div>' +
      buildSummary(records) +
      buildTable(records);
  }

  /* ─── パネル挿入 ────────────────────────────────── */
  function insertPanel() {
    if (document.getElementById(PANEL_ID)) return;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = [
      'display:none',
      'margin:0 16px 24px',
      'border:1px solid #D8DEE9',
      'border-radius:6px',
      'overflow:hidden',
      'box-shadow:0 1px 3px rgba(15,23,42,0.07)',
      'background:#fff',
    ].join(';');

    // メインコンテンツ（#root の最後の子）の直後に挿入
    var root = document.getElementById('root');
    if (!root) return;

    // ヘッダー直下の最初の main/section を探す
    var mainArea = root.querySelector('main') || root.querySelector('section') || root.firstElementChild;
    if (mainArea && mainArea.parentNode) {
      mainArea.parentNode.insertBefore(panel, mainArea.nextSibling);
    } else {
      root.appendChild(panel);
    }
  }

  /* ─── 顧客名入力の取得 ────────────────────────────── */
  function getCustomerNameValue() {
    // 「顧客名」ラベルに隣接する input を探す
    var rows = document.querySelectorAll('tr');
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('td');
      if (cells.length >= 2) {
        var label = (cells[0].textContent || '').trim();
        if (label === '顧客名') {
          var input = cells[1].querySelector('input[type="text"]');
          return input ? input.value || '' : '';
        }
      }
    }
    return '';
  }

  // 過去見積一覧の表示トリガーとなる検索ボタンのラベル
  var SEARCH_BUTTON_LABELS = ['類似見積検索'];

  function hidePanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.style.display = 'none';
  }

  /* ─── 起動 ─────────────────────────────────────── */
  function start() {
    insertPanel();

    // MutationObserver で React の再レンダリングを捕捉（パネルの再挿入のみ）
    var root = document.getElementById('root') || document.body;
    var observer = new MutationObserver(function () {
      insertPanel();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true });

    // 「類似見積検索」ボタン押下時にのみ過去見積一覧を表示する
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!btn) return;
      var label = (btn.textContent || '').trim();
      if (SEARCH_BUTTON_LABELS.indexOf(label) === -1) return;
      renderPanel(getCustomerNameValue());
    });

    // 顧客名が変更されたら、次に検索ボタンが押されるまで過去見積一覧を隠す
    var lastCustomerName = getCustomerNameValue();
    document.addEventListener('input', function () {
      var val = getCustomerNameValue();
      if (val === lastCustomerName) return;
      lastCustomerName = val;
      hidePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
