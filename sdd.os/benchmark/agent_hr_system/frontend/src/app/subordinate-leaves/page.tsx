"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Select,
  message,
  Empty,
  Modal,
  Input,
} from "antd";
import {
  TeamOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { leaveApi, type SubordinateLeaveRequest } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getAgent } from "@/utils/auth";

const { Option } = Select;
const { TextArea } = Input;

// 自定義樣式
const tableStyles = `
  .subordinate-leaves-table .ant-table-thead > tr > th.sortable-column {
    background-color: #2c2d43 !important;
    color: #ffffff !important;
    position: relative;
  }
  .subordinate-leaves-table .ant-table-thead > tr > th.sortable-column::after {
    content: '⇅';
    position: absolute;
    right: 8px;
    color: #ffffff;
    font-size: 12px;
    opacity: 0.7;
  }
  .subordinate-leaves-table .ant-table-thead > tr > th.sortable-column:hover {
    background-color: #1c1f2e !important;
  }
  .subordinate-leaves-table .ant-table-column-sorter {
    color: #848484 !important;
  }
  .subordinate-leaves-table .ant-table-column-sorter-up.active,
  .subordinate-leaves-table .ant-table-column-sorter-down.active {
    color: #ffffff !important;
  }
  .ant-modal-footer {
    margin-top: 30px !important;
  }
`;

function SubordinateLeavesPageContent() {
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<SubordinateLeaveRequest[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(
    undefined,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined,
  );
  const [showFilters, setShowFilters] = useState(false);

  // 審核相關 state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | null>(
    null,
  );
  const [reviewRequestId, setReviewRequestId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // 從登入資訊取得 managerId
  const agent = getAgent();
  const managerId = agent?.agentId || 1;

  // 取得所有下屬（從已載入的請假記錄中提取）
  const subordinates = Array.from(
    new Map(
      leaveRequests.map((req) => [
        req.agentId,
        { agentId: req.agentId, name: req.agentName, email: req.agentEmail },
      ]),
    ).values(),
  );

  const loadSubordinateLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await leaveApi.getSubordinateLeaveRequests({
        managerId,
        page: currentPage,
        pageSize,
        agentId: selectedAgentId,
        status: selectedStatus as any,
      });
      setLeaveRequests(response.leaveRequests);
      setTotal(response.total);
    } catch (error: any) {
      message.error(error.message || "查詢下屬請假記錄失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubordinateLeaveRequests();
  }, [currentPage, pageSize, selectedAgentId, selectedStatus]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadSubordinateLeaveRequests();
  };

  const handleReset = () => {
    setSelectedAgentId(undefined);
    setSelectedStatus(undefined);
    setCurrentPage(1);
  };

  // 開啟審核 Modal
  const handleOpenReviewModal = (
    requestId: number,
    action: "APPROVE" | "REJECT",
  ) => {
    setReviewRequestId(requestId);
    setReviewAction(action);
    setReviewNotes("");
    setReviewModalVisible(true);
  };

  // 關閉審核 Modal
  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
    setReviewRequestId(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  // 執行審核
  const handleReview = async () => {
    if (!reviewRequestId || !reviewAction) return;

    setReviewLoading(true);
    try {
      const response = await leaveApi.reviewLeaveRequest({
        requestId: reviewRequestId,
        action: reviewAction,
        notes: reviewNotes || undefined,
      });

      message.success(response.message || "審核完成");
      handleCloseReviewModal();
      loadSubordinateLeaveRequests(); // 重新載入資料
    } catch (error: any) {
      message.error(error.message || "審核失敗");
    } finally {
      setReviewLoading(false);
    }
  };

  const leaveTypeMap: Record<string, string> = {
    SPECIAL_LEAVE: "特休",
    SICK_LEAVE: "病假",
    PERSONAL_LEAVE: "事假",
    MARRIAGE_LEAVE: "婚假",
    FUNERAL_LEAVE: "喪假",
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    PENDING: { color: "blue", text: "待審核" },
    APPROVED: { color: "green", text: "已批准" },
    REJECTED: { color: "red", text: "已拒絕" },
    CANCELLED: { color: "default", text: "已取消" },
  };

  const columns = [
    {
      title: "特務姓名",
      key: "agentName",
      render: (_: any, record: SubordinateLeaveRequest) => (
        <div>
          <div className="font-medium text-sage-800">{record.agentName}</div>
          <div className="text-xs text-sage-500">{record.agentEmail}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: "假別",
      dataIndex: "leaveType",
      key: "leaveType",
      render: (type: string) => (
        <Tag color="blue">{leaveTypeMap[type] || type}</Tag>
      ),
      width: 100,
    },
    {
      title: "類型",
      dataIndex: "durationType",
      key: "durationType",
      render: (type: string) => (
        <span className="text-sage-600">
          {type === "FULL_DAY" ? "全日假" : "時段假"}
        </span>
      ),
      width: 100,
    },
    {
      title: "請假日期",
      key: "dateRange",
      className: "sortable-column",
      render: (_: any, record: SubordinateLeaveRequest) => {
        const start = dayjs(record.startDate).format("YYYY/MM/DD");
        const end = dayjs(record.endDate).format("YYYY/MM/DD");
        return (
          <div className="text-sage-700">
            {start === end ? start : `${start} - ${end}`}
          </div>
        );
      },
      width: 150,
      sorter: (a: SubordinateLeaveRequest, b: SubordinateLeaveRequest) =>
        a.startDate - b.startDate,
      defaultSortOrder: "descend" as const,
    },
    {
      title: "時段",
      key: "timeRange",
      render: (_: any, record: SubordinateLeaveRequest) => {
        if (
          record.durationType === "TIME_RANGE" &&
          record.startTime &&
          record.endTime
        ) {
          return (
            <span className="text-sage-600">
              {record.startTime.slice(0, 5)} - {record.endTime.slice(0, 5)}
            </span>
          );
        }
        return <span className="text-sage-400">-</span>;
      },
      width: 120,
    },
    {
      title: "事由",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      render: (reason: string) => (
        <span className="text-sage-600">{reason || "-"}</span>
      ),
    },
    {
      title: "狀態",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      width: 100,
      filters: [
        { text: "待審核", value: "PENDING" },
        { text: "已批准", value: "APPROVED" },
        { text: "已拒絕", value: "REJECTED" },
        { text: "已取消", value: "CANCELLED" },
      ],
      onFilter: (value: any, record: SubordinateLeaveRequest) =>
        record.status === value,
    },
    {
      title: "申請時間",
      dataIndex: "createdAt",
      key: "createdAt",
      className: "sortable-column",
      render: (date: string) => (
        <span className="text-sage-500">
          {dayjs(date).format("YYYY/MM/DD HH:mm")}
        </span>
      ),
      width: 150,
      sorter: (a: SubordinateLeaveRequest, b: SubordinateLeaveRequest) =>
        dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: SubordinateLeaveRequest) => {
        if (record.status !== "PENDING") {
          return <span className="text-sage-400">-</span>;
        }
        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleOpenReviewModal(record.requestId, "APPROVE")}
              block
            >
              批准
            </Button>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleOpenReviewModal(record.requestId, "REJECT")}
              block
              style={{
                borderColor: "#d28488",
                background: "#ea8484",
                color: "#fff",
              }}
            >
              拒絕
            </Button>
          </Space>
        );
      },
      width: 100,
      fixed: "right" as const,
    },
  ];

  // 計算待審核數量
  const pendingCount = leaveRequests.filter(
    (req) => req.status === "PENDING",
  ).length;

  return (
    <div className="space-y-6">
      <style>{tableStyles}</style>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-sage-800">下屬請假記錄</h1>
            {pendingCount > 0 && (
              <Tag color="orange" className="text-sm px-3 py-1">
                {pendingCount} 筆待審核
              </Tag>
            )}
          </div>
          <p className="text-sage-500 mt-1">查詢並管理下屬的請假申請</p>
        </div>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
          size="large"
        >
          {showFilters ? "隱藏篩選" : "顯示篩選"}
        </Button>
      </div>

      {showFilters && (
        <Card className="card-shadow" style={{ margin: "5px 0" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                篩選下屬
              </label>
              <Select
                placeholder="全部下屬"
                allowClear
                size="large"
                className="w-full"
                value={selectedAgentId}
                onChange={setSelectedAgentId}
              >
                {subordinates.map((sub) => (
                  <Option key={sub.agentId} value={sub.agentId}>
                    {sub.name} ({sub.email})
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-sage-700 mb-2">
                請假狀態
              </label>
              <Select
                placeholder="全部狀態"
                allowClear
                size="large"
                className="w-full"
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                <Option value="PENDING">待審核</Option>
                <Option value="APPROVED">已批准</Option>
                <Option value="REJECTED">已拒絕</Option>
                <Option value="CANCELLED">已取消</Option>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={handleSearch}
                className="flex-1"
              >
                查詢
              </Button>
              <Button
                icon={<ReloadOutlined />}
                size="large"
                onClick={handleReset}
              >
                重置
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card
        title={
          <div className="flex items-center justify-between">
            <Space>
              <TeamOutlined className="text-sage-600" />
              <span className="text-lg font-semibold text-sage-800">
                請假記錄列表
              </span>
            </Space>
            {total > 0 && (
              <Tag color="blue" className="text-sm px-3 py-1">
                共 {total} 筆記錄
              </Tag>
            )}
          </div>
        }
        className="card-shadow"
        style={{ margin: "5px 0" }}
        styles={{ body: { padding: "24px" } }}
      >
        <Table
          className="subordinate-leaves-table"
          columns={columns}
          dataSource={leaveRequests}
          rowKey="requestId"
          loading={loading}
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
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          locale={{
            emptyText: (
              <Empty
                description="目前沒有下屬請假記錄"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 審核 Modal */}
      <Modal
        title={
          <span className="text-lg font-semibold">
            {reviewAction === "APPROVE" ? "批准請假申請" : "拒絕請假申請"}
          </span>
        }
        open={reviewModalVisible}
        onOk={handleReview}
        onCancel={handleCloseReviewModal}
        okText={reviewAction === "APPROVE" ? "確認批准" : "確認拒絕"}
        cancelText="取消"
        confirmLoading={reviewLoading}
        okButtonProps={{
          style:
            reviewAction === "REJECT"
              ? {
                  background: "#da6c6e",
                  borderColor: "#da6c6e",
                  color: "#fff",
                }
              : undefined,
        }}
      >
        <div className="py-4">
          <p className="text-sage-600 mb-4">
            {reviewAction === "APPROVE"
              ? "確定要批准這個請假申請嗎？"
              : "確定要拒絕這個請假申請嗎？"}
          </p>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-2">
              備註（選填）
            </label>
            <TextArea
              rows={4}
              placeholder={
                reviewAction === "APPROVE"
                  ? "可以填寫批准備註..."
                  : "可以填寫拒絕原因..."
              }
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              maxLength={200}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SubordinateLeavesPage() {
  return (
    <ProtectedRoute>
      <SubordinateLeavesPageContent />
    </ProtectedRoute>
  );
}
