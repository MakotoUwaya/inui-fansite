import type { SongMetadata } from '../types';

export const MOOD_LABELS: Record<string, { label: string; icon: string }> = {
  ballad: { label: 'しっとり・バラード', icon: '🌙' },
  emotional: { label: 'エモい・切ない', icon: '✨' },
  cool: { label: 'クール・ロック', icon: '🔥' },
  bright: { label: '明るい・ポップ', icon: '☀️' },
  jazz_rnb: { label: 'ジャジー・大人', icon: '🍸' },
};

export const GENRE_LABELS: Record<string, { label: string; icon: string }> = {
  anime: { label: 'アニソン', icon: '🎬' },
  vocaloid: { label: 'ボカロ', icon: '🎵' },
  jpop: { label: 'J-POP', icon: '🎤' },
  nostalgic: { label: 'レトロ・歌謡曲', icon: '📻' },
  vtuber: { label: 'VTuberソング', icon: '🍹' },
};

export type FilterPresetId =
  | 'all'
  | 'night'
  | 'collab'
  | 'anime'
  | 'vocaloid'
  | 'cool'
  | 'bright'
  | 'ballad'
  | 'nostalgic';

export type FilterPreset = {
  id: FilterPresetId;
  label: string;
  icon: string;
  description?: string;
  match: (metadata?: SongMetadata | null, stream?: any) => boolean;
};

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'all',
    label: 'すべて',
    icon: '✨',
    match: () => true,
  },
  {
    id: 'night',
    label: '今夜聴きたいしっとり',
    icon: '🌙',
    description: '深夜に落ち着いて聴きたい、優しいバラードや癒やしの曲',
    match: (meta) => Boolean(meta && (meta.is_night_pick || meta.mood === 'ballad')),
  },
  {
    id: 'collab',
    label: 'コラボ曲',
    icon: '👥',
    description: '他のライバーと一緒に歌唱しているコラボ・デュエット曲',
    match: (_meta, stream) => Boolean(stream?.singers && stream.singers.length > 1),
  },
  {
    id: 'anime',
    label: 'アニソン',
    icon: '🎬',
    description: 'アニメ主題歌・挿入歌・劇場版タイアップ',
    match: (meta) => meta?.genre === 'anime',
  },
  {
    id: 'vocaloid',
    label: 'ボカロ',
    icon: '🎵',
    description: 'ボカロP制作・初音ミク等のボーカロイド名曲',
    match: (meta) => meta?.genre === 'vocaloid',
  },
  {
    id: 'cool',
    label: 'クール・かっこいい',
    icon: '🔥',
    description: '低音やビートが効いた、力強いロックやスタイリッシュなナンバー',
    match: (meta) => meta?.mood === 'cool',
  },
  {
    id: 'bright',
    label: '明るい・ポップ',
    icon: '☀️',
    description: '前向きで元気になれるポップチューン',
    match: (meta) => meta?.mood === 'bright',
  },
  {
    id: 'nostalgic',
    label: 'レトロ・歌謡曲',
    icon: '📻',
    description: '昭和・平成初期のシティポップや懐かしの名曲',
    match: (meta) => meta?.genre === 'nostalgic',
  },
];
