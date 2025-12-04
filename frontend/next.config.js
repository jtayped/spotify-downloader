/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {output: 'standalone', async rewrites() {
    return [
      {
        source: '/api/:path*',
        // In dev, forward to where your Go backend is running locally.
        // If Go is in Docker mapped to port 8080, use localhost:8080
        destination: 'http://localhost:1323/api/:path*', 
      },
    ];
  },};

export default config;
