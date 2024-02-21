/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/spotify-downloader",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
