/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Recommended for static exports.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
