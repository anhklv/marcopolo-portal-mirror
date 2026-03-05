import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel等の環境で docs フォルダを含める設定
  // ページパス（/docs配下）に対して、プロジェクトルートの docs フォルダを含める
  outputFileTracingIncludes: {
    "/docs/**/*": ["./docs/**/*"],
  },
};

export default nextConfig;
