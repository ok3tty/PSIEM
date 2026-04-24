import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, RefreshCw, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ES_HOST = import.meta.env.VITE_ELASTICSEARCH_URL || '/elasticsearch';

// MITRE ATT&CK mapping based on Suricata signatures
const MITRE_MAPPINGS: Record<string, { technique: string; techniqueId: string; tactic: string; tacticId: string; description: string }> = {
  'ET WEB_SERVER Script tag in URI Possible Cross Site Scripting Attempt': {
    technique: 'Scripting',
    techniqueId: 'T1059.007',
    tactic: 'Execution',
    tacticId: 'TA0002',
    description: 'Adversary used JavaScript/script tags in HTTP requests attempting Cross-Site Scripting (XSS).',
  },
  'ET WEB_SERVER /etc/passwd Detected in URI': {
    technique: 'File and Directory Discovery',
    techniqueId: 'T1083',
    tactic: 'Discovery',
    tacticId: 'TA0007',
    description: 'Adversary attempted to read /etc/passwd via directory traversal in HTTP URI.',
  },
  'ET INFO Request to Hidden Environment File - Inbound': {
    technique: 'Unsecured Credentials',
    techniqueId: 'T1552',
    tactic: 'Credential Access',
    tacticId: 'TA0006',
    description: 'Adversary requested .env file which may contain credentials and API keys.',
  },
  'ET SCAN Nessus User Agent': {
    technique: 'Active Scanning',
    techniqueId: 'T1595',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Nessus vulnerability scanner detected — adversary is scanning for vulnerabilities.',
  },
  'ET DROP Dshield Block Listed Source group 1': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from DShield blocklisted IP — known malicious source attempting access.',
  },
  'ET DROP Spamhaus DROP Listed Traffic Inbound group 36': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from Spamhaus DROP listed IP — known hostile network attempting connection.',
  },
  'ET DROP Spamhaus DROP Listed Traffic Inbound group 10': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from Spamhaus DROP listed IP — known hostile network attempting connection.',
  },
  'ET DROP Spamhaus DROP Listed Traffic Inbound group 7': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from Spamhaus DROP listed IP — known hostile network attempting connection.',
  },
  'ET DROP Spamhaus DROP Listed Traffic Inbound group 15': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from Spamhaus DROP listed IP — known hostile network attempting connection.',
  },
  'ET DROP Spamhaus DROP Listed Traffic Inbound group 34': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from Spamhaus DROP listed IP — known hostile network attempting connection.',
  },
  'ET DROP Spamhaus DROP Listed Traffic Inbound group 41': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Traffic from Spamhaus DROP listed IP — known hostile network attempting connection.',
  },
  'ET COMPROMISED Known Compromised or Hostile Host Traffic group 10': {
    technique: 'Compromise Infrastructure',
    techniqueId: 'T1584',
    tactic: 'Resource Development',
    tacticId: 'TA0042',
    description: 'Traffic from a known compromised host — may indicate botnet or C2 activity.',
  },
  'ET CINS Active Threat Intelligence Poor Reputation IP group 141': {
    technique: 'Gather Victim Network Information',
    techniqueId: 'T1590',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Connection from CINS poor reputation IP — active threat intelligence match.',
  },
  'ET CINS Active Threat Intelligence Poor Reputation IP group 142': {
    technique: 'Gather Victim Network Information',
    techniqueId: 'T1590',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Connection from CINS poor reputation IP — active threat intelligence match.',
  },
  'ET CINS Active Threat Intelligence Poor Reputation IP group 165': {
    technique: 'Gather Victim Network Information',
    techniqueId: 'T1590',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Connection from CINS poor reputation IP — active threat intelligence match.',
  },
  'ET CINS Active Threat Intelligence Poor Reputation IP group 250': {
    technique: 'Gather Victim Network Information',
    techniqueId: 'T1590',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Connection from CINS poor reputation IP — active threat intelligence match.',
  },
  'ET CINS Active Threat Intelligence Poor Reputation IP group 37': {
    technique: 'Gather Victim Network Information',
    techniqueId: 'T1590',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Connection from CINS poor reputation IP — active threat intelligence match.',
  },
  'ET HUNTING ZIP file exfiltration over raw TCP': {
    technique: 'Exfiltration Over Unencrypted Non-C2 Protocol',
    techniqueId: 'T1048.003',
    tactic: 'Exfiltration',
    tacticId: 'TA0010',
    description: 'Possible ZIP file exfiltration detected over raw TCP connection.',
  },
  'ET INFO SSH-2.0-Go version string Observed in Network Traffic': {
    technique: 'External Remote Services',
    techniqueId: 'T1133',
    tactic: 'Initial Access',
    tacticId: 'TA0001',
    description: 'Go-based SSH client observed — may indicate automated scanning or exploitation tool.',
  },
  'Possible Port Scan': {
    technique: 'Active Scanning: Scanning IP Blocks',
    techniqueId: 'T1595.001',
    tactic: 'Reconnaissance',
    tacticId: 'TA0043',
    description: 'Port scan detected — adversary is mapping open services on the target.',
  },
  'ICMP Ping Detected': {
    technique: 'Remote System Discovery',
    techniqueId: 'T1018',
    tactic: 'Discovery',
    tacticId: 'TA0007',
    description: 'ICMP ping sweep detected — adversary is discovering live hosts on the network.',
  },
  'DNS Query Detected': {
    technique: 'DNS',
    techniqueId: 'T1071.004',
    tactic: 'Command and Control',
    tacticId: 'TA0011',
    description: 'Suspicious DNS activity detected — possible C2 communication or DNS tunneling.',
  },
};

const TACTIC_COLORS: Record<string, string> = {
  'Reconnaissance': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  'Resource Development': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  'Initial Access': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  'Execution': 'bg-red-500/20 text-red-400 border-red-500/40',
  'Credential Access': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  'Discovery': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  'Command and Control': 'bg-pink-500/20 text-pink-400 border-pink-500/40',
  'Exfiltration': 'bg-rose-500/20 text-rose-400 border-rose-500/40',
};

interface AlertCount {
  signature: string;
  count: number;
  mitre?: typeof MITRE_MAPPINGS[string];
}

interface TacticGroup {
  tactic: string;
  tacticId: string;
  alerts: AlertCount[];
  totalCount: number;
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

export default function MitreAttack() {
  const [tacticGroups, setTacticGroups] = useState<TacticGroup[]>([]);
  const [unmapped, setUnmapped] = useState<AlertCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(new Set());
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [mappedCount, setMappedCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFromES('/suricata-*/_search', {
        size: 0,
        aggs: {
          signatures: {
            terms: { field: 'alert.signature.keyword', size: 100 },
          },
        },
      });

      const buckets = res.aggregations?.signatures?.buckets || [];
      const alerts: AlertCount[] = buckets.map((b: any) => ({
        signature: b.key,
        count: b.doc_count,
        mitre: MITRE_MAPPINGS[b.key],
      }));

      const total = alerts.reduce((sum, a) => sum + a.count, 0);
      setTotalAlerts(total);

      // Group by tactic
      const tacticMap: Record<string, TacticGroup> = {};
      const unmappedAlerts: AlertCount[] = [];
      let mapped = 0;

      for (const alert of alerts) {
        if (alert.mitre) {
          mapped += alert.count;
          const tactic = alert.mitre.tactic;
          if (!tacticMap[tactic]) {
            tacticMap[tactic] = {
              tactic,
              tacticId: alert.mitre.tacticId,
              alerts: [],
              totalCount: 0,
            };
          }
          tacticMap[tactic].alerts.push(alert);
          tacticMap[tactic].totalCount += alert.count;
        } else if (alert.signature) {
          unmappedAlerts.push(alert);
        }
      }

      setMappedCount(mapped);
      setTacticGroups(Object.values(tacticMap).sort((a, b) => b.totalCount - a.totalCount));
      setUnmapped(unmappedAlerts);
      setLastUpdated(new Date());

      // Auto expand top 3 tactics
      const top3 = Object.values(tacticMap)
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 3)
        .map(t => t.tactic);
      setExpandedTactics(new Set(top3));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTactic = (tactic: string) => {
    setExpandedTactics(prev => {
      const next = new Set(prev);
      if (next.has(tactic)) next.delete(tactic);
      else next.add(tactic);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MITRE ATT&CK Framework</h1>
          <p className="text-muted-foreground mt-1">
            Real Suricata alerts mapped to MITRE ATT&CK tactics and techniques
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">Updated {lastUpdated.toLocaleTimeString()}</p>
          )}
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="glass-card border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Alerts</p>
            <p className="text-3xl font-bold mt-2">{loading ? '...' : totalAlerts.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Mapped to ATT&CK</p>
            <p className="text-3xl font-bold mt-2 text-primary">{loading ? '...' : mappedCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Tactics Detected</p>
            <p className="text-3xl font-bold mt-2 text-warning">{loading ? '...' : tacticGroups.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unique Techniques</p>
            <p className="text-3xl font-bold mt-2 text-destructive">
              {loading ? '...' : tacticGroups.reduce((sum, t) => sum + t.alerts.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ATT&CK Navigator Style Matrix */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Detected Tactics & Techniques
          </CardTitle>
          <CardDescription>
            Click a tactic to expand and see matched techniques with alert counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Loading ATT&CK mappings...</span>
            </div>
          ) : tacticGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No mapped alerts found.</p>
          ) : (
            <div className="space-y-3">
              {tacticGroups.map((group) => (
                <div key={group.tactic} className="rounded-xl border border-border overflow-hidden">
                  {/* Tactic Header */}
                  <button
                    onClick={() => toggleTactic(group.tactic)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedTactics.has(group.tactic)
                        ? <ChevronDown className="h-4 w-4 text-primary" />
                        : <ChevronRight className="h-4 w-4 text-primary" />
                      }
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{group.tactic}</span>
                          <Badge variant="outline" className="text-xs font-mono">{group.tacticId}</Badge>
                          <Badge className={`text-xs border ${TACTIC_COLORS[group.tactic] || 'bg-muted text-muted-foreground'}`}>
                            {group.alerts.length} technique{group.alerts.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{group.totalCount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">alerts</span>
                    </div>
                  </button>

                  {/* Technique Details */}
                  {expandedTactics.has(group.tactic) && (
                    <div className="border-t border-border divide-y divide-border/50">
                      {group.alerts.map((alert) => (
                        <div key={alert.signature} className="p-4 bg-background/30 hover:bg-muted/20 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono text-xs text-primary font-semibold">
                                  {alert.mitre?.techniqueId}
                                </span>
                                <span className="font-medium text-sm">{alert.mitre?.technique}</span>
                                <a
                                  href={`https://attack.mitre.org/techniques/${alert.mitre?.techniqueId?.replace('.', '/')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{alert.mitre?.description}</p>
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
                                <span className="text-xs text-muted-foreground font-mono truncate">{alert.signature}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-primary">{alert.count.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">alerts</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unmapped Alerts */}
      {unmapped.length > 0 && (
        <Card className="glass-card border-muted/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Other Alerts (Not Yet Mapped)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unmapped.map((alert) => (
                <Badge key={alert.signature} variant="outline" className="text-xs">
                  {alert.signature || 'Unknown'} ({alert.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Mappings based on the{' '}
              <a
                href="https://attack.mitre.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MITRE ATT&CK® Framework
              </a>
              {' '}— a globally accessible knowledge base of adversary tactics and techniques.
              Click any technique ID to view full details on the MITRE ATT&CK website.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
