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
}

export function AiChips({ fieldLabel, currentValue, chips, onRewrite }: AiChipsProps) {
  const [loading, setLoading] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runRewrite = async (promptTemplate: string) => {
    if (!currentValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fullPrompt = `${promptTemplate}\n\nCurrent ${fieldLabel}:\n"${currentValue}"\n\nReturn ONLY the rewritten ${fieldLabel}, nothing else. No quotes, no explanation.`;
      const res = await api.post("/ai/rewrite", { prompt: fullPrompt });
      const result = res.data?.result ?? "";
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
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-2 pt-1">
      {/* Preset Chips + Custom Prompt Toggle Button */}
      <div className="flex flex-wrap items-center gap-1.5">
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

        {/* Toggle Custom Rewrite Button */}
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={loading}
          className={[
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-200",
            showCustomInput
              ? "bg-primary/20 border-primary/50 text-primary"
              : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-xs">edit_note</span>
          <span>{showCustomInput ? "Close Custom" : "Custom Prompt"}</span>
        </button>
      </div>

      {/* Expandable Custom Instruction Row (ONLY visible when toggled) */}
      {showCustomInput && (
        <div className="flex gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomRewrite()}
            placeholder={`Custom instruction for ${fieldLabel}...`}
            className="flex-1 text-[11px] bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
            autoFocus
            disabled={loading}
          />
          <button
            onClick={handleCustomRewrite}
            disabled={loading || !customInstruction.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)]"
          >
            {loading && activeChip === "custom" ? (
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            )}
            <span>Generate</span>
          </button>
        </div>
      )}

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
