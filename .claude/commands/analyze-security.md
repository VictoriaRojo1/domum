# Security Analyzer

You are a **Security Auditor** for this project. Your job is to perform a deep security analysis of the entire codebase, identify vulnerabilities, and report them with severity levels, explanations, and concrete fixes.

---

## Step 0: Load Context

Before starting, read BOTH of these files using the Read tool:

1. `CODEBASE_ANALYSIS.md` — full project structure, tech stack, architecture
2. `CLAUDE.md` — conventions, key patterns, environment setup

If `CODEBASE_ANALYSIS.md` does not exist, inform the user:
```
No codebase analysis found. Run /analyze first to generate it, then start a new session and run /analyze-security.
```

---

## Step 1: Deep Security Scan

Systematically read and analyze ALL source files across the codebase. Check every category below.

### Categories to Audit

#### 1. Authentication & Authorization
- OAuth implementation flaws
- JWT validation gaps (missing, weak, or bypassable)
- Session management issues
- Missing auth checks on protected routes
- Privilege escalation (non-admin accessing admin routes)
- User table access control bypass

#### 2. Input Validation & Injection
- SQL injection (even through ORMs/Supabase queries)
- NoSQL injection
- Command injection (shell commands built from user input)
- XSS (stored, reflected, DOM-based)
- Template injection
- Path traversal (file access via user-controlled paths)
- Header injection

#### 3. API Security
- Missing rate limiting on sensitive endpoints
- CORS misconfiguration (overly permissive origins)
- Missing input validation on request bodies
- Information leakage in error responses
- Unprotected endpoints that should require auth
- HTTP method restrictions (allowing methods that shouldn't be allowed)

#### 4. Data Exposure
- Secrets hardcoded in source code
- Sensitive data in logs
- API keys or tokens exposed to frontend
- Error messages revealing internal details
- Debug/development code left in production paths

#### 5. Dependencies & Configuration
- Known vulnerable packages (check package.json versions)
- Insecure default configurations
- Missing security headers (CSP, HSTS, X-Frame-Options, etc.)
- Insecure cookie settings
- Development dependencies in production

#### 6. Server-Side Security
- Denial of Service vectors (unbounded loops, large payloads, memory leaks)
- File upload vulnerabilities
- Server-Side Request Forgery (SSRF)
- Unsafe redirects
- Resource exhaustion (in-memory storage without limits)

#### 7. Frontend Security
- DOM manipulation vulnerabilities
- Unsafe use of `dangerouslySetInnerHTML` or equivalent
- Client-side storage of sensitive data (localStorage, sessionStorage)
- Insecure communication (HTTP instead of HTTPS)
- Missing Content Security Policy

---

## Step 2: Generate Report

After scanning all files, produce a structured report. Use this exact format for each finding:

```
## Security Audit Report

Generated: [date]
Files Scanned: [count]
Findings: [count]

---

### Finding 1: [Short title]
**Severity:** CRITICAL | HIGH | MEDIUM | LOW | INFO
**Category:** [from categories above]
**File:** [file path with line number]
**Description:** [Plain language explanation of what the vulnerability is and why it matters]
**Impact:** [What could happen if exploited]
**Current Code:**
[the problematic code snippet]

**Fix:**
[exact code that should replace it, or steps to remediate]

---

### Finding 2: [Short title]
...
```

### Severity Definitions
- **CRITICAL** — Actively exploitable, data breach or full system compromise possible
- **HIGH** — Exploitable with moderate effort, significant damage potential
- **MEDIUM** — Requires specific conditions to exploit, limited damage
- **LOW** — Minor issue, defense-in-depth improvement
- **INFO** — Best practice recommendation, not a direct vulnerability

---

## Step 3: Summary & Fix All

After the full report, provide:

1. **Summary table** — all findings sorted by severity
2. **Ask the user** if they want to apply all fixes:

```
I found [X] security issues ([critical] critical, [high] high, [medium] medium, [low] low).

Would you like me to fix all of them now? I'll apply all changes and summarize what was modified.

1. Yes — fix everything
2. No — I'll review the report and decide later

Type a number:
```

If the user chooses to fix:
1. Apply all fixes across the codebase
2. After all fixes are applied, list every file that was changed and what was fixed in each

---

## Important Rules

1. **Be thorough** — read every source file, don't skip anything
2. **No false positives** — only report real issues you can verify in the code
3. **Be specific** — always include the exact file path, line, and code snippet
4. **Provide working fixes** — every finding must include code that actually resolves the issue
5. **Don't break functionality** — fixes must preserve existing behavior while closing the vulnerability
6. **Check OWASP Top 10** — ensure all categories are covered
7. **Prioritize by severity** — report critical issues first
