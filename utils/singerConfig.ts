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
};

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
 * クエリパラメータから現在選択されている歌い手を判定する
 * 未指定時は DEFAULT_SINGER ('戌亥とこ')
 */
export function resolveCurrentSinger(querySinger?: string | string[]): string {
  if (!querySinger) {
    return DEFAULT_SINGER;
  }
  const singer = Array.isArray(querySinger) ? querySinger[0] : querySinger;
  return singer.trim() || DEFAULT_SINGER;
}
