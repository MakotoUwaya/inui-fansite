import { MdPlayArrow, MdPeople, MdGraphicEq, MdSmartDisplay } from 'react-icons/md';
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
