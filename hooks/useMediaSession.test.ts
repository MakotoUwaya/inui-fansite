import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaSession } from './useMediaSession';
import type { SingingStreamForSearch } from '../types';

describe('useMediaSession', () => {
  const dummyStream: SingingStreamForSearch = {
    id: 'stream-1',
    video_id: 'vid-123',
    start: 60,
    end: 240,
    published_at: '2023-01-01',
    singers: ['戌亥とこ'],
    song: {
      title: 'テストソング',
      artist: 'テストアーティスト',
    },
    video: {
      title: '第1回 歌枠',
      url: 'https://youtube.com/watch?v=vid-123',
    },
  };

  let mockMediaSession: any;

  beforeEach(() => {
    mockMediaSession = {
      metadata: null,
      playbackState: 'none',
      setActionHandler: vi.fn(),
      setPositionState: vi.fn(),
    };

    // global.MediaMetadata のモック
    (global as any).MediaMetadata = class {
      title: string;
      artist: string;
      album: string;
      artwork: any[];
      constructor(init: any) {
        this.title = init.title;
        this.artist = init.artist;
        this.album = init.album;
        this.artwork = init.artwork;
      }
    };

    Object.defineProperty(navigator, 'mediaSession', {
      value: mockMediaSession,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('曲がセットされたときに metadata と playbackState が正しく設定される', () => {
    const play = vi.fn();
    const pause = vi.fn();
    const skipNext = vi.fn();
    const skipPrev = vi.fn();
    const seekTo = vi.fn();

    renderHook(() =>
      useMediaSession({
        currentStream: dummyStream,
        isPlaying: true,
        currentTime: 30,
        duration: 180,
        play,
        pause,
        skipNext,
        skipPrev,
        seekTo,
      }),
    );

    expect(mockMediaSession.metadata).not.toBeNull();
    expect(mockMediaSession.metadata.title).toBe('テストソング');
    expect(mockMediaSession.metadata.artist).toContain('テストアーティスト');
    expect(mockMediaSession.metadata.album).toBe('第1回 歌枠');
    expect(mockMediaSession.playbackState).toBe('playing');
    expect(mockMediaSession.setActionHandler).toHaveBeenCalled();
  });

  test('再生停止時は playbackState が paused になる', () => {
    const play = vi.fn();
    const pause = vi.fn();
    const skipNext = vi.fn();
    const skipPrev = vi.fn();
    const seekTo = vi.fn();

    renderHook(() =>
      useMediaSession({
        currentStream: dummyStream,
        isPlaying: false,
        currentTime: 0,
        duration: 180,
        play,
        pause,
        skipNext,
        skipPrev,
        seekTo,
      }),
    );

    expect(mockMediaSession.playbackState).toBe('paused');
  });

  test('currentStream が null の場合は metadata が null、playbackState が none になる', () => {
    const play = vi.fn();
    const pause = vi.fn();
    const skipNext = vi.fn();
    const skipPrev = vi.fn();
    const seekTo = vi.fn();

    renderHook(() =>
      useMediaSession({
        currentStream: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        play,
        pause,
        skipNext,
        skipPrev,
        seekTo,
      }),
    );

    expect(mockMediaSession.metadata).toBeNull();
    expect(mockMediaSession.playbackState).toBe('none');
  });
});
