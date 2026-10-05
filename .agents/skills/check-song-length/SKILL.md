---
name: check-song-length
description: 歌枠アーカイブに登録された楽曲データのうち、歌唱終了後の長時間の雑談等が含まれて5分（300秒）以上になっている楽曲を抽出し、Antigravity（Gemini）の推論とスクリプトの連携によって終了時刻（end）の修正や確認済み登録（is_length_checked）を行うワークフロー。
---

# 楽曲再生時間チェック・修正ワークフロー (check-song-length)

歌枠アーカイブの楽曲データにおいて、タイムスタンプが歌唱終了時刻ではなく次の曲の直前まで設定されているなどの原因で、**歌唱終了後の長時間の雑談部分が含まれてしまっている楽曲**を調査・修正するためのスキルです。

本スキルは、**APIキー不要なスクリプト処理（DB操作・iTunes公式音源照合）** と **Antigravity（Gemini）自身の推論・Web検索能力** を組み合わせて、高精度かつ自律的に楽曲区間を補正します。

---

## 🎯 役割分担と設計思想

```
┌──────────────────────────────────────────────┐
│ スクリプト (scripts/check-song-length.ts)    │
│ ・DBから長尺曲・未チェック曲の抽出           │
│ ・iTunes Search API (無料・認証不要) で公式尺│
│ ・タイムラインから次曲開始時刻・ギャップ計算 │
│ ・終了時刻更新 (--update / --batch)          │
└──────────────────────┬───────────────────────┘
                       │ 診断データ提示 (--inspect)
                       ▼
┌──────────────────────────────────────────────┐
│ Antigravity (Gemini エージェント)            │
│ ・提示された公式尺・タイムラインの総合推論   │
│ ・必要に応じた Web 検索 (原曲バージョン・構成)│
│ ・ワンコーラス / 後奏余韻 (10〜15秒) の加味 │
│ ・最適な終了時刻または承認の決定とコマンド実行│
└──────────────────────────────────────────────┘
```

---

## 🖥️ ローカル微調整用 Web UI（目視・耳で確認する場合）

ブラウザ上で動画を再生・試聴しながら、開始時刻・終了時刻を数秒で微調整できるローカル開発限定画面も利用可能です。

```bash
# 開発サーバーを起動
pnpm dev

# ブラウザでアクセス（ローカル環境のみアクセス可能）
# http://localhost:3000/admin/adjust-length
```

- **機能**:
  - 未確認 / 確認済みの切り替え、インクリメンタル検索、曲長順ソート
  - 「歌い出し確認」「歌い終わり確認」「終了後雑談確認」の各試聴ボタン
  - キーボード `[` / `]` で開始/終了時刻にセット、`Ctrl + Enter` で保存して次の曲へ自動遷移

---

## 🛠️ コマンド一覧（CLI）

すべての操作は `scripts/check-song-length.ts` を通じて行います。

```bash
# 1. 進捗サマリーの表示（総曲数、5分以上曲数、未チェック曲数）
pnpm exec tsx scripts/check-song-length.ts --stats

# 2. Antigravity 推論用詳細診断（公式音源尺・次曲ギャップ・推奨アクションを表示）
# デフォルト: 5分以上・未チェック曲
pnpm exec tsx scripts/check-song-length.ts --inspect --limit 10

# 特定動画の全曲を診断
pnpm exec tsx scripts/check-song-length.ts --inspect --video-id <VIDEO_ID> --threshold 0 --all

# JSON 構造化出力（エージェントによるパース向け）
pnpm exec tsx scripts/check-song-length.ts --inspect --video-id <VIDEO_ID> --threshold 0 --json

# 3. 未チェック一覧の通常表示
pnpm exec tsx scripts/check-song-length.ts --list --limit 10

# 4. 音声ピンポイント切り出し（Antigravity による実音声直接試聴・ミリ秒判定用）
# yt-dlp を使用し、終了予定時刻付近（前後20秒）の音声を瞬時に切り出します
pnpm exec tsx scripts/check-song-length.ts --clip <ID>
# 前後マージンを変更する場合（例: 前後30秒）
pnpm exec tsx scripts/check-song-length.ts --clip <ID> --padding 30

# 5. 終了時刻を更新（is_length_checked も自動で true になります）
# 秒数、または MM:SS / HH:MM:SS 形式で指定可能
pnpm exec tsx scripts/check-song-length.ts --update <ID> --end 4:15
pnpm exec tsx scripts/check-song-length.ts --update <ID> --end 255

# 6. 長さは正常として確認済みにマーク（原曲通り・メドレー等で元々長い曲）
pnpm exec tsx scripts/check-song-length.ts --mark-ok <ID>

# 7. 複数曲の一括更新（JSON配列またはJSONファイル）
pnpm exec tsx scripts/check-song-length.ts --batch '[{"id":"...","end":"4:15"},{"id":"...","markOk":true}]'
```

---

## 📋 Antigravity 自律実行ワークフロー

### ステップ 1: 現状把握と候補曲の診断
まずは `--stats` で全体の残り件数を確認し、`--inspect` で診断データを取得します。

```bash
# 全体調査の場合
pnpm exec tsx scripts/check-song-length.ts --inspect --limit 10

# 特定動画の調査の場合
pnpm exec tsx scripts/check-song-length.ts --inspect --video-id <VIDEO_ID> --threshold 0
```

`--inspect` コマンドにより以下の情報が整理されて出力されます：
- 楽曲 ID、曲名、アーティスト
- 現在区間（開始 〜 終了、登録尺）
- iTunes 公式音源尺および差分（秒数）
- 次の曲の開始時刻と曲間の余白（雑談可能区間）
- 推奨判定（ワンコーラスの可能性、適正、または雑談混入疑い＋補正候補時刻）

### ステップ 2: Antigravity（Gemini）による総合推論 & 実音声直接試聴

提示されたデータを元に、以下の観点で Antigravity が思考・判断します：

1. **差分が -15秒 〜 +20秒 以内**:
   - 原曲通りの演奏＋自然な後奏の余韻（10〜15秒）に収まっており正常と判定 ➔ `--mark-ok <ID>`
2. **差分が -30秒 以下（大幅に短い）**:
   - ショート版やワンコーラス歌唱の可能性大。歌唱終了位置が正しく取れていると判定 ➔ `--mark-ok <ID>`
3. **差分が +25秒 以上、または判定に迷う場合（実音声ピンポイント直接試聴）**:
   - `pnpm exec tsx scripts/check-song-length.ts --clip <ID>` を実行。
   - `ytdlp-interface\bin\yt-dlp.exe` により、動画全体を落とすことなく終了予定付近（前後20秒）の音声（mp3）が数秒でピンポイント切り出しされます。
   - Antigravity は `view_file` でその音声ファイルを直接読み込んで「耳で聴き」、
     - 伴奏の最後の音が消える瞬間（歌唱終了）
     - ライバーの喋り声や笑い声（雑談）が始まる瞬間
     を秒単位・ミリ秒単位で完全に特定します。
   - 試聴完了後、一時音声ファイルは自動削除されます。
4. **メドレーや長尺曲（5分以上が正常な曲）**:
   - 「ギブス」「未来予想図II」などのように原曲自体が長尺なものは、過剰カットせず `--mark-ok <ID>` で承認。

### ステップ 3: コマンドによる反映
特定した終了時刻を、スクリプトのコマンドで自律的に反映します。

```bash
# 単曲更新
pnpm exec tsx scripts/check-song-length.ts --update <ID> --end <新終了時刻>
pnpm exec tsx scripts/check-song-length.ts --mark-ok <ID>

# または一括更新
pnpm exec tsx scripts/check-song-length.ts --batch '[{"id":"...","end":"4:15"},{"id":"...","markOk":true}]'
```

### ステップ 4: 完了報告
補正・承認した楽曲の一覧（旧尺 ➔ 新尺、判定理由）を端的にまとめてユーザーへ報告します。

