"use client";

import { useState, useEffect } from "react";
import {
  Card,
  DatePicker,
  Button,
  Row,
  Col,
  Statistic,
  Progress,
  Space,
  message,
  Empty,
} from "antd";
import {
  SearchOutlined,
  ClockCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { attendanceApi, DailySummary } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getAgent } from "@/utils/auth";

function SummaryPageContent() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 從登入資訊取得 agentId
  const agent = getAgent();
  const agentId = agent?.agentId.toString() || "agent-001";

  const loadSummary = async (date: Dayjs) => {
    setLoading(true);
    try {
      const dateTimestamp = date.startOf("day").valueOf(); // 使用當日 00:00:00 的 timestamp
      const data: any = await attendanceApi.getDailySummary({
        agentId,
        date: dateTimestamp,
      });
      setSummary(data);
      setSearched(true);
    } catch (error) {
      message.error("載入工時摘要失敗");
    } finally {
      setLoading(false);
    }
  };

  // 頁面載入時自動查詢今日工時
  useEffect(() => {
    loadSummary(selectedDate);
  }, []);

  const handleSearch = () => {
    loadSummary(selectedDate);
  };

  const workHoursPercentage = summary
    ? Math.min((summary.totalWorkHours / 8) * 100, 100)
    : 0;
  const isOvertime = summary ? summary.overtimeHours > 0 : false;
  const isFullDay = summary ? summary.totalWorkHours >= 8 : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-800">工時摘要</h1>
          <p className="text-sage-500 mt-1">查看每日工作時數統計</p>
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

      {searched && summary ? (
        <>
          <Card
            style={{ margin: "5px 0" }}
            className="card-shadow bg-gradient-to-br from-primary-50 to-primary-100 border-0"
          >
            <div className="text-center py-4">
              <div className="text-lg text-primary-600 mb-2">
                {dayjs(summary.date).format("YYYY年MM月DD日")}
              </div>
              <div className="text-5xl font-bold text-primary-700 mb-4">
                {summary.totalWorkHours.toFixed(1)}
                <span className="text-2xl ml-2">小時</span>
              </div>
              <Progress
                percent={Math.round(workHoursPercentage)}
                strokeColor={{
                  "0%": "#0ea5e9",
                  "100%": "#0369a1",
                }}
                status={isFullDay ? "success" : "active"}
                className="max-w-md mx-auto"
              />
            </div>
          </Card>

          <Row gutter={16}>
            <Col span={8}>
              <Card style={{ margin: "5px 0" }} className="card-shadow">
                <Statistic
                  title="標準工時"
                  value={8}
                  suffix="小時"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#657665" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ margin: "5px 0" }} className="card-shadow">
                <Statistic
                  title="實際工時"
                  value={summary.totalWorkHours}
                  suffix="小時"
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#0ea5e9" }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ margin: "5px 0" }} className="card-shadow">
                <Statistic
                  title="加班時數"
                  value={summary.overtimeHours || 0}
                  suffix="小時"
                  precision={1}
                  prefix={<FireOutlined />}
                  valueStyle={{ color: isOvertime ? "#f59e0b" : "#10b981" }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={
              <span className="text-lg font-semibold text-sage-800">
                工時狀態
              </span>
            }
            style={{ margin: "5px 0" }}
            className="card-shadow"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircleOutlined
                    className={`text-2xl ${isFullDay ? "text-green-500" : "text-gray-400"}`}
                  />
                  <div>
                    <div className="font-medium text-sage-800">
                      標準工時達成
                    </div>
                    <div className="text-sm text-sage-500">需達到 8 小時</div>
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${isFullDay ? "text-green-600" : "text-gray-400"}`}
                >
                  {isFullDay ? "已達成" : "未達成"}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FireOutlined
                    className={`text-2xl ${isOvertime ? "text-orange-500" : "text-gray-400"}`}
                  />
                  <div>
                    <div className="font-medium text-sage-800">加班時數</div>
                    <div className="text-sm text-sage-500">
                      超過 8 小時的部分
                    </div>
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${isOvertime ? "text-orange-600" : "text-gray-400"}`}
                >
                  {(summary.overtimeHours || 0).toFixed(1)} 小時
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClockCircleOutlined className="text-2xl text-primary-500" />
                  <div>
                    <div className="font-medium text-sage-800">工時完成度</div>
                    <div className="text-sm text-sage-500">
                      相對於標準工時的百分比
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-primary-600">
                  {Math.round(workHoursPercentage)}%
                </div>
              </div>
            </div>
          </Card>

          {summary.totalWorkHours === 0 && (
            <Card
              style={{ margin: "5px 0" }}
              className="card-shadow bg-yellow-50 border-yellow-200"
            >
              <div className="text-center py-4">
                <div className="text-yellow-700 text-lg font-medium">
                  當日無工時記錄
                </div>
                <div className="text-yellow-600 mt-2">請確認是否已完成打卡</div>
              </div>
            </Card>
          )}
        </>
      ) : searched && !summary ? (
        <Card style={{ margin: "5px 0" }} className="card-shadow">
          <Empty
            description="查無工時資料"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Card style={{ margin: "5px 0" }} className="card-shadow">
          <div className="text-center py-12">
            <ClockCircleOutlined className="text-6xl text-sage-300 mb-4" />
            <div className="text-lg text-sage-500">
              請選擇日期並點擊查詢按鈕
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function SummaryPage() {
  return (
    <ProtectedRoute>
      <SummaryPageContent />
    </ProtectedRoute>
  );
}
