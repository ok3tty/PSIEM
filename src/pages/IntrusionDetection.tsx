import { Shield, AlertCircle, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockIntrusionAlerts, mockAnomalies } from '@/lib/mockData';
import { SeverityLevel } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getSeverityColor = (severity: SeverityLevel) => {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-warning text-warning-foreground';
    case 'medium': return 'bg-info text-info-foreground';
    case 'low': return 'bg-success text-success-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const mockAnomalyScores = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  score: Math.random() * 100
}));

export default function IntrusionDetection() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Intrusion Detection System</h1>
        <p className="text-muted-foreground mt-1">Real-time threat detection and analysis</p>
      </div>

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
                  <span className="text-primary font-semibold">Using Suricata signatures</span> - Industry-standard rule-based detection (placeholder integration)
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
                    <p className="text-sm text-muted-foreground">Detection Rate</p>
                    <p className="text-3xl font-bold mt-2">94.7%</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blocked Today</p>
                    <p className="text-3xl font-bold mt-2">87</p>
                  </div>
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Rules</p>
                    <p className="text-3xl font-bold mt-2">2,847</p>
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
              <CardDescription>Signature-matched intrusion attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {mockIntrusionAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-lg bg-background/50 border border-border hover:border-primary/50 transition-smooth">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.signatureName}</h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {alert.blocked && (
                            <Badge variant="outline" className="bg-success/10 text-success">
                              Blocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
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
                        <span className="text-muted-foreground">Matched Rule:</span>
                        <p className="font-mono text-xs">{alert.matchedRule}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly-Based Detection */}
        <TabsContent value="anomaly" className="space-y-6">
          {/* ML Model Notice */}
          <Card className="glass-card border-info/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-info/10">
                  <Database className="w-6 h-6 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">🤖 ML Model Integration: Isolation Forest Algorithm</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced anomaly detection using machine learning to identify unusual patterns and behaviors. 
                    Model training is in progress with historical data analysis.
                  </p>
                  <div className="mt-4 p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-warning font-semibold">Status:</span> Model training in progress... 67% complete
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly Score Graph */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Anomaly Score Timeline</CardTitle>
              <CardDescription>Real-time anomaly detection confidence scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockAnomalyScores}>
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
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detected Anomalies */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
              <CardDescription>Behavioral patterns identified by ML model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnomalies.map((anomaly) => (
                  <div key={anomaly.id} className="p-4 rounded-lg bg-background/50 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{anomaly.anomalyType}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {anomaly.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {(anomaly.confidenceScore * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                      </div>
                    </div>
                    <p className="text-sm mt-2">{anomaly.description}</p>
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground">Affected System:</span>
                      <Badge variant="outline" className="ml-2">{anomaly.affectedSystem}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}