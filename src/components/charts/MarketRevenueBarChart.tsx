"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartSkeleton } from './ChartSkeleton';

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
}

interface MarketRevenueBarChartProps {
  data: MarketRevenue[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {label.replace('DEPO', '').trim()}
        </p>
        <p className="text-sm text-blue-600">
          {`₺${payload[0].value.toLocaleString('tr-TR')}`}
        </p>
      </div>
    );
  }
  return null;
};

export default function MarketRevenueBarChart({ data, loading }: MarketRevenueBarChartProps) {
  if (loading) {
    return <ChartSkeleton type="bar" />;
  }

  if (!data || data.length === 0 || data.every(item => item.totalRevenue === 0)) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="Karşılaştırma Verisi Yok"
        description="Market performansları karşılaştırılacak veri bulunamadı."
        suggestions={[
          "En az bir marketin satış yaptığından emin olun",
          "Veri toplama sürecini kontrol edin",
          "Tarih aralığını genişletin"
        ]}
      />
    );
  }

  // Sort data by revenue in descending order
  const sortedData = [...data]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map(item => ({
      ...item,
      displayName: item.marketName.replace('DEPO', '').trim()
    }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={sortedData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="displayName"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="totalRevenue" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          >
            {sortedData.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={`hsl(${210 + index * 30}, 70%, ${60 - index * 5}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
