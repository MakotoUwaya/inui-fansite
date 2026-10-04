export interface HolodexChannelSummary {
  id: string;
  name: string;
  english_name?: string | null;
  org?: string | null;
  suborg?: string | null;
  group?: string | null;
  type?: string | null;
  subscriber_count?: number | string | null;
  video_count?: number | string | null;
  photo?: string | null;
}

/**
 * ライバーの所属グループ・ユニット名を取得する
 * Holodex の group プロパティ（例: "Sanbaka"）を最優先し、
 * なければ suborg の先頭2文字カット（例: "0iSanbaka" -> "Sanbaka"）をフォールバックとして使用する
 */
export function getChannelGroup(channel?: HolodexChannelSummary | null): string {
  if (!channel) return '';
  if (channel.group && channel.group.trim()) {
    return channel.group.trim();
  }
  return formatSuborg(channel.suborg);
}

/**
 * 登録者数を「xx.x万人」や「x,xxx人」の形式に丸めて整形する
 */
export function formatSubscriberCount(count?: number | string | null): string {
  if (count === undefined || count === null || count === '') return '';
  const num = typeof count === 'string' ? Number(count) : count;
  if (isNaN(num) || num <= 0) return '';

  if (num >= 10000) {
    const man = num / 10000;
    // 100万人以上でちょうど割り切れる場合は「100万人」、それ以外は小数第1位まで「xx.x万人」
    if (man >= 100 && Number.isInteger(man)) {
      return `${man.toFixed(0)}万人`;
    }
    return `${man.toFixed(1)}万人`;
  }

  return `${num.toLocaleString('ja-JP')}人`;
}

/**
 * suborg の先頭2文字（ソート用プレフィックス等）をカットして整形する
 * 例: "0iSanbaka" -> "Sanbaka", "101SEEDs1期" -> "SEEDs1期"
 */
export function formatSuborg(suborg?: string | null): string {
  if (!suborg) return '';
  const trimmed = suborg.trim();
  if (trimmed.length <= 2) return trimmed;
  return trimmed.substring(2);
}
