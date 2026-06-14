/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',              // produce a static site in ./out for Nginx to serve
  images: { unoptimized: true }, // required for next/image under static export
  trailingSlash: true,           // emit folder/index.html so Nginx try_files resolves cleanly
};

export default nextConfig;
