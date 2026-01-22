/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client"],
  },
};

module.exports = nextConfig;
