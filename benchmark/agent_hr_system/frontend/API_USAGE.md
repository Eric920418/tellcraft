# API 使用說明

## 環境變數設定

在 `.env.local` 檔案中設定：

```bash
# API 根路徑
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Mock 模式開關
# true: 使用 mock data
# false: 打真實 API
NEXT_PUBLIC_ENABLE_MOCK=true
```

## Mock 模式切換

### 開發階段（使用 Mock）
```bash
NEXT_PUBLIC_ENABLE_MOCK=true
```
此模式下，所有 API 呼叫都會回傳 mock data，不會真的打到後端。

### 與後端對接（使用真實 API）
```bash
NEXT_PUBLIC_ENABLE_MOCK=false
```
此模式下，所有 API 呼叫都會打到真實的後端 API。

## 使用範例

### 1. 打卡 API

```typescript
import { punchApi } from '@/services/api';

// 建立打卡記錄
const result = await punchApi.create({
  agentId: 'agent-001',
  punchType: 'IN', // 'IN' | 'OUT'
  punchTime: '2024-01-15 09:00:00',
});

// 查詢打卡記錄
const records = await punchApi.list({
  agentId: 'agent-001',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

### 2. 請假 API

```typescript
import { leaveApi } from '@/services/api';

// 建立請假申請
const result = await leaveApi.create({
  agentId: 'agent-001',
  leaveType: '事假',
  startDate: '2024-01-15',
  endDate: '2024-01-15',
  days: 1,
  reason: '處理個人事務',
});

// 查詢請假記錄
const leaves = await leaveApi.list({
  agentId: 'agent-001',
  status: 'pending', // 'pending' | 'approved' | 'rejected'
});

// 更新請假申請
await leaveApi.update('leave-id', {
  status: 'approved',
  reviewedBy: 'Manager Bob',
});

// 刪除請假申請
await leaveApi.delete('leave-id');
```

### 3. 工時摘要 API

```typescript
import { summaryApi } from '@/services/api';

// 取得工時摘要
const summary = await summaryApi.get({
  agentId: 'agent-001',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

### 4. 記錄查詢 API

```typescript
import { recordsApi } from '@/services/api';

// 查詢打卡記錄
const records = await recordsApi.list({
  agentId: 'agent-001',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

## 完整範例（在 React 組件中使用）

```typescript
'use client';

import { useState, useEffect } from 'react';
import { punchApi } from '@/services/api';
import { Button, message } from 'antd';

export default function PunchPage() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  // 查詢打卡記錄
  useEffect(() => {
    async function fetchRecords() {
      try {
        const result = await punchApi.list({ agentId: 'agent-001' });
        if (result.success) {
          setRecords(result.data);
        }
      } catch (error) {
        console.error('查詢失敗:', error);
        message.error('查詢打卡記錄失敗');
      }
    }
    fetchRecords();
  }, []);

  // 打卡
  const handlePunch = async (punchType: 'IN' | 'OUT') => {
    setLoading(true);
    try {
      const result = await punchApi.create({
        agentId: 'agent-001',
        punchType,
        punchTime: new Date().toISOString(),
      });
      
      if (result.success) {
        message.success(result.message);
        // 重新查詢記錄
        const updatedRecords = await punchApi.list({ agentId: 'agent-001' });
        setRecords(updatedRecords.data);
      }
    } catch (error) {
      console.error('打卡失敗:', error);
      message.error('打卡失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button 
        type="primary" 
        loading={loading}
        onClick={() => handlePunch('IN')}
      >
        上班打卡
      </Button>
      <Button 
        loading={loading}
        onClick={() => handlePunch('OUT')}
      >
        下班打卡
      </Button>
      
      {/* 顯示記錄 */}
      <div>
        {records.map(record => (
          <div key={record.id}>{/* 顯示記錄內容 */}</div>
        ))}
      </div>
    </div>
  );
}
```

## 注意事項

1. **修改環境變數後需要重啟開發伺服器**
   ```bash
   # 停止當前伺服器 (Ctrl+C)
   # 重新啟動
   npm run dev
   ```

2. **Mock data 位置**：`src/mocks/data.ts`
   - 可以自行修改 mock data 的內容
   - Mock data 會保存在記憶體中，重新整理頁面後會重置

3. **API 回應格式**
   所有 API 都遵循統一的回應格式：
   ```typescript
   {
     success: boolean;
     data?: any;
     message?: string;
     total?: number; // list API 會有
   }
   ```

4. **錯誤處理**
   - Mock 模式：模擬延遲但不會真的失敗
   - 真實 API 模式：需要處理網路錯誤和 HTTP 錯誤

## 與後端對接檢查清單

當要切換到真實 API 時：

- [ ] 確認後端 API 已啟動
- [ ] 確認 `NEXT_PUBLIC_API_URL` 設定正確
- [ ] 設定 `NEXT_PUBLIC_ENABLE_MOCK=false`
- [ ] 重啟開發伺服器
- [ ] 檢查瀏覽器 Console 確認 API 請求正常
- [ ] 檢查後端 CORS 設定是否允許前端網域

## 除錯技巧

查看當前模式：
```typescript
console.log('Mock Mode:', process.env.NEXT_PUBLIC_ENABLE_MOCK);
```

在瀏覽器 Console 會看到：
```
🔧 API Mode: MOCK | API URL: http://localhost:8080/api
```
或
```
🔧 API Mode: REAL | API URL: http://localhost:8080/api
```
