import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertTriangle, Database, Shield, TerminalSquare, X, Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight, ChevronsRight, ChevronsLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ESResult {
  [key: string]: unknown;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  esResults?: ESResult[];
  queryUsed?: object;
  timestamp: string;
  isError?: boolean;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const AI_ASSISTANT_URL = import.meta.env.VITE_AI_ASSISTANT_URL || "http://localhost:8000";
const SESSIONS_KEY = "ai_assistant_sessions";
const CURRENT_SESSION_KEY = "ai_assistant_current_session";
const SESSION_TTL = 24 * 60 * 60 * 1000;

const SUGGESTED_PROMPTS = [
  { icon: AlertTriangle, label: "Recent critical alerts", prompt: "Show me the 10 most recent critical Suricata alerts" },
  { icon: Database, label: "Query failed logins", prompt: "Find all failed login attempts in the last hour from syslog" },
  { icon: Shield, label: "Explain an alert", prompt: "Explain what an ET SCAN Nmap alert means and recommended response actions" },
  { icon: TerminalSquare, label: "Top source IPs", prompt: "What are the top 5 source IPs generating the most alerts today?" },
];

function makeWelcomeMessage(): Message {
  return {
    id: "welcome-" + Date.now(),
    role: "assistant",
    content: "Hello! I'm your PSIEM AI Security Analyst. I can help you query logs, explain alerts, and recommend response actions.\n\n• Suricata IDS alerts (suricata-*)\n• System logs (syslog-*)\n• Filebeat logs (filebeat-*)\n\nFor CPU/memory metrics, check the System Health page or Grafana.",
    timestamp: new Date().toISOString(),
  };
}

function makeNewSession(): Session {
  return {
    id: Date.now().toString(),
    title: "New Session",
    messages: [makeWelcomeMessage()],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const sessions: Session[] = JSON.parse(raw);
    return sessions.filter(s => Date.now() - s.updatedAt < SESSION_TTL);
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

function loadCurrentSessionId(): string | null {
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

function saveCurrentSessionId(id: string) {
  localStorage.setItem(CURRENT_SESSION_KEY, id);
}

function getSessionTitle(messages: Message[]): string {
  const firstUserMsg = messages.find(m => m.role === "user");
  if (!firstUserMsg) return "New Session";
  return firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "");
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function valueToString(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DetailModal({ result, onClose }: { result: ESResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Log Entry Details</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] p-5">
          <div className="space-y-3">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="grid grid-cols-4 gap-3 text-sm border-b border-border/50 pb-3 last:border-0">
                <span className="text-muted-foreground font-medium col-span-1 break-all">{key}</span>
                <div className="text-foreground col-span-3 break-all">
                  {typeof value === "object" && value !== null ? (
                    <pre className="font-mono text-xs bg-muted/40 px-3 py-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <span className="font-mono text-xs bg-muted/40 px-2 py-1 rounded inline-block">
                      {String(value ?? "—")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ESResultsTable({ results }: { results: ESResult[] }) {
  const [selectedResult, setSelectedResult] = useState<ESResult | null>(null);
  if (!results || results.length === 0) return null;
  const allKeys = Array.from(new Set(results.flatMap(r => Object.keys(r))));
  const keys = allKeys.slice(0, 6);

  return (
    <>
      {selectedResult && <DetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />}
      <div className="mt-3 rounded-lg border border-border overflow-hidden text-xs">
        <div className="bg-muted/50 px-3 py-1.5 flex items-center gap-2 border-b border-border">
          <Database className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground font-medium">
            {results.length} result{results.length !== 1 ? "s" : ""} from Elasticsearch
          </span>
          <span className="text-muted-foreground ml-auto italic">Click a row for details</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {keys.map((k) => (
                  <th key={k} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map((row, i) => (
                <tr key={i} onClick={() => setSelectedResult(row)} className="border-b border-border/50 hover:bg-primary/10 cursor-pointer transition-colors">
                  {keys.map((k) => {
                    const value = row[k];
                    const displayValue = typeof value === "object" && value !== null
                      ? `{${Object.keys(value as object).length} fields}`
                      : valueToString(value);
                    return (
                      <td key={k} className="px-3 py-2 text-foreground/80 whitespace-nowrap max-w-[200px] truncate" title={displayValue}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary/20 border border-primary/40" : "bg-muted border border-border glow-purple-sm"
      )}>
        {isUser ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : message.isError
            ? "bg-destructive/10 border border-destructive/30 text-foreground rounded-tl-sm"
            : "bg-card border border-border text-foreground rounded-tl-sm"
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.esResults && message.esResults.length > 0 && (
          <div className="w-full max-w-2xl">
            <ESResultsTable results={message.esResults} />
          </div>
        )}
        <span className="text-xs text-muted-foreground mt-1 px-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const loaded = loadSessions();
    if (loaded.length === 0) {
      const fresh = makeNewSession();
      saveSessions([fresh]);
      return [fresh];
    }
    return loaded;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const saved = loadCurrentSessionId();
    const loaded = loadSessions();
    if (saved && loaded.find(s => s.id === saved)) return saved;
    return loaded[0]?.id || sessions[0]?.id;
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWide, setSidebarWide] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${AI_ASSISTANT_URL}/health`);
        const data = await res.json();
        setBackendStatus(data.status === "ok" ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    checkHealth();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveCurrentSessionId(currentSessionId);
  }, [currentSessionId]);

  const updateCurrentSession = (newMessages: Message[]) => {
    setSessions(prev => prev.map(s =>
      s.id === currentSessionId
        ? { ...s, messages: newMessages, title: getSessionTitle(newMessages), updatedAt: Date.now() }
        : s
    ));
  };

  const handleNewSession = () => {
    const fresh = makeNewSession();
    setSessions(prev => [fresh, ...prev]);
    setCurrentSessionId(fresh.id);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        const fresh = makeNewSession();
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (sessionId === currentSessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    updateCurrentSession(newMessages);
    setInput("");
    setIsLoading(true);

    const history = messages
      .filter(m => !m.id.startsWith("welcome") && m.role === "user")
      .slice(-6)
      .map(m => ({ 
        role: m.role, 
        content: m.role === "assistant"
          ? m.content.split("\n")[0].slice(0,100)
          : m.content
      }));

    try {
      const res = await fetch(`${AI_ASSISTANT_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), conversation_history: history }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Request failed");
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        esResults: data.es_results,
        queryUsed: data.query_used,
        timestamp: new Date().toISOString(),
      };
      updateCurrentSession([...newMessages, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Error: ${err instanceof Error ? err.message : "Could not reach AI assistant service."}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      updateCurrentSession([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isNewSession = messages.filter(m => m.role === "user").length === 0;

  const sidebarWidth = !sidebarOpen
    ? "w-10 min-w-[40px]"
    : sidebarWide
    ? "w-96 min-w-[384px]"
    : "w-64 min-w-[256px]";

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-3 px-4 py-6">
      {/* Sidebar */}
      <div className={cn("flex flex-col glass-card rounded-2xl transition-all duration-300 overflow-hidden", sidebarWidth)}>
        {sidebarOpen ? (
          <>
            <div className="flex items-center justify-between px-3 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Sessions</span>
              <div className="flex items-center gap-1">
                {/* Expand/Collapse width toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSidebarWide(!sidebarWide)}
                  title={sidebarWide ? "Shrink sidebar" : "Expand sidebar"}
                >
                  {sidebarWide ? <ChevronsLeft className="h-3 w-3" /> : <ChevronsRight className="h-3 w-3" />}
                </Button>
                {/* New session */}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewSession} title="New session">
                  <Plus className="h-3 w-3" />
                </Button>
                {/* Close sidebar */}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)} title="Close sidebar">
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setCurrentSessionId(session.id)}
                    className={cn(
                      "flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors text-xs",
                      session.id === currentSessionId
                        ? "bg-primary/20 border border-primary/30 text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn("font-medium", sidebarWide ? "break-words whitespace-normal" : "truncate")}
                        title={session.title}
                      >
                        {session.title}
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{formatDate(session.updatedAt)}</p>
                    </div>
                    {/* Always visible delete button */}
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-0.5 rounded hover:bg-destructive/10"
                      title="Delete session"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="px-3 py-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground">Sessions expire after 24 hours</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-3 gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(true)} title="Open sidebar">
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewSession} title="New session">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-purple-sm">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Security Analyst</h1>
            <p className="text-xs text-muted-foreground">Powered by Groq · Connected to Elasticsearch</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className={cn("border text-xs bg-transparent", backendStatus === "online" ? "border-success/40 text-success" : "border-destructive/40 text-destructive")}>
              <span className={cn("h-1.5 w-1.5 rounded-full inline-block mr-1.5", backendStatus === "online" ? "bg-success animate-pulse" : "bg-destructive")} />
              {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Connecting..."}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleNewSession} className="gap-1.5 text-xs">
              <Plus className="h-3 w-3" />
              New Session
            </Button>
          </div>
        </div>

        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </ScrollArea>

          {isNewSession && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button key={label} onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/10 transition-smooth">
                  <Icon className="h-3 w-3" />{label}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border p-3 flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about alerts, query logs, or describe a threat... (Enter to send)"
              className="resize-none min-h-[44px] max-h-[140px] bg-muted/50 border-border text-sm focus-visible:ring-primary/50 rounded-xl"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/80 glow-purple-sm flex-shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
