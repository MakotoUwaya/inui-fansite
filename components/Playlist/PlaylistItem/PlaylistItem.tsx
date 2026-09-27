import clsx from 'clsx';
import { format } from 'date-fns';
import { Reorder } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { memo, useMemo, useRef } from 'react';
import { MdPlayArrow, MdVolumeUp } from 'react-icons/md';
import { useHovering } from '../../../hooks/useHovering';
import type { SingingStreamForSearch } from '../../../types';
import { ExternalLink } from '../../ExternalLink/ExternalLink';
import { KebabMenu } from '../../KebabMenu/KebabMenu';
import styles from './PlaylistItem.module.scss';

type Props = {
  className?: string;
  stream: SingingStreamForSearch;
  isPlaying: boolean;
};

export const PlaylistItem = memo(({ className, stream, isPlaying }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const isHovering = useHovering(ref);
  const router = useRouter();

  const watchHref = useMemo(() => {
    const query: Record<string, string> = { v: stream.id };
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
  }, [stream.id, router.query]);

  return (
    <Reorder.Item
      className={clsx(styles.item, className, isPlaying && styles.itemPlaying)}
      value={stream}
      dragListener={false}
      ref={ref}
      data-playing={isPlaying ? 'true' : 'false'}
    >
      <Link href={watchHref} className={styles.thumbnail}>
        <Image
          alt={stream.song.title}
          src={`https://i.ytimg.com/vi/${stream.video_id}/default.jpg`}
          fill
          sizes="64px"
          style={{ objectFit: 'cover' }}
        />
        {isHovering && !isPlaying ? (
          <div className={styles.hovering}>
            <MdPlayArrow />
          </div>
        ) : null}
        {isPlaying ? (
          <div className={styles.playing}>
            <MdVolumeUp />
          </div>
        ) : null}
      </Link>
      <Link href={watchHref} className={styles.info}>
        <h2 className={styles.songTitle} title={stream.song.title}>
          {stream.song.title}
        </h2>
        <span
          className={styles.songArtist}
          title={`${stream.song.artist} / ${format(new Date(stream.published_at), 'yyyy-MM-dd')} 配信`}
        >
          {stream.song.artist} / {format(new Date(stream.published_at), 'yyyy-MM-dd')} 配信
        </span>
      </Link>
      <KebabMenu buttonClassName={styles.menu} size="small" placement="bottom-end">
        <ExternalLink className={styles.originalLink} href={`${stream.video.url}&t=${stream.start}`}>
          YouTubeで見る
        </ExternalLink>
      </KebabMenu>
    </Reorder.Item>
  );
});
