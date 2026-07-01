/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@iiiiibox/api-client", "@iiiiibox/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.iiinbox.com" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
};

module.exports = nextConfig;
