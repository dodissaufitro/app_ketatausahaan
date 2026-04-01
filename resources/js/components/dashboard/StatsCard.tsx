import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

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
    gradient: 'from-gray-500/20 to-gray-700/20',
  },
  primary: {
    card: 'gradient-primary text-primary-foreground',
    icon: 'bg-primary-foreground/20 text-primary-foreground',
    gradient: 'from-blue-500/30 to-purple-600/30',
  },
  success: {
    card: 'bg-card',
    icon: 'bg-success/10 text-success',
    gradient: 'from-green-500/20 to-emerald-600/20',
  },
  warning: {
    card: 'bg-card',
    icon: 'bg-warning/10 text-warning',
    gradient: 'from-yellow-500/20 to-orange-600/20',
  },
  info: {
    card: 'bg-card',
    icon: 'bg-info/10 text-info',
    gradient: 'from-cyan-500/20 to-blue-600/20',
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        'relative rounded-xl p-6 shadow-2xl transition-all duration-500 animate-scale-in overflow-hidden',
        'transform-gpu perspective-1000',
        styles.card,
        className
      )}
      style={{
        transform: isHovered
          ? `rotateY(${mousePosition.x * 8}deg) rotateX(${-mousePosition.y * 8}deg) scale(1.05) translateZ(20px)`
          : 'rotateY(0deg) rotateX(0deg) scale(1) translateZ(0px)',
        boxShadow: isHovered
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 40px rgba(59, 130, 246, 0.3)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Gradient Overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-br pointer-events-none',
          styles.gradient
        )}
        style={{
          opacity: isHovered ? 0.6 : 0,
        }}
      />

      {/* Shine Effect */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${(mousePosition.x + 1) * 50}% ${(mousePosition.y + 1) * 50}%, rgba(255, 255, 255, 0.2), transparent 50%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Content */}
      <div className="relative" style={{ transform: 'translateZ(30px)' }}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn(
              'text-sm font-medium',
              variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <p className="text-3xl font-bold transition-transform duration-300"
               style={{ transform: isHovered ? 'translateZ(15px) scale(1.05)' : 'translateZ(0px)' }}>
              {value}
            </p>
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
          <div 
            className={cn('p-3 rounded-xl transition-transform duration-300', styles.icon)}
            style={{ 
              transform: isHovered ? 'translateZ(40px) rotateY(15deg) scale(1.1)' : 'translateZ(0px)',
            }}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Bottom 3D Border Effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-500"
        style={{ opacity: isHovered ? 1 : 0 }}
      />
    </div>
  );
}
