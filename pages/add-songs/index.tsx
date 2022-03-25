import { Layout } from '../../components/Layout/Layout';
import styles from './index.module.scss';

function AboutPage() {
  return (
    <Layout className={styles.root} title="曲登録">
      <h1 className={styles.title}>曲登録</h1>
      <section className={styles.section}>
        <h2 className={styles.subtitle}>タイムテーブル一括登録</h2>
        <p>
          歌枠動画のタイムテーブルを貼り付けると、開始時刻と曲名が登録されます。
        </p>
        <textarea className={styles.timetable} />
      </section>
    </Layout>
  );
}

export default AboutPage;
