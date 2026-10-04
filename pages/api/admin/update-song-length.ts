import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../utils/supabaseClient';

type ResponseData = {
  success?: boolean;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // ローカル開発環境（NODE_ENV === 'development'）のみ許可
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'ローカル開発環境でのみ利用可能です。' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, song_id, start, end, is_length_checked, singers, metadata } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '有効な曲IDを指定してください。' });
  }

  if (typeof start !== 'number' || start < 0) {
    return res.status(400).json({ error: '有効な開始時間（秒）を指定してください。' });
  }

  if (end !== null && (typeof end !== 'number' || end <= start)) {
    return res.status(400).json({ error: '終了時間は開始時間より大きい秒数を指定してください。' });
  }

  try {
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      start: Math.round(start),
      end: end !== null ? Math.round(end) : null,
      is_length_checked: Boolean(is_length_checked),
      length_checked_at: is_length_checked ? now : null,
      updated_at: now,
    };

    if (Array.isArray(singers)) {
      updatePayload.singers = singers.map((s: string) => s.trim()).filter(Boolean);
    }

    // 1. singing_stream の更新
    const { data: streamData, error: streamError } = await supabase
      .from('singing_stream')
      .update(updatePayload)
      .eq('id', id)
      .select('id, start, end, singers, is_length_checked, length_checked_at')
      .single();

    if (streamError) {
      console.error('Supabase singing_stream update error:', streamError);
      return res.status(500).json({ error: streamError.message });
    }

    // 2. song_metadata の更新（指定されている場合）
    // singing_stream.id === song.id === song_metadata.song_id
    const targetSongId = id;
    let savedMetadata = null;

    if (targetSongId && metadata && typeof metadata === 'object') {
      const metadataPayload: Record<string, any> = {
        song_id: targetSongId,
        mood: metadata.mood || null,
        genre: metadata.genre || null,
        is_night_pick: Boolean(metadata.is_night_pick),
        updated_at: now,
      };

      const { data: metaData, error: metaError } = await supabase
        .from('song_metadata')
        .upsert(metadataPayload, { onConflict: 'song_id' })
        .select('mood, genre, is_night_pick')
        .single();

      if (metaError) {
        console.warn('Supabase song_metadata update error:', metaError);
      } else {
        savedMetadata = metaData;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...streamData,
        song_metadata: savedMetadata,
      },
    });
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || '内部エラーが発生しました。' });
  }
}
