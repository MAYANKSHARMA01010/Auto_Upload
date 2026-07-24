"use client";

import { useState } from "react";
import { api } from "@/lib/axios";

interface AiChipDef {
  label: string;
  prompt: string;
  emoji: string;
}

interface AiChipsProps {
  fieldLabel: string;
  currentValue: string;
  chips: AiChipDef[];
  onRewrite: (newValue: string) => void;
  multiline?: boolean;
}

async function callGemini(prompt: string): Promise<string> {
  const res = await api.post("/ai/rewrite", { prompt });
  return res.data?.result ?? "";
}

export function AiChips({ fieldLabel, currentValue, chips, onRewrite, multiline }: AiChipsProps) {
  const [loading, setLoading] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runRewrite = async (promptTemplate: string) => {
    if (!currentValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fullPrompt = `${promptTemplate}\n\nCurrent ${fieldLabel}:\n"${currentValue}"\n\nReturn ONLY the rewritten ${fieldLabel}, nothing else. No quotes, no explanation.`;
      const result = await callGemini(fullPrompt);
      if (result) onRewrite(result);
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err?.message ?? "Rewrite failed";
      setError(typeof msg === "string" ? msg : "Rewrite failed");
    } finally {
      setLoading(false);
      setActiveChip(null);
    }
  };

  const handleChip = (chip: AiChipDef) => {
    setActiveChip(chip.label);
    runRewrite(chip.prompt);
  };

  const handleCustomRewrite = () => {
    if (!customInstruction.trim()) return;
    setActiveChip("custom");
    runRewrite(`Rewrite based on this instruction: "${customInstruction}"`);
    setCustomInstruction("");
  };

  return (
    <div className="space-y-2">
      {/* Chip row */}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleChip(chip)}
            disabled={loading}
            className={[
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200",
              loading && activeChip === chip.label
                ? "bg-primary/20 border-primary/50 text-primary animate-pulse"
                : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary hover:bg-primary/5",
            ].join(" ")}
          >
            <span>{chip.emoji}</span>
            <span>{chip.label}</span>
            {loading && activeChip === chip.label && (
              <span className="material-symbols-outlined text-xs animate-spin">sync</span>
            )}
          </button>
        ))}
      </div>

      {/* Custom instruction row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomRewrite()}
          placeholder="Custom instruction…"
          className="flex-1 text-[11px] bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
          disabled={loading}
        />
        <button
          onClick={handleCustomRewrite}
          disabled={loading || !customInstruction.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[11px] font-medium hover:bg-primary/20 disabled:opacity-40 transition-all"
        >
          {loading && activeChip === "custom" ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
          )}
          <span>Rewrite</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[10px] text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
