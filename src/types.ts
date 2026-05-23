export interface PullRequest {
  id: string | number;
  number: number;
  title: string;
  author: string;
  authorAvatar?: string;
  branch: string;
  createdAt: string;
  status: 'open' | 'closed' | 'merged';
}

export interface ReviewComment {
  id: string;
  line: number;
  type: 'bug' | 'security' | 'issue' | 'suggestion' | 'praise';
  title: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  originalCode?: string;
  suggestedCode?: string;
}

export interface ReviewReport {
  score: number; // 0-100 quality score
  summary: string; // Markdown summary of the PR
  metrics: {
    bugsFound: number;
    securityVulnerabilities: number;
    performanceIssues: number;
    styleIssues: number;
    positives: number;
  };
  comments: ReviewComment[];
}

export interface Repository {
  id: string | number;
  name: string;
  owner?: string;
  description?: string;
  url?: string;
  stars?: number;
  language?: string;
}

export interface ChangedFile {
  path: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  content?: string;
  patch?: string;
}
