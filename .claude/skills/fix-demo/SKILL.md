---
name: fix-demo
description: >-
  client-demo-apps の既存デモへの修正（バグ修正・表示修正・小さな機能追加）を、
  種別判定 → 修正 → ビルド/静的整合 → preflight → 日本語コミット案まで一気通貫で行う。
  最頻出の作業を手順化したもの。「〇〇デモを直して」「表示が崩れてる」「ボタンを追加して」
  等、既存デモへの変更全般で起動する（新規デモは new-demo / clone-demo を使う）。
---

# fix-demo — 既存デモ修正の一気通貫手順

このリポジトリで最も多い作業（既存デモの修正）を、事故パターン（CLAUDE.md §7 の 1〜5）を踏まずに完了させるための手順書です。
**サーバは起動しない**（CLAUDE.md §4）。

## 手順

### 1. 現在地と対象の確定

- `git status` / `git branch`。指定作業ブランチにいること。`main` なら作業しない。
- 対象デモの**種別を判定**（CLAUDE.md §2: `vite.config.ts`＋`package.json` の有無）。**性格**（業務システム型/SaaS型・§2-2）も README で確認。
- 修正指示が2通り以上に読めるなら、着手前に `AskUserQuestion`（CLAUDE.md §11）。

### 2. 修正範囲の宣言（自分に対して）

- 触ってよいファイルを先に列挙する。
  - **Viteビルド型**: `src/` 配下＋（必要なら）開発用 `index.html`。`assets/` と公開用 `index.html` は**手で編集しない**（ビルドが作る）。
  - **静的バンドル型**: オーバーレイスクリプト（`customize.js`/`past-list.js` 等）・`responsive.css`・`index.html`。**`app.js` は絶対に触らない**（CLAUDE.md §4-3）。
- 指示範囲外の問題（他画面の §5-UI 違反等）を見つけても**直さず記録**し、最後に報告する（CLAUDE.md §7-16）。

### 3. 修正する

- 業務システム型なら、新たに足す文言は**すべて日本語**（§2-2）。
- 新たに足す/変えるUIは §5-UI の該当項目（hover/focus・0件時文言・金額フォーマット等）を満たすこと。
- データを足すなら架空データのみ（迷ったら `dummy-data` スキルの安全パターンを使う）。

### 4-A. Viteビルド型: ビルドと整合確認

```bash
cd <demo-directory> && npm run build
```

- ビルド成功が完了条件。失敗が環境要因（ネットワーク・依存解決）なら**手を止めて報告**（CLAUDE.md §11）。
- ビルド後の確認:
  ```bash
  ls <demo-directory>/assets/                       # 新ハッシュのファイルが生成されている
  grep -o 'assets/index-[^"]*' <demo-directory>/index.html   # index.html の参照と実ファイルが一致
  git status                                        # index.html と assets/ が両方変更されている
  ```
- **`index.html` と `assets/` は必ずセットでコミット**（CLAUDE.md §7-4）。古いハッシュの `assets/index-*.js` が残って参照されなくなった場合は `git rm` で削除する。

### 4-B. 静的バンドル型: 静的整合確認

```bash
md5sum print-estimate-demo/app.js standard-price-demo/app.js   # 2つが一致（共有バンドル無改変）
git diff --stat -- '*app.js'                                   # app.js に差分ゼロ
grep -n "script defer" <demo-directory>/index.html             # 読込順が app.js → オーバーレイ
```

- 参照がすべて `./` 相対であること（CLAUDE.md §8）。
- オーバーレイの DOM 操作は、実例（`customize.js`/`past-list.js`）のタイミング取り（描画完了待ち）を踏襲していること。

### 5. preflight

`demo-preflight` スキルを実行（禁止構成・公開安全スキャン・カード整合・UI/UX確認を含む）。❌ が残る間は次へ進まない。

### 6. コミット案と報告

- 目的が異なる変更はコミットを分ける。日本語・`<種別>: <要約>`（CLAUDE.md §3）。例:
  ```
  fix: bridal-estimate-demo の見積一覧で金額が桁区切りされない問題を修正
  ```
- push は指定作業ブランチへ `git push -u origin <branch>`。PR は明示依頼時のみ。
- 報告に含める: 変更ファイル一覧・確認結果（ビルド成功 or 整合チェック結果）・範囲外で見つけた問題（あれば、直していない旨とともに）。

## 完了条件

CLAUDE.md §5-成果物C のチェックリストが全て YES（§5-UI の触った範囲の項目を含む）。
