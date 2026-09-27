import { filterStreams } from './songFilter';
import { ALL_SINGERS_KEY } from './singerConfig';
import type { SingingStreamForSearch } from '../types';

describe('songFilter', () => {
  const mockStreams: SingingStreamForSearch[] = [
    {
      id: '1',
      start: 0,
      video_id: 'v1',
      published_at: '2024-01-01',
      singers: ['戌亥とこ'],
      song: {
        title: '小さきもの',
        artist: '林明日香',
        song_metadata: { mood: 'ballad', genre: 'anime', is_night_pick: true },
      },
      video: { title: '歌枠その1', url: 'https://youtube.com/v1' },
    },
    {
      id: '2',
      start: 60,
      video_id: 'v1',
      published_at: '2024-01-01',
      singers: ['戌亥とこ', '長尾景'],
      song: {
        title: '点描の唄',
        artist: 'Mrs. GREEN APPLE',
        song_metadata: { mood: 'emotional', genre: 'jpop', is_night_pick: false },
      },
      video: { title: '歌枠その1', url: 'https://youtube.com/v1' },
    },
    {
      id: '3',
      start: 120,
      video_id: 'v2',
      published_at: '2024-01-02',
      singers: ['Elira Pendora'],
      song: {
        title: 'God knows...',
        artist: '涼宮ハルヒ',
        song_metadata: { mood: 'cool', genre: 'anime', is_night_pick: false },
      },
      video: { title: 'Elira Stream', url: 'https://youtube.com/v2' },
    },
  ];

  it('filters by specific singer', () => {
    const inuiOnly = filterStreams(mockStreams, { singer: '戌亥とこ' });
    expect(inuiOnly).toHaveLength(2);
    expect(inuiOnly.map((s) => s.id)).toEqual(['1', '2']);

    const eliraOnly = filterStreams(mockStreams, { singer: 'Elira Pendora' });
    expect(eliraOnly).toHaveLength(1);
    expect(eliraOnly[0].id).toBe('3');
  });

  it('returns all streams when singer is ALL_SINGERS_KEY (all)', () => {
    const all = filterStreams(mockStreams, { singer: ALL_SINGERS_KEY });
    expect(all).toHaveLength(3);
  });

  it('combines singer filter with keyword search', () => {
    const filtered = filterStreams(mockStreams, {
      singer: '戌亥とこ',
      keyword: '点描',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].song.title).toBe('点描の唄');
  });

  it('filters by mood preset (night)', () => {
    const nightSongs = filterStreams(mockStreams, {
      singer: '戌亥とこ',
      filter: 'night',
    });
    expect(nightSongs).toHaveLength(1);
    expect(nightSongs[0].id).toBe('1');
  });
});
