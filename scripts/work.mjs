#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const runtimeRoot = path.dirname(new URL(import.meta.url).pathname);
const modelConfig = JSON.parse(fs.readFileSync(path.join(runtimeRoot, 'config/models.json'), 'utf8'));
const agentConfig = JSON.parse(fs.readFileSync(path.join(runtimeRoot, 'config/agents.json'), 'utf8'));
const args = process.argv.slice(2);
const command = args[0] || 'status';
const input = args.slice(1).join(' ').trim();

const env = (name, fallback) => process.env[name] || fallback;
const ollamaModel = (role = 'coding') => { const item = modelConfig.providers.ollama.models[role] || modelConfig.providers.ollama.models.coding; return env(item.env, item.default); };
const ollamaUrl = () => env('OLLAMA_BASE_URL', modelConfig.providers.ollama.baseUrl);
const fail = (message) => { console.error(`work: ${message}`); process.exit(1); };
const run = (name, args, cwd = process.cwd()) => execFileSync(name, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function findProjectRoot(start = process.cwd()) {
  let current = path.resolve(start);
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, 'package.json')) || fs.existsSync(path.join(current, 'pyproject.toml'))) return current;
    current = path.dirname(current);
  }
  return path.resolve(start);
}
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function detectProject(root) {
  const pkg = readJson(path.join(root, 'package.json'));
  const files = new Set(fs.readdirSync(root, { withFileTypes: true }).map(e => e.name));
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const tech = [];
  const checks = [['react','React'],['next','Next.js'],['vite','Vite'],['typescript','TypeScript'],['tailwindcss','Tailwind CSS'],['@tanstack/react-router','TanStack Router'],['@supabase/supabase-js','Supabase'],['@nestjs/core','NestJS'],['express','Express'],['prisma','Prisma'],['@prisma/client','Prisma'],['playwright','Playwright'],['@playwright/test','Playwright'],['vitest','Vitest']];
  for (const [key, label] of checks) if (deps[key]) tech.push(label);
  if (files.has('pyproject.toml') || files.has('requirements.txt')) tech.push('Python');
  if (files.has('Dockerfile') || files.has('docker-compose.yml') || files.has('compose.yml')) tech.push('Docker');
  if (files.has('.github')) tech.push('GitHub Actions');
  if (files.has('.devcontainer')) tech.push('Dev Container');
  return { root, name: pkg?.name || path.basename(root), packageManager: pkg ? (files.has('pnpm-lock.yaml') ? 'pnpm' : files.has('yarn.lock') ? 'yarn' : 'npm') : null, technologies: [...new Set(tech)] };
}
function collectContext() {
  const root = findProjectRoot();
  const project = detectProject(root);
  let branch = '(unknown)', status = '(not a git repository)';
  try { branch = run('git', ['branch', '--show-current'], root).trim() || '(detached)'; status = run('git', ['status', '--short'], root) || '(clean)'; } catch {}
  let instructions = '';
  for (const name of ['AGENTS.md', 'WORK.md', 'CLAUDE.md', '.github/copilot-instructions.md']) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) instructions += `\n--- ${name} ---\n${fs.readFileSync(file, 'utf8').slice(0, 12000)}`;
  }
  return { ...project, branch, gitStatus: status, instructions };
}
function help() { console.log(`\nwork — cross-project AI engineering control plane\n\n  work "implement seller routes"\n  work ask "explain this error"\n  work plan "design the next phase"\n  work debug "investigate this build error"\n  work review [path]\n  work context\n  work doctor\n  work status\n  work agents\n  work models\n  work mcp\n`); }
function generate(prompt, model) {
  try {
    const output = run('curl', ['-fsS', `${ollamaUrl()}/api/generate`, '-H', 'Content-Type: application/json', '-d', JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.2 } })]);
    console.log(JSON.parse(output).response || output);
  } catch { fail(`Ollama is unavailable at ${ollamaUrl()}. Run 'work doctor'.`); }
}

if (['help','--help','-h'].includes(command)) { help(); process.exit(0); }
if (command === 'agents') { for (const a of agentConfig.agents) console.log(`${a.id.padEnd(14)} ${a.role.padEnd(30)} ${a.modelRole}`); process.exit(0); }
if (command === 'models') { console.log(`Ollama URL: ${ollamaUrl()}`); for (const r of ['coding','reasoning','fast','general']) console.log(`${r.padEnd(10)} ${ollamaModel(r)}`); process.exit(0); }
if (command === 'context') { console.log(JSON.stringify(collectContext(), null, 2)); process.exit(0); }
if (command === 'mcp') { execFileSync(process.execPath, [path.join(runtimeRoot, 'work-mcp.mjs')], { stdio: 'inherit' }); process.exit(0); }
if (command === 'status' || command === 'doctor') {
  const c = collectContext(); console.log(`Project: ${c.name}\nRoot:    ${c.root}\nBranch:  ${c.branch}\nStack:   ${c.technologies.join(', ') || 'undetected'}`);
  try { const data = JSON.parse(run('curl', ['-fsS', `${ollamaUrl()}/api/tags`])); const models = (data.models || []).map(m => m.name); console.log(`Ollama:  ONLINE (${ollamaUrl()})\nModels:  ${models.join(', ') || '(none)'}`); if (command === 'doctor' && !models.some(m => m === ollamaModel('coding') || m.startsWith(`${ollamaModel('coding')}:`))) console.log(`Warning: coding model '${ollamaModel('coding')}' is not installed.`); }
  catch { console.log(`Ollama:  OFFLINE (${ollamaUrl()})`); if (command === 'doctor') process.exitCode = 1; }
  process.exit();
}
const mode = ['ask','plan','debug','review'].includes(command) ? command : 'ask';
const task = input || (mode === 'review' && args[0] ? `Review ${args[0]}` : args.join(' '));
if (!task) { help(); process.exit(0); }
const role = mode === 'plan' ? 'architect' : mode === 'debug' ? 'debug' : mode === 'review' ? 'review' : 'frontend';
const agent = agentConfig.agents.find(a => a.id === role);
const c = collectContext();
const prompt = `You are the ${agent?.role || 'Work Orchestrator'} in a multi-agent software engineering team.\nProject: ${c.name}\nRepository: ${c.root}\nTechnology: ${c.technologies.join(', ') || 'unknown'}\nBranch: ${c.branch}\nGit status:\n${c.gitStatus}\n${c.instructions}\n\nTask:\n${task}\n\nRules: Do not invent APIs or files. State assumptions. Prefer small, verifiable changes. Never claim a change was made unless a tool actually made it.`;
generate(prompt, ollamaModel(agent?.modelRole || 'coding'));
