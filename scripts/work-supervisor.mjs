#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), work=path.join(root,'.work');
const args=process.argv.slice(2), task=args.join(' ').trim();
if(!task){console.error('usage: work supervisor <task>');process.exit(1)}
const cfgPath=path.join(root,'config','agents.json');
if(!fs.existsSync(cfgPath)){console.error('config/agents.json not found');process.exit(1)}
const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));
const corpus=task.toLowerCase();
const capabilities=cfg.agents.map(a=>({agent:a,score:a.capabilities.reduce((n,c)=>n+(corpus.includes(c.toLowerCase())?3:0),0)})).sort((a,b)=>b.score-a.score);
const workflow=corpus.match(/\b(debug|review|release)\b/)?.[1]||'build';
const ordered=(cfg.workflows[workflow]||[]).map(id=>cfg.agents.find(a=>a.id===id)).filter(Boolean);
const selected=[...ordered].sort((a,b)=>{const sa=capabilities.find(x=>x.agent.id===a.id)?.score||0;const sb=capabilities.find(x=>x.agent.id===b.id)?.score||0;return sb-sa});
const max=cfg.orchestrator.supervisor?.maxWorkflowAgents||7;
const plan={version:1,id:`supervisor-${Date.now()}`,task,workflow,createdAt:new Date().toISOString(),policy:cfg.orchestrator.supervisor,agents:selected.slice(0,max).map((a,i)=>({sequence:i+1,id:a.id,role:a.role,modelRole:a.modelRole,capabilities:a.capabilities,approvalRequired:cfg.orchestrator.humanApprovalForWrites&&['frontend','backend','database','devops','debug','migration'].includes(a.id)})),gates:["context","agent-output","verification","human-approval-before-write","review"]};
const dir=path.join(work,'supervisor');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'latest-plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify(plan,null,2));
