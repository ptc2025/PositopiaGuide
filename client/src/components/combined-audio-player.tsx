import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useTTS } from "@/hooks/use-tts";
import type { AudioFile, Affirmation } from "@shared/schema";

interface CombinedAudioPlayerProps {
  audioFile?: AudioFile;
  affirmation?: Affirmation;
  onComplete?: () => void;
}

export function CombinedAudioPlayer({ audioFile, affirmation, onComplete }: CombinedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(audioFile?.volume ? audioFile.volume / 100 : 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { speak, pause: pauseTTS, resume: resumeTTS, stop: stopTTS } = useTTS({
    rate: 0.85, // Slower for children
    pitch: 1.1, // Slightly higher pitch for friendliness
    volume: 0.9,
  });

  // Construct the proper URL for accessing the audio file through our objects endpoint
  const audioUrl = audioFile?.filePath ? `/objects${audioFile.filePath}` : '';

  // Auto-start playback when component mounts or content changes
  useEffect(() => {
    if ((audioFile || affirmation) && !hasStarted) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        startPlayback();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [audioFile, affirmation, hasStarted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      stopTTS();
      if (onComplete) onComplete();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [stopTTS, onComplete]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.volume = isMuted ? 0 : volume * 0.5; // Music at 50% volume so TTS is clear
    }
  }, [volume, isMuted, audioUrl]);

  const startPlayback = () => {
    setHasStarted(true);
    
    // Start music if available
    if (audioRef.current && audioUrl) {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
      });
    }

    // Start TTS for affirmation if available
    if (affirmation?.text) {
      // Small delay to let music start first
      setTimeout(() => {
        speak(affirmation.text);
      }, 300);
    }

    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!hasStarted) {
      startPlayback();
      return;
    }

    if (isPlaying) {
      // Pause both music and TTS
      if (audioRef.current && audioUrl) {
        audioRef.current.pause();
      }
      pauseTTS();
      setIsPlaying(false);
    } else {
      // Resume both music and TTS
      if (audioRef.current && audioUrl) {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
        });
      }
      resumeTTS();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    // Stop everything
    if (audioRef.current && audioUrl) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopTTS();
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    
    // Restart after a brief delay
    setTimeout(() => {
      startPlayback();
    }, 100);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Don't render player if there's no content
  if (!audioFile && !affirmation) {
    return null;
  }

  return (
    <div className="bg-card border border-card-border rounded-lg p-6" data-testid="component-combined-audio-player">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      <div className="flex flex-col gap-4">
        {audioFile && (
          <div className="text-center">
            <h3 className="font-semibold text-lg text-card-foreground" data-testid="text-audio-name">
              🎵 {audioFile.name}
            </h3>
            {affirmation && (
              <p className="text-sm text-muted-foreground mt-1">
                Playing music with affirmation
              </p>
            )}
          </div>
        )}

        {/* Play/Pause and Restart Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={togglePlay}
            size="lg"
            className="w-20 h-20 rounded-full"
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
          <Button
            onClick={handleRestart}
            size="lg"
            variant="outline"
            className="w-20 h-20 rounded-full"
            data-testid="button-restart"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Bar (only show if we have music) */}
        {audioUrl && (
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
              data-testid="slider-progress"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span data-testid="text-current-time">{formatTime(currentTime)}</span>
              <span data-testid="text-duration">{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            data-testid="button-mute"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
            data-testid="slider-volume"
          />
        </div>

        {/* Info Text */}
        {affirmation && !audioFile && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Speaking affirmation...</p>
          </div>
        )}
      </div>
    </div>
  );
}