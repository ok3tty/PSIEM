import { Shield, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { mockThreats, mockThreatTimeline, mockAttackTypes, mockSystemStatus, mockNetworkActivity } from '@/lib/mockData';
import { SeverityLevel } from '@/types';

const getSeverityColor = (severity: SeverityLevel) => {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-warning text-warning-foreground';
    case 'medium': return 'bg-info text-info-foreground';
    case 'low': return 'bg-success text-success-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Threats Detected"
          value="127"
          icon={AlertTriangle}
          trend="up"
          trendValue="+12% today"
          iconColor="text-destructive"
        />
        <MetricCard
          title="Active Systems"
          value="24"
          icon={Activity}
          trend="stable"
          trendValue="All operational"
          iconColor="text-success"
        />
        <MetricCard
          title="Security Score"
          value="87%"
          icon={Shield}
          trend="up"
          trendValue="+5% this week"
          iconColor="text-primary"
        />
        <MetricCard
          title="Critical Alerts"
          value="3"
          icon={AlertTriangle}
          trend="down"
          trendValue="-2 resolved"
          iconColor="text-destructive"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Timeline */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Threat Activity Timeline</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockThreatTimeline}>
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
                <Line type="monotone" dataKey="threats" stroke="hsl(var(--destructive))" strokeWidth={2} />
                <Line type="monotone" dataKey="blocked" stroke="hsl(var(--success))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attack Types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Attack Types</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockAttackTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {mockAttackTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Health percentage by system</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockSystemStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="system" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="status" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Network Activity</CardTitle>
            <CardDescription>Traffic in MB/s</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockNetworkActivity}>
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
                <Area type="monotone" dataKey="incoming" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.3)" />
                <Area type="monotone" dataKey="outgoing" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
          <CardDescription>Latest detected threats and incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Alert Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockThreats.map((threat) => (
                <TableRow key={threat.id}>
                  <TableCell className="text-muted-foreground">
                    {threat.timestamp.toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{threat.type}</TableCell>
                  <TableCell className="text-muted-foreground">{threat.source}</TableCell>
                  <TableCell>
                    <Badge variant={threat.status === 'resolved' ? 'outline' : 'default'}>
                      {threat.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm" variant="ghost">Dismiss</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
