import { describe, expect, test } from 'vitest';
import { buildCanonicalUrl } from './siteConfig';

describe('buildCanonicalUrl', () => {
  test('ルートパスは末尾スラッシュ付きの正規 URL を返す', () => {
    expect(buildCanonicalUrl('/', 'https://inui-fansite.mukwty.com')).toBe(
      'https://inui-fansite.mukwty.com/',
    );
  });

  test('通常のパスは末尾スラッシュなしの正規 URL を返す', () => {
    expect(buildCanonicalUrl('/singing-streams', 'https://inui-fansite.mukwty.com')).toBe(
      'https://inui-fansite.mukwty.com/singing-streams',
    );
    expect(buildCanonicalUrl('/about/', 'https://inui-fansite.mukwty.com/')).toBe(
      'https://inui-fansite.mukwty.com/about',
    );
  });

  test('クエリパラメータやハッシュを除外して正規 URL を返す', () => {
    expect(
      buildCanonicalUrl('/singing-streams?singer=%E6%88%8C%E4%BA%A5%E3%81%A8%E3%81%93&filter=ballad', 'https://inui-fansite.mukwty.com'),
    ).toBe('https://inui-fansite.mukwty.com/singing-streams');
    expect(buildCanonicalUrl('/?source=pwa#top', 'https://inui-fansite.mukwty.com')).toBe(
      'https://inui-fansite.mukwty.com/',
    );
  });
});
