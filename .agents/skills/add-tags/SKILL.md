---
name: add-tags
description: >-
  Jev (TypeSafe AI) を使用して楽曲のムード（ballad, emotional, cool, bright, jazz_rnb）、ジャンル（vocaloid, anime, jpop, nostalgic, vtuber）、夜曲適性（song_metadata）を自動判定・登録するワークフロー。
  ユーザーが「タグを追加して」「未タグの曲を判定して」「Jevでタグ付けして」「/add-tags」と依頼した際に使用する。
---

# 楽曲タグ追加スキル (add-tags)

TypeSafe AI の Jev エンジン（System 1 / System 2）を活用し、楽曲のタイトルとアーティスト情報からムード・ジャンル・深夜適性を瞬時に分類判定し、Supabase の `song_metadata` テーブルへ登録するワークフローです。
未タグの楽曲を自動検出し、余計な途中確認を挟まず自律的にタグ付けバッチを実行します。

---

## 判定されるメタデータ項目

Jev の質問設計により、以下の 3 系統のメタデータが数値信頼度（confidence / noul）と共に生成されます：

1. **ムード (`mood`)**:
   - `ballad`: しっとり・バラード・静か・落ち着いた雰囲気（夜に聴きたい）
   - `emotional`: エモい・切ない・ドラマチック・心に深く響く
   - `cool`: クール・かっこいい・力強い・ロック・スタイリッシュ
   - `bright`: 明るい・ポップ・楽しい・前向き・テンションが上がる
   - `jazz_rnb`: おしゃれ・大人・ジャジー・グルーヴィー
2. **ジャンル (`genre`)**:
   - `vocaloid`: ボカロ曲（VOCALOID・ボカロP制作楽曲）
   - `anime`: アニソン（アニメ主題歌・劇場版タイアップ曲等）
   - `jpop`: J-POP / J-ROCK / 邦楽アーティスト一般
   - `nostalgic`: 歌謡曲 / シティポップ / 昭和・平成レトロ名曲
   - `vtuber`: VTuberオリジナルソング / バーチャルシンガー楽曲
3. **夜曲適性 (`is_night_pick`)**:
   - 夜や深夜に静かにリラックスして聴くのに適しているか（確率 50% 以上で `true`）

---

## 実行ワークフロー（完全自律実行）

### 1. 前提確認
- ローカルの `.env.local` に `TYPESAFE_API_KEY` および `SUPABASE_SERVICE_ROLE_KEY` が設定されていることを確認する。

### 2. 未タグ楽曲の確認
Supabase MCP ツール（`execute_sql`）を使用して、未タグの曲数を確認する：
```sql
SELECT 
  (SELECT count(*) FROM public.song) AS total_songs,
  (SELECT count(*) FROM public.song_metadata) AS tagged_songs,
  (SELECT count(*) FROM public.song s WHERE NOT EXISTS (SELECT 1 FROM public.song_metadata m WHERE m.song_id = s.id)) AS untagged_songs;
```

### 3. バッチ判定スクリプトの実行

#### パターンA: 通常実行（未タグの楽曲のみを順次判定）
既に `song_metadata` に存在する曲は自動的にスキップされ、**未タグの曲だけを対象に高速処理**されます。
```bash
pnpm exec tsx --env-file=.env.local scripts/tag-all-songs.ts
```

#### パターンB: 全曲再判定・上書き（--force）
既存のメタデータも含め、全曲を再判定して最新の結果で上書きしたい場合：
```bash
pnpm exec tsx --env-file=.env.local scripts/tag-all-songs.ts --force
```

#### パターンC: 件数制限付き実行（--limit <件数>）
テストとして数件だけ実行したい場合や、段階的にバッチを回したい場合：
```bash
pnpm exec tsx --env-file=.env.local scripts/tag-all-songs.ts --limit 10
```

---

## 完了報告

スクリプト完了後、以下のサマリーを端的にユーザーへ報告します：
- 処理楽曲数（判定・保存件数、スキップ件数、エラー件数）
- 新たにタグ付けされた主要な楽曲の例（数件ピックアップ）
