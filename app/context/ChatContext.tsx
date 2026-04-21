"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";

interface ChatContextType {
  messages: UIMessage[];
  input: string;
  setInput: (v: string) => void;
  send: () => void;
  sendText: (text: string) => void;
  isLoading: boolean;
  status: string;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  }, [input, sendMessage]);

  const sendText = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage]
  );

  return (
    <ChatContext.Provider value={{ messages, input, setInput, send, sendText, isLoading, status }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useAppChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useAppChat must be used within ChatProvider");
  return ctx;
}
