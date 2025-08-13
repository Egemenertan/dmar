"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
}

export function EmptyState({ icon, title, description, action, suggestions }: EmptyStateProps) {
  return (
    <div className="h-80 flex flex-col items-center justify-center text-center p-6 space-y-4">
      {/* Icon */}
      {icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <div className="text-gray-400 text-2xl">
            {icon}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Öneriler:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick} variant="outline" className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
