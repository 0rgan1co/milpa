import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Message } from "@/lib/types/interview";

interface InterviewState {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  themeCoverage: Record<string, boolean>;
  elapsedSeconds: number;
  autoSaveStatus: "saved" | "saving" | "error";
  connectionState: "connected" | "disconnected" | "reconnecting";

  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  updateThemeCoverage: (theme: string, covered: boolean) => void;
  setThemeCoverage: (coverage: Record<string, boolean>) => void;
  incrementTimer: () => void;
  setElapsedSeconds: (seconds: number) => void;
  setAutoSaveStatus: (status: "saved" | "saving" | "error") => void;
  setConnectionState: (
    state: "connected" | "disconnected" | "reconnecting",
  ) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      messages: [],
      isRecording: false,
      isProcessing: false,
      themeCoverage: {},
      elapsedSeconds: 0,
      autoSaveStatus: "saved",
      connectionState: "connected",

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      setMessages: (messages) => set({ messages }),

      setIsRecording: (isRecording) => set({ isRecording }),

      setIsProcessing: (isProcessing) => set({ isProcessing }),

      updateThemeCoverage: (theme, covered) =>
        set((state) => ({
          themeCoverage: { ...state.themeCoverage, [theme]: covered },
        })),

      setThemeCoverage: (themeCoverage) => set({ themeCoverage }),

      incrementTimer: () =>
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

      setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),

      setAutoSaveStatus: (autoSaveStatus) => set({ autoSaveStatus }),

      setConnectionState: (connectionState) => set({ connectionState }),

      reset: () =>
        set({
          messages: [],
          isRecording: false,
          isProcessing: false,
          themeCoverage: {},
          elapsedSeconds: 0,
          autoSaveStatus: "saved",
          connectionState: "connected",
        }),
    }),
    {
      name: "milpa-interview-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist essential state
      partialize: (state) => ({
        messages: state.messages,
        themeCoverage: state.themeCoverage,
        elapsedSeconds: state.elapsedSeconds,
      }),
    },
  ),
);
