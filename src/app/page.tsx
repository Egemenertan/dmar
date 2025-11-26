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
  TrendingUp,
  X
} from "lucide-react"
import DashboardCharts from "@/components/charts/DashboardCharts"

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
  totalReturns: number;
  netRevenue: number;
  totalOrders?: number;
  totalReturnOrders?: number;
  totalCancelledOrders?: number;
  totalCancelledAmount?: number;
  averageOrderAmount?: number;
}

interface DailyTrendData {
  date: string;
  revenue: number;
  orders: number;
  returns: number;
  returnOrders: number;
  cancelledOrders: number;
  cancelledAmount: number;
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
    totalCancelledOrders: 0,
    totalCancelledAmount: 0,
  });
  const [marketRevenue, setMarketRevenue] = useState<MarketRevenue[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!date?.from || !date?.to) return;

    console.log('🔄 Fetching stats for:', {
      from: format(date.from, 'yyyy-MM-dd'),
      to: format(date.to, 'yyyy-MM-dd'),
    });

    setLoading(true);
    setStats({ totalRevenue: 0, totalReturns: 0, netRevenue: 0, totalOrders: 0, totalReturnOrders: 0, totalCancelledOrders: 0, totalCancelledAmount: 0 });
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
    let totalCancelledOrders = 0;
    let totalCancelledAmount = 0;
    const accumulatedMarketRevenue: { [key: string]: { totalRevenue: number; totalReturns: number; netRevenue: number; totalOrders: number; totalReturnOrders: number; totalCancelledOrders: number; totalCancelledAmount: number } } = {};
    const accumulatedDepotStats: { [key: string]: { totalRevenue: number; totalOrders: number; orderCount: number } } = {};
    const dailyTrendData: DailyTrendData[] = [];

    // Process all days and accumulate data
    for (const day of dateRange) {
      const formattedDate = format(day, 'yyyy-d-M');
      const timestamp = Date.now(); // Cache buster
      
      try {
        const [summaryRes, marketRes, depotStatsRes] = await Promise.all([
          fetch(`/api/summary-stats?startDate=${formattedDate}&endDate=${formattedDate}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch(`/api/market-revenue?startDate=${formattedDate}&endDate=${formattedDate}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch(`/api/depot-stats?startDate=${formattedDate}&endDate=${formattedDate}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
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
          totalCancelledOrders += summaryData.totalCancelledOrders || 0;
          totalCancelledAmount += summaryData.totalCancelledAmount || 0;

          // Add to daily trend
          dailyTrendData.push({
            date: format(day, 'dd/MM'),
            revenue: summaryData.netRevenue || summaryData.totalRevenue || 0,
            orders: summaryData.totalOrders || 0,
            returns: summaryData.totalReturns || 0,
            returnOrders: summaryData.totalReturnOrders || 0,
            cancelledOrders: summaryData.totalCancelledOrders || 0,
            cancelledAmount: summaryData.totalCancelledAmount || 0,
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
                totalReturnOrders: 0,
                totalCancelledOrders: 0,
                totalCancelledAmount: 0
              };
            }
            accumulatedMarketRevenue[market.marketName].totalRevenue += market.totalRevenue || 0;
            accumulatedMarketRevenue[market.marketName].totalReturns += market.totalReturns || 0;
            accumulatedMarketRevenue[market.marketName].netRevenue += market.netRevenue || 0;
            accumulatedMarketRevenue[market.marketName].totalOrders += market.totalOrders || 0;
            accumulatedMarketRevenue[market.marketName].totalReturnOrders += market.totalReturnOrders || 0;
            accumulatedMarketRevenue[market.marketName].totalCancelledOrders += market.totalCancelledOrders || 0;
            accumulatedMarketRevenue[market.marketName].totalCancelledAmount += market.totalCancelledAmount || 0;
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
      totalReturnOrders,
      totalCancelledOrders,
      totalCancelledAmount
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
        totalCancelledOrders: marketStats.totalCancelledOrders,
        totalCancelledAmount: marketStats.totalCancelledAmount,
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
      {/* Enhanced Date Range Filter */}
      <div className="bg-transparent">
        <div className="pt-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">3 Depo Toplu Analizi</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Quick Access Buttons */}
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    setDate({from: today, to: today});
                  }}
                  className={`font-medium cursor-pointer transition-all ${
                    date?.from?.toDateString() === new Date().toDateString() && date?.to?.toDateString() === new Date().toDateString()
                      ? 'bg-[#63A860] text-white border-[#63A860] hover:bg-[#507d4e]'
                      : 'bg-white hover:bg-[#63A860] hover:text-white hover:border-[#63A860]'
                  }`}
                >
                  Bugün
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const yesterday = addDays(today, -1);
                    setDate({from: yesterday, to: yesterday});
                  }}
                  className="font-medium bg-white cursor-pointer hover:bg-[#63A860] hover:text-white hover:border-[#63A860] transition-all"
                >
                  Dün
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setDate({from: addDays(new Date(), -6), to: new Date()})}
                  className="font-medium bg-white cursor-pointer hover:bg-[#63A860] hover:text-white hover:border-[#63A860] transition-all"
                >
                  Son 7 Gün
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setDate({from: addDays(new Date(), -29), to: new Date()})}
                  className="font-medium bg-white cursor-pointer hover:bg-[#63A860] hover:text-white hover:border-[#63A860] transition-all"
                >
                  Son 30 Gün
                </Button>
              </div>

              {/* Calendar Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className="w-[320px] justify-start text-left font-medium bg-white border-2 hover:border-[#63A860] transition-colors h-11 cursor-pointer"
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-[#63A860]" />
                    {date?.from ? (
                      date.to ? (
                        <span className="font-semibold">
                          {format(date.from, "dd MMM yyyy")} - {format(date.to, "dd MMM yyyy")}
                        </span>
                      ) : (
                        <span className="font-semibold">{format(date.from, "dd MMM yyyy")}</span>
                      )
                    ) : (
                      <span className="text-gray-500">Tarih Seçin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-2xl border-2" align="end">
                  <style jsx global>{`
                    .rdp {
                      --rdp-cell-size: 40px;
                      --rdp-accent-color: #63A860;
                      --rdp-background-color: #f0f9f0;
                      font-size: 14px;
                    }
                    .rdp-months {
                      padding: 1rem;
                    }
                    .rdp-month {
                      margin: 0 0.75rem;
                    }
                    .rdp-caption {
                      margin-bottom: 0.75rem;
                    }
                    .rdp-caption_label {
                      font-size: 16px;
                      font-weight: 700;
                      color: #1f2937;
                    }
                    .rdp-head_cell {
                      font-weight: 600;
                      font-size: 12px;
                      color: #6b7280;
                      padding: 0.4rem;
                      text-transform: uppercase;
                    }
                    .rdp-cell {
                      padding: 1px;
                    }
                    .rdp-day {
                      width: 40px;
                      height: 40px;
                      border-radius: 10px;
                      font-size: 14px;
                      font-weight: 600;
                      transition: all 0.2s ease;
                      cursor: pointer !important;
                    }
                    .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
                      background-color: #f0f9f0 !important;
                      transform: scale(1.05);
                      box-shadow: 0 2px 8px rgba(99, 168, 96, 0.2);
                    }
                    .rdp-day_selected {
                      background-color: #63A860 !important;
                      color: white !important;
                      font-weight: 700;
                      transform: scale(1.02);
                    }
                    .rdp-day_selected:hover {
                      background-color: #507d4e !important;
                      transform: scale(1.08);
                    }
                    .rdp-day_range_middle {
                      background-color: #f0f9f0 !important;
                      color: #3d6d3a;
                      border-radius: 0 !important;
                    }
                    .rdp-day_range_start {
                      border-radius: 10px 0 0 10px !important;
                    }
                    .rdp-day_range_end {
                      border-radius: 0 10px 10px 0 !important;
                    }
                    .rdp-day_today {
                      font-weight: 700;
                      color: #63A860;
                      border: 2px solid #63A860;
                    }
                    .rdp-day_disabled {
                      color: #d1d5db;
                      cursor: not-allowed !important;
                    }
                    .rdp-day_outside {
                      color: #9ca3af;
                      opacity: 0.5;
                    }
                    .rdp-nav_button {
                      width: 36px;
                      height: 36px;
                      border-radius: 8px;
                      transition: all 0.2s ease;
                      cursor: pointer;
                    }
                    .rdp-nav_button:hover {
                      background-color: #f0f9f0;
                      transform: scale(1.1);
                    }
                    .rdp-nav_button svg {
                      width: 18px;
                      height: 18px;
                    }
                  `}</style>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(newDate) => {
                      console.log('📅 Tarih değişti:', newDate);
                      setDate(newDate);
                    }}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                    className="rounded-lg"
                  />
                  <div className="p-3 border-t bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#63A860]"></div>
                      <p className="text-sm font-semibold text-gray-700">
                        {date?.from && date?.to 
                          ? `${Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} gün seçildi`
                          : 'Başlangıç ve bitiş tarihi seçin'}
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Refresh Button */}
              <Button 
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-2 bg-white border-2 h-11 px-4 font-medium hover:bg-[#63A860] hover:text-white hover:border-[#63A860] transition-all cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
            </div>
          </div>

          {/* Date Info Bar */}
          {date?.from && date?.to && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#63A860] animate-pulse"></div>
                <span className="text-gray-600">
                  Seçili Dönem: <span className="font-semibold text-gray-900">
                    {format(date.from, "dd MMMM yyyy")} - {format(date.to, "dd MMMM yyyy")}
                  </span>
                </span>
              </div>
              <div className="text-gray-500">
                {loading ? (
                  <span className="text-[#63A860] font-medium">Veriler yükleniyor...</span>
                ) : (
                  <span className="text-[#63A860] font-medium">✓ Veriler güncel</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards - Enhanced Design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-xs text-muted-foreground pt-1">ERENKÖY & COURTYARD & LA ISLA</p>
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
            <p className="text-xs text-muted-foreground pt-1">ERENKÖY & COURTYARD & LA ISLA</p>
          </CardContent>
        </Card>

        {/* İptal Tutarı */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam İptal</CardTitle>
            <X className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">₺{stats.totalCancelledAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">İptal edilen fiş tutarı (ciroya dahil değil)</p>
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
            <p className="text-xs text-muted-foreground pt-1">Ciro - İade (İptal dahil değil)</p>
          </CardContent>
        </Card>

        {/* İptal Sayısı */}
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">İptal Sayısı</CardTitle>
            <Hash className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalCancelledOrders.toLocaleString('tr-TR')}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">İptal edilen fiş sayısı</p>
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

                  {/* Returns & Cancellations Section */}
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

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <X className="h-4 w-4 text-gray-500" />
                          <span className="text-lg font-semibold text-gray-600">
                            ₺{market.totalCancelledAmount?.toLocaleString('tr-TR') || 0}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">İptal Tutarı (ciroya dahil değil)</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Hash className="h-4 w-4 text-slate-500" />
                          <span className="text-lg font-semibold text-slate-600">
                            {market.totalCancelledOrders?.toLocaleString('tr-TR') || 0}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">İptal Fiş Sayısı</p>
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
