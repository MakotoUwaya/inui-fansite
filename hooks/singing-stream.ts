import { DateTime } from 'luxon';
import useSWRImmutable from 'swr/immutable';
import { uuid } from 'uuidv4';
import { supabase } from '../utils/supabaseClient';
import type {
  SingingStreamForSearch,
  SingingStreamForWatch, SingingStream,
  Song,
  Video,
} from '../types/index';

const PREFIX = 'get-singing-stream-' as const;
const KEYS = {
  search: `${PREFIX}list`,
  watch: `${PREFIX}watch`,
} as const;

export function useSingingStreamsForSearch(keyword: string = '') {
  const { data, error } = useSWRImmutable(`${KEYS.search}-${keyword}`, getForList);
  return {
    streams: data,
    error,
  };
}

export function useSingingStreamForWatch(id: string | undefined) {
  // Do not fetch when id is falsy
  const { data, error } = useSWRImmutable(id ? `${KEYS.watch}-${id}` : null, getForWatch);
  return {
    stream: data,
    error,
  };
}

export const useCreateSingingStream = () => {
  return { createSingingStream };
}

async function getForWatch(key: string) {
  const match = new RegExp(`${KEYS.watch}-(.*)`).exec(key);
  if (!match) return null;

  const id = match[1];
  const { data, error } = await supabase
    .from<SingingStreamForWatch>('singing_stream')
    .select('id, start, end, video_id, published_at, song(title, artist), video!video_id(title, url)')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

async function getForList(key: string): Promise<SingingStreamForSearch[] | null> {
  const match = new RegExp(`${KEYS.search}-(.*)`).exec(key);
  if (!match) return null;

  const keyword = match[1];
  const query = supabase
    .from('singing_stream')
    .select('id, start, video_id, published_at, video!video_id(title, url), song(title, artist)');

  if (keyword) {
    query
      .select('id, start, video_id, published_at, video!video_id(title, url), song!inner(title, artist)')
      .ilike('song.title', `%${keyword}%`);
  }
  query
    .order('published_at', {
      nullsFirst: false,
      ascending: false,
    })
    .order('start', {
      ascending: true,
    });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

async function createSingingStream(): Promise<void> {
  const videoId = 'Gapv5ikX3xY';
  const videoPublishedAt = '2022-01-30T11:00:00+00:00';
  // const videos: Video[] = [
  //   {
  //     id: uuid(),
  //     video_id: videoId,
  //     title: '【歌】きゅうに決めたせいで何もきまってない歌配信【戌亥とこ/にじさんじ】',
  //     length: 3921,
  //     url: 'https://www.youtube.com/watch?v=Gapv5ikX3xY&t=31s',
  //     published_at: videoPublishedAt,
  //     created_at: DateTime.now().toISOTime(),
  //     updated_at: DateTime.now().toISOTime(),
  //   },
  // ];
  // await supabase.from('video').insert(videos);

  const singingStreams: SingingStream[] = [
    {
      id: uuid(),
      song_title: 'glow',
      song_artist: 'keeno feat.初音ミク',
      start: 2253,
      end: 2535,
      video_id: videoId,
      published_at: videoPublishedAt,
      created_at: DateTime.now().toISOTime(),
      updated_at: DateTime.now().toISOTime(),
    },
    {
      id: uuid(),
      song_title: 'ハム太郎とっとこうた',
      song_artist: 'ハムちゃんず',
      start: 2689,
      end: 2778,
      video_id: videoId,
      published_at: videoPublishedAt,
      created_at: DateTime.now().toISOTime(),
      updated_at: DateTime.now().toISOTime(),
    },
    {
      id: uuid(),
      song_title: 'エイリアンエイリアン',
      song_artist: 'ナユタン星人',
      start: 2920,
      end: 3099,
      video_id: videoId,
      published_at: videoPublishedAt,
      created_at: DateTime.now().toISOTime(),
      updated_at: DateTime.now().toISOTime(),
    },
    {
      id: uuid(),
      song_title: '上弦の月',
      song_artist: '黒うさP feat.KAITO',
      start: 3538,
      end: 3771,
      video_id: videoId,
      published_at: videoPublishedAt,
      created_at: DateTime.now().toISOTime(),
      updated_at: DateTime.now().toISOTime(),
    },
  ];

  for (const singingStream of singingStreams) {
    const songs: Song[] = [
      {
        id: singingStream.id,
        title: singingStream.song_title,
        artist: singingStream.song_artist,
        created_at: singingStream.created_at,
        updated_at: singingStream.updated_at,
      },
    ];
    await supabase.from('song').insert(songs);
    await supabase.from('singing_stream').insert([singingStream]);
  }
}
