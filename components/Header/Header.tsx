import Link from 'next/link';
import { memo } from 'react';
import { MdMusicNote, MdInfoOutline } from 'react-icons/md';
import { ActiveLink } from '../ActiveLink/ActiveLink';
import styles from './Header.module.scss';

export const Header = memo(function Header() {
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
            href="/singing-streams"
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
