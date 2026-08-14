#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
function findRoot(start) { let p=path.resolve(start); while(p!==path.dirname(p)){ if(fs.existsSync(path.join(p,'.work'))) return p; if(fs.existsSync(path.join(p,'.git'))||fs.existsSync(path.join(p,'package.json'))) return p; p=path.dirname(p); } return path.resolve(start); }
const projectRoot=findRoot(root); const tasksDir=path.join(projectRoot,'.work','tasks');
const title=process.argv.slice(2).join(' ').trim();
if(!title){console.error('usage: work plan "task description"');process.exit(1)}
if(!fs.existsSync(tasksDir)){console.error("work plan: initialize project with 'work init' first");process.exit(1)}
const text=title.toLowerCase();
let workflow='build', modelRole='coding';
if(/bug|error|fail|broken|debug|fix/.test(text)){workflow='debug';modelRole='reasoning'}
else if(/security|vulnerab|audit|permission|auth/.test(text)){workflow='security-review';modelRole='reasoning'}
else if(/release|deploy|production|ci\/cd/.test(text)){workflow='release';modelRole='reasoning'}
else if(/architect|architecture|design|system|database schema/.test(text)){workflow='architecture';modelRole='reasoning'}
const id=`${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'task'}-${crypto.randomBytes(3).toString('hex')}`;
const maps={
 build:[['requirements','product'],['architecture','architect'],['implementation','developer'],['testing','qa'],['review','review']],
 debug:[['diagnosis','debugger'],['fix','developer'],['testing','qa'],['review','review']],
 'security-review':[['threat-model','security'],['remediation','developer'],['verification','security'],['review','review']],
 release:[['quality','qa'],['security','security'],['release','devops'],['review','review']],
 architecture:[['discovery','architect'],['design','architect'],['database','database'],['review','review']]
};
const steps=maps[workflow].map(([step,agent])=>({id:step,agent,status:'queued',requiresApproval:['implementation','fix','remediation','release'].includes(step)}));
const now=new Date().toISOString();
const task={id,title,status:'queued',createdAt:now,updatedAt:now,workflow,modelRole,plan:{source:'deterministic-planner-v1',reason:`classified as ${workflow}`},steps,approvals:[]};
const dir=path.join(tasksDir,id);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'task.json'),JSON.stringify(task,null,2)+'\n');fs.writeFileSync(path.join(dir,'plan.md'),`# ${title}\n\n- Workflow: **${workflow}**\n- Model role: **${modelRole}**\n\n## Execution graph\n\n${steps.map((s,i)=>`${i+1}. **${s.agent}** — ${s.id}${s.requiresApproval?' *(approval required)*':''}`).join('\n')}\n`);
console.log(`Planned task ${id}`);console.log(`Workflow: ${workflow}`);console.log(`Next: work task run ${id}`);
