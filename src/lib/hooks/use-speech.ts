"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechOptions {
  locale: "es" | "en";
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
}

export function useSpeech({ locale, onResult, onEnd }: UseSpeechOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimResult, setInterimResult] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = locale === "es" ? "es-MX" : "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript && onResult) {
          onResult(finalTranscript);
        }
        setInterimResult(interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (onEnd) onEnd();
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [locale, onResult, onEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    interimResult,
    startListening,
    stopListening,
    isSupported: !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    ),
  };
}
