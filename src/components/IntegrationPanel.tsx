import React, { useState } from 'react';
import { Repository } from '../types';
import { Github, FileCode, CheckCircle2, ChevronRight, Lock, Key, AlertCircle, Info } from 'lucide-react';

interface IntegrationPanelProps {
  provider: 'sandbox' | 'github' | 'gitlab';
  setProvider: (p: 'sandbox' | 'github' | 'gitlab') => void;
  accessToken: string;
  setAccessToken: (t: string) => void;
  repos: Repository[];
  selectedRepo: Repository | null;
  setSelectedRepo: (r: Repository | null) => void;
  isLoadingRepos: boolean;
  onFetchRepos: () => void;
  customRepoSlug: string;
  setCustomRepoSlug: (s: string) => void;
}

export default function IntegrationPanel({
  provider,
  setProvider,
  accessToken,
  setAccessToken,
  repos,
  selectedRepo,
  setSelectedRepo,
  isLoadingRepos,
  onFetchRepos,
  customRepoSlug,
  setCustomRepoSlug
}: IntegrationPanelProps) {
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl" id="integration-panel">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          Integration Console
        </h3>
        <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded">
          {provider === 'sandbox' ? 'Offline Demo' : 'Real-Time API'}
        </span>
      </div>

      {/* Provider Selector tabs */}
      <div className="grid grid-cols-3 gap-2 mb-6" id="provider-tabs">
        <button
          onClick={() => { setProvider('sandbox'); setSelectedRepo(null); }}
          className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
            provider === 'sandbox'
              ? 'bg-emerald-550 border-emerald-500 text-white shadow-lg shadow-emerald-950/20'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
          id="tab-sandbox"
        >
          <FileCode className="w-4 h-4" />
          <span>Demo Sandbox</span>
        </button>

        <button
          onClick={() => { setProvider('github'); setSelectedRepo(null); }}
          className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
            provider === 'github'
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/20'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
          id="tab-github"
        >
          <Github className="w-4 h-4" />
          <span>GitHub API</span>
        </button>

        <button
          onClick={() => { setProvider('gitlab'); setSelectedRepo(null); }}
          className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
            provider === 'gitlab'
              ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-950/20'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
          id="tab-gitlab"
        >
          <span className="font-bold text-base leading-none">🦊</span>
          <span>GitLab API</span>
        </button>
      </div>

      {/* Token Input for GitHub & GitLab */}
      {provider !== 'sandbox' && (
        <div className="space-y-4 mb-6 animation-fade-in" id="credentials-section">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                Password/Token
                <Lock className="w-3 h-3 text-slate-500" />
              </label>
              <button
                type="button"
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
              >
                <Info className="w-2.5 h-2.5" />
                Where to find this?
              </button>
            </div>

            {showTokenHelp && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-[11px] mb-3 leading-relaxed">
                {provider === 'github' ? (
                  <p>
                    Go to <strong>Settings &gt; Developer Settings &gt; Personal Access Tokens &gt; Tokens (classic)</strong>. Create a token with <code>repo</code> scope to pull active branches, file histories, or private repositories.
                  </p>
                ) : (
                  <p>
                    Go to <strong>User Settings &gt; Access Tokens</strong>. Generate a Personal Access Token with <code>api</code> or <code>read_api</code> scope to query GitLab projects.
                  </p>
                )}
              </div>
            )}

            <input
              type="password"
              placeholder={provider === 'github' ? 'ghp_...' : 'glpat-...'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {provider === 'github' && (
            <div className="border-t border-slate-800/65 pt-3">
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Target Specific Repo (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. facebook/react"
                value={customRepoSlug}
                onChange={(e) => setCustomRepoSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          <button
            onClick={onFetchRepos}
            disabled={isLoadingRepos || !accessToken}
            className="w-full bg-slate-800 text-slate-100 hover:bg-slate-750 font-medium py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isLoadingRepos ? 'Syncing...' : 'Fetch Projects'}
          </button>
        </div>
      )}

      {/* Sandbox informational info */}
      {provider === 'sandbox' && (
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex gap-2.5 mb-6">
          <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-300 mb-0.5">Evaluation Sandbox</p>
            <p className="text-[11px] leading-relaxed">
              Instantly test with preconfigured bad code examples (SQL Injections, Performance leaks, etc.) to evaluate code review comments without typing login tokens.
            </p>
          </div>
        </div>
      )}

      {/* Repository Selection List */}
      <div>
        <label className="text-xs font-medium text-slate-400 block mb-2">
          {provider === 'sandbox' ? 'Select Sandbox Repository' : 'Loaded Projects'}
        </label>
        {repos.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            {provider === 'sandbox' ? 'Loading Demo models...' : 'Provide Token above and click Fetch'}
          </div>
        ) : (
          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 select-scrollbar" id="repo-list">
            {repos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/80 border-slate-700 text-white'
                      : 'bg-slate-950/50 border-slate-850 text-slate-300 hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-medium text-xs flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {repo.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {repo.description || "No description provided."}
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
