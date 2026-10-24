(()=>{
'use strict';
const root=document.documentElement;
const data=JSON.parse(document.getElementById('entryData').textContent);
const input=document.getElementById('entrySearch'),kind=document.getElementById('entryKind'),alphabet=document.getElementById('entryAlphabet'),results=document.getElementById('entryResults');
let letter='';
const clean=s=>String(s||'').normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').toLocaleLowerCase().trim();
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const fa=root.lang==='fa',lang=fa?'fa':'en';
 document.querySelectorAll('[data-en][data-fa]').forEach(el=>el.textContent=el.dataset[lang]);
 input.placeholder=fa?'جست‌وجوی مدخل‌ها…':'Search entries…';kind.setAttribute('aria-label',fa?'نوع مدخل':'Entry type');
 document.title=fa?'HSKRC | مدخل‌های دانشنامه‌ای':'HSKRC | Encyclopaedic Entries';
 const letters=[...new Set(data.map(e=>clean(e[lang])[0]))].sort((a,b)=>a.localeCompare(b,lang));
 alphabet.innerHTML=[['',fa?'همه':'All'],...letters.map(l=>[l,l.toLocaleUpperCase()])].map(([value,label])=>`<button type="button" data-letter="${esc(value)}" aria-pressed="${letter===value}">${esc(label)}</button>`).join('');
 alphabet.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{letter=b.dataset.letter;render();}));
 const q=clean(input.value);const list=data.filter(e=>(kind.value==='all'||e.kind===kind.value)&&(!letter||clean(e[lang]).startsWith(letter))&&(!q||clean([e.en,e.fa,e.descriptionEn,e.descriptionFa].join(' ')).includes(q))).sort((a,b)=>a[lang].localeCompare(b[lang],lang));
 document.getElementById('entryCount').textContent=new Intl.NumberFormat(fa?'fa-AF':'en').format(list.length)+(fa?' مدخل':' entries');
 results.innerHTML=list.length?list.map(e=>`<a class="research-entry-card" href="${esc(e.url)}"><div class="catalog-kicker">${e.kind==='person'?(fa?'شخصیت تاریخی':'Historical figure'):(fa?'مکان و میراث':'Place & heritage')}</div><h2>${esc(e[lang])}</h2><p>${esc(e[fa?'descriptionFa':'descriptionEn'])}</p><span class="research-entry-link">${fa?'مطالعه مدخل':'Read entry'} ↗</span></a>`).join(''):`<p>${fa?'مدخلی پیدا نشد؛ عبارت یا فیلتر دیگری انتخاب کنید.':'No entries found. Try another search or filter.'}</p>`;
}
let saved='en';try{saved=localStorage.getItem('hskrc_language')==='fa'?'fa':'en';}catch(_){}
root.lang=saved;root.dir=saved==='fa'?'rtl':'ltr';
input.addEventListener('input',render);kind.addEventListener('change',render);
new MutationObserver(()=>{letter='';render();}).observe(root,{attributes:true,attributeFilter:['lang']});render();
})();
