/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.cloudworkstations.dev'],
  transpilePackages: ['@urai/ui'],
};

module.exports = nextConfig;
