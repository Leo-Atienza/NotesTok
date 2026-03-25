"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuddyAvatar } from "./BuddyAvatar";
import { ProfileSelectCards } from "./ProfileSelectCards";
import type { ChatMessage, LearnerProfile, LessonManifest } from "@/lib/types";

interface BuddyChatProps {
  onLessonReady: (manifest: LessonManifest) => void;
  buddyName: string;
  onBuddyNameChange: (name: string) => void;
}

type ConversationState =
  | "welcome"
  | "analyzing"
  | "profile-select"
  | "generating"
  | "lesson-ready"
  | "error";

let nextId = 0;
function msgId() {
  return `msg-${Date.now()}-${nextId++}`;
}

function buddyMsg(content: string, type: ChatMessage["type"] = "text"): ChatMessage {
  return { id: msgId(), role: "buddy", content, type, timestamp: Date.now() };
}

function userMsg(content: string, type: ChatMessage["type"] = "text"): ChatMessage {
  return { id: msgId(), role: "user", content, type, timestamp: Date.now() };
}

export function BuddyChat({ onLessonReady, buddyName, onBuddyNameChange }: BuddyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<ConversationState>("welcome");
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(buddyName);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([
      buddyMsg(
        `Hey! I'm ${buddyName}, your AI study buddy 🧠\n\nSend me your notes and I'll turn them into a personalized study session!\n\nYou can paste text, or tap 📎 to upload a file (PDF, image, or audio).`
      ),
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addMessages = useCallback((...msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  const analyzeContent = useCallback(
    async (formData: FormData) => {
      setState("analyzing");
      addMessages(buddyMsg("Got it! Analyzing your notes... 📚"));

      try {
        const res = await fetch("/api/analyze", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to analyze notes");
        }
        const data = await res.json();
        setAnalysis(data);
        setState("profile-select");
        addMessages(
          buddyMsg(
            `Found ${data.concepts?.length ?? 0} key concepts in **${data.subject}**!\n\nBefore I create your lesson, how do you learn best?`
          )
        );
      } catch (err) {
        setState("error");
        addMessages(
          buddyMsg(
            `Oops, something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Try again?`
          )
        );
      }
    },
    [addMessages]
  );

  const generateLesson = useCallback(
    async (profile: LearnerProfile) => {
      if (!analysis) return;
      setState("generating");
      const profileLabels: Record<LearnerProfile, string> = {
        "focus-seeker": "Focus Mode ⚡",
        "multi-modal": "Listen Mode 🎧",
        "global-scholar": "Global Scholar 🌍",
      };
      addMessages(
        userMsg(`${profileLabels[profile]}`, "profile-select"),
        buddyMsg(`Great choice! Creating your ${profileLabels[profile]} lesson... This takes ~15 seconds ⏳`)
      );

      try {
        const res = await fetch("/api/generate-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...analysis, learnerProfile: profile }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to generate lesson");
        }
        const manifest: LessonManifest = await res.json();
        manifest.learnerProfile = profile;
        setState("lesson-ready");
        addMessages(
          buddyMsg(
            `Your lesson on **${manifest.title}** is ready! 🚀\n\n${manifest.segments.length} segments, ${manifest.totalXP} XP available, ~${manifest.estimatedMinutes} min.`,
            "lesson-ready"
          )
        );

        // Small delay so user sees the message
        setTimeout(() => onLessonReady(manifest), 800);
      } catch (err) {
        setState("error");
        addMessages(
          buddyMsg(
            `Something went wrong generating the lesson: ${err instanceof Error ? err.message : "Unknown error"}. Try again?`
          )
        );
      }
    },
    [analysis, addMessages, onLessonReady]
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");

    if (state === "error") {
      // Reset to allow retry
      setState("welcome");
    }

    if (trimmed.length < 50) {
      addMessages(
        userMsg(trimmed),
        buddyMsg("I need a bit more to work with — paste at least 50 characters of study notes!")
      );
      return;
    }

    addMessages(userMsg(trimmed));
    const formData = new FormData();
    formData.append("text", trimmed);
    analyzeContent(formData);
  };

  const handleFileUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    const label = isImage
      ? `📷 ${file.name}`
      : isAudio
        ? `🎵 ${file.name}`
        : `📄 ${file.name}`;

    addMessages(userMsg(label, "upload"));

    const formData = new FormData();
    formData.append("file", file);
    analyzeContent(formData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInputDisabled = state === "analyzing" || state === "generating" || state === "lesson-ready";

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with buddy name */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-lg">
        <BuddyAvatar size="sm" />
        {isEditingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = nameInput.trim() || "Toki";
              onBuddyNameChange(n);
              setIsEditingName(false);
            }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="text-sm font-semibold bg-muted rounded px-2 py-0.5 w-28 outline-none focus:ring-1 ring-primary"
              maxLength={20}
            />
            <button type="submit" className="text-xs text-primary font-medium">
              Save
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setNameInput(buddyName);
              setIsEditingName(true);
            }}
            className="text-sm font-semibold hover:text-primary transition-colors"
            title="Click to rename"
          >
            {buddyName} ✏️
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">AI Study Buddy</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "buddy" && <BuddyAvatar size="sm" />}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Profile select cards inline */}
        {state === "profile-select" && (
          <div className="flex gap-2.5">
            <BuddyAvatar size="sm" className="opacity-0" />
            <ProfileSelectCards onSelect={generateLesson} />
          </div>
        )}

        {/* Loading indicator */}
        {(state === "analyzing" || state === "generating") && (
          <div className="flex gap-2.5">
            <BuddyAvatar size="sm" className="opacity-0" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {state === "analyzing" ? "Reading your notes..." : "Creating your lesson..."}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t px-4 py-3 bg-background">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isInputDisabled}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.mp3,.m4a,.wav,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInputDisabled
                ? "Working on it..."
                : "Paste your study notes here..."
            }
            disabled={isInputDisabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm outline-none focus:ring-1 ring-primary min-h-[40px] max-h-[120px] disabled:opacity-50"
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={isInputDisabled || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
