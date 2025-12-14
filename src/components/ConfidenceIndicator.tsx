import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceIndicator({
  score,
  showLabel = true,
  size = 'md',
}: ConfidenceIndicatorProps) {
  const getConfig = () => {
    if (score >= 80) {
      return {
        label: 'High Confidence',
        className: 'confidence-high',
        Icon: CheckCircle,
        barColor: 'bg-green-500',
      };
    }
    if (score >= 50) {
      return {
        label: 'Medium Confidence',
        className: 'confidence-medium',
        Icon: AlertTriangle,
        barColor: 'bg-yellow-500',
      };
    }
    return {
      label: 'Low Confidence - Needs Review',
      className: 'confidence-low',
      Icon: AlertCircle,
      barColor: 'bg-red-500',
    };
  };

  const config = getConfig();
  const { Icon } = config;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn('rounded-lg px-3 py-2', config.className)}>
      <div className="flex items-center gap-2">
        <Icon className={iconSizes[size]} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={cn('font-medium', sizeClasses[size])}>
              AI Confidence: {score}%
            </span>
          </div>
          {showLabel && (
            <p className={cn('mt-0.5', sizeClasses[size])}>{config.label}</p>
          )}
        </div>
      </div>
      <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', config.barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
