"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import zhTW from "antd/locale/zh_TW";
import { usePathname } from "next/navigation";
import MainLayout from "@/components/Layout";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="zh-TW">
      <body className="antialiased">
        <AntdRegistry>
          <ConfigProvider
            locale={zhTW}
            theme={{
              token: {
                colorPrimary: "#ffd700",
                colorInfo: "#4a90e2",
                colorSuccess: "#52c41a",
                colorWarning: "#faad14",
                colorError: "#f5222d",
                colorBgBase: "#ffffff",
                colorTextBase: "#2b2d42",
                borderRadius: 12,
                fontFamily: "'Noto Sans TC', 'Inter', sans-serif",
                fontSize: 15,
                lineHeight: 1.6,
                colorBorder: "#e8e8e8",
                colorBgContainer: "#ffffff",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              },
              components: {
                Card: {
                  colorBgContainer: "#ffffff",
                  boxShadowTertiary: "0 6px 16px rgba(255, 215, 0, 0.12)",
                  borderRadiusLG: 16,
                },
                Button: {
                  colorPrimary: "#ffd700",
                  colorPrimaryHover: "#ffed4e",
                  colorPrimaryActive: "#ccac00",
                  colorTextLightSolid: "#1c1f2e",
                  primaryShadow: "0 4px 12px rgba(255, 215, 0, 0.3)",
                  borderRadius: 8,
                  controlHeight: 40,
                  fontWeight: 600,
                },
                Input: {
                  colorBgContainer: "#f8f9fa",
                  activeBorderColor: "#ffd700",
                  hoverBorderColor: "#ffed4e",
                  borderRadius: 8,
                  controlHeight: 40,
                },
                Table: {
                  headerBg: "#2b2d42",
                  headerColor: "#ffffff",
                  rowHoverBg: "#fff9e6",
                },
                Menu: {
                  darkItemSelectedBg: "#ffd700",
                  darkItemSelectedColor: "#1c1f2e",
                  darkItemColor: "#ffffff",
                  darkItemHoverBg: "rgba(255, 215, 0, 0.15)",
                  darkItemHoverColor: "#ffd700",
                },
              },
            }}
          >
            <App>
              {isLoginPage ? children : <MainLayout>{children}</MainLayout>}
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
