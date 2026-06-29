/*
 * AI見積分析アシスタント — 印刷業向け 見積標準化支援デモ
 * フロントエンドのみ / 架空データ / React + TypeScript
 * 実在企業・実データは一切含みません。
 */

const { useState, useMemo, useEffect } = React;

/* ============================================================
 * マスタ定義
 * ========================================================== */
const STAFF = ['佐藤', '鈴木', '田中', '山本', '高橋', '伊藤'];

const CUSTOMERS = [
  '株式会社サンプル商事',
  '東京フード株式会社',
  '日本メディア印刷株式会社',
  '株式会社グリーン企画',
  '東都不動産株式会社',
];

const PRODUCT_TYPES = ['チラシ', 'パンフレット', '名刺', 'ポスター', '冊子', 'DMはがき'];

const SIZE_OPTIONS = {
  チラシ: ['A4', 'A3', 'B4'],
  パンフレット: ['A4仕上げ 8P', 'A4仕上げ 12P'],
  名刺: ['91×55mm'],
  ポスター: ['B2', 'A1'],
  冊子: ['A4 16P', 'A4 24P'],
  DMはがき: ['100×148mm'],
};

const PAPER_OPTIONS = [
  'コート110kg',
  'コート135kg',
  'マットコート135kg',
  '上質90kg',
  'アート180kg',
];

const COLOR_OPTIONS = ['フルカラー両面(4/4)', 'フルカラー片面(4/0)', '1色(1/0)'];

const FINISH_OPTIONS = ['なし', '折り加工', 'PP加工', '中綴じ', 'スジ入れ', '角丸'];

const LEAD_OPTIONS = ['通常(7営業日)', '短納期(3営業日)', '余裕(10営業日)'];

/* 担当者ごとの価格傾向パラメータ（デモ用の擬似モデル） */
const STAFF_PARAMS = {
  佐藤: { mult: 0.99, varc: 0.018, costRate: 0.72, win: 0.86 },
  鈴木: { mult: 0.94, varc: 0.022, costRate: 0.745, win: 0.83 },
  田中: { mult: 1.108, varc: 0.032, costRate: 0.7, win: 0.46 },
  山本: { mult: 1.006, varc: 0.012, costRate: 0.715, win: 0.71 },
  高橋: { mult: 1.022, varc: 0.026, costRate: 0.802, win: 0.66 },
  伊藤: { mult: 1.03, varc: 0.078, costRate: 0.725, win: 0.58 },
};

/* 標準価格の算定係数 */
const TYPE_BASE = {
  チラシ: 38000,
  パンフレット: 125000,
  名刺: 9000,
  ポスター: 30000,
  冊子: 165000,
  DMはがき: 42000,
};
const COLOR_FACTOR = {
  'フルカラー両面(4/4)': 1.0,
  'フルカラー片面(4/0)': 0.88,
  '1色(1/0)': 0.72,
};
const FINISH_ADD = {
  なし: 0,
  折り加工: 0.06,
  PP加工: 0.12,
  中綴じ: 0.05,
  スジ入れ: 0.04,
  角丸: 0.03,
};
const SIZE_FACTOR = {
  A4: 1.0,
  A3: 1.32,
  B4: 1.16,
  'A4仕上げ 8P': 1.0,
  'A4仕上げ 12P': 1.18,
  '91×55mm': 1.0,
  B2: 1.0,
  A1: 1.55,
  'A4 16P': 1.0,
  'A4 24P': 1.4,
  '100×148mm': 1.0,
};
const LEAD_MULT = {
  '通常(7営業日)': 1.0,
  '短納期(3営業日)': 1.08,
  '余裕(10営業日)': 0.98,
};

/* ============================================================
 * 標準価格の算定
 * ========================================================== */
function computeStandardPrice(spec) {
  const base = TYPE_BASE[spec.productType] || 40000;
  const qf = Math.pow(Math.max(spec.quantity, 1) / 1000, 0.72);
  const raw =
    base *
    (COLOR_FACTOR[spec.colors] || 1) *
    (1 + (FINISH_ADD[spec.finishing] || 0)) *
    (SIZE_FACTOR[spec.size] || 1) *
    qf *
    (LEAD_MULT[spec.leadTime] || 1);
  return Math.max(1000, Math.round(raw / 1000) * 1000);
}

/* 決定論的な擬似乱数（読み込みごとに同じデータを再現） */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
 * サンプル見積データ（架空）の生成
 * ========================================================== */
const JOBS = [
  {
    spec: {
      customer: '株式会社サンプル商事',
      productType: 'パンフレット',
      size: 'A4仕上げ 12P',
      paper: 'マットコート135kg',
      colors: 'フルカラー両面(4/4)',
      finishing: '折り加工',
      leadTime: '通常(7営業日)',
      quantity: 3000,
    },
    entries: [
      ['鈴木', '2024/07/12', '定例カタログ'],
      ['田中', '2024/11/20', '増刷・仕様微修正'],
      ['山本', '2025/05/14', 'リピート案件'],
      ['佐藤', '2026/02/09', '継続契約・年間'],
    ],
  },
  {
    spec: {
      customer: '株式会社サンプル商事',
      productType: 'チラシ',
      size: 'A4',
      paper: 'コート110kg',
      colors: 'フルカラー両面(4/4)',
      finishing: 'なし',
      leadTime: '通常(7営業日)',
      quantity: 5000,
    },
    entries: [
      ['高橋', '2025/01/22', 'セール告知'],
      ['伊藤', '2025/08/30', '新店舗オープン'],
    ],
  },
  {
    spec: {
      customer: '東京フード株式会社',
      productType: 'チラシ',
      size: 'A4',
      paper: 'コート135kg',
      colors: 'フルカラー両面(4/4)',
      finishing: 'なし',
      leadTime: '短納期(3営業日)',
      quantity: 8000,
    },
    entries: [
      ['鈴木', '2024/09/03', '特売チラシ'],
      ['佐藤', '2025/03/18', '特売チラシ'],
      ['田中', '2025/10/07', '特売チラシ'],
      ['伊藤', '2026/01/15', '特売・短納期対応'],
    ],
  },
  {
    spec: {
      customer: '東京フード株式会社',
      productType: 'DMはがき',
      size: '100×148mm',
      paper: '上質90kg',
      colors: 'フルカラー片面(4/0)',
      finishing: 'なし',
      leadTime: '通常(7営業日)',
      quantity: 6000,
    },
    entries: [
      ['山本', '2024/12/11', '会員向けDM'],
      ['高橋', '2025/06/24', '会員向けDM'],
      ['鈴木', '2026/04/02', '会員向けDM'],
    ],
  },
  {
    spec: {
      customer: '日本メディア印刷株式会社',
      productType: '冊子',
      size: 'A4 16P',
      paper: 'コート110kg',
      colors: 'フルカラー両面(4/4)',
      finishing: '中綴じ',
      leadTime: '通常(7営業日)',
      quantity: 2000,
    },
    entries: [
      ['田中', '2024/08/19', '会報誌'],
      ['山本', '2025/02/27', '会報誌'],
      ['佐藤', '2025/09/16', '会報誌'],
      ['伊藤', '2026/03/05', '会報誌・仕様変更'],
    ],
  },
  {
    spec: {
      customer: '日本メディア印刷株式会社',
      productType: 'ポスター',
      size: 'B2',
      paper: 'アート180kg',
      colors: 'フルカラー片面(4/0)',
      finishing: 'PP加工',
      leadTime: '通常(7営業日)',
      quantity: 500,
    },
    entries: [
      ['高橋', '2025/04/10', 'イベント告知'],
      ['鈴木', '2025/11/28', 'イベント告知'],
    ],
  },
  {
    spec: {
      customer: '株式会社グリーン企画',
      productType: '名刺',
      size: '91×55mm',
      paper: '上質90kg',
      colors: 'フルカラー片面(4/0)',
      finishing: '角丸',
      leadTime: '通常(7営業日)',
      quantity: 500,
    },
    entries: [
      ['佐藤', '2024/10/02', '社員名刺'],
      ['山本', '2025/07/21', '社員名刺・増員分'],
      ['伊藤', '2026/05/19', '社員名刺'],
    ],
  },
  {
    spec: {
      customer: '株式会社グリーン企画',
      productType: 'パンフレット',
      size: 'A4仕上げ 8P',
      paper: 'コート135kg',
      colors: 'フルカラー両面(4/4)',
      finishing: '折り加工',
      leadTime: '通常(7営業日)',
      quantity: 1500,
    },
    entries: [
      ['田中', '2024/12/03', '会社案内'],
      ['鈴木', '2025/08/12', '会社案内・改訂'],
      ['高橋', '2026/02/24', '会社案内'],
    ],
  },
  {
    spec: {
      customer: '東都不動産株式会社',
      productType: 'チラシ',
      size: 'A3',
      paper: 'コート110kg',
      colors: 'フルカラー両面(4/4)',
      finishing: '折り加工',
      leadTime: '通常(7営業日)',
      quantity: 4000,
    },
    entries: [
      ['鈴木', '2024/06/28', '物件チラシ'],
      ['田中', '2025/01/30', '物件チラシ'],
      ['佐藤', '2025/09/02', '物件チラシ'],
      ['伊藤', '2026/04/22', '物件チラシ'],
    ],
  },
  {
    spec: {
      customer: '東都不動産株式会社',
      productType: 'ポスター',
      size: 'A1',
      paper: 'アート180kg',
      colors: 'フルカラー片面(4/0)',
      finishing: 'PP加工',
      leadTime: '通常(7営業日)',
      quantity: 300,
    },
    entries: [
      ['山本', '2025/03/26', '店頭掲示'],
      ['高橋', '2025/12/09', '店頭掲示'],
    ],
  },
  {
    spec: {
      customer: '東京フード株式会社',
      productType: 'ポスター',
      size: 'B2',
      paper: 'アート180kg',
      colors: 'フルカラー片面(4/0)',
      finishing: 'PP加工',
      leadTime: '通常(7営業日)',
      quantity: 400,
    },
    entries: [
      ['佐藤', '2025/05/07', '店頭POP'],
      ['田中', '2026/06/11', '店頭POP'],
    ],
  },
  {
    spec: {
      customer: '日本メディア印刷株式会社',
      productType: 'DMはがき',
      size: '100×148mm',
      paper: '上質90kg',
      colors: 'フルカラー片面(4/0)',
      finishing: 'なし',
      leadTime: '短納期(3営業日)',
      quantity: 5000,
    },
    entries: [
      ['伊藤', '2024/10/25', '定期DM・短納期'],
      ['山本', '2026/01/08', '定期DM'],
    ],
  },
];

function buildEstimates() {
  const rng = mulberry32(20260629);
  const records = [];
  let n = 0;
  JOBS.forEach((job) => {
    job.entries.forEach((e) => {
      const staff = e[0];
      const date = e[1];
      const note = e[2];
      const p = STAFF_PARAMS[staff];
      const spec = job.spec;
      const standard = computeStandardPrice(spec);
      const mult = p.mult + (rng() * 2 - 1) * p.varc;
      const quoted = Math.max(1000, Math.round((standard * mult) / 1000) * 1000);
      const cost = Math.round((standard * p.costRate) / 1000) * 1000;
      const margin = (quoted - cost) / quoted;
      const diff = quoted / standard - 1;
      const winProb = Math.min(0.95, Math.max(0.05, p.win - diff * 2.4));
      const result = rng() < winProb ? '受注' : '失注';
      n += 1;
      records.push({
        id: 'EST-' + String(1000 + n),
        date,
        customer: spec.customer,
        staff,
        productType: spec.productType,
        size: spec.size,
        paper: spec.paper,
        colors: spec.colors,
        quantity: spec.quantity,
        finishing: spec.finishing,
        leadTime: spec.leadTime,
        cost,
        quoted,
        standard,
        margin,
        diffPct: diff * 100,
        result,
        note,
      });
    });
  });
  records.sort((a, b) => (a.date < b.date ? 1 : -1));
  return records;
}

const ESTIMATES = buildEstimates();

/* ============================================================
 * 集計・分析ロジック
 * ========================================================== */
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) * (x - m))));
}

function staffStats() {
  return STAFF.map((staff) => {
    const recs = ESTIMATES.filter((r) => r.staff === staff);
    const diffs = recs.map((r) => r.diffPct);
    const wins = recs.filter((r) => r.result === '受注').length;
    return {
      staff,
      count: recs.length,
      avgQuoted: mean(recs.map((r) => r.quoted)),
      avgDiff: mean(diffs),
      avgMargin: mean(recs.map((r) => r.margin)) * 100,
      winRate: recs.length ? (wins / recs.length) * 100 : 0,
      variability: stddev(diffs),
    };
  });
}

const STAFF_STATS = staffStats();

function diffClass(d) {
  if (d > 2.5) return 'high';
  if (d < -2.5) return 'low';
  return 'mid';
}
function variabilityLevel(v) {
  if (v <= 3) return { key: 'low', label: '小' };
  if (v <= 6) return { key: 'mid', label: '中' };
  return { key: 'high', label: '大' };
}

/* 担当者向けAIコメント生成 */
function staffComment(s) {
  const d = s.avgDiff;
  const av = Math.abs(d);
  let head;
  if (d > 2)
    head = `${s.staff}担当の見積は標準価格より平均${av.toFixed(1)}%高く提示する傾向があります。`;
  else if (d < -2)
    head = `${s.staff}担当の見積は標準価格より平均${av.toFixed(1)}%低く提示する傾向があります。`;
  else
    head = `${s.staff}担当の見積は標準価格にほぼ沿った水準（平均${d >= 0 ? '+' : ''}${d.toFixed(
      1
    )}%）で安定しています。`;

  const parts = [];
  if (s.winRate >= 75) parts.push(`受注率は${s.winRate.toFixed(0)}%と高水準です`);
  else if (s.winRate < 55) parts.push(`受注率は${s.winRate.toFixed(0)}%とやや低めです`);
  else parts.push(`受注率は${s.winRate.toFixed(0)}%です`);

  if (s.avgMargin < 26) parts.push(`粗利率が${s.avgMargin.toFixed(1)}%と低下傾向にあります`);
  else parts.push(`平均粗利率は${s.avgMargin.toFixed(1)}%です`);

  let tail = '';
  if (d > 6)
    tail =
      '高単価案件では利益確保に貢献していますが、標準価格との差が大きいため、上長確認の対象とすることを推奨します。';
  else if (d < -4)
    tail = '標準価格を下回る見積については、値引き理由の記録を推奨します。';
  else if (s.variability > 6)
    tail =
      '案件ごとの価格差が大きく、見積基準のばらつきが見られます。標準価格を起点とした提示を推奨します。';
  else tail = '標準価格を起点とした提示が定着しており、基準として参照しやすい傾向です。';

  return `${head}${parts.join('、')}。${tail}`;
}

/* 類似度スコア（0-99%） */
function similarity(q, r) {
  if (r.productType !== q.productType) return 0;
  let score = 40;
  if (r.size === q.size) score += 18;
  if (r.colors === q.colors) score += 16;
  if (r.finishing === q.finishing) score += 12;
  else if (r.finishing !== 'なし' && q.finishing !== 'なし') score += 5;
  const ratio = Math.min(q.quantity, r.quantity) / Math.max(q.quantity, r.quantity);
  score += Math.round(ratio * 14);
  return Math.min(99, score);
}

function findSimilar(q, minScore) {
  return ESTIMATES.map((r) => ({ rec: r, score: similarity(q, r) }))
    .filter((x) => x.score >= (minScore || 55))
    .sort((a, b) => b.score - a.score);
}

/* 見積シミュレーションの推奨価格算定 */
function analyze(query) {
  const standard = computeStandardPrice(query);
  const similar = findSimilar(query, 55);
  const similarWon = similar.filter((x) => x.rec.result === '受注');
  const simBase = (similarWon.length ? similarWon : similar).map(
    (x) => x.rec.quoted / x.rec.standard
  );
  const similarRatio = simBase.length ? median(simBase) : 1.0;
  const similarMedianPrice = Math.round((standard * similarRatio) / 1000) * 1000;

  const custRecs = ESTIMATES.filter((r) => r.customer === query.customer);
  const custWon = custRecs.filter((r) => r.result === '受注');
  const custBase = (custWon.length ? custWon : custRecs).map((r) => r.quoted / r.standard);
  const hasCust = custBase.length > 0;
  const custRatio = hasCust ? median(custBase) : 1.0;
  const custMedianPrice = Math.round((standard * custRatio) / 1000) * 1000;

  const sp = STAFF_PARAMS[query.staff] || STAFF_PARAMS['山本'];
  let recRatio =
    0.4 * 1.0 + 0.22 * similarRatio + 0.18 * custRatio + 0.2 * sp.mult;
  recRatio = Math.min(1.15, Math.max(0.9, recRatio));

  const recommended = Math.round((standard * recRatio) / 1000) * 1000;
  const low = Math.round((standard * (recRatio - 0.05)) / 1000) * 1000;
  const high = Math.round((standard * (recRatio + 0.06)) / 1000) * 1000;
  const cost = Math.round((standard * 0.71) / 1000) * 1000;
  const recMargin = ((recommended - cost) / recommended) * 100;

  const vsStandard = (recommended / standard - 1) * 100;
  const vsCustomer = hasCust ? (recommended / custMedianPrice - 1) * 100 : 0;

  return {
    query,
    standard,
    recommended,
    low,
    high,
    recMargin,
    markup10: Math.round((recommended * 1.1) / 1000) * 1000,
    markup15: Math.round((recommended * 1.15) / 1000) * 1000,
    markup20: Math.round((recommended * 1.2) / 1000) * 1000,
    similarCount: similar.length,
    similarMedianPrice,
    custMedianPrice,
    hasCust,
    vsStandard,
    vsCustomer,
    similar,
    staffStat: STAFF_STATS.find((s) => s.staff === query.staff),
  };
}

/* シミュレーションAIコメント */
function simComments(res) {
  const c1 =
    `過去の類似案件${res.similarCount}件を確認した結果、同条件に近い案件の中央値は` +
    `${yen(res.similarMedianPrice)}です。` +
    (res.hasCust
      ? `同顧客（${res.query.customer}）の過去見積では${yen(
          res.custMedianPrice
        )}前後で受注しているため、今回の推奨提示価格は${yen(res.recommended)}です。`
      : `同顧客の過去実績が少ないため、標準価格を起点に推奨提示価格を${yen(
          res.recommended
        )}としています。`);

  const st = res.staffStat;
  let tendency = '標準価格に沿った';
  if (st && st.avgDiff > 4) tendency = '標準価格よりやや高めに';
  else if (st && st.avgDiff < -3) tendency = '標準価格よりやや低めに';
  const c2 =
    `選択した${res.query.staff}担当は、${tendency}提示する傾向があります` +
    (st ? `（平均${st.avgDiff >= 0 ? '+' : ''}${st.avgDiff.toFixed(1)}%・受注率${st.winRate.toFixed(
      0
    )}%）` : '') +
    `。標準価格との差が10%を超える場合は、上長確認を推奨します。`;
  return [c1, c2];
}

/* 価格ばらつきアラート */
function priceAlerts(res) {
  const alerts = [];
  if (res.vsStandard >= 10)
    alerts.push({
      type: 'danger',
      text: `推奨提示価格が標準価格より${res.vsStandard.toFixed(
        1
      )}%高くなっています。標準価格より高めです。上長確認を推奨します。`,
    });
  else if (res.vsStandard <= -10)
    alerts.push({
      type: 'warn',
      text: `推奨提示価格が標準価格を${Math.abs(res.vsStandard).toFixed(
        1
      )}%下回っています。粗利率低下に注意してください。`,
    });

  if (res.hasCust && res.vsCustomer >= 15)
    alerts.push({
      type: 'danger',
      text: `同顧客の過去受注価格より${res.vsCustomer.toFixed(
        1
      )}%高いため、失注リスクがあります。`,
    });
  else if (res.hasCust && Math.abs(res.vsCustomer) <= 6)
    alerts.push({
      type: 'ok',
      text: `同顧客の過去受注価格帯（${yen(
        res.custMedianPrice
      )}前後）に近く、妥当性が高い見積です。`,
    });

  const st = res.staffStat;
  if (st && st.avgDiff > 8)
    alerts.push({
      type: 'warn',
      text: `選択担当者（${st.staff}）は標準価格より平均+${st.avgDiff.toFixed(
        1
      )}%と高めの傾向です。差が大きくなる場合は上長確認を推奨します。`,
    });

  if (!alerts.length)
    alerts.push({
      type: 'ok',
      text: '標準価格・過去実績ともに大きな乖離はなく、妥当性の高い見積です。',
    });
  return alerts;
}

/* 顧客サマリー */
function customerSummary(customer) {
  const recs = ESTIMATES.filter((r) => r.customer === customer);
  const wins = recs.filter((r) => r.result === '受注').length;
  const typeCount = {};
  recs.forEach((r) => {
    typeCount[r.productType] = (typeCount[r.productType] || 0) + 1;
  });
  let topType = '-';
  let topN = 0;
  Object.keys(typeCount).forEach((k) => {
    if (typeCount[k] > topN) {
      topN = typeCount[k];
      topType = k;
    }
  });
  const avgDiff = mean(recs.map((r) => r.diffPct));
  let trend;
  if (avgDiff > 3) trend = '標準価格より高めの提示が多い';
  else if (avgDiff < -3) trend = '標準価格より低めの提示が多い';
  else trend = '標準価格に近い水準で安定';
  return {
    recs,
    count: recs.length,
    avgQuoted: mean(recs.map((r) => r.quoted)),
    avgMargin: mean(recs.map((r) => r.margin)) * 100,
    winRate: recs.length ? (wins / recs.length) * 100 : 0,
    topType,
    avgDiff,
    trend,
  };
}

function customerComment(customer) {
  const s = customerSummary(customer);
  const won = s.recs.filter((r) => r.result === '受注');
  const band = won.length ? median(won.map((r) => r.quoted)) : s.avgQuoted;
  let risk = '';
  if (s.avgDiff > 3)
    risk =
      '標準価格より大幅に高い提示では失注しているケースが見られるため、今回も標準価格+5%以内での提示を推奨します。';
  else if (s.avgDiff < -3)
    risk =
      '低めの価格で受注している一方、粗利率が圧迫されやすいため、値引き理由の記録を推奨します。';
  else
    risk = '標準価格に近い水準での提示が定着しており、同水準での提示が妥当です。';
  return (
    `${customer}は、過去の同種案件で${yen(
      band
    )}前後の価格帯で受注している傾向があります。${risk}`
  );
}

/* ============================================================
 * フォーマッタ
 * ========================================================== */
function yen(n) {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}
function signedPct(n, d) {
  const dd = d === undefined ? 1 : d;
  return (n >= 0 ? '+' : '') + n.toFixed(dd) + '%';
}
function plainPct(n, d) {
  const dd = d === undefined ? 1 : d;
  return n.toFixed(dd) + '%';
}
function specLine(spec) {
  return `${spec.size}／${spec.paper}／${spec.colors}／${spec.quantity.toLocaleString(
    'ja-JP'
  )}部／${spec.finishing}`;
}

/* ============================================================
 * 共通UIパーツ
 * ========================================================== */
function DiffBadge(props) {
  const cls = diffClass(props.value);
  const arrow = props.value > 0.05 ? '▲' : props.value < -0.05 ? '▼' : '－';
  return (
    <span className={'diff ' + cls}>
      {arrow} {signedPct(props.value)}
    </span>
  );
}

function ResultBadge(props) {
  return props.result === '受注' ? (
    <span className="badge win">● 受注</span>
  ) : (
    <span className="badge lose">× 失注</span>
  );
}

function AiNote(props) {
  return (
    <div className="ai-note">
      <div className="ai-avatar">AI</div>
      <div className="ai-note-body">
        <div className="ai-title">{props.title || 'AI価格妥当性コメント'}</div>
        {props.lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </div>
  );
}

function Alert(props) {
  const icon =
    props.type === 'danger' ? '!' : props.type === 'warn' ? '⚠' : '✓';
  return (
    <div className={'alert ' + props.type}>
      <span className="a-icon">{icon}</span>
      <span>{props.text}</span>
    </div>
  );
}

function ValueProps() {
  return (
    <div className="value-grid">
      <div className="value-block">
        <h4>📥 既存システムを変えずに開始</h4>
        <p>
          PrintSapiensから抽出したExcel/CSVデータを活用し、過去見積・担当者別傾向・同顧客の価格履歴を分析します。直接連携を行わないため、既存システムを変更せずにスモールスタートできます。
        </p>
      </div>
      <div className="value-block">
        <h4>🧭 最終判断は営業担当者</h4>
        <p>
          AIが価格を自動決定するのではなく、過去実績に基づく標準価格と推奨価格を提示し、最終判断は営業担当者が行う設計です。
        </p>
      </div>
      <div className="value-block">
        <h4>📊 属人化の解消</h4>
        <p>
          担当者ごとの価格差を可視化することで、見積業務の標準化と属人化解消を支援します。価格のばらつきを抑え、提示価格の根拠を明確にします。
        </p>
      </div>
    </div>
  );
}

/* ============================================================
 * 1. ダッシュボード
 * ========================================================== */
function Dashboard() {
  return (
    <div className="page">
      <div className="page-head">
        <h2>📊 ダッシュボード</h2>
        <p>
          PrintSapiensから抽出した見積データをもとに、全社の見積状況と担当者別の価格傾向を可視化します。
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi accent-navy">
          <div className="kpi-label">年間見積件数</div>
          <div className="kpi-value">
            5,400<small>件</small>
          </div>
          <div className="kpi-foot">営業担当6名の合計</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">営業担当者数</div>
          <div className="kpi-value">
            6<small>名</small>
          </div>
          <div className="kpi-foot">価格傾向を個別に分析</div>
        </div>
        <div className="kpi accent-amber">
          <div className="kpi-label">平均価格差</div>
          <div className="kpi-value">±8.7<small>%</small></div>
          <div className="kpi-foot">標準価格との乖離幅</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">分析対象データ</div>
          <div className="kpi-value">
            25<small>年分</small>
          </div>
          <div className="kpi-foot">蓄積された過去見積</div>
        </div>
        <div className="kpi accent-green">
          <div className="kpi-label">標準化による削減見込み</div>
          <div className="kpi-value">
            45<small>時間/月</small>
          </div>
          <div className="kpi-foot">見積作成業務の削減</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-head">
          <h3>👥 担当者別 価格傾向</h3>
          <span className="sub">標準価格との差分・受注率・粗利率（架空データ集計）</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>担当者</th>
                <th className="num">見積件数</th>
                <th className="num">平均提示価格</th>
                <th>標準価格との差分</th>
                <th className="num">平均粗利率</th>
                <th className="num">受注率</th>
                <th>傾向コメント</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_STATS.map((s) => (
                <tr key={s.staff}>
                  <td className="staff-name">{s.staff}</td>
                  <td className="num">{s.count}件</td>
                  <td className="num">{yen(s.avgQuoted)}</td>
                  <td>
                    <DiffBadge value={s.avgDiff} />
                  </td>
                  <td className="num">{plainPct(s.avgMargin)}</td>
                  <td className="num">{plainPct(s.winRate, 0)}</td>
                  <td className="spec-text">{shortTrend(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="callout" style={{ marginBottom: 22 }}>
        <span className="c-icon">i</span>
        <span>
          <b>このデモで伝えたい価値：</b>
          PrintSapiensを今すぐ改修しなくても、Excel/CSV抽出データを使って小さく始められます。担当者ごとの価格差を可視化し、標準価格と推奨価格を提示することで、見積業務の標準化と属人化解消を支援します。費用対効果を代表者へ説明しやすい形で可視化します。
        </span>
      </div>

      <ValueProps />
    </div>
  );
}

function shortTrend(s) {
  if (s.avgDiff > 6) return '高め提示が多く、失注率がやや高い';
  if (s.avgDiff > 2) return 'やや高めの提示傾向';
  if (s.avgDiff < -4) return '低め提示・受注率が高い';
  if (s.avgDiff < -2) return 'やや低めの提示傾向';
  if (s.variability > 6) return '案件ごとの価格差が大きい';
  if (s.avgMargin < 26) return '標準的だが粗利率は低め';
  return '標準価格に近く安定';
}

/* ============================================================
 * 2. 担当者別 価格分析
 * ========================================================== */
function StaffAnalysis() {
  return (
    <div className="page">
      <div className="page-head">
        <h2>🧭 担当者別 価格分析</h2>
        <p>担当者ごとの価格傾向・ばらつき度をAIコメントとあわせて確認できます。</p>
      </div>

      <div className="stack">
        {STAFF_STATS.map((s) => {
          const vl = variabilityLevel(s.variability);
          return (
            <div className="panel" key={s.staff}>
              <div className="panel-head">
                <h3>
                  <span className="brand-mark" style={{ width: 26, height: 26, fontSize: 12 }}>
                    {s.staff[0]}
                  </span>
                  {s.staff}担当
                </h3>
                <span className="sub">{s.count}件の見積を分析</span>
              </div>
              <div className="panel-body">
                <div className="mini-grid" style={{ marginBottom: 16 }}>
                  <div className="mini">
                    <div className="mi-label">平均提示価格</div>
                    <div className="mi-value">{yen(s.avgQuoted)}</div>
                  </div>
                  <div className="mini">
                    <div className="mi-label">標準価格との差分</div>
                    <div className="mi-value">
                      <DiffBadge value={s.avgDiff} />
                    </div>
                  </div>
                  <div className="mini">
                    <div className="mi-label">受注率</div>
                    <div className="mi-value">{plainPct(s.winRate, 0)}</div>
                  </div>
                  <div className="mini">
                    <div className="mi-label">平均粗利率</div>
                    <div className="mi-value">{plainPct(s.avgMargin)}</div>
                  </div>
                </div>

                <div className="section-label">
                  価格のばらつき度
                  <span className={'var-label ' + vl.key}>
                    {vl.label}（標準偏差 {s.variability.toFixed(1)}pt）
                  </span>
                </div>
                <div className="bar" style={{ maxWidth: 320, marginBottom: 16 }}>
                  <span
                    style={{
                      width: Math.min(100, s.variability * 10) + '%',
                      background:
                        vl.key === 'high'
                          ? 'var(--red-600)'
                          : vl.key === 'mid'
                          ? 'var(--amber-600)'
                          : 'var(--green-600)',
                    }}
                  />
                </div>

                <AiNote title="AIコメント" lines={[staffComment(s)]} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * 3. 見積シミュレーション
 * ========================================================== */
function Simulation(props) {
  const form = props.form;
  const setForm = props.setForm;
  const result = props.result;

  function update(key, value) {
    setForm((prev) => {
      const next = Object.assign({}, prev, { [key]: value });
      if (key === 'productType') {
        next.size = SIZE_OPTIONS[value][0];
      }
      return next;
    });
  }

  function run() {
    props.onAnalyze();
  }

  const comments = result ? simComments(result) : [];
  const alerts = result ? priceAlerts(result) : [];

  return (
    <div className="page">
      <div className="page-head">
        <h2>🧮 見積シミュレーション</h2>
        <p>
          条件を入力して「分析する」を押すと、標準価格・推奨提示価格・価格ばらつきアラート・AIコメントを表示します。
        </p>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <h3>📝 見積条件の入力</h3>
          <span className="sub">PrintSapiens抽出データと照合します</span>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="field">
              <label>顧客名</label>
              <select value={form.customer} onChange={(e) => update('customer', e.target.value)}>
                {CUSTOMERS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>商品種別</label>
              <select
                value={form.productType}
                onChange={(e) => update('productType', e.target.value)}
              >
                {PRODUCT_TYPES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>サイズ</label>
              <select value={form.size} onChange={(e) => update('size', e.target.value)}>
                {SIZE_OPTIONS[form.productType].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>用紙</label>
              <select value={form.paper} onChange={(e) => update('paper', e.target.value)}>
                {PAPER_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>色数</label>
              <select value={form.colors} onChange={(e) => update('colors', e.target.value)}>
                {COLOR_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>部数</label>
              <input
                type="number"
                min="100"
                step="100"
                value={form.quantity}
                onChange={(e) => update('quantity', Math.max(100, Number(e.target.value) || 0))}
              />
            </div>
            <div className="field">
              <label>加工</label>
              <select value={form.finishing} onChange={(e) => update('finishing', e.target.value)}>
                {FINISH_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>納期</label>
              <select value={form.leadTime} onChange={(e) => update('leadTime', e.target.value)}>
                {LEAD_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>担当者</label>
              <select value={form.staff} onChange={(e) => update('staff', e.target.value)}>
                {STAFF.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={run}>
              ⚡ 分析する
            </button>
            <span className="spec-text">
              入力条件と過去の類似案件・同顧客実績をAIが照合します
            </span>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="panel">
          <div className="empty">
            <span className="e-icon">🧮</span>
            条件を入力して「分析する」を押してください。
          </div>
        </div>
      ) : (
        <div className="stack">
          {/* アラート */}
          <div className="panel">
            <div className="panel-head">
              <h3>🚦 価格ばらつきアラート</h3>
              <span className="sub">標準価格・同顧客実績との乖離をチェック</span>
            </div>
            <div className="panel-body">
              {alerts.map((a, i) => (
                <Alert key={i} type={a.type} text={a.text} />
              ))}
            </div>
          </div>

          {/* 推奨価格 */}
          <div className="panel">
            <div className="panel-head">
              <h3>💰 AI推奨価格</h3>
              <span className="sub">
                {result.query.productType}／{specLine(result.query)}
              </span>
            </div>
            <div className="panel-body">
              <div className="price-grid">
                <div className="price-card hero">
                  <div>
                    <div className="pc-label">推奨提示価格</div>
                    <div className="pc-value">{yen(result.recommended)}</div>
                    <div className="pc-sub">
                      標準価格との差 {signedPct(result.vsStandard)}／推奨粗利率{' '}
                      {plainPct(result.recMargin)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="pc-label">価格レンジ</div>
                    <div className="pc-sub" style={{ fontSize: 14, marginTop: 6 }}>
                      低め {yen(result.low)} 〜 高め {yen(result.high)}
                    </div>
                  </div>
                </div>

                <div className="price-card">
                  <div className="pc-label">標準価格</div>
                  <div className="pc-value">{yen(result.standard)}</div>
                  <div className="pc-sub">過去実績に基づく基準値</div>
                </div>
                <div className="price-card">
                  <div className="pc-label">低め価格</div>
                  <div className="pc-value">{yen(result.low)}</div>
                  <div className="pc-sub">受注率重視のライン</div>
                </div>
                <div className="price-card">
                  <div className="pc-label">高め価格</div>
                  <div className="pc-value">{yen(result.high)}</div>
                  <div className="pc-sub">利益確保重視のライン</div>
                </div>
              </div>

              <div className="section-label" style={{ marginTop: 18 }}>
                営業経費を上乗せした提示価格
              </div>
              <div className="markup-grid">
                <div className="markup">
                  <div className="m-label">営業経費 +10%</div>
                  <div className="m-value">{yen(result.markup10)}</div>
                </div>
                <div className="markup">
                  <div className="m-label">営業経費 +15%</div>
                  <div className="m-value">{yen(result.markup15)}</div>
                </div>
                <div className="markup">
                  <div className="m-label">営業経費 +20%</div>
                  <div className="m-value">{yen(result.markup20)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* AIコメント */}
          <div className="panel">
            <div className="panel-head">
              <h3>🤖 AIコメント</h3>
              <span className="sub">過去実績に基づく価格妥当性の説明</span>
            </div>
            <div className="panel-body">
              <AiNote lines={comments} />
            </div>
          </div>

          <div className="callout">
            <span className="c-icon">i</span>
            <span>
              同顧客の過去見積は「<b>同顧客の過去見積</b>」タブ、入力条件に近い案件は「
              <b>類似案件検索</b>」タブで確認できます。AIは価格を自動決定せず、最終判断は営業担当者が行います。
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * 4. 同顧客の過去見積
 * ========================================================== */
function CustomerHistory(props) {
  const [customer, setCustomer] = useState(props.defaultCustomer || CUSTOMERS[0]);

  useEffect(() => {
    if (props.defaultCustomer) setCustomer(props.defaultCustomer);
  }, [props.defaultCustomer]);

  const s = customerSummary(customer);
  const recs = [...s.recs].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="page">
      <div className="page-head">
        <h2>🏢 同顧客の過去見積</h2>
        <p>選択した顧客の過去見積一覧と価格傾向を表示します。</p>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <div className="field" style={{ minWidth: 280 }}>
            <label>顧客名</label>
            <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
              {CUSTOMERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <h3>📌 価格傾向サマリー</h3>
          <span className="sub">{customer}</span>
        </div>
        <div className="panel-body">
          <div className="mini-grid">
            <div className="mini">
              <div className="mi-label">過去見積件数</div>
              <div className="mi-value">{s.count}件</div>
            </div>
            <div className="mini">
              <div className="mi-label">平均提示価格</div>
              <div className="mi-value">{yen(s.avgQuoted)}</div>
            </div>
            <div className="mini">
              <div className="mi-label">平均粗利率</div>
              <div className="mi-value">{plainPct(s.avgMargin)}</div>
            </div>
            <div className="mini">
              <div className="mi-label">受注率</div>
              <div className="mi-value">{plainPct(s.winRate, 0)}</div>
            </div>
          </div>
          <div className="mini-grid" style={{ marginTop: 12 }}>
            <div className="mini">
              <div className="mi-label">よく出る商品種別</div>
              <div className="mi-value" style={{ fontSize: 15 }}>
                {s.topType}
              </div>
            </div>
            <div className="mini" style={{ gridColumn: 'span 3' }}>
              <div className="mi-label">価格傾向</div>
              <div className="mi-value" style={{ fontSize: 15 }}>
                {s.trend}（標準比 {signedPct(s.avgDiff)}）
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <AiNote lines={[customerComment(customer)]} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>📄 過去見積一覧</h3>
          <span className="sub">{recs.length}件</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>見積日</th>
                <th>商品種別</th>
                <th>仕様</th>
                <th>担当者</th>
                <th className="num">標準価格</th>
                <th className="num">提示価格</th>
                <th>標準価格との差分</th>
                <th className="num">粗利率</th>
                <th>受注結果</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.productType}</td>
                  <td className="spec-text">
                    {r.size}／{r.colors}／{r.quantity.toLocaleString('ja-JP')}部／{r.finishing}
                  </td>
                  <td className="staff-name">{r.staff}</td>
                  <td className="num">{yen(r.standard)}</td>
                  <td className="num">{yen(r.quoted)}</td>
                  <td>
                    <DiffBadge value={r.diffPct} />
                  </td>
                  <td className="num">{plainPct(r.margin * 100)}</td>
                  <td>
                    <ResultBadge result={r.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 5. 類似案件検索
 * ========================================================== */
function SimilarCases(props) {
  const result = props.result;
  if (!result) {
    return (
      <div className="page">
        <div className="page-head">
          <h2>🔍 類似案件検索</h2>
          <p>入力した仕様に近い過去見積を一覧表示します。</p>
        </div>
        <div className="panel">
          <div className="empty">
            <span className="e-icon">🔍</span>
            先に「見積シミュレーション」タブで条件を分析してください。
          </div>
        </div>
      </div>
    );
  }
  const q = result.query;
  const list = result.similar;

  return (
    <div className="page">
      <div className="page-head">
        <h2>🔍 類似案件検索</h2>
        <p>
          検索条件：{q.productType}／{specLine(q)}（{q.customer}）
        </p>
      </div>

      <div className="callout" style={{ marginBottom: 18 }}>
        <span className="c-icon">i</span>
        <span>
          商品種別・サイズ・色数・部数・加工の近さから類似度を算出しています。類似度の高い案件ほど、推奨価格の根拠として参照されています。
        </span>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>📋 類似案件一覧</h3>
          <span className="sub">{list.length}件が該当</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>類似度</th>
                <th>見積日</th>
                <th>顧客名</th>
                <th>商品種別</th>
                <th>仕様</th>
                <th>担当者</th>
                <th className="num">提示価格</th>
                <th>受注結果</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.rec.id}>
                  <td>
                    <div className="var-meter">
                      <span className="sim-pct">{x.score}%</span>
                      <div className="bar" style={{ width: 60 }}>
                        <span style={{ width: x.score + '%' }} />
                      </div>
                    </div>
                  </td>
                  <td>{x.rec.date}</td>
                  <td>{x.rec.customer}</td>
                  <td>{x.rec.productType}</td>
                  <td className="spec-text">
                    {x.rec.size}／{x.rec.colors}／{x.rec.quantity.toLocaleString('ja-JP')}部／
                    {x.rec.finishing}
                  </td>
                  <td className="staff-name">{x.rec.staff}</td>
                  <td className="num">{yen(x.rec.quoted)}</td>
                  <td>
                    <ResultBadge result={x.rec.result} />
                  </td>
                  <td className="spec-text">{x.rec.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * アプリ本体
 * ========================================================== */
const TABS = [
  { key: 'dashboard', label: 'ダッシュボード' },
  { key: 'staff', label: '担当者別分析' },
  { key: 'sim', label: '見積シミュレーション' },
  { key: 'customer', label: '同顧客の過去見積' },
  { key: 'similar', label: '類似案件検索' },
];

const DEFAULT_FORM = {
  customer: '株式会社サンプル商事',
  productType: 'パンフレット',
  size: 'A4仕上げ 12P',
  paper: 'マットコート135kg',
  colors: 'フルカラー両面(4/4)',
  quantity: 3000,
  finishing: '折り加工',
  leadTime: '通常(7営業日)',
  staff: '田中',
};

function App() {
  const [tab, setTab] = useState('dashboard');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);

  // 初回に既定条件で分析しておく（タブ4・5を即座に確認できるように）
  useEffect(() => {
    setResult(analyze(DEFAULT_FORM));
  }, []);

  function onAnalyze() {
    setResult(analyze(form));
  }

  return (
    <React.Fragment>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-mark">AI</div>
            <div className="brand-text">
              <h1>AI見積分析アシスタント</h1>
              <p>印刷業向け 見積標準化支援システム ｜ PrintSapiens CSV/Excel 連携デモ</p>
            </div>
          </div>
          <div className="header-meta">
            <span className="pill">
              <span className="dot" />
              架空データ稼働中
            </span>
            <span className="pill">分析対象 25年分</span>
            <span className="pill">担当 6名</span>
          </div>
        </div>
      </header>

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              className={'tab' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
            >
              <span className="tab-no">{i + 1}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'staff' && <StaffAnalysis />}
        {tab === 'sim' && (
          <Simulation form={form} setForm={setForm} result={result} onAnalyze={onAnalyze} />
        )}
        {tab === 'customer' && (
          <CustomerHistory defaultCustomer={result ? result.query.customer : DEFAULT_FORM.customer} />
        )}
        {tab === 'similar' && <SimilarCases result={result} />}
      </main>

      <footer className="app-footer">
        本デモはすべて架空データを使用しています。実在する顧客名・社名・案件情報は含まれていません。｜
        AI見積分析アシスタント（デモ環境）
      </footer>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
