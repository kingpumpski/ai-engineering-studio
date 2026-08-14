#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=path.resolve(process.cwd()); const work=path.join(root,'.work');
const taskId=process.argv[3]; const action=process.argv[2]||'help';
const run=(args,cwd=root)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
function fail(m){console.error(`work sandbox: ${m}`);process.exit(1)}
if(!fs.existsSync(path.join(root,'.git')))fail('current directory is not a git repository');
if(action==='create'){
 if(!taskId)fail('usage: work sandbox create <task-id>');
 const taskFile=path.join(work,'tasks',taskId,'task.json'); if(!fs.existsSync(taskFile))fail(`task '${taskId}' not found`);
 const branch=`work/${taskId}`; const sandboxRoot=path.resolve(work,'sandboxes',taskId); fs.mkdirSync(path.dirname(sandboxRoot),{recursive:true});
 if(fs.existsSync(sandboxRoot))fail(`sandbox already exists: ${sandboxRoot}`);
 const current=run(['branch','--show-current'])||'HEAD';
 run(['worktree','add','-b',branch,sandboxRoot,current]);
 const meta={taskId,branch,base:current,path:sandboxRoot,createdAt:new Date().toISOString()}; fs.writeFileSync(path.join(work,'tasks',taskId,'sandbox.json'),JSON.stringify(meta,null,2)+'\n');
 console.log(JSON.stringify(meta,null,2)); process.exit(0);
}
if(action==='remove'){
 if(!taskId)fail('usage: work sandbox remove <task-id>'); const sandboxRoot=path.resolve(work,'sandboxes',taskId); if(!fs.existsSync(sandboxRoot))fail('sandbox not found');
 run(['worktree','remove',sandboxRoot]); console.log(`Removed sandbox ${taskId}`); process.exit(0);
}
if(action==='status'){
 console.log(run(['worktree','list','--porcelain'])); process.exit(0);
}
console.log('usage: work sandbox create|remove|status <task-id>');
