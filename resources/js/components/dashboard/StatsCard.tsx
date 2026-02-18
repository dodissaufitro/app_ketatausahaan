import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-card',
    icon: 'bg-muted text-muted-foreground',
  },
  primary: {
    card: 'gradient-primary text-primary-foreground',
    icon: 'bg-primary-foreground/20 text-primary-foreground',
  },
  success: {
    card: 'bg-card',
    icon: 'bg-success/10 text-success',
  },
  warning: {
    card: 'bg-card',
    icon: 'bg-warning/10 text-warning',
  },
  info: {
    card: 'bg-card',
    icon: 'bg-info/10 text-info',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg animate-scale-in',
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-sm',
              variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className={cn(
                'text-xs',
                variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'
              )}>
                dari bulan lalu
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
