import clsx from 'clsx';
import { Reorder } from 'framer-motion';
import { useRouter } from 'next/router';
import { memo, useEffect, useMemo, useRef } from 'react';
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
  const containerRef = useRef<HTMLUListElement>(null);
  const scrolledStreamIdRef = useRef<string | null>(null);

  const currentStreamId = useMemo(() => {
    const id = router.query.v;
    if (typeof id !== 'string') return '';
    return streams.find((stream) => stream.id === id)?.id || '';
  }, [router, streams]);

  useEffect(() => {
    if (!isVisible || !currentStreamId || !containerRef.current) return;

    // 既にこの曲に対してスクロール済みなら、ユーザーの手動スクロールを妨げないようスキップ
    if (scrolledStreamIdRef.current === currentStreamId) return;

    // レンダリング完了後に確実に要素位置を取得してスクロール
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const activeElement = container.querySelector<HTMLElement>('[data-playing="true"]');
      if (!activeElement) return;

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
    }, 60);

    return () => clearTimeout(timer);
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
