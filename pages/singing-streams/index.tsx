import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdClear, MdSearch } from 'react-icons/md';
import { Layout } from '../../components/Layout/Layout';
import { SingingStreamMediaObject } from '../../components/SingingStreamMediaObject/SingingStreamMediaObject';
import { Spinner } from '../../components/Spinner/Spinner';
import { useSingingStreamsForSearch } from '../../hooks/singing-stream';
import { FILTER_PRESETS, FilterPresetId } from '../../utils/songMetadata';
import styles from './index.module.scss';

type SearchForm = {
  keyword: string;
};

function SingingStreamsPage() {
  const router = useRouter();
  const { register, handleSubmit, resetField, watch, setValue } = useForm<SearchForm>();
  const { streams } = useSingingStreamsForSearch((router.query.keyword || '') as string);

  const activeFilterId = ((router.query.filter as FilterPresetId) || 'all');
  const activePreset = useMemo(
    () => FILTER_PRESETS.find((p) => p.id === activeFilterId) || FILTER_PRESETS[0],
    [activeFilterId],
  );

  const onSubmit = useCallback(
    (data: SearchForm) => {
      const query: Record<string, string> = {};
      if (data.keyword) query.keyword = data.keyword;
      if (activeFilterId !== 'all') query.filter = activeFilterId;
      router.push({ query });
    },
    [router, activeFilterId],
  );

  const onReset = useCallback(() => {
    resetField('keyword');
    const query: Record<string, string> = {};
    if (activeFilterId !== 'all') query.filter = activeFilterId;
    router.push({ query });
  }, [resetField, router, activeFilterId]);

  const onSelectFilter = useCallback(
    (presetId: FilterPresetId) => {
      const query: Record<string, string> = {};
      if (router.query.keyword) query.keyword = router.query.keyword as string;
      if (presetId !== 'all') query.filter = presetId;
      router.push({ query });
    },
    [router],
  );

  useEffect(() => {
    if (router.query.keyword && typeof router.query.keyword === 'string') {
      setValue('keyword', router.query.keyword);
    }
  }, [router.query.keyword, setValue]);

  // 取得したストリーム一覧を現在のフィルタープリセットで絞り込み
  const displayedStreams = useMemo(() => {
    if (!streams) return null;
    return streams.filter((stream) => activePreset.match(stream.song.song_metadata));
  }, [streams, activePreset]);

  return (
    <Layout
      title="歌枠検索"
      description="戌亥とこさんの歌枠楽曲を検索・フィルターできます"
      className={styles.root}
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.searchForm}>
          <input className={styles.input} placeholder="曲名で検索" {...register('keyword')} />
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

      {/* Jev 自動タグ付けによるクイックフィルター */}
      <div className={styles.filtersContainer}>
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

