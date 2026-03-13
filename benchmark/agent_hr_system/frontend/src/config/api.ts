/**
 * API 配置（依照 OpenAPI spec）
 */

// API 根路徑，從環境變數讀取（完整路徑，不額外補 /api）
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * API 端點
 */
export const API_ENDPOINTS = {
  // 打卡相關 (/attendance/*)
  attendance: {
    // POST /attendance/punch - 打卡
    punch: `${API_URL}/attendance/punch`,
    // GET /attendance/daily-summary - 查詢當日工時摘要
    dailySummary: `${API_URL}/attendance/daily-summary`,
    // GET /attendance/punch-records - 查詢打卡紀錄
    punchRecords: `${API_URL}/attendance/punch-records`,
    // DELETE /attendance/punch/{recordId} - 刪除打卡記錄
    deletePunch: (recordId: number) =>
      `${API_URL}/attendance/punch/${recordId}`,
  },

  // 請假相關 (/leave-requests)
  leave: {
    // POST /leave-requests - 提交請假申請
    submitRequest: `${API_URL}/leave-requests`,
  },
};

/**
 * 取得完整的 API URL
 */
export function getApiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
