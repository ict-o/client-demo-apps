---
name: demo-preflight
description: >-
  client-demo-apps でコミット・push する前の総点検を行う。デモ種別ごとのビルド確認、
  ビルド成果物（index.html と assets/）のハッシュ整合、裸絶対パス・emptyOutDir:true・
  dist/ 公開構成の検出、実在企業名や認証情報など公開してはいけない情報のスキャン、
  デモ追加/削除時のルート index.html カード更新漏れの検出をまとめて実施する。
  「コミット前チェック」「公開して大丈夫か確認」「preflight」等で起動する。
---

# demo-preflight — 公開前の総点検

**このリポジトリは公開リポジトリで、main マージ時にリポジトリ全体がそのまま Pages に出ます**（CLAUDE.md §0）。
コミット前にこのチェックを通してから進めること。サーバは起動しない（CLAUDE.md §4）。

## 手順（各項目を実行して結果を報告する）

### 1. 変更範囲と対象デモの種別を把握

- `git status` と `git diff --stat` で変更ファイルを確認。
- 触ったデモごとに、`vite.config.ts`＋`package.json` の有無で **Viteビルド型 / 静的バンドル型** を判定（CLAUDE.md §2）。

### 2. 禁止構成の検出（差分・対象デモに対して）

以下をリポジトリ内で検索し、**ヒットしたら止めて報告**:

- `emptyOutDir: true` … 禁止（CLAUDE.md §4-2）。
- 裸の絶対パス `/assets/` を手書きした箇所（Viteが生成する `/client-demo-apps/<dir>/assets/...` は正常。区別すること）。
- `dist/` を公開URL/出力先にする構成、`.../<dir>/dist/` 形式のURL。
- 新規に作られた `docs/`・`apps/`・`public-demos/`・`projects/` などの集約ディレクトリ。

```bash
grep -rn "emptyOutDir: true" --include=*.ts .
grep -rn 'href="/assets/\|src="/assets/\|url(/assets/' --include=*.html --include=*.css .
grep -rn "/dist/" --include=*.html --include=*.md .
```

### 3. 静的バンドル型: app.js 無改変チェック

`print-estimate-demo/app.js` と `standard-price-demo/app.js` が**同一**であること（共有バンドル）、および今回 `app.js` を手編集していないことを確認:

```bash
md5sum print-estimate-demo/app.js standard-price-demo/app.js
git diff --stat -- '*app.js'   # app.js に差分が出ていたら要確認（CLAUDE.md §4-3）
```

`app.js` に意図しない差分があれば止めて報告。

### 4. Viteビルド型: ビルドとアセット整合

対象の Viteデモで:

```bash
cd <demo-directory> && npm run build
```

- ビルドが**成功**すること（＝完了条件、CLAUDE.md §2-A）。
- デモ直下に `index.html` と `assets/` が生成され、`dist/` の下でないこと。
- `index.html` が参照する `assets/index-XXXX.js` / `.css` の**実ファイルが `assets/` に存在**すること（ハッシュ整合）。参照名と実ファイル名を突き合わせる。
- 生成物がステージされているか（`git status`）。**`index.html` と `assets/` は必ずセットでコミット**（CLAUDE.md §7-4）。

### 5. ルート index.html のカード整合

- デモを**追加**したのに `/index.html` に `.demo-card` が無い → 追加する（CLAUDE.md §9）。
- デモを**削除**したのに対応カードが残っている → 削除する。
- カードの `href` が相対 `./<dir>/` になっているか。

```bash
# 各デモディレクトリと index.html のカードの対応を目視確認
ls -d */ ; grep -o 'href="\./[a-z0-9-]*/"' index.html
```

### 6. 公開安全スキャン（情報漏えい防止）

差分に対して確認（CLAUDE.md §10）:

- 実在しそうな社名・顧客名・担当者名・案件名がないか（架空名か）。
- APIキー・トークン・パスワード平文・`.env`・実データ・本番URLがないか。

```bash
git diff --staged
grep -rn "\.env\|api[_-]\?key\|secret\|token" --include=*.ts --include=*.js --include=*.html . | grep -vi "TextEncoder\|csrf"
```

### 6-2. UI/UX 基準の確認（画面を触った変更のみ）

変更した画面・コンポーネントに対して CLAUDE.md §5-UI を確認する（全項目の精査が必要なら `uiux-audit` スキルを実行）。最低限ここでは:

```bash
grep -rin "lorem\|テストテスト\|TODO" --include=*.tsx --include=*.html <触ったデモ> | grep -v node_modules   # 仮置き文言
grep -o "<title>[^<]*</title>" <触ったデモ>/index.html                                                       # 業務システム型なら日本語タイトルか
```

- 業務システム型（CLAUDE.md §2-2）なのに英語UIラベル・英語システム名を**新たに持ち込んでいない**か。
- 新規追加したデータが `dummy-data` スキルの安全パターン（example.com ドメイン・0番地住所・0000電話等）に従っているか。

### 7. コミットメッセージ規約

- 日本語・`<種別>: <要約>` 形式か（CLAUDE.md §3）。
- モデル識別子・内部ツール名・実在固有名詞を含めていないか。

## 出力

各項目を ✅ / ⚠️（要確認）/ ❌（修正必須）で一覧報告し、❌ が残る間はコミットを勧めない。
判断がつかない固有名詞や、app.js への差分など重要な迷いは `AskUserQuestion` で確認する（CLAUDE.md §11）。
