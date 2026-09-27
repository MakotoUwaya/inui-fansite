import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SongDef {
  videoId: string;
  songTitle: string;
  artist: string;
  singers: string[];
}

const PLAYLIST_SONGS: SongDef[] = [
  {
    videoId: 'QlaGDL69HjY',
    songTitle: 'おもかげ',
    artist: 'milet × Aimer × 幾田りら',
    singers: ['音ノ乃のの', '戌亥とこ', '緑仙'],
  },
  {
    videoId: 'nPpMou3jno4',
    songTitle: '点描の唄',
    artist: 'Mrs. GREEN APPLE',
    singers: ['戌亥とこ', '甲斐田晴'],
  },
  {
    videoId: 'WDF6f0B_deM',
    songTitle: '愛♡スクリ～ム！',
    artist: 'AiScReam',
    singers: ['リゼ・ヘルエスタ', '戌亥とこ', 'アンジュ・カトリーナ'],
  },
  {
    videoId: 'uGHlYIck0CE',
    songTitle: '仮装狂騒曲',
    artist: 'まふまふ',
    singers: ['倉持めると', '戌亥とこ', 'フレン・E・ルスタリオ'],
  },
  {
    videoId: 'U1A1UgeUQL4',
    songTitle: 'Budding!',
    artist: 'にじさんじ',
    singers: ['戌亥とこ', '町田ちま'],
  },
  {
    videoId: 'ff3Ro_G-kB8',
    songTitle: 'on the rocks',
    artist: 'OSTER project',
    singers: ['戌亥とこ', '綺沙良'],
  },
  {
    videoId: 'GV9sHBUiKCs',
    songTitle: '怪物さん',
    artist: '平井堅 feat. あいみょん',
    singers: ['伊波ライ', '戌亥とこ'],
  },
  {
    videoId: 'SSUZjMD-tF8',
    songTitle: '月陽 -ツキアカリ-',
    artist: 'みきとP',
    singers: ['戌亥とこ', '渡会雲雀'],
  },
  {
    videoId: 'u6OKRQDpC_s',
    songTitle: 'ブリキノダンス',
    artist: '日向電工',
    singers: ['田中ヒメ', '鈴木ヒナ', '戌亥とこ', '町田ちま'],
  },
  {
    videoId: '9OI15Bdge4M',
    songTitle: 'ラヴィ',
    artist: 'すりぃ',
    singers: ['倉持めると', '戌亥とこ'],
  },
  {
    videoId: 'lIYkcL9QzRA',
    songTitle: '好きだから。',
    artist: '『ユイカ』',
    singers: ['小清水透', '戌亥とこ'],
  },
  {
    videoId: 'K6Exdfs4sh4',
    songTitle: 'シンクロニシティ',
    artist: '乃木坂46',
    singers: ['リゼ・ヘルエスタ', '戌亥とこ'],
  },
  {
    videoId: 'PLNX2GamNRw',
    songTitle: '月光食堂',
    artist: 'HACHI',
    singers: ['HACHI', '戌亥とこ'],
  },
  {
    videoId: 'VJzCmHZk5LE',
    songTitle: 'アヤノの幸福理論',
    artist: 'じん',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'YWPJJMc409o',
    songTitle: '青春コンプレックス',
    artist: '結束バンド',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'YaEKRa16L0Q',
    songTitle: 'ノマド',
    artist: 'バルーン',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'fCYL27xT-Jo',
    songTitle: '踊り子',
    artist: 'Vaundy',
    singers: ['朝日南アカネ', '町田ちま', '戌亥とこ'],
  },
  {
    videoId: 'GG0-dICHKb8',
    songTitle: 'ヨセアツメ',
    artist: 'ポリスピカデリー',
    singers: ['戌亥とこ'],
  },
  {
    videoId: '_B9G2cwaiSg',
    songTitle: 'MIRA',
    artist: 'Kanaria',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'mfBYJDVcuas',
    songTitle: '偏食',
    artist: '煮ル果実',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'g_vV3bE3GNo',
    songTitle: 'フォニイ',
    artist: 'ツミキ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: '_1hQg-tFnEY',
    songTitle: '栞',
    artist: 'クリープハイプ',
    singers: ['朝ノ瑠璃', '戌亥とこ', '奏みみ', '白上フブキ', 'ドーラ', '富士葵', 'ベルモンド・バンデラス'],
  },
  {
    videoId: 'G7aJCz6E_YY',
    songTitle: '初恋',
    artist: '戌亥とこ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'sMuKQ3pKd4E',
    songTitle: 'キュートなカノジョ',
    artist: 'syudou',
    singers: ['戌亥とこ'],
  },
  {
    videoId: '_bRiUb84lBk',
    songTitle: 'U',
    artist: 'millennium parade × Belle',
    singers: ['エルセ', '戌亥とこ'],
  },
  {
    videoId: 'hG0OMmvC9NE',
    songTitle: 'チューリングラブ',
    artist: 'ナナヲアカリ',
    singers: ['戌亥とこ', 'フレン・E・ルスタリオ'],
  },
  {
    videoId: 'aWv2KjaFqBA',
    songTitle: 'Honeycomb Summer',
    artist: 'Crazy:B',
    singers: ['戌亥とこ', '星街すいせい'],
  },
  {
    videoId: 'gys6TNZx9kU',
    songTitle: 'Engaged Stories',
    artist: '戌亥とこ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'F0hEfm_Bnkg',
    songTitle: '夏色えがおで1,2,Jump!',
    artist: "μ's",
    singers: ['MaiR', '朝ノ瑠璃', 'AZKi', '戌亥とこ', 'エルセ', 'かしこまり', '奏天まひろ', '宗谷いちか', '花鋏キョウ'],
  },
  {
    videoId: 'edp420amW1s',
    songTitle: 'イースター・カーニバル',
    artist: 'Switch',
    singers: ['戌亥とこ', '星街すいせい'],
  },
  {
    videoId: 'fBh12rFjms8',
    songTitle: '奴隷市場 -Δουλοι-',
    artist: 'Sound Horizon',
    singers: ['朝ノ瑠璃', '戌亥とこ', '奏みみ', '白上フブキ', 'ドーラ', '富士葵', 'ベルモンド・バンデラス'],
  },
  {
    videoId: 'wl95zSvqWqU',
    songTitle: 'カタオモイ',
    artist: 'Aimer',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'sinqKTmfSWI',
    songTitle: 'インフルエンサー',
    artist: '乃木坂46',
    singers: ['リゼ・ヘルエスタ', '戌亥とこ'],
  },
  {
    videoId: 'KiUvL-rp1zg',
    songTitle: 'メルティ♡キッチン',
    artist: 'Ra*bits',
    singers: ['戌亥とこ', '星街すいせい'],
  },
  {
    videoId: 'm-demdSHuYI',
    songTitle: "Holy Angel's Carol",
    artist: 'fine',
    singers: ['戌亥とこ', '星街すいせい'],
  },
  {
    videoId: 'XwZZeMNanKw',
    songTitle: '地獄屋八丁荒らし',
    artist: '戌亥とこ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'AW7HXLmSdQA',
    songTitle: '終端の王と異世界の騎士 〜The Endia & The Knights〜',
    artist: 'Sound Horizon',
    singers: ['朝ノ瑠璃', '戌亥とこ', '奏みみ', '白上フブキ', 'ドーラ', '富士葵', 'ベルモンド・バンデラス'],
  },
  {
    videoId: 'vhmFj1owmuk',
    songTitle: '今宵月の館にて',
    artist: 'Valkyrie',
    singers: ['戌亥とこ', '星街すいせい'],
  },
  {
    videoId: 'CT7tJZwWLdQ',
    songTitle: '靴の花火',
    artist: 'ヨルシカ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'axZ9LYMvrPo',
    songTitle: 'MOON PRIDE',
    artist: 'ももいろクローバーZ',
    singers: ['朝ノ瑠璃', '戌亥とこ', '白上フブキ', '樋口楓', '宝鐘マリン'],
  },
  {
    videoId: 'xYXGfzgjEoE',
    songTitle: 'さようなら、花泥棒さん',
    artist: 'メル',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'zokUrGt0iuc',
    songTitle: '一度だけの恋なら',
    artist: 'ワルキューレ',
    singers: ['戌亥とこ', '竜胆尊', '樋口楓', 'リゼ・ヘルエスタ', '鈴原るる'],
  },
  {
    videoId: 'bgWpXcbmQDY',
    songTitle: 'ノーチラス',
    artist: 'ヨルシカ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'QLWczt8aBtk',
    songTitle: '雨とカプチーノ',
    artist: 'ヨルシカ',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'ADgodTeFaMM',
    songTitle: 'Virtual to LIVE',
    artist: 'にじさんじ',
    singers: ['リゼ・ヘルエスタ', '戌亥とこ', 'アンジュ・カトリーナ'],
  },
  {
    videoId: '2k8AIzE87Mo',
    songTitle: 'Disney Medley',
    artist: 'Disney',
    singers: ['戌亥とこ'],
  },
  {
    videoId: 'QzdsaXemBWM',
    songTitle: 'RE:I AM',
    artist: 'Aimer',
    singers: ['戌亥とこ'],
  },
];

async function registerSongs() {
  const details: any[] = JSON.parse(fs.readFileSync('playlist-video-details.json', 'utf8'));
  const detailsMap = new Map(details.map(d => [d.videoId, d]));

  console.log(`プレイリスト未登録楽曲（計 ${PLAYLIST_SONGS.length} 曲）の登録を開始します...\n`);

  let successCount = 0;

  for (let i = 0; i < PLAYLIST_SONGS.length; i++) {
    const item = PLAYLIST_SONGS[i];
    const detail = detailsMap.get(item.videoId);
    const title = detail?.pageTitle || item.songTitle;
    const length = detail?.length || 0;
    const publishedAt = detail?.publishDate || new Date().toISOString();
    const url = `https://www.youtube.com/watch?v=${item.videoId}`;

    console.log(`[${i + 1}/${PLAYLIST_SONGS.length}] 登録中: ${item.songTitle} / ${item.artist} (${item.videoId})...`);

    const now = new Date().toISOString();

    try {
      // 1. video テーブルに登録 (既存なら更新)
      const { data: existingVideo } = await supabase
        .from('video')
        .select('id')
        .eq('video_id', item.videoId)
        .maybeSingle();

      let videoPkId = existingVideo?.id;

      if (!videoPkId) {
        videoPkId = crypto.randomUUID();
        const { error: videoError } = await supabase
          .from('video')
          .insert({
            id: videoPkId,
            video_id: item.videoId,
            title: title.replace(/&amp;/g, '&'),
            url: url,
            length: length || 300,
            published_at: publishedAt,
            created_at: now,
            updated_at: now,
          });

        if (videoError) {
          console.error(`  ✗ video 登録エラー (${item.videoId}):`, videoError);
          continue;
        }
      }

      // 2. song テーブルに登録
      const songId = crypto.randomUUID();
      const { error: songError } = await supabase
        .from('song')
        .insert({
          id: songId,
          title: item.songTitle,
          artist: item.artist,
          created_at: now,
          updated_at: now,
        });

      if (songError) {
        console.error(`  ✗ song 登録エラー (${item.songTitle}):`, songError);
        continue;
      }

      // 3. singing_stream テーブルに登録
      const { error: streamError } = await supabase
        .from('singing_stream')
        .insert({
          id: songId,
          video_id: item.videoId,
          start: 0,
          end: length > 0 ? length : 300,
          published_at: publishedAt,
          singers: item.singers,
          created_at: now,
          updated_at: now,
        });

      if (streamError) {
        console.error(`  ✗ singing_stream 登録エラー (${item.songTitle}):`, streamError);
        continue;
      }

      console.log(`  ✓ 登録成功: ${item.songTitle} / ${item.artist} [歌唱: ${item.singers.join(', ')}] (長さ: ${length}秒)`);
      successCount++;
    } catch (e) {
      console.error(`  ✗ 例外エラー (${item.videoId}):`, e);
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 登録完了: ${successCount} / ${PLAYLIST_SONGS.length} 件`);
  console.log(`========================================\n`);
}

function formatSecondsToHHMMSS(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

registerSongs().catch(console.error);
