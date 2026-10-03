import clsx from 'clsx';
import { memo, useEffect, useRef, useState } from 'react';
import { useFloating, offset, autoUpdate } from '@floating-ui/react';
import { useSlider } from './useSlider';

import styles from './Slider.module.scss';

type Props = {
  className?: string;
  value?: number;
  min?: number;
  max?: number;
  label?: (value: number) => string | number;
  labelDisplay?: boolean;
  onScrub?: (value: number) => void;
};

export const Slider = memo(function Slider({
  className,
  value: valueProp,
  min,
  max,
  label,
  labelDisplay = false,
  onScrub,
}: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isLabelDisplay, setLabelDisplay] = useState(false);
  const { isSliding, value, posX } = useSlider(sliderRef, { value: valueProp, min, max, onScrub });

  const { refs, floatingStyles, update } = useFloating({
    placement: 'top',
    middleware: [offset(4)],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    setLabelDisplay(labelDisplay && isSliding);
  }, [isSliding, labelDisplay]);

  useEffect(() => {
    update();
  }, [posX, update]);

  return (
    <>
      <div className={clsx(styles.root, className)} ref={sliderRef}>
        <div className={styles.rail} />
        <div className={clsx(styles.track, styles.sliding)} style={{ width: `${posX}%` }} />
        <div
          className={clsx(styles.thumb, isSliding && styles.active)}
          style={{ left: `${posX}%` }}
          ref={refs.setReference}
        >
          <input className={styles.input} type="range" min={0} max={1} defaultValue={value} />
        </div>
      </div>
      {isLabelDisplay ? (
        <div className={styles.label} style={floatingStyles} ref={refs.setFloating}>
          {label ? label(value) : value}
        </div>
      ) : null}
    </>
  );
});
