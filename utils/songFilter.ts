import type { SingingStreamForSearch } from '../types';
import { ALL_SINGERS_KEY } from './singerConfig';
import { FILTER_PRESETS, FilterPresetId } from './songMetadata';

export interface SongFilterOptions {
  filter?: string;
  singer?: string;
  keyword?: string;
}

/**
 * プリセット、歌唱者、キーワードに基づき楽曲リストを絞り込む
 */
export function filterStreams(
  streams: SingingStreamForSearch[] | null | undefined,
  options: SongFilterOptions,
): SingingStreamForSearch[] {
  if (!streams) return [];

  const { filter, singer, keyword } = options;
  const activePreset = FILTER_PRESETS.find((p) => p.id === filter) || FILTER_PRESETS[0];

  return streams.filter((stream) => {
    // 1. プリセットフィルター（ムード・ジャンル・コラボ）
    if (!activePreset.match(stream.song.song_metadata, stream)) {
      return false;
    }

    // 2. 歌唱者フィルター ('all' または未指定の場合は全歌い手対象)
    if (singer && singer !== ALL_SINGERS_KEY) {
      if (!stream.singers || !stream.singers.includes(singer)) {
        return false;
      }
    }

    // 3. キーワード検索（曲名、原曲アーティスト、歌唱者）
    if (keyword) {
      const kw = keyword.toLowerCase().trim();
      if (kw) {
        const titleMatch = stream.song.title.toLowerCase().includes(kw);
        const artistMatch = stream.song.artist?.toLowerCase().includes(kw);
        const singerMatch = stream.singers?.some((s) => s.toLowerCase().includes(kw));
        if (!titleMatch && !artistMatch && !singerMatch) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * 現在のフィルター状態の要約と、絞り込み中かどうかのフラグを返す
 */
export function getFilterSummary(options: SongFilterOptions): {
  label: string;
  isFiltered: boolean;
  filterLabel?: string;
  singerLabel?: string;
  keywordLabel?: string;
} {
  const parts: string[] = [];
  let filterLabel: string | undefined;
  let singerLabel: string | undefined;
  let keywordLabel: string | undefined;

  const activePreset = FILTER_PRESETS.find((p) => p.id === options.filter);
  if (activePreset && activePreset.id !== 'all') {
    filterLabel = `${activePreset.icon} ${activePreset.label}`;
    parts.push(filterLabel);
  }
  if (options.singer) {
    singerLabel = `🎤 ${options.singer}`;
    parts.push(singerLabel);
  }
  if (options.keyword && options.keyword.trim()) {
    keywordLabel = `🔍 "${options.keyword.trim()}"`;
    parts.push(keywordLabel);
  }

  const isFiltered = parts.length > 0;
  return {
    label: isFiltered ? parts.join(' ・ ') : 'すべての楽曲',
    isFiltered,
    filterLabel,
    singerLabel,
    keywordLabel,
  };
}
