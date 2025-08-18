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
  RefreshCw,
  Calculator,
  Hash,
  RotateCcw,
  TrendingDown,
  TrendingUp
} from "lucide-react"
import DashboardCharts from "@/components/charts/DashboardCharts"

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
  totalReturns: number;
  netRevenue: number;
  totalOrders?: number;
  totalReturnOrders?: number;
  averageOrderAmount?: number;
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
    totalReturns: 0,
    netRevenue: 0,
    totalOrders: 0,
    totalReturnOrders: 0,
  });
  const [marketRevenue, setMarketRevenue] = useState<MarketRevenue[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!date?.from || !date?.to) return;

    setLoading(true);
    setStats({ totalRevenue: 0, totalReturns: 0, netRevenue: 0, totalOrders: 0, totalReturnOrders: 0 });
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
    let totalReturns = 0;
    let totalOrders = 0;
    let totalReturnOrders = 0;
    const accumulatedMarketRevenue: { [key: string]: { totalRevenue: number; totalReturns: number; netRevenue: number; totalOrders: number; totalReturnOrders: number } } = {};
    const accumulatedDepotStats: { [key: string]: { totalRevenue: number; totalOrders: number; orderCount: number } } = {};
    const dailyTrendData: DailyTrendData[] = [];

    // Process all days and accumulate data
    for (const day of dateRange) {
      const formattedDate = format(day, 'yyyy-d-M');
      
      try {
        const [summaryRes, marketRes, depotStatsRes] = await Promise.all([
          fetch(`/api/summary-stats?startDate=${formattedDate}&endDate=${formattedDate}`),
          fetch(`/api/market-revenue?startDate=${formattedDate}&endDate=${formattedDate}`),
          fetch(`/api/depot-stats?startDate=${formattedDate}&endDate=${formattedDate}`)
        ]);
        
        const summaryData = await summaryRes.json();
        const marketData = await marketRes.json();
        const depotStatsData = await depotStatsRes.json();

        if (summaryData.totalRevenue > 0 || summaryData.totalReturns > 0) {
          // Accumulate totals
          totalRevenue += summaryData.totalRevenue || 0;
          totalReturns += summaryData.totalReturns || 0;
          totalOrders += summaryData.totalOrders || 0;
          totalReturnOrders += summaryData.totalReturnOrders || 0;

          // Add to daily trend
          dailyTrendData.push({
            date: format(day, 'dd/MM'),
            revenue: summaryData.netRevenue || summaryData.totalRevenue || 0,
            orders: summaryData.totalOrders || 0,
          });
        }

        if (Array.isArray(marketData)) {
          marketData.forEach(market => {
            if (!accumulatedMarketRevenue[market.marketName]) {
              accumulatedMarketRevenue[market.marketName] = {
                totalRevenue: 0,
                totalReturns: 0,
                netRevenue: 0,
                totalOrders: 0,
                totalReturnOrders: 0
              };
            }
            accumulatedMarketRevenue[market.marketName].totalRevenue += market.totalRevenue || 0;
            accumulatedMarketRevenue[market.marketName].totalReturns += market.totalReturns || 0;
            accumulatedMarketRevenue[market.marketName].netRevenue += market.netRevenue || 0;
            accumulatedMarketRevenue[market.marketName].totalOrders += market.totalOrders || 0;
            accumulatedMarketRevenue[market.marketName].totalReturnOrders += market.totalReturnOrders || 0;
          });
        }

        if (Array.isArray(depotStatsData)) {
          depotStatsData.forEach(depot => {
            if (!accumulatedDepotStats[depot.marketName]) {
              accumulatedDepotStats[depot.marketName] = { totalRevenue: 0, totalOrders: 0, orderCount: 0 };
            }
            accumulatedDepotStats[depot.marketName].totalRevenue += depot.totalRevenue || 0;
            accumulatedDepotStats[depot.marketName].totalOrders += depot.totalOrders || 0;
            accumulatedDepotStats[depot.marketName].orderCount += depot.totalOrders || 0;
          });
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${formattedDate}:`, error);
      }
    }

    // Update all states at once after all data is collected
    setStats({ 
      totalRevenue, 
      totalReturns, 
      netRevenue: totalRevenue - totalReturns,
      totalOrders, 
      totalReturnOrders 
    });
    setDailyTrend(dailyTrendData);
    setMarketRevenue(Object.entries(accumulatedMarketRevenue).map(([marketName, marketStats]) => {
      const depotStats = accumulatedDepotStats[marketName];
      return {
        marketName,
        totalRevenue: marketStats.totalRevenue,
        totalReturns: marketStats.totalReturns,
        netRevenue: marketStats.netRevenue,
        totalOrders: marketStats.totalOrders || depotStats?.totalOrders || 0,
        totalReturnOrders: marketStats.totalReturnOrders,
        averageOrderAmount: marketStats.totalOrders > 0 ? marketStats.totalRevenue / marketStats.totalOrders : 0,
      };
    }));
    
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Toplam Ciro */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Ciro</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">ERENKÖY & COURTYARD</p>
          </CardContent>
        </Card>

        {/* Toplam İade */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam İade</CardTitle>
            <RotateCcw className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">₺{stats.totalReturns.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">ERENKÖY & COURTYARD</p>
          </CardContent>
        </Card>

        {/* Net Ciro */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Ciro</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">₺{stats.netRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Ciro - İade Tutarı</p>
          </CardContent>
        </Card>

        {/* Toplam Fiş */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Fiş</CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalOrders.toLocaleString('tr-TR')}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Seçilen aralıktaki toplam fiş</p>
          </CardContent>
        </Card>
        
        {/* İade Fiş Sayısı */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">İade Fiş Sayısı</CardTitle>
            <TrendingDown className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalReturnOrders.toLocaleString('tr-TR')}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Seçilen aralıktaki iade fiş sayısı</p>
          </CardContent>
        </Card>

        {/* Ortalama Sipariş Tutarı */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Sipariş Tutarı</CardTitle>
            <Calculator className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">₺{Math.round(stats.totalOrders > 0 ? stats.netRevenue / stats.totalOrders : 0).toLocaleString('tr-TR')}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Net Ciro / Toplam Fiş</p>
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
                  {/* Main Revenue Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        ₺{market.totalRevenue.toLocaleString('tr-TR')}
                      </div>
                      <p className="text-xs text-muted-foreground">Brüt Ciro</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        ₺{market.netRevenue.toLocaleString('tr-TR')}
                      </div>
                      <p className="text-xs text-muted-foreground">Net Ciro</p>
                    </div>
                  </div>

                  {/* Returns Section */}
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <RotateCcw className="h-4 w-4 text-red-500" />
                          <span className="text-lg font-semibold text-red-600">
                            ₺{market.totalReturns.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">İade Tutarı</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown className="h-4 w-4 text-orange-500" />
                          <span className="text-lg font-semibold text-orange-600">
                            {market.totalReturnOrders?.toLocaleString('tr-TR') || 0}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">İade Fiş Sayısı</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Statistics */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Hash className="h-4 w-4 text-blue-500" />
                        <span className="text-lg font-semibold text-foreground">
                          {market.totalOrders?.toLocaleString('tr-TR') || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Toplam Fiş</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calculator className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-semibold text-foreground">
                          ₺{Math.round(market.averageOrderAmount || 0).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Ort. Sipariş Tutarı</p>
                    </div>
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
