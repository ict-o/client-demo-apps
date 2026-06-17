# CLAUDE.md — Claude Code 向けプロジェクトルール

このファイルは、Claude Code がこのリポジトリで作業する際に従うべきルールを定義します。

---

## コミットメッセージ

**必ずコミットメッセージは日本語で出力すること。**

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

## 公開ルール（必須）

- 実在する顧客名・社名・担当者名・案件名はコードにもコミットメッセージにも記載しない
- 実データ・APIキー・認証情報・`.env` はコミットしない
- 使用するデータはすべて架空データにする
- 本番コードや顧客固有実装は含めない

---

## ディレクトリ構成ルール

- リポジトリ直下には `README.md` と各デモディレクトリのみ配置する
- `docs/`・`apps/`・`public-demos/` のような集約ディレクトリは作らない
- 各デモは `リポジトリ直下/<demo-directory>/` の形で管理する

### ディレクトリ名

- 英小文字・数字・ハイフンのみ使う
- 機能や用途が分かる名前にする（例：`invoice-approval`、`sales-dashboard`）
- `case1`・`case2` のような抽象的な名前は使わない
- 実在企業名・顧客名は使わない

---

## Vite 設定ルール

新しいデモに `vite.config.ts` を作成する場合、以下を必ず設定すること。

```ts
export default defineConfig({
  base: '/client-demo-apps/<demo-directory>/',
  build: {
    outDir: '.',
    emptyOutDir: false, // 開発用ファイルを削除しないために必須
  },
})
```

- `base` はリポジトリ名とデモディレクトリ名を含むパスにする
- `outDir` は `.`（各デモディレクトリ直下）にする
- `emptyOutDir` は必ず `false` にする（`src/` 等の削除防止）

---

## GitHub Pages 公開ルール

各デモは以下のURLで直接表示できる構成にすること。

```
https://<owner>.github.io/client-demo-apps/<demo-directory>/
```

- ビルド後の `index.html` は各デモディレクトリ直下に生成する
- `dist/` 配下への出力は採用しない
- `/client-demo-apps/<demo-directory>/dist/` のようなURLは使わない

---

## 各デモディレクトリの README

デモを新規追加する際は、そのディレクトリに `README.md` を作成すること。

記載内容：

- デモ名・目的・想定ユースケース
- 使用技術
- ローカル起動方法・ビルド方法
- 公開URL
- 使用データが架空データであること
- 顧客固有情報を含まないこと
