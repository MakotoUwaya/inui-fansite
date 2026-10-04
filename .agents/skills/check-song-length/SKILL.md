---
name: check-song-length
description: 歌枠アーカイブに登録された楽曲データのうち、歌唱終了後の長時間の雑談等が含まれて5分（300秒）以上になっている楽曲を抽出し、終了時刻（end）の修正や確認済み登録（is_length_checked）を行うワークフロー。
---

# 楽曲再生時間チェック・修正ワークフロー (check-song-length)

歌枠アーカイブの楽曲データにおいて、タイムスタンプが歌唱終了時刻ではなく次の曲の直前まで設定されているなどの原因で、**歌唱終了後の長時間の雑談部分が含まれてしまっている楽曲**を調査・修正するためのスキルです。

---

## 🎯 目的
- 通常、楽曲の演奏時間は 3分〜5分前後に収まります。
- 5分（300秒）以上、特に10分以上登録されている楽曲は終了時刻（`end`）が誤っている可能性が高いため、適切な終了時刻へ修正します。
- 一度確認・修正した楽曲は `is_length_checked = true` としてマークされ、次回以降の重複チェックを防止します。

---

## 🖥️ ローカル微調整用 Web UI（推奨）

ブラウザ上で動画を再生・試聴しながら、開始時刻・終了時刻を数秒で微調整できるローカル開発限定画面が利用可能です。

```bash
# 開発サーバーを起動
pnpm dev

# ブラウザでアクセス（ローカル環境のみアクセス可能）
# http://localhost:3000/admin/adjust-length
```

- **機能**:
  - 未確認 / 確認済みの切り替え、インクリメンタル検索、曲長順ソート
  - 「歌い出し確認（前3秒から再生）」「歌い終わり確認（前7秒再生して自動停止）」「終了後雑談確認（+5秒再生して自動停止）」
  - 現在の再生位置をワンクリックまたはキーボード `[` / `]` で開始/終了時刻にセット
  - `Ctrl + Enter` で保存して次の曲へ自動遷移（爆速作業）

---

## 🛠️ コマンド一覧（CLI）

すべての操作は `scripts/check-song-length.ts` を通じても行えます。

```bash
# 1. 進捗サマリーの表示（総曲数、5分以上曲数、未チェック曲数）
pnpm exec tsx scripts/check-song-length.ts --stats

# 2. 未チェックの長尺曲を一覧表示（デフォルト: 5分以上、長い順に20件）
pnpm exec tsx scripts/check-song-length.ts --list --limit 10

# しきい値を指定して抽出（例: 10分以上の極長曲）
pnpm exec tsx scripts/check-song-length.ts --list --threshold 10:00 --limit 10

# 特定の動画内の曲に絞り込み
pnpm exec tsx scripts/check-song-length.ts --list --video-id <VIDEO_ID>

# 3. 終了時刻を更新（is_length_checked も自動で true になります）
# 秒数、または MM:SS / HH:MM:SS 形式で指定可能
pnpm exec tsx scripts/check-song-length.ts --update <ID> --end 4:15
pnpm exec tsx scripts/check-song-length.ts --update <ID> --end 255

# 4. 長さは正常として確認済みにマーク（メドレー等で元々長い曲）
pnpm exec tsx scripts/check-song-length.ts --mark-ok <ID>

# 5. Gemini / インテリジェント自動チェック・補正（歌唱区間ダイレクト検出）
pnpm exec tsx scripts/check-song-length.ts --auto-check
# 特定の動画のみ自動チェック
pnpm exec tsx scripts/check-song-length.ts --auto-check --video-id <VIDEO_ID>

# 6. 複数曲の一括更新（JSON配列またはJSONファイル）
pnpm exec tsx scripts/check-song-length.ts --batch '[{"id":"...","end":"4:20"},{"id":"...","markOk":true}]'
```

---

## 📋 調査・修正ワークフロー

### ステップ 1: 現状把握
まずは `--stats` で全体の残り件数を確認します。
```bash
pnpm exec tsx scripts/check-song-length.ts --stats
```

### ステップ 2: 調査対象の抽出
未チェック曲を上位から抽出します。
```bash
pnpm exec tsx scripts/check-song-length.ts --list --limit 5
```
一覧には以下の情報が表示されます：
- 楽曲 ID（UUID）
- 曲名 / アーティスト
- 現在の長さ（MM:SS、秒数）
- 開始時刻 〜 終了時刻
- 動画タイトル / 動画 ID
- 再生リンク（開始位置、および終了直前位置）

### ステップ 3: 正しい終了時刻の調査方法
以下のいずれかの方法で適切な終了時刻（`end`）を調べます：
1. **原曲の公式演奏時間を調査**:
   - Web 検索等で原曲の一般的な演奏時間（例: 3分45秒）を調べ、`開始時刻 + 原曲時間 + 10〜15秒（後奏・余韻）` を推定目安とします。
2. **YouTube 動画のコメント欄・概要欄のタイムスタンプ確認**:
   - 有志コメントのセットリスト記載で次の曲の開始時刻や、実際の歌唱区間が書かれていないか確認します。
3. **ユーザーへの確認**:
   - ユーザーから直接指定された場合はその時刻を採用します。
   - 判定が難しい長尺曲（メドレー等）はユーザーに確認します。

### ステップ 4: 修正の反映
特定した終了時刻を `--update` または `--batch` で反映します。
```bash
pnpm exec tsx scripts/check-song-length.ts --update <ID> --end <新終了時刻>
```
メドレー等で長さが正当な場合は `--mark-ok <ID>` を実行します。

### ステップ 5: 完了確認
再度 `--stats` を実行し、未チェック件数が減少したことを報告します。
