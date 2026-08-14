#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd(); const id=process.argv[2]; const max=Number(process.env.WORK_VERIFY_MAX_REPAIRS||2);
if(!id){console.error('usage: work verify <task-id>');process.exit(1)}
const taskFile=path.join(root,'.work','tasks',id,'task.json'); if(!fs.existsSync(taskFile)){console.error(`task '${id}' not found`);process.exit(1)}
const task=JSON.parse(fs.readFileSync(taskFile,'utf8')); const session=path.join(root,'.work','sessions',id); fs.mkdirSync(session,{recursive:true}); const events=path.join(session,'events.jsonl');
const emit=(event,data={})=>fs.appendFileSync(events,JSON.stringify({time:new Date().toISOString(),event,...data})+'\n');
function commands(){const pkg=fs.existsSync(path.join(root,'package.json'))?JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')):null; const s=pkg?.scripts||{}; const out=[]; if(s.test)out.push(['npm',['run','test']]); if(s.lint)out.push(['npm',['run','lint']]); if(s.build)out.push(['npm',['run','build']]); if(fs.existsSync(path.join(root,'pyproject.toml')))out.push(['python',['-m','pytest','-q']]); return out.slice(0,3)}
const results=[]; let failures=0; emit('verification.started',{maxRepairs:max});
for(const [cmd,args] of commands()){const r=spawnSync(cmd,args,{cwd:root,encoding:'utf8',timeout:180000}); const result={command:[cmd,...args].join(' '),exitCode:r.status,stdout:(r.stdout||'').slice(-12000),stderr:(r.stderr||'').slice(-12000)}; results.push(result);emit('verification.command',result);if(r.status!==0)failures++}
task.verification={at:new Date().toISOString(),failures,results,repairBudget:max}; task.status=failures?'failed':'review'; task.updatedAt=new Date().toISOString(); fs.writeFileSync(taskFile,JSON.stringify(task,null,2)+'\n');
if(failures){console.log(`Verification failed: ${failures} command(s). Repair budget available: ${max}`); console.log('Next: route the captured failures to the debugger agent and create a new patch proposal.');process.exit(2)}
console.log('Verification passed. Task moved to review.');
