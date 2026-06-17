# client-demo-apps

受託案件の提案向け公開デモアプリ集

---

## このリポジトリについて

受託案件の提案・商談・検証で利用する公開デモアプリおよびモックアップを管理するリポジトリです。

- デモごとにディレクトリを分けて管理する
- GitHub Pages でURLを共有し、提案時にそのまま確認できる状態にする
- 本番コードや顧客固有の実装は含めない
- 本番開発は別の private リポジトリで管理する
- このリポジトリは、公開可能な汎用デモのみを扱う

---

## 公開ルール

このリポジトリは公開リポジトリです。以下のルールを必ず守ってください。

- 社名・顧客名・案件名など、特定の企業・団体・個人が推測できる情報はマスクする
- 実在する会社名・団体名・担当者名は記載しない
- 実データ・認証情報・APIキー・業務上の機密情報は含めない
- 使用するデータはすべて架空データ・サンプルデータにする
- 顧客固有の業務フローや要件が分かる情報は公開しない
- このリポジトリは公開用デモに限定し、本番用途では使用しない
- 本番実装・顧客固有実装・非公開実装は private リポジトリで管理する

---

## リポジトリ構成

リポジトリ直下には、原則として `README.md` と各デモアプリ用ディレクトリのみを配置します。

`docs/`、`public-demos/`、`apps/`、`projects/` のような集約用ディレクトリは作りません。各デモは、リポジトリ直下に個別のディレクトリを作成して管理します。

```
client-demo-apps/
  README.md

  invoice-approval/
    README.md
    package.json
    vite.config.ts
    index.html
    src/
    public/
    assets/

  inventory-dashboard/
    README.md
    package.json
    vite.config.ts
    index.html
    src/
    public/
    assets/

  reservation-form/
    README.md
    package.json
    vite.config.ts
    index.html
    src/
    public/
    assets/
```

ディレクトリ名の例（実際の名前は都度指定します）：

```
invoice-approval
inventory-dashboard
reservation-form
customer-portal
workflow-automation
sales-dashboard
task-management
document-generator
estimate-calculator
support-ticket
```

ディレクトリ名は、機能や用途が分かる汎用名にしてください。実在する社名・顧客名・案件名は使いません。

---

## ルート index.html の更新（必須）

新しいデモディレクトリを追加・削除した際は、**必ずリポジトリ直下の `index.html` も合わせて更新してください。**

- 追加時：新しいデモへのカードリンクをデモ一覧ページに追加する
- 削除時：対応するカードリンクを削除する
- 記載内容：デモ名（日本語）・ディレクトリ名・デモ概要

---

## 各デモディレクトリの構成

各デモディレクトリ内に、そのデモに必要なファイルをすべてまとめて配置します。各デモは単体で開発・ビルド・公開できる構成にしてください。

```
invoice-approval/
  README.md
  package.json
  vite.config.ts
  index.html       ← ビルド後に公開用 index.html が生成される
  assets/          ← ビルド後に公開用アセットが生成される
  src/
  public/
```

各デモディレクトリに含める想定のファイル：

- `README.md`（デモの説明）
- `package.json`
- `vite.config.ts`
- `index.html`（ビルド後に上書き生成される公開用ファイル）
- `src/`（ソースコード）
- `public/`（静的ファイル）
- `assets/`（ビルド後に生成される公開用アセット）

---

## 技術スタック

- TypeScript / React / Vite などを使用してよい
- GitHub Pages で公開できるよう、ビルド時には静的ファイルを生成すること
- サーバーサイド処理を前提にしないこと
- API連携が必要な場合は、モックデータやダミーAPIで代替すること
- 各デモは単体でビルド・公開できる構成にすること
- 依存関係・設定・ビルド成果物は、原則として各デモディレクトリ内で完結させること
- 公開時にサーバー側の環境変数やバックエンド処理が必要な構成にはしないこと

---

## GitHub Pages での公開方針

各デモは、以下のURLで直接表示できる構成にします。

```
https://<owner>.github.io/client-demo-apps/invoice-approval/
https://<owner>.github.io/client-demo-apps/inventory-dashboard/
https://<owner>.github.io/client-demo-apps/reservation-form/
```

つまり、以下の形式のURLにアクセスしたときに、そのデモアプリが直接表示される必要があります。

```
/client-demo-apps/<demo-directory>/
```

そのため、ビルド後の `index.html` は各デモディレクトリ直下に配置してください。

### 採用する構成

```
client-demo-apps/
  invoice-approval/
    index.html     ← ここに index.html が必要
    assets/
    README.md
    package.json
    vite.config.ts
    src/
```

### 採用しない構成

```
client-demo-apps/
  invoice-approval/
    dist/
      index.html   ← dist/ 配下は使わない
      assets/
```

`dist/` 配下に出力する構成では、公開URLが以下になってしまうため採用しません。

```
/client-demo-apps/invoice-approval/dist/
```

---

## Vite を使う場合のビルド設定

`vite.config.ts` で以下を設定してください。

- `base` を `/client-demo-apps/<demo-directory>/` にする
- `build.outDir` を `.`（各デモディレクトリ直下）にする
- `emptyOutDir` は必ず `false` にする

```ts
// invoice-approval/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/client-demo-apps/invoice-approval/',
  build: {
    outDir: '.',
    emptyOutDir: false,
  },
})
```

別のデモを追加する場合は、`base` をそのディレクトリ名に合わせて変更します。

```ts
// inventory-dashboard/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/client-demo-apps/inventory-dashboard/',
  build: {
    outDir: '.',
    emptyOutDir: false,
  },
})
```

### `outDir: "."` を使う場合の注意点

`outDir: "."` を指定すると、各デモディレクトリ直下に `index.html` と `assets/` が生成されます。

**必ず `emptyOutDir: false` を設定してください。**

`emptyOutDir: true` にすると、ビルド時に以下の開発用ファイルが削除されます。

```
src/
package.json
vite.config.ts
README.md
```

注意事項：

- ビルド成果物として生成される `index.html` と `assets/` は公開対象
- `src/`・`package.json`・`vite.config.ts` は開発用ファイルであり、ビルド時に削除しない
- `index.html` が開発用に既に存在する場合、ビルド時に上書きされるため構成に注意する
- 生成物が意図しない既存ファイルを上書きしないよう確認する
- 各デモディレクトリは、GitHub Pages で直接表示できる状態を常に保つ

---

## ビルド後の期待状態

`invoice-approval` デモのビルド後は以下の状態になっている必要があります。

```
client-demo-apps/
  README.md

  invoice-approval/
    index.html     ← ビルドで生成された公開用ファイル
    assets/        ← ビルドで生成された公開用アセット
    README.md
    package.json
    vite.config.ts
    src/
```

公開URLは以下で正しく表示される必要があります。

```
https://<owner>.github.io/client-demo-apps/invoice-approval/
```

以下の状態・URLは採用しません。

```
invoice-approval/dist/index.html
/client-demo-apps/invoice-approval/dist/
```

---

## ローカル開発・ビルド

各デモディレクトリに移動して、それぞれ独立して開発・ビルドします。

### 開発サーバーの起動

```bash
cd invoice-approval
npm install
npm run dev
```

### ビルド

```bash
cd invoice-approval
npm run build
```

ビルド後、以下の公開用ファイルが各デモディレクトリ直下に生成されます。

```
invoice-approval/
  index.html
  assets/
```

複数のデモをビルドする場合も、各デモディレクトリごとに個別にビルドします。

---

## ルーティングに関する注意点

React Router などのクライアントサイドルーティングを使う場合、GitHub Pages ではサブパスへ直接アクセスすると 404 になることがあります。

以下のいずれかを検討してください。

- `HashRouter` を使用する
- GitHub Pages 向けにルーティング設定を調整する
- デモ用途では複雑なルーティングを避ける
- 直接URLアクセスが必要な画面は、静的に表示できる構成にする

各デモの基本公開URLは必ず以下の形式にしてください。

```
/client-demo-apps/<demo-directory>/
```

---

## アセットパスに関する注意点

GitHub Pages では、リポジトリ名とデモディレクトリ名がURLに含まれます。画像・CSS・JavaScriptのパスが壊れないよう注意してください。

- 絶対パス `/assets/...` を安易に使わない
- Vite の `base` を正しく設定する（上記参照）
- 画像やファイル参照は、ビルド後のURLで壊れないか確認する
- `/client-demo-apps/<demo-directory>/` 配下で動作することを前提にする

---

## 各デモディレクトリの README

各デモディレクトリにも `README.md` を配置してください。以下の内容を記載する想定です。

- デモ名
- 目的
- 想定ユースケース
- 使用技術
- ローカル起動方法
- ビルド方法
- 公開URL（例：`https://<owner>.github.io/client-demo-apps/invoice-approval/`）
- 注意事項
- 使用しているデータが架空データであること
- 顧客固有情報を含まないこと

---

## 推奨事項

- ディレクトリ名は機能・用途が分かる名前にする
- ディレクトリ名には英小文字・数字・ハイフンを使う
- スペース・日本語・実在企業名はディレクトリ名に使わない
- デモデータは架空のものにする
- 公開前にURL・表示崩れ・アセットパスを確認する
- 1デモ1ディレクトリで管理する
- デモが本番化する場合は、別の private リポジトリへ切り出す

---

## 禁止事項

以下は禁止です。

- 実在する顧客名・社名・担当者名の記載
- 実在する案件名の記載
- 実データのコミット
- APIキー・トークン・認証情報のコミット
- `.env` のコミット
- 本番環境URLの記載
- 顧客固有の要件・業務情報の公開
- private リポジトリへのリンク掲載
- 本番コードの混入
- `case1`・`case2` のような内容が分からないディレクトリ名の使用
- `docs/` のような共通公開用ディレクトリの作成
- `dist/` 配下を公開URLにする構成
- `/client-demo-apps/<demo-directory>/dist/` のようなURLを前提にする構成

---

## AIエージェント向けルール

このリポジトリで Claude Code・GitHub Copilot・Cursor などのAIエージェントを使用する場合は、以下のファイルを参照してください。

| ファイル | 対象 |
|----------|------|
| [CLAUDE.md](CLAUDE.md) | Claude Code 専用ルール |
| [Agent.md](Agent.md) | 汎用AIエージェント向けルール |

AIエージェントに作業を依頼する際は、**必ずコミットメッセージ案を日本語で出力させてください。**

---

## コミットメッセージ規則

コミットメッセージは日本語で記述し、以下の形式を使用してください。

```
<種別>: <変更内容の要約>
```

### 種別一覧

| 種別 | 用途 |
|------|------|
| `feat` | 新しいデモ・ファイル・機能の追加 |
| `fix` | バグ修正・表示崩れの修正 |
| `docs` | README・コメントなどドキュメントの変更 |
| `chore` | ビルド設定・Vite設定・環境設定の変更 |
| `refactor` | 既存デモ・ファイルの整理・改善（機能変更なし） |
| `remove` | デモ・ファイルの削除 |

### コミットメッセージ例

```
feat: invoice-approval デモを追加
fix: reservation-form のアセットパスが壊れていた問題を修正
docs: README にルーティング注意点を追記
chore: invoice-approval の vite.config.ts に base パスを設定
refactor: inventory-dashboard のサンプルデータを架空データに差し替え
remove: 古い customer-portal デモを削除
```

### 注意事項

- 実在する顧客名・社名・案件名はコミットメッセージにも記載しない
- 変更内容が分かる具体的な要約を書く
- 複数の変更がある場合は、目的ごとにコミットを分ける
