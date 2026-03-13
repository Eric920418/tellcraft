import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 啟用 standalone 輸出模式（Docker 部署必須）
  output: "standalone",

  // 圖片優化配置
  images: {
    unoptimized: true, // Docker 環境建議設為 true
  },

  // 環境變數配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENABLE_MOCK: process.env.NEXT_PUBLIC_ENABLE_MOCK,
  },

  // Demo 模式：關閉開發時的錯誤覆蓋層和警告
  reactStrictMode: false, // 關閉嚴格模式避免重複渲染警告

  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: false, // 保持型別檢查
  },

  // Webpack 配置：隱藏開發模式的警告訊息
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.devtool = "eval-cheap-module-source-map";

      // 過濾掉特定的警告訊息
      config.infrastructureLogging = {
        level: "error",
      };
    }
    return config;
  },
};

export default nextConfig;
