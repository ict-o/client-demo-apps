---
name: new-demo
description: >-
  client-demo-apps に新しいデモを1つ追加するときに使う。デモ種別（Viteビルド型 /
  静的バンドル型）の判定から、ディレクトリ雛形の生成、vite.config.ts の base 設定、
  デモ README、ルート index.html への .demo-card 追加、コミット案の日本語出力までを
  抜け漏れなく行う。「デモを追加」「新しいデモ」「demo を作って」等で起動する。
---

# new-demo — 新しいデモを安全に追加する

このスキルは CLAUDE.md §5-成果物A/B のチェックリストを、抜けなく満たすための手順書です。
**サーバは起動しません**（CLAUDE.md §4）。動作確認は Viteビルド型なら `npm run build`、静的バンドル型なら静的整合チェックで行います。

## 手順

### 0. 事前情報を確定する（不足なら1回だけ質問）

**既定はゼロから作る＝Viteビルド型（最新技術スタック）**（CLAUDE.md §2-0）。
既存の共有 `app.js` を流用する派生デモを作りたいと明示された場合のみ `clone-demo` スキルへ回す。

次が未確定なら `AskUserQuestion` でまとめて聞く:

- **ディレクトリ名**（`<demo-directory>`）: 英小文字・数字・ハイフンのみ。機能が分かる名前。`case1` 等の抽象名・実在企業名は不可。
- **日本語のデモ名**（ルート index.html のカード見出し用）。
- **デモ概要**（1〜2文）。
- **性格**: 業務システム型か SaaS型か（CLAUDE.md §2-2。迷ったら業務システム型）。業務システム型なら**システム名・UI文言・`<title>` は全て日本語**。

技術スタックは既定で **React 19 + TypeScript + Vite（最新安定版）**。ビルドで静的ファイルを生成し Pages で閲覧できる構成にする（サーバ処理は使わない）。

### 1. ブランチ確認

`git status` / `git branch` を実行。指定作業ブランチにいることを確認する。`main` なら作業しない（CLAUDE.md §4-7）。

### 2-A. Viteビルド型を作る場合（既定）

1. 既存の `bridal-estimate-demo` を参照実装として構造を踏襲する。
2. `<demo-directory>/vite.config.ts` を CLAUDE.md §6 の雛形で作る。**`base` はディレクトリ名と完全一致**、`outDir: '.'`、`emptyOutDir: false`。
3. `package.json`・`tsconfig*.json`・`eslint.config.js`・`src/`・`index.html`（開発用エントリ）を用意する（bridal からコピーして中身を差し替えると速い）。
   - **依存は最新安定版に更新する**（React・Vite・TypeScript 等）。bridal の `package.json` を丸ごと固定コピーせず、バージョンを最新へ引き上げる（CLAUDE.md §2-0）。
4. サンプルデータは**すべて架空**にする（CLAUDE.md §4-4。`dummy-data` スキルの安全パターンを使う）。
4-2. UI は CLAUDE.md **§5-UI の共通合格条件**を最初から満たすように作る（デザイントークン・hover/focus・0件時文言・金額3桁区切り等）。`bridal-estimate-demo/src/index.css` のトークン構成が手本。
4-3. **§5-UX（実システム体験）を設計段階から満たす**。「本物のシステムを操作している」と感じさせることが完成条件:
   - 置いたボタン・リンクは**全て動作させる**（動かせない機能は置かないか disabled 明示。無反応UIが1つでもあれば未完成）。
   - 作成・編集・削除は画面の state に即時反映し、日本語のトースト/完了表示で応答する。計算項目は入力に追従して再計算する。
   - README に「実演フロー」（例: 一覧 → 新規作成 → 明細編集 → プレビュー → 出力）を書き、そのフローが**画面上で最後まで完走できる**ことをコード上でトレースして確認する。
   - 初期データは業務が進行中に見える件数・ステータス分布にし、ヘッダーに架空の担当者名等の利用者コンテキストを出す。
5. `<demo-directory>` で `npm install` → `npm run build`。**ビルド成功＝完了条件**。
6. ビルドで生成された **デモ直下の `index.html` と `assets/`** を確認する。`dist/` の下に出ていないこと。
7. `index.html` が参照する `assets/index-XXXX.js`/`.css` の**実ファイルが存在**することを確認（ハッシュ整合）。
8. `<demo-directory>/README.md` を作る。含める: デモ名・目的・想定ユースケース・**性格（業務システム型/SaaS型）**・使用技術・ビルド方法・公開URL（`https://ict-o.github.io/client-demo-apps/<demo-directory>/`）・**架空データ明記**・顧客固有情報を含まない旨。
9. §4（ルートカード）へ。

### 2-B. 静的バンドル型を作る場合

原則 `clone-demo` スキルを使う。ここで作るなら:

1. `package.json`・`vite.config.ts`・`src/` は**作らない**（CLAUDE.md §2-B）。
2. 流用元の `app.js` を無改変でコピー（`md5sum` で一致確認）。
3. `index.html` を作り、`./responsive.css`・`./app.js`・`./<overlay>.js` を**相対パス**で、**app.js → オーバーレイの順**に読み込む。
4. 機能の出し分けは**オーバーレイスクリプト**（描画後に非表示/注入）で実装。`app.js` は触らない。
5. `README.md` に構成とオーバーレイ方式、架空データ明記を書く。
6. §4 へ。

### 4. ルート index.html に .demo-card を追加（必須）

`/index.html` の `.demo-list` 内に、既存カードと同じ構造で1枚追加する:

```html
<a class="demo-card" href="./<demo-directory>/">
  <div class="demo-info">
    <div class="demo-title"><!-- 日本語のデモ名 --></div>
    <div class="demo-slug"><demo-directory></div>
    <div class="demo-desc"><!-- 概要1〜2文 --></div>
  </div>
  <span class="demo-arrow">›</span>
</a>
```

`href` は相対 `./<demo-directory>/`。パスワードゲートのスクリプトは触らない（CLAUDE.md §9）。

### 5. プリフライト

`demo-preflight` スキルを実行し、種別別ビルド・アセット整合・公開安全スキャン・カード更新を確認する。

### 6. コミット案の出力

`git status` で差分を確認し、日本語のコミット案を出す（CLAUDE.md §3）。例:

```
feat: <demo-directory> デモを追加
```

- Viteビルド型は、生成 `index.html`・`assets/`・`src/`・設定ファイル・README を漏れなくステージ。
- push は指定作業ブランチのみ。PR は明示依頼時だけ（CLAUDE.md §4-7）。

## 完了条件

CLAUDE.md §5 の該当成果物（A または B）のチェックリストと、§5-UI（共通UI/UX）・§5-UX（実システム体験）の合格条件が全て YES。
