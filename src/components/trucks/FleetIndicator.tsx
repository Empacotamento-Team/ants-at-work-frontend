import { cn } from '@/lib/utils';
import { JSX } from 'react'

interface FleetIndicatorProps {
    cardTitle: string;
    icon: JSX.ElementType;
    indicatorValue: string | number;
    subtitle?: string;
    specialColor?: string;
    active?: boolean;
    onClick?: () => void;
}

export default function FleetIndicator({ 
    cardTitle,
    indicatorValue,
    icon: Icon,
    specialColor,
    subtitle,
    active,
    onClick,
}: FleetIndicatorProps) {
  return (
    <div className={cn(
        "bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm", 
        onClick && "cursor-pointer hover:shadow-md transition",
    )} style={{outline: active ? `2px solid ${specialColor}` : undefined}} onClick={onClick}>
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{cardTitle}</h3>
            <Icon className="h-4 w-4" style={{color: specialColor ?? "var(--color-gray-400"}} />
        </div>
        <div className={cn("text-2xl font-bold", !specialColor && "text-gray-900 dark:text-white")}
            style={{color: specialColor}}>{indicatorValue}</div>
        <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}
