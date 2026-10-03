import clsx from 'clsx';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MdPause, MdPlayArrow } from 'react-icons/md';
import { useFloating, offset, flip, autoUpdate } from '@floating-ui/react';
import { useHovering } from '../../hooks/useHovering';
import { IconButton } from '../IconButton/IconButton';
import styles from './PlayButton.module.scss';

type Props = {
  needNativePlayPush: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
};

export const PlayButton = memo(({ needNativePlayPush, isPlaying, onPlay, onPause }: Props) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [showPopper, setShowPopper] = useState(false);
  const isHovering = useHovering(buttonRef);

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [offset(8), flip()],
    whileElementsMounted: autoUpdate,
  });

  const setButtonRef = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      refs.setReference(node);
    },
    [refs],
  );

  const onPlayClick = useCallback(() => {
    if (needNativePlayPush) {
      setShowPopper(true);
    } else {
      onPlay();
    }
  }, [needNativePlayPush, onPlay]);

  useEffect(() => {
    if (needNativePlayPush && isHovering) {
      setShowPopper(true);
    } else {
      setShowPopper(false);
    }
  }, [isHovering, needNativePlayPush]);

  return (
    <>
      {isPlaying ? (
        <IconButton size="large" aria-label="停止" onClick={onPause} ref={setButtonRef}>
          <MdPause />
        </IconButton>
      ) : (
        <IconButton
          className={clsx(styles.play, { [styles['disabled']]: needNativePlayPush })}
          size="large"
          aria-label="再生"
          onClick={onPlayClick}
          ref={setButtonRef}
        >
          <MdPlayArrow />
        </IconButton>
      )}
      {showPopper ? (
        <div style={floatingStyles} className={styles.tips} ref={refs.setFloating}>
          <p>YouTubeプレイヤーをクリックして</p>
          <p>再生してください</p>
        </div>
      ) : null}
    </>
  );
});
