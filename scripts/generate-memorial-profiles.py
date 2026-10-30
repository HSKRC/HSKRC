"""Regenerate the 44 source-attributed profiles and directory links from reviewed transcription."""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parent.parent
D=json.loads((ROOT/'data/firqah-80-memorial.json').read_text())
PEOPLE=D['people']
def esc(s):return html.escape(str(s),quote=True)
def number(n):return str(n).translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹'))
def bi(tag,en,fa,attrs=''):
 return f'<{tag}{(" "+attrs) if attrs else ""} data-en="{esc(en)}" data-fa="{esc(fa)}">{esc(fa)}</{tag}>'
def missing():return bi('span','Not stated in the supplied source','در منبع ارائه‌شده ذکر نشده')
def display_name(p):
 rank=p.get('rank') or p.get('last_rank')
 return f'{rank} {p["name"]}' if rank else p['name']
def location(p):return (f'page {p["page"]}, row {p["row"]}',f'صفحهٔ {number(p["page"])}, ردیف {number(p["row"])}') if p['page'] else (f'continuation image IMG_6273.jpeg, row {p["row"]}',f'تصویر ادامهٔ جدول IMG_6273.jpeg، ردیف {number(p["row"])}؛ شمارهٔ صفحه در تصویر دیده نمی‌شود')
def page(filename,title,description,content,schema):
 text=f'''<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | HSKRC</title><meta name="description" content="{esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://hskrc.org/{filename}"><link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(title)} | HSKRC"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="https://hskrc.org/{filename}"><meta property="og:image" content="https://hskrc.org/hskrc-social-preview.png">
<link rel="stylesheet" href="hskrc-global.css?v=20261025-unified6"><link rel="stylesheet" href="research-design.css?v=20261025-navcompact2"><link rel="stylesheet" href="memorial-profiles.css?v=20261025-1">
<script defer src="hskrc-global.js?v=20261025-memorial1"></script>
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('<', chr(92)+'u003c')}</script></head>
<body class="hskrc-unified"><main class="memorial-page" id="memorialMain">{content}</main><script src="memorial-profiles.js?v=20261025-1"></script></body></html>'''
 (ROOT/filename).write_text(text+'\n')
category_en='Firqah 80 memorial collection';category_fa='یادمان شهدای فرقهٔ هشتاد'
source_en='The supplied printed list describes those named as defenders of the rights of Ismailis in Afghanistan who were killed during combat. Placement in the Firqah 80 collection follows the contributor’s identification; this unit is not named in the visible table heading.'
source_fa='فهرست چاپی ارائه‌شده، افراد نام‌برده را مدافعان حقوق اسماعیلیان افغانستان معرفی می‌کند که هنگام محاربه به شهادت رسیده‌اند. قرارگرفتن این مدخل در مجموعهٔ فرقهٔ هشتاد بر اساس معرفی ارائه‌دهندهٔ سند است؛ نام این فرقه در عنوانِ قابل‌مشاهدهٔ جدول نیامده است.'
for p in PEOPLE:
 name=p['name'];display=display_name(p);filename=p['id']+'.html';where_en,where_fa=location(p)
 desc=f'پروفایل یادبود {name}؛ ردیف {number(p["row"])} فهرست چاپی ارائه‌شده، همراه با مشخصات و ارجاع به منبع.'
 intro_fa=f'نام {name} در ردیف {number(p["row"])} فهرست چاپی شهدا ثبت شده است. این صفحه مشخصات همان ردیف را برای حفظ یاد و امکان پیگیری منبع گردآوری می‌کند.'
 intro_en=f'{name} is named in row {p["row"]} of the supplied printed memorial list. This record preserves the information in that row with a traceable source reference.'
 breadcrumb=bi('a','People','شخصیت‌ها','href="people.html"')+' / '+bi('a',category_en,category_fa,'href="people.html?category=ismaili-firqah-80"')
 hero='<nav class="memorial-breadcrumb">'+breadcrumb+'</nav><header class="memorial-hero">'+bi('div',category_en,category_fa,'class="memorial-kicker"')+f'<h1 lang="fa" dir="auto">{esc(display)}</h1>'+bi('p',intro_en,intro_fa)+'</header>'
 fields=''
 for label_en,label_fa,key in [('Name','نام','name'),('Father’s name','نام پدر (ولد)','father'),('Residence as printed','سکونت در جدول','residence'),('Rank as printed','رتبه در جدول','rank'),('Final rank as printed','آخرین رتبه در جدول','last_rank')]:
  fields+='<div>'+bi('dt',label_en,label_fa)+'<dd dir="auto">'+(f'<span lang="fa">{esc(p[key])}</span>' if p[key] else missing())+'</dd></div>'
 fields+='<div>'+bi('dt','Birth / death dates','تاریخ تولد / شهادت')+'<dd>'+missing()+'</dd></div>'
 fields+='<div>'+bi('dt','Battle / place of death','نبرد / محل شهادت')+'<dd>'+missing()+'</dd></div>'
 overview=bi('h2','About this record','دربارهٔ این پروفایل')+bi('p',source_en,source_fa)
 if p['transcription_note']:overview+=bi('p','Transcription note: '+('The printed rank needs comparison with a clearer copy.' if p['row']==22 else 'The residence is transcribed as printed and has not been reconciled with a modern place name.'),p['transcription_note'],'class="memorial-note"')
 provenance=bi('h2','Source and provenance','منبع و مأخذ')+bi('p','Supplied photograph of a printed list; '+where_en+'، '+p['source_image']+'.','تصویر ارائه‌شده از فهرست چاپی؛ '+where_fa+'؛ '+p['source_image']+'.')
 provenance+=bi('p','The title page, author, publisher and publication year were not included with these photographs. No dates, portrait or additional biography have been inferred.','صفحهٔ عنوان، نام نویسنده، ناشر و سال نشر در این تصاویر ارائه نشده است. تاریخ، تصویر شخص و جزئیات زندگی‌نامه‌ایِ اضافی از این جدول استنباط نشده‌اند.','class="memorial-note"')
 provenance+=bi('a','View the source record and all 44 names →','مشاهدهٔ مشخصات منبع و هر ۴۴ نام ←','href="firqah-80-source.html#source-row-'+str(p['row'])+'"')
 body=hero+'<div class="memorial-layout"><div><section class="memorial-section">'+overview+'</section><section class="memorial-section">'+provenance+'</section></div><aside class="memorial-section">'+bi('h2','Recorded details','مشخصات ثبت‌شده')+'<dl class="memorial-fields">'+fields+'</dl></aside></div>'
 nav=[]
 if p['row']>1:nav.append(bi('a','Previous profile','پروفایل قبلی',f'href="firqah-80-{p["row"]-1:03}.html"'))
 nav.append(bi('a','All Firqah 80 profiles','همهٔ پروفایل‌های فرقهٔ هشتاد','href="people.html?category=ismaili-firqah-80"'))
 if p['row']<44:nav.append(bi('a','Next profile','پروفایل بعدی',f'href="firqah-80-{p["row"]+1:03}.html"'))
 body+='<nav class="memorial-nav">'+' '.join(nav)+'</nav>'
 schema={'@context':'https://schema.org','@type':'ProfilePage','name':display+' | '+category_fa,'url':'https://hskrc.org/'+filename,'inLanguage':['fa','en'],'description':desc,'mainEntity':{'@type':'Person','name':name},'citation':{'@type':'CreativeWork','name':'فهرست چاپی شهدا — تصاویر ارائه‌شده','url':'https://hskrc.org/firqah-80-source.html'},'isPartOf':{'@type':'WebSite','name':'HSKRC','url':'https://hskrc.org/'}}
 page(filename,display,desc,body,schema)
# Separate source record, without claiming the running header is a verified book title.
body='<nav class="memorial-breadcrumb">'+bi('a',category_en,category_fa,'href="people.html?category=ismaili-firqah-80"')+'</nav><header class="memorial-hero">'+bi('div','Source record · HSKRC-F80-001','پروندهٔ منبع · HSKRC-F80-001','class="memorial-kicker"')+bi('h1','Printed memorial list: 44 individual records','فهرست چاپی شهدا: ۴۴ پروفایل مستقل')+'</header>'
body+='<section class="memorial-section">'+bi('h2','What the photographs establish','آنچه در تصاویر آمده است')+bi('p',source_en,source_fa)
body+=bi('p','Visible running headers: «یادی از کیان نادری و سید منصور کیانی» and «من هیچگاه سربازانم را فراموش نکرده ام». These are recorded as visible headings; the bibliographic title, author, publisher and publication year remain unconfirmed.','سرصفحه‌های قابل‌مشاهده: «یادی از کیان نادری و سید منصور کیانی» و «من هیچگاه سربازانم را فراموش نکرده ام». این عبارت‌ها به‌عنوان سرصفحه ثبت شده‌اند؛ عنوان کتاب، نویسنده، ناشر و سال نشر هنوز مشخص نشده‌اند.')
body+=bi('p','IMG_6271.jpeg: printed page 105, rows 1–12. IMG_6272.jpeg: printed page 106, rows 13–41. IMG_6273.jpeg: continuation, rows 42–44; its page number is outside the photograph.','IMG_6271.jpeg: صفحهٔ ۱۰۵، ردیف‌های ۱ تا ۱۲. IMG_6272.jpeg: صفحهٔ ۱۰۶، ردیف‌های ۱۳ تا ۴۱. IMG_6273.jpeg: ادامهٔ جدول، ردیف‌های ۴۲ تا ۴۴؛ شمارهٔ صفحه در تصویر دیده نمی‌شود.')
body+=bi('p','Names and recorded details are transcribed from the supplied images. Empty cells remain unspecified; variant place spellings have not been silently corrected. No independent service record or death date was supplied.','نام‌ها و مشخصات از تصاویر ارائه‌شده رونویسی شده‌اند. خانه‌های خالی نامشخص باقی مانده‌اند و املای متفاوت محل‌ها خودسرانه تصحیح نشده است. سند مستقل خدمت یا تاریخ شهادت همراه این تصاویر ارائه نشده است.','class="memorial-note"')+'</section>'
body+='<ol class="memorial-source-list">'+''.join(f'<li id="source-row-{p["row"]}"><a href="{p["id"]}.html"><small>{bi("span","Source row "+str(p["row"]),"ردیف "+number(p["row"]))}</small><strong lang="fa" dir="auto">{esc(display_name(p))}</strong></a></li>' for p in PEOPLE)+'</ol>'
page('firqah-80-source.html','منبع فهرست شهدای فرقهٔ هشتاد','مشخصات سه تصویر ارائه‌شده و ارجاع به ۴۴ پروفایل یادبود.',body,{'@context':'https://schema.org','@type':'CollectionPage','name':'فهرست چاپی شهدا','url':'https://hskrc.org/firqah-80-source.html','hasPart':[{'@type':'ProfilePage','name':p['name'],'url':'https://hskrc.org/'+p['id']+'.html'} for p in PEOPLE]})
# Static directory cards are indexable even if the database or JavaScript is unavailable.
cards=[]
for p in PEOPLE:
 details_fa='؛ '.join(([f'ولد: {p["father"]}'] if p['father'] else [])+([f'سکونت: {p["residence"]}'] if p['residence'] else [])+([f'رتبه: {p["rank"]}'] if p['rank'] else [])) or 'نام در منبع ثبت شده است؛ مشخصات دیگر در این ردیف ذکر نشده‌اند.'
 details_en='; '.join(([f'Father: {p["father"]}'] if p['father'] else [])+([f'Residence: {p["residence"]}'] if p['residence'] else [])+([f'Rank: {p["rank"]}'] if p['rank'] else [])) or 'Named in the source; other details are not stated in this row.'
 search=' '.join(str(p.get(k) or '') for k in ['name','father','residence','rank','last_rank'])+' افغانستان Afghanistan شهدا فرقه هشتاد Firqah 80'
 cards.append(f'<article class="card memorial-directory-card" data-memorial-id="{p["id"]}" data-categories="ismaili-firqah-80" data-country="AF" data-services="military-service" data-search="{esc(search)}">'+bi('div',category_en,category_fa,'class="card-kicker"')+f'<h2 lang="fa" dir="auto">{esc(display_name(p))}</h2>'+bi('p',details_en,details_fa)+bi('div',f'Supplied printed list · row {p["row"]}',f'فهرست چاپی ارائه‌شده · ردیف {number(p["row"])}','class="dates"')+bi('a','Open memorial profile →','بازکردن پروفایل یادبود ←',f'class="card-link" href="{p["id"]}.html"')+'</article>')
p=ROOT/'people.html';s=p.read_text();block='<!-- F80_PROFILES_START -->\n'+'\n'.join(cards)+'\n<!-- F80_PROFILES_END -->'
if '<!-- F80_PROFILES_START -->' in s:s=re.sub(r'<!-- F80_PROFILES_START -->[\s\S]*?<!-- F80_PROFILES_END -->',lambda _:block,s)
else:s=s.replace('  </section>\n\n  <div id="peopleEmpty"',block+'\n  </section>\n\n  <div id="peopleEmpty"')
s=s.replace('>6 profiles</span>','>50 profiles</span>')
p.write_text(s)
# Add search entries, retaining all prior entries.
p=ROOT/'entries.html';s=p.read_text();pattern=r'(<script[^>]*id="entryData"[^>]*>)([\s\S]*?)(</script>)';match=re.search(pattern,s);entries=json.loads(match[2]);entries=[x for x in entries if not x['url'].startswith('firqah-80-')]
entries.extend({'url':p['id']+'.html','en':display_name(p),'fa':display_name(p),'kind':'person','descriptionEn':f'Firqah 80 memorial record; supplied printed list, row {p["row"]}.','descriptionFa':f'یادمان شهدای فرقهٔ هشتاد؛ ردیف {number(p["row"])} فهرست چاپی ارائه‌شده.'} for p in PEOPLE)
s=re.sub(pattern,lambda m:m[1]+json.dumps(entries,ensure_ascii=False).replace('<','\\u003c')+m[3],s);p.write_text(s)
p=ROOT/'sitemap.xml';s=p.read_text();s=re.sub(r'\s*<url>\s*<loc>https://hskrc\.org/firqah-80-[\s\S]*?</url>','',s)
urls=[p['id']+'.html' for p in PEOPLE]+['firqah-80-source.html'];s=s.replace('</urlset>',''.join(f'  <url><loc>https://hskrc.org/{url}</loc><lastmod>2026-10-25</lastmod><changefreq>monthly</changefreq></url>\n' for url in urls)+'</urlset>');p.write_text(s)
print('Generated 44 profiles, one source record, directory/search entries and sitemap links.')

# Restore the shared citation/provenance layer after rebuilding memorial HTML.
if (ROOT/"editorial/scholarly-records.json").exists():
 import subprocess
 subprocess.run(["node", str(ROOT/"scripts/render-scholarly-records.mjs")], cwd=ROOT, check=True)
