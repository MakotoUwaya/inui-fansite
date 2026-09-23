import * as fs from 'fs';
import * as path from 'path';
import { TypeSafeClient, choice, noul } from '@typesafe-ai/sdk';

// .env.local または .env から TYPESAFE_API_KEY を補完
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

const apiKey = process.env.TYPESAFE_API_KEY;

if (!apiKey) {
  console.error('❌ エラー: TYPESAFE_API_KEY が見つかりません。');
  console.error('.env.local に以下のように設定してください:');
  console.error('TYPESAFE_API_KEY=your_typesafe_api_key_here');
  process.exit(1);
}

// テスト対象の楽曲サンプル（戌亥とこさんの歌枠で定番・人気の様々なタイプの曲）
const testSongs = [
  { title: '小さきもの', artist: '林明日香' },
  { title: 'フォニイ', artist: 'ツミキ' },
  { title: '丸の内サディスティック', artist: '椎名林檎' },
  { title: '君の知らない物語', artist: 'supercell' },
  { title: '太陽系デスコ', artist: 'ナユタン星人' },
];

async function main() {
  console.log('🚀 Jev (TypeSafe AI) への接続テストを開始します...\n');
  const client = new TypeSafeClient({ apiKey });

  for (const song of testSongs) {
    console.log(`🎵 判定中: 「${song.title}」 / ${song.artist}`);

    try {
      const startTime = Date.now();

      const response = await client.systemOne({
        state: {
          song_title: song.title,
          artist: song.artist,
        },
        questions: {
          // ① 雰囲気・ムード判定
          mood: choice('この楽曲の全体的な雰囲気・ムードに最も近いものはどれですか？', {
            ballad: 'しっとり・バラード・静か・落ち着いた雰囲気（夜に聴きたい）',
            emotional: 'エモい・切ない・ドラマチック・心に深く響く',
            cool: 'クール・かっこいい・力強い・ロック・スタイリッシュ',
            bright: '明るい・ポップ・楽しい・前向き・テンションが上がる',
            jazz_rnb: 'おしゃれ・大人・ジャジー・グルーヴィー',
          }),
          // ② ジャンル判定
          genre: choice('この楽曲が最も認知されているカテゴリ・ジャンルはどれですか？', {
            vocaloid: 'ボカロ曲（VOCALOID・音声合成ソフト歌唱曲、またはツミキ/ナユタン星人等のボカロP制作楽曲）',
            anime: 'アニソン（テレビアニメ主題歌・劇場版映画主題歌・アニソンタイアップ曲）',
            jpop: 'J-POP / J-ROCK / 邦楽アーティスト一般',
            nostalgic: '歌謡曲 / シティポップ / 昭和・平成レトロ名曲',
            vtuber: 'VTuberオリジナルソング / にじさんじ等のバーチャルシンガー楽曲',
          }),
          // ③ 夜聴き適性（Yes/No確率）
          night_pick: noul('夜や深夜に静かにリラックスして聴くのに特に適した楽曲ですか？'),
        },
      });

      const elapsed = Date.now() - startTime;
      const { answers } = response;

      console.log(`⏱️ 応答時間: ${elapsed}ms`);
      console.log(`  └ ムード   : ${answers.mood.choice} (確信度: ${(answers.mood.confidence * 100).toFixed(1)}%)`);
      console.log(`  └ ジャンル : ${answers.genre.choice} (確信度: ${(answers.genre.confidence * 100).toFixed(1)}%)`);
      console.log(`  └ 夜曲適性 : ${(answers.night_pick.noul * 100).toFixed(1)}%`);
      console.log('');
    } catch (err: any) {
      console.error(`❌ エラー発生: ${err.message}`);
    }
  }

  console.log('✅ テスト完了！');
}

main();
