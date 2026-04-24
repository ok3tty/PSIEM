import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Filter, Database, RefreshCw, X, ChevronDown, ChevronRight, ExternalLink, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

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

function getSeverityFromPriority(p: number): string {
  if (p === 1) return 'critical';
  if (p === 2) return 'high';
  if (p === 3) return 'medium';
  return 'low';
}

function getLogLevelColor(level: string) {
  switch (level) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high':     return 'bg-warning text-warning-foreground';
    case 'medium':   return 'bg-info text-info-foreground';
    case 'low':      return 'bg-success text-success-foreground';
    default:         return 'bg-muted text-muted-foreground';
  }
}

interface VTResult {
  loading: boolean;
  error?: string;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  country?: string;
  owner?: string;
  reputation?: number;
  lastAnalysis?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  logLevel: string;
  sourceSystem: string;
  eventType: string;
  message: string;
  ipAddress: string;
  destIp: string;
  raw: any;
}

function JsonBlock({ value }: { value: any }) {
  const [collapsed, setCollapsed] = useState(true);
  const isObject = typeof value === 'object' && value !== null;
  const preview = isObject
    ? `{ ${Object.keys(value).slice(0, 3).join(', ')}${Object.keys(value).length > 3 ? ', ...' : ''} }`
    : String(value ?? '—');
  if (!isObject) {
    return (
      <span className="font-mono text-xs bg-muted/40 px-2 py-1 rounded break-all block">
        {String(value ?? '—')}
      </span>
    );
  }
  return (
    <div className="font-mono text-xs rounded overflow-hidden border border-border/50">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-2 py-1.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3 text-primary flex-shrink-0" />
          : <ChevronDown className="h-3 w-3 text-primary flex-shrink-0" />}
        <span className="text-muted-foreground truncate">{preview}</span>
      </button>
      {!collapsed && (
        <pre className="p-3 bg-background/60 text-foreground/80 overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap break-all">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function VirusTotalPanel({ ip }: { ip: string }) {
  const [result, setResult] = useState<VTResult | null>(null);

  const lookup = async () => {
    if (!ip || ip === 'N/A' || ip.startsWith('fe80') || ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.')) {
      setResult({ loading: false, error: 'Private/local IP — VirusTotal lookup not applicable.' });
      return;
    }
    setResult({ loading: true });
    try {
      const res = await fetch(`https://myaegis.org/virustotal/${ip}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `API error: ${res.status}`);
      }
      const data = await res.json();
      setResult({
        loading: false,
        malicious: data.malicious || 0,
        suspicious: data.suspicious || 0,
        harmless: data.harmless || 0,
        undetected: data.undetected || 0,
        country: data.country,
        owner: data.owner,
        reputation: data.reputation,
        lastAnalysis: data.lastAnalysis
          ? new Date(data.lastAnalysis * 1000).toLocaleDateString()
          : undefined,
      });
    } catch (e: any) {
      setResult({ loading: false, error: e.message || 'Lookup failed' });
    }
  };

  if (!result) {
    return (
      <Button size="sm" variant="outline" onClick={lookup} className="gap-1.5 text-xs h-7">
        <Shield className="h-3 w-3" />
        VirusTotal Lookup
      </Button>
    );
  }

  if (result.loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Looking up {ip}...
      </div>
    );
  }

  if (result.error) {
    return <p className="text-xs text-muted-foreground">{result.error}</p>;
  }

  const isMalicious = (result.malicious || 0) > 0;
  const isSuspicious = (result.suspicious || 0) > 0;

  return (
    <div className="mt-2 p-3 rounded-lg border border-border bg-background/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={`h-4 w-4 ${isMalicious ? 'text-destructive' : isSuspicious ? 'text-warning' : 'text-success'}`} />
          <span className="text-xs font-semibold">
            {isMalicious ? '⚠️ Malicious IP' : isSuspicious ? '⚠️ Suspicious IP' : '✅ Clean IP'}
          </span>
        </div>
        <a
          href={`https://www.virustotal.com/gui/ip-address/${ip}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View on VT <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-destructive font-bold">{result.malicious}</span>
          <span className="text-muted-foreground">malicious</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-warning font-bold">{result.suspicious}</span>
          <span className="text-muted-foreground">suspicious</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-success font-bold">{result.harmless}</span>
          <span className="text-muted-foreground">harmless</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground font-bold">{result.undetected}</span>
          <span className="text-muted-foreground">undetected</span>
        </div>
      </div>
      {(result.country || result.owner) && (
        <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 space-y-1">
          {result.country && <p>🌍 Country: <span className="text-foreground">{result.country}</span></p>}
          {result.owner && <p>🏢 Owner: <span className="text-foreground">{result.owner}</span></p>}
          {result.reputation !== undefined && <p>📊 Reputation: <span className={result.reputation < 0 ? 'text-destructive' : 'text-success'}>{result.reputation}</span></p>}
          {result.lastAnalysis && <p>🕐 Last analysis: <span className="text-foreground">{result.lastAnalysis}</span></p>}
        </div>
      )}
    </div>
  );
}

const PRIORITY_FIELDS = ['@timestamp', 'timestamp', 'alert', 'src_ip', 'dest_ip', 'proto', 'src_port', 'dest_port', 'icmp_type', 'icmp_code', 'flow'];
const HIDDEN_FIELDS = ['log_type', '@version', 'ecs', 'tags', 'log'];

function DetailModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const raw = log.raw || {};
  const priorityEntries = PRIORITY_FIELDS
    .filter(k => k in raw && !HIDDEN_FIELDS.includes(k))
    .map(k => [k, raw[k]] as [string, any]);
  const otherEntries = Object.entries(raw)
    .filter(([k]) => !PRIORITY_FIELDS.includes(k) && !HIDDEN_FIELDS.includes(k));
  const renderField = (key: string, value: any) => (
    <div key={key} className="grid grid-cols-3 gap-3 text-sm items-start">
      <span className="text-muted-foreground font-medium col-span-1 pt-1 break-all">{key}</span>
      <div className="col-span-2">
        <JsonBlock value={value} />
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-visible mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Event Details</span>
            <Badge className={getLogLevelColor(log.logLevel)}>{log.logLevel}</Badge>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ScrollArea className="h-[65vh] overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Timestamp</p>
                <p className="font-mono text-xs">{log.timestamp.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Signature</p>
                <p className="font-medium text-xs">{log.message}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Source IP</p>
                <p className="font-mono text-xs">{log.ipAddress}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Dest IP</p>
                <p className="font-mono text-xs">{log.destIp || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Protocol</p>
                <p className="font-mono text-xs">{log.eventType}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Category</p>
                <p className="font-mono text-xs">{log.sourceSystem}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Threat Intelligence</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Source IP — {log.ipAddress}</p>
                  <VirusTotalPanel ip={log.ipAddress} />
                </div>
                {log.destIp && log.destIp !== log.ipAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dest IP — {log.destIp}</p>
                    <VirusTotalPanel ip={log.destIp} />
                  </div>
                )}
              </div>
            </div>

            {priorityEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event Fields</p>
                <div className="space-y-2">
                  {priorityEntries.map(([k, v]) => renderField(k, v))}
                </div>
              </div>
            )}

            {otherEntries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Additional Fields</p>
                <div className="space-y-2">
                  {otherEntries.map(([k, v]) => renderField(k, v))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function EventLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedProto, setSelectedProto] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const must: any[] = [{ exists: { field: 'alert.signature' } }];
      if (selectedLevel !== 'all') {
        const levelMap: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
        if (levelMap[selectedLevel]) {
          must.push({ term: { 'alert.severity': levelMap[selectedLevel] } });
        }
      }
      if (selectedProto === 'ipv4') {
        must.push({ term: { 'network.type': 'ipv4' } });
      } else if (selectedProto === 'ipv6') {
        must.push({ term: { 'network.type': 'ipv6' } });
      } else if (['tcp', 'udp', 'icmp'].includes(selectedProto)) {
        must.push({ term: { proto: selectedProto } });
      }
      if (searchQuery.trim()) {
        must.push({
          multi_match: {
            query: searchQuery,
            fields: ['alert.signature', 'alert.category', 'src_ip', 'dest_ip', 'proto'],
          },
        });
      }
      const res = await fetchFromES('/suricata-*/_search', {
        size: PAGE_SIZE,
        from: (currentPage - 1) * PAGE_SIZE,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: { bool: { must } },
      });
      const hits = res.hits?.hits || [];
      setTotal(res.hits?.total?.value || 0);
      setLogs(hits.map((h: any) => ({
        id: h._id,
        timestamp: new Date(h._source['@timestamp']),
        logLevel: getSeverityFromPriority(h._source.alert?.severity || 4),
        sourceSystem: h._source.alert?.category || 'Suricata',
        eventType: h._source.proto?.toUpperCase() || 'ALERT',
        message: h._source.alert?.signature || 'Unknown alert',
        ipAddress: h._source.src_ip || 'N/A',
        destIp: h._source.dest_ip || '',
        raw: h._source,
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLevel, selectedProto, currentPage]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedLevel, selectedProto]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Protocol', 'Signature', 'Source IP', 'Dest IP'].join(','),
      ...logs.map(l => [
        l.timestamp.toISOString(), l.logLevel, l.sourceSystem, l.eventType,
        `"${l.message.replace(/"/g, '""')}"`, l.ipAddress, l.destIp,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Logs</h1>
          <p className="text-muted-foreground mt-1">Live Suricata alerts from Elasticsearch</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={logs.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="glass-card border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              📊 <span className="text-primary font-semibold">Live data:</span> Suricata → Filebeat → Logstash → Elasticsearch
              {!loading && <span className="ml-2 text-muted-foreground">({total.toLocaleString()} total alerts indexed)</span>}
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="glass-card border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by signature, IP, category, protocol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProto} onValueChange={setSelectedProto}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Protocols</SelectItem>
                <SelectItem value="ipv4">IPv4 Only</SelectItem>
                <SelectItem value="ipv6">IPv6 Only</SelectItem>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
                <SelectItem value="icmp">ICMP</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLogs}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Event Log Entries</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${logs.length} of ${total.toLocaleString()} entries (page ${currentPage} of ${totalPages || 1}) — Click a row for details`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Fetching logs from Elasticsearch...</span>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No logs found matching your filters.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Dest IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {log.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getLogLevelColor(log.logLevel)}>{log.logLevel}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{log.sourceSystem}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.eventType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{log.ipAddress}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{log.destIp || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages || 1}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || loading}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
