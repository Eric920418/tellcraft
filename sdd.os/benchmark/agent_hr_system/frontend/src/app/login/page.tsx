"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Card, Typography, App, Space } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { authApi } from "@/services/api";

const { Title, Text } = Typography;

// 預先生成固定的星星配置
const generateStars = (count: number, seed: number) => {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: count }, (_, i) => ({
    size: 1 + random(seed + i * 3) * 2,
    left: random(seed + i * 5) * 100,
    top: random(seed + i * 7) * 100,
    opacity: random(seed + i * 11) * 0.8 + 0.2,
    duration: 2 + random(seed + i * 13) * 3,
    delay: random(seed + i * 17) * 2,
  }));
};

const generateBigStars = (count: number, seed: number) => {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: count }, (_, i) => ({
    size: 3 + random(seed + i * 3) * 4,
    left: random(seed + i * 5) * 100,
    top: random(seed + i * 7) * 100,
    duration: 1 + random(seed + i * 13) * 2,
    delay: random(seed + i * 17) * 2,
  }));
};

const generateMeteors = (count: number, seed: number) => {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: count }, (_, i) => ({
    left: 20 + random(seed + i * 5) * 60,
    top: random(seed + i * 7) * 50,
    duration: 3 + random(seed + i * 13) * 2,
    delay: i * 4,
  }));
};

const STARS = generateStars(100, 12345);
const BIG_STARS = generateBigStars(15, 67890);
const METEORS = generateMeteors(3, 11111);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authApi.login({
        email: values.email,
        password: values.password,
      });

      // 將使用者資訊和 token 存到 localStorage
      localStorage.setItem(
        "agent",
        JSON.stringify({
          agentId: response.agentId,
          name: response.name,
          email: response.email,
        }),
      );

      // 儲存 JWT token
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      message.success(response.message || "登入成功");

      // 導向首頁
      router.push("/");
    } catch (error: any) {
      console.error("登入失敗:", error);
      message.error(error.message || "登入失敗，請檢查帳號密碼");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1624 100%)",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 星空背景 - 多層星星 */}
      {STARS.map((star, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: "absolute",
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: "white",
            borderRadius: "50%",
            left: `${star.left}%`,
            top: `${star.top}%`,
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            pointerEvents: "none",
            boxShadow: "0 0 2px white",
          }}
        />
      ))}

      {/* 大型發光星星 */}
      {BIG_STARS.map((star, i) => (
        <div
          key={`bigstar-${i}`}
          style={{
            position: "absolute",
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: "white",
            borderRadius: "50%",
            left: `${star.left}%`,
            top: `${star.top}%`,
            opacity: 0.9,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
            pointerEvents: "none",
            boxShadow: "0 0 10px white, 0 0 20px rgba(255, 255, 255, 0.5)",
          }}
        />
      ))}

      {/* 流星 */}
      {METEORS.map((meteor, i) => (
        <div
          key={`meteor-${i}`}
          style={{
            position: "absolute",
            width: "2px",
            height: "2px",
            background: "white",
            borderRadius: "50%",
            left: `${meteor.left}%`,
            top: `${meteor.top}%`,
            boxShadow: "0 0 10px white, 0 0 20px rgba(255, 255, 255, 0.8)",
            animation: `shootingStar ${meteor.duration}s ease-in infinite`,
            animationDelay: `${meteor.delay}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* 彩色星雲效果 */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(138, 43, 226, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          animation: "nebula 15s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "15%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(30, 144, 255, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
          animation: "nebula 12s ease-in-out infinite reverse",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "5%",
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(255, 20, 147, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(55px)",
          animation: "nebula 18s ease-in-out infinite",
          animationDelay: "3s",
          pointerEvents: "none",
        }}
      />

      {/* 旋轉星系 */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(ellipse, rgba(100, 149, 237, 0.08) 0%, transparent 60%)",
          borderRadius: "50%",
          animation: "rotateGalaxy 60s linear infinite",
          pointerEvents: "none",
          filter: "blur(3px)",
        }}
      />

      {/* 動畫樣式 */}
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes shootingStar {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-300px) translateY(300px);
            opacity: 0;
          }
        }

        @keyframes nebula {
          0%,
          100% {
            transform: scale(1) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2) translateX(20px);
            opacity: 0.5;
          }
        }

        @keyframes rotateGalaxy {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0px);
            filter: drop-shadow(0 0 15px rgba(100, 149, 237, 0.6));
          }
          50% {
            transform: translateY(-15px);
            filter: drop-shadow(0 0 25px rgba(100, 149, 237, 1));
          }
        }

        @keyframes cosmicGlow {
          0%,
          100% {
            box-shadow:
              0 0 30px rgba(100, 149, 237, 0.4),
              0 0 60px rgba(138, 43, 226, 0.2),
              0 8px 32px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow:
              0 0 40px rgba(100, 149, 237, 0.6),
              0 0 80px rgba(138, 43, 226, 0.3),
              0 8px 32px rgba(0, 0, 0, 0.5);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-30px);
            opacity: 1;
          }
        }

        /* Hover 效果 */
        :global(.login-card:hover) {
          background: rgba(255, 255, 255, 0.98) !important;
          box-shadow:
            0 0 40px rgba(100, 149, 237, 0.6),
            0 0 80px rgba(138, 43, 226, 0.4),
            0 12px 40px rgba(0, 0, 0, 0.6) !important;
          transform: translateY(-5px) !important;
        }
      `}</style>

      <Card
        className="login-card"
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 16,
          boxShadow:
            "0 0 30px rgba(100, 149, 237, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(100, 149, 237, 0.3)",
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 1,
          animation:
            "slideIn 0.8s ease-out, cosmicGlow 4s ease-in-out infinite",
          transition: "all 0.3s ease",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 標題 */}
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              <img
                src="/images/logo.png"
                alt="特務人資系統"
                style={{
                  width: 80,
                  height: 80,
                  animation: "logoFloat 4s ease-in-out infinite",
                }}
              />
            </div>
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#1c1f2e",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              特務人資系統
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Agent HR System
            </Text>
          </div>

          {/* 登入表單 */}
          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="帳號（Email）"
              rules={[
                { required: true, message: "請輸入帳號" },
                { type: "email", message: "請輸入有效的 Email" },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#ffd700" }} />}
                placeholder="alice@company.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密碼"
              rules={[{ required: true, message: "請輸入密碼" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#ffd700" }} />}
                placeholder="請輸入密碼"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 8,
                }}
              >
                {loading ? "登入中..." : "登入"}
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
