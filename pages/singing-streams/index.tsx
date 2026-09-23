import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { MdClear, MdSearch } from 'react-icons/md';
import { Layout } from '../../components/Layout/Layout';
import { SingingStreamMediaObject } from '../../components/SingingStreamMediaObject/SingingStreamMediaObject';
import { Spinner } from '../../components/Spinner/Spinner';
import { useSingingStreamsForSearch } from '../../hooks/singing-stream';
import { FILTER_PRESETS, FilterPresetId } from '../../utils/songMetadata';
import { filterStreams } from '../../utils/songFilter';
import styles from './index.module.scss';

type SearchForm = {
  keyword: string;
};

function SingingStreamsPage() {
  const router = useRouter();
  const { register, handleSubmit, resetField, watch, setValue } = useForm<SearchForm>();
  const { streams } = useSingingStreamsForSearch();

  const activeFilterId = ((router.query.filter as FilterPresetId) || 'all');
  const activeSinger = (router.query.singer as string) || '';
  const searchKeyword = (router.query.keyword as string) || '';

  const activePreset = useMemo(
    () => FILTER_PRESETS.find((p) => p.id === activeFilterId) || FILTER_PRESETS[0],
    [activeFilterId],
  );

  // 登録されている全歌唱者（singers）のリストを動的に抽出
  const allSingers = useMemo(() => {
    if (!streams) return [];
    const set = new Set<string>();
    for (const stream of streams) {
      if (stream.singers) {
        for (const singer of stream.singers) {
          if (singer) set.add(singer);
        }
      }
    }
    // 戌亥とこを先頭に、他は五十音順
    const list = Array.from(set);
    return list.sort((a, b) => {
      if (a === '戌亥とこ') return -1;
      if (b === '戌亥とこ') return 1;
      return a.localeCompare(b, 'ja');
    });
  }, [streams]);

  const updateQueryParams = useCallback(
    (params: { keyword?: string; filter?: string; singer?: string }) => {
      const nextQuery: Record<string, string> = {};
      const kw = params.keyword !== undefined ? params.keyword : searchKeyword;
      const fl = params.filter !== undefined ? params.filter : activeFilterId;
      const sg = params.singer !== undefined ? params.singer : activeSinger;

      if (kw) nextQuery.keyword = kw;
      if (fl && fl !== 'all') nextQuery.filter = fl;
      if (sg) nextQuery.singer = sg;

      router.push({ query: nextQuery });
    },
    [router, searchKeyword, activeFilterId, activeSinger],
  );

  const onSubmit = useCallback(
    (data: SearchForm) => {
      updateQueryParams({ keyword: data.keyword });
    },
    [updateQueryParams],
  );

  const onReset = useCallback(() => {
    resetField('keyword');
    updateQueryParams({ keyword: '' });
  }, [resetField, updateQueryParams]);

  const onSelectFilter = useCallback(
    (presetId: FilterPresetId) => {
      updateQueryParams({ filter: presetId });
    },
    [updateQueryParams],
  );

  const onSelectSinger = useCallback(
    (singer: string) => {
      // 既に選択中なら解除（トグル動作）
      const nextSinger = activeSinger === singer ? '' : singer;
      updateQueryParams({ singer: nextSinger });
    },
    [activeSinger, updateQueryParams],
  );

  useEffect(() => {
    if (router.query.keyword && typeof router.query.keyword === 'string') {
      setValue('keyword', router.query.keyword);
    } else if (!router.query.keyword) {
      setValue('keyword', '');
    }
  }, [router.query.keyword, setValue]);

  // 取得したストリーム一覧を現在のフィルター、歌唱者、キーワードで絞り込み
  const displayedStreams = useMemo(() => {
    if (!streams) return null;
    return filterStreams(streams, {
      filter: activeFilterId,
      singer: activeSinger,
      keyword: searchKeyword,
    });
  }, [streams, activeFilterId, activeSinger, searchKeyword]);

  return (
    <Layout
      title="歌枠検索"
      description="戌亥とこさんの歌枠楽曲を検索・フィルターできます"
      className={styles.root}
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.searchForm}>
          <input className={styles.input} placeholder="曲名・原曲アーティスト・歌唱者で検索" {...register('keyword')} />
          {watch().keyword ? (
            <button className={styles.reset} type="reset" aria-label="フォームリセット" onClick={onReset}>
              <MdClear color="#ffffff" />
            </button>
          ) : null}
        </div>
        <button className={styles.submit} type="submit" aria-label="検索">
          <MdSearch />
        </button>
      </form>

      {/* 歌唱者（singers）クイック絞り込み */}
      {allSingers.length > 0 && (
        <div className={styles.singerSection}>
          <div className={styles.sectionLabel}>
            <span>🎤 歌唱者で絞り込む:</span>
            {activeSinger && (
              <button
                type="button"
                className={styles.clearSingerBtn}
                onClick={() => onSelectSinger(activeSinger)}
              >
                解除
              </button>
            )}
          </div>
          <div className={styles.singerChips}>
            {allSingers.map((singer) => {
              const isActive = activeSinger === singer;
              return (
                <button
                  key={singer}
                  type="button"
                  className={`${styles.singerChip} ${isActive ? styles.singerChipActive : ''}`}
                  onClick={() => onSelectSinger(singer)}
                >
                  {singer}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Jev 自動タグ付けによるクイックフィルター */}
      <div className={styles.filtersContainer}>
        <div className={styles.sectionLabel}>
          <span>🏷️ ムード・ジャンル:</span>
        </div>
        <div className={styles.filterChips}>
          {FILTER_PRESETS.map((preset) => {
            const isActive = preset.id === activeFilterId;
            return (
              <button
                key={preset.id}
                type="button"
                className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
                onClick={() => onSelectFilter(preset.id)}
              >
                <span className={styles.filterIcon}>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
        {activePreset.description && (
          <p className={styles.filterDescription}>
            💡 {activePreset.description}
          </p>
        )}
      </div>

      <div className={styles.result}>
        {!displayedStreams ? (
          <Spinner className={styles.spinner} />
        ) : !displayedStreams.length ? (
          <div className={styles.empty}>条件に一致する楽曲はありません</div>
        ) : (
          <>
            <div className={styles.resultCount}>
              <span>{displayedStreams.length} 曲を表示中</span>
              {activeSinger && <span> （歌唱者: {activeSinger}）</span>}
            </div>
            <ul className={styles.list}>
              {displayedStreams.map((stream) => (
                <li className={styles.listItem} key={stream.id}>
                  <SingingStreamMediaObject singingStream={stream} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Layout>
  );
}

export default SingingStreamsPage;


