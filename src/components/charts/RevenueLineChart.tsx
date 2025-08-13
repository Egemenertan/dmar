"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartSkeleton } from './ChartSkeleton';

interface DailyTrendData {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueLineChartProps {
  data: DailyTrendData[];
  loading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length && label) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{`Tarih: ${label}`}</p>
        <p className="text-sm text-blue-600">
          {`Ciro: ₺${payload[0].value.toLocaleString('tr-TR')}`}
        </p>
        <p className="text-sm text-green-600">
          {`Sipariş: ${payload[1].value}`}
        </p>
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
    <div className="h-80">
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
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
