"use client";

// Removed unused imports useState and useEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, PieChart, BarChart3, Calculator, Hash, RotateCcw, X, TrendingDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import RevenueLineChart from './RevenueLineChart';
import MarketRevenuePieChart from './MarketRevenuePieChart';
import MarketRevenueBarChart from './MarketRevenueBarChart';

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
  totalReturns: number;
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

interface DashboardChartsProps {
  marketRevenue: MarketRevenue[];
  date: DateRange | undefined;
  loading: boolean;
  dailyTrend: DailyTrendData[];
}

export default function DashboardCharts({ marketRevenue, date: _date, loading, dailyTrend }: DashboardChartsProps) {
  // date parameter is passed but not used yet
  void _date;
  return (
    <div className="space-y-8">
      {/* Charts Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">İstatistiksel Analiz</h3>
        <p className="text-gray-600">Detaylı performans ve trend analizleri</p>
      </div>
      
      {/* Charts Section */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trend Analizi
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Dağılım
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Karşılaştırma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Günlük Ciro, Sipariş, İade ve İptal Trendi
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Seçilen tarih aralığındaki günlük performans, iade ve iptal analizi
              </p>
            </CardHeader>
            <CardContent>
              <RevenueLineChart 
                data={dailyTrend} 
                loading={loading && dailyTrend.length === 0} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-500" />
                Market Ciro Dağılımı
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Marketler arası ciro paylaşımı ve oranları
              </p>
            </CardHeader>
            <CardContent>
              <MarketRevenuePieChart data={marketRevenue} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Market Performans Karşılaştırması
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Marketlerin ciro performanslarının detaylı karşılaştırması
              </p>
            </CardHeader>
            <CardContent>
              <MarketRevenueBarChart data={marketRevenue} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Summary */}
      {marketRevenue.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* İlk Satır - 4 Kart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Yüksek Ciro</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{Math.max(...marketRevenue.map(m => m.totalRevenue)).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {marketRevenue.find(m => m.totalRevenue === Math.max(...marketRevenue.map(m => m.totalRevenue)))?.marketName.replace('DEPO', '').trim()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İade</CardTitle>
              <RotateCcw className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{marketRevenue.reduce((sum, m) => sum + (m.totalReturns || 0), 0).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam iade tutarı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İptal</CardTitle>
              <X className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{marketRevenue.reduce((sum, m) => sum + (m.totalCancelledAmount || 0), 0).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam iptal tutarı (ciroya dahil değil)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Ciro</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{Math.round(marketRevenue.reduce((sum, m) => sum + m.totalRevenue, 0) / marketRevenue.length).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Market başına ortalama
              </p>
            </CardContent>
          </Card>

          {/* İkinci Satır - 4 Kart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İade Fiş Sayısı</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketRevenue.reduce((sum, m) => sum + (m.totalReturnOrders || 0), 0).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam iade fiş sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İptal Fiş Sayısı</CardTitle>
              <Hash className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketRevenue.reduce((sum, m) => sum + (m.totalCancelledOrders || 0), 0).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam iptal fiş sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Fiş</CardTitle>
              <Hash className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketRevenue.reduce((sum, m) => sum + (m.totalOrders || 0), 0).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Tüm depolardaki toplam fiş
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ort. Sipariş Tutarı</CardTitle>
              <Calculator className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{Math.round(
                  marketRevenue.reduce((sum, m) => sum + (m.totalOrders || 0), 0) > 0
                    ? marketRevenue.reduce((sum, m) => sum + m.totalRevenue, 0) / 
                      marketRevenue.reduce((sum, m) => sum + (m.totalOrders || 0), 0)
                    : 0
                ).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Genel ortalama sipariş tutarı
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
