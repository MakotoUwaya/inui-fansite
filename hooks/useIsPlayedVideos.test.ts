import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { addMilliseconds } from 'date-fns';
import { renderHook, act } from '@testing-library/react';
import { useIsPlayedVideos, VALID_TIME } from './useIsPlayedVideos';

describe('useIsPlayedVideos', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('有効日数以内であれば true が返る', () => {
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
    const { result } = renderHook(() => useIsPlayedVideos());
    act(() => {
      result.current.addPlayedVideo('videoId');
    });

    // 同日
    expect(result.current.isPlayedVideo('videoId')).toBe(true);

    // 有効時間内
    vi.setSystemTime(addMilliseconds(new Date('2020-01-01T00:00:00.000Z'), VALID_TIME));
    expect(result.current.isPlayedVideo('videoId')).toBe(true);

    // 有効時間を過ぎている
    vi.setSystemTime(addMilliseconds(new Date('2020-01-01T00:00:00.000Z'), VALID_TIME + 1));
    expect(result.current.isPlayedVideo('videoId')).toBe(false);
  });
});

