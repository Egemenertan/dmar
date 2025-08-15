"use client"

import { useState, useEffect, useCallback } from "react"
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

  const fetchStats = useCallback(async () => {
    if (!date?.from || !date?.to) return;

    setLoading(true);
    setStats({ totalRevenue: 0, totalOrders: 0 });
    setMarketRevenue([]);
    setDailyTrend([]);

    const startDate = date.from;
    const endDate = date.to;
    const dateRange = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize accumulators
    let totalRevenue = 0;
    let totalOrders = 0;
    const accumulatedMarketRevenue: { [key: string]: number } = {};
    const dailyTrendData: DailyTrendData[] = [];

    // Process all days and accumulate data
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
          // Accumulate totals
          totalRevenue += summaryData.totalRevenue;
          totalOrders += summaryData.totalOrders;

          // Add to daily trend
          dailyTrendData.push({
            date: format(day, 'dd/MM'),
            revenue: summaryData.totalRevenue,
            orders: summaryData.totalOrders,
          });
        }

        if (Array.isArray(marketData)) {
          marketData.forEach(market => {
            accumulatedMarketRevenue[market.marketName] = (accumulatedMarketRevenue[market.marketName] || 0) + market.totalRevenue;
          });
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${formattedDate}:`, error);
      }
    }

    // Update all states at once after all data is collected
    setStats({ totalRevenue, totalOrders });
    setDailyTrend(dailyTrendData);
    setMarketRevenue(Object.entries(accumulatedMarketRevenue).map(([marketName, totalRevenue]) => ({
      marketName,
      totalRevenue,
    })));
    
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

      {/* Stats Cards - Enhanced Design */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Toplam Ciro</CardTitle>
              <p className="text-sm text-muted-foreground">ERENKÖY & COURTYARD</p>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-full">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-3xl font-bold text-muted-foreground">Yükleniyor...</div>
            ) : (
              <div className="text-3xl font-bold text-foreground">
                ₺{stats.totalRevenue.toLocaleString('tr-TR')}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Seçilen aralıktaki toplam ciro
            </p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Toplam Sipariş</CardTitle>
              <p className="text-sm text-muted-foreground">ERENKÖY & COURTYARD</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-full">
              <ShoppingCart className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-3xl font-bold text-muted-foreground">Yükleniyor...</div>
            ) : (
              <div className="text-3xl font-bold text-foreground">
                {stats.totalOrders.toLocaleString('tr-TR')}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Seçilen aralıktaki toplam sipariş
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Market Revenue - Optimized for 2 Depots */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-lg text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          marketRevenue.map((market) => (
            <Card key={market.marketName} className="transition-all duration-200 hover:shadow-lg border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-primary">
                    {market.marketName.replace('DEPO', '').trim()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Market Şubesi</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      ₺{market.totalRevenue.toLocaleString('tr-TR')}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seçilen aralıktaki toplam ciro
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Market Performansı</span>
                      <span className="text-green-600 font-medium">Aktif</span>
                    </div>
                  </div>
                </div>
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
