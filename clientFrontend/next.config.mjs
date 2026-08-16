/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/product/:id", destination: "/products/:id", permanent: true },
    ];
  },
};

export default nextConfig;
