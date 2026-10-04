import type { SingingStreamForSearch } from '../types';

export const DEFAULT_SINGER = '戌亥とこ';
export const ALL_SINGERS_KEY = 'all';

/**
 * 歌い手のアイコン（絵文字）マッピング
 */
export const SINGER_ICONS: Record<string, string> = {
  '戌亥とこ': '🍹',
  'Elira Pendora': '🪶',
  '珠乃井ナナ': '💎',
  '長尾景': '⚔️',
  '立伝都々': '🌊',
  '渚トラウト': '🎣',
  '北見遊征': '🪓',
  '早乙女ベリー': '🍓',
  '蝸堂みかる': '🐌',
  'Finana Ryugu': '🐠',
  'Luca Kaneshiro': '🦁',
  'Maria Marionette': '❤️‍🩹',
  'Doppio Dropscythe': '🐣',
  'Meloco Kyoran': '🌂',
  'Yu Q. Wilson': '🥽',
  '天宮こころ': '🎐',
  'アンジュ・カトリーナ': '⚖️',
  'リゼ・ヘルエスタ': '👑',
  '宇佐美リト': '⚡',
  '町田ちま': '🐹',
  '榊ネス': '🪺',
  '渡会雲雀': '☕',
  '緑仙': '🐼',
  '甲斐田晴': '🌞',
  '倉持めると': '🧸',
  'フレン・E・ルスタリオ': '🍗',
  '伊波ライ': '💡',
  '小清水透': '🫧',
  '星街すいせい': '☄️',
  '朝日南アカネ': '🦖',
  '白上フブキ': '🌽',
  '宝鐘マリン': '🏴‍☠️',
  '樋口楓': '🍁',
  '竜胆尊': '🍶',
  '鈴原るる': '🎨',
  'ドーラ': '🔥',
  'ベルモンド・バンデラス': '🥃',
  'HACHI': '🐝',
  '田中ヒメ': '🥕',
  '鈴木ヒナ': '🐥',
  '音ノ乃のの': '🤍',
  '綺沙良': '❄️',
  'エルセ': '🫧',
  'MaiR': '🎤',
  '朝ノ瑠璃': '🌸',
  'AZKi': '⚒️',
  'かしこまり': '🐼',
  '奏天まひろ': '💫',
  '宗谷いちか': '🐕',
  '花鋏キョウ': '✂️',
  '奏みみ': '🐱',
  '富士葵': '🗻',
  'ルンルン': '🕊️',
  '弦月藤士郎': '🎻',
  '葉加瀬冬雪': '🧪',
  '東堂コハク': '🍯',
  '城瀬いすみ': '🍬',
  '三枝明那': '🌶',
  '風楽奏斗': '🍝',
  '夢追翔': '🎤',
  '緋八マナ': '🐝',
  '西園チグサ': '🐬',
};


/**
 * 歌い手のYouTube公式アバター画像URLマッピング
 */
export const SINGER_AVATARS: Record<string, string> = {
  '戌亥とこ': 'https://yt3.googleusercontent.com/mAVvYycYugOwsRena2BMCbGTYN7Saf3gv5Q9t38eqv_abA7djd-0WEPfRlqrzl8T4QWduoWtgA=s900-c-k-c0x00ffffff-no-rj',
  'Elira Pendora': 'https://yt3.googleusercontent.com/JCyRLd80Znc5g28VztowNaT537HODqR_MbIVvwp_QfFials0GWjNXTrEI7HqqtJdmLe2s7iPKg=s900-c-k-c0x00ffffff-no-rj',
  '早乙女ベリー': 'https://yt3.googleusercontent.com/pDQM3ASuO8uz1B8DGb5J56q2w833A9fse9MZoNJB2jVHIalKR7CCAjQ3Y60iVpZlCF0veC8NaA=s900-c-k-c0x00ffffff-no-rj',
  '珠乃井ナナ': 'https://yt3.googleusercontent.com/w-zj-LtVLKlWMy1zPPUh1e0alK24yF1cnM8SmuvohQkDYpXNk6aQDiqPMB9Z9OZ3ss3Kx1BuFj8=s900-c-k-c0x00ffffff-no-rj',
  '倉持めると': 'https://yt3.googleusercontent.com/TsnQIzAes9ibl0R2ZgRxxlwvtEe8w748U3JKXQDt8fjLIFJQpWiYCW10euMJp9tYNwl3kRhFiXE=s900-c-k-c0x00ffffff-no-rj',
  '町田ちま': 'https://yt3.googleusercontent.com/aMXcrlHw-v17QYLPwCpz7dlFYWEQTOrHEgF3yn8LRYYtiJdY7uaXcEFWlQ3MfDeMlMCD6Tkh8G0=s900-c-k-c0x00ffffff-no-rj',
  'ルンルン': 'https://yt3.googleusercontent.com/L9FU9DSo-1kAkkDrVU2IvftjWPRrED8H35Yl63NcMaDCo5TVBG_ngeaV1_3-O4swEim3GisoPl8=s900-c-k-c0x00ffffff-no-rj',
  '長尾景': 'https://yt3.googleusercontent.com/0lwMTVyM03cDQvQmIe1JQXUE_YSnhsTMG2Q07Hksq9FCuvefNBj-y3yxGUXe_36GDSj2LiFOia8=s900-c-k-c0x00ffffff-no-rj',
  '伊波ライ': 'https://yt3.googleusercontent.com/eu_JpkZlswVvvT-d_mkQEP-SIv4Z31zM04ZOxT2scQFneMUjGGbQ6h9snLC39G8F2CcfVL9bndQ=s900-c-k-c0x00ffffff-no-rj',
  'Meloco Kyoran': 'https://yt3.googleusercontent.com/uG2BEQsDqq-aTIbff80d7THTDR2et9iQcyAu0FdLRM5rAK6p3QWmSu0zX9u17_q9W3xfgnZn=s900-c-k-c0x00ffffff-no-rj',
  '弦月藤士郎': 'https://yt3.googleusercontent.com/h2j_eoHZYMsRr6LetuyZMDXJVnXRKMCCM4gxApJF0g0TjZbjLSCz5pnh-1DCZVRpAiKfyREa=s900-c-k-c0x00ffffff-no-rj',
  '朝日南アカネ': 'https://yt3.googleusercontent.com/ReUJrzDGF7YcEMDYT8bgQa1C45Pn4Ad5HTbPYyFG1N8kbEPOYeG3lWYOJgUaqi5LkfxS6bfb=s900-c-k-c0x00ffffff-no-rj',
  'リゼ・ヘルエスタ': 'https://yt3.googleusercontent.com/4l4itq_UUNzlOrU1ZYvi9HtvgGooUD4ez9G_HV9dVo-igpzXjv0RqZIFEIRbFY8s9uq4CAIY=s900-c-k-c0x00ffffff-no-rj',
  'アンジュ・カトリーナ': 'https://yt3.googleusercontent.com/ytc/AIdro_liDbr1ofzknDCW8S3ChEFTci-PGATj8zCJ1pRWlomUCWo=s900-c-k-c0x00ffffff-no-rj',
  '星街すいせい': 'https://yt3.googleusercontent.com/ytc/AIdro_kLDBK5ksSvk5-XJ6S8e0kWfjy7mVl3jyUkgDeMQ7rlCpU=s900-c-k-c0x00ffffff-no-rj',
  '宇佐美リト': 'https://yt3.googleusercontent.com/jkGfABx8MsuaknGO2_22QTUW-Pr8KDY0Mh2H178BQfxaJakeeHsYW8_7-pv1_SUkYwXK4kywr9Q=s900-c-k-c0x00ffffff-no-rj',
  '榊ネス': 'https://yt3.googleusercontent.com/DdXSgvqpRZij5FeUtkUKgTjj6hpN-sbraFaLcbWxRAinCBEdS3LJ9j9wEc3NaC9xTenLdptXVg=s900-c-k-c0x00ffffff-no-rj',
  '東堂コハク': 'https://yt3.googleusercontent.com/7DPG8oZVOcH0Z6Jv7t0bOjT7uLtM1FNcKbTHPwWBPfqfSqqJLU7whTvPp5T7PRtSwVKbO29B=s900-c-k-c0x00ffffff-no-rj',
  '葉加瀬冬雪': 'https://yt3.googleusercontent.com/ytc/AIdro_mBtaZj_2mhvSw3m8It2vul3zxBDhTNe31PkSPU8UNWWA=s900-c-k-c0x00ffffff-no-rj',
  '緑仙': 'https://yt3.googleusercontent.com/gqKMT95qDCACrpgG3iGrTOfELcpwIkIao4PFK-3vnmQusaS_1RW7yxjBXOVpXs3B_iNOegIT=s900-c-k-c0x00ffffff-no-rj',
  '甲斐田晴': 'https://yt3.googleusercontent.com/XSW6DhbQaMcBBO8oU5p5FH55Yqp3M_wrjGTbJYVT68jlf4MjoZaISXqdeyXtEFheWiyfxPVTQw=s900-c-k-c0x00ffffff-no-rj',
  '小清水透': 'https://yt3.googleusercontent.com/_NbxY0LXXt_9V71OMoUPaAOSWa9vrdXhxGlLewxfHh8sHTVN84me6ZKDql1CewrQR-vM1-WngEo=s900-c-k-c0x00ffffff-no-rj',
  '渡会雲雀': 'https://yt3.googleusercontent.com/aWEFJyI7Z6HdwGNwm1GRfWv-srsmeAsROYq-hDeXa_yQlGPJ-3bhCQRWb-DtXziW65li0E4-=s900-c-k-c0x00ffffff-no-rj',
  'フレン・E・ルスタリオ': 'https://yt3.googleusercontent.com/ytc/AIdro_kY5Q-Wbbkj21heUheTG1mBKz7h0lqbXa2zxFau7dkFwA=s900-c-k-c0x00ffffff-no-rj',
  'Luca Kaneshiro': 'https://yt3.googleusercontent.com/103XpMqHLYhBZRaJCR05-ioI8c70ZeTFTebb-22u9s88UYbki4WJIFOes6VY7X62Y8-St0_CGUU=s900-c-k-c0x00ffffff-no-rj',
  'Maria Marionette': 'https://yt3.googleusercontent.com/Q2fKA6MbNRvVzMKcM4BoJvoOBH73hIbt1FrK8BBHsrzraMel514sP_9IcW3MBOsfZOO6qNd_EA=s900-c-k-c0x00ffffff-no-rj',
  'Doppio Dropscythe': 'https://yt3.googleusercontent.com/7Q-lvhi8QREBJTX7L1G_gFBXPfTWQz6mL5A6WVTBoNBsxyoY-SzufetowA7FM3z3GN6zURoAxQ=s900-c-k-c0x00ffffff-no-rj',
  'Yu Q. Wilson': 'https://yt3.googleusercontent.com/n8tJ8T8KblFSEzZsLD-mKXKkPQ_kttRM48IHkujR6cYt0dJNZtYdWIGF_RklG2R4hKVzS99ha4Q=s900-c-k-c0x00ffffff-no-rj',
  'Finana Ryugu': 'https://yt3.googleusercontent.com/xXO6UqEUCfXxrY16021Fjy6SQxv8GnPTOR_JilIwHE21yunBzMbmp4MEJEps4GOEMKZ6TvBI=s900-c-k-c0x00ffffff-no-rj',
  '天宮こころ': 'https://yt3.googleusercontent.com/TBUgaVyLPLbues92Hj5HoxOVfKoFM8R_2Izmc6QsybDLJm8j9FjBvucA3xVF1Agq-oDLzsPGtA=s900-c-k-c0x00ffffff-no-rj',
  '白上フブキ': 'https://yt3.googleusercontent.com/ytc/AIdro_mGXEeXXCCPh-sl2jKYbYpLBuCsjEGDgJaL5RQziYhyugQ=s900-c-k-c0x00ffffff-no-rj',
  '宝鐘マリン': 'https://yt3.googleusercontent.com/RnFYoR_VkEZZ4OGRJz2cPXem1iRqMNzcGVp5LIxTRqhDu4vqckc83DBrVi2uwxiCPWEmmH6vSJk=s900-c-k-c0x00ffffff-no-rj',
  '樋口楓': 'https://yt3.googleusercontent.com/8IvNB1yT48uO5JrmJ5aKP5DO3oAydtZ2PSyFq7Z-HLpgkAUvsf9O552DbSfkgD_q0CbHvMjeSA=s900-c-k-c0x00ffffff-no-rj',
  '竜胆尊': 'https://yt3.googleusercontent.com/ytc/AIdro_kuGhulz5uvw-LfQF-9hxZ0EgG0hq06IHT1LMryVD5_HA=s900-c-k-c0x00ffffff-no-rj',
  'ドーラ': 'https://yt3.googleusercontent.com/ytc/AIdro_lhYG4sK8nzyhknFqTpq23-g2GWZ3cOaCC-TJ-3NpJgubM=s900-c-k-c0x00ffffff-no-rj',
  'ベルモンド・バンデラス': 'https://yt3.googleusercontent.com/ytc/AIdro_kPzhWinVi4J6aBUsxJKTKL5qa4gDcDjkpAgTeh5SDbiQ=s900-c-k-c0x00ffffff-no-rj',
  'HACHI': 'https://yt3.googleusercontent.com/H-4LjUOXUNlV4iWjKwpRpT99NZZFjTVkd0ssRdvB6biU28ioa-9ryrru8I0LqyM8eITPCFujmA=s900-c-k-c0x00ffffff-no-rj',
  '田中ヒメ': 'https://yt3.googleusercontent.com/nPHRhyl-fq_XwruRR5btA8_lafZKoc86TZBBDx6XjiclwI1qU51ejBG_wwj69CdWKyDyDmLM=s900-c-k-c0x00ffffff-no-rj',
  '鈴木ヒナ': 'https://yt3.googleusercontent.com/nPHRhyl-fq_XwruRR5btA8_lafZKoc86TZBBDx6XjiclwI1qU51ejBG_wwj69CdWKyDyDmLM=s900-c-k-c0x00ffffff-no-rj',
  '城瀬いすみ': 'https://yt3.googleusercontent.com/TwRjFmv84E_RDnz9qqkez3TkFmjqDd5JXKghTAC34RPHIvHEwMXQDZz5da6ska7zwrpNHP0Rcw=s900-c-k-c0x00ffffff-no-rj',
  '三枝明那': 'https://yt3.googleusercontent.com/1gWkGOLFKaJmO5TnkdQGTSaelBY-lRtgPoo8ZS_bk_4vJt7wZ1ZT-k6MH60Ia-Oq9bgQVvlTyw=s900-c-k-c0x00ffffff-no-rj',
  '風楽奏斗': 'https://yt3.googleusercontent.com/oZ33Q5iMwNyfcqODF2zw65lDve4sZOK6L0Co0rPUb96qZbyVqPF5a8scUNC7-FIvChDSO1EdUNY=s900-c-k-c0x00ffffff-no-rj',
  '夢追翔': 'https://yt3.googleusercontent.com/ytc/AIdro_nC1vZQji-GXgqRtVNm5JtAvoHeVROcemv0BfmNDvECiA=s900-c-k-c0x00ffffff-no-rj',
  '緋八マナ': 'https://yt3.googleusercontent.com/k1aBj2y8MU03gU5RXhHDN_J7ou1otAfxWhqAUTfad04RYYirsErlS5OufFrhgnbRAY7H8aw8fw=s900-c-k-c0x00ffffff-no-rj',
  '蝸堂みかる': 'https://yt3.googleusercontent.com/6p0ViHZGOpjB_Ywf_hKGFFD3nuJUCig7_H4-Q05_WcRpw6knTFdBDcnvQPSAfOX78pUH7lAepQ=s900-c-k-c0x00ffffff-no-rj',
  '北見遊征': 'https://yt3.googleusercontent.com/RGOFsNbuxwueJwCb8q9h6tji7XwRadNvxgfqV9AuprLp_y2yDIQXybA_bGBRBdqXA6_esKFLDJY=s900-c-k-c0x00ffffff-no-rj',
  '立伝都々': 'https://yt3.googleusercontent.com/9n6jmy-hWa5TEsBAoWK2Sr_ksuFCb1P6gW_b0aE1NBbayX5m4NySFPAlHsBlRnZJo22br1fXzw=s900-c-k-c0x00ffffff-no-rj',
  '渚トラウト': 'https://yt3.googleusercontent.com/ZEQZZ0I8GBiRdc8R1mu_TuLPSleVvIJoNZE_3ZdYZpvZwUbRRug1MU2i-puzaor8dPUSD4Njng=s900-c-k-c0x00ffffff-no-rj',
  '鈴原るる': 'https://yt3.googleusercontent.com/ytc/AIdro_lqdIs9nwtS_SyEwqOTTrORbbgw26ol8TVs5DCrqVLcAw=s900-c-k-c0x00ffffff-no-rj',
  '朝ノ瑠璃': 'https://yt3.googleusercontent.com/Y2D0FcAyWjdJimvrJwkefntu0uLaanSw6FY_8bE1ZSpc8EB89_yyqqPlbRyhc4QLyJOjcnQajMY=s900-c-k-c0x00ffffff-no-rj',
  '奏みみ': 'https://yt3.googleusercontent.com/qNpYEox_ZiOwXw6gJqHkIXMX1cSJ2in8RQCTquolmeNiLsIuSiSce-93Fwex-glZ9bmD_9wn=s900-c-k-c0x00ffffff-no-rj',
  '富士葵': 'https://yt3.googleusercontent.com/Q-CUXLJCa9cBU0Woo5uXHcb6STyHBJwDfeyVV5_lcKlCoOEq__Rd41B94YgvJpZFt_JeMFPbI10=s900-c-k-c0x00ffffff-no-rj',
  'エルセ': 'https://yt3.googleusercontent.com/J2lSdPsMGgkfSt0Z--_LYxT_z-IvDnUiPYRpe9hROVb-Nw_QHqVLrrmwHjy-hA9My81yhSddmw=s900-c-k-c0x00ffffff-no-rj',
  '音ノ乃のの': 'https://yt3.googleusercontent.com/qwfCQ_X03woVDrE7JKVW42zy0tbPfs1vN8r1tANjt3JpIQOLgwNdB9Ob5jx6bM5cqxROxXAkUAA=s900-c-k-c0x00ffffff-no-rj',
  'MaiR': 'https://yt3.googleusercontent.com/CHi_adUGiXZtmNf2wkrBlIVOM-zTgqR90q5Ulwce2MZVfLkGoQ_OVAnVvaA8G5qeea8rlYltug0=s900-c-k-c0x00ffffff-no-rj',
  'AZKi': 'https://yt3.googleusercontent.com/tRZGMhn8vSvYE0_15SjaE_3dTH5JTZzjdnb5gs1StecT1tKn1gQ2tVkRfi_n42Q5fYz13ewdayo=s900-c-k-c0x00ffffff-no-rj',
  'かしこまり': 'https://yt3.googleusercontent.com/ytc/AIdro_n1RrzMOp0nFbSG1pBN5sp0Pqh-yjvIyxqh0Lek9Jja77M=s900-c-k-c0x00ffffff-no-rj',
  '奏天まひろ': 'https://yt3.googleusercontent.com/IYvOdbhEdnIZe2HFWCewhtkv3rYIbxYjR34gdVKWZ7EaLEDfZNAKCkDv_TuB8nVIBjSz_dmLTQ=s900-c-k-c0x00ffffff-no-rj',
  '宗谷いちか': 'https://yt3.googleusercontent.com/SYYjMkHJKNjLPn72_m1OHBDwZzGVFBJfKJvIb-HzxaK8QmYvjnUNyBHthwLr787n3ig1ArsJGLk=s900-c-k-c0x00ffffff-no-rj',
  '花鋏キョウ': 'https://yt3.googleusercontent.com/YFD87IueOX8p7UcywKgJmTIlsxlbhxTACJZTiAAp2rBPT3_AeQMliFFdX-zFrlAq0FQan9_nvQ=s900-c-k-c0x00ffffff-no-rj',
  '綺沙良': 'https://yt3.googleusercontent.com/2JXV_c9_Fw9_19LZykzhdohREdfh9fAG73y_P0YW3nbzbjdDKhDh97N3z5kHdhFFaer0H2bk=s900-c-k-c0x00ffffff-no-rj',
  '西園チグサ': 'https://yt3.googleusercontent.com/6JihrN90Qv35zVpSd4RGgFMRwokH7lGZnIRnsM-e7NmMkKF36nMcDE23rFQmkkq0qQBPD4NuwGM=s900-c-k-c0x00ffffff-no-rj',
};


export function getSingerAvatar(singer: string, fallbackPhoto?: string | null): string | undefined {
  return SINGER_AVATARS[singer] || fallbackPhoto || undefined;
}

export function getSingerIcon(singer: string): string {
  return SINGER_ICONS[singer] || '🎤';
}

export interface SingerSummary {
  name: string;
  count: number;
  icon: string;
  isDefault?: boolean;
}

/**
 * ストリーム一覧から歌い手ごとの楽曲数を集計し、整理して返す
 */
export function getSingersWithCount(
  streams: SingingStreamForSearch[] | null | undefined,
): SingerSummary[] {
  if (!streams) return [];

  const countMap = new Map<string, number>();

  for (const stream of streams) {
    if (stream.singers && stream.singers.length > 0) {
      for (const singer of stream.singers) {
        if (!singer) continue;
        countMap.set(singer, (countMap.get(singer) || 0) + 1);
      }
    }
  }

  // 除外したいシステムタグやノイズがあればフィルタ（例: DAM関連のタグ等）
  const IGNORED_SINGERS = new Set(['SUPPORTED BY DAM', 'mostly!']);

  const summaries: SingerSummary[] = [];
  countMap.forEach((count, name) => {
    if (IGNORED_SINGERS.has(name)) return;
    summaries.push({
      name,
      count,
      icon: getSingerIcon(name),
      isDefault: name === DEFAULT_SINGER,
    });
  });

  // 並び順:
  // 1. DEFAULT_SINGER (戌亥とこ) を先頭
  // 2. それ以外は曲数が多い順
  // 3. 曲数が同じ場合は五十音順
  summaries.sort((a, b) => {
    if (a.name === DEFAULT_SINGER) return -1;
    if (b.name === DEFAULT_SINGER) return 1;
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, 'ja');
  });

  return summaries;
}

/**
 * チャンネルIDからマッピング済みの歌い手名を逆引きする
 */
export function findSingerByChannelId(channelId?: string | null): string | null {
  if (!channelId) return null;
  for (const [singer, id] of Object.entries(SINGER_CHANNEL_IDS)) {
    if (id === channelId) return singer;
  }
  return null;
}

/**
 * Holodex のチャンネル名（例: "雲母たまこ / Kirara Tamako【にじさんじ】"）から
 * 扱いやすい表示名を抽出する
 */
export function cleanChannelName(rawName?: string | null): string {
  if (!rawName) return '';
  // 【...】や [...] を除去
  let cleaned = rawName.replace(/【.*?】/g, '').replace(/\[.*?\]/g, '').trim();
  // "名前 / 英語名" や "英語名 Ch. 名前" の分割
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0].trim();
  } else if (cleaned.includes(' Ch. ')) {
    const parts = cleaned.split(' Ch. ');
    cleaned = (parts[1] || parts[0]).trim();
  } else if (cleaned.includes(' Channel ')) {
    const parts = cleaned.split(' Channel ');
    cleaned = (parts[1] || parts[0]).trim();
  }
  return cleaned || rawName;
}

/**
 * クエリパラメータ（singer または channel）から現在選択されている歌い手を判定する
 * 未指定時は DEFAULT_SINGER ('戌亥とこ')
 */
export function resolveCurrentSinger(
  querySinger?: string | string[],
  queryChannel?: string | string[],
  channelsMap?: Record<string, { name?: string | null }>,
): string {
  const channelParam = Array.isArray(queryChannel) ? queryChannel[0] : queryChannel;
  const singerParam = Array.isArray(querySinger) ? querySinger[0] : querySinger;

  // 1. channel パラメータがある場合
  if (channelParam && channelParam.trim()) {
    const trimmedChannel = channelParam.trim();
    const mapped = findSingerByChannelId(trimmedChannel);
    if (mapped) return mapped;
    if (channelsMap && channelsMap[trimmedChannel]?.name) {
      return cleanChannelName(channelsMap[trimmedChannel].name);
    }
    return trimmedChannel;
  }

  // 2. singer パラメータがある場合
  if (singerParam && singerParam.trim()) {
    const trimmedSinger = singerParam.trim();
    // singer パラメータが UC から始まるチャンネル ID だった場合の対応
    if (trimmedSinger.startsWith('UC') && trimmedSinger.length >= 20) {
      const mapped = findSingerByChannelId(trimmedSinger);
      if (mapped) return mapped;
      if (channelsMap && channelsMap[trimmedSinger]?.name) {
        return cleanChannelName(channelsMap[trimmedSinger].name);
      }
    }
    return trimmedSinger;
  }

  return DEFAULT_SINGER;
}

/**
 * にじさんじライバーのYouTubeチャンネルIDマッピング
 */
export const SINGER_CHANNEL_IDS: Record<string, string> = {
  '戌亥とこ': 'UCXRlIK3Cw_TJIQC5kSJJQMg',
  '早乙女ベリー': 'UC0xry7czPasj1wPxR8L0MZg',
  '珠乃井ナナ': 'UCkhViRjLUKgIcVpar9JiNrw',
  '町田ちま': 'UCo7TRj3cS-f_1D9ZDmuTsjw',
  'アンジュ・カトリーナ': 'UCHVXbQzkl3rDfsXWo8xi2qw',
  'リゼ・ヘルエスタ': 'UCZ1xuCK1kNmn5RzPYIZop3w',
  '長尾景': 'UCXW4MqCQn-jCaxlX-nn-BYg',
  '弦月藤士郎': 'UCGw7lrT-rVZCWHfdG9Frcgg',
  '甲斐田晴': 'UCo2N7C-Z91waaR6lF3LL_jw',
  '緑仙': 'UCt5-0i4AVHXaWJrL8Wql3mw',
  '渡会雲雀': 'UC4l9gz3q65lTBFfFtW5LLeA',
  '宇佐美リト': 'UCambvP8yxNDot4FzQc9cgiw',
  '伊波ライ': 'UCz89MGFBrAqwJ5xMr5weSuA',
  '榊ネス': 'UCyXBNgCulibV9pRm3ZKpmoQ',
  '倉持めると': 'UCiA-trSZfB0i92V_-dyDqBw',
  '小清水透': 'UCUP8TmlO7NNra88AMqGU_vQ',
  'フレン・E・ルスタリオ': 'UCuep1JCrMvSxOGgGhBfJuYw',
  'ルンルン': 'UCzNXpqpdvlibmNc1JpM1o4g',
  '樋口楓': 'UCsg-YqdqQ-KFF0LNk23BY4A',
  '竜胆尊': 'UCPvGypSgfDkVe7JG2KygK7A',
  'ドーラ': 'UC53UDnhAAYwvNO7j_2Ju1cQ',
  'ベルモンド・バンデラス': 'UCbc8fwhdUNlqi-J99ISYu4A',
  '夢追翔': 'UCTIE7LM5X15NVugV7Krp9Hw',
  '三枝明那': 'UCNW1Ex0r6HsWRD4LCtPwvoQ',
  '葉加瀬冬雪': 'UCGYAYLDE7TZiiC8U6teciDQ',
  '朝日南アカネ': 'UCe_p3YEuYJb8Np0Ip9dk-FQ',
  '東堂コハク': 'UCebT4Aq-3XWb5je1S1FvR_A',
  '風楽奏斗': 'UCC7rRD6P7RQcx0hKv9RQP4w',
  '緋八マナ': 'UCqXxS-9x9Ha_UiH6hG4kh5Q',
  '北見遊征': 'UCcx3crxPFi006DUhb_YU-tw',
  '立伝都々': 'UCnbJ8LTbHrsRgqkxwJXCU8w',
  '渚トラウト': 'UCpjypWF_wNRs9_TrjjWngpQ',
  '蝸堂みかる': 'UCIq2HwA2iBOso7ar4VuU-TA',
  '城瀬いすみ': 'UCHVSA2OScyef9W7OwPGgJ9w',
  '天宮こころ': 'UCkIimWZ9gBJRamKF0rmPU8w',
  '鈴原るる': 'UC_a1ZYZ8ZTXpjg9xUY9sj8w',
  '綺沙良': 'UCiJ_Um3KbfF19NzkDYLzZVQ',
  'Elira Pendora': 'UCIeSUTOTkF9Hs7q3SGcO-Ow',
  'Finana Ryugu': 'UCu-J8uIXuLZh16gG-cT1naw',
  'Luca Kaneshiro': 'UC7Gb7Uawe20QyFibhLl1lzA',
  'Maria Marionette': 'UCwaS8_S7kMiKA3izlTWHbQg',
  'Doppio Dropscythe': 'UCy91xBlY_Brh3bnHxKtjrrg',
  'Meloco Kyoran': 'UChKXd7oqD18qiIYBoRIHTlw',
  'Yu Q. Wilson': 'UCKpKC3M5fkcEvtOr06dmYlA',
  // ホロライブ
  '星街すいせい': 'UC5CwaMl1eIgY8h02uZw7u8A',
  '白上フブキ': 'UCdn5BQ06XqgXoAxIhbqw5Rg',
  '宝鐘マリン': 'UCCzUftO8KOVkV4wQG1vkUvg',
  'AZKi': 'UC0TXe_LYZ4scaW2XMyi5_kw',
  // その他VTuber・個人勢
  'HACHI': 'UC7XCjKxBEct0uAukpQXNFPw',
  '田中ヒメ': 'UCFv2z4iM5vHrS8bZPq4fHQQ',
  '鈴木ヒナ': 'UCFv2z4iM5vHrS8bZPq4fHQQ',
  '音ノ乃のの': 'UCqe0-vqZwAvZUb22wCMu1fA',
  'エルセ': 'UCGphOcrcx_oLH22bevHe8og',
  'MaiR': 'UCsiKFVHkQSMlSe0vaCG0anw',
  '朝ノ瑠璃': 'UCODNLyn3L83wEmC0DLL0cxA',
  'かしこまり': 'UCfiK42sBHraMBK6eNWtsy7A',
  '奏天まひろ': 'UC_G7GmYMrHg_yLorA0MMy8w',
  '宗谷いちか': 'UC2kyQhzGOB-JPgcQX9OMgEw',
  '花鋏キョウ': 'UC4OeUf_KfYRrwksschtRYow',
  '奏みみ': 'UCpHIwGHq_3OfX42cyfyJp-A',
  '富士葵': 'UC3Ruo_5doyu514PesWGvCAg',
};

/**
 * 歌い手名から NijiViewer (https://nijiviewer.mukwty.com) のライバー個別ページ URL を取得する
 * チャンネル ID が登録されている場合（または fallbackChannelId がある場合）は遷移 URL を返却する
 */
export function getNijiViewerUrl(singer: string, fallbackChannelId?: string): string | null {
  const channelId = SINGER_CHANNEL_IDS[singer] || fallbackChannelId;
  if (!channelId) {
    return null;
  }
  return `https://nijiviewer.mukwty.com/liver/${channelId}`;
}
