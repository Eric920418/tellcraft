"use client";

import React, { useState, useEffect } from "react";
import {
  Layout as AntLayout,
  Menu,
  theme,
  Avatar,
  Dropdown,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { getAgent, logout, type AgentInfo } from "@/utils/auth";

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    // 取得登入的特務資訊
    const agentInfo = getAgent();
    setAgent(agentInfo);
  }, []);

  const menuItems: MenuProps["items"] = [
    {
      key: "/",
      icon: <ClockCircleOutlined />,
      label: "打卡",
      onClick: () => router.push("/"),
    },
    {
      key: "/leave",
      icon: <FileTextOutlined />,
      label: "請假管理",
      onClick: () => router.push("/leave"),
    },
    {
      key: "/overtime",
      icon: <FieldTimeOutlined />,
      label: "加班管理",
      onClick: () => router.push("/overtime"),
    },
    {
      key: "/subordinate-leaves",
      icon: <TeamOutlined />,
      label: "下屬請假記錄",
      onClick: () => router.push("/subordinate-leaves"),
    },
    {
      key: "/subordinate-overtimes",
      icon: <FieldTimeOutlined />,
      label: "加班審核",
      onClick: () => router.push("/subordinate-overtimes"),
    },
    {
      key: "/records",
      icon: <BarChartOutlined />,
      label: "打卡記錄",
      onClick: () => router.push("/records"),
    },
    {
      key: "/summary",
      icon: <BarChartOutlined />,
      label: "工時摘要",
      onClick: () => router.push("/summary"),
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      logout();
      message.success("已登出");
      router.push("/login");
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "個人資料",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "登出",
      danger: true,
      onClick: handleMenuClick,
    },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: "linear-gradient(180deg, #1c1f2e 0%, #2b2d42 100%)",
        }}
      >
        <div className="flex items-center justify-center h-16 m-4">
          <div className="text-white font-bold text-xl">
            {collapsed ? "特務" : "特務人資系統"}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ background: "transparent" }}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div className="flex items-center gap-4">
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className:
                  "text-xl cursor-pointer hover:text-primary-500 transition-colors",
                onClick: () => setCollapsed(!collapsed),
              },
            )}
            <div className="text-lg font-medium text-sage-700">
              特務人資管理平台
            </div>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-yellow-50 px-3 py-2 rounded-lg transition-colors">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {agent?.name || "Loading..."}
                </div>
                <div className="text-xs text-gray-500">
                  {agent?.email || ""}
                </div>
              </div>
              <Avatar
                style={{ backgroundColor: "#1c1f2e" }}
                icon={<UserOutlined />}
              />
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
