(function(){
  'use strict';
  const root=document.documentElement;
  const initial=document.getElementById('catalogInitialData');
  const shelf=document.getElementById('catalogShelf');
  const total=document.getElementById('catalogTotal');
  let records=[];
  try{records=JSON.parse(initial.textContent);}catch(_){}
  const language=()=>root.lang==='fa'?'fa':'en';
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function render(){
    const fa=language()==='fa';
    document.querySelectorAll('[data-en][data-fa]').forEach(element=>element.textContent=element.dataset[fa?'fa':'en']);
    document.querySelectorAll('[data-placeholder-en][data-placeholder-fa]').forEach(element=>element.placeholder=element.dataset[fa?'placeholderFa':'placeholderEn']);
    document.title=fa?'HSKRC | کتابخانه دیجیتال حسن صباح':'HSKRC Digital Library | Books, History & Research';
    total.textContent=new Intl.NumberFormat(fa?'fa-AF':'en-AU').format(records.length);
    if(!records.length){shelf.innerHTML=`<p>${fa?"مجموعه در حال به‌روزرسانی است.":"The collection is being updated."}</p>`;document.querySelector(".catalog-hero-feature").hidden=true;return;}
    document.querySelector(".catalog-hero-feature").hidden=false;
    shelf.innerHTML=records.slice(0,6).map((book,index)=>`<a class="catalog-record tone-${index%4}" href="book.html?id=${encodeURIComponent(book.id)}"><div class="catalog-record-jacket"><span class="catalog-record-index">HSKRC / ${String(index+1).padStart(2,'0')}</span><div class="catalog-record-title" dir="auto">${escape(book.title)}</div><span class="catalog-record-rule"></span><div class="catalog-record-author" dir="auto">${escape(book.author)}</div><span class="catalog-record-language">${fa?'فارسی · رکورد کتابخانه':'Persian · Catalogue record'}</span></div><div class="catalog-record-bottom"><span>${fa?'معرفی کتاب':'Explore book'}</span><span aria-hidden="true">↗</span></div></a>`).join('');
  }
  render();
  new MutationObserver(render).observe(root,{attributes:true,attributeFilter:['lang']});
  // Fetch only published catalogue metadata through the existing public Data API.
  fetch('https://uwuklryzxexpofcxrbnm.supabase.co/rest/v1/books?select=id,title,author,category,language,publication_year&published=eq.true&order=created_at.desc',{headers:{apikey:'sb_publishable_pC4zCrTiZLb0hW0oXqt0tg_i1vjIoW2'},signal:AbortSignal.timeout(10000)})
    .then(response=>{if(!response.ok)throw new Error('Catalogue unavailable');return response.json();})
    .then(data=>{if(Array.isArray(data)){records=data;render();}})
    .catch(()=>{/* The verified catalogue snapshot remains available. */});
})();
