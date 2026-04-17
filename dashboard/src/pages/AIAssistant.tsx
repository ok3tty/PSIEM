import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertTriangle, Database, Shield, TerminalSquare } from "lucide-react";
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
  timestamp: Date;
  isError?: boolean;
}

const AI_ASSISTANT_URL =
  import.meta.env.VITE_AI_ASSISTANT_URL || "http://localhost:8000";

const SUGGESTED_PROMPTS = [
  { icon: AlertTriangle, label: "Recent critical alerts", prompt: "Show me the 10 most recent critical Suricata alerts" },
  { icon: Database, label: "Query failed logins", prompt: "Find all failed login attempts in the last hour from syslog" },
  { icon: Shield, label: "Explain an alert", prompt: "Explain what an ET SCAN Nmap alert means and recommended response actions" },
  { icon: TerminalSquare, label: "Top source IPs", prompt: "What are the top 5 source IPs generating the most alerts today?" },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ESResultsTable({ results }: { results: ESResult[] }) {
  if (!results || results.length === 0) return null;
  const keys = Object.keys(results[0]).slice(0, 6);

  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden text-xs">
      <div className="bg-muted/50 px-3 py-1.5 flex items-center gap-2 border-b border-border">
        <Database className="h-3 w-3 text-primary" />
        <span className="text-muted-foreground font-medium">
          {results.length} result{results.length !== 1 ? "s" : ""} from Elasticsearch
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {keys.map((k) => (
                <th key={k} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                {keys.map((k) => (
                  <td key={k} className="px-3 py-2 text-foreground/80 whitespace-nowrap max-w-[200px] truncate">
                    {String(row[k] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm your PSIEM AI Security Analyst. I can help you query logs, explain alerts, and recommend response actions.\n\nTry asking me about recent alerts, suspicious IPs, or any security event in your environment.",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");
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

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

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
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        esResults: data.es_results,
        queryUsed: data.query_used,
        timestamp: new Date(),
      }]);
    } catch (err: unknown) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Error: ${err instanceof Error ? err.message : "Could not reach AI assistant service."}`,
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 py-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-purple-sm">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">AI Security Analyst</h1>
          <p className="text-xs text-muted-foreground">Powered by Groq · Connected to Elasticsearch</p>
        </div>
       <Badge className={cn("ml-auto border text-xs bg-transparent",backendStatus === "online" ? "border-success/40 text-success" : "border-destructive/40 text-destructive")}>
        <span className={cn("h-1.5 w-1.5 rounded-full inline-block mr-1.5",backendStatus === "online" ? "bg-success animate-pulse" : "bg-destructive")} />
        {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Connecting..."}
        </Badge>
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

        {messages.length === 1 && (
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
          <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about alerts, query logs, or describe a threat... (Enter to send)"
            className="resize-none min-h-[44px] max-h-[140px] bg-muted/50 border-border text-sm focus-visible:ring-primary/50 rounded-xl"
            rows={1} disabled={isLoading} />
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
  );
}
