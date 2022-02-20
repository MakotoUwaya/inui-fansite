import { ExternalLink } from '../../components/ExternalLink/ExternalLink';
import { Layout } from '../../components/Layout/Layout';
import styles from './index.module.scss';

function AboutPage() {
  return (
    <Layout className={styles.root} title="当サイトについて">
      <h1 className={styles.title}>当サイトについて</h1>
      <section className={styles.section}>
        <h2 className={styles.subtitle}>アクセス解析について</h2>
        <p>
          当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
        </p>
        <p>
          ブラウザの設定にて、Cookie（クッキー）を無効にすることにより、Cookie（クッキー）を利用したデータ収集を無効にすることが可能です。
        </p>
      </section>
      <section className={styles.section}>
        <h2 className={styles.subtitle}>当サイト上でのYouTube動画の再生について</h2>
        <p>当サイトでは、YouTube から提供されている IFrame Player API を利用し、すべて元動画を再生しています。</p>
        <ExternalLink className={styles.link} href="https://developers.google.com/youtube/iframe_api_reference">
          IFrame API reference
        </ExternalLink>
      </section>
    </Layout>
  );
}

export default AboutPage;
