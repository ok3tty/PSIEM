import { Activity, Database, Server, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockSystemHealth, mockResourceUsage } from '@/lib/mockData';
import { SystemStatus } from '@/types';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const getStatusColor = (status: SystemStatus) => {
  switch (status) {
    case 'online': return 'bg-success text-success-foreground';
    case 'degraded': return 'bg-warning text-warning-foreground';
    case 'offline': return 'bg-destructive text-destructive-foreground';
    case 'pending': return 'bg-info text-info-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (serviceName: string) => {
  if (serviceName.toLowerCase().includes('dashboard')) return Server;
  if (serviceName.toLowerCase().includes('database')) return Database;
  if (serviceName.toLowerCase().includes('log')) return Activity;
  return Zap;
};

export default function SystemHealth() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor infrastructure and service status</p>
      </div>

      {/* Monitoring Integration Notice */}
      <Card className="glass-card border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              📈 <span className="text-primary font-semibold">Monitoring Integration:</span> Prometheus + Grafana - Advanced metrics and alerting (placeholder)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockSystemHealth.map((service) => {
          const Icon = getStatusIcon(service.serviceName);
          return (
            <Card key={service.serviceName} className="glass-card hover:glow-purple-sm transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">{service.serviceName}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {service.responseTime && (
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">{service.responseTime}ms</span>
                    </div>
                  )}
                  {service.uptime && (
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{service.uptime}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Last Check:</span>
                    <span className="font-mono">{service.lastCheck.toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resource Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockResourceUsage.cpu}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="usage" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockResourceUsage.memory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area type="monotone" dataKey="usage" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network I/O */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Network I/O</CardTitle>
            <CardDescription>Incoming and outgoing traffic (MB/s)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockResourceUsage.network}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="in" stroke="hsl(var(--success))" strokeWidth={2} name="Incoming" />
                <Line type="monotone" dataKey="out" stroke="hsl(var(--warning))" strokeWidth={2} name="Outgoing" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
