import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const records=JSON.parse(await fs.readFile(new URL('editorial/scholarly-records.json',root),'utf8')).records;
const before=new Map();
for(const r of records){
 const text=await fs.readFile(new URL(r.path,root),'utf8');before.set(r.path,text);
 assert.equal((text.match(/<!-- scholarly-record:start -->/g)||[]).length,1,r.path);
 for(const m of text.matchAll(/href="#((?:pres-ref-|ronaq-(?:en|fa)-ref-)[^"]+)"/g))assert(text.includes(`id="${m[1]}"`),`${r.path}: missing ${m[1]}`);
 const csl=JSON.parse(await fs.readFile(new URL(`citations/${r.id}.json`,root),'utf8'));
 assert.equal(csl[0].URL,'https://hskrc.org/'+r.path);
 assert.equal(csl[0].type,'webpage');assert(!csl[0].DOI,'Do not invent DOI');
 const ris=await fs.readFile(new URL(`citations/${r.id}.ris`,root),'utf8');assert(ris.startsWith('TY  - ELEC\n')&&ris.endsWith('ER  -\n'));
 const card=text.match(/<!-- scholarly-record:start -->([\s\S]*?)<!-- scholarly-record:end -->/)[1];
 for(const m of card.matchAll(/href="([^"]+)"/g))if(!m[1].startsWith('https:'))await fs.access(new URL(path.posix.join(path.posix.dirname(r.path),m[1]),root));
}
execFileSync(process.execPath,[new URL('scripts/render-scholarly-records.mjs',root).pathname]);
for(const [p,text]of before)assert((await fs.readFile(new URL(p,root),'utf8'))===text,'Renderer must be idempotent: '+p);
console.log(`PASS: ${records.length} records; citation exports, reference targets, local links and regeneration idempotence`);
