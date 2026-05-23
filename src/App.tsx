import React, { useState, useEffect } from 'react';
import { Repository, PullRequest, ChangedFile, ReviewComment, ReviewReport } from './types';
import IntegrationPanel from './components/IntegrationPanel';
import PRSelector from './components/PRSelector';
import PromptPresetSelector from './components/PromptPresetSelector';
import { 
  Shield, 
  Settings, 
  Code2, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Bug, 
  Activity, 
  Sparkles, 
  ExternalLink, 
  FileCode, 
  ChevronRight, 
  Flame, 
  Cpu, 
  Copy, 
  RefreshCw, 
  Heart, 
  HelpCircle, 
  Eye, 
  Check, 
  ArrowRight,
  User,
  GitPullRequest,
  Download,
  FileJson
} from 'lucide-react';

export default function App() {
  // Provider integration state
  const [provider, setProvider] = useState<'sandbox' | 'github' | 'gitlab'>('sandbox');
  const [accessToken, setAccessToken] = useState('');
  const [customRepoSlug, setCustomRepoSlug] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  // PR & Code details state
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [selectedPull, setSelectedPull] = useState<PullRequest | null>(null);
  const [files, setFiles] = useState<ChangedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);

  // Focus and prompt adjustments
  const [focusType, setFocusType] = useState<'general' | 'bugs' | 'security' | 'performance' | 'style'>('general');
  const [promptAddon, setPromptAddon] = useState('');

  // Core AI review reports state
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReviewReport | null>(null);
  const [reviewHistory, setReviewHistory] = useState<Record<string, ReviewReport>>({});
  const [scanDuration, setScanDuration] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Interactive playground editor state
  const [activeTab, setActiveTab] = useState<'diff' | 'playground'>('diff');
  const [playgroundCode, setPlaygroundCode] = useState(`// Paste any custom code snippet here to run instant AI audit!
function calculateTotal(price, tax, ipAddress) {
  // 1. Hardcoded development secrets
  const apiSecretToken = "staging_dev_token_99342_xyz";

  // 2. Logic & crash concerns if tax is missing
  const total = price + (price * tax);

  try {
    // 3. Potential SQL injection exposure
    const query = "INSERT INTO transaction_logs (ip, amount) VALUES ('" + ipAddress + "', " + total + ")";
    db.executeRawQuery(query);
  } catch (error) {
    // 4. Insecure error disclosure
    console.log("Database write failed due to " + error);
  }

  return total;
}`);
  const [playgroundFileName, setPlaygroundFileName] = useState("transactionService.js");

  // Interaction tracking state
  const [appliedCommentIds, setAppliedCommentIds] = useState<Set<string>>(new Set());
  const [resolvedCommentIds, setResolvedCommentIds] = useState<Set<string>>(new Set());

  // Refinement states
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Drill Deeper states
  const [expandedDrillDowns, setExpandedDrillDowns] = useState<Set<string>>(new Set());
  const [loadingDrillDowns, setLoadingDrillDowns] = useState<Record<string, boolean>>({});
  const [drillDowns, setDrillDowns] = useState<Record<string, any>>({});
  const [drillDownQuestions, setDrillDownQuestions] = useState<Record<string, string>>({});
  const [drillDownErrors, setDrillDownErrors] = useState<Record<string, string>>({});

  // Filter settings for reviews
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'bug' | 'security' | 'performance' | 'style' | 'praise'>('all');

  // Load sandbox repositories automatically on boot
  useEffect(() => {
    if (provider === 'sandbox') {
      fetchRepos();
    }
  }, [provider]);

  // Fetch repositories from express server proxy
  const fetchRepos = async () => {
    setRepos([]);
    setSelectedRepo(null);
    setSelectedPull(null);
    setSelectedFile(null);
    setCurrentReport(null);
    setErrorMessage(null);

    const loaderTimeout = setTimeout(() => {
      setIsReviewing(false);
    }, 15000);

    try {
      const response = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accessToken,
          customOwner: customRepoSlug ? customRepoSlug.split('/')[0] : undefined,
          customRepo: customRepoSlug ? customRepoSlug.split('/')[1] : undefined
        })
      });

      clearTimeout(loaderTimeout);

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || 'Failed to authenticate and fetch repositories.');
      }

      const data = await response.json();
      setRepos(data.repos || []);
      
      // Auto-select first sandbox repo for instant demo feel
      if (provider === 'sandbox' && data.repos && data.repos.length > 0) {
        setSelectedRepo(data.repos[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while loading repositories.');
    }
  };

  // Fetch pull requests when repo selection changes
  useEffect(() => {
    if (selectedRepo) {
      fetchPulls();
    } else {
      setPulls([]);
      setSelectedPull(null);
      setFiles([]);
      setSelectedFile(null);
      setCurrentReport(null);
    }
  }, [selectedRepo]);

  const fetchPulls = async () => {
    if (!selectedRepo) return;
    
    // Reset previous selection
    setSelectedPull(null);
    setFiles([]);
    setSelectedFile(null);
    setCurrentReport(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/github/pulls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accessToken,
          repoId: selectedRepo.id,
          owner: selectedRepo.owner,
          repo: selectedRepo.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch open pull resources.');
      }

      const data = await response.json();
      setPulls(data.pulls || []);

      // Auto-select first PR in Sandbox for zero-click interaction
      if (data.pulls && data.pulls.length > 0) {
        setSelectedPull(data.pulls[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load pull request list.');
    }
  };

  // Fetch file changes inside the PR when PR selection changes
  useEffect(() => {
    if (selectedPull && selectedRepo) {
      fetchPullFiles();
    } else {
      setFiles([]);
      setSelectedFile(null);
      setCurrentReport(null);
    }
  }, [selectedPull]);

  const fetchPullFiles = async () => {
    if (!selectedRepo || !selectedPull) return;
    setSelectedFile(null);
    setCurrentReport(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/github/pull-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          accessToken,
          repoId: selectedRepo.id,
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
          pullNumber: selectedPull.number
        })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve file list from pull request.');
      }

      const data = await response.json();
      setFiles(data.files || []);

      // Auto-select first changed file in sandbox & run auto-review audit trace!
      if (data.files && data.files.length > 0) {
        const firstFile = data.files[0];
        setSelectedFile(firstFile);
        
        // Auto trigger review in sandbox mode to give instant stellar insights!
        triggerReview(firstFile.path, firstFile.patch || '');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load changed file streams.');
    }
  };

  // Run AI Review Audit on Selected Patch file or Playground source code
  const triggerReview = async (fileName: string, patchText: string) => {
    if (!patchText || patchText.trim().length === 0) {
      setErrorMessage("No file patch diff available to analyze for security or bugs.");
      return;
    }

    const cacheKey = `${selectedRepo?.id || 'sandbox'}-${selectedPull?.number || 'play'}-${fileName}-${focusType}`;
    
    // Check local review cache first for lightning fast back and forth toggling
    if (reviewHistory[cacheKey]) {
      setCurrentReport(reviewHistory[cacheKey]);
      setAppliedCommentIds(new Set());
      setResolvedCommentIds(new Set());
      return;
    }

    setIsReviewing(true);
    setErrorMessage(null);
    const startTime = Date.now();

    try {
      const resp = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          patch: patchText,
          focusType,
          promptAddon
        })
      });

      if (!resp.ok) {
        const errObj = await resp.json();
        throw new Error(errObj.error || 'Gemini review compilation failed.');
      }

      const reportData: ReviewReport = await resp.json();
      
      // Assign IDs to comments if they aren't provided to prevent duplicate references
      if (reportData && reportData.comments) {
        reportData.comments = reportData.comments.map((comment, index) => ({
          ...comment,
          id: comment.id || `comment-${index}-${Date.now()}`
        }));
      }

      // Calculate real execution time
      const totalTimeMs = Date.now() - startTime;
      setScanDuration(parseFloat((totalTimeMs / 1000).toFixed(1)));

      setCurrentReport(reportData);
      setAppliedCommentIds(new Set());
      setResolvedCommentIds(new Set());

      // Save to cache
      setReviewHistory(prev => ({
        ...prev,
        [cacheKey]: reportData
      }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Gemini encountered a token or request parsing issue.');
    } finally {
      setIsReviewing(false);
    }
  };

  // Action: Refine review report based on user feedback
  const handleRefineReport = async () => {
    if (!refinementInput.trim() || !currentReport) return;

    setIsRefining(true);
    setErrorMessage(null);
    showToast("Refining review report with Gemini... 🛡️");

    const fileNameObj = activeTab === 'playground' ? playgroundFileName : (selectedFile ? selectedFile.path : 'all-files');
    const patchText = activeTab === 'playground' ? playgroundCode : (selectedFile ? selectedFile.patch : '');

    try {
      const resp = await fetch('/api/review/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileNameObj,
          patch: patchText,
          previousReport: currentReport,
          refineInstruction: refinementInput.trim(),
          focusType,
          promptAddon
        })
      });

      if (!resp.ok) {
        const errObj = await resp.json();
        throw new Error(errObj.error || 'Gemini report refinement compilation failed.');
      }

      const reportData: ReviewReport = await resp.json();
      
      // Ensure comments have a guaranteed unique client-side ID
      if (reportData && reportData.comments) {
        reportData.comments = reportData.comments.map((comment, index) => ({
          ...comment,
          id: comment.id || `comment-refine-${index}-${Date.now()}`
        }));
      }

      setCurrentReport(reportData);
      setAppliedCommentIds(new Set());
      setResolvedCommentIds(new Set());
      setRefinementInput('');
      
      showToast("Review report successfully refined by Gemini! ✨");
    } catch (err: any) {
      setErrorMessage(err.message || 'Gemini failed to refine review elements.');
    } finally {
      setIsRefining(false);
    }
  };

  // Action: Drill Deeper into specific finding details
  const handleDrillDeeper = async (comment: ReviewComment, isFollowUp = false) => {
    const commentId = comment.id;
    if (!commentId) return;

    // Toggle expansion if clicked on an already loaded drilldown non-followup
    if (!isFollowUp && expandedDrillDowns.has(commentId) && drillDowns[commentId]) {
      setExpandedDrillDowns(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    setExpandedDrillDowns(prev => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    setLoadingDrillDowns(prev => ({ ...prev, [commentId]: true }));
    setDrillDownErrors(prev => ({ ...prev, [commentId]: '' }));

    const fileNameObj = activeTab === 'playground' ? playgroundFileName : (selectedFile ? selectedFile.path : 'all-files');
    const patchText = activeTab === 'playground' ? playgroundCode : (selectedFile ? selectedFile.patch : '');
    const userQuestion = drillDownQuestions[commentId] || '';

    try {
      const resp = await fetch('/api/review/drill-deeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileNameObj,
          patch: patchText,
          comment,
          userQuestion: isFollowUp ? userQuestion.trim() : ''
        })
      });

      if (!resp.ok) {
        const errObj = await resp.json();
        throw new Error(errObj.error || 'Drill down analysis compiler failed.');
      }

      const drillData = await resp.json();
      setDrillDowns(prev => ({ ...prev, [commentId]: drillData }));
      
      if (isFollowUp) {
        // Clear follow-up input under comment
        setDrillDownQuestions(prev => ({ ...prev, [commentId]: '' }));
      }
      
      showToast(`Remediation audit checklist loaded for: "${comment.title}" 🔍`);
    } catch (err: any) {
      setDrillDownErrors(prev => ({ ...prev, [commentId]: err.message || 'Drill down request failed.' }));
    } finally {
      setLoadingDrillDowns(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // Action: Apply suggestion code locally to show immediate developer workflow success
  const handleApplySuggestion = (commentId: string) => {
    setAppliedCommentIds(prev => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    // Recalculate local quality score for immediate dopamine rush
    if (currentReport) {
      const remainingCriticals = currentReport.comments.filter(
        c => c.severity === 'critical' && !appliedCommentIds.has(c.id) && c.id !== commentId
      ).length;
      
      const updatedScore = Math.min(100, Math.round(currentReport.score + (100 - currentReport.score) * 0.4));
      setCurrentReport({
        ...currentReport,
        score: remainingCriticals === 0 ? Math.max(90, updatedScore) : updatedScore
      });
    }

    showToast("Code suggestion applied locally! Patch queued for commit push. 🚀");
  };

  // Action: Dismiss inline issue block
  const handleDismissSuggestion = (commentId: string) => {
    setResolvedCommentIds(prev => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
    showToast("Vulnerability audit finding marked as accepted / resolved.");
  };

  // Action: Simulated Git Approve & Merge
  const handleApproveMerge = () => {
    if (!selectedPull) return;
    
    showToast(`Pull Request #${selectedPull.number} Approved & Merged into main! ⚔️`);
    
    // Change selected pull state to merged representation locally
    setSelectedPull(prev => prev ? { ...prev, status: 'merged' } : null);
  };

  // Action: Trigger Playground custom review
  const handleRunPlaygroundReview = () => {
    // Generate simulated patch file format out of playground file
    const simulatedPatch = `@@ -1,30 +1,30 @@\n${playgroundCode}`;
    triggerReview(playgroundFileName, simulatedPatch);
  };

  // Helper utility to show dynamic auto-fading success alerts
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  // Export report as formatted JSON or Markdown file download
  const handleExportReport = (format: 'json' | 'markdown') => {
    if (!currentReport) return;

    const fileNameObj = activeTab === 'playground' ? playgroundFileName : (selectedFile ? selectedFile.path : 'all-files');
    // Sanitize file path for use as a file name
    const sanitizedName = fileNameObj.replace(/[\/\\]/g, '_');
    const timestamp = new Date().toISOString().substring(0, 10);
    const downloadFileName = `codepilot-audit-[${sanitizedName}]-${timestamp}.${format === 'json' ? 'json' : 'md'}`;

    let dataStr = '';
    let mimeType = '';

    if (format === 'json') {
      dataStr = JSON.stringify(currentReport, null, 2);
      mimeType = 'application/json';
    } else {
      // Build gorgeous markdown
      dataStr = `# 🛡️ CodePilot Audit Report\n\n` +
        `* **Target File:** \`${fileNameObj}\`\n` +
        `* **Vetted Security Score:** \`${currentReport.score}/100\`\n` +
        `* **Generated Date:** ${new Date().toLocaleString()}\n` +
        `* **Analysis Time:** ${scanDuration ? `${scanDuration}s` : 'N/A'}\n\n` +
        `---\n\n` +
        `## 📊 Summary Metrics\n` +
        `* 🐛 **Bugs found:** ${currentReport.metrics.bugsFound}\n` +
        `* 🛡️ **Security Vulnerabilities:** ${currentReport.metrics.securityVulnerabilities}\n` +
        `* ⚡ **Performance issues:** ${currentReport.metrics.performanceIssues}\n` +
        `* 🎨 **Code Smells / Style Issues:** ${currentReport.metrics.styleIssues}\n` +
        `* 👍 **Positive Highlights:** ${currentReport.metrics.positives}\n\n` +
        `---\n\n` +
        `## 📝 Executive Overview\n\n${currentReport.summary}\n\n` +
        `---\n\n` +
        `## 🔎 Detailed Findings & Annotations\n\n` +
        currentReport.comments.map((c, i) => {
          let cStr = `### ${i + 1}. [${c.severity.toUpperCase()}] ${c.title} (${c.type})\n` +
            `* **Location:** Line ${c.line === -1 ? 'General / Global' : c.line}\n` +
            `* **Severity:** \`${c.severity}\`\n\n` +
            `#### Recommendation:\n${c.message}\n\n`;

          if (c.originalCode) {
            cStr += `#### Original Code:\n\`\`\`\n${c.originalCode}\n\`\`\`\n\n`;
          }

          if (c.suggestedCode) {
            cStr += `#### Proposed Fix:\n\`\`\`\n${c.suggestedCode}\n\`\`\`\n\n`;
          }

          return cStr;
        }).join('---\n\n');

      mimeType = 'text/markdown';
    }

    const blob = new Blob([dataStr], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Audit report downloaded successfully as ${format.toUpperCase()}! 📥`);
  };

  // Simple and highly optimized lightweight custom bold/markdown parser to keep rendering clean
  const parseMarkdownText = (text: string) => {
    if (!text) return "";
    
    // Escape simple html tokens
    let clean = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace bold formatting (**text**)
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>');
    
    // Replace inline code blocks (`code`)
    clean = clean.replace(/`(.*?)`/g, '<code class="bg-[#1c2128] text-[#ff7b72] px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
    
    // Replace lists (- items)
    clean = clean.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-4 list-disc mt-1 text-[#8b949e]">$1</li>');

    return clean;
  };

  // Filtered comments list based on UI drop-down selectors
  const getFilteredComments = () => {
    if (!currentReport) return [];
    return currentReport.comments.filter(comment => {
      const matchesSeverity = severityFilter === 'all' || comment.severity === severityFilter;
      const matchesType = typeFilter === 'all' || comment.type === typeFilter;
      const isNotResolved = !resolvedCommentIds.has(comment.id);
      return matchesSeverity && matchesType && isNotResolved;
    });
  };

  // Safe estimation helper to render exact patches line-by-line
  const parsePatchLines = (patchText: string | undefined) => {
    if (!patchText) return [];
    
    const lines = patchText.split('\n');
    const result: Array<{
      lineNumOriginal: number | string;
      lineNumNew: number | string;
      type: 'added' | 'deleted' | 'hunk' | 'normal';
      text: string;
      actualLine: number;
    }> = [];

    let originalPointer = 0;
    let newPointer = 0;
    let calculatedIndex = 0;

    lines.forEach((line) => {
      if (line.startsWith('@@')) {
        // Parse hunk: @@ -leftStart,leftCount +rightStart,rightCount @@
        const match = line.match(/^@@\s+-(\d+),?\d*\s+\+(\d+),?\d*\s+@@/);
        if (match) {
          originalPointer = parseInt(match[1]);
          newPointer = parseInt(match[2]);
        }
        result.push({
          lineNumOriginal: '•••',
          lineNumNew: '•••',
          type: 'hunk',
          text: line,
          actualLine: newPointer
        });
      } else if (line.startsWith('+')) {
        result.push({
          lineNumOriginal: '',
          lineNumNew: newPointer,
          type: 'added',
          text: line,
          actualLine: newPointer
        });
        newPointer++;
        calculatedIndex = newPointer;
      } else if (line.startsWith('-')) {
        result.push({
          lineNumOriginal: originalPointer,
          lineNumNew: '',
          type: 'deleted',
          text: line,
          actualLine: originalPointer
        });
        originalPointer++;
        calculatedIndex = originalPointer;
      } else {
        result.push({
          lineNumOriginal: originalPointer,
          lineNumNew: newPointer,
          type: 'normal',
          text: line,
          actualLine: newPointer
        });
        originalPointer++;
        newPointer++;
        calculatedIndex = newPointer;
      }
    });

    return result;
  };

  const parsedDiff = parsePatchLines(selectedFile?.patch);

  // Summarized total counts for header status lights
  const getReviewSummaryStats = () => {
    if (!currentReport) return { criticalCount: 0, warningCount: 0 };
    
    // Count remaining active warnings/criticals
    const active = currentReport.comments.filter(c => !resolvedCommentIds.has(c.id));
    const criticals = active.filter(c => c.severity === 'critical').length;
    const warnings = active.filter(c => c.severity === 'warning').length;

    return { criticalCount: criticals, warningCount: warnings };
  };

  const { criticalCount, warningCount } = getReviewSummaryStats();

  return (
    <div className="w-full min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans flex flex-col overflow-x-hidden antialiased" id="sentinel-app-frame">
      {/* Toast Alert popups for developer action visual feedback */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161b22] border-2 border-emerald-500 text-slate-100 flex items-center gap-3 py-3 px-5 rounded-xl shadow-2xl animate-bounce" id="success-feedback-toast">
          <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Main High-Density Header Navigation */}
      <header className="h-14 border-b border-[#30363d] flex items-center justify-between px-6 bg-[#161b22] select-none shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/40">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white tracking-tight">CodePilot</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-[#8b949e] font-mono uppercase tracking-widest leading-none mt-0.5">
              Live AI Guard Active
            </p>
          </div>
        </div>

        {/* Dynamic status indicators */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 bg-[#ff7b721e] border ${criticalCount > 0 ? 'border-[#ff7b72] text-[#ff7b72]' : 'border-slate-800 text-[#8b949e]'} text-[10px] rounded font-mono font-bold transition-all`}>
              {criticalCount} Critical Bugs
            </span>
            <span className={`px-2.5 py-1 bg-[#d299221e] border ${warningCount > 0 ? 'border-[#d29922] text-[#d29922]' : 'border-slate-800 text-[#8b949e]'} text-[10px] rounded font-mono font-bold transition-all`}>
              {warningCount} Warnings
            </span>
          </div>
          
          <div className="h-6 w-[1px] bg-[#30363d] hidden sm:block"></div>
          
          <div className="flex items-center space-x-3 text-xs">
            {selectedPull ? (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-slate-200 font-semibold truncate max-w-[210px]">
                  PR #{selectedPull.number}: {selectedPull.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  branch: {selectedPull.branch}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 hidden md:inline">No PR selected</span>
            )}
            {selectedPull?.authorAvatar ? (
              <img src={selectedPull.authorAvatar} alt="author" className="w-8 h-8 rounded-full border border-[#30363d] bg-slate-800" />
            ) : (
              <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold uppercase">
                AI
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Column: Repository & Pull Request Navigators */}
        <aside className="w-[325px] border-r border-[#30363d] bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto select-none select-scrollbar hidden lg:flex">
          <div className="p-4 space-y-5">
            {/* Quick alternate tabs between Real repos & custom playground */}
            <div className="bg-[#161b22] p-1 rounded-xl flex border border-[#30363d]">
              <button
                onClick={() => { setActiveTab('diff'); }}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'diff' 
                    ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Repo Review
              </button>
              <button
                onClick={() => { setActiveTab('playground'); setSelectedFile(null); }}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'playground' 
                    ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3 h-3 text-emerald-400" />
                Playground Box
              </button>
            </div>

            {/* Error Message banner wrapper */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/20 border border-rose-900 rounded-xl text-[11px] text-rose-300 flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Integration Setup Panel: Keeps github token connection offline or demo */}
            {activeTab === 'diff' ? (
              <>
                <IntegrationPanel
                  provider={provider}
                  setProvider={setProvider}
                  accessToken={accessToken}
                  setAccessToken={setAccessToken}
                  repos={repos}
                  selectedRepo={selectedRepo}
                  setSelectedRepo={setSelectedRepo}
                  isLoadingRepos={false}
                  onFetchRepos={fetchRepos}
                  customRepoSlug={customRepoSlug}
                  setCustomRepoSlug={setCustomRepoSlug}
                />

                <PRSelector
                  selectedRepo={selectedRepo}
                  pulls={pulls}
                  selectedPull={selectedPull}
                  setSelectedPull={setSelectedPull}
                  isLoadingPulls={false}
                  files={files}
                  selectedFile={selectedFile}
                  setSelectedFile={(f) => {
                    setSelectedFile(f);
                    if (f) triggerReview(f.path, f.patch || '');
                  }}
                  isLoadingFiles={false}
                  focusType={focusType}
                  setFocusType={(t) => {
                    setFocusType(t);
                    if (selectedFile) triggerReview(selectedFile.path, selectedFile.patch || '');
                  }}
                  promptAddon={promptAddon}
                  setPromptAddon={setPromptAddon}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">Simulation Settings</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Test custom functions live by writing or pasting files below. Select AI priority parameters:
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block mb-1">Audit Lens Focus</label>
                      <select
                        value={focusType}
                        onChange={(e) => setFocusType(e.target.value as any)}
                        className="w-full bg-[#0d1117] border border-[#30363d] px-2.5 py-1.5 text-xs text-slate-300 rounded-lg outline-none"
                      >
                        <option value="general">Comprehensive Lens (All)</option>
                        <option value="bugs">Logical Bugs & Crash Risk</option>
                        <option value="security">Security Vulnerability Audit</option>
                        <option value="performance">CPU / Rendering Loop Leaks</option>
                        <option value="style">Syntax Aesthetics & Code Smell</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block mb-1">File Name Simulation</label>
                      <input
                        type="text"
                        value={playgroundFileName}
                        onChange={(e) => setPlaygroundFileName(e.target.value)}
                        placeholder="e.g. authMiddleware.ts"
                        className="w-full bg-[#0d1117] border border-[#30363d] px-2.5 py-1.5 text-xs font-mono text-slate-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <PromptPresetSelector
                    promptAddon={promptAddon}
                    setPromptAddon={setPromptAddon}
                  />
                </div>

                <button
                  onClick={handleRunPlaygroundReview}
                  disabled={isReviewing}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2.5 transition-colors"
                >
                  {isReviewing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Analyze Sandbox Code
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Center Section: Beautiful High-Density Code Viewer and Inline AI Comments */}
        <section className="flex-1 bg-[#010409] flex flex-col border-r border-[#30363d] overflow-y-auto select-scrollbar min-w-0">
          
          {/* Code Viewer Tab Header */}
          <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 sticky top-0 z-10 select-none">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-yellow-400/80 rounded-full"></span>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {activeTab === 'playground' ? playgroundFileName : selectedFile ? selectedFile.path : 'README.md'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-[10px] text-[#8b949e]">
              {selectedFile ? (
                <span className="uppercase tracking-wide px-2 py-0.5 rounded bg-slate-800 text-[9px] font-bold">
                  {selectedFile.status}
                </span>
              ) : null}
              {scanDuration && (
                <span className="opacity-75 font-mono">Scan: {scanDuration}s</span>
              )}
            </div>
          </div>

          {/* Code Area layout */}
          <main className="flex-1 p-5 min-h-0">
            {activeTab === 'playground' ? (
              // Playground interactive editor pane
              <div className="h-full flex flex-col space-y-3 animation-fade-in" id="playground-editor-frame">
                <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] p-3 rounded-xl select-none">
                  <div>
                    <h4 className="text-xs font-bold text-[#c9d1d9] flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      Dynamic Code Playground
                    </h4>
                    <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">
                      Type any faulty code with memory leaks, SQL concatenation, or dev secrets, then audit it instantly.
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] border border-[#30363d] rounded-xl overflow-hidden shadow-2xl relative">
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-xs leading-relaxed outline-none resize-none select-text border-none select-scrollbar"
                    style={{ tabSize: 2 }}
                    placeholder="// Type code here..."
                  />
                  <div className="absolute bottom-3 right-3 select-none">
                    <span className="text-[9px] font-mono uppercase bg-[#161b22] border border-[#30363d] px-2 py-1 rounded text-[#8b949e]">
                      UTF-8
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedFile ? (
              // Git patch visualization or unified review panel
              <div className="space-y-1.5 font-mono text-xs leading-relaxed" id="diff-viewer-code">
                {parsedDiff.map((line, idx) => {
                  // Determine inline comments that belong to this line estimate
                  const inlineComments = currentReport?.comments.filter(
                    (comment) => comment.line === line.actualLine && !resolvedCommentIds.has(comment.id)
                  ) || [];

                  const isApplied = inlineComments.some(c => appliedCommentIds.has(c.id));

                  return (
                    <div key={idx} className="w-full flex-col">
                      {/* Left: display actual diff numbers */}
                      <div className={`flex items-start transition-colors duration-150 ${
                        line.type === 'added' ? 'bg-[#23863615] hover:bg-[#23863625]' :
                        line.type === 'deleted' ? 'bg-[#ff7b7218] hover:bg-[#ff7b7228]' :
                        line.type === 'hunk' ? 'bg-[#388bfd11]' : 'hover:bg-[#161b22]/70'
                      }`}>
                        
                        {/* Line original pointer info */}
                        <div className="w-9 shrink-0 select-none text-right pr-2 text-[#484f58] text-[9px] border-r border-[#30363d]/45">
                          {line.lineNumOriginal}
                        </div>
                        {/* Line new pointer info */}
                        <div className="w-9 shrink-0 select-none text-right pr-2 text-[#484f58] text-[9px] border-r border-[#30363d]/45">
                          {line.lineNumNew}
                        </div>

                        {/* Line marker tag */}
                        <div className="w-5 shrink-0 select-none text-center font-bold font-mono">
                          {line.type === 'added' ? (
                            <span className="text-[#3fb950]">+</span>
                          ) : line.type === 'deleted' ? (
                            <span className="text-[#ff7b72]">-</span>
                          ) : null}
                        </div>

                        {/* Actual code textual string */}
                        <div className={`flex-1 overflow-x-auto whitespace-pre font-mono text-[11px] px-2 ${
                          line.type === 'added' ? 'text-[#e6f1ec]' :
                          line.type === 'deleted' ? 'text-[#f6ecea] line-through decoration-[#ff7b72]/45' :
                          line.type === 'hunk' ? 'text-[#79c0ff] font-sans font-semibold' : 'text-[#c9d1d9]'
                        }`}>
                          {line.text.startsWith('+') || line.text.startsWith('-') ? line.text.substring(1) : line.text}
                        </div>
                      </div>

                      {/* Display inline AI code comments nested right under the line! */}
                      {inlineComments.map((comment, commentIdx) => {
                        const commentKey = `${comment.id}-${commentIdx}`;
                        const hasApplied = appliedCommentIds.has(comment.id);

                        return (
                          <div 
                            key={commentKey}
                            className={`my-3.5 mx-12 p-4 bg-[#1c2128] border-2 ${
                              comment.severity === 'critical' ? 'border-[#ff7b72]/70 shadow-lg shadow-rose-950/25' :
                              comment.severity === 'warning' ? 'border-[#d29922]/70 shadow-lg shadow-amber-950/20' :
                              'border-[#30363d]'
                            } rounded-xl relative hover:scale-[1.008] transition-transform duration-200 select-text`}
                            id={`inline-comment-${comment.id}`}
                          >
                            {/* Inner Comment Header */}
                            <div className="flex items-center justify-between mb-3 border-b border-[#30363d]/60 pb-2 select-none">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  comment.type === 'bug' ? 'bg-[#ff7b72]' :
                                  comment.type === 'security' ? 'bg-[#f8a33a]' :
                                  comment.type === 'performance' ? 'bg-blue-400' :
                                  comment.type === 'praise' ? 'bg-emerald-400' : 'bg-purple-400'
                                }`}></span>
                                <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                                  {comment.severity.toUpperCase()} finding: {comment.title}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] text-slate-400 bg-[#30363d]/60 px-1.5 py-0.5 rounded font-mono font-bold">
                                  Line {line.actualLine}
                                </span>
                              </div>
                            </div>

                            {/* Markdown message formatted */}
                            <div 
                              className="text-xs text-[#8b949e] leading-relaxed mb-4 select-text" 
                              dangerouslySetInnerHTML={{ __html: parseMarkdownText(comment.message) }}
                            />

                            {/* Suggested replacement code block if available */}
                            {comment.suggestedCode && !hasApplied && (
                              <div className="mb-4 bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden select-text">
                                <div className="h-6 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between select-none">
                                  <span className="text-[9px] font-mono text-[#8b949e] uppercase">Proposed Repair Solution</span>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(comment.suggestedCode || '')}
                                    className="text-[9px] text-[#58a6ff] hover:underline"
                                  >
                                    Copy Solution
                                  </button>
                                </div>
                                <pre className="p-3 text-[11px] font-mono text-[#79c0ff] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                  <code>{comment.suggestedCode}</code>
                                </pre>
                              </div>
                            )}

                            {/* Applied simulation code representation */}
                            {hasApplied && (
                              <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2 select-none">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Simulated edit correctly merged in sandbox branch history. Rating score upgraded!</span>
                              </div>
                            )}

                            {/* Action Control buttons */}
                            <div className="flex gap-2 select-none">
                              {comment.suggestedCode && !hasApplied && (
                                <button
                                  onClick={() => handleApplySuggestion(comment.id)}
                                  className="px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 shadow transition-all active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Apply Fix
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDismissSuggestion(comment.id)}
                                className="px-3 py-1.5 border border-[#30363d] hover:bg-[#30363d] text-[#c9d1d9] text-[11px] font-semibold rounded-lg transition-all"
                              >
                                {comment.type === 'praise' ? 'Acknowledge' : 'Dismiss / Safe'}
                              </button>

                              {comment.type !== 'praise' && (
                                <button
                                  onClick={() => handleDrillDeeper(comment)}
                                  className={`px-3 py-1.5 border text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 active:scale-95 ${
                                    expandedDrillDowns.has(comment.id)
                                      ? 'bg-indigo-950/40 border-indigo-700/80 text-white'
                                      : 'border-[#30363d] hover:bg-[#30363d] text-indigo-400 hover:text-indigo-300'
                                  }`}
                                  title="Expand to consult Gemini for a full remediation guide and sandbox code patch"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-400" />
                                  {expandedDrillDowns.has(comment.id) ? 'Hide Deep Dive' : 'Drill Deeper'}
                                </button>
                              )}
                            </div>

                            {/* Expanded Drilldown Panel */}
                            {expandedDrillDowns.has(comment.id) && (
                              <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-indigo-950/80 space-y-4 animate-fadeIn select-all text-left">
                                {/* Header */}
                                <div className="border-b border-[#30363d]/40 pb-2 flex items-center justify-between select-none">
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[11px] font-bold text-slate-200">Gemini Remediation Sandbox</span>
                                  </div>
                                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/30 px-1.5 py-0.5 rounded font-bold pointer-events-none">
                                    Active Thread Explorer
                                  </span>
                                </div>

                                {/* Loading state */}
                                {loadingDrillDowns[comment.id] && (
                                  <div className="py-6 flex flex-col items-center justify-center space-y-3 select-none">
                                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                                    <div className="text-center space-y-1">
                                      <p className="text-[11px] text-slate-300 font-medium">Assembling Remediation Playbook...</p>
                                      <p className="text-[9px] text-slate-500">Checking specifications and standard compliance vectors...</p>
                                    </div>
                                  </div>
                                )}

                                {/* Error state */}
                                {drillDownErrors[comment.id] && (
                                  <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-300 space-y-2 select-none">
                                    <p>{drillDownErrors[comment.id]}</p>
                                    <button
                                      onClick={() => handleDrillDeeper(comment)}
                                      className="text-[10px] text-rose-450 hover:underline font-semibold"
                                    >
                                      Retry Drilldown
                                    </button>
                                  </div>
                                )}

                                {/* Loaded states */}
                                {!loadingDrillDowns[comment.id] && drillDowns[comment.id] && (
                                  <div className="space-y-4 select-text">
                                    
                                    {/* Standards Badges */}
                                    {drillDowns[comment.id].standardsMatches?.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 select-none">
                                        {drillDowns[comment.id].standardsMatches.map((badge: string, bIdx: number) => (
                                          <span key={bIdx} className="bg-indigo-950/50 border border-indigo-850/40 text-indigo-300 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                                            🛡️ {badge}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Architectural Concept and mechanics */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">Architectural Threat Model</span>
                                      <div 
                                        className="text-[11px] leading-relaxed text-[#c9d1d9] select-text space-y-2 bg-[#161b22]/40 border border-[#30363d]/40 rounded-xl p-3 markdown-remediation-body"
                                        dangerouslySetInnerHTML={{ __html: parseMarkdownText(drillDowns[comment.id].concept) }}
                                      />
                                    </div>

                                    {/* Secured Playbook testing steps */}
                                    {drillDowns[comment.id].stepByStep?.length > 0 && (
                                      <div className="space-y-2">
                                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">Step-by-Step Remediation Playbook</span>
                                        <ul className="space-y-1.5">
                                          {drillDowns[comment.id].stepByStep.map((step: string, sIdx: number) => (
                                            <li key={sIdx} className="text-[11px] text-[#8b949e] font-sans flex items-start gap-1.5">
                                              <span className="text-indigo-400 shrink-0 font-bold font-mono">[{sIdx + 1}]</span>
                                              <span>{step}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Secured replace code block */}
                                    {drillDowns[comment.id].securedCode && (
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center justify-between select-none">
                                          <span>Secured Code Fix Solution</span>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(drillDowns[comment.id].securedCode);
                                              showToast("Secured code solution copied! 📋");
                                            }}
                                            className="text-[9px] text-[#58a6ff] hover:underline"
                                          >
                                            Copy Code Block
                                          </button>
                                        </span>
                                        <div className="bg-[#000000]/40 rounded-xl border border-indigo-950/40 overflow-hidden">
                                          <pre className="p-3 text-[11px] font-mono text-[#79c0ff] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                            <code>{drillDowns[comment.id].securedCode}</code>
                                          </pre>
                                        </div>
                                      </div>
                                    )}

                                    {/* Interrogative Thread follow-up */}
                                    <div className="space-y-2 pt-3 border-t border-[#30363d]/45 select-none">
                                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500">Ask Custom Remediation Follow-up</span>
                                      <div className="flex gap-2">
                                        <input 
                                          type="text"
                                          placeholder="e.g. How does this prevent parameter pollution? or rewrite for Express 5."
                                          value={drillDownQuestions[comment.id] || ''}
                                          onChange={(e) => setDrillDownQuestions(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                          disabled={loadingDrillDowns[comment.id]}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (drillDownQuestions[comment.id] || '').trim()) {
                                              handleDrillDeeper(comment, true);
                                            }
                                          }}
                                          className="flex-1 bg-slate-900 border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-550 placeholder:text-slate-600"
                                        />
                                        <button
                                          onClick={() => handleDrillDeeper(comment, true)}
                                          disabled={loadingDrillDowns[comment.id] || !(drillDownQuestions[comment.id] || '').trim()}
                                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-[11px] font-semibold px-3 py-1 rounded-lg transition-all active:scale-95"
                                        >
                                          Ask
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                )}

                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Default Welcome Banner instructions when no files are loaded
              <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4 max-w-xl mx-auto space-y-5 select-none animate-fadeIn" id="empty-state-banner">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 shadow-xl">
                  <Shield className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">Select a Branch Changeset to Inspect</h3>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    Choose one of our premium structured sandbox repositories or paste your personal token key to query active GitHub/GitLab branches. CodePilot reviews files line by line using gemini-3.5-flash AI.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-md pt-2">
                  <button 
                    onClick={() => { setProvider('sandbox'); fetchRepos(); }}
                    className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl hover:border-slate-600 transition-all text-left space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <FileCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <ArrowRight className="w-3 h-3 text-[#484f58]" />
                    </div>
                    <p className="text-xs font-bold text-white">Evaluation Sandbox</p>
                    <p className="text-[10px] text-slate-500">Includes pre-loaded SQL/React security flaws</p>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('playground'); }}
                    className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl hover:border-slate-600 transition-all text-left space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <Code2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <ArrowRight className="w-3 h-3 text-[#484f58]" />
                    </div>
                    <p className="text-xs font-bold text-white">Plain Code Box</p>
                    <p className="text-[10px] text-slate-500">Paste raw python/JS files for instant reviews</p>
                  </button>
                </div>
              </div>
            )}
          </main>
        </section>

        {/* Right Column: AI Intel Summary, Micro-graphs, and Severity Filters */}
        <aside className="w-80 bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto border-l border-[#30363d] select-none select-scrollbar hidden xl:flex">
          {isReviewing ? (
            // Immersive audit loader widget
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-pulse select-none" id="scanning-indicator-box">
              <div className="relative">
                <SpinnerRadar />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-white tracking-wide uppercase">Auditor Thread Analyzing</p>
                <p className="text-[10px] text-[#8b949e] mt-1.5 leading-relaxed max-w-[200px] mx-auto">
                  Tokenizing patch lines, parsing structure, running security vulnerability queries...
                </p>
              </div>

              <div className="w-36 bg-[#161b22] h-1 border border-[#30363d] rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[70%] animate-pulse"></div>
              </div>
            </div>
          ) : currentReport ? (
            // Full interactive summary dashboard when a report is precalculated
            <div className="flex-1 flex flex-col min-h-0" id="intel-dashboard-report">
              {/* Score card inside Aside Header */}
              <div className="p-4 border-b border-[#30363d] space-y-4 shrink-0 bg-[#010409]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#8b949e] tracking-wider uppercase">Vetted Security Score</span>
                  <span className={`text-base font-bold font-mono px-2 py-0.5 rounded ${
                    currentReport.score >= 80 ? 'text-[#3fb950] bg-emerald-950/20' :
                    currentReport.score >= 60 ? 'text-[#d29922] bg-amber-950/20' :
                    'text-[#ff7b72] bg-rose-950/20'
                  }`}>
                    {currentReport.score}%
                  </span>
                </div>

                {/* Score health gauge */}
                <div className="w-full bg-[#30363d] h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      currentReport.score >= 80 ? 'bg-[#238636]' :
                      currentReport.score >= 60 ? 'bg-[#d29922]' :
                      'bg-[#ff7b72]'
                    }`}
                    style={{ width: `${currentReport.score}%` }}
                  ></div>
                </div>

                {/* Grid stats metric counters */}
                <div className="grid grid-cols-2 gap-2" id="metrics-counters-grid">
                  <div className="bg-[#161b22] p-2.5 rounded-xl border border-[#30363d] flex flex-col">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Bug className="w-3 h-3 text-[#ff7b72]" /> Bugs
                    </span>
                    <span className="text-base font-bold font-mono text-slate-100 mt-1">
                      {currentReport.metrics.bugsFound}
                    </span>
                  </div>

                  <div className="bg-[#161b22] p-2.5 rounded-xl border border-[#30363d] flex flex-col">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#f8a33a]" /> Vulns
                    </span>
                    <span className="text-base font-bold font-mono text-slate-100 mt-1">
                      {currentReport.metrics.securityVulnerabilities}
                    </span>
                  </div>

                  <div className="bg-[#161b22] p-2.5 rounded-xl border border-[#30363d] flex flex-col">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-400" /> Slow loops
                    </span>
                    <span className="text-base font-bold font-mono text-slate-100 mt-1">
                      {currentReport.metrics.performanceIssues}
                    </span>
                  </div>

                  <div className="bg-[#161b22] p-2.5 rounded-xl border border-[#30363d] flex flex-col">
                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
                      <Heart className="w-3 h-3 text-emerald-400" /> Praise
                    </span>
                    <span className="text-base font-bold font-mono text-slate-100 mt-1">
                      {currentReport.metrics.positives}
                    </span>
                  </div>
                </div>

                {/* Export Report action block */}
                <div className="pt-2 flex items-center gap-2" id="export-report-actions-container">
                  <span className="text-[10px] font-mono text-[#8b949e] uppercase shrink-0">Export Report:</span>
                  <button
                    onClick={() => handleExportReport('markdown')}
                    className="flex-1 py-1 px-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-200 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all select-none active:scale-[0.97]"
                    title="Export full summary and suggestions as a formatted Markdown download"
                    id="export-markdown-btn"
                  >
                    <Download className="w-3 h-3 text-indigo-400" />
                    Markdown
                  </button>
                  <button
                    onClick={() => handleExportReport('json')}
                    className="flex-1 py-1 px-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-200 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all select-none active:scale-[0.97]"
                    title="Export complete record metadata structure in structured JSON format"
                    id="export-json-btn"
                  >
                    <FileJson className="w-3 h-3 text-[#d29922]" />
                    JSON
                  </button>
                </div>
              </div>

              {/* Aside middle scroll area: Filter comments & General system overview */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 select-scrollbar min-h-0">
                
                {/* Visual filter options section */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest flex items-center justify-between">
                    <span>Audit Feed Filter</span>
                    <Settings className="w-3 h-3" />
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value as any)}
                      className="bg-[#161b22] border border-[#30363d] text-slate-300 rounded px-2 py-1 outline-none"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">🔴 Critical</option>
                      <option value="warning">🟡 Warning</option>
                      <option value="info">🔵 Info</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="bg-[#161b22] border border-[#30363d] text-slate-300 rounded px-2 py-1 outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="bug">Bug finding</option>
                      <option value="security">Vulnerabilities</option>
                      <option value="performance">Slow loops</option>
                      <option value="style">Complexity</option>
                      <option value="praise">Praises</option>
                    </select>
                  </div>
                </div>

                {/* Actionable items checklist grouping */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest font-mono">
                    Actionable Insights Check List ({getFilteredComments().length})
                  </h4>

                  {getFilteredComments().length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-[#30363d] rounded-xl text-slate-500 text-[11px]">
                      No active audit finding matching filter rules.
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      {getFilteredComments().map((item, idx) => {
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              // Scroll inline comment element into view automatically
                              const el = document.getElementById(`inline-comment-${item.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="bg-[#161b22]/50 hover:bg-[#161b22] border border-[#30363d] p-3 rounded-lg cursor-pointer transition-colors space-y-1.5 group select-none"
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-[10px] font-bold ${
                                item.severity === 'critical' ? 'text-[#ff7b72]' :
                                item.severity === 'warning' ? 'text-[#d29922]' : 'text-blue-400'
                              } uppercase font-mono`}>
                                {item.severity}
                              </span>
                              <span className="text-[9px] font-mono text-[#484f58] group-hover:text-blue-400 transition-colors">
                                Line {item.line}
                              </span>
                            </div>
                            <p className="text-xs text-[#c9d1d9] font-semibold truncate group-hover:underline">
                              {item.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Raw overall markdown summary block from Gemini */}
                <div className="space-y-2 border-t border-[#30363d] pt-4 select-text">
                  <h4 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest font-mono">
                    Executive Audit Ledger
                  </h4>
                  <div 
                    className="p-3 bg-slate-950/35 border border-[#30363d]/40 rounded-xl text-[11px] text-[#8b949e] leading-relaxed space-y-2 select-text"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownText(currentReport.summary) }}
                  />
                </div>

                {/* Refinement input action block */}
                <div className="space-y-3 pt-4 border-t border-[#30363d]" id="refine-report-box">
                  <h4 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest font-mono flex items-center gap-1.5 select-none">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Refine Audit Insights
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-snug select-none">
                    Prompt Gemini to adjust report scoring, safe-list specific findings, or focus on other concerns.
                  </p>
                  
                  <div className="space-y-2 select-none">
                    <textarea
                      value={refinementInput}
                      onChange={(e) => setRefinementInput(e.target.value)}
                      placeholder="e.g. Rewrite summary to focus extensively on OWASP Top 10 vulnerabilities, or list 3 extra Unit Tests for line 12."
                      disabled={isRefining || isReviewing}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-500 min-h-[65px] resize-none"
                    />
                    
                    <button
                      onClick={handleRefineReport}
                      disabled={isRefining || isReviewing || !refinementInput.trim()}
                      className="w-full py-2 px-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] disabled:opacity-40 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all select-none active:scale-[0.98]"
                    >
                      {isRefining ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          Regenerating Report...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          Refine Report
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            // Sidebar display when nothing is being loaded
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center text-[#8b949e] space-y-3 select-none">
              <Code2 className="w-10 h-10 text-slate-800" />
              <div>
                <h4 className="text-xs font-bold text-slate-300">Executive Engine Idle</h4>
                <p className="text-[10px] text-slate-500 max-w-[190px] mx-auto mt-1 leading-relaxed">
                  Provide credentials, select a repository file from commit changes, or click playground scan.
                </p>
              </div>
            </div>
          )}
        </aside>

      </div>

      {/* Footer Controls Pane */}
      <footer className="h-12 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-[11px] text-[#8b949e]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Agent Engine Pulse Live
          </span>
          <span className="text-[11px] text-[#484f58] hidden sm:inline">
            Version: v1.4.2
          </span>
        </div>

        <div className="flex items-center space-x-3.5">
          {activeTab === 'diff' && selectedPull ? (
            <>
              <button 
                onClick={() => {
                  if (selectedFile) triggerReview(selectedFile.path, selectedFile.patch || '');
                }}
                disabled={isReviewing}
                className="px-3.5 py-1.5 border border-[#30363d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-40"
              >
                Re-Scan Changes
              </button>
              
              <button 
                onClick={handleApproveMerge}
                disabled={selectedPull.status === 'merged'}
                className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] font-semibold text-xs text-white rounded-lg shadow-md shadow-emerald-950/30 transition-all active:scale-95 disabled:opacity-40"
              >
                {selectedPull.status === 'merged' ? 'Merged ✔' : 'Approve & Merge'}
              </button>
            </>
          ) : activeTab === 'playground' ? (
            <button
              onClick={handleRunPlaygroundReview}
              disabled={isReviewing}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1"
            >
              <Cpu className="w-3.5 h-3.5" />
              Re-Audit Code
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

// Sleek vector radar spinner
function SpinnerRadar() {
  return (
    <div className="w-16 h-16 rounded-full border border-indigo-500/20 flex items-center justify-center animate-spin duration-3000">
      <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-500/80 animate-ping"></div>
    </div>
  );
}
