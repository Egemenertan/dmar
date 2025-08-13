"use client";

import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  type?: 'line' | 'pie' | 'bar';
}

export function ChartSkeleton({ type = 'line' }: ChartSkeletonProps) {
  if (type === 'pie') {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          {/* Pie Chart Circle */}
          <div className="flex justify-center">
            <div className="relative">
              <Skeleton className="w-48 h-48 rounded-full" />
              <div className="absolute inset-4">
                <Skeleton className="w-40 h-40 rounded-full bg-white" />
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="h-80 p-6">
        <div className="h-full flex items-end justify-between space-x-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-2 flex-1">
              <Skeleton 
                className="w-full rounded-t-md" 
                style={{ height: `${Math.random() * 150 + 50}px` }}
              />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-2 top-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    );
  }

  // Line chart skeleton (default)
  return (
    <div className="h-80 p-6 relative">
      {/* Chart area */}
      <div className="h-full relative">
        {/* Grid lines */}
        <div className="absolute inset-0 space-y-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-px w-full" />
          ))}
        </div>
        
        {/* Line path */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 relative">
            <Skeleton className="absolute inset-0 rounded-full transform -rotate-12" />
          </div>
        </div>
        
        {/* Data points */}
        <div className="absolute inset-0 flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton 
              key={i} 
              className="w-2 h-2 rounded-full" 
              style={{ 
                marginTop: `${Math.random() * 100 - 50}px` 
              }}
            />
          ))}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-6 space-y-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}
