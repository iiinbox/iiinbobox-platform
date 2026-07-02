/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@iiiiibox/api-client", "@iiiiibox/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.iiinbox.com" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
