import dayjs from 'dayjs';

// 類型定義
export interface Agent {
  id: string;
  name: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PunchRecord {
  recordId: number;
  agentId: string;
  punchType: 'IN' | 'OUT';
  punchTime: string;
  punchDate: string;
  dailyWorkHours: number;
}

export interface LeaveRequest {
  requestId: number;
  agentId: string;
  leaveType: 'SPECIAL_LEAVE' | 'ANNUAL_LEAVE' | 'SICK_LEAVE';
  startDate: string;
  endDate: string;
  durationType: 'FULL_DAY' | 'TIME_RANGE';
  startTime?: string;
  endTime?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface DailyWorkSummary {
  agentId: string;
  date: string;
  totalWorkHours: number;
  overtimeHours: number;
}

// Mock 數據存儲
let punchRecords: PunchRecord[] = [];
let leaveRequests: LeaveRequest[] = [];
let recordIdCounter = 1;
let requestIdCounter = 1;

// 當前登入的 Agent
const currentAgent: Agent = {
  id: 'agent-001',
  name: 'Alice',
  position: '成長駭客：行銷特務',
  status: 'ACTIVE',
};

// 計算當日總工時
const calculateDailyWorkHours = (agentId: string, date: string): number => {
  const records = punchRecords
    .filter(r => r.agentId === agentId && r.punchDate === date)
    .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

  let totalHours = 0;
  for (let i = 0; i < records.length; i += 2) {
    if (records[i]?.punchType === 'IN' && records[i + 1]?.punchType === 'OUT') {
      const inTime = new Date(records[i].punchTime);
      const outTime = new Date(records[i + 1].punchTime);
      totalHours += (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
    }
  }
  return Math.round(totalHours * 10) / 10;
};

// 檢查是否有請假衝突
const hasLeaveConflict = (agentId: string, punchTime: string): boolean => {
  const punchDate = dayjs(punchTime).format('YYYY-MM-DD');
  const approvedLeaves = leaveRequests.filter(
    r => r.agentId === agentId && r.status === 'APPROVED' &&
         r.startDate <= punchDate && r.endDate >= punchDate
  );

  for (const leave of approvedLeaves) {
    if (leave.durationType === 'FULL_DAY') {
      return true;
    }
    if (leave.durationType === 'TIME_RANGE' && leave.startTime && leave.endTime) {
      const punchTimeOnly = dayjs(punchTime).format('HH:mm:ss');
      if (punchTimeOnly >= leave.startTime && punchTimeOnly <= leave.endTime) {
        return true;
      }
    }
  }
  return false;
};

// 檢查打卡記錄衝突
const hasPunchConflict = (agentId: string, startDate: string, endDate: string, startTime?: string, endTime?: string): boolean => {
  const conflictRecords = punchRecords.filter(r => {
    if (r.agentId !== agentId) return false;
    if (r.punchDate < startDate || r.punchDate > endDate) return false;

    if (startTime && endTime) {
      const recordTime = dayjs(r.punchTime).format('HH:mm:ss');
      return recordTime >= startTime && recordTime <= endTime;
    }
    return true;
  });

  return conflictRecords.length > 0;
};

// Mock API
export const mockApi = {
  // 獲取當前 Agent
  getCurrentAgent: async (): Promise<Agent> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(currentAgent), 300);
    });
  },

  // 打卡
  punch: async (agentId: string, punchType: 'IN' | 'OUT', punchTime: string): Promise<PunchRecord> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 檢查未來時間
        if (new Date(punchTime) > new Date()) {
          reject(new Error('不能使用未來時間打卡'));
          return;
        }

        // 檢查請假衝突
        if (hasLeaveConflict(agentId, punchTime)) {
          reject(new Error('打卡時間與已批准的請假衝突'));
          return;
        }

        const punchDate = dayjs(punchTime).format('YYYY-MM-DD');
        const todayRecords = punchRecords
          .filter(r => r.agentId === agentId && r.punchDate === punchDate)
          .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

        const lastRecord = todayRecords[todayRecords.length - 1];

        // 驗證打卡順序
        if (punchType === 'IN' && lastRecord?.punchType === 'IN') {
          reject(new Error('請先完成 OUT 打卡'));
          return;
        }
        if (punchType === 'OUT' && (!lastRecord || lastRecord.punchType === 'OUT')) {
          reject(new Error('請先完成 IN 打卡'));
          return;
        }

        // 檢查跨日
        if (punchType === 'OUT' && lastRecord) {
          const lastDate = dayjs(lastRecord.punchTime).format('YYYY-MM-DD');
          if (punchDate !== lastDate) {
            reject(new Error('不能跨日打卡'));
            return;
          }
        }

        const newRecord: PunchRecord = {
          recordId: recordIdCounter++,
          agentId,
          punchType,
          punchTime,
          punchDate,
          dailyWorkHours: 0,
        };

        punchRecords.push(newRecord);
        newRecord.dailyWorkHours = calculateDailyWorkHours(agentId, punchDate);

        resolve(newRecord);
      }, 500);
    });
  },

  // 查詢打卡記錄
  getPunchRecords: async (agentId: string, date: string): Promise<PunchRecord[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const records = punchRecords
          .filter(r => r.agentId === agentId && r.punchDate === date)
          .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());
        resolve(records);
      }, 300);
    });
  },

  // 刪除打卡記錄
  deletePunchRecord: async (recordId: number): Promise<{ deletedRecordIds: number[] }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const record = punchRecords.find(r => r.recordId === recordId);
        if (!record) {
          reject(new Error('打卡記錄不存在'));
          return;
        }

        const deletedIds: number[] = [recordId];

        // 如果是 IN 打卡，找到對應的 OUT 打卡一起刪除
        if (record.punchType === 'IN') {
          const sameDayRecords = punchRecords
            .filter(r => r.agentId === record.agentId && r.punchDate === record.punchDate)
            .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

          const index = sameDayRecords.findIndex(r => r.recordId === recordId);
          if (index >= 0 && sameDayRecords[index + 1]?.punchType === 'OUT') {
            deletedIds.push(sameDayRecords[index + 1].recordId);
          }
        } else {
          // OUT 打卡不能單獨刪除
          reject(new Error('不能刪除已完成的 OUT 打卡'));
          return;
        }

        punchRecords = punchRecords.filter(r => !deletedIds.includes(r.recordId));
        resolve({ deletedRecordIds: deletedIds });
      }, 300);
    });
  },

  // 提交請假申請
  submitLeaveRequest: async (request: Omit<LeaveRequest, 'requestId' | 'status'>): Promise<LeaveRequest> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 檢查打卡衝突
        if (hasPunchConflict(
          request.agentId,
          request.startDate,
          request.endDate,
          request.startTime,
          request.endTime
        )) {
          reject(new Error('請假時段內有打卡記錄'));
          return;
        }

        const newRequest: LeaveRequest = {
          ...request,
          requestId: requestIdCounter++,
          status: 'PENDING',
        };

        leaveRequests.push(newRequest);
        resolve(newRequest);
      }, 500);
    });
  },

  // 獲取請假申請列表
  getLeaveRequests: async (agentId: string): Promise<LeaveRequest[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const requests = leaveRequests
          .filter(r => r.agentId === agentId)
          .sort((a, b) => b.requestId - a.requestId);
        resolve(requests);
      }, 300);
    });
  },

  // 查詢當日工時摘要
  getDailyWorkSummary: async (agentId: string, date: string): Promise<DailyWorkSummary> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalWorkHours = calculateDailyWorkHours(agentId, date);
        const overtimeHours = Math.max(0, totalWorkHours - 8);

        resolve({
          agentId,
          date,
          totalWorkHours,
          overtimeHours,
        });
      }, 300);
    });
  },

  // 重置數據（測試用）
  reset: () => {
    punchRecords = [];
    leaveRequests = [];
    recordIdCounter = 1;
    requestIdCounter = 1;
  },
};
