'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Form, Select, DatePicker, TimePicker, Radio, message, Table, Tag, Space, Input } from 'antd';
import { FileTextOutlined, PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { leaveApi, type LeaveRequest } from '@/services/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAgent } from '@/utils/auth';

const { RangePicker } = DatePicker;

function LeavePageContent() {
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [durationType, setDurationType] = useState<'FULL_DAY' | 'TIME_RANGE'>('FULL_DAY');
  const [showFilters, setShowFilters] = useState(false);

  // 從登入資訊取得 agentId
  const agent = getAgent();
  const agentId = agent?.agentId || 1;

  const loadLeaveRequests = async (filters?: any) => {
    setTableLoading(true);
    try {
      const response = await leaveApi.getLeaveRequests({
        agentId,
        page: currentPage,
        pageSize,
        ...filters,
      });
      setLeaveRequests(response.leaveRequests);
      setTotal(response.total);
    } catch (error: any) {
      message.error(error.message || '查詢請假記錄失敗');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, [currentPage, pageSize]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const leaveData: any = {
        agentId: agentId.toString(),
        leaveType: values.leaveType,
        durationType: values.durationType,
        reason: values.reason || '無', // API spec 需要 reason 欄位
      };

      if (values.durationType === 'FULL_DAY') {
        leaveData.startDate = values.dateRange[0].format('YYYY-MM-DD');
        leaveData.endDate = values.dateRange[1].format('YYYY-MM-DD');
      } else {
        leaveData.startDate = values.date.format('YYYY-MM-DD');
        leaveData.endDate = values.date.format('YYYY-MM-DD');
        leaveData.startTime = values.timeRange[0].format('HH:mm:ss');
        leaveData.endTime = values.timeRange[1].format('HH:mm:ss');
      }

      const response: any = await leaveApi.submitRequest(leaveData);
      message.success(response.message || '請假申請已提交');
      form.resetFields();
      setCurrentPage(1); // 回到第一頁
      loadLeaveRequests();
    } catch (error: any) {
      message.error(error.message || '請假申請失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (values: any) => {
    const filters: any = {};

    if (values.status) {
      filters.status = values.status;
    }

    if (values.leaveType) {
      filters.leaveType = values.leaveType;
    }

    if (values.dateRange && values.dateRange.length === 2) {
      filters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      filters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    setCurrentPage(1); // 篩選後回到第一頁
    loadLeaveRequests(filters);
  };

  const handleResetFilter = () => {
    filterForm.resetFields();
    setCurrentPage(1);
    loadLeaveRequests();
  };

  const leaveTypeMap: Record<string, string> = {
    SPECIAL_LEAVE: '特休',
    SICK_LEAVE: '病假',
    PERSONAL_LEAVE: '事假',
    MARRIAGE_LEAVE: '婚假',
    FUNERAL_LEAVE: '喪假',
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    PENDING: { color: 'blue', text: '待審核' },
    APPROVED: { color: 'green', text: '已批准' },
    REJECTED: { color: 'red', text: '已拒絕' },
    CANCELLED: { color: 'default', text: '已取消' },
  };

  const columns = [
    {
      title: '申請日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      width: 150,
    },
    {
      title: '假別',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type: string) => leaveTypeMap[type] || type,
      width: 100,
    },
    {
      title: '類型',
      dataIndex: 'durationType',
      key: 'durationType',
      render: (type: string) => type === 'FULL_DAY' ? '全日假' : '時段假',
      width: 100,
    },
    {
      title: '請假日期',
      key: 'dateRange',
      render: (_: any, record: LeaveRequest) => {
        const start = dayjs(record.startDate).format('MM/DD');
        const end = dayjs(record.endDate).format('MM/DD');
        return start === end ? start : `${start} - ${end}`;
      },
      width: 120,
    },
    {
      title: '時段',
      key: 'timeRange',
      render: (_: any, record: LeaveRequest) => {
        if (record.durationType === 'TIME_RANGE' && record.startTime && record.endTime) {
          return `${record.startTime.slice(0, 5)} - ${record.endTime.slice(0, 5)}`;
        }
        return '-';
      },
      width: 120,
    },
    {
      title: '事由',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      width: 100,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-800">請假管理</h1>
          <p className="text-sage-500 mt-1">提交與查看請假申請</p>
        </div>
      </div>

      <Card
        title={
          <Space>
            <PlusOutlined />
            <span className="text-lg font-semibold text-sage-800">新增請假申請</span>
          </Space>
        }
        className="card-shadow"
        style={{ margin: '5px 0' }}
        styles={{ body: { padding: '32px' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ durationType: 'FULL_DAY', leaveType: 'SPECIAL_LEAVE' }}
        >
          <Form.Item
            label="假別"
            name="leaveType"
            rules={[{ required: true, message: '請選擇假別' }]}
          >
            <Select size="large">
              <Select.Option value="SPECIAL_LEAVE">特休</Select.Option>
              <Select.Option value="ANNUAL_LEAVE">年假</Select.Option>
              <Select.Option value="SICK_LEAVE">病假</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="請假類型"
            name="durationType"
            rules={[{ required: true, message: '請選擇請假類型' }]}
          >
            <Radio.Group
              size="large"
              onChange={(e) => setDurationType(e.target.value)}
            >
              <Radio.Button value="FULL_DAY">全日假</Radio.Button>
              <Radio.Button value="TIME_RANGE">時段假</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {durationType === 'FULL_DAY' ? (
            <Form.Item
              label="請假日期"
              name="dateRange"
              rules={[{ required: true, message: '請選擇請假日期' }]}
            >
              <RangePicker
                size="large"
                className="w-full"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                label="請假日期"
                name="date"
                rules={[{ required: true, message: '請選擇請假日期' }]}
              >
                <DatePicker
                  size="large"
                  className="w-full"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
              <Form.Item
                label="請假時段"
                name="timeRange"
                rules={[{ required: true, message: '請選擇請假時段' }]}
              >
                <TimePicker.RangePicker
                  size="large"
                  className="w-full"
                  format="HH:mm:ss"
                />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              icon={<FileTextOutlined />}
              className="w-full"
            >
              提交請假申請
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-sage-800">請假記錄</span>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '隱藏篩選' : '顯示篩選'}
            </Button>
          </div>
        }
        className="card-shadow"
        style={{ margin: '5px 0' }}
        styles={{ body: { padding: '32px' } }}
      >
        {showFilters && (
          <div style={{ padding: '2rem', margin: '1rem 0' }} className="bg-gray-50 rounded-lg">
            <Form
              form={filterForm}
              onFinish={handleFilter}
              layout="vertical"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Form.Item name="status" label="狀態" className="mb-0">
                  <Select placeholder="全部狀態" allowClear size="large">
                    <Select.Option value="PENDING">待審核</Select.Option>
                    <Select.Option value="APPROVED">已批准</Select.Option>
                    <Select.Option value="REJECTED">已拒絕</Select.Option>
                    <Select.Option value="CANCELLED">已取消</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="leaveType" label="假別" className="mb-0">
                  <Select placeholder="全部假別" allowClear size="large">
                    <Select.Option value="SPECIAL_LEAVE">特休</Select.Option>
                    <Select.Option value="SICK_LEAVE">病假</Select.Option>
                    <Select.Option value="PERSONAL_LEAVE">事假</Select.Option>
                    <Select.Option value="MARRIAGE_LEAVE">婚假</Select.Option>
                    <Select.Option value="FUNERAL_LEAVE">喪假</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="dateRange" label="日期範圍" className="mb-0">
                  <RangePicker format="YYYY-MM-DD" size="large" className="w-full" />
                </Form.Item>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button onClick={handleResetFilter} size="large">
                  重置
                </Button>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} size="large">
                  查詢
                </Button>
              </div>
            </Form>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={leaveRequests}
          rowKey="requestId"
          loading={tableLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 筆記錄`,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
          }}
          locale={{ emptyText: '暫無請假記錄' }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

export default function LeavePage() {
  return (
    <ProtectedRoute>
      <LeavePageContent />
    </ProtectedRoute>
  );
}
