import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface PromptPreset {
  id: string;
  name: string;
  value: string;
  isCustom?: boolean;
}

const DEFAULT_PRESETS: PromptPreset[] = [
  {
    id: 'strict-security',
    name: '🔒 Strict Security',
    value: 'Audit heavily for SQL Injections, Cross-Site Scripting (XSS), secret/credential leakage, authentication gaps, raw inputs, and rate-limiting issues.'
  },
  {
    id: 'react-best',
    name: '⚛️ React Best Practices',
    value: 'Audit for correct useEffect dependency arrays, proper cleanup/unmount returns, stable callback memoization, key prop uniqueness, and robust functional states.'
  },
  {
    id: 'perf-tuning',
    name: '⚡ Performance Tuning',
    value: 'Look for CPU bottlenecks, heavy nested rendering, slow string concatenations, redundant calculations, memory leaks, and excessive recalculation loops.'
  },
  {
    id: 'clean-code',
    name: '💅 Clean Architecture',
    value: 'Validate descriptive naming conventions, lack of nested spaghetti structures, strong code typing/interfaces, appropriate documentation, and clean modular structures.'
  }
];

interface PromptPresetSelectorProps {
  promptAddon: string;
  setPromptAddon: (val: string) => void;
}

export default function PromptPresetSelector({
  promptAddon,
  setPromptAddon
}: PromptPresetSelectorProps) {

  const [presets, setPresets] = useState<PromptPreset[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sentinel_prompt_presets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return [...DEFAULT_PRESETS, ...parsed];
        } catch (e) {
          return DEFAULT_PRESETS;
        }
      }
    }
    return DEFAULT_PRESETS;
  });

  const [savingPreset, setSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    if (!promptAddon.trim()) return;

    const newPr: PromptPreset = {
      id: 'custom-' + Date.now(),
      name: `⭐ ${presetNameInput.trim()}`,
      value: promptAddon,
      isCustom: true
    };

    const nextPresets = [...presets, newPr];
    setPresets(nextPresets);

    // Save only custom ones to local storage
    const customsOnly = nextPresets.filter(p => p.isCustom);
    localStorage.setItem('sentinel_prompt_presets', JSON.stringify(customsOnly));

    setPresetNameInput('');
    setSavingPreset(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPresets = presets.filter(p => p.id !== id);
    setPresets(nextPresets);
    
    const customsOnly = nextPresets.filter(p => p.isCustom);
    localStorage.setItem('sentinel_prompt_presets', JSON.stringify(customsOnly));

    // Deselect if active is deleted
    const deletedVal = presets.find(p => p.id === id)?.value;
    if (deletedVal && promptAddon.trim() === deletedVal.trim()) {
      setPromptAddon('');
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-slate-800/40" id="presets-component-root">
      <div className="flex justify-between items-center select-none">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Guidelines & Prompt Presets
        </label>
        {!savingPreset ? (
          <button
            type="button"
            onClick={() => setSavingPreset(true)}
            disabled={!promptAddon.trim()}
            className="text-[10px] text-[#58a6ff] hover:text-blue-400 hover:underline flex items-center gap-0.5 disabled:opacity-40 disabled:no-underline font-semibold transition-all"
            title="Save current custom prompt configuration as a reusable preset"
          >
            Save Preset
          </button>
        ) : null}
      </div>

      {/* Quick Preset Selector Pills */}
      <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto select-scrollbar pr-0.5 py-0.5">
        {presets.map((preset) => {
          const isActive = promptAddon.trim() === preset.value.trim();
          return (
            <div
              key={preset.id}
              onClick={() => setPromptAddon(preset.value)}
              className={`group relative text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1.5 select-none ${
                isActive
                  ? 'bg-indigo-950/30 border-indigo-700 text-white font-semibold'
                  : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-[130px]">{preset.name}</span>
              {preset.isCustom && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePreset(preset.id, e)}
                  className="text-[#ff7b72] hover:text-red-400 text-[11px] font-bold px-0.5 ml-1 rounded opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Delete Preset"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline Name Input Form for Preset Creation */}
      {savingPreset && (
        <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2.5 animate-fadeIn select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Preset Title</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Strict Types, camelCase"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleSavePreset}
              disabled={!presetNameInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-[11px] font-semibold px-3 py-1 rounded-lg"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setSavingPreset(false); setPresetNameInput(''); }}
              className="border border-[#30363d] hover:bg-[#30363d] text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <textarea
        value={promptAddon}
        onChange={(e) => setPromptAddon(e.target.value)}
        placeholder="e.g. Conform strictly to camelCase conventions, ensure we use await on all database query interfaces, etc."
        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 min-h-[75px] resize-none"
      />
    </div>
  );
}
