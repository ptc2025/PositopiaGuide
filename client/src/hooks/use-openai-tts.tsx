import { useState, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export type VoiceOption = "nova" | "shimmer" | "alloy" | "echo" | "fable" | "onyx";

interface UseOpenAITTSOptions {
  voice?: VoiceOption;
  onError?: (error: Error) => void;
}

export function useOpenAITTS(options: UseOpenAITTSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const generateAndPlay = useCallback(async (text: string) => {
    try {
      setIsLoading(true);
      
      // Clean up previous audio if it exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      // Generate speech from OpenAI
      const response = await apiRequest("POST", "/api/tts/generate", {
        text,
        voice: options.voice || "nova", // Default to Nova (friendly female voice)
      });
      const result = await response.json();
      
      if (!result.audio) {
        throw new Error("No audio generated");
      }

      // Create audio element with the base64 audio
      const audio = new Audio(result.audio);
      audio.volume = 0.9;
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsSpeaking(false);
        if (options.onError) {
          options.onError(new Error("Failed to play audio"));
        }
      };

      audioRef.current = audio;
      await audio.play();
      
    } catch (error) {
      console.error("TTS generation error:", error);
      setIsSpeaking(false);
      if (options.onError) {
        options.onError(error as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [options.voice, options.onError]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsSpeaking(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  return {
    generateAndPlay,
    pause,
    resume,
    stop,
    isLoading,
    isSpeaking,
  };
}