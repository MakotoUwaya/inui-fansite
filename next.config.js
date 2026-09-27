const path = require('path');

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  images: {
    minimumCacheTTL: 31536000, // 1年間キャッシュ
    domains: ['i.ytimg.com', 'yt3.googleusercontent.com', 'yt3.ggpht.com'],
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
    includePaths: [path.join(__dirname, 'styles')]
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
