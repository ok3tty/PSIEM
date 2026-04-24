import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, User, AlertTriangle, FileText, Shield, X, Loader2, LayoutDashboard, KeyRound, Bot, Activity, Settings, Target, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown } from './NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const ES_HOST = import.meta.env.VITE_ELASTICSEARCH_URL || '/elasticsearch';

// All navigable pages in the app
const PAGES = [
  { title: 'Dashboard', description: 'Overview of threats, alerts and system status', url: '/dashboard', icon: 'dashboard', keywords: ['home', 'overview', 'summary', 'threats', 'stats'] },
  { title: 'Password Manager', description: 'Manage and store passwords securely', url: '/password-manager', icon: 'key', keywords: ['password', 'credentials', 'vault', 'secrets'] },
  { title: 'Intrusion Detection', description: 'Suricata IDS alerts and anomaly detection', url: '/intrusion-detection', icon: 'shield', keywords: ['ids', 'ips', 'suricata', 'intrusion', 'detection', 'anomaly', 'alerts'] },
  { title: 'Event Logs', description: 'Live Suricata alerts from Elasticsearch', url: '/event-logs', icon: 'logs', keywords: ['logs', 'events', 'alerts', 'suricata', 'syslog', 'zeek'] },
  { title: 'AI Assistant', description: 'AI-powered security analyst', url: '/ai-assistant', icon: 'bot', keywords: ['ai', 'assistant', 'chat', 'groq', 'llama', 'analyst'] },
  { title: 'System Health', description: 'CPU, memory, network metrics via Grafana', url: '/system-health', icon: 'activity', keywords: ['health', 'cpu', 'memory', 'disk', 'grafana', 'prometheus', 'metrics'] },
  { title: 'MITRE ATT&CK', description: 'Alert mappings to MITRE ATT&CK framework', url: '/mitre-attack', icon: 'target', keywords: ['mitre', 'attack', 'tactics', 'techniques', 'framework', 'ttp'] },
  { title: 'Settings', description: 'Application settings and preferences', url: '/settings', icon: 'settings', keywords: ['settings', 'config', 'preferences', 'theme'] },
  { title: 'Security Preferences', description: 'Change password and account security', url: '/security', icon: 'shield', keywords: ['security', 'password', 'account', 'change password'] },
  { title: 'Support', description: 'Help, documentation and team contacts', url: '/support', icon: 'help', keywords: ['support', 'help', 'contact', 'team', 'docs'] },
];

interface SearchResult {
  id: string;
  type: 'alert' | 'log' | 'zeek' | 'page';
  title: string;
  subtitle: string;
  timestamp?: string;
  severity?: string;
  route: string;
  icon?: string;
}

function getSeverityColor(s?: string) {
  switch (s) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high':     return 'bg-warning text-warning-foreground';
    case 'medium':   return 'bg-info text-info-foreground';
    default:         return 'bg-muted text-muted-foreground';
  }
}

function priorityToSeverity(p: number) {
  if (p === 1) return 'critical';
  if (p === 2) return 'high';
  if (p === 3) return 'medium';
  return 'low';
}

function searchPages(query: string): SearchResult[] {
  const q = query.toLowerCase();
  return PAGES
    .filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.keywords.some(k => k.includes(q))
    )
    .map(p => ({
      id: `page-${p.url}`,
      type: 'page' as const,
      title: p.title,
      subtitle: p.description,
      route: p.url,
      icon: p.icon,
    }));
}

async function searchElasticsearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Search Suricata alerts
  try {
    const res = await fetch(`${ES_HOST}/suricata-*/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        size: 5,
        query: {
          multi_match: {
            query,
            fields: ['alert.signature', 'alert.category', 'src_ip', 'dest_ip', 'proto'],
            fuzziness: 'AUTO',
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
      }),
    });
    const data = await res.json();
    for (const hit of data.hits?.hits || []) {
      results.push({
        id: hit._id,
        type: 'alert',
        title: hit._source.alert?.signature || 'Unknown Alert',
        subtitle: `${hit._source.src_ip || 'N/A'} → ${hit._source.dest_ip || 'N/A'} · ${hit._source.proto?.toUpperCase() || ''}`,
        timestamp: hit._source['@timestamp'],
        severity: priorityToSeverity(hit._source.alert?.severity || 4),
        route: '/event-logs',
      });
    }
  } catch (_) {}

  // Search Zeek logs
  try {
    const res = await fetch(`${ES_HOST}/zeek-*/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        size: 3,
        query: {
          multi_match: {
            query,
            fields: ['id.orig_h', 'id.resp_h', 'service', 'proto', 'conn_state'],
            fuzziness: 'AUTO',
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
      }),
    });
    const data = await res.json();
    for (const hit of data.hits?.hits || []) {
      results.push({
        id: hit._id,
        type: 'zeek',
        title: `Zeek: ${hit._source.service || hit._source.proto || 'Connection'}`,
        subtitle: `${hit._source['id.orig_h'] || 'N/A'} → ${hit._source['id.resp_h'] || 'N/A'}`,
        timestamp: hit._source['@timestamp'],
        route: '/event-logs',
      });
    }
  } catch (_) {}

  // Deduplicate
  const seen = new Set<string>();
  return results
    .filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, 6);
}

async function globalSearch(query: string): Promise<{ pages: SearchResult[]; data: SearchResult[] }> {
  const [pages, data] = await Promise.all([
    Promise.resolve(searchPages(query)),
    searchElasticsearch(query),
  ]);
  return { pages, data };
}

function PageIcon({ icon }: { icon?: string }) {
  const cls = "w-3.5 h-3.5 flex-shrink-0";
  switch (icon) {
    case 'dashboard': return <LayoutDashboard className={`${cls} text-primary`} />;
    case 'key': return <KeyRound className={`${cls} text-warning`} />;
    case 'shield': return <Shield className={`${cls} text-primary`} />;
    case 'logs': return <ScrollText className={`${cls} text-info`} />;
    case 'bot': return <Bot className={`${cls} text-success`} />;
    case 'activity': return <Activity className={`${cls} text-primary`} />;
    case 'target': return <Target className={`${cls} text-destructive`} />;
    case 'settings': return <Settings className={`${cls} text-muted-foreground`} />;
    default: return <FileText className={`${cls} text-muted-foreground`} />;
  }
}

function TypeIcon({ type, icon }: { type: SearchResult['type']; icon?: string }) {
  if (type === 'page') return <PageIcon icon={icon} />;
  if (type === 'alert') return <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />;
  if (type === 'zeek') return <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
}

export const DashboardHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<SearchResult[]>([]);
  const [data, setData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setPages([]); setData([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await globalSearch(q);
      setPages(res.pages);
      setData(res.data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setPages([]); setData([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(result.route);
    setQuery('');
    setOpen(false);
  };

  const hasResults = pages.length > 0 || data.length > 0;

  return (
    <header className="h-16 border-b border-border flex items-center px-6 gap-4 bg-card/50 backdrop-blur-sm relative z-10">
      <SidebarTrigger />

      <div className="flex-1 flex items-center gap-4">
        {/* Search container — portal-style fixed positioning for dropdown */}
        <div className="relative max-w-md flex-1" ref={containerRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            placeholder="Search threats, logs, pages..."
            className="pl-10 pr-8 bg-background/50 border-border"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => (hasResults) && setOpen(true)}
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              onClick={() => { setQuery(''); setOpen(false); setPages([]); setData([]); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dropdown — fixed position to escape stacking context */}
          {open && (
            <div
              className="fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
              style={{
                top: containerRef.current
                  ? containerRef.current.getBoundingClientRect().bottom + 6
                  : 0,
                left: containerRef.current
                  ? containerRef.current.getBoundingClientRect().left
                  : 0,
                width: containerRef.current
                  ? containerRef.current.getBoundingClientRect().width
                  : 400,
                maxHeight: '480px',
                overflowY: 'auto',
              }}
            >
              {loading ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              ) : !hasResults ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div>
                  {/* Pages section */}
                  {pages.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30 uppercase tracking-wide">
                        Pages & Features
                      </div>
                      {pages.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left border-b border-border/30 last:border-0"
                        >
                          <TypeIcon type={result.type} icon={result.icon} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Data section */}
                  {data.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30 uppercase tracking-wide">
                        Alerts & Logs
                      </div>
                      {data.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left border-b border-border/30 last:border-0"
                        >
                          <TypeIcon type={result.type} icon={result.icon} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium truncate">{result.title}</span>
                              {result.severity && (
                                <Badge className={`text-xs px-1.5 py-0 ${getSeverityColor(result.severity)}`}>
                                  {result.severity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
                          </div>
                          {result.timestamp && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/security')}>Security Preferences</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/support')}>Help & Support</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
