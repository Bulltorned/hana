"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import type { ChatMessage } from "@/lib/types";
import { Bot, Send, Loader2, Sparkles, User, Zap } from "lucide-react";

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function HRAgentPage() {
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sessionId] = useState(() => generateSessionId());
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!selectedTenantId) return;

    const res = await fetch(
      `/api/chat?tenant_id=${selectedTenantId}&session_id=${sessionId}`
    );
    if (res.ok) {
      setMessages(await res.json());
    }
  }, [selectedTenantId, sessionId]);

  useEffect(() => {
    if (!tenantLoading && selectedTenantId) {
      fetchMessages();
    }
  }, [fetchMessages, tenantLoading, selectedTenantId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  async function handleSend() {
    if (!input.trim() || !selectedTenantId || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);
    setStreamingText("");

    // Optimistic: add user message immediately
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      tenant_id: selectedTenantId,
      session_id: sessionId,
      role: "user",
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: selectedTenantId,
          session_id: sessionId,
          content,
        }),
      });

      const chatRoute = res.headers.get("X-Chat-Route");

      if (chatRoute === "direct") {
        // Streaming response — read SSE events
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "text") {
                    fullText += data.text;
                    setStreamingText(fullText);
                  } else if (data.type === "done") {
                    fullText = data.fullText;
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
        }

        // Replace streaming with final message
        const userMsgId = res.headers.get("X-User-Message-Id") ?? optimisticMsg.id;
        const finalAssistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          tenant_id: selectedTenantId,
          session_id: sessionId,
          role: "assistant",
          content: fullText,
          metadata: { route: "direct" },
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticMsg.id),
          { ...optimisticMsg, id: userMsgId },
          finalAssistantMsg,
        ]);
        setStreamingText("");
      } else {
        // JSON response (OpenClaw path)
        if (res.ok) {
          const { userMessage, assistantMessage } = await res.json();
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== optimisticMsg.id),
            userMessage,
            assistantMessage,
          ]);
        }
      }
    } finally {
      setSending(false);
      setStreamingText("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const suggestedPrompts = [
    "Cek deadline compliance bulan ini",
    "Hitung iuran BPJS untuk karyawan baru",
    "Jelaskan aturan THR menurut regulasi terbaru",
    "Karyawan mana yang kontraknya akan habis?",
  ];

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">HR Agent</div>
          <div className="text-[10px] text-tertiary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
            Online — Hybrid Mode
          </div>
        </div>

        {isOperator && (
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={setSelectedTenantId}
          />
        )}
      </div>

      {/* Chat Area */}
      <div className="glass rounded-[var(--radius-xl)] flex-1 flex flex-col overflow-hidden">
        {!selectedTenantId ? (
          <div className="flex-1 flex items-center justify-center text-tertiary text-sm">
            <div className="text-center">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Pilih tenant untuk memulai chat.</p>
            </div>
          </div>
        ) : messages.length === 0 && !sending ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-brand-indigo opacity-60" />
              </div>
              <h3 className="text-sm font-semibold mb-1">
                Halo! Saya Hana, HR Agent kamu.
              </h3>
              <p className="text-xs text-tertiary mb-4">
                Tanyakan tentang compliance, dokumen HR, atau regulasi ketenagakerjaan Indonesia.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="text-left text-[11px] p-2.5 rounded-xl bg-brand-indigo/[0.04] border border-brand-indigo/[0.08] hover:bg-brand-indigo/[0.08] transition-colors text-muted-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-5" ref={scrollRef}>
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white rounded-br-md"
                        : "bg-white/70 border border-white/80 text-foreground rounded-bl-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={`flex items-center gap-1.5 mt-1 ${
                        msg.role === "user" ? "text-white/60" : "text-tertiary"
                      }`}
                    >
                      <span className="text-[9px]">
                        {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.role === "assistant" &&
                        (msg.metadata as Record<string, unknown>)?.route === "direct" && (
                          <Zap className="h-2.5 w-2.5 text-brand-amber" />
                        )}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-brand-indigo/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-brand-indigo" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-white/70 border border-white/80 text-foreground text-sm leading-relaxed">
                    <div className="whitespace-pre-wrap">{streamingText}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-2.5 w-2.5 text-brand-amber" />
                      <span className="text-[9px] text-brand-amber">Streaming...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator (non-streaming) */}
              {sending && !streamingText && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white/70 border border-white/80 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-indigo" />
                      <span className="text-xs text-tertiary">Agent sedang memproses...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        {selectedTenantId && (
          <div className="p-4 border-t border-brand-indigo/[0.06]">
            <div className="flex gap-2 max-w-2xl mx-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pertanyaan HR..."
                rows={1}
                className="resize-none min-h-[40px] max-h-[120px]"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                size="icon"
                className="shrink-0 h-10 w-10 bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
