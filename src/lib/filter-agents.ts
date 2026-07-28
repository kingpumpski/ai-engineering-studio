import { AGENTS, type Agent } from "@/lib/agents-data";

// Module-level LRU-ish cache — reused across renders and route changes.
const cache = new Map<string, Agent[]>();
const MAX = 64;

export function filterAgents(cat: string, q: string, fields: "basic" | "full" = "basic"): Agent[] {
  const key = `${fields}|${cat}|${q}`;
  const hit = cache.get(key);
  if (hit) {
    // refresh recency
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const s = q.trim().toLowerCase();
  const result = AGENTS.filter((a) => {
    const okCat = cat === "All" || a.category === cat;
    if (!okCat) return false;
    if (!s) return true;
    if (
      a.name.toLowerCase().includes(s) ||
      a.role.toLowerCase().includes(s) ||
      a.summary.toLowerCase().includes(s)
    )
      return true;
    if (fields === "full") {
      if (a.supports?.some((x) => x.toLowerCase().includes(s))) return true;
      if (a.knowledge?.some((x) => x.toLowerCase().includes(s))) return true;
    }
    return false;
  });
  cache.set(key, result);
  if (cache.size > MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  return result;
}
