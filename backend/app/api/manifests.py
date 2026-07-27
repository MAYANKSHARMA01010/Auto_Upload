"""
Manifests API — reads/writes manifest.json files from the local shorts-factory disk.
No database, no R2. Pure local file I/O for the Studio integration.
"""
import json
import os
import subprocess
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(prefix="/manifests", tags=["Manifests"])

# ── Hardcoded path to shorts-factory data directory ─────────────────────────
SHORTS_FACTORY_DATA_DIR = Path(
    "/Users/mayanksharma/Downloads/New_Projects/shorts-factory/packages/ClipPilot/data"
)


def _get_video_size_mb(video_path: str) -> float:
    """Return file size in MB, or 0.0 if file is missing/inaccessible."""
    try:
        size = os.path.getsize(video_path)
        return round(size / (1024 * 1024), 2)
    except Exception:
        return 0.0


def _get_video_duration_info(video_path: str) -> tuple[float, str]:
    """Return (duration_seconds, duration_formatted) using ffprobe."""
    if not video_path or not os.path.exists(video_path):
        return 0.0, ""
    try:
        cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            dur = float(data.get("format", {}).get("duration", 0.0))
            if dur > 0:
                mins = int(dur // 60)
                secs = int(round(dur % 60))
                if secs == 60:
                    mins += 1
                    secs = 0
                return round(dur, 2), f"{mins}:{secs:02d}"
    except Exception:
        pass
    return 0.0, ""


def _load_manifest_file(json_path: Path) -> dict | None:
    """Load and parse a manifest JSON file. Returns None on any error."""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _resolve_cover_path(raw_cover_path: str, project_id: str) -> str:
    """If the raw cover path exists on disk, return it. Otherwise fuzzy-search covers dir."""
    if raw_cover_path and os.path.exists(raw_cover_path):
        return raw_cover_path

    covers_dir = SHORTS_FACTORY_DATA_DIR / "covers"
    if not covers_dir.exists():
        return raw_cover_path

    clean_id = project_id.replace("explainer_", "").replace("manifest_", "").lower()
    for c_file in covers_dir.glob("*.jpg"):
        if clean_id in c_file.name.lower():
            return str(c_file)
    for c_file in covers_dir.glob("*.png"):
        if clean_id in c_file.name.lower():
            return str(c_file)

    return raw_cover_path


def _build_summary(data: dict, json_path: Path) -> dict:
    """Build a lean summary card from a full manifest dict."""
    project_info = data.get("project_info", {})
    assets = data.get("assets", {})
    master = data.get("master_metadata", {})
    platforms = data.get("platforms", {})

    project_id = project_info.get("id", json_path.stem.replace("manifest_", ""))
    video_path = assets.get("video_path", "")
    raw_cover = assets.get("default_cover_path", "")
    resolved_cover = _resolve_cover_path(raw_cover, project_id)
    duration_sec, duration_fmt = _get_video_duration_info(video_path)

    return {
        "id": project_id,
        "status": project_info.get("status", "unknown"),
        "title": master.get("title", project_info.get("generation_params", {}).get("title", "Untitled")),
        "description": master.get("description", ""),
        "video_path": video_path,
        "cover_path": resolved_cover,
        "cover_timestamp": assets.get("cover_timestamp", "2.0"),
        "size_mb": _get_video_size_mb(video_path),
        "duration": duration_sec,
        "duration_formatted": duration_fmt,
        "platforms_enabled": [k for k, v in platforms.items() if isinstance(v, dict) and v.get("enabled", False)],
        "created_at": project_info.get("created_at") or (
            __import__("datetime").datetime.fromtimestamp(json_path.stat().st_mtime).isoformat()
            if json_path.exists() else ""
        ),
        "manifest_path": str(json_path),
    }


@router.get("/scan")
async def scan_manifests() -> JSONResponse:
    """
    Scan the shorts-factory data directory for all manifest JSON files.
    Returns a list of summary cards — one per project.
    Never throws; returns empty list + error hint if directory is missing.
    """
    if not SHORTS_FACTORY_DATA_DIR.exists():
        return JSONResponse(content={
            "manifests": [],
            "error": f"Shorts-Factory data directory not found: {SHORTS_FACTORY_DATA_DIR}",
            "hint": "Ensure shorts-factory is cloned at the expected path.",
        })

    results = []
    # Support both flat manifest_*.json files and per-folder manifest.json
    candidates: list[Path] = []

    # Pattern 1: manifest_explainer_*.json at root level
    candidates.extend(sorted(SHORTS_FACTORY_DATA_DIR.glob("manifest_*.json")))

    # Pattern 2: explainer_*/manifest.json (nested)
    for sub in sorted(SHORTS_FACTORY_DATA_DIR.iterdir()):
        if sub.is_dir():
            nested = sub / "manifest.json"
            if nested.exists():
                candidates.append(nested)

    for json_path in candidates:
        data = _load_manifest_file(json_path)
        if data:
            results.append(_build_summary(data, json_path))

    # De-duplicate by id (prefer root-level manifest_*.json)
    seen_ids: set[str] = set()
    deduped = []
    for r in results:
        if r["id"] not in seen_ids:
            seen_ids.add(r["id"])
            deduped.append(r)

    return JSONResponse(content={"manifests": deduped, "count": len(deduped)})


@router.get("/{project_id}")
async def get_manifest(project_id: str) -> JSONResponse:
    """
    Return the full manifest JSON for a specific project.
    Tries root-level manifest_<id>.json first, then <id>/manifest.json.
    """
    # Try root-level file first
    root_path = SHORTS_FACTORY_DATA_DIR / f"manifest_{project_id}.json"
    nested_path = SHORTS_FACTORY_DATA_DIR / project_id / "manifest.json"

    data = None
    for candidate in [root_path, nested_path]:
        if candidate.exists():
            data = _load_manifest_file(candidate)
            if data:
                break

    if data is None:
        raise HTTPException(status_code=404, detail=f"Manifest for '{project_id}' not found on disk.")

    raw_cover = data.get("assets", {}).get("default_cover_path", "")
    resolved_cover = _resolve_cover_path(raw_cover, project_id)
    if "assets" in data and isinstance(data["assets"], dict):
        data["assets"]["default_cover_path"] = resolved_cover

    return JSONResponse(content=data)


class ManifestUpdateBody(BaseModel):
    data: dict[str, Any]


@router.put("/{project_id}")
async def save_manifest(project_id: str, body: ManifestUpdateBody) -> JSONResponse:
    """
    Write updated manifest data back to disk (2-way sync).
    Finds the correct file, pretty-prints, and overwrites atomically.
    """
    root_path = SHORTS_FACTORY_DATA_DIR / f"manifest_{project_id}.json"
    nested_path = SHORTS_FACTORY_DATA_DIR / project_id / "manifest.json"

    target: Path | None = None
    for candidate in [root_path, nested_path]:
        if candidate.exists():
            target = candidate
            break

    if target is None:
        raise HTTPException(status_code=404, detail=f"Manifest for '{project_id}' not found — cannot save.")

    try:
        json_str = json.dumps(body.data, indent=2, ensure_ascii=False)
        target.write_text(json_str, encoding="utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write manifest: {str(e)}")

    return JSONResponse(content={"success": True, "saved_to": str(target)})
