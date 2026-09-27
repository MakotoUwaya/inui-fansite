import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SongUpdateRule {
  videoId: string;
  match: {
    titleSnippet?: string;
    startRange?: [number, number]; // [minSec, maxSec]
  };
  singers: string[];
}

function timeToSec(t: string): number {
  const parts = t.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

const RULES: SongUpdateRule[] = [
  // ==========================================
  // [2] _rFAIBVdWYI (戌亥とこ, 伊波ライ, 蝸堂みかる, 城瀬いすみ)
  // ==========================================
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'シャルル' }, singers: ['戌亥とこ', '伊波ライ', '蝸堂みかる', '城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'ロキ' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '右に曲ガール' }, singers: ['蝸堂みかる', '城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '夏の半券' }, singers: ['城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'エンヴィーキャットウォーク' }, singers: ['戌亥とこ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'ビースト・ダンス' }, singers: ['蝸堂みかる'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'トオトロジイダウトフル' }, singers: ['伊波ライ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'サンドリヨン' }, singers: ['伊波ライ', '蝸堂みかる'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'シリョクケンサ' }, singers: ['戌亥とこ', '城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '夜咄ディセイブ' }, singers: ['伊波ライ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '乙女解剖' }, singers: ['蝸堂みかる'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '心臓デモクラシー' }, singers: ['戌亥とこ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'モザイクロール' }, singers: ['城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '脱獄' }, singers: ['伊波ライ', '城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '酔いどれ知らず' }, singers: ['戌亥とこ', '蝸堂みかる'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'シャンティ' }, singers: ['伊波ライ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'メリーバッドエンド' }, singers: ['城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: '小夜子' }, singers: ['蝸堂みかる'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'チュルリラ・チュルリラ・ダッダッダ' }, singers: ['蝸堂みかる', '城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'スロウダウナー' }, singers: ['伊波ライ', '城瀬いすみ'] },
  { videoId: '_rFAIBVdWYI', match: { titleSnippet: 'Mr.Music' }, singers: ['戌亥とこ', '伊波ライ', '蝸堂みかる', '城瀬いすみ'] },

  // ==========================================
  // [4] uRKNhEOx0Hs (戌亥とこ, 早乙女ベリー)
  // ==========================================
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: 'トウキョウ・シャンディ・ランデヴ' }, singers: ['戌亥とこ', '早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: '雨とカプチーノ' }, singers: ['戌亥とこ', '早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: '絶頂讃歌' }, singers: ['戌亥とこ'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: 'あなたのことをおしえて' }, singers: ['早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: '炎' }, singers: ['戌亥とこ', '早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: 'シンデレラボーイ' }, singers: ['戌亥とこ', '早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: 'アポリア' }, singers: ['戌亥とこ'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: '月並みに輝け' }, singers: ['早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: 'Pretender' }, singers: ['戌亥とこ', '早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: '知らんけど' }, singers: ['戌亥とこ', '早乙女ベリー'] },
  { videoId: 'uRKNhEOx0Hs', match: { titleSnippet: '恋するフォーチュン・クッキー' }, singers: ['戌亥とこ', '早乙女ベリー'] },

  // ==========================================
  // [5] 02bG3td4yNM (戌亥とこ, Meloco Kyoran)
  // ==========================================
  { videoId: '02bG3td4yNM', match: { titleSnippet: 'Hot Limit' }, singers: ['戌亥とこ', 'Meloco Kyoran'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: '天体観測' }, singers: ['戌亥とこ'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: '偽顔' }, singers: ['Meloco Kyoran'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: '二時間だけのバカンス' }, singers: ['戌亥とこ', 'Meloco Kyoran'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: 'あの夏に咲け' }, singers: ['戌亥とこ'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: 'CH4NGE' }, singers: ['Meloco Kyoran'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: '夜明けと蛍' }, singers: ['戌亥とこ', 'Meloco Kyoran'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: 'I wanna see you' }, singers: ['戌亥とこ'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: '不可思議カルテ' }, singers: ['Meloco Kyoran'] },
  { videoId: '02bG3td4yNM', match: { titleSnippet: '君の知らない物語' }, singers: ['戌亥とこ', 'Meloco Kyoran'] },

  // ==========================================
  // [6] syEi2bLaJFA (戌亥とこ, 伊波ライ)
  // ==========================================
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: 'おとなの掟' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: 'ゴーゴー幽霊船' }, singers: ['伊波ライ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: 'orion' }, singers: ['戌亥とこ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: 'グッバイ・マイマリー' }, singers: ['伊波ライ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: '歌うたいのバラッド' }, singers: ['戌亥とこ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: 'オートファジー' }, singers: ['伊波ライ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: '明日はきっといい日になる' }, singers: ['戌亥とこ'] },
  { videoId: 'syEi2bLaJFA', match: { titleSnippet: '東京' }, singers: ['戌亥とこ', '伊波ライ'] },

  // ==========================================
  // [7] MNZCS4b-JeY (戌亥とこ, 倉持めると, ルンルン)
  // ==========================================
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: 'おもかげ' }, singers: ['戌亥とこ', '倉持めると', 'ルンルン'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: 'スノーマジックファンタジー' }, singers: ['ルンルン'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '特にない' }, singers: ['戌亥とこ'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '三時のキス' }, singers: ['倉持めると'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '話がしたいよ' }, singers: ['ルンルン'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '花が咲く道' }, singers: ['戌亥とこ'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '禁煙' }, singers: ['倉持めると'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '地球をあげる' }, singers: ['ルンルン'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: 'Umbrella' }, singers: ['戌亥とこ'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '瞳' }, singers: ['倉持めると'] },
  { videoId: 'MNZCS4b-JeY', match: { titleSnippet: '3月9日' }, singers: ['戌亥とこ', '倉持めると', 'ルンルン'] },

  // ==========================================
  // [9] cjDVksvpq5A (戌亥とこ, 宇佐美リト)
  // ==========================================
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: 'Virtual to LIVE' }, singers: ['戌亥とこ', '宇佐美リト'] },
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: 'ジングル・ベル' }, singers: ['戌亥とこ', '宇佐美リト'] },
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: 'クリスマス・イブ' }, singers: ['戌亥とこ', '宇佐美リト'] },
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: 'マツケンサンバ' }, singers: ['戌亥とこ', '宇佐美リト'] },
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: '白い恋人達' }, singers: ['宇佐美リト'] },
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: 'メリクリ' }, singers: ['戌亥とこ'] },
  { videoId: 'cjDVksvpq5A', match: { titleSnippet: 'お願いマッスル' }, singers: ['戌亥とこ', '宇佐美リト'] },

  // ==========================================
  // [10] CD0u8ycS2Vs (戌亥とこ, 倉持めると, ルンルン)
  // ==========================================
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'ないものねだり' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'GLAMOROUS SKY' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'たばこ' }, singers: ['ルンルン'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '秘密' }, singers: ['戌亥とこ'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '歌舞伎町の女王' }, singers: ['倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '拝啓、少年よ' }, singers: ['ルンルン'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '君を想った唄' }, singers: ['戌亥とこ'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '恋風邪にのせて' }, singers: ['倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '東京フラッシュ' }, singers: ['ルンルン', '倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '琥珀色の街、上海蟹の朝' }, singers: ['戌亥とこ', 'ルンルン'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'オドループ' }, singers: ['戌亥とこ', '倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'おやすみ泣き声、さよなら歌姫' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'センチメンタルピリオド' }, singers: ['ルンルン'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: 'パブリック' }, singers: ['戌亥とこ'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '恋人ができたんだ' }, singers: ['倉持めると'] },
  { videoId: 'CD0u8ycS2Vs', match: { titleSnippet: '栞' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },

  // ==========================================
  // [11] tHAVJ0gBJWE (早乙女ベリー, 夢追翔, 北見遊征, 戌亥とこ)
  // ==========================================
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: 'ピースサイン' }, singers: ['夢追翔', '北見遊征'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: '唱' }, singers: ['早乙女ベリー', '戌亥とこ'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: 'ドライフラワー' }, singers: ['戌亥とこ', '北見遊征'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: 'スターマーカー' }, singers: ['夢追翔', '早乙女ベリー'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: 'さよならエレジー' }, singers: ['早乙女ベリー', '戌亥とこ', '北見遊征', '夢追翔'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: '愛を伝えたいだとか' }, singers: ['戌亥とこ', '早乙女ベリー', '北見遊征', '夢追翔'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: 'バニー' }, singers: ['早乙女ベリー', '北見遊征'] },
  { videoId: 'tHAVJ0gBJWE', match: { titleSnippet: 'シンデレラボーイ' }, singers: ['夢追翔', '早乙女ベリー'] },

  // ==========================================
  // [12] eZzj4IQHkZE (戌亥とこ, 珠乃井ナナ)
  // ==========================================
  { videoId: 'eZzj4IQHkZE', match: { titleSnippet: '貴方の恋人になりたいのです' }, singers: ['戌亥とこ'] },
  { videoId: 'eZzj4IQHkZE', match: { titleSnippet: 'again' }, singers: ['珠乃井ナナ'] },
  // それ以外は両名

  // ==========================================
  // [13] l741qU3JwKA (三枝明那, 風楽奏斗, 戌亥とこ, Meloco Kyoran)
  // ==========================================
  { videoId: 'l741qU3JwKA', match: { titleSnippet: 'flos' }, singers: ['三枝明那', '風楽奏斗'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: '星屑ビーナス' }, singers: ['戌亥とこ', 'Meloco Kyoran'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: '織姫とBABY' }, singers: ['戌亥とこ', '風楽奏斗'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: '世田谷ナイトサファリ' }, singers: ['戌亥とこ', '三枝明那'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: 'エイリアンズ' }, singers: ['風楽奏斗'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: 'カタオモイ' }, singers: ['戌亥とこ', 'Meloco Kyoran'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: 'メトロノーム' }, singers: ['三枝明那'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: '琥珀色の街、上海蟹の朝' }, singers: ['戌亥とこ', '風楽奏斗', '三枝明那', 'Meloco Kyoran'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: '奏' }, singers: ['戌亥とこ', '三枝明那', '風楽奏斗', 'Meloco Kyoran'] },
  { videoId: 'l741qU3JwKA', match: { titleSnippet: '愛を伝えたいだとか' }, singers: ['戌亥とこ', '三枝明那', '風楽奏斗', 'Meloco Kyoran'] },

  // ==========================================
  // [14] Hqb5WwFvefc (戌亥とこ, ルンルン, 倉持めると)
  // ==========================================
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'ハム太郎' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'アイネクライネ' }, singers: ['ルンルン', '倉持めると'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'Good-bye Days' }, singers: ['戌亥とこ', 'ルンルン'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'ハレンチ' }, singers: ['戌亥とこ', '倉持めると'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: '睡蓮花' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'プラネテス' }, singers: ['ルンルン'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: '絶頂讃歌' }, singers: ['戌亥とこ'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'フィナーレ' }, singers: ['倉持めると'] },
  { videoId: 'Hqb5WwFvefc', match: { titleSnippet: 'ひまわりの約束' }, singers: ['戌亥とこ', 'ルンルン', '倉持めると'] },

  // ==========================================
  // [15] xSOUhSkR_5I (戌亥とこ, 珠乃井ナナ)
  // ==========================================
  { videoId: 'xSOUhSkR_5I', match: { titleSnippet: '瞳' }, singers: ['戌亥とこ'] },
  { videoId: 'xSOUhSkR_5I', match: { titleSnippet: 'いのちの名前' }, singers: ['珠乃井ナナ'] },
  // 他はデュエット

  // ==========================================
  // [16] 0xF8oQBSU8s (戌亥とこ, 榊ネス)
  // ==========================================
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: 'LA・LA・LA LOVE SONG' }, singers: ['戌亥とこ', '榊ネス'] },
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: '夜行' }, singers: ['戌亥とこ'] },
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: '右肩の蝶' }, singers: ['榊ネス'] },
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: 'Pretender' }, singers: ['戌亥とこ', '榊ネス'] },
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: '庶幾の唄' }, singers: ['戌亥とこ'] },
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: '未来予想図' }, singers: ['榊ネス'] },
  { videoId: '0xF8oQBSU8s', match: { titleSnippet: '気まぐれロマンティック' }, singers: ['戌亥とこ', '榊ネス'] },

  // ==========================================
  // [18] P6z9noWh3AY (戌亥とこ, 東堂コハク)
  // ==========================================
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: '少女レイ' }, singers: ['戌亥とこ', '東堂コハク'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: 'Missing' }, singers: ['戌亥とこ'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: 'M' }, singers: ['東堂コハク'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: '木綿のハンカチーフ' }, singers: ['戌亥とこ', '東堂コハク'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: 'Umbrella' }, singers: ['戌亥とこ'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: 'ライラック' }, singers: ['東堂コハク'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: '奏' }, singers: ['戌亥とこ', '東堂コハク'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: '相思相愛' }, singers: ['東堂コハク'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: 'Never Grow Up' }, singers: ['戌亥とこ'] },
  { videoId: 'P6z9noWh3AY', match: { titleSnippet: 'だから僕は音楽を辞めた' }, singers: ['戌亥とこ', '東堂コハク'] },

  // ==========================================
  // [19] mCITW9_7uOw (戌亥とこ, 伊波ライ)
  // ==========================================
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: '雨とカプチーノ' }, singers: ['伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: 'Rain' }, singers: ['戌亥とこ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: '琥珀色の街、上海蟹の朝' }, singers: ['伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: '長く短い祭' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: 'ハレンチ' }, singers: ['戌亥とこ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: '夜撫でるメノウ' }, singers: ['伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: '恋愛裁判' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: 'W●RK' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: 'アカツキの詩' }, singers: ['戌亥とこ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: '朝を呑む' }, singers: ['伊波ライ'] },
  { videoId: 'mCITW9_7uOw', match: { titleSnippet: 'ドレミファロンド' }, singers: ['戌亥とこ', '伊波ライ'] },

  // ==========================================
  // [20] k7Yg7rxSfso (戌亥とこ, 早乙女ベリー)
  // ==========================================
  { videoId: 'k7Yg7rxSfso', match: { titleSnippet: '桜色舞うころ' }, singers: ['戌亥とこ'] },
  { videoId: 'k7Yg7rxSfso', match: { titleSnippet: 'プロトディスコ' }, singers: ['早乙女ベリー'] },
  { videoId: 'k7Yg7rxSfso', match: { titleSnippet: '三日月' }, singers: ['戌亥とこ'] },
  { videoId: 'k7Yg7rxSfso', match: { titleSnippet: '夏夢ノイジー' }, singers: ['早乙女ベリー'] },
  { videoId: 'k7Yg7rxSfso', match: { titleSnippet: 'Jewelry day' }, singers: ['戌亥とこ'] },
  { videoId: 'k7Yg7rxSfso', match: { titleSnippet: 'スーサイドパレヱド' }, singers: ['早乙女ベリー'] },

  // ==========================================
  // [21] OEq1o-uScok (戌亥とこ, 伊波ライ)
  // ==========================================
  { videoId: 'OEq1o-uScok', match: { titleSnippet: '鱗' }, singers: ['戌亥とこ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: '欲望に満ちた青年団' }, singers: ['伊波ライ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: 'Wherever you are' }, singers: ['戌亥とこ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: 'ノーダウト' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: 'アンノウン・マザーグース' }, singers: ['伊波ライ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: '酔いどれ知らず' }, singers: ['戌亥とこ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: '夜明けと蛍' }, singers: ['戌亥とこ', '伊波ライ'] },
  { videoId: 'OEq1o-uScok', match: { titleSnippet: '独りんぼエンヴィー' }, singers: ['戌亥とこ', '伊波ライ'] },

  // ==========================================
  // [22] UbKuRsVmP38 (戌亥とこ, 弦月藤士郎, 緋八マナ, 珠乃井ナナ)
  // ==========================================
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'DADDY!DADDY!DO!' }, singers: ['緋八マナ', '戌亥とこ', '弦月藤士郎', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'スターライトパレード' }, singers: ['緋八マナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'ロマンチシズム' }, singers: ['珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'from Y to Y' }, singers: ['弦月藤士郎'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'ギラギラ' }, singers: ['緋八マナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: '風になる' }, singers: ['戌亥とこ', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'リンネ' }, singers: ['弦月藤士郎', '緋八マナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'ヴィーナスとジーザス' }, singers: ['戌亥とこ', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'たばこ' }, singers: ['戌亥とこ', '弦月藤士郎', '緋八マナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'トウキョウ・シャンディ・ランデヴ' }, singers: ['戌亥とこ', '弦月藤士郎', '緋八マナ', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: '打上花火' }, singers: ['戌亥とこ', '弦月藤士郎'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'それがあなたの幸せとしても' }, singers: ['戌亥とこ', '弦月藤士郎', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'Lemon' }, singers: ['戌亥とこ', '弦月藤士郎', '緋八マナ', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: '感電' }, singers: ['弦月藤士郎'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'Rapport' }, singers: ['緋八マナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: '明日はきっといい日になる' }, singers: ['珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'どこかで日は昇る' }, singers: ['戌亥とこ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: 'Preserved Roses' }, singers: ['緋八マナ', '珠乃井ナナ'] },
  { videoId: 'UbKuRsVmP38', match: { titleSnippet: '晩餐歌' }, singers: ['戌亥とこ', '弦月藤士郎', '緋八マナ', '珠乃井ナナ'] },
];

async function updateSingers() {
  console.log('歌唱者データの個別更新を開始します...');

  // 対象の動画ID一覧を取得
  const targetVideoIds = Array.from(new Set(RULES.map(r => r.videoId)));

  let updatedCount = 0;

  for (const videoId of targetVideoIds) {
    // DBからこの動画の singing_stream と song を取得
    const { data: streams, error } = await supabase
      .from('singing_stream')
      .select('id, video_id, start, song ( id, title )')
      .eq('video_id', videoId);

    if (error) {
      console.error(`Error fetching streams for ${videoId}:`, error);
      continue;
    }

    const videoRules = RULES.filter(r => r.videoId === videoId);

    for (const s of streams || []) {
      const songTitle = (s.song as any)?.title || '';

      // 一致するルールを検索
      const matchedRule = videoRules.find(r => {
        if (r.match.titleSnippet && songTitle.toLowerCase().includes(r.match.titleSnippet.toLowerCase())) {
          return true;
        }
        return false;
      });

      if (matchedRule) {
        const { error: updateError } = await supabase
          .from('singing_stream')
          .update({ singers: matchedRule.singers })
          .eq('id', s.id);

        if (updateError) {
          console.error(`  ✗ 更新失敗 [${s.id}] ${songTitle}:`, updateError);
        } else {
          console.log(`  ✓ 更新成功 [${videoId}] ${songTitle} -> [${matchedRule.singers.join(', ')}]`);
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 歌唱者更新完了: ${updatedCount} 曲`);
  console.log(`========================================\n`);
}

updateSingers().catch(console.error);
