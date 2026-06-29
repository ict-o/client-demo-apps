/*
 * standard-price-demo 用カスタマイズスクリプト
 *
 * print-estimate-demo のバンドル（app.js）をそのまま再利用し、
 * 「標準価格のみ算出」デモにするために、標準価格算出に不要なUIを非表示にします。
 *   - 担当者別価格分析パネル（非表示）
 *   - 類似見積検索結果パネル（非表示）
 *   - 「類似見積検索」ボタン（非表示）
 *
 * 残す要素: 見積条件入力 / 標準価格算出結果（判断補助コメント含む）/ 処理ログ
 *
 * バンドル本体（ロジック・スタイル）には一切手を加えていません。UI/UXは print-estimate-demo と同一です。
 */
(function () {
  'use strict';

  // 非表示にするパネル（パネル冒頭の見出しテキストで判定）
  var HIDE_PANEL_TITLES = ['担当者別価格分析', '類似見積検索結果'];
  // 非表示にするボタン（ラベル完全一致）
  var HIDE_BUTTON_LABELS = ['類似見積検索'];
  // パネルの囲い（カード）を識別するためのクラス断片
  var PANEL_CLASS_HINT = 'border-[#D8DEE9]';

  function applyHiding() {
    // パネルの非表示
    var panels = document.querySelectorAll('div[class*="' + PANEL_CLASS_HINT + '"]');
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      if (panel.dataset.spHidden === '1' || panel.style.display === 'none') continue;
      var text = (panel.textContent || '').trim();
      for (var t = 0; t < HIDE_PANEL_TITLES.length; t++) {
        if (text.indexOf(HIDE_PANEL_TITLES[t]) === 0) {
          panel.style.display = 'none';
          panel.dataset.spHidden = '1';
          break;
        }
      }
    }

    // ボタンの非表示
    var buttons = document.querySelectorAll('button');
    for (var b = 0; b < buttons.length; b++) {
      var btn = buttons[b];
      if (btn.style.display === 'none') continue;
      var label = (btn.textContent || '').trim();
      if (HIDE_BUTTON_LABELS.indexOf(label) !== -1) {
        btn.style.display = 'none';
      }
    }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || window.setTimeout)(function () {
      scheduled = false;
      applyHiding();
    });
  }

  function start() {
    applyHiding();
    var root = document.getElementById('root') || document.body;
    var observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
