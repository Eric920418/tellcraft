"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";
import { isAuthenticated } from "@/utils/auth";

/**
 * 路由保護元件
 * 未登入時自動導向登入頁面
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 檢查是否已登入
    const authenticated = isAuthenticated();

    if (!authenticated) {
      // 未登入，導向登入頁面
      router.push("/login");
    } else {
      // 已登入，顯示內容
      setIsChecking(false);
    }
  }, [router, pathname]);

  // 檢查中顯示 loading
  if (isChecking) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
