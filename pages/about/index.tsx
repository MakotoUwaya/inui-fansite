import { MdPlayArrow, MdPeople, MdGraphicEq, MdSmartDisplay, MdFavorite } from 'react-icons/md';
import { SiGithub, SiZenn } from 'react-icons/si';
import { ExternalLink } from '../../components/ExternalLink/ExternalLink';
import { Layout } from '../../components/Layout/Layout';
import styles from './index.module.scss';

function AboutPage() {
  return (
    <Layout className={styles.root} title="当サイトについて">
      {/* ページタイトルヘッダー */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>当サイトについて</h1>
        <p className={styles.pageSubtitle}>
          inui.fans は、VTuberの歌枠アーカイブをより快適に楽しむための非公式ファンサイトです。
        </p>
      </div>

      {/* サイトでできること */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>サイトでできること</h2>
          <p className={styles.sectionSubtitle}>
            膨大な歌枠アーカイブの中から、あなたの「今聴きたい」をスマートにサポート
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBox} ${styles.iconDirect}`}>
              <MdPlayArrow />
            </div>
            <h3 className={styles.featureCardTitle}>ワンクリック即再生</h3>
            <p className={styles.featureCardDesc}>
              歌枠動画の開始位置へピンポイントでジャンプ。見たい曲の歌唱シーンを待たずにすぐに楽しめます。
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBox} ${styles.iconSingers}`}>
              <MdPeople />
            </div>
            <h3 className={styles.featureCardTitle}>歌い手ごとの専用一覧</h3>
            <p className={styles.featureCardDesc}>
              戌亥とこをはじめ、各ライバーごとに整理されたスッキリ見やすい楽曲リストから探せます。
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIconBox} ${styles.iconAi}`}>
              <MdGraphicEq />
            </div>
            <h3 className={styles.featureCardTitle}>気分・ムードから探せる</h3>
            <p className={styles.featureCardDesc}>
              「しっとりバラード」「クール・ロック」「深夜の作業用」など、雰囲気やジャンルで直感的に曲を探せます。
            </p>
          </div>
        </div>
      </section>

      {/* YouTube動画の再生について */}
      <section className={styles.youtubeSection}>
        <div className={styles.youtubeCard}>
          <div className={styles.youtubeCardHeader}>
            <div className={styles.youtubeIconBox}>
              <MdSmartDisplay />
            </div>
            <div className={styles.youtubeCardTitleGroup}>
              <h2 className={styles.youtubeCardTitle}>当サイト上でのYouTube動画の再生について</h2>
              <span className={styles.youtubeBadge}>YouTube IFrame Player API</span>
            </div>
          </div>
          <div className={styles.youtubeCardBody}>
            <p className={styles.youtubeCardText}>
              当サイトでは、YouTube が公式に提供している <b>IFrame Player API</b> を利用し、すべて元動画の公式プレーヤーを通じて直接再生しています。
            </p>
            <p className={styles.youtubeCardText}>
              動画データ自体の無断保存・再配信等は一切行っておりません。再生による視聴回数や広告収入等は、公式の元動画配信者様および著作権者様へ還元されます。
            </p>
            <div className={styles.youtubeCardActions}>
              <ExternalLink
                className={styles.apiLinkButton}
                href="https://developers.google.com/youtube/iframe_api_reference"
              >
                YouTube IFrame Player API Reference
              </ExternalLink>
            </div>
          </div>
        </div>
      </section>

      {/* ベースプロジェクト・クレジット */}
      <section className={styles.creditsSection}>
        <div className={styles.creditsCard}>
          <div className={styles.creditsCardHeader}>
            <div className={styles.creditsIconBox}>
              <MdFavorite />
            </div>
            <div className={styles.creditsCardTitleGroup}>
              <h2 className={styles.creditsCardTitle}>ベースプロジェクト・謝辞 (Credits)</h2>
              <span className={styles.creditsBadge}>Unofficial Fork</span>
            </div>
          </div>

          <div className={styles.creditsCardBody}>
            <p className={styles.creditsCardText}>
              当サイトは、qisarazu 氏によって開発・公開された風真いろは非公式ファンサイト（
              <ExternalLink className={styles.textLink} href="https://github.com/qisarazu/iroha-fansite">
                iroha-fansite
              </ExternalLink>
              ）の素晴らしい設計と実装をベースに、戌亥とこおよび仲間たちの歌枠向けにカスタマイズした非公式フォーク（Unofficial Fork）です。
            </p>

            <div className={styles.quoteBox}>
              <div className={styles.quoteHeader}>開発者 qisarazu 氏の解説記事より引用：</div>
              <blockquote className={styles.quoteText}>
                “歌部分だけを編集で切り抜いて聴くという手もありますが
                <br />
                それだと元動画へ再生数がいかないので推しに対して申し訳ない。。
                <br />
                <br />
                これは元動画を再生しつついい感じに曲を聴けたらいいなという自分の願望を叶えたものです”
              </blockquote>
            </div>

            <p className={styles.creditsCardText}>
              「推しの元動画にしっかり再生数を還元しながら、ストレスなく聴きたい瞬間にアクセスできる環境をつくりたい」というこの熱い想いとコンセプトに深く共感し、本サイトの構築・運営を行っています。素晴らしい仕組みを生み出してくださった元作者様に心より感謝申し上げます。
            </p>

            <div className={styles.creditsActions}>
              <ExternalLink
                className={styles.creditLinkButton}
                href="https://github.com/qisarazu/iroha-fansite"
              >
                <SiGithub className={styles.buttonBrandIcon} />
                <span>qisarazu / iroha-fansite</span>
              </ExternalLink>
              <ExternalLink
                className={styles.creditLinkButton}
                href="https://zenn.dev/qisarazu/articles/e8617817b4b365"
              >
                <SiZenn className={styles.buttonBrandIcon} />
                <span>開発解説記事（Zenn）</span>
              </ExternalLink>
            </div>
          </div>
        </div>
      </section>

      {/* 免責事項 */}
      <section className={styles.disclaimerSection}>
        <p>
          当サイトはファンによって運営されている<b>非公式ファンサイト</b>です。
          ANYCOLOR株式会社および所属ライバーとは一切関係ありません。
        </p>
      </section>
    </Layout>
  );
}

export default AboutPage;
