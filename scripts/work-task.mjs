#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
function findRoot(start) { let p = path.resolve(start); while (p !== path.dirname(p)) { if (fs.existsSync(path.join(p,'.git')) || fs.existsSync(path.join(p,'package.json'))) return p; p = path.dirname(p); } return path.resolve(start); }
const projectRoot = findRoot(root);
const workDir = path.join(projectRoot, '.work');
const tasksDir = path.join(workDir, 'tasks');
const now = () => new Date().toISOString();
const slug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'task';
const idFor = title => `${slug(title)}-${crypto.randomBytes(3).toString('hex')}`;
const die = m => { console.error(`work task: ${m}`); process.exit(1); };
function ensure() { if (!fs.existsSync(workDir)) die(`project is not initialized; run 'work init' first`); fs.mkdirSync(tasksDir,{recursive:true}); }
function save(task) { const dir=path.join(tasksDir,task.id); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'task.json'),JSON.stringify(task,null,2)+'\n'); return dir; }
function load(id) { const file=path.join(tasksDir,id,'task.json'); if(!fs.existsSync(file)) die(`task '${id}' not found`); return JSON.parse(fs.readFileSync(file,'utf8')); }
const args=process.argv.slice(2); const command=args[0]||'list';
ensure();
if(command==='create') { const title=args.slice(1).join(' ').trim(); if(!title) die('usage: work task create "title"'); const id=idFor(title); const t={id,title,status:'queued',createdAt:now(),updatedAt:now(),workflow:'build',modelRole:'coding',steps:[{id:'plan',agent:'architect',status:'queued',requiresApproval:false},{id:'implement',agent:'developer',status:'queued',requiresApproval:true},{id:'test',agent:'qa',status:'queued',requiresApproval:false},{id:'review',agent:'review',status:'queued',requiresApproval:false}],approvals:[]}; save(t); console.log(`Created task ${id}`); console.log(`Path: ${path.join(tasksDir,id)}`); process.exit(0); }
if(command==='list') { const dirs=fs.existsSync(tasksDir)?fs.readdirSync(tasksDir,{withFileTypes:true}).filter(x=>x.isDirectory()):[]; if(!dirs.length){console.log('(no tasks)');process.exit(0);} for(const d of dirs){try{const t=load(d.name);console.log(`${t.id.padEnd(45)} ${t.status.padEnd(20)} ${t.title}`)}catch{}} process.exit(0); }
if(command==='show') { const id=args[1]; if(!id) die('usage: work task show <id>'); console.log(JSON.stringify(load(id),null,2)); process.exit(0); }
if(command==='approve') { const id=args[1]; const action=args[2]||'write'; const t=load(id); t.approvals=t.approvals||[]; const pending=t.approvals.find(a=>a.action===action&&a.status==='pending'); if(pending){pending.status='approved';pending.resolvedAt=now();} else t.approvals.push({id:`approval-${crypto.randomBytes(3).toString('hex')}`,action,status:'approved',requestedAt:now(),resolvedAt:now()}); t.updatedAt=now(); if(t.status==='awaiting-approval') t.status='running'; save(t); console.log(`Approved '${action}' for ${id}`); process.exit(0); }
if(command==='cancel') { const id=args[1]; if(!id) die('usage: work task cancel <id>'); const t=load(id); t.status='cancelled'; t.updatedAt=now(); save(t); console.log(`Cancelled ${id}`); process.exit(0); }
if(command==='run') { const id=args[1]; if(!id) die('usage: work task run <id>'); const t=load(id); const writeStep=t.steps.find(s=>s.requiresApproval&&s.status==='queued'); if(writeStep && !(t.approvals||[]).some(a=>a.action==='write'&&a.status==='approved')) { t.status='awaiting-approval'; t.approvals=t.approvals||[]; t.approvals.push({id:`approval-${crypto.randomBytes(3).toString('hex')}`,action:'write',status:'pending',requestedAt:now()}); t.updatedAt=now(); save(t); console.log(`Task ${id} is awaiting approval for write operations.`); console.log(`Approve with: work task approve ${id} write`); process.exit(2); } t.status='running'; for(const s of t.steps){ if(s.status==='queued'){s.status='running';t.updatedAt=now();save(t); console.log(`Running ${s.agent} step: ${s.id}`); s.status='completed'; s.output='Step execution placeholder: delegate through Work orchestrator.'; } } t.status='review'; t.updatedAt=now(); save(t); console.log(`Task ${id} reached review stage.`); process.exit(0); }
die('usage: work task create|list|show|approve|cancel|run ...');
