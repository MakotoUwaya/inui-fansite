const path = require('path');

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  images: {
    domains: ['i.ytimg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
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
