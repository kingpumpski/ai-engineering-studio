#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const policy=JSON.parse(fs.readFileSync(path.join(root,'config','routing-policy.json'),'utf8'));
const text=process.argv.slice(2).join(' ').toLowerCase();
let role='general';
if(/debug|error|architecture|security|vulnerab|release|deploy|complex|design/.test(text)) role='reasoning';
else if(/code|implement|refactor|typescript|react|python|sql|test|feature|build/.test(text)) role='coding';
else if(/explain|summarize|status|quick|what is/.test(text)) role='fast';
const cfg=policy.roles[role];
const provider=process.env.WORK_PROVIDER || policy.defaultProvider;
const model=process.env.WORK_OLLAMA_MODEL || process.env.WORK_OLLAMA_CODING_MODEL || cfg.preferred[0];
console.log(JSON.stringify({provider,role,model,local:provider==='ollama',fallbacks:cfg.fallback,cloudAllowed:Boolean(process.env.OPENAI_API_KEY||process.env.ANTHROPIC_API_KEY||process.env.GEMINI_API_KEY||process.env.OPENROUTER_API_KEY),reason:`selected ${role} from task capabilities`},null,2));
