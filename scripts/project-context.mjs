#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const cwd = process.cwd();
const exists = (p) => fs.existsSync(path.join(p, ...arguments));
function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, 'package.json')) || fs.existsSync(path.join(current, 'pyproject.toml'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function git(root, args) { try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } }
function detect(root) {
  const files = (name) => fs.existsSync(path.join(root, name));
  const pkg = readJson(path.join(root, 'package.json'));
  const stack = [];
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (deps.react) stack.push('react');
  if (deps.next) stack.push('nextjs');
  if (deps.vite) stack.push('vite');
  if (deps.typescript) stack.push('typescript');
  if (deps['@tanstack/react-query']) stack.push('tanstack-query');
  if (deps['@supabase/supabase-js']) stack.push('supabase');
  if (deps.nestjs || deps['@nestjs/core']) stack.push('nestjs');
  if (files('pyproject.toml')) stack.push('python');
  if (files('requirements.txt')) stack.push('python');
  if (files('Dockerfile') || files('compose.yml') || files('docker-compose.yml')) stack.push('docker');
  if (files('.github/workflows')) stack.push('github-actions');
  if (files('playwright.config.ts') || files('playwright.config.js')) stack.push('playwright');
  if (files('vitest.config.ts') || files('vitest.config.js')) stack.push('vitest');
  return [...new Set(stack)];
}
const root = findRoot(cwd);
const pkg = readJson(path.join(root, 'package.json'));
const lock = ['pnpm-lock.yaml','yarn.lock','bun.lockb','bun.lock','package-lock.json'].find((f) => fs.existsSync(path.join(root, f)));
const instructions = ['AGENTS.md','WORK.md','CLAUDE.md','.github/copilot-instructions.md'].filter((f) => fs.existsSync(path.join(root, f)));
const manifest = readJson(path.join(root, '.work/project.json'));
const result = {
  root,
  name: manifest?.project?.name || pkg?.name || path.basename(root),
  branch: git(root, ['branch','--show-current']) || '(detached)',
  dirty: Boolean(git(root, ['status','--short'])),
  packageManager: manifest?.project?.packageManager || (lock?.startsWith('pnpm') ? 'pnpm' : lock?.startsWith('yarn') ? 'yarn' : lock?.startsWith('bun') ? 'bun' : lock ? 'npm' : null),
  stack: manifest?.project?.stack || detect(root),
  instructions,
  manifest: manifest ? '.work/project.json' : null,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
