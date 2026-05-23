import React from 'react';
import { Repository, PullRequest, ChangedFile } from '../types';
import { GitPullRequest, GitBranch, Calendar, User, FileDiff, Zap, Sparkles, Sliders, HelpCircle } from 'lucide-react';
import PromptPresetSelector from './PromptPresetSelector';

interface PRSelectorProps {
  selectedRepo: Repository | null;
  pulls: PullRequest[];
  selectedPull: PullRequest | null;
  setSelectedPull: (p: PullRequest | null) => void;
  isLoadingPulls: boolean;
  files: ChangedFile[];
  selectedFile: ChangedFile | null;
  setSelectedFile: (f: ChangedFile | null) => void;
  isLoadingFiles: boolean;
  focusType: 'general' | 'bugs' | 'security' | 'performance' | 'style';
  setFocusType: (t: 'general' | 'bugs' | 'security' | 'performance' | 'style') => void;
  promptAddon: string;
  setPromptAddon: (a: string) => void;
}

export default function PRSelector({
  selectedRepo,
  pulls,
  selectedPull,
  setSelectedPull,
  isLoadingPulls,
  files,
  selectedFile,
  setSelectedFile,
  isLoadingFiles,
  focusType,
  setFocusType,
  promptAddon,
  setPromptAddon
}: PRSelectorProps) {

  const focusOptions = [
    { id: 'general', name: 'Comprehensive', desc: 'Checks full aspects' },
    { id: 'bugs', name: 'Bugs & Logic', desc: 'Finds logic & edge cases' },
    { id: 'security', name: 'Security Audit', desc: 'Injections & vulnerabilities' },
    { id: 'performance', name: 'Performance', desc: 'Slow loops & leaks' },
    { id: 'style', name: 'Code Smells', desc: 'Formatting & complexity' }
  ];

  if (!selectedRepo) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 py-12 flex flex-col items-center justify-center">
        <GitPullRequest className="w-10 h-10 text-slate-700 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">No Repository Selected</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
          Please select a workspace project or simulation repository to read commits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="pr-selector-component">
      {/* Active Pull requests list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-purple-400" />
          Active Pull Requests
        </h3>

        {isLoadingPulls ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Scanning for active pull branches...
          </div>
        ) : pulls.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No open code submissions found in this repository branch.
          </div>
        ) : (
          <div className="space-y-2 mb-4" id="pulls-list">
            {pulls.map((pr) => {
              const isSelected = selectedPull?.id === pr.id;
              return (
                <button
                  key={pr.id}
                  onClick={() => { setSelectedPull(pr); setSelectedFile(null); }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-800/80 text-white shadow-md'
                      : 'bg-slate-950/30 border-slate-850 text-slate-300 hover:bg-slate-900/40 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 w-full">
                    <span className="font-semibold text-xs leading-relaxed text-slate-200 hover:text-white">
                      #{pr.number}: {pr.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-400" />
                      {pr.author}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[9px] bg-slate-800/60 px-1 py-0.5 rounded text-slate-300">
                      <GitBranch className="w-2.5 h-2.5 text-slate-400" />
                      {pr.branch}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Changed Files inside the PR */}
      {selectedPull && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animation-fade-in" id="files-selector-box">
          <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-2">
            <FileDiff className="w-4 h-4 text-blue-400" />
            Commit Changes Diff
          </h3>

          {isLoadingFiles ? (
            <div className="text-center py-6 text-xs text-slate-500">
              Fetching changed files and code stats...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No updated files found in this patch stream.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 select-scrollbar" id="changed-files-list">
              {files.map((file) => {
                const isSelected = selectedFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-800/60 text-white'
                        : 'bg-slate-950/20 border-slate-850 text-slate-300 hover:bg-slate-900/30 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-xs text-slate-200 truncate">{file.path}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
                        {file.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] flex-shrink-0">
                      <span className="text-emerald-400">+{file.additions}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400">-{file.deletions}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Focus & Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Review Parameters
        </h3>

        {/* Focus Sector Cards */}
        <div className="space-y-2 mb-4" id="review-focus-tabs">
          {focusOptions.map((opt) => {
            const isSelected = focusType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFocusType(opt.id as any)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-950/20 border-indigo-700/80 text-white'
                    : 'bg-slate-950/20 border-slate-850 text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                <div className="mt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    opt.id === 'bugs' ? 'bg-red-500' :
                    opt.id === 'security' ? 'bg-amber-400' :
                    opt.id === 'performance' ? 'bg-blue-400' :
                    opt.id === 'style' ? 'bg-purple-400' : 'bg-emerald-400'
                  }`}></div>
                </div>
                <div>
                  <p className="font-medium text-xs text-slate-200">{opt.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom prompts helper */}
        <PromptPresetSelector
          promptAddon={promptAddon}
          setPromptAddon={setPromptAddon}
        />
      </div>
    </div>
  );
}
