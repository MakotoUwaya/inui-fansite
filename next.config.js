const path = require('path');

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    minimumCacheTTL: 31536000, // 1年間キャッシュ
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        pathname: '/**',
      },
    ],
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    api: 'modern',
  },
  async redirects() {
    return [
      {
        source: '/singing-streams/search',
        destination: '/singing-streams',
        permanent: true
      }
    ];
  }
};
