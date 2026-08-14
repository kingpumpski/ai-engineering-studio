export type ContextKind = "file" | "symbol" | "document" | "git" | "task";

export interface ContextItem {
  id: string;
  path: string;
  kind: ContextKind;
  content: string;
  score: number;
  tokens: number;
  reasons: string[];
}

export interface ContextRequest {
  objective: string;
  repositoryPath: string;
  include?: string[];
  exclude?: string[];
  maxItems?: number;
  maxTokens?: number;
}

export interface ContextSnapshot {
  id: string;
  createdAt: string;
  objective: string;
  items: ContextItem[];
  totalTokens: number;
}

const DEFAULT_EXCLUDES = ["node_modules", ".git", "dist", "build", ".next", "coverage", ".env", ".env.*"];

export function rankContext(items: ContextItem[], objective: string, maxItems = 12, maxTokens = 12000): ContextItem[] {
  const terms = objective.toLowerCase().split(/\W+/).filter(Boolean);
  return [...items]
    .map((item) => {
      const haystack = `${item.path} ${item.content}`.toLowerCase();
      const matches = terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
      return { ...item, score: item.score + matches };
    })
    .sort((a, b) => b.score - a.score)
    .reduce<{ items: ContextItem[]; tokens: number }>((acc, item) => {
      if (acc.items.length >= maxItems || acc.tokens + item.tokens > maxTokens) return acc;
      acc.items.push(item);
      acc.tokens += item.tokens;
      return acc;
    }, { items: [], tokens: 0 }).items;
}

export function sanitizeContext(content: string): string {
  return content
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_SECRET]")
    .replace(/(api[_-]?key|secret|password|token)\s*[:=]\s*["']?[^\s"']+/gi, "$1=[REDACTED]");
}

export function buildContextSnapshot(request: ContextRequest, items: ContextItem[]): ContextSnapshot {
  const excludes = [...DEFAULT_EXCLUDES, ...(request.exclude ?? [])];
  const filtered = items
    .filter((item) => !excludes.some((entry) => item.path === entry || item.path.startsWith(`${entry}/`)))
    .map((item) => ({ ...item, content: sanitizeContext(item.content) }));
  const selected = rankContext(filtered, request.objective, request.maxItems, request.maxTokens);
  return { id: `ctx_${Date.now().toString(36)}`, createdAt: new Date().toISOString(), objective: request.objective, items: selected, totalTokens: selected.reduce((sum, item) => sum + item.tokens, 0) };
}
