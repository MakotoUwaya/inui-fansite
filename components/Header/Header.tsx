import Link, { type LinkProps } from 'next/link';
import { memo, useContext, useMemo } from 'react';
import { MdMusicNote, MdInfoOutline } from 'react-icons/md';
import { YTPlayerContext } from '../../contexts/ytplayer';
import { ActiveLink } from '../ActiveLink/ActiveLink';
import styles from './Header.module.scss';

export const Header = memo(function Header() {
  const { currentStream, filterOptions } = useContext(YTPlayerContext);

  // 再生中の絞り込み条件（歌い手、キーワード、フィルター）を引き継いだ楽曲一覧リンク
  const singingStreamsHref = useMemo<LinkProps['href']>(() => {
    if (!currentStream) return '/singing-streams';

    const query: Record<string, string> = {};
    if (filterOptions.singer) {
      query.singer = filterOptions.singer;
    }
    if (filterOptions.keyword) {
      query.keyword = filterOptions.keyword;
    }
    if (filterOptions.filter && filterOptions.filter !== 'all') {
      query.filter = filterOptions.filter;
    }

    return Object.keys(query).length > 0 ? { pathname: '/singing-streams', query } : '/singing-streams';
  }, [currentStream, filterOptions]);

  return (
    <header className={styles.root}>
      <div className={styles.container}>
        {/* ブランドロゴ */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}>🍹</span>
          <span className={styles.brandName}>inui.fans</span>
        </Link>

        {/* ナビゲーションメニュー */}
        <nav className={styles.nav}>
          <ActiveLink
            href={singingStreamsHref}
            className={styles.iconLink}
            activeClassName={styles.activeIconLink}
            aria-label="楽曲一覧"
            title="楽曲一覧"
          >
            <MdMusicNote className={styles.navIcon} />
          </ActiveLink>
          <ActiveLink
            href="/about"
            className={styles.iconLink}
            activeClassName={styles.activeIconLink}
            aria-label="About"
            title="About"
          >
            <MdInfoOutline className={styles.navIcon} />
          </ActiveLink>
        </nav>
      </div>
    </header>
  );
});
