import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { MdSearch, MdPlayArrow, MdNightlightRound, MdPeople, MdMusicNote, MdGraphicEq } from 'react-icons/md';
import { Layout } from '../components/Layout/Layout';
import { FILTER_PRESETS } from '../utils/songMetadata';
import styles from './index.module.scss';

type SearchForm = {
  keyword: string;
};

function IndexPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<SearchForm>();

  const onSearchSubmit = useCallback(
    (data: SearchForm) => {
      if (data.keyword) {
        router.push({
          pathname: '/singing-streams',
          query: { keyword: data.keyword },
        });
      } else {
        router.push('/singing-streams');
      }
    },
    [router],
  );

  return (
    <Layout className={styles.root} title="ホーム" padding="none">
      {/* ヒーローセクション */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.badgeContainer}>
            <span className={styles.heroBadge}>
              <span className={styles.pulseDot} />
              戌亥とこ 非公式ファンサイト
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            聴きたい歌を、いつでもその瞬間に。
          </h1>

          <p className={styles.heroLead}>
            YouTubeの歌枠アーカイブから、聴きたい楽曲をワンクリックでシーク再生。
            <br />
            気分やジャンル、歌唱メンバーでの絞り込みで、今聴きたい1曲がすぐ見つかります。
          </p>

          {/* クイック検索バー */}
          <form className={styles.searchForm} onSubmit={handleSubmit(onSearchSubmit)}>
            <div className={styles.searchInputWrapper}>
              <MdSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="曲名、原曲アーティスト、歌唱者で検索..."
                {...register('keyword')}
              />
            </div>
            <button className={styles.searchButton} type="submit">
              探す
            </button>
          </form>
        </div>
      </section>

      <div className={styles.mainContainer}>
        {/* 特徴・できること（3大フィーチャー） */}
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
              <div className={`${styles.featureIconBox} ${styles.iconAi}`}>
                <MdGraphicEq />
              </div>
              <h3 className={styles.featureCardTitle}>気分・ムードから探せる</h3>
              <p className={styles.featureCardDesc}>
                「しっとりバラード」「クール・ロック」「明るいポップ」など、雰囲気やジャンルで直感的に曲を探せます。
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIconBox} ${styles.iconSingers}`}>
                <MdPeople />
              </div>
              <h3 className={styles.featureCardTitle}>歌唱者・コラボ別の絞り込み</h3>
              <p className={styles.featureCardDesc}>
                戌亥とこソロはもちろん、長尾景や珠乃井ナナなどコラボ相手ごとに歌唱曲をワンクリックでピックアップ。
              </p>
            </div>
          </div>
        </section>

        {/* 気分から探す（タグクラウド風ナビゲーション） */}
        <section className={styles.categoryNavSection}>
          <h2 className={styles.categoryNavTitle}>
            <MdMusicNote /> 気分・ジャンルから選ぶ
          </h2>
          <div className={styles.presetGrid}>
            {FILTER_PRESETS.filter((p) => p.id !== 'all').map((preset) => (
              <Link key={preset.id} href={`/singing-streams?filter=${preset.id}`}>
                <a className={styles.presetCard}>
                  <span className={styles.presetIcon}>{preset.icon}</span>
                  <div className={styles.presetInfo}>
                    <span className={styles.presetLabel}>{preset.label}</span>
                    {preset.description && (
                      <span className={styles.presetDesc}>{preset.description}</span>
                    )}
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </section>

        {/* フッターアナウンス */}
        <section className={styles.disclaimerSection}>
          <p>
            当サイトはファンによって運営されている<b>非公式ファンサイト</b>です。
            ANYCOLOR株式会社および所属ライバーとは一切関係ありません。
          </p>
        </section>
      </div>
    </Layout>
  );
}

export default IndexPage;
