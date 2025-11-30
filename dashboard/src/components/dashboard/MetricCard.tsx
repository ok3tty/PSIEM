import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  iconColor?: string;
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  iconColor = 'text-primary'
}: MetricCardProps) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-destructive' : trend === 'down' ? 'text-success' : 'text-muted-foreground';

  return (
    <Card className="glass-card transition-smooth hover:glow-purple-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-primary/10 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
