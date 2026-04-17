import { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';

const ES_HOST = import.meta.env.VITE_ELASTICSEARCH_URL || '/elasticsearch';

async function fetchFromES(path: string, body: object) {
  const res = await fetch(`${ES_HOST}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ES error: ${res.status}`);
  return res.json();
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high':     return 'bg-warning text-warning-foreground';
    case 'medium':   return 'bg-info text-info-foreground';
    case 'low':      return 'bg-success text-success-foreground';
    default:         return 'bg-muted text-muted-foreground';
  }
}

function priorityToSeverity(p: number) {
  if (p === 1) return 'critical';
  if (p === 2) return 'high';
  if (p === 3) return 'medium';
  return 'low';
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalThreats, setTotalThreats] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [threatTimeline, setThreatTimeline] = useState<any[]>([]);
  const [attackTypes, setAttackTypes] = useState<any[]>([]);

  const COLORS = [
    'hsl(var(--destructive))',
    'hsl(var(--warning))',
    'hsl(var(--primary))',
    'hsl(var(--info))',
    'hsl(var(--success))',
    'hsl(var(--muted-foreground))',
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Total alerts
      const totalRes = await fetchFromES('/suricata-*/_count', {
        query: { exists: { field: 'alert.signature' } },
      });
      setTotalThreats(totalRes.count || 0);

      // Today's alerts
      const todayRes = await fetchFromES('/suricata-*/_count', {
        query: {
          bool: {
            must: [
              { exists: { field: 'alert.signature' } },
              { range: { '@timestamp': { gte: 'now/d', lte: 'now' } } },
            ],
          },
        },
      });
      setTodayCount(todayRes.count || 0);

      // Critical alerts (last 24h)
      const critRes = await fetchFromES('/suricata-*/_count', {
        query: {
          bool: {
            must: [
              { term: { 'alert.severity': 1 } },
              { range: { '@timestamp': { gte: 'now-24h' } } },
            ],
          },
        },
      });
      setCriticalCount(critRes.count || 0);

      // Recent alerts
      const alertsRes = await fetchFromES('/suricata-*/_search', {
        size: 10,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: { exists: { field: 'alert.signature' } },
        _source: ['@timestamp', 'alert.signature', 'alert.severity', 'alert.category', 'src_ip', 'proto'],
      });
      const hits = alertsRes.hits?.hits || [];
      setRecentAlerts(hits.map((h: any) => ({
        id: h._id,
        timestamp: new Date(h._source['@timestamp']),
        type: h._source.alert?.signature || 'Unknown',
        source: h._source.src_ip || 'N/A',
        severity: priorityToSeverity(h._source.alert?.severity || 3),
        category: h._source.alert?.category || 'Unknown',
        status: 'active',
      })));

      // Threat timeline — hourly buckets last 24h
      const timelineRes = await fetchFromES('/suricata-*/_search', {
        size: 0,
        query: { range: { '@timestamp': { gte: 'now-24h' } } },
        aggs: {
          by_hour: {
            date_histogram: {
              field: '@timestamp',
              calendar_interval: 'hour',
              format: 'HH:mm',
            },
          },
        },
      });
      const buckets = timelineRes.aggregations?.by_hour?.buckets || [];
      setThreatTimeline(buckets.map((b: any) => ({
        time: b.key_as_string,
        threats: b.doc_count,
      })));

      // Attack type distribution
      const catRes = await fetchFromES('/suricata-*/_search', {
        size: 0,
        query: { range: { '@timestamp': { gte: 'now-24h' } } },
        aggs: {
          categories: {
            terms: { field: 'alert.category.keyword', size: 6 },
          },
        },
      });
      const catBuckets = catRes.aggregations?.categories?.buckets || [];
      setAttackTypes(catBuckets.map((b: any, i: number) => ({
        name: b.key,
        value: b.doc_count,
        fill: COLORS[i % COLORS.length],
      })));
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Threats Detected"
          value={loading ? '...' : totalThreats.toLocaleString()}
          icon={AlertTriangle}
          trend="up"
          trendValue="All time"
          iconColor="text-destructive"
        />
        <MetricCard
          title="Alerts Today"
          value={loading ? '...' : todayCount.toLocaleString()}
          icon={Activity}
          trend="stable"
          trendValue="Since midnight"
          iconColor="text-success"
        />
        <MetricCard
          title="Critical (24h)"
          value={loading ? '...' : criticalCount.toLocaleString()}
          icon={Shield}
          trend="down"
          trendValue="Priority 1"
          iconColor="text-primary"
        />
        <MetricCard
          title="Active Indices"
          value={loading ? '...' : 'Live'}
          icon={AlertTriangle}
          trend="stable"
          trendValue="suricata-*"
          iconColor="text-destructive"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Timeline */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Threat Activity Timeline</CardTitle>
            <CardDescription>Alerts per hour — last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={threatTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="threats" stroke="hsl(var(--destructive))" strokeWidth={2} name="Alerts" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Attack Types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Alert Categories</CardTitle>
            <CardDescription>Distribution by Suricata category (last 24h)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : attackTypes.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attackTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {attackTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>Latest Suricata detections from Elasticsearch</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Fetching alerts...</span>
            </div>
          ) : recentAlerts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No recent alerts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {alert.timestamp.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{alert.type}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{alert.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{alert.category}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
