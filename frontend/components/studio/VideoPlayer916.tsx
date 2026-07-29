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
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);

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
    setShowCoverOptions(false);
    setIsFullscreenModal(false);
  }, [videoPath]);

  // ESC key listener for Fullscreen modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreenModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleFullscreen = () => {
    setIsFullscreenModal((prev) => !prev);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadOriginal = async () => {
    if (!videoUrl || isDownloading) return;
    setIsDownloading(true);

    const cleanTitle = (projectTitle || "short_video")
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    const suggestedName = `${cleanTitle}_original_max_quality.mp4`;

    try {
      // 1. Native OS "Save As..." File Picker API (Asks user where to save file!)
      if ("showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: "MP4 Video File",
                accept: { "video/mp4": [".mp4"] },
              },
            ],
          });
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return; // User cancelled save dialog
        }
      }

      // 2. Fallback: Fetch blob & trigger link download
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = suggestedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-start gap-2.5 w-full max-w-[320px] mx-auto py-1">
      {/* 9:16 Video Container */}
      <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-outline-variant w-full max-w-[310px] aspect-[9/16] shrink-0">
        {videoUrl && !videoError ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover cursor-pointer"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={() => setVideoError(true)}
            onDoubleClick={handleFullscreen}
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
              <div className="w-12 h-12 rounded-full bg-surface-container/80 backdrop-blur flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">videocam_off</span>
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
              "w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center",
              "transition-all duration-200",
              isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100",
            ].join(" ")}>
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </div>
          </button>
        )}

        {/* Top right badges & Fullscreen button */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          <button
            onClick={handleFullscreen}
            className="bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-1 text-white transition-all border border-white/20 shadow-md"
            title="View Fullscreen (Double click video)"
          >
            <span className="material-symbols-outlined text-sm block">fullscreen</span>
          </button>
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
            <span className="text-[9px] text-white font-mono font-bold">9:16</span>
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
          <p className="text-white text-[11px] font-medium truncate">{projectTitle}</p>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Timeline & Controls */}
      {videoUrl && !videoError && (
        <div className="w-full max-w-[310px] space-y-2 flex-shrink-0 px-1">
          {/* Progress Bar & Play Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={togglePlay}
              className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? "pause_circle" : "play_circle"}
              </span>
            </button>
            <div className="flex-1 space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 rounded-lg cursor-pointer appearance-none transition-all"
                style={{
                  accentColor: "#a5b4fc",
                  background: `linear-gradient(to right, #818cf8 ${(duration > 0 ? (currentTime / duration) * 100 : 0)}%, rgba(255, 255, 255, 0.18) ${(duration > 0 ? (currentTime / duration) * 100 : 0)}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] font-mono text-on-surface-variant font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Volume, Fullscreen, Download & Toggle Cover Options */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  const newVol = volume === 0 ? 0.8 : 0;
                  setVolume(newVol);
                  if (videoRef.current) videoRef.current.volume = newVol;
                }}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                title="Toggle Mute"
              >
                <span className="material-symbols-outlined text-lg">
                  {volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
                </span>
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1.5 rounded-lg cursor-pointer appearance-none transition-all"
                style={{
                  accentColor: "#a5b4fc",
                  background: `linear-gradient(to right, #818cf8 ${volume * 100}%, rgba(255, 255, 255, 0.18) ${volume * 100}%)`,
                }}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownloadOriginal}
                disabled={!videoUrl || videoError || isDownloading}
                className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors font-medium shadow-sm"
                title="Download Original Master Video (Uncompressed 4K/1080p, Max FPS & Bitrate)"
              >
                <span className={`material-symbols-outlined text-sm ${isDownloading ? "animate-spin" : ""}`}>
                  {isDownloading ? "sync" : "download"}
                </span>
                <span>{isDownloading ? "Saving…" : "Download"}</span>
              </button>

              <button
                onClick={() => setShowCoverOptions(!showCoverOptions)}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg transition-colors font-medium"
                title="Select Cover Frame"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>{showCoverOptions ? "Hide" : "Cover"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Cover Frame Selector (ONLY shown when requested) */}
      {showCoverOptions && (
        <div className="w-full max-w-[310px] space-y-2 flex-shrink-0 pt-2 border-t border-outline-variant/60 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Choose Cover Frame</span>
            <button
              onClick={handleCaptureAllFrames}
              disabled={isCapturing || !videoUrl || videoError || duration === 0}
              className="text-[10px] text-primary hover:text-primary/80 disabled:opacity-40 flex items-center gap-1 transition-colors underline"
            >
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
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container flex items-center justify-center py-3"
                  style={{ aspectRatio: "9/16" }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-on-surface-variant text-base">image</span>
                    <span className="text-[9px] text-on-surface-variant">{ts}s</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 9:16 Fullscreen Modal (Preserves 9:16 aspect ratio 100%, never stretching to 16:9!) ── */}
      {isFullscreenModal && videoUrl && !videoError && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Top header bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-[300px]">{projectTitle}</span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                9:16 Master Aspect Ratio
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadOriginal}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all font-semibold"
                title="Download Original Master Video (Uncompressed 4K/1080p, Max FPS & Bitrate)"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download Master</span>
              </button>

              <button
                onClick={() => setIsFullscreenModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/20"
                title="Close Fullscreen (Esc)"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* 9:16 Video Player Box */}
          <div className="relative h-[82vh] max-h-[850px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black flex items-center justify-center">
            <video
              src={videoUrl}
              className="w-full h-full object-contain cursor-pointer"
              autoPlay
              playsInline
              controls
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Bottom ESC hint */}
          <p className="text-[11px] text-white/50 font-mono mt-3">Press Esc or click Close to exit</p>
        </div>
      )}
    </div>
  );
}
