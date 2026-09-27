import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findCollabVideos() {
  // 歌唱者が2人以上の singing_stream を取得
  const { data: streams, error } = await supabase
    .from('singing_stream')
    .select('video_id, singers, video ( title, url, published_at )');

  if (error) {
    console.error(error);
    return;
  }

  // video_id ごとにグループ化
  const videoMap = new Map<string, { title: string; url: string; publishedAt: string; singers: string[]; songCount: number }>();

  for (const s of streams || []) {
    const vid = s.video_id;
    const isCollab = s.singers && s.singers.length > 1;
    if (isCollab) {
      if (!videoMap.has(vid)) {
        videoMap.set(vid, {
          title: (s.video as any)?.title || '',
          url: (s.video as any)?.url || `https://www.youtube.com/watch?v=${vid}`,
          publishedAt: (s.video as any)?.published_at || '',
          singers: s.singers,
          songCount: 0,
        });
      }
      videoMap.get(vid)!.songCount++;
    }
  }

  const collabVideos = Array.from(videoMap.entries()).map(([vid, data]) => ({
    videoId: vid,
    ...data,
  }));

  console.log(`コラボ歌枠の総動画数: ${collabVideos.length} 本\n`);

  collabVideos.forEach((v, i) => {
    console.log(`${i + 1}. [${v.videoId}] (${v.singers.join(', ')}) - ${v.songCount}曲`);
    console.log(`   URL: ${v.url}`);
    console.log(`   タイトル: ${v.title}`);
  });

  fs.writeFileSync('scripts/collab-videos-list.json', JSON.stringify(collabVideos, null, 2));
}

findCollabVideos().catch(console.error);
