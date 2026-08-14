#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=process.cwd(), outDir=path.join(root,'.work','memory'); fs.mkdirSync(outDir,{recursive:true});
const run=(c,a)=>{try{return execFileSync(c,a,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{return ''}};
const files=[]; const skip=new Set(['.git','.work','node_modules','dist','build','.next','coverage']);
function walk(dir,depth=0){if(depth>3)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,depth+1);else files.push(path.relative(root,p))}}
walk(root);
const pkg=fs.existsSync(path.join(root,'package.json'))?JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')):null;
const tech=[pkg?.packageManager,pkg?.dependencies&&Object.keys(pkg.dependencies),pkg?.devDependencies&&Object.keys(pkg.devDependencies)].flat(Infinity).filter(Boolean);
const index={version:1,generatedAt:new Date().toISOString(),project:path.basename(root),branch:run('git',['branch','--show-current']),commit:run('git',['rev-parse','HEAD']),stack:[...new Set(tech)].slice(0,100),directories:[...new Set(files.map(f=>f.split(path.sep)[0]))].sort(),importantFiles:files.filter(f=>/^(README|CONTRIBUTING|ARCHITECTURE|package\.json|pnpm-lock|yarn\.lock|bun\.lock|pyproject|requirements|Dockerfile|docker-compose)/i.test(path.basename(f))).slice(0,100),sourceFiles:files.filter(f=>/\.(ts|tsx|js|jsx|py|go|rs|java|cs|php|rb|sql)$/.test(f)).slice(0,500),recentCommits:run('git',['log','-12','--pretty=%h|%ad|%s','--date=short']).split('\n').filter(Boolean)};
fs.writeFileSync(path.join(outDir,'repository-index.json'),JSON.stringify(index,null,2)+'\n');
const md=`# Repository Intelligence\n\nGenerated: ${index.generatedAt}\n\n## Project\n- ${index.project}\n- Branch: ${index.branch}\n- Commit: ${index.commit}\n\n## Technology\n${index.stack.map(x=>`- ${x}`).join('\n')}\n\n## Top-level areas\n${index.directories.map(x=>`- ${x}`).join('\n')}\n\n## Important files\n${index.importantFiles.map(x=>`- ${x}`).join('\n')}\n\n## Recent commits\n${index.recentCommits.map(x=>`- ${x}`).join('\n')}\n`;
fs.writeFileSync(path.join(outDir,'REPOSITORY_INTELLIGENCE.md'),md); console.log(`Indexed ${files.length} files; wrote .work/memory/repository-index.json`);
