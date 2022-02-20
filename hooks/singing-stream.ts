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
  const isoDateTime = `${DateTime.now().toISODate()}T${DateTime.now().toISOTime()}`;
  console.log(isoDateTime);
  const videoId = 'N029UUlH1Dc';
  const videoPublishedAt = '2021-11-26T21:00:00+00:00';
  const videos: Video[] = [
    {
      id: uuid(),
      video_id: videoId,
      title: 'フォニイ / 星街すいせい(Cover)',
      length: 189,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      published_at: videoPublishedAt,
      created_at: isoDateTime,
      updated_at: isoDateTime,
    },
  ];
  await supabase.from('video').insert(videos);

  const partialVideo: Pick<Video, 'video_id' | 'published_at' | 'created_at' | 'updated_at'> = {
    video_id: videos[0].video_id,
    published_at: videos[0].published_at,
    created_at: videos[0].created_at,
    updated_at: videos[0].updated_at,
  };
  const singingStreams: SingingStream[] = [
    {
      ...partialVideo,
      id: uuid(),
      song_title: 'フォニイ',
      song_artist: '星街すいせい(Cover)',
      start: 0,
      end: 189,
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
