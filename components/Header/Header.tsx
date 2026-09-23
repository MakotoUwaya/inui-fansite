import Link from 'next/link';
import { memo } from 'react';
import { ActiveLink } from '../ActiveLink/ActiveLink';
import styles from './Header.module.scss';

export const Header = memo(function Header() {
  return (
    <header className={styles.root}>
      <div className={styles.container}>
        {/* ブランドロゴ */}
        <Link href="/">
          <a className={styles.brand}>
            <span className={styles.brandIcon}>🍹</span>
            <span className={styles.brandName}>inui.fans</span>
          </a>
        </Link>

        {/* ナビゲーションメニュー */}
        <nav className={styles.nav}>
          <ActiveLink href="/singing-streams" className={styles.link} activeClassName={styles.activeLink}>
            楽曲一覧
          </ActiveLink>
          <ActiveLink
            href="/singing-streams?filter=night"
            className={styles.link}
            activeClassName={styles.activeLink}
          >
            🌙 今夜の曲
          </ActiveLink>
          <ActiveLink
            href="/singing-streams?filter=collab"
            className={styles.link}
            activeClassName={styles.activeLink}
          >
            👥 コラボ
          </ActiveLink>
          <ActiveLink href="/about" className={`${styles.link} ${styles.aboutLink}`} activeClassName={styles.activeLink}>
            About
          </ActiveLink>
        </nav>
      </div>
    </header>
  );
});
