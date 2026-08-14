#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const modelConfig = JSON.parse(fs.readFileSync(path.join(root, 'config/models.json'), 'utf8'));
const agentConfig = JSON.parse(fs.readFileSync(path.join(root, 'config/agents.json'), 'utf8'));

const args = process.argv.slice(2);
const command = args[0] || 'status';
const input = args.slice(1).join(' ').trim();

function env(name, fallback) { return process.env[name] || fallback; }
function ollamaModel(role = 'coding') {
  const item = modelConfig.providers.ollama.models[role] || modelConfig.providers.ollama.models.coding;
  return env(item.env, item.default);
}
function ollamaUrl() { return env('OLLAMA_BASE_URL', modelConfig.providers.ollama.baseUrl); }
function fail(message) { console.error(`work: ${message}`); process.exit(1); }
function printHelp() {
  console.log(`\nwork — project AI engineering orchestrator\n\nUsage:\n  work "implement seller routes"\n  work ask "explain this error"\n  work plan "design the next phase"\n  work review [path]\n  work debug "<error>"\n  work status\n  work agents\n  work models\n\nDefault runtime: Ollama (no API key required).\n`);
}
function ollamaGenerate(prompt, model = ollamaModel('coding')) {
  try {
    const output = execFileSync('curl', ['-fsS', `${ollamaUrl()}/api/generate`, '-H', 'Content-Type: application/json', '-d', JSON.stringify({ model, prompt, stream: false })], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const data = JSON.parse(output);
    console.log(data.response || output);
  } catch (error) {
    fail(`Ollama is unavailable at ${ollamaUrl()}. Start the local runtime or run 'work status'.`);
  }
}
function collectContext() {
  try {
    const status = execFileSync('git', ['status', '--short'], { cwd: process.cwd(), encoding: 'utf8' });
    const branch = execFileSync('git', ['branch', '--show-current'], { cwd: process.cwd(), encoding: 'utf8' }).trim();
    return `Repository: ${process.cwd()}\nBranch: ${branch}\nGit status:\n${status || '(clean)'}`;
  } catch { return `Working directory: ${process.cwd()}`; }
}

if (command === 'help' || command === '--help' || command === '-h') { printHelp(); process.exit(0); }
if (command === 'agents') {
  for (const agent of agentConfig.agents) console.log(`${agent.id.padEnd(14)} ${agent.role}`);
  process.exit(0);
}
if (command === 'models') {
  console.log(`Ollama URL: ${ollamaUrl()}`);
  console.log(`coding:   ${ollamaModel('coding')}`);
  console.log(`reasoning: ${ollamaModel('reasoning')}`);
  console.log(`fast:     ${ollamaModel('fast')}`);
  console.log(`general:  ${ollamaModel('general')}`);
  process.exit(0);
}
if (command === 'status') {
  try {
    const output = execFileSync('curl', ['-fsS', `${ollamaUrl()}/api/tags`], { encoding: 'utf8' });
    const data = JSON.parse(output);
    console.log(`Ollama: ONLINE (${ollamaUrl()})`);
    console.log(`Coding model: ${ollamaModel('coding')}`);
    console.log(`Installed models: ${(data.models || []).map(m => m.name).join(', ') || '(none)'}`);
  } catch { console.log(`Ollama: OFFLINE (${ollamaUrl()})`); process.exitCode = 1; }
  process.exit();
}

const mode = command === 'ask' || command === 'plan' || command === 'debug' || command === 'review' ? command : 'ask';
const task = input || (command !== 'ask' && command !== 'plan' && command !== 'debug' && command !== 'review' ? args.join(' ') : '');
if (!task) printHelp();
else {
  const role = mode === 'plan' ? 'architect' : mode === 'debug' ? 'debug' : mode === 'review' ? 'review' : 'frontend';
  const agent = agentConfig.agents.find(a => a.id === role);
  const context = collectContext();
  const prompt = `You are the ${agent?.role || 'Work Orchestrator'} in a multi-agent software engineering team.\nFollow the repository's AGENTS.md and local instructions when present.\nDo not invent files or APIs. State assumptions. Prefer small, verifiable changes.\n\nTask:\n${task}\n\nContext:\n${context}`;
  ollamaGenerate(prompt, ollamaModel(agent?.modelRole || 'coding'));
}
