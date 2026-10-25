import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = rows => JSON.stringify(rows).replace(/</g,'\\u003c');
const sourceFields='id,source_code,title,author,institution,source_type,publication_year,url,language,reliability,notes';
const articleFields='id,title,author,category,excerpt,published_at,created_at,language_code,translation_group';
async function readRows(name, query){
  if(process.argv[2]==='--snapshot-dir') return JSON.parse(await fs.readFile(`${process.argv[3]}/hskrc-${name}.json`,'utf8'));
  const base=process.env.SUPABASE_URL, key=process.env.SUPABASE_ANON_KEY;
  if(!base||!key) throw new Error('Public Supabase connection settings are required');
  const response=await fetch(`${base}/rest/v1/${query}`,{headers:{apikey:key,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}
const [sources,articles]=await Promise.all([
  readRows('sources',`research_sources?select=${sourceFields}&order=source_code`),
  readRows('articles',`articles?select=${articleFields}&published=eq.true&order=published_at.desc.nullslast,created_at.desc`)
]);
if(!sources.length||!articles.length) throw new Error('Refusing to replace catalogs with empty snapshots');
const files=await fs.readdir(new URL('generated-articles/',root));
function articleLink(a){
 const file=files.find(f=>f.endsWith(`-${a.id.slice(0,8)}.html`));
 return file?`generated-articles/${file}`:`article.html?id=${encodeURIComponent(a.id)}`;
}
let sourceHtml=await fs.readFile(new URL('sources.html',root),'utf8');
sourceHtml=sourceHtml.replace(/(<script id="sourceSnapshot" type="application\/json">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+json(sources)+b);
const sourceCards=sources.map(r=>`<article id="${esc(r.source_code)}" class="card"><div class="id">${esc(r.source_code)}</div><h2>${esc(r.title)}</h2><div class="author">${esc(r.author||r.institution)}</div><div class="meta">${esc([r.source_type,r.institution,r.publication_year].filter(Boolean).join(' · '))}</div>${r.notes?`<p class="desc">${esc(r.notes)}</p>`:''}<a class="link" href="source.html?id=${encodeURIComponent(r.id)}" data-en="View research connections →" data-fa="نمایش ارتباطات پژوهشی ←">View research connections →</a></article>`).join('\n');
sourceHtml=sourceHtml.replace(/(<section class="grid" id="grid">)[\s\S]*?(<\/section>)/,(_,a,b)=>a+'\n'+sourceCards+'\n'+b);
sourceHtml=sourceHtml.replace(/(<div class="count" id="count">)[\s\S]*?(<\/div>)/,`$1${sources.length} registered records · HSKRC research collection$2`);
let articleHtml=await fs.readFile(new URL('articles.html',root),'utf8');
articleHtml=articleHtml.replace(/(<script id="articleSnapshot" type="application\/json">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+json(articles)+b);
const groups=new Map();
for(const a of articles){const id=a.translation_group||a.id;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(a);}
const articleCards=[...groups.values()].map(group=>{
 const a=group.find(a=>a.language_code==='en')||group[0];
 return `<article class="article-card"><div class="article-body"><p>${esc(a.category)}</p><h2><a href="${esc(articleLink(a))}">${esc(a.title)}</a></h2><p>${esc(a.author)}</p><p>${esc(a.excerpt)}</p><a href="${esc(articleLink(a))}" data-en="Read article →" data-fa="مطالعه مقاله ←">Read article →</a>${group.filter(t=>t.id!==a.id).map(t=>`<p lang="${esc(t.language_code)}" dir="${t.language_code==='fa'?'rtl':'ltr'}"><a href="${esc(articleLink(t))}">${esc(t.title)}</a></p>`).join('')}</div></article>`;
}).join('\n');
articleHtml=articleHtml.replace(/(<section class="articles-grid" id="articlesGrid">)[\s\S]*?(<\/section>)/,(_,a,b)=>a+'\n'+articleCards+'\n'+b);
articleHtml=articleHtml.replace(/(<span id="resultsCount">)[\s\S]*?(<\/span>)/,`$1${groups.size}$2`);
await fs.writeFile(new URL('sources.html',root),sourceHtml);
await fs.writeFile(new URL('articles.html',root),articleHtml);
console.log(`Catalogs generated: ${sources.length} sources, ${groups.size} article groups (${articles.length} language versions)`);
