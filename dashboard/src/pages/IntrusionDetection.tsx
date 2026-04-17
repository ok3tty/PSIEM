import { useState, useEffect } from 'react';
import { Shield, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ES_HOST = import.meta.env.VITE_ELASTICSEARCH_URL || '/elasticsearch';

interface SuricataAlert {
  id: string;
  timestamp: string;
  signatureName: string;
  sourceIp: string;
  destinationIp?: string;
  severity: string;
  matchedRule: string;
  category: string;
  proto: string;
}

interface HourlyScore {
  time: string;
  score: number;
  count: number;
}

function getSeverityFromPriority(priority: number): string {
  if (priority === 1) return 'critical';
  if (priority === 2) return 'high';
  if (priority === 3) return 'medium';
  return 'low';
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-warning text-warning-foreground';
    case 'medium': return 'bg-info text-info-foreground';
    case 'low': return 'bg-success text-success-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

async function fetchFromES(path: string, body: object) {
  const res = await fetch(`${ES_HOST}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ES error: ${res.status}`);
  return res.json();
}

export default function IntrusionDetection() {
  const [alerts, setAlerts] = useState<SuricataAlert[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [todayAlerts, setTodayAlerts] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [hourlyData, setHourlyData] = useState<HourlyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch recent alerts
      const alertsRes = await fetchFromES('/suricata-*/_search', {
        size: 50,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: {
          bool: {
            must: [{ exists: { field: 'alert.signature' } }]
          }
        },
        _source: ['@timestamp', 'alert.signature', 'alert.severity', 'alert.category', 'alert.rev', 'src_ip', 'dest_ip', 'proto']
      });

      const hits = alertsRes.hits?.hits || [];
      const mapped: SuricataAlert[] = hits.map((h: any) => ({
        id: h._id,
        timestamp: h._source['@timestamp'],
        signatureName: h._source.alert?.signature || 'Unknown',
        sourceIp: h._source.src_ip || 'N/A',
        destinationIp: h._source.dest_ip,
        severity: getSeverityFromPriority(h._source.alert?.severity || 3),
        matchedRule: h._source.alert?.signature || 'N/A',
        category: h._source.alert?.category || 'Unknown',
        proto: h._source.proto || '',
      }));
      setAlerts(mapped);
      setTotalAlerts(alertsRes.hits?.total?.value || 0);

      // Today's alert count
      const todayRes = await fetchFromES('/suricata-*/_count', {
        query: {
          bool: {
            must: [
              { exists: { field: 'alert.signature' } },
              { range: { '@timestamp': { gte: 'now/d', lte: 'now' } } }
            ]
          }
        }
      });
      setTodayAlerts(todayRes.count || 0);

      // Critical alerts count
      const criticalRes = await fetchFromES('/suricata-*/_count', {
        query: {
          bool: {
            must: [
              { term: { 'alert.severity': 1 } },
              { range: { '@timestamp': { gte: 'now-24h' } } }
            ]
          }
        }
      });
      setCriticalCount(criticalRes.count || 0);

      // Hourly alert distribution for anomaly timeline
      const hourlyRes = await fetchFromES('/suricata-*/_search', {
        size: 0,
        query: { range: { '@timestamp': { gte: 'now-24h' } } },
        aggs: {
          by_hour: {
            date_histogram: {
              field: '@timestamp',
              calendar_interval: 'hour',
              format: 'HH:mm'
            }
          }
        }
      });

      const buckets = hourlyRes.aggregations?.by_hour?.buckets || [];
      const maxCount = Math.max(...buckets.map((b: any) => b.doc_count), 1);
      const hourly: HourlyScore[] = buckets.map((b: any) => ({
        time: b.key_as_string,
        count: b.doc_count,
        score: Math.round((b.doc_count / maxCount) * 100),
      }));
      setHourlyData(hourly);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data from Elasticsearch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intrusion Detection System</h1>
          <p className="text-muted-foreground mt-1">Real-time threat detection and analysis</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <Card className="glass-card border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="signature" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="signature">Signature-Based</TabsTrigger>
          <TabsTrigger value="anomaly">Anomaly-Based</TabsTrigger>
        </TabsList>

        {/* Signature-Based Detection */}
        <TabsContent value="signature" className="space-y-6">
          <Card className="glass-card border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-semibold">Using Suricata signatures</span> — Live data from Elasticsearch
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Alerts</p>
                    <p className="text-3xl font-bold mt-2">
                      {loading ? '...' : totalAlerts.toLocaleString()}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alerts Today</p>
                    <p className="text-3xl font-bold mt-2">
                      {loading ? '...' : todayAlerts.toLocaleString()}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical (24h)</p>
                    <p className="text-3xl font-bold mt-2">
                      {loading ? '...' : criticalCount.toLocaleString()}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Feed */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Real-Time Alert Feed</CardTitle>
              <CardDescription>
                {loading ? 'Loading alerts...' : `${alerts.length} most recent Suricata alerts`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
                  <span className="text-muted-foreground">Fetching alerts from Elasticsearch...</span>
                </div>
              ) : alerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No alerts found in Elasticsearch.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold">{alert.signatureName}</h4>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {alert.category && (
                              <Badge variant="outline" className="text-xs">
                                {alert.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-3">
                        <div>
                          <span className="text-muted-foreground">Source IP:</span>
                          <p className="font-mono">{alert.sourceIp}</p>
                        </div>
                        {alert.destinationIp && (
                          <div>
                            <span className="text-muted-foreground">Destination IP:</span>
                            <p className="font-mono">{alert.destinationIp}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Protocol:</span>
                          <p className="font-mono uppercase">{alert.proto}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly-Based Detection */}
        <TabsContent value="anomaly" className="space-y-6">
          <Card className="glass-card border-info/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-info/10">
                  <Database className="w-6 h-6 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">📊 Alert Volume Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Hourly Suricata alert volume over the past 24 hours. Spikes may indicate active attacks or scanning activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Alert Volume Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Alert Volume Timeline</CardTitle>
              <CardDescription>Suricata alerts per hour — last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
                  <span className="text-muted-foreground">Loading chart data...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any, name: string) => [value, name === 'count' ? 'Alerts' : name]}
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Alert Categories */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top Alert Categories</CardTitle>
              <CardDescription>Most frequent Suricata alert categories from recent data</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground text-sm">Loading...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    alerts.reduce((acc: Record<string, number>, a) => {
                      acc[a.category] = (acc[a.category] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min((count / alerts.length) * 100 * 3, 100)}%` }}
                            />
                          </div>
                          <Badge variant="outline" className="text-xs min-w-[2rem] text-center">{count}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
