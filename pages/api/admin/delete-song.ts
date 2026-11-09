import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../utils/supabaseClient';

type ResponseData = {
  success?: boolean;
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

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '有効な曲IDを指定してください。' });
  }

  try {
    // 1. song_metadata の削除
    const { error: metaError } = await supabase
      .from('song_metadata')
      .delete()
      .eq('song_id', id);

    if (metaError) {
      console.warn('song_metadata 削除スキップ/エラー:', metaError.message);
    }

    // 2. singing_stream の削除
    const { error: streamError } = await supabase
      .from('singing_stream')
      .delete()
      .eq('id', id);

    if (streamError) {
      console.error('singing_stream 削除エラー:', streamError);
      return res.status(500).json({ error: streamError.message });
    }

    // 3. 他の singing_stream で参照されていない場合、song レコードも削除
    const { data: remainingStreams } = await supabase
      .from('singing_stream')
      .select('id')
      .eq('id', id);

    if (!remainingStreams || remainingStreams.length === 0) {
      const { error: songError } = await supabase
        .from('song')
        .delete()
        .eq('id', id);

      if (songError) {
        console.warn('song レコード削除スキップ/エラー:', songError.message);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || '内部エラーが発生しました。' });
  }
}
