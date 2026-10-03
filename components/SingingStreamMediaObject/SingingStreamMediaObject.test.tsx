import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SingingStreamMediaObject } from './SingingStreamMediaObject';
import type { SingingStreamForSearch } from '../../types';

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
  }),
}));

// next/image のモック
vi.mock('next/image', () => {
  return {
    default: function DummyImage(props: any) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={props.src} alt={props.alt} />;
    },
  };
});

describe('SingingStreamMediaObject', () => {
  const mockStream: SingingStreamForSearch = {
    id: 'stream-123',
    start: 120,
    video_id: 'yt_abc123',
    published_at: '2024-03-15T12:00:00Z',
    singers: ['戌亥とこ', '長尾景'],
    song: {
      title: '点描の唄',
      artist: 'Mrs. GREEN APPLE',
      song_metadata: null,
    },
    video: {
      title: '【歌枠】深夜のまったり歌枠アーカイブ #12',
      url: 'https://www.youtube.com/watch?v=yt_abc123',
    },
  };

  it('renders song title, artist, singers, and publish date', () => {
    render(<SingingStreamMediaObject singingStream={mockStream} />);

    // 曲名が表示されていること
    expect(screen.getByText('点描の唄')).toBeDefined();

    // 原曲アーティストが表示されていること
    expect(screen.getByText('Mrs. GREEN APPLE')).toBeDefined();

    // 歌唱者（singers）が表示されていること
    expect(screen.getByText(/戌亥とこ \/ 長尾景/)).toBeDefined();

    // 配信日が表示されていること (2024/03/15)
    expect(screen.getByText('2024/03/15')).toBeDefined();
  });

  it('does NOT render video title in the media object (simplifying song details)', () => {
    render(<SingingStreamMediaObject singingStream={mockStream} />);

    // サムネイルがあれば動画タイトルは不要という要件に基づき、動画タイトルテキストが本文に表示されないことを確認
    // （alt 属性はアクセシビリティのためサムネイル img に設定されているが、表示テキストとしての動画タイトル要素はない）
    const videoTitleElement = screen.queryByText('【歌枠】深夜のまったり歌枠アーカイブ #12', {
      selector: 'span, p, div, h1, h2, h3',
    });
    expect(videoTitleElement).toBeNull();
  });
});
