import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { GlobalPlayer } from '../components/GlobalPlayer/GlobalPlayer';
import { YTPlayerContextProvider } from '../contexts/ytplayer';
import '../styles/global.scss';

export default function MyApp({ Component, pageProps }: AppProps) {
  // PWA Service Worker の登録
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
      });
    }
  }, []);

  return (
    <YTPlayerContextProvider>
      <Component {...pageProps} />
      <GlobalPlayer />
    </YTPlayerContextProvider>
  );
}
