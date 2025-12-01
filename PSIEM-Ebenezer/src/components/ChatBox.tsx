import React, { FormEvent, useState } from "react";

type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  content: string;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
  
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
  
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
  
      // Try to read JSON even if status is 400/500
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
  
      const replyText =
        data.reply ||
        data.error ||
        (!res.ok
          ? "The AI server returned an error. Check the server console for details."
          : "Sorry, I couldn't generate a reply.");
  
      const botMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: replyText,
      };
  
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      // Only hit if fetch itself fails (server not reachable, etc.)
      const errorMessage: Message = {
        id: Date.now() + 2,
        role: "assistant",
        content:
          "Sorry, I couldn't reach the AI server. Make sure `node server.js` is running.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto my-8 border border-border rounded-lg flex flex-col h-[70vh] bg-background/60">
      {/* header */}
      <div className="px-4 py-3 border-b border-border font-semibold">
        AI Assistant
      </div>

      {/* messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 text-sm">
        {messages.length === 0 && (
          <div className="text-muted-foreground">
            Ask me anything about your dashboard, security, or workflows.
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-xl px-3 py-2 whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-primary/20"
                : "self-start bg-muted"
            }`}
          >
            <div className="text-xs font-medium mb-1 opacity-70">
              {m.role === "user" ? "You" : "Assistant"}
            </div>
            <div>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-muted-foreground">Thinking…</div>
        )}
      </div>

      {/* input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3 flex gap-2"
      >
        <input
          className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-full text-sm bg-primary text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
