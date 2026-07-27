/**
 * Manifest API helpers — scan, fetch, and save manifest.json files on disk.
 * All calls go to the backend /api/v1/manifests/* endpoints.
 */
import { Manifest, ManifestSummary } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:8000";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert an absolute disk path to a streamable localhost:8000 URL.
 * /Users/.../data/explainer_xyz/file.mp4  →  http://localhost:8000/local-media/data/explainer_xyz/file.mp4
 * /Users/.../data/covers/cover_xyz.jpg    →  http://localhost:8000/local-media/covers/cover_xyz.jpg
 */
export function diskPathToUrl(diskPath: string): string {
  if (!diskPath) return "";
  if (diskPath.startsWith("http://") || diskPath.startsWith("https://")) return diskPath;

  const dataMarker = "/packages/ClipPilot/data/";
  const coversMarker = "/covers/";

  if (diskPath.includes(dataMarker)) {
    const rel = diskPath.split(dataMarker)[1];
    return `/local-media/data/${rel}`;
  }
  if (diskPath.includes(coversMarker)) {
    const rel = diskPath.split(coversMarker)[1];
    return `/local-media/covers/${rel}`;
  }

  // If filename starts with cover_ or is just a cover filename
  if (diskPath.includes("cover_")) {
    const filename = diskPath.split("/").pop();
    return `/local-media/covers/${filename}`;
  }

  return diskPath;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export async function fetchManifests(token?: string): Promise<{ manifests: ManifestSummary[]; error?: string }> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/manifests/scan`, { headers });
    if (!res.ok) return { manifests: [], error: `Server returned ${res.status}` };
    const data = await res.json();
    return { manifests: data.manifests ?? [], error: data.error };
  } catch (err: any) {
    return { manifests: [], error: err?.message ?? "Network error" };
  }
}

export async function fetchManifest(id: string, token?: string): Promise<Manifest | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/manifests/${id}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function saveManifest(id: string, data: Manifest, token?: string): Promise<boolean> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/manifests/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Debounced auto-save factory ───────────────────────────────────────────────

export function createDebouncedSave(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (id: string, data: Manifest, token?: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => saveManifest(id, data, token), delayMs);
  };
}
