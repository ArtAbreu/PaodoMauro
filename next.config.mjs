import withPWA from "next-pwa";

const securityHeaders = async () => {
  return [
    {
      key: "Referrer-Policy",
      value: "no-referrer",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];
};

const withPWANext = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = withPWANext({
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  output: "standalone",
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: await securityHeaders(),
      },
    ];
  },
});

export default nextConfig;
