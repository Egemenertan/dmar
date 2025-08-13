"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Store } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartSkeleton } from './ChartSkeleton';

interface MarketRevenue {
  marketName: string;
  totalRevenue: number;
}

interface MarketRevenuePieChartProps {
  data: MarketRevenue[];
  loading?: boolean;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280', // Gray
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      marketName: string;
      totalRevenue: number;
      total: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {data.marketName.replace('DEPO', '').trim()}
        </p>
        <p className="text-sm text-blue-600">
          {`₺${data.totalRevenue.toLocaleString('tr-TR')}`}
        </p>
        <p className="text-xs text-gray-500">
          {`${((data.totalRevenue / data.total) * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) => {
  if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) return null;
  if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function MarketRevenuePieChart({ data, loading }: MarketRevenuePieChartProps) {
  if (loading) {
    return <ChartSkeleton type="pie" />;
  }

  if (!data || data.length === 0 || data.every(item => item.totalRevenue === 0)) {
    return (
      <EmptyState
        icon={<Store />}
        title="Market Verisi Bulunamadı"
        description="Seçilen dönemde market satış verisi bulunmuyor."
        suggestions={[
          "Tüm marketlerin aktif olduğundan emin olun",
          "Daha geniş bir tarih aralığı seçin",
          "Market verilerinin güncel olduğunu kontrol edin"
        ]}
      />
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  const chartData = data.map(item => ({
    ...item,
    total: totalRevenue,
    displayName: item.marketName.replace('DEPO', '').trim()
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="totalRevenue"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => {
              const entryTyped = entry as { color?: string; payload?: { displayName?: string } };
              const displayName = entryTyped?.payload?.displayName || value;
              return (
                <span style={{ color: entryTyped?.color || '#000', fontSize: '12px' }}>
                  {displayName}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
