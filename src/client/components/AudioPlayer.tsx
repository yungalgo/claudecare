import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { api } from "../lib/api.ts";

// --- Types ---

interface EnrichedWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

interface EnrichedSentence {
  speaker: "agent" | "customer";
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  words: EnrichedWord[];
}

interface EnrichedTranscriptData {
  transcriptSid: string;
  sentences: EnrichedSentence[];
  operators: unknown[];
  fetchedAt: string;
}

interface CallInfo {
  id: string;
  personName: string;
  duration: number;
  enrichedTranscript: EnrichedTranscriptData;
  createdAt: string;
}

interface PlayerState {
  call: CallInfo | null;
  isPlaying: boolean;
}

interface PlayerContextType {
  state: PlayerState;
  play: (callId: string) => void;
  close: () => void;
}

// --- Context ---

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

// --- Provider ---

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>({ call: null, isPlaying: false });

  const play = useCallback(async (callId: string) => {
    try {
      const call = await api.get<any>(`/calls/${callId}`);
      if (!call.enrichedTranscript) {
        toast.error("No transcript available for this call");
        return;
      }
      setState({
        call: {
          id: call.id,
          personName: "",
          duration: call.duration,
          enrichedTranscript: call.enrichedTranscript,
          createdAt: call.createdAt,
        },
        isPlaying: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load call");
    }
  }, []);

  const close = useCallback(() => {
    setState({ call: null, isPlaying: false });
  }, []);

  return (
    <PlayerContext.Provider value={{ state, play, close }}>
      {children}
      {state.call && <PlayerFooter />}
    </PlayerContext.Provider>
  );
}

// --- Footer Component ---

function PlayerFooter() {
  const { state, close } = usePlayer();
  const call = state.call!;
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(call.duration || 0);
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  const sentences = call.enrichedTranscript.sentences;

  // Auto-play on mount
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [call.id]);

  // Time update — use requestAnimationFrame for smoother word highlighting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let raf: number;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      raf = requestAnimationFrame(tick);
    };
    const onPlay = () => { setPlaying(true); raf = requestAnimationFrame(tick); };
    const onPause = () => { setPlaying(false); cancelAnimationFrame(raf); };
    const onDur = () => { if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration); };
    const onEnd = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnd);
    // Start ticking if already playing
    if (!audio.paused) { raf = requestAnimationFrame(tick); }
    return () => {
      cancelAnimationFrame(raf);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  // Auto-scroll to current sentence
  const scrollSentenceIdx = useRef(-1);
  useEffect(() => {
    const si = activeWordKey ? parseInt(activeWordKey.split("-")[0]!) : -1;
    if (si < 0 || si === scrollSentenceIdx.current || !transcriptRef.current) return;
    scrollSentenceIdx.current = si;
    const el = transcriptRef.current.children[si] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  function seekBar(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }

  function seekTo(time: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    if (!playing) audio.play();
  }

  function handleClose() {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    close();
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Find the globally active word: last word whose startTime <= currentTime.
  // This keeps the last spoken word highlighted during silence gaps.
  let activeWordKey: string | null = null;
  for (let si = sentences.length - 1; si >= 0; si--) {
    const s = sentences[si]!;
    for (let wi = s.words.length - 1; wi >= 0; wi--) {
      if (currentTime >= s.words[wi]!.startTime) {
        activeWordKey = `${si}-${wi}`;
        break;
      }
    }
    if (activeWordKey) break;
  }

  // Derive which sentence contains the active word
  const activeSentenceIdx = activeWordKey ? parseInt(activeWordKey.split("-")[0]!) : -1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.12)] animate-in" style={{ animation: "slideUp 0.3s ease-out" }}>
      <audio ref={audioRef} src={`/api/calls/${call.id}/recording`} preload="auto" />

      {/* Transcript panel */}
      {showTranscript && sentences.length > 0 && (
        <div className="bg-card border-t border-border max-h-[40vh] overflow-y-auto" ref={transcriptRef}>
          <div className="max-w-4xl mx-auto px-6 py-4 space-y-1">
            {sentences.map((sentence, si) => {
              const isCurrent = si === activeSentenceIdx;
              const isPast = si < activeSentenceIdx;
              const isBot = sentence.speaker === "agent";
              return (
                <button
                  key={si}
                  onClick={() => seekTo(sentence.startTime)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 cursor-pointer ${
                    isCurrent
                      ? "bg-primary-light ring-1 ring-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className={`text-xs font-semibold block mb-0.5 ${
                    isBot ? "text-primary" : "text-foreground"
                  } ${isPast ? "opacity-50" : ""}`}>
                    {isBot ? "claudecare" : "patient"}
                  </span>
                  <span className="text-sm leading-relaxed">
                    {sentence.words.length > 0 ? (
                      sentence.words.map((w, wi) => {
                        const key = `${si}-${wi}`;
                        const isActive = key === activeWordKey;
                        const isWordPast = activeWordKey !== null && (
                          si < activeSentenceIdx ||
                          (si === activeSentenceIdx && wi < parseInt(activeWordKey.split("-")[1]!))
                        );
                        return (
                          <span
                            key={wi}
                            onClick={(e) => { e.stopPropagation(); seekTo(w.startTime); }}
                            className={
                              isActive
                                ? "text-primary font-semibold"
                                : isWordPast
                                  ? isPast ? "text-muted-foreground/40" : "text-foreground"
                                  : "text-muted-foreground"
                            }
                          >
                            {w.word}{" "}
                          </span>
                        );
                      })
                    ) : (
                      <span className={isPast ? "text-muted-foreground/40" : "text-muted-foreground"}>
                        {sentence.text}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="bg-card border-t border-border">
        {/* Progress bar — click anywhere to seek */}
        <div className="relative h-3 bg-muted cursor-pointer flex items-center" onClick={seekBar}>
          <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${progress}%` }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0 cursor-pointer">
            {playing ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            )}
          </button>

          {/* Time */}
          <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Call info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Wellness Check — {new Date(call.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {fmt(duration)} call
            </p>
          </div>

          {/* Transcript toggle */}
          {sentences.length > 0 && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                showTranscript ? "bg-primary-light text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={showTranscript ? "Hide transcript" : "Show transcript"}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </button>
          )}

          {/* Close */}
          <button onClick={handleClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer" title="Close player">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
