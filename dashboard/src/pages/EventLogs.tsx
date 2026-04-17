import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Filter, Database, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  if (p === 2) return 'error';
  if (p === 3) return 'warning';
  return 'info';
}

function getLogLevelColor(level: string) {
  switch (level) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'error':    return 'bg-destructive/70 text-destructive-foreground';
    case 'warning':  return 'bg-warning text-warning-foreground';
    case 'info':     return 'bg-info text-info-foreground';
    default:         return 'bg-muted text-muted-foreground';
  }
}

const PAGE_SIZE = 10;

export default function EventLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const must: any[] = [{ exists: { field: 'alert.signature' } }];

      if (selectedLevel !== 'all') {
        const levelMap: Record<string, number> = { critical: 1, error: 2, warning: 3, info: 4 };
        if (levelMap[selectedLevel]) {
          must.push({ term: { 'alert.severity': levelMap[selectedLevel] } });
        }
      }

      if (selectedSource !== 'all') {
        must.push({ term: { 'alert.category.keyword': selectedSource } });
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
        _source: ['@timestamp', 'alert.signature', 'alert.severity', 'alert.category', 'src_ip', 'dest_ip', 'proto'],
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
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLevel, selectedSource, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLevel, selectedSource]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Source', 'Protocol', 'Message', 'Source IP', 'Dest IP'].join(','),
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

      {/* ELK Stack Notice */}
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

      {/* Filters */}
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
                <SelectItem value="error">High</SelectItem>
                <SelectItem value="warning">Medium</SelectItem>
                <SelectItem value="info">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLogs}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Event Log Entries</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Showing ${logs.length} of ${total.toLocaleString()} entries (page ${currentPage} of ${totalPages || 1})`}
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
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {log.timestamp.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getLogLevelColor(log.logLevel)}>
                          {log.logLevel}
                        </Badge>
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

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || loading}
                  >
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
