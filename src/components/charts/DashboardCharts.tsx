"use client";

// Removed unused imports useState and useEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, PieChart, BarChart3, Calendar, Calculator, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import RevenueLineChart from './RevenueLineChart';
import MarketRevenuePieChart from './MarketRevenuePieChart';
import MarketRevenueBarChart from './MarketRevenueBarChart';

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
  totalOrders?: number;
  averageOrderAmount?: number;
}

interface DailyTrendData {
  date: string;
  revenue: number;
  orders: number;
}

interface DashboardChartsProps {
  marketRevenue: MarketRevenue[];
  date: DateRange | undefined;
  loading: boolean;
  dailyTrend: DailyTrendData[];
}

export default function DashboardCharts({ marketRevenue, date, loading, dailyTrend }: DashboardChartsProps) {
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
                Günlük Ciro ve Sipariş Trendi
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Seçilen tarih aralığındaki günlük performans analizi
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Market</CardTitle>
              <PieChart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketRevenue.filter(m => m.totalRevenue > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Satış yapan market sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
              <Hash className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketRevenue.reduce((sum, m) => sum + (m.totalOrders || 0), 0).toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Tüm depolardaki toplam sipariş
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analiz Dönemi</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {date?.from && date?.to 
                  ? `${format(date.from, 'dd/MM')} - ${format(date.to, 'dd/MM')}`
                  : 'Seçili değil'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Seçilen tarih aralığı
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
