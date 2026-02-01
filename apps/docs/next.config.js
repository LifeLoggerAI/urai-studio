/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure page extensions
  pageExtensions: ["mdx", "md", "jsx", "js", "tsx", "ts"],

  // Workaround for https://github.com/vercel/next.js/issues/57257
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
