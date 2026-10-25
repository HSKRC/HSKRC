(()=>{
  let language='en';try{language=localStorage.getItem('hskrc_language')==='fa'?'fa':'en';}catch(_){}
  document.documentElement.lang=language;
  document.documentElement.dir=language==='fa'?'rtl':'ltr';
  document.querySelectorAll('[data-en][data-fa]').forEach(el=>el.textContent=el.dataset[language]);
})();
