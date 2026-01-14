import { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioInputProps {
  onSubmit: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function AudioInput({ onSubmit, disabled }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const clearRecording = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onSubmit(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {!audioBlob ? (
        <div className="text-center py-8">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              className={cn(
                "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary text-primary-foreground hover:scale-105",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRecording ? (
                <Square className="w-8 h-8" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
              )}
            </button>

            <div className="space-y-1">
              {isRecording ? (
                <>
                  <p className="text-lg font-medium text-destructive">Recording...</p>
                  <p className="text-2xl font-mono text-foreground">{formatTime(duration)}</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">Click to start recording</p>
                  <p className="text-sm text-muted-foreground">
                    Speak your math problem clearly
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-muted">"square root of"</span>
              <span className="px-2 py-1 rounded bg-muted">"x raised to the power of"</span>
              <span className="px-2 py-1 rounded bg-muted">"integral of"</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayback}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Duration: {formatTime(duration)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearRecording} disabled={disabled} className="flex-1">
              Record Again
            </Button>
            <Button onClick={handleSubmit} disabled={disabled} className="flex-1 gap-2">
              <Upload className="w-4 h-4" />
              Transcribe Audio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
