"use client";

import { useEffect, useRef } from "react";
import { useInterviewStore } from "@/store/interview-store";

export function useLocalDraft(token: string) {
  const { messages, themeCoverage, elapsedSeconds, setAutoSaveStatus } =
    useInterviewStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    // Simulate auto-save status UI
    setAutoSaveStatus("saving");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      // Since Zustand persist middleware is active,
      // the data is already in localStorage.
      // We just update the status for the user.
      setAutoSaveStatus("saved");
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [messages, themeCoverage, elapsedSeconds, setAutoSaveStatus]);

  return null;
}
