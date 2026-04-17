import { useState, useEffect } from 'react';
import { Activity, Database, Server, Zap, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PROM_HOST = '/prometheus';

const GRAFANA_NODE_EXPORTER_URL =
  'https://myaegis.org/grafana/d/rYdddlPWk/node-exporter-full?orgId=1&from=now-24h&to=now&timezone=browser&var-ds_prometheus=PBFA97CFB590B2093&var-job=node-exporter&refresh=1m&kiosk';
const GRAFANA_CADVISOR_URL =
  'https://myaegis.org/grafana/d/pMEd7m0Mz/cadvisor-exporter?orgId=1&from=now-6h&to=now&timezone=browser&var-host=$__all&var-container=$__all&var-DS_PROMETHEUS=PBFA97CFB590B2093&kiosk';

async function queryProm(query: string) {
  const res = await fetch(`${PROM_HOST}/api/v1/query?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Prometheus error: ${res.status}`);
  const data = await res.json();
  return data?.data?.result || [];
}

async function queryPromRange(query: string, start: string, end: string, step: string) {
  const url = `${PROM_HOST}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Prometheus range error: ${res.status}`);
  const data = await res.json();
  return data?.data?.result || [];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'online':   return 'bg-success text-success-foreground';
    case 'degraded': return 'bg-warning text-warning-foreground';
    case 'offline':  return 'bg-destructive text-destructive-foreground';
    case 'pending':  return 'bg-info text-info-foreground';
    default:         return 'bg-muted text-muted-foreground';
  }
}

function getStatusIcon(name: string) {
  if (name.toLowerCase().includes('dashboard') || name.toLowerCase().includes('nginx')) return Server;
  if (name.toLowerCase().includes('elastic') || name.toLowerCase().includes('database')) return Database;
  if (name.toLowerCase().includes('log') || name.toLowerCase().includes('beat')) return Activity;
  return Zap;
}

const SERVICES = [
  { name: 'Nginx',          job: 'nginx',          container: 'psiem_nginx' },
  { name: 'Elasticsearch',  job: 'elasticsearch',   container: 'psiem_elasticsearch' },
  { name: 'Logstash',       job: 'logstash',        container: 'psiem_logstash' },
  { name: 'Kibana',         job: 'kibana',          container: 'psiem_kibana' },
  { name: 'AI Assistant',   job: 'ai-assistant',    container: 'psiem_ai_assistant' },
  { name: 'IDS (Suricata)', job: 'ids',             container: 'psiem_ids' },
  { name: 'Prometheus',     job: 'prometheus',      container: 'psiem_prometheus' },
  { name: 'Grafana',        job: 'grafana',         container: 'psiem_grafana' },
];

export default function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [serviceStatuses, setServiceStatuses] = useState<any[]>([]);
  const [cpuData, setCpuData] = useState<any[]>([]);
  const [memData, setMemData] = useState<any[]>([]);
  const [netData, setNetData] = useState<any[]>([]);
  const [promError, setPromError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - 86400; // 24h ago
      const step = '3600'; // 1h buckets

      // Container up/down status via cAdvisor
      const upResult = await queryProm('container_last_seen{name!=""}');
      const upMap: Record<string, number> = {};
      for (const r of upResult) {
        upMap[r.metric.name] = parseFloat(r.value[1]);
      }

      const statuses = SERVICES.map((svc) => {
        const lastSeen = upMap[svc.container];
        const nowTs = Date.now() / 1000;
        const status = lastSeen && (nowTs - lastSeen) < 120 ? 'online' : 'pending';
        return { ...svc, status, lastCheck: new Date() };
      });
      setServiceStatuses(statuses);

      // CPU usage over 24h
      const cpuResult = await queryPromRange(
        '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
        String(start), String(now), step
      );
      if (cpuResult[0]?.values) {
        setCpuData(cpuResult[0].values.map(([ts, val]: [number, string]) => ({
          time: new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          usage: parseFloat(parseFloat(val).toFixed(1)),
        })));
      }

      // Memory usage over 24h
      const memResult = await queryPromRange(
        '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',
        String(start), String(now), step
      );
      if (memResult[0]?.values) {
        setMemData(memResult[0].values.map(([ts, val]: [number, string]) => ({
          time: new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          usage: parseFloat(parseFloat(val).toFixed(1)),
        })));
      }

      // Network I/O
      const netInResult = await queryPromRange(
        'rate(node_network_receive_bytes_total{device="eth0"}[5m]) / 1024 / 1024',
        String(start), String(now), step
      );
      const netOutResult = await queryPromRange(
        'rate(node_network_transmit_bytes_total{device="eth0"}[5m]) / 1024 / 1024',
        String(start), String(now), step
      );
      if (netInResult[0]?.values) {
        const inMap: Record<string, number> = {};
        for (const [ts, val] of netInResult[0].values) {
          inMap[ts] = parseFloat(parseFloat(val).toFixed(3));
        }
        const outMap: Record<string, number> = {};
        if (netOutResult[0]?.values) {
          for (const [ts, val] of netOutResult[0].values) {
            outMap[ts] = parseFloat(parseFloat(val).toFixed(3));
          }
        }
        setNetData(Object.keys(inMap).map((ts) => ({
          time: new Date(parseInt(ts) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          in: inMap[ts],
          out: outMap[ts] || 0,
        })));
      }

      setPromError(false);
    } catch (e) {
      console.error('Prometheus fetch error:', e);
      setPromError(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground mt-1">Monitor infrastructure and service status</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Monitoring Integration Notice */}
      <Card className="glass-card border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                📈 <span className="text-primary font-semibold">Live Monitoring:</span> Prometheus + Grafana — real-time metrics
                {promError && <span className="text-destructive ml-2">⚠️ Prometheus unreachable — check /prometheus proxy</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <a href="https://myaegis.org/grafana" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors">
                Open Grafana →
              </a>
              <a href="https://myaegis.org/prometheus" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors">
                Open Prometheus →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading && serviceStatuses.length === 0 ? SERVICES.map(s => ({ ...s, status: 'pending', lastCheck: new Date() })) : serviceStatuses).map((service) => {
          const Icon = getStatusIcon(service.name);
          return (
            <Card key={service.name} className="glass-card hover:glow-purple-sm transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {loading ? '...' : service.status}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">{service.name}</h3>
                <div className="text-sm text-muted-foreground">
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
        {/* CPU */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Last 24 hours — from Prometheus node_exporter</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : cpuData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data from Prometheus</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v) => [`${v}%`, 'CPU']} />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Memory */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>Last 24 hours — from Prometheus node_exporter</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : memData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data from Prometheus</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={memData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v) => [`${v}%`, 'Memory']} />
                  <Area type="monotone" dataKey="usage" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.3)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Network I/O */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Network I/O</CardTitle>
            <CardDescription>Incoming and outgoing traffic in MB/s — eth0</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : netData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data from Prometheus</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={netData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" unit=" MB/s" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="in" stroke="hsl(var(--success))" strokeWidth={2} name="Incoming" dot={false} />
                  <Line type="monotone" dataKey="out" stroke="hsl(var(--warning))" strokeWidth={2} name="Outgoing" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafana Embedded Dashboards */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Live Grafana Dashboards</h2>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Node Exporter — VM Metrics</CardTitle>
            <CardDescription>Real-time CPU, memory, disk and network from Prometheus</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <iframe src={GRAFANA_NODE_EXPORTER_URL} width="100%" height="600" frameBorder="0" title="Node Exporter Dashboard" className="rounded-b-lg" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Container Metrics — cAdvisor</CardTitle>
            <CardDescription>Per-container CPU, memory and network usage</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <iframe src={GRAFANA_CADVISOR_URL} width="100%" height="600" frameBorder="0" title="cAdvisor Dashboard" className="rounded-b-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
