#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd(), work=path.join(root,'.work'), mem=path.join(work,'memory'); fs.mkdirSync(mem,{recursive:true});
const args=process.argv.slice(2),cmd=args[0]; const text=args.slice(1).join(' ').trim();
const file=path.join(mem,'knowledge.jsonl');
const write=x=>fs.appendFileSync(file,JSON.stringify({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...x})+'\n');
const read=()=>fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).map(x=>JSON.parse(x)):[];
function git(a){try{return execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim()}catch{return ''}}
if(cmd==='add'){if(!text){console.error('usage: work memory add <note>');process.exit(1)}write({type:'decision',text});console.log('memory added');process.exit(0)}
if(cmd==='list'){for(const x of read())console.log(`[${x.type}] ${x.text}`);process.exit(0)}
if(cmd==='search'){const q=text.toLowerCase();for(const x of read().filter(x=>`${x.text} ${x.type}`.toLowerCase().includes(q)))console.log(JSON.stringify(x));process.exit(0)}
if(cmd==='refresh'){const packageFile=path.join(root,'package.json');const manifest={generatedAt:new Date().toISOString(),project:path.basename(root),branch:git(['branch','--show-current']),commit:git(['rev-parse','HEAD']),recentCommits:git(['log','-8','--pretty=%h %s']).split('\n').filter(Boolean),package:fs.existsSync(packageFile)?JSON.parse(fs.readFileSync(packageFile,'utf8')):null,topLevel:fs.readdirSync(root,{withFileTypes:true}).filter(x=>!x.name.startsWith('.git')&&!x.name.startsWith('.work')).slice(0,80).map(x=>x.name)};fs.writeFileSync(path.join(mem,'project-index.json'),JSON.stringify(manifest,null,2)+'\n');console.log('project intelligence refreshed');process.exit(0)}
if(cmd==='context'){const index=path.join(mem,'project-index.json');console.log(fs.existsSync(index)?fs.readFileSync(index,'utf8'):'No project index. Run: work memory refresh');console.log('\nMemory:');for(const x of read().slice(-20))console.log(`- ${x.text}`);process.exit(0)}
console.log('Usage: work memory add|list|search|refresh|context');