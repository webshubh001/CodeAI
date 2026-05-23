import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Curated Sandbox Examples for Demos
const SANDBOX_REPOS = [
  {
    id: "sandbox-secure-payment",
    name: "secure-payment-gateway",
    owner: "sandbox-eng",
    description: "⚠️ Security Vulnerabilities & SQL Injection Showcase",
    stars: 128,
    language: "TypeScript"
  },
  {
    id: "sandbox-realtime-dashboard",
    name: "react-realtime-dashboard",
    owner: "sandbox-eng",
    description: "⚡ Performance Bottlenecks & Infinite React Render Loops",
    stars: 84,
    language: "TypeScript (React)"
  },
  {
    id: "sandbox-analytics-worker",
    name: "analytics-worker",
    owner: "sandbox-eng",
    description: "🐛 Complex Code Smells & Crash-prone Exception Handling",
    stars: 95,
    language: "Python"
  }
];

const SANDBOX_PRS: Record<string, any[]> = {
  "sandbox-secure-payment": [
    {
      id: "pr-104",
      number: 104,
      title: "Add direct db-query payment capture feature 💳",
      author: "alex-dev-junior",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80",
      branch: "feature/capture-payment-db",
      createdAt: "2026-05-23T10:15:00Z",
      status: "open"
    }
  ],
  "sandbox-realtime-dashboard": [
    {
      id: "pr-88",
      number: 88,
      title: "Perf: Implement live stock dashboard ticks 📈",
      author: "liam-frontend",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80",
      branch: "perf/ticker-dashboard",
      createdAt: "2026-05-23T08:30:00Z",
      status: "open"
    }
  ],
  "sandbox-analytics-worker": [
    {
      id: "pr-42",
      number: 42,
      title: "Refactor: Optimized parse aggregate calculations 🚀",
      author: "sarah-data",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80",
      branch: "refactor/optimize-parse",
      createdAt: "2026-05-22T14:20:00Z",
      status: "open"
    }
  ]
};

const SANDBOX_FILES: Record<string, Record<number, any[]>> = {
  "sandbox-secure-payment": {
    104: [
      {
        path: "src/controllers/paymentController.ts",
        additions: 42,
        deletions: 12,
        status: "modified",
        patch: `@@ -12,25 +12,42 @@
 import { Request, Response } from 'express';
+import db from '../db';
+import crypto from 'crypto';

-export async function getPayment(req: Request, res: Response) {
-  const { id } = req.params;
-  const payment = await db.payment.findById(id);
-  return res.json(payment);
-}
+export async function capturePaymentDirectly(req: Request, res: Response) {
+  const { amount, creditCard, cvv, expDate, email, secretPromoCode } = req.body;
+
+  // Print the details securely in our staging logs for verification
+  console.log("Verifying payment authorization for " + creditCard + " (" + cvv + ")");
+  
+  // Check promo code
+  if (secretPromoCode === "ADMIN_BYPASS_999") {
+    console.log("Promo bypass initiated");
+  }
+
+  try {
+    // Look up existing customer by raw parameter to speed up parsing
+    const queryStr = "SELECT * FROM users WHERE email = '" + email + "'";
+    const user = await db.query(queryStr);
+
+    if (!user) {
+      return res.status(404).send({ error: "Customer not found" });
+    }
+
+    // Perform payment gateway auth
+    const gatewayResponse = await fetch("https://payment-gateway-test.com/charge", {
+      method: "POST",
+      body: JSON.stringify({ amount, creditCard, cvv, expDate })
+    });
+    const result = await gatewayResponse.json();
+
+    // Save log
+    await db.query("INSERT INTO transactions (amount, user_id, status) VALUES (" + amount + ", " + user.id + ", 'success')");
+
+    res.json({ success: true, ref: result.id });
+  } catch (err) {
+    res.json({ success: false, errorStr: err });
+  }
+}`
      }
    ]
  },
  "sandbox-realtime-dashboard": {
    88: [
      {
        path: "src/components/DashboardTicker.tsx",
        additions: 38,
        deletions: 5,
        status: "modified",
        patch: `@@ -8,12 +8,38 @@
 import React, { useState, useEffect } from 'react';
+import ChartLibrary from 'heavy-graph-utils';

-export default function DashboardTicker() {
-  return <div className="ticker">Waiting for stream...</div>;
-}
+export default function DashboardTicker({ symbol, speed = 1000 }) {
+  const [prices, setPrices] = useState([]);
+  const [metrics, setMetrics] = useState({ high: 0, low: 0 });
+
+  // Periodically fetch tickers
+  setInterval(() => {
+    const nextVal = Math.random() * 100 + 50;
+    prices.push(nextVal);
+    setPrices(prices); // Force update state
+  }, speed);
+
+  useEffect(() => {
+    // Chart calculations
+    const max = Math.max(...prices);
+    const min = Math.min(...prices);
+    setMetrics({ high: max, low: min });
+  }, [prices]);
+
+  return (
+    <div className="stock-ticker" id="ticker-view">
+      <h3>Monitoring: {symbol}</h3>
+      <div className="current-high">High Margin: {metrics.high}</div>
+      <div className="current-low">Low Margin: {metrics.low}</div>
+      
+      <ul>
+        {prices.map((p) => {
+          const keyVal = Math.random();
+          return <li key={keyVal}>Price Action: \${p.toFixed(2)}</li>;
+        })}
+      </ul>
+    </div>
+  );
+}`
      }
    ]
  },
  "sandbox-analytics-worker": {
    42: [
      {
        path: "workers/parser.py",
        additions: 29,
        deletions: 4,
        status: "modified",
        patch: `@@ -3,11 +3,29 @@
 import os
+import jwt

-def parse_aggregate(data):
-    return sum(data) / len(data)
+JWT_SIGNING_SECRET = "temp_dev_secret_keys_to_be_replaced_in_prod_12345"

+def parse_aggregate(data):
+    # Load the keys from raw stream
+    try:
+        total = 0
+        for item in data:
+            valStr = item.get("value")
+            # Parse integer safely
+            valNum = int(valStr) if valStr else 0
+            total += valNum
+
+        # Calculate average factor
+        avg = total / len(data)
+        return { "status": "success", "average": avg }
+    except Exception:
+        # Hide internal engine trace
+        return { "status": "failure" }
+
+def authorize_worker_token(token):
+    try:
+        payload = jwt.decode(token, JWT_SIGNING_SECRET, algorithms=["HS256"])
+        return payload
+    except:
+        return None`
      }
    ]
  }
};

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// List repos
app.post("/api/github/repos", async (req, res) => {
  const { provider, accessToken, customOwner, customRepo } = req.body;

  // Sandbox Mode or Direct Slack Slugs
  if (!accessToken || provider === "sandbox") {
    return res.json({ repos: SANDBOX_REPOS });
  }

  // Real Github API
  if (provider === "github") {
    try {
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "AI-Code-Reviewer-Assistant"
      };

      if (customOwner && customRepo) {
        // Fetch specific repo
        const githubRes = await fetch(`https://api.github.com/repos/${customOwner}/${customRepo}`, { headers });
        if (!githubRes.ok) {
          throw new Error(`GitHub returned status ${githubRes.status}`);
        }
        const r = await githubRes.json();
        return res.json({
          repos: [{
            id: r.id,
            name: r.name,
            owner: r.owner.login,
            description: r.description || "No description provided.",
            stars: r.stargazers_count,
            language: r.language || "Unknown"
          }]
        });
      }

      // Fetch user's repos
      const githubRes = await fetch("https://api.github.com/user/repos?per_page=30&sort=pushed", { headers });
      if (!githubRes.ok) {
        throw new Error(`GitHub returned status ${githubRes.status}`);
      }
      const rawRepos = await githubRes.json();
      const repos = rawRepos.map((r: any) => ({
        id: r.id,
        name: r.name,
        owner: r.owner.login,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language
      }));
      return res.json({ repos });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch repositories" });
    }
  }

  // Real GitLab API
  if (provider === "gitlab") {
    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${accessToken}`
      };
      
      const gitLabRes = await fetch("https://gitlab.com/api/v4/projects?membership=true&simple=true&per_page=30&order_by=last_activity_at", { headers });
      if (!gitLabRes.ok) {
        throw new Error(`GitLab returned status ${gitLabRes.status}`);
      }
      const rawRepos = await gitLabRes.json();
      const repos = rawRepos.map((r: any) => ({
        id: r.id,
        name: r.name,
        owner: r.namespace.path,
        description: r.description,
        stars: r.star_count,
        language: "Project"
      }));
      return res.json({ repos });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch GitLab projects" });
    }
  }

  res.json({ repos: SANDBOX_REPOS });
});

// List Pull Requests / Merge Requests
app.post("/api/github/pulls", async (req, res) => {
  const { provider, accessToken, repoId, owner, repo } = req.body;

  if (String(repoId).startsWith("sandbox-") || provider === "sandbox") {
    const list = SANDBOX_PRS[repoId] || [];
    return res.json({ pulls: list });
  }

  if (provider === "github") {
    try {
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "AI-Code-Reviewer-Assistant"
      };
      const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc`;
      const githubRes = await fetch(url, { headers });
      
      if (!githubRes.ok) {
        throw new Error(`GitHub returned status ${githubRes.status}`);
      }
      const rawPulls = await githubRes.json();
      const pulls = rawPulls.map((p: any) => ({
        id: p.id,
        number: p.number,
        title: p.title,
        author: p.user.login,
        authorAvatar: p.user.avatar_url,
        branch: p.head.ref,
        createdAt: p.created_at,
        status: p.state
      }));
      return res.json({ pulls });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch Pull Requests" });
    }
  }

  if (provider === "gitlab") {
    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${accessToken}`
      };
      // GitLab Merge Requests
      const url = `https://gitlab.com/api/v4/projects/${repoId}/merge_requests?state=opened`;
      const gitlabRes = await fetch(url, { headers });
      if (!gitlabRes.ok) {
        throw new Error(`GitLab returned status ${gitlabRes.status}`);
      }
      const rawMrs = await gitlabRes.json();
      const pulls = rawMrs.map((m: any) => ({
        id: m.id,
        number: m.iid, // Merge Request IID is the displayed incremental ID
        title: m.title,
        author: m.author.username,
        authorAvatar: m.author.avatar_url,
        branch: m.source_branch,
        createdAt: m.created_at,
        status: m.state === "opened" ? "open" : m.state
      }));
      return res.json({ pulls });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch GitLab Merge Requests" });
    }
  }

  res.json({ pulls: [] });
});

// List file changes with content/patch
app.post("/api/github/pull-files", async (req, res) => {
  const { provider, accessToken, repoId, owner, repo, pullNumber } = req.body;

  if (String(repoId).startsWith("sandbox-") || provider === "sandbox") {
    const filesMap = SANDBOX_FILES[repoId] || {};
    const files = filesMap[pullNumber] || [];
    return res.json({ files });
  }

  if (provider === "github") {
    try {
      const headers: Record<string, string> = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "AI-Code-Reviewer-Assistant"
      };
      const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`;
      const githubRes = await fetch(url, { headers });
      if (!githubRes.ok) {
        throw new Error(`GitHub returned status ${githubRes.status}`);
      }
      const rawFiles = await githubRes.json();
      const files = rawFiles.map((f: any) => ({
        path: f.filename,
        additions: f.additions,
        deletions: f.deletions,
        status: f.status,
        patch: f.patch || ""
      }));
      return res.json({ files });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch pull request files" });
    }
  }

  if (provider === "gitlab") {
    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${accessToken}`
      };
      // GitLab Merge Request changes
      const url = `https://gitlab.com/api/v4/projects/${repoId}/merge_requests/${pullNumber}/changes`;
      const gitlabRes = await fetch(url, { headers });
      if (!gitlabRes.ok) {
        throw new Error(`GitLab returned status ${gitlabRes.status}`);
      }
      const data = await gitlabRes.json();
      const files = (data.changes || []).map((c: any) => ({
        path: c.new_path,
        additions: parseInt(c.diff.match(/^\+/g)?.length || 0),
        deletions: parseInt(c.diff.match(/^-/g)?.length || 0),
        status: c.new_file ? 'added' : c.deleted_file ? 'deleted' : 'modified',
        patch: c.diff || ""
      }));
      return res.json({ files });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch GitLab MR changes" });
    }
  }

  res.json({ files: [] });
});

// Review Code API (Gemini Client Call)
app.post("/api/review", async (req, res) => {
  try {
    const { fileName, patch, focusType, promptAddon } = req.body;

    if (!patch || patch.trim().length === 0) {
      return res.status(400).json({ error: "Code changes patch or text is required for review." });
    }

    const reviewFocusGuide = {
      bugs: "Identify logical flaws, off-by-one errors, edge cases, crash conditions, unhandled rejections, race conditions, or syntax errors.",
      security: "Identify critical vulnerabilities like OWASP Top 10, SQL injection, secrets exposure, lacking session controls, injection, XSS, insecure dependencies, cleartext sensitive data, bypasses.",
      performance: "Identify slow execution, memory leaks, deep recursion bottleneck, unnecessary state loops in React, wasteful calculations, missing indexes, un-cleared intervals.",
      style: "Identify code complexity, code smells, lack of typing, inconsistent formatting, poor naming convention, bloated components."
    };

    let selectedFocusGuide = "Review full aspects including bugs, security vulnerabilities, performance optimization, structural code smells, and elegant patterns.";
    if (focusType && reviewFocusGuide[focusType as keyof typeof reviewFocusGuide]) {
      selectedFocusGuide = reviewFocusGuide[focusType as keyof typeof reviewFocusGuide];
    }

    const sysInstruction = `You are a world-class Principal Software Engineer, Security Auditor, and Developer Advocate.
Analyze the provided code diff patch or file content, and generate a comprehensive review.
Focus area instruction to heavily prioritize: ${selectedFocusGuide}
User custom review instruction addon: ${promptAddon || "None"}

Your response MUST follow the specified JSON schema exactly.
Quality scoring metrics:
- Give an overall PR score out of 100 representing the code health and readiness to merge (high quality/clean is 90+, severe security vulnerabilities or crashes drop it below 65).
- Give a metric object counting how many items of each type you found.
- Make 'comments' array detailed, accurate, and point to actual line numbers found in the diff or file (use 1-based indexes if matching, or general lines).
- Be constructive, technical, and provide exact, ready-to-use 'suggestedCode' where relevant. Feel free to praise excellent code design as well with a 'praise' comment type to keep developer motivation high!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: `File name: ${fileName}` },
        { text: `Code changes / Patch to analyze:\n\`\`\`\n${patch}\n\`\`\`` }
      ],
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "Code health quality score out of 100 (e.g., 85). If severe vulnerabilities or bugs are found, score should be significantly lower (e.g. 40-60)." 
            },
            summary: { 
              type: Type.STRING, 
              description: "A professional, inspiring, high-level summary of the entire code diff in markdown format. Explain the major risks, strengths, and standard validation recommendations." 
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                bugsFound: { type: Type.INTEGER },
                securityVulnerabilities: { type: Type.INTEGER },
                performanceIssues: { type: Type.INTEGER },
                styleIssues: { type: Type.INTEGER },
                positives: { type: Type.INTEGER }
              },
              required: ["bugsFound", "securityVulnerabilities", "performanceIssues", "styleIssues", "positives"]
            },
            comments: {
              type: Type.ARRAY,
              description: "Actionable inline suggestions or comments referencing specific portions of code.",
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { 
                    type: Type.INTEGER, 
                    description: "Estimated line number in the source file where this comment applies, or -1 if general comments." 
                  },
                  type: { 
                    type: Type.STRING, 
                    description: "Type of finding. Must be exactly one of: bug, security, issue, suggestion, praise" 
                  },
                  title: { 
                    type: Type.STRING, 
                    description: "Short technical header highlighting the issue (e.g., 'SQL Injection Vulnerability', 'Infinite re-render warning')." 
                  },
                  severity: { 
                    type: Type.STRING, 
                    description: "Must be exactly one of: critical, warning, info" 
                  },
                  message: { 
                    type: Type.STRING, 
                    description: "In-depth explanation of the issue, standard implications, and repair advice in clean markdown." 
                  },
                  originalCode: { 
                    type: Type.STRING, 
                    description: "The specific line or snippet from the code being discussed." 
                  },
                  suggestedCode: { 
                    type: Type.STRING, 
                    description: "The precise replacement block (fully styled syntax code) to resolve the issue. Leave blank or empty if none." 
                  }
                },
                required: ["line", "type", "title", "severity", "message"]
              }
            }
          },
          required: ["score", "summary", "metrics", "comments"]
        }
      }
    });

    const reportText = response.text || "{}";
    const reportData = JSON.parse(reportText);
    res.json(reportData);
  } catch (error: any) {
    console.error("Gemini Code Review Error:", error);
    res.status(500).json({ error: error.message || "Gemini code analysis failed." });
  }
});

// Refine Review Report API (Follow-up prompts adjusting current review state)
app.post("/api/review/refine", async (req, res) => {
  try {
    const { fileName, patch, previousReport, refineInstruction, focusType, promptAddon } = req.body;

    if (!refineInstruction || refineInstruction.trim().length === 0) {
      return res.status(400).json({ error: "Refinement / instruction text is required." });
    }

    const sysInstruction = `You are a world-class Principal Software Engineer, Security Auditor, and Developer Advocate.
You are refining an existing AI Code Review Report for the file: "${fileName}".

The original code changes diff is:
\`\`\`
${patch || "No patch content"}
\`\`\`

Here is the previous review report that was generated:
${JSON.stringify(previousReport || {}, null, 2)}

The user has requested the following specific refinements or follow-up edits:
"${refineInstruction}"

Analyze the code changes again and ADJUST, REGENERATE, or EXPAND specific parts of the report as requested by the user.
- If the user wants to focus on a particular bug or line, zoom in on that and update the summary, score, metrics, and comments list accordingly.
- If they want to ignore or mark an issue as safe, remove it from the 'comments' array and increase the 'score' appropriately.
- If they ask to analyze performance, style, or security in more depth, add detailed finding comments and adjust metrics.
- Regenerate the executive 'summary' to explain the changes made compared to the previous report, and outline what has been scrutinized now.
- Keep the response schema EXACTLY the same as the previous report. Keep comment IDs consistent if updating them, or generate new ones.

Your response MUST follow the specified JSON schema exactly.
Quality scoring metrics:
- Give an overall PR score out of 100 representing the code health and readiness to merge.
- Give a metric object counting how many items of each type you found.
- Make 'comments' array detailed, accurate, and point to actual line numbers found in the diff or file (use 1-based indexes if matching, or general lines).
- Be constructive, technical, and provide exact, ready-to-use 'suggestedCode' where relevant. Feel free to praise excellent code design as well with a 'praise' comment type to keep developer motivation high!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: `File name: ${fileName}` },
        { text: `Code changes / Patch to analyze:\n\`\`\`\n${patch}\n\`\`\`` },
        { text: `User refinement command:\n${refineInstruction}` }
      ],
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "Updated code health quality score out of 100." 
            },
            summary: { 
              type: Type.STRING, 
              description: "Adjusted professional markdown summary explaining the refined results, addressed items, or additional risks." 
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                bugsFound: { type: Type.INTEGER },
                securityVulnerabilities: { type: Type.INTEGER },
                performanceIssues: { type: Type.INTEGER },
                styleIssues: { type: Type.INTEGER },
                positives: { type: Type.INTEGER }
              },
              required: ["bugsFound", "securityVulnerabilities", "performanceIssues", "styleIssues", "positives"]
            },
            comments: {
              type: Type.ARRAY,
              description: "Actionable inline suggestions or comments referencing specific portions of code.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Keep previous comment ID if referring to the same issue, or specify a new unique ID." },
                  line: { 
                    type: Type.INTEGER, 
                    description: "Estimated line number in the source file." 
                  },
                  type: { 
                    type: Type.STRING, 
                    description: "Type of finding. Must be exactly one of: bug, security, issue, suggestion, praise" 
                  },
                  title: { 
                    type: Type.STRING, 
                    description: "Short technical header highlighting the issue." 
                  },
                  severity: { 
                    type: Type.STRING, 
                    description: "Must be exactly one of: critical, warning, info" 
                  },
                  message: { 
                    type: Type.STRING, 
                    description: "Explanation of the issue and repair advice in clean markdown." 
                  },
                  originalCode: { 
                    type: Type.STRING, 
                    description: "The specific line or snippet from the code being discussed." 
                  },
                  suggestedCode: { 
                    type: Type.STRING, 
                    description: "The precise replacement block (fully styled syntax code) to resolve the issue. Leave blank if none." 
                  }
                },
                required: ["line", "type", "title", "severity", "message"]
              }
            }
          },
          required: ["score", "summary", "metrics", "comments"]
        }
      }
    });

    const reportText = response.text || "{}";
    const reportData = JSON.parse(reportText);
    res.json(reportData);
  } catch (error: any) {
    console.error("Gemini Code Review Refine Error:", error);
    res.status(500).json({ error: error.message || "Failed to refine review report with Gemini." });
  }
});

// Drill Deeper into Specific Finding API (Educational breakdown, CWE linkages, secure sandboxing)
app.post("/api/review/drill-deeper", async (req, res) => {
  try {
    const { fileName, patch, comment, userQuestion } = req.body;

    if (!comment) {
      return res.status(400).json({ error: "Target comment finding information is required." });
    }

    const sysInstruction = `You are a Senior Principal Security Architect, Threat Modeler, and legendary Technical Educator.
Analyze the target code finding finding and provide a world-class, deep-dive architectural analysis, step-by-step remediation plan, secure code patches, and compliance mappings.

File context: "${fileName}"
Source diff patch:
\`\`\`
${patch || "No patch content available"}
\`\`\`

TARGET ANALYSIS COMMENT:
- Title: "${comment.title}"
- Type: "${comment.type}"
- Severity: "${comment.severity}"
- Selected Line: ${comment.line}
- Summary explanation: "${comment.message}"
- Original Snippet: "${comment.originalCode || ""}"
- Suggested Fix: "${comment.suggestedCode || ""}"

${userQuestion ? `The developer has asked a specific follow-up question regarding this issue:\n"${userQuestion}"\nAnalyze and answer this question directly inside the explanation concept and the step-by-step guidance.` : ""}

Your response MUST adhere strictly to the requested JSON response schema. No extra text, fields, or markdown wrapping around the JSON code output structure. Build superb explanations featuring threat models, real-world examples, and industry-standard mitigations (OWASP Top 10, CWE principles, or memory safety guarantees).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: `File name: ${fileName}` },
        { text: `Code changes / Patch:\n${patch || ""}` },
        { text: `Actionable comment: ${JSON.stringify(comment)}` },
        { text: userQuestion ? `User follow-up question: ${userQuestion}` : `Drill down requested.` }
      ],
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concept: { 
              type: Type.STRING, 
              description: "A highly expert, educational, and detailed architectural explanation of the specific issue, threat models involved, or underlying coding mechanics in rich markdown format. Integrate deep technical depth, CWE descriptions, or engine compilation realities here."
            },
            stepByStep: {
              type: Type.ARRAY,
              description: "A sequence of rigorous, clean developer actions or verification/testing steps to implement the fix, deploy it, and prevent regression.",
              items: { type: Type.STRING }
            },
            securedCode: {
              type: Type.STRING,
              description: "Perfect, fully typesafe, ready-to-use refactored code matching the best standard coding conventions. Include helpful inner comments explaining the fix."
            },
            standardsMatches: {
              type: Type.ARRAY,
              description: "List of relevant standards, guidelines, or CWE/OWASP categorizations matching this finding (e.g., 'CWE-79 Cross-site Scripting', 'React Hooks Closure Trap').",
              items: { type: Type.STRING }
            }
          },
          required: ["concept", "stepByStep", "securedCode", "standardsMatches"]
        }
      }
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Drill Deeper Error:", error);
    res.status(500).json({ error: error.message || "Failed to drill deeper with Gemini." });
  }
});

// Configure Vite or Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Code Review Server listening on port ${PORT}`);
  });
}

startServer();
