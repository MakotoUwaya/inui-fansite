import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  MdPlayArrow,
  MdPeople,
  MdMusicNote,
  MdGraphicEq,
} from 'react-icons/md';
import { Layout } from '../components/Layout/Layout';
import { useSingingStreamsForSearch } from '../hooks/singing-stream';
import {
  DEFAULT_SINGER,
  ALL_SINGERS_KEY,
  getSingersWithCount,
  getSingerAvatar,
} from '../utils/singerConfig';
import { FILTER_PRESETS } from '../utils/songMetadata';
import styles from './index.module.scss';

function IndexPage() {
  const { streams } = useSingingStreamsForSearch();

  // 歌い手ごとの楽曲数サマリー
  const singerSummaries = useMemo(() => getSingersWithCount(streams), [streams]);
  const totalSongCount = streams ? streams.length : 0;

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
            歌い手を選んで、今すぐお気に入りの歌枠を楽しもう。
          </p>
        </div>
      </section>

      <div className={styles.mainContainer}>
        {/* メイン導線: 歌い手から探す (Singers Grid) */}
        <section className={styles.singersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MdPeople /> 歌い手から探す
            </h2>
            <p className={styles.sectionSubtitle}>
              歌い手を選択すると、そのライバーの楽曲一覧に直接アクセスできます
            </p>
          </div>

          <div className={styles.singersGrid}>
            {singerSummaries.map((singer) => {
              const isDefault = singer.name === DEFAULT_SINGER;
              const avatarUrl = getSingerAvatar(singer.name);
              return (
                <Link
                  key={singer.name}
                  href={`/singing-streams?singer=${encodeURIComponent(singer.name)}`}
                  className={`${styles.singerCard} ${isDefault ? styles.singerCardFeatured : ''}`}
                >
                  <div className={styles.singerCardVisual}>
                    {avatarUrl ? (
                      <div className={styles.avatarWrapper}>
                        <Image
                          src={avatarUrl}
                          alt={singer.name}
                          width={44}
                          height={44}
                          className={styles.singerCardAvatar}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    ) : (
                      <span className={styles.singerCardIcon}>{singer.icon}</span>
                    )}
                  </div>
                  <div className={styles.singerCardInfo}>
                    <div className={styles.singerCardNameRow}>
                      <h3 className={styles.singerCardName} title={singer.name}>
                        {singer.name}
                      </h3>
                      {isDefault && <span className={styles.featuredBadge}>MAIN</span>}
                    </div>
                    <span className={styles.singerCardCount}>{singer.count} 曲</span>
                  </div>
                </Link>
              );
            })}

            {/* 全曲モードカード */}
            <Link
              href={`/singing-streams?singer=${ALL_SINGERS_KEY}`}
              className={`${styles.singerCard} ${styles.singerCardAll}`}
            >
              <div className={styles.singerCardVisual}>
                <span className={styles.singerCardIcon}>🌐</span>
              </div>
              <div className={styles.singerCardInfo}>
                <h3 className={styles.singerCardName}>すべての歌い手</h3>
                <span className={styles.singerCardCount}>全 {totalSongCount} 曲（全曲モード）</span>
              </div>
            </Link>
          </div>
        </section>

        {/* 気分から探す（トップページでの探索補助） */}
        <section className={styles.categoryNavSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MdMusicNote /> 気分・ジャンルから選ぶ
            </h2>
            <p className={styles.sectionSubtitle}>
              その日の気分やシチュエーションに合わせて選曲
            </p>
          </div>
          <div className={styles.presetGrid}>
            {FILTER_PRESETS.filter((p) => p.id !== 'all').map((preset) => (
              <Link
                key={preset.id}
                href={`/singing-streams?singer=${encodeURIComponent(DEFAULT_SINGER)}&filter=${preset.id}`}
                className={styles.presetCard}
              >
                <span className={styles.presetIcon}>{preset.icon}</span>
                <div className={styles.presetInfo}>
                  <span className={styles.presetLabel}>{preset.label}</span>
                  {preset.description && (
                    <span className={styles.presetDesc}>{preset.description}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 特徴・できること */}
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
