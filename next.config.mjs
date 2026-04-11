// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com" },
    ],
  },
};

export default nextConfig;

// TODO(01:12): Initialize Next.js project with TypeScript setup