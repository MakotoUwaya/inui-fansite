import clsx from 'clsx';
import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import { ComponentPropsWithoutRef, memo } from 'react';

type Props = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: LinkProps['href'];
  activeClassName: string;
};

export const ActiveLink = memo(function ActiveLink({ className, activeClassName, href, ...props }: Props) {
  const router = useRouter();
  const targetPathname = typeof href === 'string' ? href.split('?')[0] : href.pathname;
  const isActive = router.pathname === targetPathname;

  return (
    <Link href={href} className={clsx(className, { [activeClassName]: isActive })} {...props} />
  );
});
