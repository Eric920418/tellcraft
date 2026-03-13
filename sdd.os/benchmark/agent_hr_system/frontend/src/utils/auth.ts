/**
 * 驗證工具函數
 */

export interface AgentInfo {
  agentId: number;
  name: string;
  email: string;
}

/**
 * 儲存 JWT token
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

/**
 * 取得 JWT token
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * 從 localStorage 取得已登入的特務資訊
 */
export function getAgent(): AgentInfo | null {
  if (typeof window === "undefined") return null;

  try {
    const agentStr = localStorage.getItem("agent");
    if (!agentStr) return null;

    const agent = JSON.parse(agentStr);
    return agent;
  } catch (error) {
    console.error("讀取特務資訊失敗:", error);
    return null;
  }
}

/**
 * 檢查是否已登入
 */
export function isAuthenticated(): boolean {
  return getAgent() !== null && getToken() !== null;
}

/**
 * 登出（清除 localStorage 中的特務資訊和 token）
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("agent");
  localStorage.removeItem("token");
}
