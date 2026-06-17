---
name: feedback_no-dev-server
description: 開発サーバーの起動を禁止する。npm run dev / vite / next dev などのサーバー起動コマンドを実行しない
metadata:
  type: feedback
---

`npm run dev`・`vite`・`next dev` などの開発サーバー起動コマンドは一切実行しない。

**How to apply:** 動作確認が必要なときは `npm run build` のビルド成功をもって完了とする。ローカルホストへのアクセスや `--host` フラグも使わない。
