import Script from 'next/script';
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

type YTPlayerContext = {
  player: YT.Player | null;
  scriptLoaded: boolean;
  apiReady: boolean;
  setYTPlayer: (mountId: string, options?: ConstructorParameters<typeof YT.Player>[1]) => void;
  unmountYTPlayer: () => void;
};

export const YTPlayerContext = createContext<YTPlayerContext>({} as YTPlayerContext);

export function YTPlayerContextProvider({ children }: { children: ReactNode }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [player, setPlayer] = useState<YTPlayerContext['player']>(null);

  const playerRef = useRef<YT.Player | null>(null);

  const onScriptLoad = useCallback(() => {
    setScriptLoaded(true);
  }, []);

  const onPlayerReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const setYTPlayer = useCallback(
    (mountId: string, options?: ConstructorParameters<typeof YT.Player>[1]) => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
      const newPlayer = new YT.Player(mountId, {
        ...options,
        events: {
          ...options?.events,
          onReady: onPlayerReady,
        },
      });
      playerRef.current = newPlayer;
      setPlayer(newPlayer);
    },
    [onPlayerReady],
  );

  useEffect(() => {
    if (scriptLoaded) {
      window.onYouTubeIframeAPIReady = () => {
        setApiReady(true);
      };
    }
  }, [scriptLoaded]);

  const unmountYTPlayer = useCallback(() => {
    setPlayerReady(false);
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    }
    setPlayer(null);
  }, []);

  return (
    <YTPlayerContext.Provider
      value={{ player: playerReady ? player : null, scriptLoaded, apiReady, setYTPlayer, unmountYTPlayer }}
    >
      {children}
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" onLoad={onScriptLoad} />
    </YTPlayerContext.Provider>
  );
}
