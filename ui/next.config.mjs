/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    // In production, Caddy proxies /api/* → FastAPI. Only needed in local dev.
    const devRewrites = [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:8000"}/:path*`,
      },
    ];
    return process.env.NODE_ENV === "production" ? [] : devRewrites;
  },
};

export default nextConfig;
