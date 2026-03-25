"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuddyAvatar } from "./BuddyAvatar";
import type { LessonManifest } from "@/lib/types";

interface BuddyChatDrawerProps {
  manifest: LessonManifest;
  currentSegmentIdx: number;
  onClose: () => void;
}

interface DrawerMessage {
  id: string;
  role: "buddy" | "user";
  content: string;
}

let _id = 0;

export function BuddyChatDrawer({ manifest, currentSegmentIdx, onClose }: BuddyChatDrawerProps) {
  const seg = manifest.segments[currentSegmentIdx] ?? manifest.segments[0];
  const buddyName = typeof window !== "undefined" ? localStorage.getItem("notestok:buddy-name") || "Toki" : "Toki";

  const [messages, setMessages] = useState<DrawerMessage[]>([
    {
      id: `d-${_id++}`,
      role: "buddy",
      content: `Hey! I'm here to help with "${manifest.title}". Ask me anything about the lesson! 💡`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg: DrawerMessage = { id: `d-${_id++}`, role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: {
            segmentContent: seg.content,
            segmentTitle: seg.title,
            lessonTitle: manifest.title,
            subject: manifest.subject,
            learnerProfile: manifest.learnerProfile,
          },
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: `d-${_id++}`, role: "buddy", content: data.reply || "Hmm, I'm not sure about that. Try rephrasing?" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `d-${_id++}`, role: "buddy", content: "Oops, something went wrong. Try again?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl border-t shadow-xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <BuddyAvatar size="sm" />
            <span className="text-sm font-semibold">{buddyName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "buddy" && <BuddyAvatar size="sm" />}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <BuddyAvatar size="sm" className="opacity-0" />
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about this lesson..."
              disabled={loading}
              className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-1 ring-primary disabled:opacity-50"
            />
            <Button size="icon" className="h-9 w-9" onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
