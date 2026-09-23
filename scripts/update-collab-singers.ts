import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const updates: Record<string, string[]> = {
  // sz3SGilaOAA (戌亥とこ×長尾景)
  'bdd5b5d4-c8d6-424e-a9c1-d399b666eb4b': ['戌亥とこ'], // 未来予想図II
  '1007f642-67a3-46f3-8fed-72be07fe17da': ['長尾景'],   // どんなときも。
  '7955def4-a7e2-4882-a987-8ec361e7b597': ['戌亥とこ'], // 空も飛べるはず
  '35381ab8-7bf4-4af5-ab69-ced9b327cbd5': ['長尾景'],   // バンザイ
  '1409cd06-fde3-4de1-b01f-cbb844542b72': ['戌亥とこ', '長尾景'], // タイミング
  '6d2f829a-e710-4fa3-baaa-21df56110b2f': ['戌亥とこ'], // ギブス
  '3b790fa9-bccd-4d90-9172-a5624c5c0797': ['長尾景'],   // 天体観測
  '3ddc0c76-dd28-47e8-8cdb-7586f5433691': ['戌亥とこ'], // 奏
  '87d7c2cf-08bb-41a0-adaa-5dde03069388': ['長尾景'],   // 純恋歌
  '4b4c349d-64f8-41f2-abd7-c29816bbbc6b': ['戌亥とこ', '長尾景'], // 蕾
  'a4fe4c1b-13bd-4bc3-b484-3e2f6c7d16d6': ['戌亥とこ'], // 深海少女
  '38bb88b4-09d3-4e24-86c3-25fa94cfae86': ['長尾景'],   // 千本桜
  '7036140d-bf68-4946-b6b8-649da02639d8': ['戌亥とこ', '長尾景'], // 神のまにまに
  'c6f8d387-2b3a-49c7-a390-84c229fedf3a': ['長尾景'],   // サイレントマジョリティー
  '491b092c-860a-48f1-b0c3-8ed61e733064': ['戌亥とこ', '長尾景'], // 打上花火
  '4fe768ec-1ec4-4970-907d-a38d46cbd9a6': ['戌亥とこ', '長尾景'], // Lemon

  // IYYiJwcO2B0 (戌亥とこ×珠乃井ナナ - ジブリ)
  'cfa31924-2222-4f69-825d-0a30c4f9c2ac': ['戌亥とこ', '珠乃井ナナ'], // テルーの唄
  'c3b34502-85a5-4791-a787-903828d3af99': ['戌亥とこ', '珠乃井ナナ'], // 君をのせて
  '86748be4-25e9-4269-8cc5-374a147600da': ['戌亥とこ'],               // ひこうき雲
  '1751f89a-af0a-4741-8aa3-57ff4a50fa7d': ['珠乃井ナナ'],             // 地球儀
  '851e1b33-b4d3-4b04-8e0a-0fcc0e0179dd': ['戌亥とこ', '珠乃井ナナ'], // やさしさに包まれたなら
  'd2bb8518-afbb-446c-9319-2b3d56654ab9': ['戌亥とこ', '珠乃井ナナ'], // 崖の上のポニョ
  'd23eb7f5-f4c8-4ea4-99cb-aa3fdfcf8e25': ['珠乃井ナナ'],             // いのちの名前
  'afe17999-9833-490d-8f36-1d244f7e95be': ['戌亥とこ'],               // ルージュの伝言
  'a01fa3d8-408c-4047-b84d-2f2592c2137e': ['珠乃井ナナ'],             // 時の歌
  '2f2f224e-8f3e-412c-9d10-7d5883928dd8': ['戌亥とこ'],               // 世界の約束
  '58a784e8-f734-48c2-85c8-896a2cbb733b': ['戌亥とこ', '珠乃井ナナ'], // 風になる

  // jj4bKFqicXM (5人コラボ)
  'd4d4aac8-d9a2-4f12-8132-0965441466ff': ['立伝都々', '北見遊征', '珠乃井ナナ', '早乙女ベリー', '渚トラウト'], // カーテンコール
  '747a6d8e-72d5-4482-b73d-aefc82c3ebcb': ['立伝都々', '北見遊征'],                               // HANDS UP!
  '93689f29-b312-446c-a6d3-c14d983c0714': ['珠乃井ナナ', '早乙女ベリー'],                         // ラブソングに襲われる
  '615e05a4-047b-465e-ae72-b4cc6331c992': ['立伝都々', '渚トラウト'],                             // 太陽系デスコ
  'c1af86ec-fd61-4c28-8c2c-29bbb4ab12f7': ['北見遊征', '早乙女ベリー'],                           // カメレオン
  '5b133a6e-ee9d-406d-81d7-d40e1645e6a0': ['立伝都々', '珠乃井ナナ', '渚トラウト'],               // ノーダウト
  '92f36afc-ef30-4eea-b2c8-a2459c84a949': ['立伝都々', '北見遊征', '珠乃井ナナ', '早乙女ベリー', '渚トラウト'], // メリッサ
  '7eed651c-b476-4333-842c-5f2ac8f85dcc': ['立伝都々', '珠乃井ナナ', '早乙女ベリー'],             // 瞬間センチメンタル
  'bebf56e4-b442-448b-af9f-9dba00a12c76': ['北見遊征', '渚トラウト'],                             // フラジール
  '24397d57-bae5-4502-b2e0-391f29db005c': ['珠乃井ナナ', '渚トラウト'],                           // unravel
  'b6a3e195-cc56-4a57-9d6d-d0615e56f459': ['早乙女ベリー', '渚トラウト'],                         // 容姿端麗な嘘
  '104856c9-64ab-48b7-810f-78658ba3be7c': ['北見遊征', '珠乃井ナナ'],                             // 勿忘
  'e919f2d6-e7e3-4310-9d2f-e62cbdca290c': ['立伝都々', '北見遊征', '早乙女ベリー'],               // とくべチュ、して
  '38191197-9028-485b-a4ac-9354994e129c': ['立伝都々', '北見遊征', '珠乃井ナナ', '早乙女ベリー', '渚トラウト'], // イイじゃん
};

async function main() {
  console.log('歌唱者情報の訂正アップデートを開始します...');
  let count = 0;
  for (const [id, singers] of Object.entries(updates)) {
    const { error } = await supabase
      .from('singing_stream')
      .update({ singers })
      .eq('id', id);

    if (error) {
      console.error(`ID: ${id} の更新に失敗:`, error);
    } else {
      count++;
    }
  }
  console.log(`完了: 全 ${Object.keys(updates).length} 件中 ${count} 件の歌唱者情報を更新しました。`);
}

main().catch(console.error);
