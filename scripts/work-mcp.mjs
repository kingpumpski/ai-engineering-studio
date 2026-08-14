#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = () => {
  let p = process.cwd();
  while (p !== path.dirname(p)) {
    if (fs.existsSync(path.join(p, '.git')) || fs.existsSync(path.join(p, 'package.json')) || fs.existsSync(path.join(p, 'pyproject.toml'))) return p;
    p = path.dirname(p);
  }
  return process.cwd();
};
const run = (name, args, cwd = projectRoot()) => execFileSync(name, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const send = (id, result) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
const error = (id, message, code = -32000) => send(id, { error: { code, message } });
const text = (value) => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });
const protectedPath = (relative) => /(^|\/)(\.env($|\.)|.*\.(pem|key|p12|pfx)$)/i.test(relative) || /^\.git(\/|$)/.test(relative);

const tools = [
  { name: 'project_context', description: 'Discover the current project, technology stack, branch, git status and local agent instructions.', inputSchema: { type: 'object', properties: {} } },
  { name: 'git_status', description: 'Return git branch and working-tree status for the current project.', inputSchema: { type: 'object', properties: {} } },
  { name: 'read_file', description: 'Read a non-secret UTF-8 project file. Paths must remain inside the current project.', inputSchema: { type: 'object', properties: { path: { type: 'string' }, maxBytes: { type: 'number' } }, required: ['path'] } },
  { name: 'search_files', description: 'Search tracked project files for a text pattern using git grep.', inputSchema: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] } },
  { name: 'run_task', description: 'Send a task with project context to the local Work Ollama runtime. Advisory only; it does not modify files.', inputSchema: { type: 'object', properties: { task: { type: 'string' }, role: { type: 'string' } }, required: ['task'] } }
];

function context() {
  const root = projectRoot();
  let branch = '(unknown)', status = '(unknown)';
  try { branch = run('git', ['branch', '--show-current'], root).trim() || '(detached)'; status = run('git', ['status', '--short'], root) || '(clean)'; } catch {}
  const pkg = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')); } catch { return null; } })();
  const instructionNames = ['AGENTS.md', 'WORK.md', 'CLAUDE.md', '.github/copilot-instructions.md'];
  const instructions = instructionNames.filter(f => fs.existsSync(path.join(root, f))).map(f => ({ file: f, content: fs.readFileSync(path.join(root, f), 'utf8').slice(0, 12000) }));
  return { root, name: pkg?.name || path.basename(root), branch, status, packageManager: pkg ? (fs.existsSync(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : fs.existsSync(path.join(root, 'yarn.lock')) ? 'yarn' : 'npm') : null, instructions };
}

async function handle(message) {
  const { id, method, params = {} } = message;
  if (method === 'initialize') return send(id, { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'work-mcp', version: '0.2.1' } });
  if (method === 'notifications/initialized') return;
  if (method === 'tools/list') return send(id, { tools });
  if (method !== 'tools/call') return error(id, `Unsupported method: ${method}`, -32601);
  const name = params.name;
  try {
    if (name === 'project_context') return send(id, text(context()));
    if (name === 'git_status') return send(id, text({ root: projectRoot(), branch: run('git', ['branch', '--show-current']).trim(), status: run('git', ['status', '--short']) || '(clean)' }));
    if (name === 'read_file') {
      const root = projectRoot(); const relative = String(params.arguments?.path || '').replaceAll('\\', '/');
      if (!relative || protectedPath(relative)) return error(id, 'This path is protected and cannot be read by the Work MCP bridge.');
      const target = path.resolve(root, relative);
      if (target !== root && !target.startsWith(`${root}${path.sep}`)) return error(id, 'Path is outside the current project.');
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return error(id, 'File not found.');
      const max = Math.min(Number(params.arguments?.maxBytes || 50000), 200000);
      return send(id, text(fs.readFileSync(target, 'utf8').slice(0, max)));
    }
    if (name === 'search_files') {
      const pattern = String(params.arguments?.pattern || '');
      if (!pattern) return error(id, 'pattern is required.');
      return send(id, text(run('git', ['grep', '-n', '--', pattern], projectRoot())));
    }
    if (name === 'run_task') {
      const task = String(params.arguments?.task || '');
      if (!task) return error(id, 'task is required.');
      const url = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
      const model = process.env.WORK_OLLAMA_CODING_MODEL || 'qwen3:8b';
      const c = context();
      const prompt = `You are the Work Orchestrator. Project=${c.name}; root=${c.root}; branch=${c.branch}; git=${c.status}. Local instructions=${JSON.stringify(c.instructions)}. Task=${task}. Provide an actionable engineering response. Do not claim that files were changed.`;
      const output = run('curl', ['-fsS', `${url}/api/generate`, '-H', 'Content-Type: application/json', '-d', JSON.stringify({ model, prompt, stream: false })]);
      return send(id, text(JSON.parse(output).response || output));
    }
    return error(id, `Unknown tool: ${name}`);
  } catch (e) { return error(id, e?.message || String(e)); }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', async chunk => {
  buffer += chunk;
  const lines = buffer.split('\n'); buffer = lines.pop() || '';
  for (const line of lines.filter(Boolean)) {
    try { await handle(JSON.parse(line)); } catch (e) { process.stderr.write(`work-mcp: ${e.message}\n`); }
  }
});
