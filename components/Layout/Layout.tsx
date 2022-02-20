import clsx from 'clsx';
import Head from 'next/head';
import { memo, ReactNode } from 'react';
import { Header } from '../Header/Header';
import styles from './Layout.module.scss';

type Props = {
  className?: string;
  title: string;
  description?: string;
  padding?: 'all' | 'vertical' | 'horizontal' | 'none';
  children: ReactNode;
};

const DEFAULT_DESCRIPTION = 'inui.fans は非公式ファンサイトです。';

export const Layout = memo(function Layout({ className, title, description, padding = 'all', children }: Props) {
  return (
    <>
      <Head>
        <title>{title} | inui.fans</title>
        <meta name="description" content={description ?? DEFAULT_DESCRIPTION} />
      </Head>
      <div>
        <Header />
        <section className={clsx(styles.root, className, { [styles[padding]]: padding !== 'none' })}>{children}</section>
      </div>
    </>
  );
});
