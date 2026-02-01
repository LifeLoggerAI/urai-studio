/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    transpilePackages: ['@urai/ui'],
  },
};

module.exports = nextConfig;
