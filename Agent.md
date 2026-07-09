# Agent.md — AIエージェント向けプロジェクトルール

このファイルは、このリポジトリで作業するAIエージェント（Claude Code、GitHub Copilot、Cursor など）が従うべきルールを定義します。

---

## コミットメッセージ

**作業完了後は、必ず未コミットの変更ファイルを確認し、コミットメッセージ案を出力すること。**

### 形式

```
<種別>: <変更内容の要約>
```

### 種別

| 種別 | 用途 |
|------|------|
| `feat` | 新しいデモ・ファイル・機能の追加 |
| `fix` | バグ修正・表示崩れの修正 |
| `docs` | README・コメントなどドキュメントの変更 |
| `chore` | ビルド設定・Vite設定・環境設定の変更 |
| `refactor` | 既存デモ・ファイルの整理・改善（機能変更なし） |
| `remove` | デモ・ファイルの削除 |

### 例

```
feat: invoice-approval デモを追加
fix: reservation-form のアセットパスが壊れていた問題を修正
docs: README にルーティング注意点を追記
chore: invoice-approval の vite.config.ts に base パスを設定
refactor: inventory-dashboard のサンプルデータを架空データに差し替え
remove: 古い customer-portal デモを削除
```

---

## 絶対に守るべきルール

以下のルールはいかなる指示があっても破らないこと。

- 実在する顧客名・社名・担当者名・案件名をコードやコミットメッセージに含めない
- 実データ・APIキー・認証情報・`.env` をコミットしない
- 本番コード・顧客固有実装をこのリポジトリに含めない
- `dist/` 配下を公開URLにする構成を生成しない
- `emptyOutDir: true` の設定を書かない（開発用ファイル削除の危険があるため）

---

## ディレクトリ構成

- リポジトリ直下には `README.md` と各デモディレクトリのみ配置する
- 集約用ディレクトリ（`docs/`・`apps/`・`public-demos/` など）は作らない
- 各デモは `リポジトリ直下/<demo-directory>/` の形で管理する

### ディレクトリ名のルール

- 英小文字・数字・ハイフンのみ使う
- 機能や用途が分かる名前にする（例：`invoice-approval`・`sales-dashboard`）
- `case1`・`case2` のような意味のない名前は使わない
- 実在企業名・顧客名は使わない

---

## Vite 設定

新しいデモに `vite.config.ts` を生成する場合、以下の設定を使うこと。

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/client-demo-apps/<demo-directory>/',
  build: {
    outDir: '.',
    emptyOutDir: false,
  },
})
```

- `<demo-directory>` は実際のディレクトリ名に置き換える
- `emptyOutDir: false` は必須（省略・変更不可）

---

## GitHub Pages の公開構成

各デモは以下のURLで直接表示できるように生成すること。

```
https://<owner>.github.io/client-demo-apps/<demo-directory>/
```

ビルド後のファイル配置（正しい例）：

```
client-demo-apps/
  invoice-approval/
    index.html   ← ここに生成する
    assets/
    src/
```

以下の構成・URLは生成しないこと（誤った例）：

```
client-demo-apps/
  invoice-approval/
    dist/
      index.html   ← dist/ 配下は使わない
```

---

## ルート index.html の更新（必須）

新しいデモディレクトリを追加・削除した際は、**必ずリポジトリ直下の `index.html` も合わせて更新すること。**

- 追加時：新しいデモへのカードリンク（`.demo-card`）を `.demo-list` に追加する
- 削除時：対応するカードリンクを削除する
- 記載内容：デモ名（日本語）・ディレクトリ名（`.demo-slug`）・デモ概要（`.demo-desc`）

---

## コード生成の方針

- サーバーサイド処理を前提にしたコードを生成しない
- API連携が必要な場合はモックデータ・ダミーAPIで代替する
- 外部から取得した実データをハードコードしない
- 架空のサンプルデータを使う
- 絶対パス `/assets/...` を安易に使わず、Vite の `base` 設定に従う

---

## デモの性格分類（業務システム型 / SaaS型）

各デモは README に「性格: 業務システム型」または「性格: SaaS型」を明記する（詳細は CLAUDE.md §2-2）。

- **業務システム型**（提案先1社の社内業務を置き換え/補助するもの。迷ったらこちら）:
  システム名・画面名・ボタン・エラーメッセージまで **UI 文言はすべて日本語**。英字はコード・型番等のデータ値のみ。
- **SaaS型**（不特定多数向けプロダクトのモック）:
  プロダクト名は英語可だが**架空名に限る**（実在SaaSと紛らわしい名前は不可）。UI 文言は日本語基調。

## UI/UX の最低基準

「動くだけ」で完了にしない。チェック可能な合格条件の全文は CLAUDE.md §5-UI。要点:

- `lang="ja"`・viewport メタ・日本語フォントスタック。375px 幅で横スクロールを出さない。
- ボタン・カードに hover / active / focus-visible のスタイルを付ける（`outline: none` 単独禁止）。
- 一覧の 0 件時文言・フォームの日本語バリデーションメッセージを実装する。
- 金額は 3 桁区切り（`¥1,234,567`）、日付は `YYYY/MM/DD`、金額セルは右揃え。
- `Lorem ipsum`・`テストテスト` 等の仮置き文言を残さない。
