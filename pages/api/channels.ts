import type { NextApiRequest, NextApiResponse } from 'next';
import type { HolodexChannelSummary } from '../../utils/holodex';

// サーバー内インメモリキャッシュ（TTL: 1時間）
let cachedChannels: Record<string, HolodexChannelSummary> | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間

/**
 * Holodex API から指定組織のチャンネル一覧を取得する
 */
async function fetchChannelsForOrg(
  org: string,
  apiKey: string,
  offsets = [0, 100, 200],
): Promise<HolodexChannelSummary[]> {
  const allChannels: HolodexChannelSummary[] = [];

  const promises = offsets.map(async (offset) => {
    const url = `https://holodex.net/api/v2/channels?limit=100&offset=${offset}&type=vtuber&org=${encodeURIComponent(org)}&sort=suborg&order=asc`;
    try {
      const res = await fetch(url, {
        headers: {
          'x-apikey': apiKey,
        },
      });

      if (!res.ok) {
        console.warn(`[Holodex API] Error fetching ${org} offset=${offset}: ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        english_name: ch.english_name || null,
        org: ch.org || null,
        suborg: ch.suborg || null,
        group: ch.group || null,
        type: ch.type || null,
        subscriber_count: ch.subscriber_count ?? null,
        video_count: ch.video_count ?? null,
        photo: ch.photo || null,
      }));
    } catch (err) {
      console.warn(`[Holodex API] Network error fetching ${org} offset=${offset}:`, err);
      return [];
    }
  });

  const results = await Promise.all(promises);
  for (const list of results) {
    allChannels.push(...list);
  }

  return allChannels;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, HolodexChannelSummary>>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const now = Date.now();

  // キャッシュが有効な場合はキャッシュを返却
  if (cachedChannels && now - lastFetchedAt < CACHE_TTL_MS) {
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
    return res.status(200).json(cachedChannels);
  }

  const apiKey = process.env.HOLODEX_APIKEY || '';
  if (!apiKey) {
    // API Key がない場合は直前のキャッシュまたは空オブジェクトを返却
    if (cachedChannels) {
      return res.status(200).json(cachedChannels);
    }
    return res.status(200).json({});
  }

  try {
    // Nijisanji（offset 0, 100, 200）と Hololive（offset 0）を取得
    const [nijisanjiChannels, hololiveChannels] = await Promise.all([
      fetchChannelsForOrg('Nijisanji', apiKey, [0, 100, 200]),
      fetchChannelsForOrg('Hololive', apiKey, [0]),
    ]);

    const channelMap: Record<string, HolodexChannelSummary> = {};

    for (const ch of [...nijisanjiChannels, ...hololiveChannels]) {
      if (ch.id) {
        channelMap[ch.id] = ch;
      }
    }

    cachedChannels = channelMap;
    lastFetchedAt = now;

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
    return res.status(200).json(channelMap);
  } catch (error) {
    console.error('[API /channels] Failed to fetch channels:', error);
    if (cachedChannels) {
      return res.status(200).json(cachedChannels);
    }
    return res.status(200).json({});
  }
}
