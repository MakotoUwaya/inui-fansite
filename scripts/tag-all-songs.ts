import './load-env';
import { TypeSafeClient, choice, noul } from '@typesafe-ai/sdk';
import { supabase } from '../utils/supabaseClient';
const typesafeApiKey = process.env.TYPESAFE_API_KEY || '';

if (!typesafeApiKey) {
  console.error('❌ TYPESAFE_API_KEY が設定されていません。');
  console.error('.env.local に以下のように設定してください:');
  console.error('TYPESAFE_API_KEY=your_typesafe_api_key_here');
  process.exit(1);
}

const jev = new TypeSafeClient({ apiKey: typesafeApiKey });

const isForce = process.argv.includes('--force');
const limitIndex = process.argv.indexOf('--limit');
const limitCount = limitIndex !== -1 ? parseInt(process.argv[limitIndex + 1], 10) : undefined;

async function main() {
  console.log('🚀 Jev による楽曲自動タグ付けバッチを開始します...');
  if (isForce) console.log('⚡ --force モード: 既存のメタデータも再判定して上書きします。');
  if (limitCount) console.log(`⚡ --limit モード: 最大 ${limitCount} 曲まで処理します。`);

  // 1. 全曲取得
  const { data: songs, error: songError } = await supabase
    .from('song')
    .select('id, title, artist')
    .order('created_at', { ascending: true });

  if (songError || !songs) {
    console.error('❌ 楽曲の取得に失敗しました:', songError);
    process.exit(1);
  }

  console.log(`📋 対象楽曲数: ${songs.length} 曲\n`);

  // 2. 既存のメタデータ取得（スキップ判定用）
  const { data: existingMetadata } = await supabase
    .from('song_metadata')
    .select('song_id');

  const existingSongIds = new Set((existingMetadata || []).map((m: any) => m.song_id));

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const indexStr = `[${i + 1}/${songs.length}]`;

    if (limitCount && processedCount >= limitCount) {
      console.log(`\n🛑 指定の処理件数上限（${limitCount}件）に達したため終了します。`);
      break;
    }

    if (!isForce && existingSongIds.has(song.id)) {
      console.log(`${indexStr} ⏭️  スキップ: 「${song.title}」 / ${song.artist || '不明'}`);
      skippedCount++;
      continue;
    }

    console.log(`${indexStr} 🤖 判定中: 「${song.title}」 / ${song.artist || '不明'}...`);
    const startTime = Date.now();

    try {
      const response = await jev.systemOne({
        state: {
          song_title: song.title,
          artist: song.artist || '',
        },
        questions: {
          // ① ムード判定
          mood: choice('この楽曲の全体的な雰囲気・ムードに最も近いものはどれですか？', {
            ballad: 'しっとり・バラード・静か・落ち着いた雰囲気（夜に聴きたい）',
            emotional: 'エモい・切ない・ドラマチック・心に深く響く',
            cool: 'クール・かっこいい・力強い・ロック・スタイリッシュ',
            bright: '明るい・ポップ・楽しい・前向き・テンションが上がる',
            jazz_rnb: 'おしゃれ・大人・ジャジー・グルーヴィー',
          }),
          // ② カテゴリ・ジャンル判定
          genre: choice('この楽曲が最も認知されているカテゴリ・ジャンルはどれですか？', {
            vocaloid: 'ボカロ曲（VOCALOID・音声合成ソフト歌唱曲、またはツミキ/ナユタン星人等のボカロP制作楽曲）',
            anime: 'アニソン（テレビアニメ主題歌・劇場版映画主題歌・アニソンタイアップ曲）',
            jpop: 'J-POP / J-ROCK / 邦楽アーティスト一般',
            nostalgic: '歌謡曲 / シティポップ / 昭和・平成レトロ名曲',
            vtuber: 'VTuberオリジナルソング / にじさんじ等のバーチャルシンガー楽曲',
          }),
          // ③ 夜曲適性
          night_pick: noul('夜や深夜に静かにリラックスして聴くのに特に適した楽曲ですか？'),
        },
      });

      const elapsed = Date.now() - startTime;
      const { answers } = response;

      const metadataRecord = {
        song_id: song.id,
        mood: answers.mood.choice,
        genre: answers.genre.choice,
        is_night_pick: answers.night_pick.noul >= 0.5,
        confidence_mood: answers.mood.confidence,
        confidence_genre: answers.genre.confidence,
        prob_night_pick: answers.night_pick.noul,
        raw_jev_data: answers,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('song_metadata')
        .upsert(metadataRecord);

      if (upsertError) {
        console.error(`  ❌ DB保存エラー: ${upsertError.message}`);
        errorCount++;
      } else {
        console.log(`  ✨ 判定完了 (${elapsed}ms): ムード=${answers.mood.choice} (${(answers.mood.confidence * 100).toFixed(0)}%), ジャンル=${answers.genre.choice} (${(answers.genre.confidence * 100).toFixed(0)}%), 夜適性=${(answers.night_pick.noul * 100).toFixed(0)}%`);
        processedCount++;
      }
    } catch (err: any) {
      console.error(`  ❌ Jev API 判定エラー: ${err.message}`);
      errorCount++;
    }

    // レートリミット配慮でわずかにウェイト（50ms）
    await new Promise((r) => setTimeout(r, 50));
  }

  console.log('\n=======================================');
  console.log(`🎉 完了報告:`);
  console.log(`  - 判定・保存: ${processedCount} 曲`);
  console.log(`  - スキップ  : ${skippedCount} 曲`);
  console.log(`  - エラー    : ${errorCount} 曲`);
  console.log('=======================================');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
