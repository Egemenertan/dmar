"use client"

import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  ShoppingCart,
  Store,
  RefreshCw
} from "lucide-react"
import DashboardCharts from "@/components/charts/DashboardCharts"

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
}

interface DailyTrendData {
  date: string;
  revenue: number;
  orders: number;
}

export default function Home() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
  });
  const [marketRevenue, setMarketRevenue] = useState<MarketRevenue[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!date?.from || !date?.to) return;

    setLoading(true);
    setStats({ totalRevenue: 0, totalOrders: 0 });
    setMarketRevenue([]);
    setDailyTrend([]);

    const startDate = date.from;
    const endDate = date.to;
    const dateRange = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let accumulatedRevenue = 0;
    let accumulatedOrders = 0;
    const accumulatedMarketRevenue: { [key: string]: number } = {};

    for (const day of dateRange) {
      const formattedDate = format(day, 'yyyy-d-M');
      
      try {
        const [summaryRes, marketRes] = await Promise.all([
          fetch(`/api/summary-stats?startDate=${formattedDate}&endDate=${formattedDate}`),
          fetch(`/api/market-revenue?startDate=${formattedDate}&endDate=${formattedDate}`)
        ]);
        
        const summaryData = await summaryRes.json();
        const marketData = await marketRes.json();

        if (summaryData.totalRevenue > 0) {
          accumulatedRevenue += summaryData.totalRevenue;
          accumulatedOrders += summaryData.totalOrders;

          setStats(prev => ({
            totalRevenue: prev.totalRevenue + summaryData.totalRevenue,
            totalOrders: prev.totalOrders + summaryData.totalOrders,
          }));

          setDailyTrend(prev => [...prev, {
            date: format(day, 'dd/MM'),
            revenue: summaryData.totalRevenue,
            orders: summaryData.totalOrders,
          }]);
        }

        if (Array.isArray(marketData)) {
          marketData.forEach(market => {
            accumulatedMarketRevenue[market.marketName] = (accumulatedMarketRevenue[market.marketName] || 0) + market.totalRevenue;
          });

          setMarketRevenue(Object.entries(accumulatedMarketRevenue).map(([marketName, totalRevenue]) => ({
            marketName,
            totalRevenue,
          })));
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${formattedDate}:`, error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [date]);

  return (
    <div className="space-y-8 p-1">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-[300px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => setDate({from: new Date(), to: new Date()})}>Bugün</Button>
          <Button variant="outline" onClick={() => setDate({from: addDays(new Date(), -6), to: new Date()})}>Son 7 Gün</Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-2xl font-bold">Yükleniyor...</div> : <div className="text-2xl font-bold">₺{stats.totalRevenue.toLocaleString('tr-TR')}</div>}
            <p className="text-xs text-muted-foreground">
              Seçilen aralıktaki toplam ciro
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="text-2xl font-bold">Yükleniyor...</div> : <div className="text-2xl font-bold">{stats.totalOrders}</div>}
            <p className="text-xs text-muted-foreground">
              Seçilen aralıktaki toplam sipariş
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Market Revenue */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Yükleniyor...</p>
        ) : (
          marketRevenue.map((market) => (
            <Card key={market.marketName}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{market.marketName.replace('DEPO', '').trim()}</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{market.totalRevenue.toLocaleString('tr-TR')}</div>
                <p className="text-xs text-muted-foreground">
                  Seçilen aralıktaki toplam ciro
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Interactive Charts Section */}
      <DashboardCharts 
        marketRevenue={marketRevenue}
        date={date}
        loading={loading}
        dailyTrend={dailyTrend}
      />
    </div>
  )
}
