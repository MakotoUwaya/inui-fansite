const path = require('path');

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // 外部CDN（YouTube / Google）画像を直接配信し、Vercel Image Optimization の無料枠超過を防ぐ
    unoptimized: true,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    loadPaths: [path.join(__dirname, 'styles')],
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
