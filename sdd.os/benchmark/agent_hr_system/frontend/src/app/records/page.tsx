"use client";

import { useState, useEffect } from "react";
import {
  Card,
  DatePicker,
  Button,
  Timeline,
  Tag,
  Empty,
  Space,
  message,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { attendanceApi, PunchRecord } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getAgent } from "@/utils/auth";

function RecordsPageContent() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [records, setRecords] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 從登入資訊取得 agentId
  const agent = getAgent();
  const agentId = agent?.agentId.toString() || "agent-001";

  const loadRecords = async (date: Dayjs) => {
    setLoading(true);
    try {
      const dateTimestamp = date.startOf("day").valueOf(); // 使用當日 00:00:00 的 timestamp
      const response: any = await attendanceApi.getPunchRecords({
        agentId,
        date: dateTimestamp,
      });
      setRecords(response.punchRecords || []);
    } catch (error) {
      message.error("載入打卡記錄失敗");
    } finally {
      setLoading(false);
    }
  };

  // 頁面載入時自動查詢今日記錄
  useEffect(() => {
    loadRecords(selectedDate);
  }, []);

  const handleSearch = () => {
    loadRecords(selectedDate);
  };

  const handleDelete = async (recordId: number) => {
    try {
      await attendanceApi.deletePunch(recordId);
      message.success("打卡記錄已刪除");
      loadRecords(selectedDate);
    } catch (error: any) {
      message.error(error.message || "刪除失敗");
    }
  };

  // 計算工作時段
  const calculateWorkPeriods = () => {
    const periods: { start: PunchRecord; end?: PunchRecord }[] = [];
    for (let i = 0; i < records.length; i += 2) {
      if (records[i].punchType === "IN") {
        periods.push({
          start: records[i],
          end: records[i + 1]?.punchType === "OUT" ? records[i + 1] : undefined,
        });
      }
    }
    return periods;
  };

  const workPeriods = calculateWorkPeriods();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-800">打卡記錄查詢</h1>
          <p className="text-sage-500 mt-1">查看歷史打卡記錄</p>
        </div>
      </div>

      <Card style={{ margin: "5px 0" }} className="card-shadow">
        <Space size="large" className="w-full">
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            size="large"
            format="YYYY-MM-DD"
            className="w-64"
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            size="large"
            onClick={handleSearch}
            loading={loading}
          >
            查詢
          </Button>
        </Space>
      </Card>

      <Card
        title={
          <div className="flex items-center justify-between">
            <Space>
              <ClockCircleOutlined />
              <span className="text-lg font-semibold text-sage-800">
                {selectedDate.format("YYYY年MM月DD日")} 打卡記錄
              </span>
            </Space>
            {records.length > 0 && (
              <Tag color="blue" className="text-sm px-3 py-1">
                共 {records.length} 筆記錄
              </Tag>
            )}
          </div>
        }
        style={{ margin: "5px 0" }}
        className="card-shadow"
      >
        {records.length > 0 ? (
          <div className="space-y-6">
            <Timeline
              items={records.map((record, index) => {
                const isLastIn =
                  record.punchType === "IN" &&
                  (index === records.length - 1 ||
                    records[index + 1]?.punchType === "IN");

                return {
                  color: record.punchType === "IN" ? "green" : "red",
                  children: (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-4">
                        <Tag
                          color={record.punchType === "IN" ? "green" : "red"}
                          className="text-sm px-3 py-1"
                        >
                          {record.punchType === "IN" ? "上班" : "下班"}
                        </Tag>
                        <span className="text-lg font-medium text-sage-800">
                          {dayjs(record.punchTime).format("HH:mm:ss")}
                        </span>
                        <span className="text-sage-500">
                          {dayjs(record.punchTime).format("YYYY-MM-DD")}
                        </span>
                      </div>
                      {isLastIn && (
                        <Popconfirm
                          title="確定要刪除這筆打卡記錄嗎？"
                          description="如果有對應的下班打卡，也會一起刪除"
                          onConfirm={() => handleDelete(record.recordId)}
                          okText="確定"
                          cancelText="取消"
                        >
                          <Button danger size="small" icon={<DeleteOutlined />}>
                            刪除
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  ),
                };
              })}
            />

            {workPeriods.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-sage-800 mb-4">
                  工作時段統計
                </h3>
                <div className="space-y-3">
                  {workPeriods.map((period, index) => {
                    const startTime = dayjs(period.start.punchTime);
                    const endTime = period.end
                      ? dayjs(period.end.punchTime)
                      : null;
                    const duration = endTime
                      ? (
                          (endTime.valueOf() - startTime.valueOf()) /
                          (1000 * 60 * 60)
                        ).toFixed(1)
                      : null;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-sage-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Tag color="blue">時段 {index + 1}</Tag>
                          <span className="font-medium text-sage-700">
                            {startTime.format("HH:mm")}
                          </span>
                          <span className="text-sage-400">→</span>
                          <span className="font-medium text-sage-700">
                            {endTime ? endTime.format("HH:mm") : "進行中"}
                          </span>
                        </div>
                        {duration && (
                          <Tag color="green" className="text-sm px-3 py-1">
                            {duration} 小時
                          </Tag>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Empty
            description="查無打卡記錄"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <ProtectedRoute>
      <RecordsPageContent />
    </ProtectedRoute>
  );
}
