import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import type { SingingStreamForSearch } from '../../types';
import { KebabMenu } from '../KebabMenu/KebabMenu';
import styles from './SingingStreamMediaObject.module.scss';
import { ExternalLink } from '../ExternalLink/ExternalLink';
import { useIsMobile } from '../../hooks/useIsMobile';

type Props = {
  singingStream: SingingStreamForSearch;
};

export const SingingStreamMediaObject = memo(function SingingStreamMediaObject({ singingStream }: Props) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const watchHref = useMemo(() => {
    const query: Record<string, string> = { v: singingStream.id };
    if (router.query.filter && typeof router.query.filter === 'string') {
      query.filter = router.query.filter;
    }
    if (router.query.singer && typeof router.query.singer === 'string') {
      query.singer = router.query.singer;
    }
    if (router.query.keyword && typeof router.query.keyword === 'string') {
      query.keyword = router.query.keyword;
    }
    return { pathname: '/singing-streams/watch', query };
  }, [singingStream.id, router.query]);

  return (
    <article className={styles.root}>
      <Link href={watchHref} className={styles.thumbnail}>
        <Image
          src={`https://i.ytimg.com/vi/${singingStream.video_id}/hqdefault.jpg`}
          alt={singingStream.video.title}
          fill
          sizes="(max-width: 768px) 120px, 160px"
          style={{ objectFit: 'cover' }}
        />
      </Link>
      <div className={styles.info}>
        <Link href={watchHref} className={styles.infoLink}>
          <div className={styles.song}>
            <h2 className={styles.songTitle}>{singingStream.song.title}</h2>
            <span className={styles.songArtist}>{singingStream.song.artist}</span>
          </div>
          <span className={styles.videoTitle}>{singingStream.video.title}</span>
          <div className={styles.tags}>
            {singingStream.singers && singingStream.singers.length > 0 && (
              <span className={`${styles.tag} ${styles.tagSinger}`}>
                <span className={styles.tagIcon}>{singingStream.singers.length > 1 ? '👥' : '🎤'}</span>
                <span className={styles.singerText}>{singingStream.singers.join(' / ')}</span>
              </span>
            )}
            {singingStream.song.song_metadata && (
              <>
                {singingStream.song.song_metadata.is_night_pick && (
                  <span className={`${styles.tag} ${styles.tagNight}`}>🌙 夜におすすめ</span>
                )}
                {singingStream.song.song_metadata.genre && (
                  <span className={`${styles.tag} ${styles.tagGenre}`}>
                    #{singingStream.song.song_metadata.genre === 'anime' ? 'アニソン' :
                      singingStream.song.song_metadata.genre === 'vocaloid' ? 'ボカロ' :
                      singingStream.song.song_metadata.genre === 'nostalgic' ? 'レトロ' :
                      singingStream.song.song_metadata.genre === 'vtuber' ? 'VTuber' : 'J-POP'}
                  </span>
                )}
                {singingStream.song.song_metadata.mood && (
                  <span className={`${styles.tag} ${styles.tagMood}`}>
                    {singingStream.song.song_metadata.mood === 'ballad' ? 'バラード' :
                     singingStream.song.song_metadata.mood === 'emotional' ? 'エモい' :
                     singingStream.song.song_metadata.mood === 'cool' ? 'クール' :
                     singingStream.song.song_metadata.mood === 'bright' ? 'ポップ' : 'ジャジー'}
                  </span>
                )}
              </>
            )}
          </div>
        </Link>
        <span className={styles.publishedAt}>{format(new Date(singingStream.published_at), 'yyyy/MM/dd')} 配信</span>
      </div>
      <KebabMenu
        buttonClassName={styles.menu}
        placement="bottom-end"
        aria-label="動画メニュー"
        size={isMobile ? 'small' : 'medium'}
      >
        <ExternalLink className={styles.originalLink} href={`${singingStream.video.url}&t=${singingStream.start}`}>
          YouTubeで見る
        </ExternalLink>
      </KebabMenu>
    </article>
  );
});
