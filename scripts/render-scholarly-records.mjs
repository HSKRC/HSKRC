import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await fs.readFile(new URL('editorial/scholarly-records.json',root),'utf8'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi=(en,fa)=>`<span class="sr-en" lang="en">${esc(en)}</span><span class="sr-fa" lang="fa" dir="rtl">${esc(fa)}</span>`;
const types={reference:['Reference entry','مدخل مرجع'],collection:['Biographical collection','مجموعهٔ زندگی‌نامه‌ها'],review:['Source-based review','مقالهٔ مروری منبع‌محور'],commemorative:['Commemorative essay','یادداشت مناسبتی'],memorial:['Provisional memorial record','ثبت یادمانی مقدماتی'],heritage:['Heritage record with attributed evidence','پروندهٔ میراث با شواهد منسوب']};
await fs.mkdir(new URL('citations/',root),{recursive:true});
let count=0;
for(const record of manifest.records){
 const filename=record.path;if(filename.includes('..')||path.isAbsolute(filename))throw Error('Invalid record path');
 const file=new URL(filename,root);let raw=await fs.readFile(file,'utf8');
 raw=raw.replace(/<!-- scholarly-record:start -->[\s\S]*?<!-- scholarly-record:end -->\s*/g,'').replace(/<link[^>]*data-scholarly-style[^>]*>\s*/g,'');
 const prefix=filename.includes('/')?'../':'';
 const canonical='https://hskrc.org/'+filename;
 const history='https://github.com/HSKRC/HSKRC/commits/main/'+filename;
 const title=record.title;
 const kind=types[record.type];if(!kind)throw Error('Unknown record type');
 const citation=`${title}. HSKRC. ${record.revised}. ${canonical}`;
 const uncertainty=record.type==='memorial'?['Contributor-attributed evidence; independent corroboration incomplete. Names and ranks follow the supplied record.','شواهد منسوب به ارائه‌دهنده؛ تأیید مستقل تکمیل نشده است. نام و رتبه مطابق مدرک ارائه‌شده است.']:['Source assessment remains claim-specific; this record does not certify every statement.','اعتبار هر ادعا با منبع همان ادعا سنجیده می‌شود؛ این شناسنامه تأیید همهٔ جمله‌ها نیست.'];
 const peer=['No independent peer-review report is linked to this static edition. See the live register for subsequent assessments.','گزارش داوری مستقل به این نسخهٔ ثابت پیوست نشده است؛ ارزیابی‌های بعدی را در ثبت‌نامهٔ زنده ببینید.'];
 const card=`<!-- scholarly-record:start -->
<aside class="scholarly-record" aria-label="Research record / شناسنامهٔ پژوهشی">
<div class="sr-top"><strong>${bi(...kind)}</strong><code>${esc(record.id)}</code></div>
<p class="sr-status">${bi(...uncertainty)}</p>
<details><summary>${bi('Research record, citation & revision history','شناسنامهٔ پژوهشی، استناد و تاریخچه')}</summary>
<dl><div><dt>${bi('Publisher','ناشر')}</dt><dd>HSKRC</dd></div><div><dt>${bi('Responsibility','مسئولیت')}</dt><dd>${bi('Publication: HSKRC. A named specialist reviewer is not documented in this edition. Authorship, where supplied, is shown with the text.','نشر: HSKRC. بررسی‌کنندهٔ متخصصِ نام‌برده در این نسخه ثبت نشده است؛ نام نویسنده، در صورت ثبت، همراه متن می‌آید.')}</dd></div><div><dt>${bi('Review status','وضعیت داوری')}</dt><dd>${bi(...peer)}</dd></div><div><dt>${bi('Record revision','بازنگری شناسنامه')}</dt><dd><time datetime="${record.revised}">${record.revised}</time> · ${bi('Citation record v1; not a date of comprehensive historical verification.','شناسنامهٔ استناد نسخهٔ ۱؛ نه تاریخ تأیید جامع تاریخی.')}</dd></div></dl>
<p>${bi('AI assistance was used in this documentation update; it is not independent scholarly review.','در این به‌روزرسانی مستندسازی از هوش مصنوعی کمک گرفته شده است؛ این کار داوری علمی مستقل نیست.')}</p>
<p>${bi(record.note_en,record.note_fa)}</p>
<h2>${bi('Suggested citation','استناد پیشنهادی')}</h2><p class="sr-citation" dir="auto">${esc(citation)}</p><p>${bi('Add your access date and the section cited. Citation exports do not imply scholarly approval.','تاریخ دسترسی و بخش مورد استناد را اضافه کنید. خروجی استناد به معنی تأیید علمی نیست.')}</p>
<nav class="sr-links" aria-label="Citation resources"><a href="${prefix}citations/${record.id}.ris" download>RIS / Zotero</a><a href="${prefix}citations/${record.id}.json" download>CSL-JSON</a><a href="${esc(history)}">${bi('Version history','تاریخچهٔ نسخه‌ها')}</a><a href="${prefix}academic-register.html">${bi('Live evidence register','ثبت‌نامهٔ زندهٔ شواهد')}</a><a href="${prefix}research-revisions.html">${bi('Revision notes','یادداشت اصلاحات')}</a><a href="${prefix}contact.html">${bi('Submit a sourced correction','ارسال اصلاحیهٔ مستند')}</a></nav>
</details></aside>
<!-- scholarly-record:end -->`;
 if(!/<\/h1>/i.test(raw))throw Error('Missing heading: '+filename);
 raw=raw.replace(/<\/h1>\s*/i,'</h1>\n'+card).replace(/<\/head>/i,`<link data-scholarly-style rel="stylesheet" href="${prefix}scholarly-records.css?v=20261030"></head>`);
 await fs.writeFile(file,raw);
 const csl={id:record.id,type:'webpage',title,publisher:'HSKRC',URL:canonical,'issued':{'date-parts':[record.revised.split('-').map(Number)]},note:'Publication record updated '+record.revised+'. No independent peer-review report is linked to this edition. '+record.note_en};
 await fs.writeFile(new URL('citations/'+record.id+'.json',root),JSON.stringify([csl],null,2)+'\n');
 const line=s=>String(s).replace(/[\r\n]+/g,' ');
 await fs.writeFile(new URL('citations/'+record.id+'.ris',root),`TY  - ELEC\nID  - ${record.id}\nTI  - ${line(title)}\nPB  - HSKRC\nDA  - ${record.revised}\nUR  - ${canonical}\nN1  - ${line(csl.note)}\nER  -\n`);
 count++;
}
console.log(`Rendered ${count} research records and citation exports`);
