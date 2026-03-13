/**
 * Mock Data（依照 OpenAPI spec）
 * 模擬後端 API 回傳的資料
 */

import dayjs from "dayjs";

// 測試用特務帳號（密碼使用簡單版本）
export const mockAgents = [
  {
    agentId: 1,
    name: "Manager Wang",
    email: "manager@company.com",
    password: "manager123", // 實際應該是 bcrypt hash
    status: "ACTIVE",
    position: "主管",
    managerId: null,
  },
  {
    agentId: 2,
    name: "Alice",
    email: "alice@company.com",
    password: "password123",
    status: "ACTIVE",
    position: "資深特務",
    managerId: 1, // 主管是 Manager Wang
  },
  {
    agentId: 3,
    name: "Bob",
    email: "bob@company.com",
    password: "secret456",
    status: "ACTIVE",
    position: "特務專員",
    managerId: 1, // 主管是 Manager Wang
  },
  {
    agentId: 4,
    name: "Carol",
    email: "carol@company.com",
    password: "test789",
    status: "INACTIVE",
    position: "特務助理",
    managerId: 1,
  },
];

// 打卡記錄 Mock Data
export const mockPunchRecords = [
  {
    recordId: 1,
    agentId: "AGENT001",
    punchType: "IN",
    punchTime: dayjs().subtract(8, "hour").valueOf(), // Unix timestamp (毫秒)
  },
  {
    recordId: 2,
    agentId: "AGENT001",
    punchType: "OUT",
    punchTime: dayjs().subtract(1, "hour").valueOf(), // Unix timestamp (毫秒)
  },
];

// 當日工時摘要 Mock Data
export const mockDailySummary = {
  agentId: "AGENT001",
  date: dayjs().format("YYYY-MM-DD"),
  totalWorkHours: 7.0,
  overtimeHours: 0.0,
  punchRecords: [
    {
      recordId: 1,
      punchType: "IN",
      punchTime: dayjs().subtract(8, "hour").valueOf(), // Unix timestamp (毫秒)
    },
    {
      recordId: 2,
      punchType: "OUT",
      punchTime: dayjs().subtract(1, "hour").valueOf(), // Unix timestamp (毫秒)
    },
  ],
};

// 請假申請 Mock Data
export const mockLeaveRequests: any[] = [
  {
    requestId: 1,
    agentId: 2, // Alice
    leaveType: "SPECIAL_LEAVE",
    startDate: "2025-11-10",
    endDate: "2025-11-12",
    durationType: "FULL_DAY",
    reason: "年假休息",
    status: "PENDING",
    createdAt: "2025-11-07T10:00:00+08:00",
    updatedAt: "2025-11-07T10:00:00+08:00",
  },
  {
    requestId: 2,
    agentId: 3, // Bob
    leaveType: "SICK_LEAVE",
    startDate: "2025-11-08",
    endDate: "2025-11-08",
    durationType: "FULL_DAY",
    reason: "身體不適",
    status: "APPROVED",
    approvedBy: 1,
    createdAt: "2025-11-06T09:00:00+08:00",
    updatedAt: "2025-11-07T14:00:00+08:00",
  },
  {
    requestId: 3,
    agentId: 2, // Alice
    leaveType: "PERSONAL_LEAVE",
    startDate: "2025-11-05",
    endDate: "2025-11-05",
    durationType: "TIME_RANGE",
    startTime: "14:00:00",
    endTime: "18:00:00",
    reason: "處理私事",
    status: "APPROVED",
    approvedBy: 1,
    createdAt: "2025-11-02T15:00:00+08:00",
    updatedAt: "2025-11-03T09:00:00+08:00",
  },
  {
    requestId: 4,
    agentId: 3, // Bob
    leaveType: "SPECIAL_LEAVE",
    startDate: "2025-11-01",
    endDate: "2025-11-01",
    durationType: "FULL_DAY",
    reason: "家庭事務",
    status: "PENDING",
    createdAt: "2025-10-30T16:00:00+08:00",
    updatedAt: "2025-10-30T16:00:00+08:00",
  },
];

/**
 * 打卡 API Mock
 */
export const mockAttendanceApi = {
  // POST /attendance/punch - 打卡
  punch: async (data: {
    agentId: string;
    punchType: "IN" | "OUT";
    punchTime: number; // Unix timestamp (毫秒)
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newRecord = {
      recordId: mockPunchRecords.length + 1,
      agentId: data.agentId,
      punchType: data.punchType,
      punchTime: data.punchTime,
      dailyWorkHours: data.punchType === "OUT" ? 8.0 : 0.0,
    };

    mockPunchRecords.push(newRecord);

    return newRecord;
  },

  // GET /attendance/daily-summary - 查詢當日工時摘要
  getDailySummary: async (params: { agentId: string; date: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      ...mockDailySummary,
      agentId: params.agentId,
      date: dayjs(params.date).format("YYYY-MM-DD"), // 轉換為日期字串用於顯示
    };
  },

  // GET /attendance/punch-records - 查詢打卡紀錄
  getPunchRecords: async (params: { agentId: string; date: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      agentId: params.agentId,
      date: dayjs(params.date).format("YYYY-MM-DD"), // 轉換為日期字串用於顯示
      punchRecords: mockPunchRecords.filter(
        (r) => r.agentId === params.agentId,
      ),
    };
  },

  // DELETE /attendance/punch/{recordId} - 刪除打卡記錄
  deletePunch: async (recordId: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = mockPunchRecords.findIndex((r) => r.recordId === recordId);
    if (index !== -1) {
      mockPunchRecords.splice(index, 1);
      return {
        message: "打卡記錄已刪除",
        deletedRecordIds: [recordId],
      };
    }

    throw new Error("找不到該打卡記錄");
  },
};

/**
 * 請假 API Mock
 */
export const mockLeaveApi = {
  // POST /leave-requests - 提交請假申請
  submitRequest: async (data: {
    agentId: string;
    leaveType:
      | "SPECIAL_LEAVE"
      | "SICK_LEAVE"
      | "PERSONAL_LEAVE"
      | "MARRIAGE_LEAVE"
      | "FUNERAL_LEAVE";
    startDate: string;
    endDate: string;
    durationType: "FULL_DAY" | "TIME_RANGE";
    startTime?: string;
    endTime?: string;
    reason: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newRequest = {
      ...data,
      requestId: mockLeaveRequests.length + 1,
      agentId: parseInt(data.agentId),
      status: "PENDING" as const,
      message: "請假申請已提交，待主管核准",
      createdAt: dayjs().valueOf(), // Unix timestamp (毫秒)
      updatedAt: dayjs().valueOf(), // Unix timestamp (毫秒)
    };

    mockLeaveRequests.push(newRequest);

    return {
      requestId: newRequest.requestId,
      status: newRequest.status,
      message: newRequest.message,
    };
  },

  // GET /agents/{agentId}/leave-requests - 查詢請假記錄
  getLeaveRequests: async (params: {
    agentId: number;
    status?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    order?: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 篩選該特務的請假記錄
    let filtered = mockLeaveRequests.filter(
      (r) => r.agentId === params.agentId,
    );

    // 按狀態篩選
    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    // 按假別篩選
    if (params.leaveType) {
      filtered = filtered.filter((r) => r.leaveType === params.leaveType);
    }

    // 按日期範圍篩選
    if (params.startDate && params.endDate) {
      filtered = filtered.filter(
        (r) =>
          r.startDate >= params.startDate! && r.startDate <= params.endDate!,
      );
    }

    // 排序
    const sortBy = params.sortBy || "startDate";
    const order = params.order || "DESC";
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (order === "ASC") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // 分頁
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filtered.slice(start, end);

    return {
      leaveRequests: paginatedData,
      total,
      page,
      pageSize,
    };
  },

  // GET /managers/{managerId}/subordinates/leave-requests - 查詢下屬請假記錄
  getSubordinateLeaveRequests: async (params: {
    managerId: number;
    agentId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 找出所有下屬
    const subordinates = mockAgents.filter(
      (a) => a.managerId === params.managerId,
    );
    const subordinateIds = subordinates.map((s) => s.agentId);

    // 篩選下屬的請假記錄
    let filtered = mockLeaveRequests.filter((r) =>
      subordinateIds.includes(r.agentId),
    );

    // 按特定下屬篩選
    if (params.agentId) {
      filtered = filtered.filter((r) => r.agentId === params.agentId);
    }

    // 按狀態篩選
    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    // 依請假日期降序排列
    filtered.sort((a, b) => {
      if (a.startDate > b.startDate) return -1;
      if (a.startDate < b.startDate) return 1;
      return 0;
    });

    // 分頁
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filtered.slice(start, end);

    // 組裝包含下屬資訊的回應
    const leaveRequestsWithAgentInfo = paginatedData.map((request) => {
      const agent = mockAgents.find((a) => a.agentId === request.agentId);
      return {
        ...request,
        agentName: agent?.name || "",
        agentEmail: agent?.email || "",
      };
    });

    return {
      leaveRequests: leaveRequestsWithAgentInfo,
      total,
      page,
      pageSize,
    };
  },

  // POST /leave-requests/{requestId}/review - 審核請假申請
  reviewLeaveRequest: async (data: {
    requestId: number;
    action: "APPROVE" | "REJECT";
    notes?: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const request = mockLeaveRequests.find(
      (r) => r.requestId === data.requestId,
    );

    if (!request) {
      throw new Error("找不到該請假申請");
    }

    if (request.status !== "PENDING") {
      throw new Error("只能審核待審核狀態的請假申請");
    }

    // 更新請假申請狀態
    request.status = data.action === "APPROVE" ? "APPROVED" : "REJECTED";
    request.approvedBy = 1; // Mock: 假設審核人是 Manager (id=1)
    request.notes = data.notes;
    request.updatedAt = dayjs().valueOf(); // Unix timestamp (毫秒)

    return {
      requestId: data.requestId,
      status: request.status,
      message: data.action === "APPROVE" ? "請假申請已批准" : "請假申請已拒絕",
    };
  },
};

/**
 * 驗證 API Mock
 */
export const mockAuthApi = {
  // POST /auth/login - 登入驗證
  login: async (data: { email: string; password: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 查找使用者
    const agent = mockAgents.find((a) => a.email === data.email);

    // 帳號不存在或密碼錯誤
    if (!agent || agent.password !== data.password) {
      const error: any = new Error("帳號或密碼錯誤");
      error.status = 401;
      throw error;
    }

    // 帳號已停用
    if (agent.status === "INACTIVE") {
      const error: any = new Error("帳號或密碼錯誤");
      error.status = 401;
      throw error;
    }

    // 登入成功，回傳 mock token
    return {
      token: "mock-jwt-token-" + agent.agentId, // Mock token
      agentId: agent.agentId,
      name: agent.name,
      email: agent.email,
      message: "登入成功",
    };
  },
};
