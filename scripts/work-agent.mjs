#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd(), work=path.join(root,'.work');
const args=process.argv.slice(2), task=args.join(' ').trim();
if(!task){console.error('usage: work agent <task>');process.exit(1)}
fs.mkdirSync(path.join(work,'sessions'),{recursive:true});
const id=`agent-${Date.now()}`;const session=path.join(work,'sessions',id);fs.mkdirSync(session,{recursive:true});
const context=spawnSync('node',[path.join(process.env.HOME||'', '.work-agent','work-context.mjs'),task],{cwd:root,encoding:'utf8'});
const contextText=context.stdout||'';
fs.writeFileSync(path.join(session,'request.json'),JSON.stringify({id,task,createdAt:new Date().toISOString(),context:contextText},null,2)+'\n');
const model=process.env.WORK_MODEL||'deepseek-coder:6.7b';
const prompt=`You are a coding agent operating inside a controlled engineering runtime.\nTask: ${task}\n\nUse the supplied repository context. Do not invent files or APIs. Explain assumptions before proposing changes. Do not execute destructive commands. Return: (1) diagnosis, (2) files to inspect/change, (3) proposed implementation, (4) verification commands.\n\nRepository context:\n${contextText}`;
const ollama=spawnSync('ollama',['run',model,prompt],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const result={id,task,model,exitCode:ollama.status,stdout:ollama.stdout||'',stderr:ollama.stderr||'',createdAt:new Date().toISOString()};
fs.writeFileSync(path.join(session,'response.json'),JSON.stringify(result,null,2)+'\n');
console.log(result.stdout||result.stderr||`Agent exited with ${result.exitCode}`);
process.exit(ollama.status===0?0:1);
