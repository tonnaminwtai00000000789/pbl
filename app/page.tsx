'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { meanBy } from "lodash";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Activity, Wind, AlertCircle, RefreshCw } from "lucide-react";

interface AirQualityValue {
  pm1: number;
  pm10: number;
  pm2: number;
}

interface TimeData {
  time: string;
  value: AirQualityValue;
}

interface AirQualityData {
  timedata: TimeData[];
}

export default function Home() {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [latestData, setLatestData] = useState<TimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [show, setShow] = useState({
    pm1: true,
    pm2: true,
    pm10: true,
  });

  // format data
  const chartData = useMemo(
    () =>
      data?.timedata.map((i: any) => ({
        time: new Date(i.time).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        PM1: i.value.pm1,
        "PM2.5": i.value.pm2,
        PM10: i.value.pm10,
      })) || [],
    [data]
  );

  // average for "worst"
  const avg = {
    pm1: meanBy(chartData, "PM1") || 0,
    pm2: meanBy(chartData, "PM2.5") || 0,
    pm10: meanBy(chartData, "PM10") || 0,
  };

  const worst = Object.entries(avg).sort((a, b) => b[1] - a[1])[0];

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/airquality');

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result: AirQualityData = await response.json();
      setData(result);

      // Get the latest data (last item in the array)
      if (result.timedata && result.timedata.length > 0) {
        setLatestData(result.timedata[result.timedata.length - 1]);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval to fetch every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const getAQILevel = (pm25: number) => {
    if (pm25 <= 12) return {
      level: 'ดีมาก',
      color: 'from-emerald-500 to-green-600',
      badge: 'default',
    };
    if (pm25 <= 35) return {
      level: 'ดี',
      color: 'from-blue-500 to-cyan-600',
      badge: 'secondary',
    };
    if (pm25 <= 55) return {
      level: 'ปานกลาง',
      color: 'from-yellow-500 to-amber-600',
      badge: 'outline',
    };
    if (pm25 <= 150) return {
      level: 'เริ่มมีผลต่อสุขภาพ',
      color: 'from-orange-500 to-red-600',
      badge: 'destructive',
    };
    if (pm25 <= 250) return {
      level: 'มีผลต่อสุขภาพ',
      color: 'from-red-500 to-rose-700',
      badge: 'destructive',
    };
    return {
      level: 'อันตราย',
      color: 'from-purple-600 to-fuchsia-800',
      badge: 'destructive',
    };
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
              <p className="mt-4 text-slate-400">กำลังโหลดข้อมูล...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              เกิดข้อผิดพลาด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">{error}</p>
            <Button onClick={fetchData} className="w-full" variant="destructive">
              <RefreshCw className="mr-2 h-4 w-4" />
              ลองใหม่อีกครั้ง
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!latestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">ไม่พบข้อมูล</p>
      </div>
    );
  }

  const aqiInfo = getAQILevel(latestData.value.pm2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            ระบบตรวจวัดคุณภาพอากาศ
          </h1>
          <p className="text-slate-400 text-sm md:text-base flex items-center justify-center gap-2 mt-2">
            <Activity className="h-4 w-4" />
            ESP32-S2-100_995b489e
          </p>
        </div>

        {/* AQI Status Banner */}
        <Card className={`relative overflow-hidden bg-gradient-to-br ${aqiInfo.color} border-0 mb-6`}>
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <CardContent className="relative pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-5xl">{aqiInfo.icon}</span>
                <h2 className="text-4xl md:text-6xl font-bold text-white">
                  {aqiInfo.level}
                </h2>
              </div>
              <p className="text-white/90 text-xl md:text-2xl font-semibold">
                PM2.5: {latestData.value.pm2} µg/m³
              </p>
              {lastUpdate && (
                <p className="text-white/70 text-sm mt-2">
                  อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PM Values Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* PM1.0 Card */}
          <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800 hover:border-blue-500/50 transition-all group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                <span>PM1.0</span>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  {latestData.value.pm1}
                </span>
                <span className="text-slate-500 text-sm">µg/m³</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  ค่าเฉลี่ย: {avg.pm1.toFixed(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* PM2.5 Card */}
          <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800 hover:border-purple-500/50 transition-all group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                <span>PM2.5</span>
                <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {latestData.value.pm2}
                </span>
                <span className="text-slate-500 text-sm">µg/m³</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  ค่าเฉลี่ย: {avg.pm2.toFixed(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* PM10 Card */}
          <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800 hover:border-pink-500/50 transition-all group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                <span>PM10</span>
                <div className="h-2 w-2 bg-pink-500 rounded-full animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-pink-400 to-pink-600 bg-clip-text text-transparent">
                  {latestData.value.pm10}
                </span>
                <span className="text-slate-500 text-sm">µg/m³</span>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  ค่าเฉลี่ย: {avg.pm10.toFixed(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-200">
                  <Wind className="h-5 w-5" />
                  กราฟติดตามค่าฝุ่น
                </CardTitle>
                <CardDescription className="mt-1">
                  แสดงข้อมูลย้อนหลัง • แย่สุดตอนนี้: <Badge variant="destructive" className="ml-1">{worst?.[0].toUpperCase()}</Badge>
                </CardDescription>
              </div>

              {/* Toggle Controls */}
              <div className="flex gap-3">
                {[
                  { key: "pm1", label: "PM1", color: "bg-blue-500" },
                  { key: "pm2", label: "PM2.5", color: "bg-purple-500" },
                  { key: "pm10", label: "PM10", color: "bg-pink-500" }
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      id={key}
                      checked={show[key as keyof typeof show]}
                      onCheckedChange={(checked) =>
                        setShow({ ...show, [key]: checked })
                      }
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                    >
                      <span className={`h-3 w-3 rounded-full ${color}`} />
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pm1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="pm2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="pm10" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    stroke="#475569"
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    stroke="#475569"
                    label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid #334155",
                      borderRadius: 12,
                      backdropFilter: "blur(8px)",
                      padding: "12px"
                    }}
                    labelStyle={{ color: "#e2e8f0", fontWeight: "bold", marginBottom: "8px" }}
                    itemStyle={{ color: "#cbd5e1" }}
                  />

                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                  />

                  {show.pm1 && (
                    <Area
                      type="monotone"
                      dataKey="PM1"
                      stroke="#38bdf8"
                      fill="url(#pm1)"
                      strokeWidth={2.5}
                      dot={{ fill: "#38bdf8", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}

                  {show.pm2 && (
                    <Area
                      type="monotone"
                      dataKey="PM2.5"
                      stroke="#c084fc"
                      fill="url(#pm2)"
                      strokeWidth={2.5}
                      dot={{ fill: "#c084fc", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}

                  {show.pm10 && (
                    <Area
                      type="monotone"
                      dataKey="PM10"
                      stroke="#fb7185"
                      fill="url(#pm10)"
                      strokeWidth={2.5}
                      dot={{ fill: "#fb7185", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center">
          <Badge variant="outline" className="gap-2">
            <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            อัพเดทอัตโนมัติทุก 10 วินาที
          </Badge>
        </div>
      </div>
    </div>
  );
}
