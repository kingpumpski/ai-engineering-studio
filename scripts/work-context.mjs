#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const args=process.argv.slice(2); const task=args[0]; const query=args.slice(1).join(' ').trim();
const work=path.join(root,'.work'); const memory=path.join(work,'memory');
if(!query){console.error('usage: work context <task-or-topic> [additional context]');process.exit(1)}
const stop=new Set(['the','and','for','with','from','that','this','into','using','fix','add','update','make','implement','project','task','code']);
const tokens=s=>[...new Set((s.toLowerCase().match(/[a-z0-9_/-]{3,}/g)||[]).filter(x=>!stop.has(x)))];
const wanted=tokens([task,query].join(' '));
const files=[];
const ignored=new Set(['.git','.work','node_modules','dist','build','.next','coverage']);
function walk(dir,depth=0){if(depth>5)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,depth+1);else if(/\.(ts|tsx|js|jsx|py|go|rs|java|cs|php|rb|sql|json|md|yml|yaml|toml)$/.test(e.name))files.push(p)}}
walk(root);
function score(file){const rel=path.relative(root,file).toLowerCase();let s=0;for(const t of wanted){if(rel.includes(t))s+=6}try{const txt=fs.readFileSync(file,'utf8').slice(0,20000).toLowerCase();for(const t of wanted){if(txt.includes(t))s+=1}}catch{}return s}
const ranked=files.map(f=>({file:path.relative(root,f),score:score(f)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,25);
const indexFile=path.join(memory,'repository-index.json'); const index=fs.existsSync(indexFile)?JSON.parse(fs.readFileSync(indexFile,'utf8')):null;
const memoryFile=path.join(memory,'knowledge.jsonl'); const memories=fs.existsSync(memoryFile)?fs.readFileSync(memoryFile,'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(x=>wanted.some(t=>String(x.text||'').toLowerCase().includes(t))).slice(-10):[];
let commits=[];try{const log=execFileSync('git',['log','-20','--pretty=%h|%s'],{cwd:root,encoding:'utf8'});commits=log.split('\n').filter(Boolean).filter(l=>wanted.some(t=>l.toLowerCase().includes(t))).slice(0,8)}catch{}
const result={version:1,generatedAt:new Date().toISOString(),task,query,keywords:wanted,project:index?.project||path.basename(root),branch:index?.branch||'',relevantFiles:ranked,relevantMemory:memories,relevantCommits:commits,stack:index?.stack?.slice(0,40)||[],instructions:['Use the selected files as the primary context.','Do not assume unlisted project conventions.','Prefer minimal changes consistent with repository architecture.','Run project verification before proposing completion.']};
fs.mkdirSync(path.join(work,'sessions',String(task)),{recursive:true});fs.writeFileSync(path.join(work,'sessions',String(task),'context.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));