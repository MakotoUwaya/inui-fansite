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
  const videoId = 'oygRG7OrYQI';
  const videoPublishedAt = '2022-08-20T03:00:00+00:00';
  const videos: Video[] = [
    {
      id: uuid(),
      video_id: videoId,
      title:
        '【#NIJIMelodyTime】 end of summer singing time~! 【NIJISANJI EN | Elira Pendora】',
      length: 1830,
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
      song_title: 'Lemon',
      song_artist: '米津玄師',
      start: 145,
      end: 400,
    },
    {
      ...partialVideo,
      id: uuid(),
      song_title: 'プラチナ',
      song_artist: '坂本真綾',
      start: 484,
      end: 730,
    },
    {
      ...partialVideo,
      id: uuid(),
      song_title: '夜に駆ける',
      song_artist: 'YOASOBI',
      start: 890,
      end: 1152,
    },
    {
      ...partialVideo,
      id: uuid(),
      song_title: 'ナーヴ・インパルス',
      song_artist: 'Police Piccadilly',
      start: 1200,
      end: 1460,
    },
    {
      ...partialVideo,
      id: uuid(),
      song_title: 'shake it!',
      song_artist: 'emon',
      start: 1548,
      end: 1780,
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
