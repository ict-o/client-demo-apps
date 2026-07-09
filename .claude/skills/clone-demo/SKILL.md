---
name: clone-demo
description: >-
  既存の静的バンドル型デモ（print-estimate-demo など、ビルド済み app.js を持つデモ）を
  複製し、app.js を無改変のまま、描画後に UI を非表示/注入するオーバーレイスクリプトで
  機能を出し分ける新しいデモを作る。standard-price-demo（customize.js で機能を絞った版）が
  この手法の実例。「既存デモの機能を絞った版」「app.js を流用して別デモを」等で起動する。
---

# clone-demo — 静的バンドルを流用して派生デモを作る

このリポジトリには「ビルド済み `app.js`（約232KB・minified・複数デモで同一）を**無改変で共有**し、
機能差は**オーバーレイスクリプト**で出し分ける」という確立パターンがあります。実例:

- `standard-price-demo/customize.js` … 不要パネル・ボタンを**描画後に非表示**にして機能を絞る。
- `print-estimate-demo/past-list.js` … 描画後にパネルを**注入**して機能を足す。

**`app.js` は絶対に手編集しない**（minified・共有バンドル。壊すと全流用先に波及。CLAUDE.md §4-3）。

## 手順

### 0. 前提を確定する（不足なら1回だけ質問）

`AskUserQuestion` で:

- **流用元デモ**（例 `print-estimate-demo`）。
- **新デモのディレクトリ名**（英小文字・数字・ハイフン、機能が分かる名前）。
- **日本語デモ名** と **概要**。
- **やりたい出し分け**: どのUIを隠す/足すか（「非表示」型か「注入」型か）。

### 1. ブランチ確認

`git status` / `git branch`。指定作業ブランチにいること。`main` では作業しない。

### 2. ディレクトリを複製

```bash
mkdir <new-demo>
cp <src-demo>/app.js <new-demo>/app.js
cp <src-demo>/responsive.css <new-demo>/responsive.css
```

- `app.js` は無改変コピー。**`md5sum <src-demo>/app.js <new-demo>/app.js` で一致確認**。
- `package.json`・`vite.config.ts`・`src/` は**作らない**（静的バンドル型。CLAUDE.md §2-B）。

### 3. オーバーレイスクリプトを書く

`<new-demo>/<overlay>.js`（例 `customize.js`）を新規作成。方針:

- `DOMContentLoaded` 後、`app.js` の描画完了を待ってから DOM を操作する（実例のスクリプトのタイミング取りを踏襲）。
- **非表示型**: 対象要素を `style.display = 'none'` 等で隠す。DOM は消さない。
- **注入型**: 対象アンカーを見つけて要素を差し込む。
- app.js のロジック・スタイルには手を触れない。冒頭コメントに「app.js を無改変で流用し、〇〇を出し分ける」と明記（実例に倣う）。

### 4. index.html を作る

流用元の `index.html` を土台にし、**読込順を厳守**（`app.js` → オーバーレイ）:

```html
<link rel="stylesheet" href="./responsive.css" />
<script defer src="./app.js"></script>
<script defer src="./<overlay>.js"></script>
```

- 参照は全て `./` 相対（裸絶対パス禁止・CLAUDE.md §8）。
- `<title>`・`<meta description>` を新デモ用に更新。ただし**実在企業名・製品名を新たに持ち込まない**（迷えば §11 で確認）。
- 業務システム型（既存の静的バンドル型デモは全てこれ・CLAUDE.md §2-2）なら `<title>` とオーバーレイで足す文言は**全て日本語**。オーバーレイで注入するUIは §5-UI の共通合格条件を満たす。

### 5. README.md を作る

`standard-price-demo/README.md` を手本に、次を書く:

- デモ名・目的・想定ユースケース・**性格（業務システム型/SaaS型・CLAUDE.md §2-2）**。
- **構成**: `app.js` は流用元と同一バンドル（無改変）、`<overlay>.js` が出し分けを担う旨。
- 残した機能 / 省いた（隠した）機能の一覧。
- 公開URL `https://ict-o.github.io/client-demo-apps/<new-demo>/`。
- **架空データ明記**・顧客固有情報を含まない旨。

### 6. ルート index.html に .demo-card を追加

`/index.html` の `.demo-list` にカードを1枚追加（CLAUDE.md §9・new-demo スキル参照）。`href` は `./<new-demo>/`。

### 7. プリフライト & コミット

- `demo-preflight` スキルを実行（特に **app.js の md5 一致**、`<script>` 読込順、カード整合、公開安全スキャン）。
- 日本語コミット案を出す。例:
  ```
  feat: <new-demo>（<src-demo> のUIを流用した派生デモ）を追加
  ```
- push は指定作業ブランチのみ。PR は明示依頼時だけ。

## 完了条件（CLAUDE.md §5-成果物B）

- `package.json`/`vite.config.ts`/`src/` を作っていない。
- `app.js` が流用元と md5 一致（無改変）。
- 出し分けはオーバーレイスクリプトのみで実現。
- `index.html` の参照が相対、読込順が app.js → オーバーレイ。
- README に構成と架空データ明記。
- ルート index.html にカード追加済み。
- 差分に実在企業名・実データ・認証情報なし。
