#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=path.resolve(process.cwd()); const work=path.join(root,'.work');
const taskId=process.argv[2]; const action=process.argv[3]||'propose';
const taskFile=taskId&&path.join(work,'tasks',taskId,'task.json');
const patchFile=taskId&&path.join(work,'tasks',taskId,'proposal.patch');
const run=(cmd,args,cwd=root)=>execFileSync(cmd,args,{cwd,encoding:'utf8'});
const fail=m=>{console.error(`work patch: ${m}`);process.exit(1)};
if(!taskId||!fs.existsSync(taskFile))fail('usage: work patch <task-id> propose|validate|apply');
const task=JSON.parse(fs.readFileSync(taskFile,'utf8'));
const sandboxFile=path.join(work,'tasks',taskId,'sandbox.json');
const sandbox=fs.existsSync(sandboxFile)?JSON.parse(fs.readFileSync(sandboxFile,'utf8')):null;
const cwd=sandbox?.path||root;
if(action==='propose'){
  const model=process.env.WORK_OLLAMA_CODING_MODEL||'qwen3:8b';
  let status='';try{status=run('git',['status','--short'],cwd)}catch{}
  let diff='';try{diff=run('git',['diff','--stat'],cwd)}catch{}
  const prompt=`You are a senior software engineer. Produce ONLY a valid unified git patch, no markdown fences, no explanation. Repository: ${cwd}\nTask: ${task.title}\nGit status:\n${status}\nCurrent diff:\n${diff}\nRequirements: make the smallest safe change, do not touch secrets, lockfiles, generated files, or unrelated files. If you cannot produce a safe patch, output exactly NO_PATCH.`;
  const body=JSON.stringify({model,prompt,stream:false,options:{temperature:0.1}});
  let response;try{const raw=run('curl',['-fsS',`${process.env.OLLAMA_BASE_URL||'http://127.0.0.1:11434'}/api/generate`,'-H','Content-Type: application/json','-d',body]);response=JSON.parse(raw).response||''}catch(e){fail('Ollama unavailable; run work doctor first')}
  response=response.replace(/^```(?:diff|patch)?\s*/i,'').replace(/```\s*$/,'').trim(); if(response==='NO_PATCH'||!response.startsWith('diff --git '))fail('model did not return a valid unified patch');
  fs.writeFileSync(patchFile,response+'\n'); fs.writeFileSync(path.join(work,'tasks',taskId,'proposal.json'),JSON.stringify({taskId,model,createdAt:new Date().toISOString(),path:patchFile,status:'proposed'},null,2)+'\n'); console.log(`Patch proposal written to ${patchFile}`);process.exit(0);
}
if(!fs.existsSync(patchFile))fail('no proposal exists; run propose first');
if(action==='validate'){
  try{run('git',['apply','--check',patchFile],cwd); console.log('Patch validation: PASS');}
  catch(e){console.error('Patch validation: FAIL');process.exit(2)}
  process.exit(0);
}
if(action==='apply'){
  const approved=(task.approvals||[]).some(a=>a.action==='write'&&a.status==='approved'); if(!approved)fail('write approval required before applying a patch');
  try{run('git',['apply','--whitespace=error',patchFile],cwd)}catch(e){fail('patch could not be applied cleanly')}
  const meta=path.join(work,'tasks',taskId,'proposal.json');if(fs.existsSync(meta)){const p=JSON.parse(fs.readFileSync(meta,'utf8'));p.status='applied';p.appliedAt=new Date().toISOString();fs.writeFileSync(meta,JSON.stringify(p,null,2)+'\n')}
  console.log('Patch applied successfully.');process.exit(0);
}
fail('usage: work patch <task-id> propose|validate|apply');
