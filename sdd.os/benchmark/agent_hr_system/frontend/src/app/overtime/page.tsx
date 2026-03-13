'use client';

import { useState } from 'react';
import { Card, Button, Form, Select, DatePicker, TimePicker, message, Alert } from 'antd';
import { FieldTimeOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { overtimeApi } from '@/services/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAgent } from '@/utils/auth';

function OvertimePageContent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 從登入資訊取得 agentId
  const agent = getAgent();
  const agentId = agent?.agentId || 1;

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 將日期轉換為毫秒時間戳記（該日期的 00:00:00，使用本地時區）
      // 注意：dayjs 的 startOf('day') 會使用本地時區，通常就是台灣時區 (UTC+8)
      const overtimeDateTimestamp = values.overtimeDate.startOf('day').valueOf();

      const overtimeData = {
        agentId: agentId.toString(),
        overtimeType: values.overtimeType,
        overtimeDate: overtimeDateTimestamp, // 毫秒時間戳記
        startTime: values.timeRange[0].format('HH:mm:ss'),
        endTime: values.timeRange[1].format('HH:mm:ss'),
        reason: values.reason || '加班',
      };

      const response = await overtimeApi.submitRequest(overtimeData);
      message.success(response.message || '加班申請已提交');
      form.resetFields();
    } catch (error: any) {
      message.error(error.message || '加班申請失敗');
    } finally {
      setLoading(false);
    }
  };

  const overtimeTypeMap: Record<string, { label: string; description: string }> = {
    WEEKDAY_OVERTIME: {
      label: '平日加班',
      description: '正常工作日延長工時（前2小時1.34倍，第3小時起1.67倍）',
    },
    REST_DAY_OVERTIME: {
      label: '休息日加班',
      description: '休息日出勤（前2小時1.34倍，3-8小時1.67倍，第9小時起2.67倍）',
    },
    LEGAL_HOLIDAY_OVERTIME: {
      label: '例假日加班',
      description: '例假日/國定假日出勤（2倍工資，需補假）',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-800">加班管理</h1>
          <p className="text-sage-500 mt-1">提交加班申請（符合台灣勞基法規定）</p>
        </div>
      </div>

      <Alert
        message="重要提醒"
        description="根據勞基法規定，必須先提出加班申請並獲得核准後才能加班打卡。加班時段內不能有打卡記錄，否則申請將被拒絕。"
        type="info"
        showIcon
        className="mb-6"
      />

      <Card
        title={
          <div className="flex items-center gap-2">
            <PlusOutlined />
            <span className="text-lg font-semibold text-sage-800">新增加班申請</span>
          </div>
        }
        className="card-shadow"
        style={{ margin: '5px 0' }}
        styles={{ body: { padding: '32px' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ overtimeType: 'WEEKDAY_OVERTIME' }}
        >
          <Form.Item
            label="加班類型"
            name="overtimeType"
            rules={[{ required: true, message: '請選擇加班類型' }]}
            extra="不同加班類型的工資計算方式不同，請依實際情況選擇"
          >
            <Select size="large">
              {Object.entries(overtimeTypeMap).map(([key, value]) => (
                <Select.Option key={key} value={key}>
                  <div>
                    <div className="font-medium">{value.label}</div>
                    <div className="text-xs text-gray-500">{value.description}</div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="加班日期"
            name="overtimeDate"
            rules={[{ required: true, message: '請選擇加班日期' }]}
          >
            <DatePicker
              size="large"
              className="w-full"
              format="YYYY-MM-DD"
              placeholder="選擇加班日期"
            />
          </Form.Item>

          <Form.Item
            label="加班時段"
            name="timeRange"
            rules={[{ required: true, message: '請選擇加班時段' }]}
            extra="請確認此時段內沒有打卡記錄"
          >
            <TimePicker.RangePicker
              size="large"
              className="w-full"
              format="HH:mm:ss"
              placeholder={['開始時間', '結束時間']}
            />
          </Form.Item>

          <Form.Item
            label="加班事由（選填）"
            name="reason"
          >
            <Select size="large" placeholder="選擇加班事由" allowClear>
              <Select.Option value="專案趕工">專案趕工</Select.Option>
              <Select.Option value="緊急任務">緊急任務</Select.Option>
              <Select.Option value="客戶需求">客戶需求</Select.Option>
              <Select.Option value="系統維護">系統維護</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-800 mb-2">申請前請確認：</h4>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>選擇的加班時段內沒有任何打卡記錄</li>
              <li>加班類型符合實際工作日性質（平日/休息日/例假日）</li>
              <li>已與主管溝通並取得初步同意</li>
              <li>平日加班每日最多4小時</li>
            </ul>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={<FieldTimeOutlined />}
              className="w-full"
            >
              提交加班申請
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={
          <span className="text-lg font-semibold text-sage-800">台灣勞基法加班規定說明</span>
        }
        className="card-shadow"
        style={{ margin: '5px 0' }}
        styles={{ body: { padding: '32px' } }}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📅 平日加班（WEEKDAY_OVERTIME）</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
              <li>前2小時：平日每小時工資額 × 1.34倍</li>
              <li>第3小時起：平日每小時工資額 × 1.67倍</li>
              <li>每日最多加班4小時</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">🏖️ 休息日加班（REST_DAY_OVERTIME）</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
              <li>前2小時：平日每小時工資額 × 1.34倍</li>
              <li>第3-8小時：平日每小時工資額 × 1.67倍</li>
              <li>第9小時起：平日每小時工資額 × 2.67倍</li>
              <li>勞工可拒絕休息日加班</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">🎉 例假日加班（LEGAL_HOLIDAY_OVERTIME）</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
              <li>工資：平日每小時工資額 × 2倍（全日計算）</li>
              <li>限制：僅限天災、事變或突發事件</li>
              <li>需事後補假</li>
              <li>需有完整記錄供勞檢備查</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function OvertimePage() {
  return (
    <ProtectedRoute>
      <OvertimePageContent />
    </ProtectedRoute>
  );
}

