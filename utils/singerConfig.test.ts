import {
  DEFAULT_SINGER,
  ALL_SINGERS_KEY,
  getSingerIcon,
  resolveCurrentSinger,
  getSingersWithCount,
} from './singerConfig';
import type { SingingStreamForSearch } from '../types';

describe('singerConfig', () => {
  describe('constants', () => {
    it('DEFAULT_SINGER should be 戌亥とこ', () => {
      expect(DEFAULT_SINGER).toBe('戌亥とこ');
    });

    it('ALL_SINGERS_KEY should be all', () => {
      expect(ALL_SINGERS_KEY).toBe('all');
    });
  });

  describe('getSingerIcon', () => {
    it('returns known emoji for registered singers', () => {
      expect(getSingerIcon('戌亥とこ')).toBe('🍹');
      expect(getSingerIcon('Elira Pendora')).toBe('🪶');
      expect(getSingerIcon('珠乃井ナナ')).toBe('💎');
      expect(getSingerIcon('長尾景')).toBe('⚔️');
    });

    it('returns fallback emoji for unknown singer', () => {
      expect(getSingerIcon('未知のライバー')).toBe('🎤');
    });
  });

  describe('resolveCurrentSinger', () => {
    it('returns DEFAULT_SINGER when query is undefined or empty', () => {
      expect(resolveCurrentSinger(undefined)).toBe('戌亥とこ');
      expect(resolveCurrentSinger('')).toBe('戌亥とこ');
    });

    it('returns all when query is all', () => {
      expect(resolveCurrentSinger('all')).toBe('all');
    });

    it('returns specified singer name', () => {
      expect(resolveCurrentSinger('Elira Pendora')).toBe('Elira Pendora');
      expect(resolveCurrentSinger('珠乃井ナナ')).toBe('珠乃井ナナ');
    });

    it('handles string array from router query', () => {
      expect(resolveCurrentSinger(['珠乃井ナナ', 'その他'])).toBe('珠乃井ナナ');
    });
  });

  describe('getSingersWithCount', () => {
    const mockStreams: SingingStreamForSearch[] = [
      {
        id: '1',
        start: 0,
        video_id: 'v1',
        published_at: '2024-01-01',
        singers: ['戌亥とこ'],
        song: { title: 'Song 1', artist: 'Artist 1' },
        video: { title: 'Stream 1', url: 'https://youtube.com/v1' },
      },
      {
        id: '2',
        start: 60,
        video_id: 'v1',
        published_at: '2024-01-01',
        singers: ['戌亥とこ', '長尾景'],
        song: { title: 'Song 2', artist: 'Artist 2' },
        video: { title: 'Stream 1', url: 'https://youtube.com/v1' },
      },
      {
        id: '3',
        start: 120,
        video_id: 'v2',
        published_at: '2024-01-02',
        singers: ['Elira Pendora'],
        song: { title: 'Song 3', artist: 'Artist 3' },
        video: { title: 'Stream 2', url: 'https://youtube.com/v2' },
      },
      {
        id: '4',
        start: 180,
        video_id: 'v2',
        published_at: '2024-01-02',
        singers: ['Elira Pendora'],
        song: { title: 'Song 4', artist: 'Artist 4' },
        video: { title: 'Stream 2', url: 'https://youtube.com/v2' },
      },
      {
        id: '5',
        start: 240,
        video_id: 'v2',
        published_at: '2024-01-02',
        singers: ['Elira Pendora'],
        song: { title: 'Song 5', artist: 'Artist 5' },
        video: { title: 'Stream 2', url: 'https://youtube.com/v2' },
      },
      {
        id: '6',
        start: 300,
        video_id: 'v3',
        published_at: '2024-01-03',
        singers: ['SUPPORTED BY DAM'], // 除外対象ノイズ
        song: { title: 'Noise', artist: 'Noise' },
        video: { title: 'Stream 3', url: 'https://youtube.com/v3' },
      },
    ];

    it('returns empty array when streams is null or empty', () => {
      expect(getSingersWithCount(null)).toEqual([]);
      expect(getSingersWithCount([])).toEqual([]);
    });

    it('counts songs by singer and always places DEFAULT_SINGER first', () => {
      const result = getSingersWithCount(mockStreams);

      // 戌亥とこ (2曲) が最優先で先頭
      expect(result[0].name).toBe('戌亥とこ');
      expect(result[0].count).toBe(2);
      expect(result[0].icon).toBe('🍹');
      expect(result[0].isDefault).toBe(true);

      // 次に曲数の多い Elira Pendora (3曲)
      expect(result[1].name).toBe('Elira Pendora');
      expect(result[1].count).toBe(3);
      expect(result[1].icon).toBe('🪶');

      // 次に 長尾景 (1曲)
      expect(result[2].name).toBe('長尾景');
      expect(result[2].count).toBe(1);
      expect(result[2].icon).toBe('⚔️');

      // ノイズタグは除外されること
      expect(result.some((s) => s.name === 'SUPPORTED BY DAM')).toBe(false);
    });
  });
});
