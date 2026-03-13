/**
 * API 服務層（依照 OpenAPI spec）
 * 根據環境變數自動切換 mock 或真實 API
 */

import { API_URL } from "@/config/api";
import { mockAttendanceApi, mockLeaveApi, mockAuthApi } from "@/mocks/data";

// 檢查是否啟用 mock
const isMockEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";

console.log(
  "🔧 API Mode:",
  isMockEnabled ? "MOCK" : "REAL",
  "| API URL:",
  API_URL,
);

/**
 * 通用的 fetch 封裝
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  // 從 localStorage 取得 token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 如果有 token，加入 Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 合併其他 headers
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * 打卡/出勤 API
 */
export const attendanceApi = {
  /**
   * POST /attendance/punch - 打卡
   */
  punch: async (data: {
    agentId: string;
    punchType: "IN" | "OUT";
    punchTime: number; // Unix timestamp (毫秒)
  }) => {
    if (isMockEnabled) {
      return mockAttendanceApi.punch(data);
    }

    return fetchApi("/attendance/punch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * GET /attendance/daily-summary - 查詢當日工時摘要
   */
  getDailySummary: async (params: {
    agentId: string;
    date: number; // Unix timestamp (毫秒)
  }) => {
    if (isMockEnabled) {
      return mockAttendanceApi.getDailySummary(params);
    }

    const queryString = new URLSearchParams({
      agentId: params.agentId,
      date: params.date.toString(),
    }).toString();
    return fetchApi(`/attendance/daily-summary?${queryString}`);
  },

  /**
   * GET /attendance/punch-records - 查詢打卡紀錄
   */
  getPunchRecords: async (params: {
    agentId: string;
    date: number; // Unix timestamp (毫秒)
  }) => {
    if (isMockEnabled) {
      return mockAttendanceApi.getPunchRecords(params);
    }

    const queryString = new URLSearchParams({
      agentId: params.agentId,
      date: params.date.toString(),
    }).toString();
    return fetchApi(`/attendance/punch-records?${queryString}`);
  },

  /**
   * DELETE /attendance/punch/{recordId} - 刪除打卡記錄
   */
  deletePunch: async (recordId: number) => {
    if (isMockEnabled) {
      return mockAttendanceApi.deletePunch(recordId);
    }

    return fetchApi(`/attendance/punch/${recordId}`, {
      method: "DELETE",
    });
  },
};

/**
 * 請假 API
 */
export const leaveApi = {
  /**
   * POST /leave-requests - 提交請假申請
   */
  submitRequest: async (data: {
    agentId: string;
    leaveType:
      | "SPECIAL_LEAVE"
      | "SICK_LEAVE"
      | "PERSONAL_LEAVE"
      | "MARRIAGE_LEAVE"
      | "FUNERAL_LEAVE";
    startDate: string; // 格式: YYYY-MM-DD
    endDate: string; // 格式: YYYY-MM-DD
    durationType: "FULL_DAY" | "TIME_RANGE";
    startTime?: string; // 格式: HH:mm:ss (TIME_RANGE 時須填)
    endTime?: string; // 格式: HH:mm:ss (TIME_RANGE 時須填)
    reason: string;
  }) => {
    if (isMockEnabled) {
      return mockLeaveApi.submitRequest(data);
    }

    return fetchApi("/leave-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * GET /agents/{agentId}/leave-requests - 查詢請假記錄
   */
  getLeaveRequests: async (params: {
    agentId: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    leaveType?:
      | "SPECIAL_LEAVE"
      | "SICK_LEAVE"
      | "PERSONAL_LEAVE"
      | "MARRIAGE_LEAVE"
      | "FUNERAL_LEAVE";
    startDate?: string; // 格式: YYYY-MM-DD
    endDate?: string; // 格式: YYYY-MM-DD
    page?: number;
    pageSize?: number;
    sortBy?: "startDate" | "createdAt" | "status";
    order?: "ASC" | "DESC";
  }): Promise<LeaveRequestsResponse> => {
    if (isMockEnabled) {
      return mockLeaveApi.getLeaveRequests(params);
    }

    const { agentId, ...queryParams } = params;
    const filteredParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, v]) => v !== undefined && v !== null,
      ),
    );
    const queryString = new URLSearchParams(
      filteredParams as Record<string, string>,
    ).toString();

    return fetchApi(
      `/agents/${agentId}/leave-requests${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * GET /managers/{managerId}/subordinates/leave-requests - 查詢下屬請假記錄
   */
  getSubordinateLeaveRequests: async (params: {
    managerId: number;
    agentId?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    page?: number;
    pageSize?: number;
  }): Promise<SubordinateLeaveRequestsResponse> => {
    if (isMockEnabled) {
      return mockLeaveApi.getSubordinateLeaveRequests(params);
    }

    const { managerId, ...queryParams } = params;
    const filteredParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, v]) => v !== undefined && v !== null,
      ),
    );
    const queryString = new URLSearchParams(
      filteredParams as Record<string, string>,
    ).toString();

    return fetchApi(
      `/managers/${managerId}/subordinates/leave-requests${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * POST /leave-requests/{requestId}/review - 審核請假申請
   */
  reviewLeaveRequest: async (data: {
    requestId: number;
    action: "APPROVE" | "REJECT";
    notes?: string;
  }): Promise<LeaveReviewResponse> => {
    if (isMockEnabled) {
      return mockLeaveApi.reviewLeaveRequest(data);
    }

    return fetchApi(`/leave-requests/${data.requestId}/review`, {
      method: "POST",
      body: JSON.stringify({ action: data.action, notes: data.notes }),
    });
  },
};

/**
 * 加班 API
 */
export const overtimeApi = {
  /**
   * POST /attendance/overtime - 申請加班
   */
  submitRequest: async (data: {
    agentId: string;
    overtimeType: "WEEKDAY_OVERTIME" | "REST_DAY_OVERTIME" | "LEGAL_HOLIDAY_OVERTIME";
    overtimeDate: number; // 毫秒時間戳記（台灣時區 UTC+8）
    startTime: string; // 格式: HH:mm:ss
    endTime: string; // 格式: HH:mm:ss
    reason?: string;
  }): Promise<OvertimeSubmitResponse> => {
    if (isMockEnabled) {
      // Mock 模式暫時返回假資料
      return Promise.resolve({
        requestId: Math.floor(Math.random() * 1000),
        status: "PENDING",
        message: "加班申請已提交，待主管核准",
      });
    }

    return fetchApi("/attendance/overtime", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * GET /managers/{managerId}/subordinates/overtime-requests - 查詢下屬加班記錄
   */
  getSubordinateOvertimeRequests: async (params: {
    managerId: number;
    agentId?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    overtimeType?: "WEEKDAY_OVERTIME" | "REST_DAY_OVERTIME" | "LEGAL_HOLIDAY_OVERTIME";
    page?: number;
    pageSize?: number;
  }): Promise<SubordinateOvertimeRequestsResponse> => {
    const { managerId, ...queryParams } = params;
    const filteredParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, v]) => v !== undefined && v !== null,
      ),
    );
    const queryString = new URLSearchParams(
      filteredParams as Record<string, string>,
    ).toString();

    return fetchApi(
      `/managers/${managerId}/subordinates/overtime-requests${queryString ? `?${queryString}` : ""}`,
    );
  },

  /**
   * POST /overtime-requests/{requestId}/review - 審核加班申請
   */
  reviewOvertimeRequest: async (data: {
    requestId: number;
    action: "APPROVE" | "REJECT";
    notes?: string;
  }): Promise<OvertimeReviewResponse> => {
    return fetchApi(`/overtime-requests/${data.requestId}/review`, {
      method: "POST",
      body: JSON.stringify({ action: data.action, notes: data.notes }),
    });
  },
};

/**
 * 驗證 API
 */
export const authApi = {
  /**
   * POST /auth/login - 登入驗證
   */
  login: async (data: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    if (isMockEnabled) {
      const result = await mockAuthApi.login(data);
      // Mock 模式下模擬 Set-Cookie（實際由瀏覽器自動處理）
      return result;
    }

    // 真實 API 會自動在 response header 設定 Set-Cookie
    return fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include", // 允許發送和接收 cookies
    });
  },
};

/**
 * 類型定義（依照 API spec）
 */
export interface PunchRecord {
  recordId: number;
  agentId: string;
  punchType: "IN" | "OUT";
  punchTime: number; // Unix timestamp (毫秒)
}

export interface PunchResponse extends PunchRecord {
  dailyWorkHours: number; // 當日累計工時
}

export interface DailySummary {
  agentId: string;
  date: string; // YYYY-MM-DD
  totalWorkHours: number;
  overtimeHours: number;
  punchRecords: PunchRecord[];
}

export interface PunchRecordsResponse {
  agentId: string;
  date: string; // YYYY-MM-DD
  punchRecords: PunchRecord[];
}

export interface DeletePunchResponse {
  message: string;
  deletedRecordIds: number[];
}

export interface LeaveRequest {
  requestId: number;
  agentId: number;
  leaveType: string;
  startDate: number; // Unix timestamp (毫秒)
  endDate: number; // Unix timestamp (毫秒)
  durationType: "FULL_DAY" | "TIME_RANGE";
  startTime?: string;
  endTime?: string;
  reason?: string;
  documentationPath?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approvedBy?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveSubmitResponse {
  requestId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  message: string;
}

export interface LeaveRequestsResponse {
  leaveRequests: LeaveRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
}

export interface LoginResponse {
  token: string;
  agentId: number;
  name: string;
  email: string;
  message: string;
}

export interface AgentInfo {
  agentId: number;
  name: string;
  email: string;
}

export interface SubordinateLeaveRequest extends LeaveRequest {
  agentName: string;
  agentEmail: string;
}

export interface SubordinateLeaveRequestsResponse {
  leaveRequests: SubordinateLeaveRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LeaveReviewResponse {
  requestId: number;
  status: "APPROVED" | "REJECTED";
  message: string;
}

export interface OvertimeSubmitResponse {
  requestId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  message: string;
}

export interface SubordinateOvertimeRequest {
  requestId: number;
  agentId: number;
  agentName: string;
  agentEmail: string;
  overtimeType: "WEEKDAY_OVERTIME" | "REST_DAY_OVERTIME" | "LEGAL_HOLIDAY_OVERTIME";
  overtimeDate: number; // Unix timestamp (毫秒)
  startTime: string; // 格式: HH:mm:ss
  endTime: string; // 格式: HH:mm:ss
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approvedBy?: number;
  notes?: string;
  createdAt: number; // Unix timestamp (毫秒)
  updatedAt: number; // Unix timestamp (毫秒)
}

export interface SubordinateOvertimeRequestsResponse {
  overtimeRequests: SubordinateOvertimeRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OvertimeReviewResponse {
  requestId: number;
  status: "APPROVED" | "REJECTED";
  message: string;
}
