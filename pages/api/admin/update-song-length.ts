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

  const { id, start, end, is_length_checked } = req.body;

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
    const updatePayload: Record<string, any> = {
      start: Math.round(start),
      end: end !== null ? Math.round(end) : null,
      is_length_checked: Boolean(is_length_checked),
      length_checked_at: is_length_checked ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('singing_stream')
      .update(updatePayload)
      .eq('id', id)
      .select('id, start, end, is_length_checked, length_checked_at')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || '内部エラーが発生しました。' });
  }
}
