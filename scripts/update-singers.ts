import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...values] = trimmed.split('=');
          const val = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 動画タイトルから歌唱者リストを抽出・推測する
 */
export function extractSingersFromTitle(title: string): string[] {
  // にじさんじの主要ライバー名などの辞書または括弧内の抽出
  // 【戌亥とこ/長尾景/にじさんじ】や【立伝都々/北見遊征/珠乃井ナナ/早乙女ベリー/渚トラウト/にじさんじ】など
  const bracketMatches = title.match(/[【\[(（]([^【\[(（）)\]】]+)[)）\]】]/g) || [];

  const foundSingers = new Set<string>();

  for (const bracket of bracketMatches) {
    const inner = bracket.slice(1, -1);
    // スラッシュやパイプ、カンマで分割（半角スペースは姓名で使われるため分割しない）
    const parts = inner.split(/[\/／,、|｜]+/).map((s) => s.trim());
    for (const part of parts) {
      if (
        !part ||
        part === 'にじさんじ' ||
        part === 'NIJISANJI' ||
        part === 'NIJISANJI EN' ||
        part === '歌' ||
        part === '歌枠' ||
        part === 'コラボ歌枠' ||
        part.startsWith('#')
      ) {
        continue;
      }
      foundSingers.add(part);
    }
  }

  // もし抽出できた場合はその配列を返す
  if (foundSingers.size > 0) {
    return Array.from(foundSingers);
  }

  // デフォルトは戌亥とこ
  return ['戌亥とこ'];
}

async function main() {
  console.log('🎤 歌唱者（singers）データの更新を開始します...\n');

  const { data: videos, error: videoError } = await supabase
    .from('video')
    .select('video_id, title');

  if (videoError || !videos) {
    console.error('❌ 動画の取得に失敗:', videoError);
    process.exit(1);
  }

  for (const video of videos) {
    const singers = extractSingersFromTitle(video.title);
    console.log(`📹 動画: ${video.title}`);
    console.log(`  👥 推定歌唱者: [${singers.join(', ')}]`);

    const { error: updateError } = await supabase
      .from('singing_stream')
      .update({ singers })
      .eq('video_id', video.video_id);

    if (updateError) {
      console.error(`  ❌ 更新失敗: ${updateError.message}`);
    } else {
      console.log(`  ✅ singing_stream の歌唱者情報を更新しました\n`);
    }
  }

  console.log('🎉 全動画の歌唱者更新が完了しました！');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
