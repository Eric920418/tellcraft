"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Timeline,
  Tag,
  Popconfirm,
} from "antd";
import {
  ClockCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { attendanceApi, PunchRecord } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getAgent } from "@/utils/auth";

function PunchPageContent() {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [todayRecords, setTodayRecords] = useState<PunchRecord[]>([]);
  const [dailyWorkHours, setDailyWorkHours] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [lastPunchType, setLastPunchType] = useState<"IN" | "OUT" | null>(null);

  // 從登入資訊取得 agentId
  const agent = getAgent();
  const agentId = agent?.agentId.toString() || "agent-001";

  // 更新當前時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 載入今日打卡記錄和工時摘要
  const loadTodayRecords = async () => {
    try {
      const todayTimestamp = dayjs().startOf("day").valueOf(); // 今日 00:00:00 的 timestamp

      // 載入打卡記錄
      const recordsResponse: any = await attendanceApi.getPunchRecords({
        agentId,
        date: todayTimestamp,
      });
      const records = recordsResponse.punchRecords || [];
      setTodayRecords(records);

      if (records.length > 0) {
        setLastPunchType(records[records.length - 1].punchType);
      } else {
        setLastPunchType(null);
      }

      // 載入工時摘要
      const summaryResponse: any = await attendanceApi.getDailySummary({
        agentId,
        date: todayTimestamp,
      });
      setDailyWorkHours(summaryResponse.totalWorkHours || 0);
      setOvertimeHours(summaryResponse.overtimeHours || 0);
    } catch (error) {
      message.error("載入打卡記錄失敗");
    }
  };

  useEffect(() => {
    loadTodayRecords();

    // 每半小時自動刷新工時資料
    const refreshInterval = setInterval(
      () => {
        loadTodayRecords();
      },
      30 * 60 * 1000,
    ); // 30 分鐘 = 30 * 60 * 1000 毫秒

    return () => clearInterval(refreshInterval);
  }, []);

  // 執行打卡
  const handlePunch = async (punchType: "IN" | "OUT") => {
    setLoading(true);
    try {
      const punchTime = dayjs().valueOf(); // Unix timestamp (毫秒)
      const result = await attendanceApi.punch({
        agentId,
        punchType,
        punchTime,
      });

      message.success({
        content: `${punchType === "IN" ? "上班" : "下班"}打卡成功！`,
        duration: 2,
      });

      await loadTodayRecords();
    } catch (error: any) {
      message.error(error.message || "打卡失敗");
    } finally {
      setLoading(false);
    }
  };

  // 刪除打卡記錄
  const handleDeleteRecord = async (recordId: number) => {
    try {
      await attendanceApi.deletePunch(recordId);
      message.success("刪除打卡記錄成功");
      await loadTodayRecords();
    } catch (error: any) {
      message.error(error.message || "刪除打卡記錄失敗");
    }
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-800">打卡系統</h1>
          <p className="text-sage-500 mt-1">記錄您的工作時間</p>
        </div>
      </div>

      {/* 當前時間卡片 - 賽博龐克風格 */}
      <Card
        style={{ margin: "5px 0", backgroundColor: "#232537" }}
        className="card-shadow border-2 border-yellow-500/20 overflow-hidden relative"
      >
        {/* 網格背景 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#fbbf24 1px, transparent 1px), linear-gradient(90deg, #fbbf24 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>

        {/* 霓虹光暈效果 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl transform -translate-x-48 translate-y-48"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-600 rounded-full blur-3xl transform -translate-x-32 -translate-y-32"></div>
        </div>

        <div className="relative text-center py-16">
          {/* 時間顯示 - 簡化霓虹數字 */}
          <div
            className="font-bold mb-8 tracking-widest font-mono"
            style={{
              color: "rgb(251, 191, 36)",
              textShadow: "rgb(72 69 60 / 60%) 0px 0px 20px",
              fontSize: "6rem",
            }}
          >
            {currentTime.format("HH:mm:ss")}
          </div>

          {/* 分隔線 - 霓虹效果 */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{ boxShadow: "0 0 10px rgba(34, 211, 238, 0.8)" }}
            ></div>
            <div
              className="mx-4 w-2 h-2 bg-cyan-400 rounded-full"
              style={{ boxShadow: "0 0 10px rgba(34, 211, 238, 1)" }}
            ></div>
            <div
              className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{ boxShadow: "0 0 10px rgba(34, 211, 238, 0.8)" }}
            ></div>
          </div>

          {/* 日期顯示 */}
          <div
            className="text-2xl font-medium tracking-wide"
            style={{ color: "white" }}
          >
            {currentTime.format("YYYY年MM月DD日 dddd")}
          </div>
        </div>
      </Card>

      {/* 打卡按鈕 */}
      <Card style={{ margin: "5px 0" }} className="card-shadow">
        <div className="text-center py-8">
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              loading={loading}
              disabled={lastPunchType === "IN"}
              onClick={() => handlePunch("IN")}
              className="h-16 px-12 text-lg font-medium shadow-lg hover:shadow-xl"
            >
              上班打卡
            </Button>
            <Button
              danger
              size="large"
              icon={<LogoutOutlined />}
              loading={loading}
              disabled={lastPunchType !== "IN"}
              onClick={() => handlePunch("OUT")}
              className="h-16 px-12 text-lg font-medium shadow-lg hover:shadow-xl"
            >
              下班打卡
            </Button>
          </Space>
          {lastPunchType === "IN" && (
            <div className="mt-4 text-sage-600">
              <Tag color="green" className="text-sm px-3 py-1">
                已上班打卡，可以進行下班打卡
              </Tag>
            </div>
          )}
          {lastPunchType === "OUT" && (
            <div className="mt-4 text-sage-600">
              <Tag color="orange" className="text-sm px-3 py-1">
                已下班打卡，可以進行下一次上班打卡
              </Tag>
            </div>
          )}
          {lastPunchType === null && (
            <div className="mt-4 text-sage-600">
              <Tag
                color="blue"
                className="text-sm px-3 py-1"
                style={{ marginTop: "5px" }}
              >
                尚未打卡，請進行上班打卡
              </Tag>
            </div>
          )}
        </div>
      </Card>

      {/* 工時統計 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ margin: "5px 0" }} className="card-shadow">
            <Statistic
              title="標準工時"
              value={8}
              suffix="小時"
              valueStyle={{ color: "#657665", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ margin: "5px 0" }} className="card-shadow">
            <Statistic
              title="實際工時"
              value={dailyWorkHours || 0}
              suffix="小時"
              precision={1}
              valueStyle={{ color: "#0ea5e9", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ margin: "5px 0" }} className="card-shadow">
            <Statistic
              title="加班時數"
              value={overtimeHours}
              suffix="小時"
              precision={1}
              valueStyle={{
                color: overtimeHours > 0 ? "#f59e0b" : "#10b981",
                fontWeight: "bold",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工時狀態 */}
      <Card
        title={
          <span className="text-lg font-semibold text-sage-800">工時狀態</span>
        }
        style={{ margin: "5px 0" }}
        className="card-shadow"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ClockCircleOutlined
                className={`text-2xl ${dailyWorkHours >= 8 ? "text-green-500" : "text-gray-400"}`}
              />
              <div>
                <div className="font-medium text-sage-800">標準工時達成</div>
                <div className="text-sm text-sage-500">需達到 8 小時</div>
              </div>
            </div>
            <div
              className={`text-lg font-bold ${dailyWorkHours >= 8 ? "text-green-600" : "text-gray-400"}`}
            >
              {dailyWorkHours >= 8 ? "已達成" : "未達成"}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ClockCircleOutlined
                className={`text-2xl ${overtimeHours > 0 ? "text-orange-500" : "text-gray-400"}`}
              />
              <div>
                <div className="font-medium text-sage-800">加班時數</div>
                <div className="text-sm text-sage-500">超過 8 小時的部分</div>
              </div>
            </div>
            <div
              className={`text-lg font-bold ${overtimeHours > 0 ? "text-orange-600" : "text-gray-400"}`}
            >
              {overtimeHours.toFixed(1)} 小時
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
              {Math.round(Math.min((dailyWorkHours / 8) * 100, 100))}%
            </div>
          </div>
        </div>
      </Card>

      {/* 今日打卡記錄 */}
      <Card
        title={
          <span className="text-lg font-semibold text-sage-800">
            今日打卡記錄
          </span>
        }
        style={{ margin: "5px 0" }}
        className="card-shadow"
      >
        {todayRecords.length > 0 ? (
          <Timeline
            items={todayRecords.map((record, index) => {
              // 只有「上班打卡(IN)」且是最後一筆或下一筆也是 IN 的情況下才能刪除
              const isLastIn =
                record.punchType === "IN" &&
                (index === todayRecords.length - 1 ||
                  todayRecords[index + 1]?.punchType === "IN");

              return {
                color: record.punchType === "IN" ? "green" : "red",
                children: (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="font-medium text-sage-800">
                          {record.punchType === "IN" ? "上班打卡" : "下班打卡"}
                        </span>
                        <span className="ml-3 text-sage-600">
                          {dayjs(record.punchTime).format("HH:mm:ss")}
                        </span>
                      </div>
                      <Tag color={record.punchType === "IN" ? "green" : "red"}>
                        {record.punchType}
                      </Tag>
                    </div>
                    {isLastIn && (
                      <Popconfirm
                        title="確定要刪除這筆打卡記錄嗎？"
                        description="如果有對應的下班打卡，也會一起刪除"
                        onConfirm={() => handleDeleteRecord(record.recordId)}
                        okText="確定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          刪除
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                ),
              };
            })}
          />
        ) : (
          <div className="text-center py-8 text-sage-400">今日尚無打卡記錄</div>
        )}
      </Card>
    </div>
  );
}

export default function PunchPage() {
  return (
    <ProtectedRoute>
      <PunchPageContent />
    </ProtectedRoute>
  );
}
