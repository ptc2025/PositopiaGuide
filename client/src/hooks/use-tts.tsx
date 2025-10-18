import { useRef, useEffect, useCallback } from "react";

interface UseTTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useTTS(options: UseTTSOptions = {}) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup: cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.warn("Text-to-speech is not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties
    utterance.rate = options.rate || 0.9; // Slightly slower for children
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    
    // Try to use a friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria'))
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("TTS error:", event);
      isSpeakingRef.current = false;
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [options.rate, options.pitch, options.volume]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeakingRef.current) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      utteranceRef.current = null;
    }
  }, []);

  const isSpeaking = useCallback(() => {
    return isSpeakingRef.current && window.speechSynthesis?.speaking;
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
  };
}