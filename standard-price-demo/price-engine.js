/*
 * price-engine.js — 管理画面（admin.html）のマスタデータを見積画面に反映するオーバーレイ
 *
 * app.js（ビルド済みバンドル）は無改変のまま、以下を行います。
 *   1. 管理画面で追加・修正したプルダウン選択肢を、見積条件入力の各セレクトボックスに反映する
 *   2. 管理画面で追加・修正した標準基準価格（単価マスタ）を使って、見積画面の算出結果
 *      （標準ベース価格・営業経費込み価格・価格レンジ・想定原価・粗利率・判断補助コメント）を
 *      再計算し、表示を上書きする
 *
 * 計算式は app.js 内の実際の計算ロジック（標準基準価格 × サイズ係数 × 用紙係数 × 色数係数 ×
 * 部数係数 × 加工係数 × 納期係数 → 営業経費込み価格 / 想定原価 / 粗利率）を踏襲しています。
 * 標準基準価格（印刷物種別ごと）のみ管理画面で編集可能。各係数は固定値です。
 * 管理画面で新たに追加した選択肢（サイズ・用紙・色数・部数・加工・納期）は係数 ×1.0 として
 * 計算されます（app.js 本体の未知キーに対するフォールバックと同じ挙動）。
 *
 * React が管理する DOM に対して、末尾への選択肢追加・表示の再上書きを継続的に行う方式は
 * customize.js / past-list.js と同じ手法です。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'standard-price-demo:admin-master:v1';

  /* ─── 見積条件のプルダウン一覧（表示ラベル文言 → マスタのキー） ───────── */
  var CATEGORIES = [
    { key: 'printType', label: '印刷物種別' },
    { key: 'size', label: 'サイズ' },
    { key: 'paper', label: '用紙' },
    { key: 'color', label: '色数' },
    { key: 'quantity', label: '部数' },
    { key: 'process', label: '加工' },
    { key: 'delivery', label: '希望納期' },
    { key: 'expenseRate', label: '営業経費率' }
  ];

  /* ─── app.js 本体と同じ係数（固定値。標準基準価格のみ管理画面で編集可能） ── */
  var SIZE_MULT = { A4: 1, A3: 1.4, B5: 0.85, B4: 1.25, 名刺サイズ: 0.3 };
  var PAPER_MULT = { 上質紙: 0.9, コート紙: 1, マットコート紙: 1.05, 特殊紙: 1.35 };
  var COLOR_MULT = { 片面1色: 0.6, 片面4色: 0.85, 両面4色: 1 };
  var QUANTITY_MULT = { 500: 1.8, 1000: 1.4, 3000: 1, 5000: 0.85, 10000: 0.72 };
  var PROCESS_MULT = { なし: 1, 折り: 1.1, PP加工: 1.18, 中綴じ: 1.22, 断裁: 1.08 };
  var DELIVERY_MULT = { 通常: 1, 短納期: 1.15, 特急: 1.35 };
  var COST_RATIO = 0.68;
  var ROUND_TO = 1000;
  var FALLBACK_BASE_PRICE = 100000;
  var PRICE_RANGE_RATE = 8;

  var DEFAULT_DATA = {
    pulldown: {
      printType: [
        { label: 'チラシ', value: 'チラシ' },
        { label: 'パンフレット', value: 'パンフレット' },
        { label: '名刺', value: '名刺' },
        { label: '封筒', value: '封筒' },
        { label: '冊子', value: '冊子' }
      ],
      size: [
        { label: 'A4', value: 'A4' },
        { label: 'A3', value: 'A3' },
        { label: 'B5', value: 'B5' },
        { label: 'B4', value: 'B4' },
        { label: '名刺サイズ', value: '名刺サイズ' }
      ],
      paper: [
        { label: '上質紙', value: '上質紙' },
        { label: 'コート紙', value: 'コート紙' },
        { label: 'マットコート紙', value: 'マットコート紙' },
        { label: '特殊紙', value: '特殊紙' }
      ],
      color: [
        { label: '片面1色', value: '片面1色' },
        { label: '片面4色', value: '片面4色' },
        { label: '両面4色', value: '両面4色' }
      ],
      quantity: [
        { label: '500部', value: 500 },
        { label: '1,000部', value: 1000 },
        { label: '3,000部', value: 3000 },
        { label: '5,000部', value: 5000 },
        { label: '10,000部', value: 10000 }
      ],
      process: [
        { label: 'なし', value: 'なし' },
        { label: '折り', value: '折り' },
        { label: 'PP加工', value: 'PP加工' },
        { label: '中綴じ', value: '中綴じ' },
        { label: '断裁', value: '断裁' }
      ],
      delivery: [
        { label: '通常', value: '通常' },
        { label: '短納期（+15%）', value: '短納期' },
        { label: '特急（+35%）', value: '特急' }
      ],
      expenseRate: [
        { label: '10%', value: 10 },
        { label: '15%', value: 15 },
        { label: '20%', value: 20 }
      ]
    },
    priceMaster: [
      { id: 'PT-001', name: 'チラシ', unitPrice: 150000 },
      { id: 'PT-002', name: 'パンフレット', unitPrice: 280000 },
      { id: 'PT-003', name: '名刺', unitPrice: 55000 },
      { id: 'PT-004', name: '封筒', unitPrice: 110000 },
      { id: 'PT-005', name: '冊子', unitPrice: 380000 }
    ]
  };

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_DATA;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.pulldown || !parsed.priceMaster) return DEFAULT_DATA;
      return parsed;
    } catch (e) {
      return DEFAULT_DATA;
    }
  }

  /* ─── DOM 探索ユーティリティ（past-list.js と同じ行スキャン方式） ───────── */
  function findRowValueCell(labelMatcher) {
    var trs = document.querySelectorAll('tr');
    for (var i = 0; i < trs.length; i++) {
      var tds = trs[i].querySelectorAll('td');
      if (tds.length < 2) continue;
      var label = (tds[0].textContent || '').trim();
      var matched = typeof labelMatcher === 'string' ? label === labelMatcher : labelMatcher(label);
      if (matched) return tds[1];
    }
    return null;
  }

  function findConditionSelect(label) {
    var cell = findRowValueCell(label);
    return cell ? cell.querySelector('select') : null;
  }

  /* ─── プルダウン選択肢の同期（既存の選択肢は保持し、末尾に追加・ラベルのみ更新） ── */
  function syncSelectOptions(select, options) {
    if (!select) return;
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      var strValue = String(opt.value);
      var existing = null;
      for (var j = 0; j < select.options.length; j++) {
        if (select.options[j].value === strValue) {
          existing = select.options[j];
          break;
        }
      }
      if (!existing) {
        var el = document.createElement('option');
        el.value = strValue;
        el.textContent = opt.label;
        select.appendChild(el);
      } else if (existing.textContent !== opt.label) {
        existing.textContent = opt.label;
      }
    }
  }

  function syncAllSelects(data) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      var category = CATEGORIES[i];
      var select = findConditionSelect(category.label);
      var options = data.pulldown[category.key];
      if (select && options) syncSelectOptions(select, options);
    }
  }

  /* ─── 見積条件の現在値を読み取る ─────────────────────────── */
  var NUMERIC_KEYS = { quantity: true, expenseRate: true };

  function readFormState(data) {
    var state = {};
    for (var i = 0; i < CATEGORIES.length; i++) {
      var category = CATEGORIES[i];
      var select = findConditionSelect(category.label);
      if (!select) continue;
      var raw = select.value;
      state[category.key] = NUMERIC_KEYS[category.key] ? Number(raw) : raw;
    }
    return state;
  }

  /* ─── 選択中の値を DOM に維持する（React の再描画による巻き戻りに対抗） ── */
  var lastUserState = {};

  function reapplySelections(data) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      var category = CATEGORIES[i];
      var select = findConditionSelect(category.label);
      if (!select) continue;
      var tracked = lastUserState[category.key];
      if (tracked === undefined) continue;
      var trackedStr = String(tracked);
      if (select.value !== trackedStr) {
        var hasOption = false;
        for (var j = 0; j < select.options.length; j++) {
          if (select.options[j].value === trackedStr) { hasOption = true; break; }
        }
        if (hasOption) select.value = trackedStr;
      }
    }
  }

  /* ─── 価格計算（app.js 本体と同じ計算式。標準基準価格のみマスタから取得） ── */
  function lookupMult(table, key) {
    return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : 1;
  }

  function roundTo(value, step) {
    return Math.round(value / step) * step;
  }

  function findBasePrice(data, printType) {
    var list = data.priceMaster || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === printType) return list[i].unitPrice;
    }
    return FALLBACK_BASE_PRICE;
  }

  function computePrice(data, state) {
    var m = findBasePrice(data, state.printType);
    var basePrice = roundTo(
      m *
        lookupMult(SIZE_MULT, state.size) *
        lookupMult(PAPER_MULT, state.paper) *
        lookupMult(COLOR_MULT, state.color) *
        lookupMult(QUANTITY_MULT, state.quantity) *
        lookupMult(PROCESS_MULT, state.process) *
        lookupMult(DELIVERY_MULT, state.delivery),
      ROUND_TO
    );
    var totalPrice = roundTo(basePrice * (1 + (state.expenseRate || 0) / 100), ROUND_TO);
    var estimatedCost = roundTo(basePrice * COST_RATIO, ROUND_TO);
    var grossMarginRate = totalPrice > 0 ? ((totalPrice - estimatedCost) / totalPrice * 100).toFixed(1) : '0.0';
    var rangeLow = roundTo(basePrice * (1 - PRICE_RANGE_RATE / 100), ROUND_TO);
    var rangeHigh = roundTo(basePrice * (1 + PRICE_RANGE_RATE / 100), ROUND_TO);
    return {
      basePrice: basePrice,
      totalPrice: totalPrice,
      estimatedCost: estimatedCost,
      grossMarginRate: grossMarginRate,
      rangeLow: rangeLow,
      rangeHigh: rangeHigh
    };
  }

  function formatYen(n) {
    return Number(n).toLocaleString('ja-JP') + '円';
  }

  /* ─── 算出結果パネルの表示を上書きする ───────────────────────── */
  function setCellIfChanged(cell, text) {
    if (!cell) return;
    if (cell.textContent !== text) cell.textContent = text;
  }

  function overrideResultPanel(result) {
    setCellIfChanged(findRowValueCell('標準ベース価格'), formatYen(result.basePrice));
    setCellIfChanged(
      findRowValueCell(function (label) { return label.indexOf('営業経費込み価格') === 0; }),
      formatYen(result.totalPrice)
    );
    setCellIfChanged(
      findRowValueCell('価格レンジ'),
      formatYen(result.rangeLow) + '〜' + formatYen(result.rangeHigh)
    );
    setCellIfChanged(findRowValueCell('想定原価'), formatYen(result.estimatedCost));
    setCellIfChanged(findRowValueCell('粗利率'), result.grossMarginRate + '%');
    overrideComment(result);
  }

  /* ─── 判断補助コメント内の金額表記のみ差し替える（文章はそのまま） ───── */
  var YEN_PATTERN = /[\d,]+円/g;

  function overrideComment(result) {
    var nodes = document.querySelectorAll('p, div, span');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.children && node.children.length > 0) continue;
      var text = node.textContent || '';
      if (text.indexOf('を推奨します') === -1) continue;
      var matches = text.match(YEN_PATTERN);
      if (!matches || matches.length < 2) continue;
      var replaced = 0;
      var newText = text.replace(YEN_PATTERN, function (m) {
        replaced += 1;
        if (replaced === 1) return formatYen(result.basePrice);
        if (replaced === 2) return formatYen(result.totalPrice);
        return m;
      });
      if (newText !== text) node.textContent = newText;
      break;
    }
  }

  /* ─── メイン処理 ─────────────────────────────────────── */
  function apply() {
    var data = loadData();
    syncAllSelects(data);
    reapplySelections(data);
    var state = readFormState(data);
    for (var key in state) {
      if (Object.prototype.hasOwnProperty.call(state, key)) lastUserState[key] = state[key];
    }
    var hasResultPanel = findRowValueCell('標準ベース価格') !== null;
    if (hasResultPanel) overrideResultPanel(computePrice(data, state));
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || window.setTimeout)(function () {
      scheduled = false;
      apply();
    });
  }

  function start() {
    apply();

    var root = document.getElementById('root') || document.body;
    var observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true });

    document.addEventListener('change', function (e) {
      var select = e.target && e.target.tagName === 'SELECT' ? e.target : null;
      if (!select) return;
      for (var i = 0; i < CATEGORIES.length; i++) {
        var category = CATEGORIES[i];
        if (findConditionSelect(category.label) === select) {
          lastUserState[category.key] = NUMERIC_KEYS[category.key] ? Number(select.value) : select.value;
          break;
        }
      }
      schedule();
    });

    // 別タブ（管理画面）でマスタデータが更新された場合も反映する
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) schedule();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
