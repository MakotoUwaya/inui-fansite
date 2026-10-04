import clsx from 'clsx';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { MdClear, MdSearch, MdClose } from 'react-icons/md';
import { RiRainbowLine } from 'react-icons/ri';
import { Layout } from '../../components/Layout/Layout';
import { SingingStreamMediaObject } from '../../components/SingingStreamMediaObject/SingingStreamMediaObject';
import { Spinner } from '../../components/Spinner/Spinner';
import { useHolodexChannels } from '../../hooks/holodex';
import { useSingingStreamsForSearch } from '../../hooks/singing-stream';
import { formatSubscriberCount, getChannelGroup } from '../../utils/holodex';
import {
  DEFAULT_SINGER,
  ALL_SINGERS_KEY,
  getSingersWithCount,
  resolveCurrentSinger,
  getSingerIcon,
  getSingerAvatar,
  getNijiViewerUrl,
  SINGER_CHANNEL_IDS,
} from '../../utils/singerConfig';
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

  // URLクエリから歌い手およびチャンネルIDを判定（未指定ならデフォルト: 戌亥とこ）
  const rawQuerySinger = router.query.singer as string | undefined;
  const rawQueryChannel = router.query.channel as string | undefined;

  const requestedChannelId = useMemo(() => {
    if (rawQueryChannel && rawQueryChannel.startsWith('UC')) return rawQueryChannel;
    if (rawQuerySinger && rawQuerySinger.startsWith('UC')) return rawQuerySinger;
    return undefined;
  }, [rawQueryChannel, rawQuerySinger]);

  const { channels } = useHolodexChannels(requestedChannelId);

  const activeSinger = useMemo(
    () => resolveCurrentSinger(rawQuerySinger, rawQueryChannel, channels),
    [rawQuerySinger, rawQueryChannel, channels],
  );
  const activeFilterId = (router.query.filter as FilterPresetId) || 'all';
  const searchKeyword = (router.query.keyword as string) || '';

  // 歌い手ごとの楽曲数サマリー
  const singerSummaries = useMemo(() => getSingersWithCount(streams), [streams]);

  // 全曲モードかどうか
  const isAllSingers = activeSinger === ALL_SINGERS_KEY;

  // 現在の歌い手の Holodex チャンネル情報
  const currentChannelId = useMemo(() => {
    if (isAllSingers) return undefined;
    if (requestedChannelId) return requestedChannelId;
    return SINGER_CHANNEL_IDS[activeSinger];
  }, [isAllSingers, requestedChannelId, activeSinger]);

  const currentChannel = currentChannelId ? channels[currentChannelId] : undefined;
  const currentGroup = getChannelGroup(currentChannel);
  const currentSubCount = formatSubscriberCount(currentChannel?.subscriber_count);
  const currentAvatar = getSingerAvatar(activeSinger, currentChannel?.photo);
  const nijiViewerUrl = isAllSingers ? null : getNijiViewerUrl(activeSinger, currentChannelId);

  // 現在の歌い手の表示名とアイコン
  const currentSingerName = isAllSingers ? 'すべての歌い手（全曲モード）' : activeSinger;
  const currentSingerIcon = isAllSingers ? '🌐' : getSingerIcon(activeSinger);

  // プリセットフィルター情報（URLパラメータで指定されている場合のみ表示）
  const activePreset = useMemo(
    () => FILTER_PRESETS.find((p) => p.id === activeFilterId),
    [activeFilterId],
  );

  const updateQueryParams = useCallback(
    (params: { keyword?: string; filter?: string; singer?: string }) => {
      const nextQuery: Record<string, string> = {};
      const kw = params.keyword !== undefined ? params.keyword : searchKeyword;
      const fl = params.filter !== undefined ? params.filter : activeFilterId;
      const sg = params.singer !== undefined ? params.singer : activeSinger;

      if (kw) nextQuery.keyword = kw;
      if (fl && fl !== 'all') nextQuery.filter = fl;
      if (sg && sg !== DEFAULT_SINGER) nextQuery.singer = sg;

      router.push({ pathname: '/singing-streams', query: nextQuery }, undefined, { shallow: true });
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

  const onSingerChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.target.value;
      updateQueryParams({ singer: selected });
    },
    [updateQueryParams],
  );

  const onClearFilter = useCallback(() => {
    updateQueryParams({ filter: 'all' });
  }, [updateQueryParams]);

  useEffect(() => {
    if (router.query.keyword && typeof router.query.keyword === 'string') {
      setValue('keyword', router.query.keyword);
    } else if (!router.query.keyword) {
      setValue('keyword', '');
    }
  }, [router.query.keyword, setValue]);

  // 絞り込み実行
  const displayedStreams = useMemo(() => {
    if (!streams) return null;
    return filterStreams(streams, {
      filter: activeFilterId,
      singer: isAllSingers ? ALL_SINGERS_KEY : activeSinger,
      keyword: searchKeyword,
    });
  }, [streams, activeFilterId, isAllSingers, activeSinger, searchKeyword]);

  const totalCount = streams ? streams.length : 0;

  return (
    <Layout
      title={`${currentSingerName} の楽曲一覧`}
      description={`${currentSingerName} の歌枠楽曲を再生・検索できます`}
      className={styles.root}
    >
      {/* 上部コントロールバー: 歌い手セレクター ＆ 検索バー */}
      <div className={styles.headerBar}>
        <div className={styles.singerControl}>
          <div className={styles.currentSingerBadge}>
            {currentAvatar ? (
              <div className={styles.singerAvatarWrapper}>
                <Image
                  src={currentAvatar}
                  alt={currentSingerName}
                  width={36}
                  height={36}
                  className={styles.singerHeaderAvatar}
                  style={{ width: '100%', height: '100%' }}
                  unoptimized={currentAvatar.startsWith('http')}
                />
              </div>
            ) : (
              <span className={styles.singerIcon}>{currentSingerIcon}</span>
            )}
            <span className={styles.singerTitle} title={currentSingerName}>{currentSingerName}</span>
            {nijiViewerUrl && (
              <a
                href={nijiViewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.nijiViewerLink}
                title={`${activeSinger} の情報を NijiViewer で見る`}
                aria-label={`${activeSinger} の情報を NijiViewer で見る`}
              >
                <RiRainbowLine className={styles.nijiViewerIcon} />
              </a>
            )}
            {!isAllSingers && (currentChannel?.org || currentGroup || currentSubCount) && (
              <div className={styles.singerTags}>
                {currentChannel?.org && (
                  <span className={clsx(styles.tag, styles.tagOrg)} title={currentChannel.org}>
                    {currentChannel.org}
                  </span>
                )}
                {currentGroup && (
                  <span className={clsx(styles.tag, styles.tagSuborg)} title={currentGroup}>
                    {currentGroup}
                  </span>
                )}
                {currentChannel?.type && currentChannel.type.toLowerCase() !== 'vtuber' && (
                  <span className={clsx(styles.tag, styles.tagType)} title={currentChannel.type}>
                    {currentChannel.type}
                  </span>
                )}
                {currentSubCount && (
                  <span className={styles.subscriberCount} title={`登録者数: ${currentSubCount}`}>
                    👥 {currentSubCount}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.selectWrapper}>
            <label htmlFor="singer-select" className={styles.selectLabel}>
              歌い手を変更:
            </label>
            <select
              id="singer-select"
              className={styles.singerSelect}
              value={activeSinger}
              onChange={onSingerChange}
            >
              {!isAllSingers && !singerSummaries.some((s) => s.name === activeSinger) && (
                <option value={activeSinger}>
                  {currentSingerIcon} {currentSingerName} (0曲)
                </option>
              )}
              {singerSummaries.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.icon} {s.name} ({s.count}曲)
                </option>
              ))}
              <option value={ALL_SINGERS_KEY}>
                🌐 全曲モード（全{totalCount}曲）
              </option>
            </select>
          </div>
        </div>

        {/* 検索バー */}
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.searchForm}>
            <input
              className={styles.input}
              placeholder={isAllSingers ? '曲名・原曲アーティスト・歌唱者で検索' : `${activeSinger}の楽曲・原曲アーティストで検索`}
              {...register('keyword')}
            />
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
      </div>

      {/* トップページなどから気分タグが引き継がれている場合のみ、小さく表示 */}
      {activePreset && activePreset.id !== 'all' && (
        <div className={styles.activeFilterNotice}>
          <span className={styles.filterNoticeLabel}>
            {activePreset.icon} {activePreset.label} で絞り込み中
          </span>
          <button
            type="button"
            className={styles.clearFilterButton}
            onClick={onClearFilter}
            aria-label="フィルター解除"
          >
            <MdClose /> 解除
          </button>
        </div>
      )}

      {/* 楽曲一覧リスト */}
      <div className={styles.result}>
        {!displayedStreams ? (
          <Spinner className={styles.spinner} />
        ) : !displayedStreams.length ? (
          <div className={styles.empty}>
            {searchKeyword
              ? '条件に一致する楽曲はありません'
              : `${currentSingerName} の楽曲データはまだ登録されていません`}
          </div>
        ) : (
          <>
            <div className={styles.resultCount}>
              <span>{displayedStreams.length} 曲を表示中</span>
              {searchKeyword && <span className={styles.keywordHighlight}> (キーワード: &quot;{searchKeyword}&quot;)</span>}
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
