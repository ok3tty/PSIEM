import { Shield, AlertCircle, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { elasticsearchService, IDSAlert } from '@/services/elasticsearchService';

const getSeverityColor = (severity: number | undefined) => {
  if (!severity) return 'bg-muted text-muted-foreground';
  if (severity === 1) return 'bg-destructive text-destructive-foreground';
  if (severity === 2) return 'bg-warning text-warning-foreground';
  if (severity === 3) return 'bg-info text-info-foreground';
  return 'bg-success text-success-foreground';
};

const getSeverityLabel = (severity: number | undefined) => {
  if (!severity) return 'unknown';
  if (severity === 1) return 'critical';
  if (severity === 2) return 'high';
  if (severity === 3) return 'medium';
  return 'low';
};

export default function IntrusionDetection() {
  const [alerts, setAlerts] = useState<IDSAlert[]>([]);
  const [stats, setStats] = useState({ total: 0, bySeverity: {}, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [alertsData, statsData] = await Promise.all([
          elasticsearchService.getRecentAlerts(50),
          elasticsearchService.getAlertStats()
        ]);
        setAlerts(alertsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching IDS data:', err);
        setError('Failed to load IDS data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = (stats.bySeverity as any)[1] || 0;
  const highCount = (stats.bySeverity as any)[2] || 0;
  const totalBlocked = criticalCount + highCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Intrusion Detection System</h1>
        <p className="text-muted-foreground mt-1">Real-time threat detection powered by Suricata</p>
      </div>

      {error && (
        <Card className="glass-card border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
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
          {/* Suricata Notice */}
          <Card className="glass-card border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-semibold">Live Suricata IDS</span> - Real-time signature-based threat detection
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Alerts</p>
                    <p className="text-3xl font-bold mt-2">
                      {loading ? '...' : stats.total.toLocaleString()}
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
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-3xl font-bold mt-2">
                      {loading ? '...' : totalBlocked.toLocaleString()}
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
                    <p className="text-sm text-muted-foreground">Recent Alerts</p>
                    <p className="text-3xl font-bold mt-2">{alerts.length}</p>
                  </div>
                  <Database className="w-8 h-8 text-info" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Feed */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Real-Time Alert Feed</CardTitle>
              <CardDescription>
                {loading ? 'Loading alerts...' : `Showing ${alerts.length} most recent alerts`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading IDS alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts detected
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {alerts.map((alert, index) => (
                    <div key={index} className="p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-smooth">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold">
                              {alert.alert?.signature || alert.event_type || 'Unknown Event'}
                            </h4>
                            <Badge className={getSeverityColor(alert.alert?.severity)}>
                              {getSeverityLabel(alert.alert?.severity)}
                            </Badge>
                            {alert.alert?.category && (
                              <Badge variant="outline">
                                {alert.alert.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-3">
                        {alert.src_ip && (
                          <div>
                            <span className="text-muted-foreground">Source IP:</span>
                            <p className="font-mono">{alert.src_ip}</p>
                          </div>
                        )}
                        {alert.dest_ip && (
                          <div>
                            <span className="text-muted-foreground">Destination IP:</span>
                            <p className="font-mono">{alert.dest_ip}</p>
                          </div>
                        )}
                        {alert.proto && (
                          <div>
                            <span className="text-muted-foreground">Protocol:</span>
                            <p className="font-mono">{alert.proto}</p>
                          </div>
                        )}
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
                  <h3 className="font-semibold text-lg mb-2">🤖 ML Model Integration: Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced anomaly detection using machine learning to identify unusual patterns and behaviors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
