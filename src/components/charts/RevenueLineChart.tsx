"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartSkeleton } from './ChartSkeleton';

interface DailyTrendData {
  date: string;
  revenue: number;
  orders: number;
  returns: number;
  returnOrders: number;
  cancelledOrders: number;
  cancelledAmount: number;
}

interface RevenueLineChartProps {
  data: DailyTrendData[];
  loading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length && label) {
    const revenueData = payload.find(p => p.dataKey === 'revenue');
    const ordersData = payload.find(p => p.dataKey === 'orders');
    const returnsData = payload.find(p => p.dataKey === 'returns');
    const returnOrdersData = payload.find(p => p.dataKey === 'returnOrders');
    const cancelledOrdersData = payload.find(p => p.dataKey === 'cancelledOrders');
    const cancelledAmountData = payload.find(p => p.dataKey === 'cancelledAmount');

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-1">
        <p className="text-sm font-medium text-gray-900">{`Tarih: ${label}`}</p>
        {revenueData && (
          <p className="text-sm text-blue-600">
            {`Ciro: ₺${revenueData.value.toLocaleString('tr-TR')}`}
          </p>
        )}
        {ordersData && (
          <p className="text-sm text-green-600">
            {`Sipariş: ${ordersData.value}`}
          </p>
        )}
        {returnsData && (
          <p className="text-sm text-red-600">
            {`İade: ₺${returnsData.value.toLocaleString('tr-TR')}`}
          </p>
        )}
        {returnOrdersData && (
          <p className="text-sm text-orange-600">
            {`İade Fiş: ${returnOrdersData.value}`}
          </p>
        )}
        {cancelledAmountData && (
          <p className="text-sm text-gray-600">
            {`İptal: ₺${cancelledAmountData.value.toLocaleString('tr-TR')}`}
          </p>
        )}
        {cancelledOrdersData && (
          <p className="text-sm text-slate-600">
            {`İptal Fiş: ${cancelledOrdersData.value}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function RevenueLineChart({ data, loading }: RevenueLineChartProps) {
  if (loading) {
    return <ChartSkeleton type="line" />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp />}
        title="Trend Verisi Bulunamadı"
        description="Seçilen tarih aralığında henüz satış verisi bulunmuyor."
        suggestions={[
          "Farklı bir tarih aralığı seçmeyi deneyin",
          "Son 7 gün veya bugün filtrelerini kullanın",
          "Veri girişi yapıldığından emin olun"
        ]}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="revenue"
              orientation="left"
              stroke="#3b82f6"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="orders"
              orientation="right"
              stroke="#10b981"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Ana Ciro Çizgisi */}
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            
            {/* Sipariş Sayısı Çizgisi */}
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
            />
            
            {/* İade Tutarı Çizgisi */}
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="returns"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
            />
            
            {/* İptal Tutarı Çizgisi */}
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="cancelledAmount"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ fill: '#6b7280', strokeWidth: 2, r: 2 }}
              activeDot={{ r: 4, stroke: '#6b7280', strokeWidth: 2 }}
            />
            
            {/* İade Fiş Sayısı Çizgisi */}
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="returnOrders"
              stroke="#f97316"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={{ fill: '#f97316', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: '#f97316', strokeWidth: 2 }}
            />
            
            {/* İptal Fiş Sayısı Çizgisi */}
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="cancelledOrders"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={{ fill: '#64748b', strokeWidth: 1, r: 2 }}
              activeDot={{ r: 4, stroke: '#64748b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span>Ciro</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span>Sipariş</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500"></div>
          <span>İade Tutarı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-500 border-dashed border-t-2 border-gray-500"></div>
          <span>İptal Tutarı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-orange-500 border-dashed border-t-2 border-orange-500"></div>
          <span>İade Fiş</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-500 border-dashed border-t-2 border-slate-500"></div>
          <span>İptal Fiş</span>
        </div>
      </div>
    </div>
  );
}
