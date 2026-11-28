const DEFAULT_SITE_URL = 'https://inui-fansite.mukwty.com';

/**
 * サイトのベース URL（末尾スラッシュなし）
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

/**
 * パスからクエリ・ハッシュを除いた正規 URL (canonical URL) を生成する
 */
export function buildCanonicalUrl(pathname: string, baseUrl: string = SITE_URL): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const pathWithoutQueryOrHash = pathname.split(/[?#]/)[0] || '/';
  const normalizedPath = pathWithoutQueryOrHash.startsWith('/')
    ? pathWithoutQueryOrHash
    : `/${pathWithoutQueryOrHash}`;

  if (normalizedPath === '/') {
    return `${normalizedBase}/`;
  }

  return `${normalizedBase}${normalizedPath.replace(/\/+$/, '')}`;
}
