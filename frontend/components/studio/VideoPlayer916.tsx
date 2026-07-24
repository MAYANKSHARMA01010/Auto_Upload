"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { diskPathToUrl } from "@/lib/manifests";

interface VideoPlayer916Props {
  videoPath: string;
  coverPath: string;
  projectTitle: string;
  onCoverCapture?: (timestamp: number) => void;
}

const COVER_TIMESTAMPS = [1, 2.5, 5];

export function VideoPlayer916({ videoPath, coverPath, projectTitle, onCoverCapture }: VideoPlayer916Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<{ ts: number; url: string }[]>([]);
  const [selectedCoverTs, setSelectedCoverTs] = useState<number | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoUrl = diskPathToUrl(videoPath);
  const coverUrl = diskPathToUrl(coverPath);

  // Reset state when video changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCapturedFrames([]);
    setSelectedCoverTs(null);
    setVideoError(false);
  }, [videoPath]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const captureFrame = useCallback(async (ts: number) => {
    const v = videoRef.current;
    const canvas = canvasRef.current;
    if (!v || !canvas) return null;
    setIsCapturing(true);
    const prev = v.currentTime;
    v.currentTime = ts;
    await new Promise<void>((res) => {
      const handler = () => { v.removeEventListener("seeked", handler); res(); };
      v.addEventListener("seeked", handler);
    });
    const ctx = canvas.getContext("2d");
    if (!ctx) { setIsCapturing(false); return null; }
    canvas.width = v.videoWidth || 270;
    canvas.height = v.videoHeight || 480;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", 0.8);
    v.currentTime = prev;
    setIsCapturing(false);
    return { ts, url };
  }, []);

  const handleCaptureAllFrames = async () => {
    if (!videoRef.current || videoError) return;
    const frames: { ts: number; url: string }[] = [];
    for (const ts of COVER_TIMESTAMPS) {
      if (ts < duration) {
        const frame = await captureFrame(ts);
        if (frame) frames.push(frame);
      }
    }
    setCapturedFrames(frames);
  };

  const selectCoverFrame = (ts: number) => {
    setSelectedCoverTs(ts);
    onCoverCapture?.(ts);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 h-full overflow-y-auto pb-4">
      {/* 9:16 Video Container */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-outline-variant flex-shrink-0"
        style={{ width: "270px", height: "480px" }}
      >
        {videoUrl && !videoError ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={() => setVideoError(true)}
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            {/* Cover image fallback */}
            {coverUrl && !videoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-surface-container/80 backdrop-blur flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-3xl">videocam_off</span>
              </div>
              <p className="text-xs text-on-surface-variant text-center px-4">
                {videoError ? "Video unavailable — check path" : "No video selected"}
              </p>
            </div>
          </div>
        )}

        {/* Play overlay */}
        {videoUrl && !videoError && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className={[
              "w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center",
              "transition-all duration-200",
              isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100",
            ].join(" ")}>
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </div>
          </button>
        )}

        {/* 9:16 badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-[9px] text-white font-mono font-bold">9:16</span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
          <p className="text-white text-xs font-medium truncate">{projectTitle}</p>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Timeline & Controls */}
      {videoUrl && !videoError && (
        <div className="w-full max-w-[270px] space-y-3">
          {/* Progress */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#c3c0ff" }}
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">volume_up</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#c3c0ff" }}
            />
          </div>
        </div>
      )}

      {/* Cover Frame Selector */}
      <div className="w-full max-w-[270px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-on-surface-variant">Cover Frame</span>
          <button
            onClick={handleCaptureAllFrames}
            disabled={isCapturing || !videoUrl || videoError || duration === 0}
            className="text-[10px] text-primary hover:text-primary/80 disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            {isCapturing ? "Capturing…" : "Capture Frames"}
          </button>
        </div>

        {capturedFrames.length > 0 ? (
          <div className="flex gap-2">
            {capturedFrames.map(({ ts, url }) => (
              <button
                key={ts}
                onClick={() => selectCoverFrame(ts)}
                className={[
                  "flex-1 rounded-lg overflow-hidden border-2 transition-all duration-200",
                  selectedCoverTs === ts
                    ? "border-primary shadow-[0_0_10px_rgba(195,192,255,0.4)]"
                    : "border-outline-variant hover:border-outline",
                ].join(" ")}
                style={{ aspectRatio: "9/16" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Frame at ${ts}s`} className="w-full h-full object-cover" />
                <p className="text-[9px] text-on-surface-variant text-center py-0.5">{ts}s</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            {COVER_TIMESTAMPS.map((ts) => (
              <div
                key={ts}
                className="flex-1 rounded-lg border border-outline-variant bg-surface-container flex items-center justify-center py-4"
                style={{ aspectRatio: "9/16" }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">image</span>
                  <span className="text-[9px] text-on-surface-variant">{ts}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
