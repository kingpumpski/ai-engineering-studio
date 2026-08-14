#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd(), args=process.argv.slice(2), cmd=args[0];
const runId=args[1], taskId=args[2];
const work=path.join(root,'.work');
const fail=m=>{console.error(`work ci: ${m}`);process.exit(1)};
function gh(a){try{return execFileSync('gh',a,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}catch(e){fail(e.stderr?.trim()||'GitHub CLI unavailable or authentication failed')}}
function repo(){return gh(['repo','view','--json','nameWithOwner','-q','.nameWithOwner'])}
function save(id,data){const d=path.join(work,'sessions',id);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,'ci-failure.json'),JSON.stringify(data,null,2)+'\n')}
if(cmd==='inspect'){if(!runId)fail('usage: work ci inspect <run-id> [task-id]');const r=JSON.parse(gh(['run','view',runId,'--json','databaseId,name,status,conclusion,url,headBranch,event,workflowName,jobs']));const failed=(r.jobs||[]).filter(j=>j.conclusion==='failure'||j.status==='failure');const data={repository:repo(),run:r,failedJobs:failed,taskId:taskId||null,nextAction:failed.length?'Route failed jobs to debugger and inspect logs.':'No failed jobs detected.'};if(taskId)save(taskId,data);console.log(JSON.stringify(data,null,2));process.exit(failed.length?2:0)}
if(cmd==='logs'){if(!runId)fail('usage: work ci logs <run-id>');console.log(gh(['run','view',runId,'--log-failed']));process.exit(0)}
if(cmd==='list'){console.log(gh(['run','list','--limit','10','--json','databaseId,name,status,conclusion,url,headBranch,event,workflowName']));process.exit(0)}
console.log('Usage:\n  work ci list\n  work ci inspect <run-id> [task-id]\n  work ci logs <run-id>');