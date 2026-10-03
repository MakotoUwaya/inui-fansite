import { memo, useCallback, useState, ComponentPropsWithoutRef } from 'react';
import { MdMoreVert } from 'react-icons/md';
import { useFloating, offset, flip, autoUpdate, Placement } from '@floating-ui/react';
import { useClickAway } from 'react-use';
import { IconButton } from '../IconButton/IconButton';
import styles from './KebabMenu.module.scss';

type Props = Omit<ComponentPropsWithoutRef<typeof IconButton>, 'className'> & {
  buttonClassName?: string;
  menuClassName?: string;
  placement?: Placement;
  children: React.ReactNode;
};

export const KebabMenu = memo(function KebabMenu({
  buttonClassName,
  menuClassName,
  placement,
  children,
  ...buttonProps
}: Props) {
  const [isOpen, setOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [offset(8), flip()],
    whileElementsMounted: autoUpdate,
  });

  useClickAway({ current: refs.floating.current }, (e) => {
    const domRef = refs.domReference.current as HTMLElement | null;
    if (domRef?.contains(e.target as Node)) return;
    setOpen(false);
  });

  const onClick = useCallback(() => {
    setOpen((state) => !state);
  }, []);

  return (
    <>
      <IconButton
        {...buttonProps}
        className={`${styles.button} ${buttonClassName}`}
        onClick={onClick}
        ref={refs.setReference}
      >
        <MdMoreVert color="#ffffff" />
      </IconButton>
      {isOpen ? (
        <div
          className={`${styles.body} ${menuClassName}`}
          style={floatingStyles}
          ref={refs.setFloating}
        >
          {children}
        </div>
      ) : null}
    </>
  );
});
