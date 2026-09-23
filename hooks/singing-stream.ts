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
  // idがfalsyの場合はフェッチしない
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
    .select('id, start, end, video_id, published_at, song(title, artist, song_metadata(mood, genre, is_night_pick)), video!video_id(title, url)')
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
    .select('id, start, video_id, published_at, video!video_id(title, url), song(title, artist, song_metadata(mood, genre, is_night_pick))');

  if (keyword) {
    query
      .select('id, start, video_id, published_at, video!video_id(title, url), song!inner(title, artist, song_metadata(mood, genre, is_night_pick))')
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
  const isoDateTime = `${DateTime.now().toISODate()}T${DateTime.now().toISOTime()}`;
  console.log(isoDateTime);
  const videoId = 'oygRG7OrYQI';
  const videoPublishedAt = '2022-08-20T03:00:00+00:00';

  const singingStreams: SingingStream[] = [
    {
      id: uuid(),
      song_title: 'Lemon',
      song_artist: '米津玄師',
      start: 145,
      end: 400,
      video_id: videoId,
      published_at: videoPublishedAt,
      created_at: isoDateTime,
      updated_at: isoDateTime,
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
