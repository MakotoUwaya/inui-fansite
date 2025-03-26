import Link from 'next/link';
import { Layout } from '../components/Layout/Layout';
import { useCreateSingingStream } from '../hooks/singing-stream';
import styles from './index.module.scss';

function IndexPage() {
  const { createSingingStream } = useCreateSingingStream();
  return (
    <Layout className={styles.root} title="ホーム">
      <h1 className={styles.title}>inui.fans</h1>
      <div className={styles.message}>
        <p>TOP ページは現在製作中です。</p>
        <button onClick={createSingingStream}>
          データを新規投入
        </button>
        <p>
          <Link href="/singing-streams">
            <a className={styles.link}>歌枠検索</a>
          </Link>{' '}
          をご利用ください !
        </p>
      </div>
      <p>
        inui.fans は<b>非公式</b>ファンサイトです。
      </p>
    </Layout>
  );
}

export default IndexPage;
