"""
FFmpegService — extracts video metadata using FFmpeg subprocess calls.
"""
import asyncio
import json
import subprocess
import tempfile
import os
from pathlib import Path
from typing import Optional


class VideoMetadata:
    """Holds extracted FFmpeg video metadata."""

    def __init__(
        self,
        duration: Optional[float] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        size: Optional[int] = None,
        codec: Optional[str] = None,
        fps: Optional[float] = None,
    ) -> None:
        self.duration = duration
        self.width = width
        self.height = height
        self.size = size
        self.codec = codec
        self.fps = fps


class FFmpegService:
    """Wraps FFmpeg/FFprobe for video metadata extraction."""

    @staticmethod
    def is_ffprobe_available() -> bool:
        """Check if ffprobe is available on the system."""
        try:
            subprocess.run(
                ["ffprobe", "-version"],
                capture_output=True,
                check=True,
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    @staticmethod
    def extract_metadata_from_bytes(video_bytes: bytes) -> VideoMetadata:
        """
        Write video bytes to a temp file and run ffprobe to extract metadata.
        Returns VideoMetadata object.
        """
        meta = VideoMetadata(size=len(video_bytes))

        try:
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name

            result = subprocess.run(
                [
                    "ffprobe",
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_streams",
                    "-show_format",
                    tmp_path,
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)
                format_info = data.get("format", {})
                streams = data.get("streams", [])

                # Extract duration
                duration_str = format_info.get("duration")
                if duration_str:
                    meta.duration = float(duration_str)

                # Find video stream
                for stream in streams:
                    if stream.get("codec_type") == "video":
                        meta.width = stream.get("width")
                        meta.height = stream.get("height")
                        meta.codec = stream.get("codec_name")

                        # Calculate FPS
                        avg_frame_rate = stream.get("avg_frame_rate", "0/1")
                        if "/" in avg_frame_rate:
                            num, den = avg_frame_rate.split("/")
                            if int(den) > 0:
                                meta.fps = round(int(num) / int(den), 2)
                        break

        except Exception:
            pass  # Return partial metadata if ffprobe fails
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

        return meta

    @staticmethod
    async def extract_metadata_async(video_bytes: bytes) -> VideoMetadata:
        """Async wrapper around extract_metadata_from_bytes."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, FFmpegService.extract_metadata_from_bytes, video_bytes
        )


ffmpeg_service = FFmpegService()
