(function(){
  "use strict";

  const LABELS = {
    en:{
      home:"Home", knowledge:"Knowledge Base", library:"Library", articles:"Articles",
      researchers:"Researchers", sources:"Sources", explorer:"Explorer", about:"About", founder:"Founder",
      support:"Support", contact:"Feedback", account:"Account", myAccount:"My Account", lang:"فارسی"
    },
    fa:{
      home:"خانه", knowledge:"پایگاه دانش", library:"کتابخانه", articles:"مقالات",
      researchers:"پژوهشگران", sources:"منابع", explorer:"کاوشگر", about:"درباره", founder:"بنیان‌گذار",
      support:"حمایت", contact:"بازخورد", account:"حساب کاربری", myAccount:"حساب من", lang:"English"
    }
  };

  const SUPABASE_URL="https://uwuklryzxexpofcxrbnm.supabase.co";
  const SUPABASE_KEY="sb_publishable_pC4zCrTiZLb0hW0oXqt0tg_i1vjIoW2";

  function storedSessionActive(){
    try{
      const raw=localStorage.getItem("sb-uwuklryzxexpofcxrbnm-auth-token");
      if(!raw) return false;
      const data=JSON.parse(raw);

      const accessToken =
        data?.access_token ||
        data?.currentSession?.access_token ||
        data?.session?.access_token;

      const expiresAt =
        data?.expires_at ||
        data?.currentSession?.expires_at ||
        data?.session?.expires_at;

      if(!accessToken) return false;
      if(expiresAt && Number(expiresAt) * 1000 <= Date.now()) return false;

      return true;
    }catch(_){
      return false;
    }
  }

  function lang(){
    return localStorage.getItem("hskrc_language")==="fa" ? "fa" : "en";
  }

  function fileName(){
    const p=location.pathname.split("/").filter(Boolean).pop() || "index.html";
    return p.toLowerCase();
  }

  function activeSection(){
    const f=fileName();
    if(f==="index.html" || f==="hskrc") return "home";
    if(f==="library.html" || f==="book.html") return "library";
    if(f==="articles.html" || f==="article.html") return "articles";
    if(f==="researchers.html" || f==="researcher.html") return "researchers";
    if(f==="sources.html" || f==="source.html") return "sources";
    if(f==="research-explorer.html") return "explorer";
    if(f==="about.html") return "about";
    if(f==="founder.html") return "founder";
    if(f==="support.html") return "support";
    if(f==="contact.html") return "contact";
    if(f==="account.html" || f==="auth.html") return "account";

    const knowledgePages=[
      "alamut-knowledge-base.html","hassan-sabbah.html","alamut.html","lambesar.html",
      "navizarshah.html","shams-kelaye.html","qostinlar.html","shirkuh.html","ilan.html"
    ];
    if(knowledgePages.includes(f)) return "knowledge";
    return "";
  }

  function navLink(key, href, label){
    const active=activeSection()===key ? " is-active" : "";
    return `<a class="hskrc-global-navlink${active}" data-hskrc-key="${key}" href="${href}">${label}</a>`;
  }

  function renderHeader(){
    const L=LABELS[lang()];
    const loggedIn=storedSessionActive();
    const accountText=loggedIn ? L.myAccount : L.account;
    const accountHref=loggedIn ? "account.html" : "auth.html";
    const header=document.createElement("header");
    header.className="hskrc-global-header";
    header.innerHTML=`
      <div class="hskrc-global-shell">
        <a class="hskrc-global-brand" href="index.html" aria-label="HSKRC Home">
          <span class="hskrc-global-mark">H</span>
          <span class="hskrc-global-brandcopy">
            <strong>HSKRC</strong>
            <small>Knowledge & Research Centre</small>
          </span>
        </a>

        <nav class="hskrc-global-nav" aria-label="Primary navigation">
          ${navLink("home","index.html",L.home)}
          ${navLink("knowledge","alamut-knowledge-base.html",L.knowledge)}
          ${navLink("library","library.html",L.library)}
          ${navLink("articles","articles.html",L.articles)}
          ${navLink("researchers","researchers.html",L.researchers)}
          ${navLink("sources","sources.html",L.sources)}
          ${navLink("explorer","research-explorer.html",L.explorer)}
          ${navLink("about","about.html",L.about)}
          ${navLink("founder","founder.html",L.founder)}
          ${navLink("support","support.html",L.support)}
          ${navLink("contact","contact.html",L.contact)}
        </nav>

        <div class="hskrc-global-actions">
          <a id="hskrcGlobalAccount" class="hskrc-global-account${activeSection()==="account"?" is-active":""}" href="${accountHref}">${accountText}</a>
          <button id="hskrcGlobalLang" class="hskrc-global-lang" type="button">${L.lang}</button>
        </div>
      </div>`;
    document.body.insertBefore(header,document.body.firstChild);
  }

  function renderFooter(){
    const footer=document.createElement("footer");
    footer.className="hskrc-global-footer";
    footer.innerHTML=`
      <div class="hskrc-global-footer-inner">
        <a class="hskrc-global-founder" href="founder.html">Founded by <strong>Kamaluddin Barlas</strong></a>
        <div class="hskrc-global-copy"><a href="support.html">Support</a> · <a href="contact.html">Feedback</a> · © 2026 HSKRC - All rights reserved.</div>
      </div>`;
    document.body.appendChild(footer);
  }

  function legacyLanguageButton(){
    const candidates=[
      document.getElementById("languageToggle"),
      document.getElementById("languageButton"),
      document.getElementById("lang")
    ].filter(Boolean);
    return candidates.find(el => el.id!=="hskrcGlobalLang") || null;
  }

  function fallbackApplyLanguage(next){
    localStorage.setItem("hskrc_language",next);
    document.documentElement.lang=next;
    document.documentElement.dir=next==="fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-en][data-fa]").forEach(el=>{
      const val=next==="fa" ? el.getAttribute("data-fa") : el.getAttribute("data-en");
      if(val!==null) el.textContent=val;
    });
  }

  function syncGlobalLabels(){
    const L=LABELS[lang()];
    const map={
      home:L.home,knowledge:L.knowledge,library:L.library,articles:L.articles,
      researchers:L.researchers,sources:L.sources,explorer:L.explorer,about:L.about,founder:L.founder,support:L.support,contact:L.contact
    };
    Object.entries(map).forEach(([k,v])=>{
      const el=document.querySelector(`.hskrc-global-nav [data-hskrc-key="${k}"]`);
      if(el) el.textContent=v;
    });
    const b=document.getElementById("hskrcGlobalLang");
    if(b) b.textContent=L.lang;
  }

  function bindLanguage(){
    const btn=document.getElementById("hskrcGlobalLang");
    if(!btn) return;
    btn.addEventListener("click",()=>{
      const old=legacyLanguageButton();
      if(old){
        old.click();
      }else{
        fallbackApplyLanguage(lang()==="fa" ? "en" : "fa");
      }
      setTimeout(syncGlobalLabels,0);
      setTimeout(syncGlobalLabels,80);
    });
  }

  async function syncAccount(){
    const a=document.getElementById("hskrcGlobalAccount");
    if(!a) return;

    const L=LABELS[lang()];

    // Fast path: Supabase persists the login session in localStorage.
    // This works even on static pages that do not load the Supabase SDK.
    if(storedSessionActive()){
      a.href="account.html";
      a.textContent=L.myAccount;
      return;
    }

    a.href="auth.html";
    a.textContent=L.account;

    // Fallback for pages that already load Supabase.
    try{
      if(window.supabase && typeof window.supabase.createClient==="function"){
        const c=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
        const res=await c.auth.getSession();
        if(res?.data?.session){
          a.href="account.html";
          a.textContent=L.myAccount;
        }
      }
    }catch(_){}
  }

  function addPageClass(){
    const sec=activeSection();
    if(sec) document.body.classList.add(`hskrc-page-${sec}`);
  }

  function init(){
    addPageClass();
    renderHeader();
    renderFooter();
    syncGlobalLabels();
    bindLanguage();
    syncAccount();

    window.addEventListener("storage",(e)=>{
      if(e.key==="hskrc_language"){
        syncGlobalLabels();
        syncAccount();
      }
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }
})();


/* =========================================================
   HSKRC SAME-TAB INTERNAL NAVIGATION
   Force normal clicks on internal HSKRC links to stay in the
   current browser tab. External source links are unaffected.
   ========================================================= */
document.addEventListener("click", function(event) {
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  const anchor = event.target.closest("a[href]");
  if (!anchor) return;

  const rawHref = anchor.getAttribute("href");
  if (!rawHref) return;

  if (
    rawHref.startsWith("#") ||
    rawHref.startsWith("mailto:") ||
    rawHref.startsWith("tel:") ||
    rawHref.startsWith("javascript:")
  ) {
    return;
  }

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch (_) {
    return;
  }

  const sameOrigin = url.origin === window.location.origin;
  const insideHSKRC = url.pathname.includes("/HSKRC/");

  if (sameOrigin && insideHSKRC) {
    event.preventDefault();
    window.location.assign(url.href);
  }
}, true);
