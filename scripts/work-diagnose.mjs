#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd(),id=process.argv[2]; if(!id){console.error('usage: work diagnose <task-id>');process.exit(1)}
const taskFile=path.join(root,'.work','tasks',id,'task.json');const session=path.join(root,'.work','sessions',id);if(!fs.existsSync(taskFile)){console.error(`task '${id}' not found`);process.exit(1)}
const task=JSON.parse(fs.readFileSync(taskFile,'utf8'));const eventFile=path.join(session,'events.jsonl');const events=fs.existsSync(eventFile)?fs.readFileSync(eventFile,'utf8').trim().split('\n').map(x=>JSON.parse(x)):[];const failed=events.filter(e=>e.event==='verification.command'&&e.exitCode!==0);
const diagnosis={taskId:id,agent:'debugger',status:failed.length?'ready':'not-needed',summary:failed.length?`Verification has ${failed.length} failing command(s).`:'No verification failures recorded.',failures:failed.map(x=>({command:x.command,exitCode:x.exitCode,stderr:x.stderr,stdout:x.stdout})),recommendedAction:'Inspect the failure output, reproduce the issue in the task sandbox, then propose a minimal corrective patch.'};
fs.writeFileSync(path.join(session,'diagnosis.json'),JSON.stringify(diagnosis,null,2)+'\n');if(failed.length){task.status='planning';task.diagnosis={path:`.work/sessions/${id}/diagnosis.json`,agent:'debugger'};task.updatedAt=new Date().toISOString();fs.writeFileSync(taskFile,JSON.stringify(task,null,2)+'\n');console.log(JSON.stringify(diagnosis,null,2));process.exit(2)}console.log(JSON.stringify(diagnosis,null,2));
