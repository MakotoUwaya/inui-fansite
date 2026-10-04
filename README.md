# inui.fans 🍹

> **推しの元動画に再生数を還元しながら、聴きたい歌唱シーンをワンクリックでシーク再生できる、VTuber（戌亥とこ中心）の歌枠アーカイブファンサイト**

本番サイト: [https://inui-fansite.mukwty.com/singing-streams](https://inui-fansite.mukwty.com/singing-streams)

---

## 🎯 コンセプト・目的

「歌部分だけを切り抜いて聴くのではなく、**元動画を直接再生して推しに再生数をしっかり還元しながら、ストレスなく聴きたい瞬間にアクセスしたい**」という想いから生まれたファンサイトです。

YouTube 公式の IFrame Player API を利用し、アーカイブの歌唱開始位置へピンポイントでジャンプ再生します。動画データの無断再配信等は一切行わず、すべての視聴が公式元動画の再生数・収益に繋がります。

## ✨ 主な機能

- **ワンクリック即再生**: 歌枠動画の開始位置へピンポイントでジャンプ再生
- **常駐バックグラウンド再生**: 別のページ（楽曲一覧やホーム等）へ遷移しても音声が途切れず、フッタープレイヤーでシームレスに操作・視聴を継続
- **歌い手ごとの専用一覧**: 戌亥とこをはじめ、各ライバーやコラボごとの楽曲一覧・絞り込み
- **気分・ジャンル別フィルター**: バラード、ロック、深夜の作業用などのプリセット選曲
- **全曲モード**: 登録されている全ライバーのアーカイブを網羅的にブラウズ
- **外部アプリ連携 (NijiViewer)**: にじさんじ総合ビューワー「NijiViewer」と相互リンクし、ライバー個別ページと歌枠楽曲一覧をスムーズに行き来可能

## 🙏 クレジット・謝辞 (Credits)

当サイトは、[qisarazu](https://github.com/qisarazu) 氏が開発・公開された風真いろは非公式ファンサイト（[iroha-fansite](https://github.com/qisarazu/iroha-fansite)）の素晴らしい設計と実装をベースにカスタマイズした非公式フォーク（Unofficial Fork）です。

開発者 qisarazu 氏の解説記事（[Zenn](https://zenn.dev/qisarazu/articles/e8617817b4b365)）にある以下のコンセプトに深く共感し、本サイトの構築・運営を行っています。画期的な仕組みを生み出してくださった元作者様に心より敬意と感謝を表します。

> “歌部分だけを編集で切り抜いて聴くという手もありますが
> それだと元動画へ再生数がいかないので推しに対して申し訳ない。。
> 
> これは元動画を再生しつついい感じに曲を聴けたらいいなという自分の願望を叶えたものです”

## 🛠 技術スタック

- **Framework**: Next.js (Pages Router), TypeScript
- **Styling**: SCSS Modules
- **Database / Backend**: Supabase
- **Testing**: Vitest, React Testing Library
- **Player API**: YouTube IFrame Player API
- **Icons**: react-icons (Material Design Icons / Simple Icons)
- **Package Manager**: pnpm

## 📄 免責事項 (Disclaimer)

当サイトはファンによって運営されている**非公式ファンサイト**です。
ANYCOLOR株式会社および所属ライバーとは一切関係ありません。
