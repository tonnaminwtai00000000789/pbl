'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ModeToggle } from "@/components/mode-toggle";
import { Activity, Wind, RefreshCw, Zap, TrendingUp, AlertTriangle } from "lucide-react";

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

// Utility to generate mock data
const generateMockData = (): AirQualityData => {
  const now = new Date();
  const timedata: TimeData[] = [];
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 10 * 60 * 1000);
    const basePm2 = 25 + Math.sin(i * 0.5) * 10 + (Math.random() * 10 - 5);
    const pm2 = Math.max(5, Math.floor(basePm2));
    const pm1 = Math.max(2, Math.floor(pm2 * 0.6 + (Math.random() * 5)));
    const pm10 = Math.max(pm2, Math.floor(pm2 * 1.5 + (Math.random() * 10)));

    timedata.push({
      time: time.toISOString(),
      value: { pm1, pm2, pm10 }
    });
  }
  return { timedata };
};

export default function Home() {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [latestData, setLatestData] = useState<TimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [useMock, setUseMock] = useState(process.env.NODE_ENV === 'development');
  const [timeLeft, setTimeLeft] = useState(10);
  const [mounted, setMounted] = useState(false);

  const [show, setShow] = useState({
    pm1: true,
    pm2: true,
    pm10: true,
  });

  const chartData = useMemo(() =>
    data?.timedata.map((i: TimeData) => ({
      time: new Date(i.time).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      PM1: i.value.pm1,
      "PM2.5": i.value.pm2,
      PM10: i.value.pm10,
    })) || [],
    [data]);

  const avg = {
    pm1: meanBy(chartData, "PM1") || 0,
    pm2: meanBy(chartData, "PM2.5") || 0,
    pm10: meanBy(chartData, "PM10") || 0,
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      let result: AirQualityData;

      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Slight artificial delay for skeleton demo
        result = generateMockData();
      } else {
        const response = await fetch('/api/airquality');
        if (!response.ok) throw new Error('Failed to fetch data');
        result = await response.json();
      }

      setData(result);
      if (result.timedata?.length > 0) {
        setLatestData(result.timedata[result.timedata.length - 1]);
      }
      setLastUpdate(new Date());
      setLoading(false);
      setTimeLeft(10);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }, [useMock]);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchData();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const getAQIColor = (value: number) => {
    if (value <= 12) return 'var(--chart-1)'; // Good
    if (value <= 35) return 'var(--chart-5)'; // Moderate
    if (value <= 55) return 'var(--chart-5)'; // Unhealthy for Sensitive
    return 'var(--destructive)'; // Unhealthy
  };

  const getAQIStatus = (value: number) => {
    if (value <= 12) return 'อากาศดี';
    if (value <= 35) return 'ปานกลาง';
    if (value <= 55) return 'เริ่มมีผลกระทบ';
    return 'อันตราย';
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-500/10 z-0 animate-pulse" />
        <Card className="w-full max-w-md glass-panel z-10 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div
              onClick={fetchData}
              className="glass-card flex items-center justify-center p-3 rounded-lg cursor-pointer hover:bg-destructive/10 group"
            >
              <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground p-4 md:p-8 pb-20 relative overflow-hidden transition-colors duration-700">

      {/* Decorative background elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-chart-2/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-glow mb-2 bg-linear-to-r from-primary to-foreground bg-clip-text text-transparent">
              Air Monitor
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              ระบบติดตามสภาพอากาศ
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              อัปเดตใน {timeLeft} วิ
            </div>
            <ModeToggle />
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>

          {/* Main Hero Card - PM2.5 */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="glass-card flex-1 flex flex-col justify-center relative overflow-hidden group border-primary/20">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <Wind className="w-32 h-32 text-primary rotate-12" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-muted-foreground uppercase tracking-wider">PM 2.5</CardTitle>
              </CardHeader>
              <CardContent>
                {loading || !latestData ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-8xl font-black tracking-tighter text-foreground drop-shadow-2xl">
                        {latestData.value.pm2}
                      </span>
                      <span className="text-xl text-muted-foreground font-light">มคก./ลบ.ม.</span>
                    </div>
                    <Badge
                      className="text-lg px-4 py-1 backdrop-blur-md"
                      style={{
                        backgroundColor: `oklch(from ${getAQIColor(latestData.value.pm2)} l c h / 0.2)`,
                        color: getAQIColor(latestData.value.pm2),
                        border: `1px solid ${getAQIColor(latestData.value.pm2)}`
                      }}
                    >
                      {getAQIStatus(latestData.value.pm2)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PM1 */}
            <Card className="glass-card hover:border-chart-1/50 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">PM 1.0</CardTitle>
                <Activity className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                {loading || !latestData ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold" style={{ color: 'var(--chart-1)' }}>{latestData.value.pm1}</span>
                    <span className="text-xs text-muted-foreground">อนุภาคขนาดเล็กมาก</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PM10 */}
            <Card className="glass-card hover:border-chart-3/50 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">PM 10</CardTitle>
                <Activity className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                {loading || !latestData ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold" style={{ color: 'var(--chart-3)' }}>{latestData.value.pm10}</span>
                    <span className="text-xs text-muted-foreground">ฝุ่นละอองขนาดใหญ่</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Average Stats */}
            <Card className="md:col-span-2 glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> ค่าเฉลี่ย 24 ชั่วโมง
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">PM 1.0</div>
                  <div className="text-2xl font-bold text-chart-1">{avg.pm1.toFixed(1)}</div>
                </div>
                <div className="text-center border-x border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">PM 2.5</div>
                  <div className="text-2xl font-bold text-primary">{avg.pm2.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">PM 10</div>
                  <div className="text-2xl font-bold text-chart-3">{avg.pm10.toFixed(1)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart Section */}
        <Card className="glass-panel border-white/5 overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
                  กราฟของค่าฝุ่น
                </CardTitle>
                <CardDescription>กราฟแสดงค่าฝุ่นในแต่ละชั่วโมง</CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "pm1", label: "PM 1.0", color: "var(--chart-1)" },
                  { key: "pm2", label: "PM 2.5", color: "var(--chart-2)" },
                  { key: "pm10", label: "PM 10", color: "var(--chart-3)" }
                ].map(({ key, label, color }) => (
                  <div
                    key={key}
                    onClick={() => setShow({ ...show, [key]: !show[key as keyof typeof show] })}
                    className={`
                        cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none flex items-center gap-2 border
                        ${show[key as keyof typeof show]
                        ? `bg-primary/10 border-primary/20 text-foreground`
                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/50'
                      }
                     `}
                  >
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px]`} style={{ backgroundColor: color, boxShadow: show[key as keyof typeof show] ? `0 0 8px ${color}` : 'none' }}></div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full h-100 min-h-100 mt-4">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPM1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPM2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPM10" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.05} />

                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      dy={10}
                      minTickGap={30}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      width={40}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.12 0.04 260 / 0.8)',
                        backdropFilter: 'blur(12px)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
                    />

                    {show.pm1 && (
                      <Area type="monotone" dataKey="PM1" stroke="var(--chart-1)" fill="url(#gradPM1)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} />
                    )}
                    {show.pm2 && (
                      <Area type="monotone" dataKey="PM2.5" stroke="var(--chart-2)" fill="url(#gradPM2)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} />
                    )}
                    {show.pm10 && (
                      <Area type="monotone" dataKey="PM10" stroke="var(--chart-3)" fill="url(#gradPM10)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="w-full h-full rounded-xl" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dev Mode Controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-10">
          <div className="glass-panel p-2 rounded-full flex items-center gap-3 pr-4 shadow-2xl">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary/10`}>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col mr-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">แหล่งข้อมูล</span>
              <span className="text-xs font-semibold text-foreground">{useMock ? 'จำลอง' : 'API จริง'}</span>
            </div>
            <Switch checked={useMock} onCheckedChange={setUseMock} />
          </div>
        </div>
      )}
    </div>
  );
}
