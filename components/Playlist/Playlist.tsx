import clsx from 'clsx';
import { Reorder } from 'framer-motion';
import { useRouter } from 'next/router';
import { memo, useContext, useEffect, useMemo, useRef } from 'react';
import { YTPlayerContext } from '../../contexts/ytplayer';
import type { SingingStreamForSearch } from '../../types';
import styles from './Playlist.module.scss';
import { PlaylistItem } from './PlaylistItem/PlaylistItem';

type Props = {
  className?: string;
  streams: SingingStreamForSearch[];
  isVisible?: boolean;
};

export const Playlist = memo(({ className, streams, isVisible = true }: Props) => {
  const router = useRouter();
  const { currentStreamId: globalStreamId } = useContext(YTPlayerContext);
  const containerRef = useRef<HTMLUListElement>(null);
  const scrolledStreamIdRef = useRef<string | null>(null);

  const currentStreamId = useMemo(() => {
    const id = typeof router.query.v === 'string' ? router.query.v : globalStreamId;
    if (!id) return '';
    return streams.find((stream) => stream.id === id)?.id || '';
  }, [router.query.v, globalStreamId, streams]);

  useEffect(() => {
    if (!isVisible || !currentStreamId || !containerRef.current) return;

    // 既にこの曲に対してスクロール済みなら手動スクロールを妨げないようスキップ
    if (scrolledStreamIdRef.current === currentStreamId) return;

    let retryCount = 0;
    const maxRetries = 10;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const attemptScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const activeElement = container.querySelector<HTMLElement>('[data-playing="true"]');
      if (activeElement) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();

        // コンテナ最上部へのスクロール（パディングに合わせて少し余白を設ける）
        const offset = 8;
        const targetScrollTop = container.scrollTop + (activeRect.top - containerRect.top) - offset;

        const isFirst = scrolledStreamIdRef.current === null;
        scrolledStreamIdRef.current = currentStreamId;

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: isFirst ? 'auto' : 'smooth',
        });
        return;
      }

      // 要素がまだ描画されていない場合はリトライ
      if (retryCount < maxRetries) {
        retryCount += 1;
        timerId = setTimeout(attemptScroll, 60);
      }
    };

    // 初回実行
    timerId = setTimeout(attemptScroll, 50);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentStreamId, streams, isVisible]);

  const onReorder = () => {};

  return (
    <Reorder.Group
      ref={containerRef}
      className={clsx(styles.root, className)}
      axis="y"
      values={streams}
      onReorder={onReorder}
    >
      {streams.map((stream) => (
        <PlaylistItem stream={stream} isPlaying={stream.id === currentStreamId} key={stream.id} />
      ))}
    </Reorder.Group>
  );
});
