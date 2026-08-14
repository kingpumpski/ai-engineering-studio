#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=path.resolve(process.cwd());
const work=path.join(root,'.work');
const taskId=process.argv[2];
if(!taskId){console.error('usage: work exec <task-id>');process.exit(1)}
const file=path.join(work,'tasks',taskId,'task.json');
if(!fs.existsSync(file)){console.error(`task '${taskId}' not found`);process.exit(1)}
const task=JSON.parse(fs.readFileSync(file,'utf8')); const logDir=path.join(work,'sessions',taskId); fs.mkdirSync(logDir,{recursive:true});
const log=[]; const stamp=()=>new Date().toISOString(); const record=(event,data={})=>{const x={time:stamp(),event,...data};log.push(x);fs.appendFileSync(path.join(logDir,'events.jsonl'),JSON.stringify(x)+'\n')};
record('session.started',{task:task.title});
for(const step of task.steps){ if(step.status==='completed') continue; if(step.requiresApproval && !(task.approvals||[]).some(a=>a.action==='write'&&a.status==='approved')){task.status='awaiting-approval';record('approval.required',{step:step.id});break;} step.status='running'; task.status='running'; fs.writeFileSync(file,JSON.stringify(task,null,2)+'\n'); record('step.started',{step:step.id,agent:step.agent});
  if(step.id==='test'){const candidates=[['npm',['test','--','--runInBand']],['npm',['run','test']],['npm',['run','lint']]];let executed=false;for(const [cmd,args] of candidates){if(fs.existsSync(path.join(root,'package.json'))){const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',shell:false});record('test.executed',{command:[cmd,...args].join(' '),exitCode:r.status,stdout:(r.stdout||'').slice(-8000),stderr:(r.stderr||'').slice(-8000)});executed=true;if(r.status!==0){step.status='failed';task.status='failed';break}break;}}if(!executed){record('test.skipped',{reason:'no package manifest'})}}
  if(task.status==='failed') break; step.status='completed'; step.output=`Execution checkpoint completed for ${step.agent}`; record('step.completed',{step:step.id}); fs.writeFileSync(file,JSON.stringify(task,null,2)+'\n');
}
if(task.status==='running') task.status=task.steps.every(s=>s.status==='completed')?'review':'running'; task.updatedAt=stamp(); fs.writeFileSync(file,JSON.stringify(task,null,2)+'\n'); record('session.finished',{status:task.status}); console.log(`Task ${taskId}: ${task.status}`); if(task.status==='failed')process.exit(2);
