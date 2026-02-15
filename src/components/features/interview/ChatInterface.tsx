"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useMemo } from "react";
import { useInterviewStore } from "@/store/interview-store";
import { Message } from "@/lib/types/interview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send, StopCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/hooks/use-speech";
import { useLocalDraft } from "@/lib/hooks/use-local-draft";
import { translations } from "@/lib/constants/i18n";

interface ChatInterfaceProps {
  token: string;
  initialMessages?: Message[];
  themeCoverage: Record<string, boolean>;
  locale: "es" | "en";
}

export function ChatInterface({
  token,
  initialMessages = [],
  themeCoverage,
  locale,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const t = translations[locale];

  const {
    messages: storeMessages,
    setMessages: setStoreMessages,
    isRecording: isStoreRecording,
    setIsRecording: setStoreIsRecording,
    autoSaveStatus,
    connectionState,
  } = useInterviewStore();

  useLocalDraft(token);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: {
          token,
          themeCoverage,
          locale,
        },
      }),
    [token, themeCoverage, locale],
  );

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
  } = useChat({
    transport,
    messages:
      storeMessages.length > 0
        ? (storeMessages as any)
        : (initialMessages as any),
    onFinish: ({ message }) => {
      setStoreMessages([...(messages as any), message as any]);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const { isListening, interimResult, startListening, stopListening } =
    useSpeech({
      locale,
      onResult: (result) => {
        setInputValue((prev) => prev + " " + result);
      },
    });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, interimResult]);

  // Sync store on mount if initialMessages provided
  useEffect(() => {
    if (storeMessages.length === 0 && initialMessages.length > 0) {
      setStoreMessages(initialMessages);
    }
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    sendMessage({
      parts: [{ type: "text", text: inputValue }],
    } as any);
    setInputValue("");
  };

  const getMessageContent = (m: any) => {
    if (m.content) return m.content;
    if (m.parts) {
      return m.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
    }
    return "";
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto border rounded-xl bg-background overflow-hidden shadow-lg">
      {/* Header Info */}
      <div className="px-4 py-2 border-b bg-muted/30 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              connectionState === "connected" ? "bg-green-500" : "bg-red-500",
            )}
          />
          {connectionState === "connected" ? t.connected : t.disconnected}
        </div>
        <div className="flex items-center gap-2">
          {autoSaveStatus === "saving" && (
            <RefreshCw className="h-3 w-3 animate-spin" />
          )}
          {autoSaveStatus === "saved" ? t.all_saved : t.saving}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="space-y-4">
          {messages.map((m: any) => (
            <div
              key={m.id}
              role="article"
              aria-label={`${m.role === "user" ? "Your message" : "AI message"}: ${getMessageContent(m)}`}
              className={cn(
                "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {getMessageContent(m)}
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted w-max max-w-[80%] rounded-lg px-3 py-2 text-sm animate-pulse text-muted-foreground">
              {t.thinking}
            </div>
          )}
          {interimResult && (
            <div className="ml-auto bg-primary/50 text-primary-foreground w-max max-w-[80%] rounded-lg px-3 py-2 text-sm italic">
              {interimResult}
            </div>
          )}
          {chatError && (
            <div className="bg-red-50 text-red-500 w-full rounded-lg px-3 py-2 text-xs border border-red-100">
              Error: {chatError.message}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-muted/10 flex gap-2 items-center"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleMicClick}
          className={cn(
            isListening && "bg-red-100 border-red-500 text-red-500",
          )}
        >
          {isListening ? (
            <StopCircle className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t.type_response}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
