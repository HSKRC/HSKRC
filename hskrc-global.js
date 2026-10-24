
(function(){
  "use strict";

  const LABELS = {
    en:{
      home:"Home", knowledge:"Knowledge Base", library:"Library", articles:"Articles",
      researchers:"Researchers", sources:"Sources", explorer:"Explorer", people:"People", about:"About", founder:"Founder & CEO",
      impact:"Community Impact", involved:"Get Involved", support:"Support", contact:"Feedback", account:"Account", myAccount:"My Account", more:"More", lang:"فارسی", themeOn:"Dark", themeOff:"Light"
    },
    fa:{
      home:"خانه", knowledge:"پایگاه دانش", library:"کتابخانه", articles:"مقالات",
      researchers:"پژوهشگران", sources:"منابع", explorer:"کاوشگر", people:"شخصیت‌ها", about:"درباره", founder:"بنیان‌گذار و مدیرعامل",
      impact:"تأثیر اجتماعی", involved:"مشارکت", support:"حمایت", contact:"بازخورد", account:"حساب کاربری", myAccount:"حساب من", more:"بیشتر", lang:"English", themeOn:"تاریک", themeOff:"روشن"
    }
  };


  const storage = {
    getItem(key){ try { return window.localStorage.getItem(key); } catch (_) { return null; } },
    setItem(key,value){ try { window.localStorage.setItem(key,value); } catch (_) {} }
  };
  const THEME_KEY="hskrc_theme";

  function currentTheme(){
    const saved=storage.getItem(THEME_KEY);
    return saved==="dark" ? "dark" : "light";
  }

  function applyTheme(next, persist=true){
    const theme=next==="light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme",theme);
    document.documentElement.style.colorScheme=theme;
    if(persist) storage.setItem(THEME_KEY,theme);

    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute("content",theme==="light" ? "#ffffff" : "#111111");
  }

  // Light mode is the default HSKRC design; a saved dark preference is preserved.
  applyTheme(currentTheme(),false);

  function storedSessionActive(){
    try{
      const raw=storage.getItem("sb-uwuklryzxexpofcxrbnm-auth-token");
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
    return storage.getItem("hskrc_language")==="fa" ? "fa" : "en";
  }

  function fileName(){
    const p=location.pathname.split("/").filter(Boolean).pop() || "index.html";
    return p.toLowerCase();
  }

  function sitePath(path){
    return location.pathname.includes("/generated-articles/")
      ? "../" + path
      : path;
  }

  function activeSection(){
    if(location.pathname.includes("/generated-articles/")) return "articles";
    const f=fileName();
    if(f==="index.html" || f==="hskrc") return "home";
    if(f==="library.html" || f==="book.html") return "library";
    if(f==="articles.html" || f==="article.html") return "articles";
    if(f==="researchers.html" || f==="researcher.html") return "researchers";
    if(f==="sources.html" || f==="source.html") return "sources";
    if(f==="research-explorer.html") return "explorer";
    if(["people.html","ibn-sina.html","nasir-khusraw.html","qadi-al-numan.html","abu-yaqub-al-sijistani.html","hamid-al-din-al-kirmani.html"].includes(f)) return "people";
    if(f==="knowledge-node.html") return "knowledge";
    if(f==="about.html") return "about";
    if(f==="founder.html") return "founder";
    if(f==="community-impact.html") return "impact";
    if(f==="get-involved.html") return "involved";
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
    return `<a ${active ? 'aria-current="page"' : ""} class="hskrc-global-navlink${active}" data-hskrc-key="${key}" href="${sitePath(href)}">${label}</a>`;
  }

  function renderHeader(){
    const L=LABELS[lang()];
    const loggedIn=storedSessionActive();
    const accountText=loggedIn ? L.myAccount : L.account;
    const accountHref=loggedIn ? sitePath("account.html") : sitePath("auth.html");
    const header=document.createElement("header");
    header.className="hskrc-global-header";
    header.innerHTML=`
      <div class="hskrc-global-shell">
        <a class="hskrc-global-brand" href="${sitePath("index.html")}" aria-label="HSKRC Home">
          <img class="hskrc-global-emblem" src="${sitePath("assets/hskrc-logo.svg")}" alt="" width="44" height="44">
          <span class="hskrc-global-brandcopy">
            <strong>HSKRC</strong>
            <small>Knowledge & Research Centre</small>
          </span>
        </a>

        <button class="hskrc-menu-toggle" id="hskrcMenuToggle" aria-expanded="false" aria-controls="hskrcPrimaryNav" type="button">${lang()==="fa"?"منو":"Menu"} <span aria-hidden="true">☰</span></button>
        <nav id="hskrcPrimaryNav" class="hskrc-global-nav" aria-label="${lang()==="fa"?"منوی اصلی":"Primary navigation"}">
          ${navLink("home","index.html",L.home)}
          ${navLink("library","library.html",L.library)}
          ${navLink("articles","articles.html",L.articles)}
          ${navLink("knowledge","alamut-knowledge-base.html",L.knowledge)}
          ${navLink("people","people.html",L.people)}
          <details class="hskrc-global-more">
            <summary>${L.more}</summary>
            <div class="hskrc-global-more-menu">
              ${navLink("about","about.html",L.about)}
              ${navLink("explorer","research-explorer.html",L.explorer)}
              ${navLink("researchers","researchers.html",L.researchers)}
              ${navLink("sources","sources.html",L.sources)}
              ${navLink("founder","founder.html",L.founder)}
              ${navLink("impact","community-impact.html",L.impact)}
              ${navLink("involved","get-involved.html",L.involved)}
              ${navLink("support","support.html",L.support)}
              ${navLink("contact","contact.html",L.contact)}
            </div>
          </details>
        </nav>

        <div class="hskrc-global-actions">
          <a id="hskrcGlobalAccount" class="hskrc-global-account${activeSection()==="account"?" is-active":""}" href="${accountHref}">${accountText}</a>
          <button id="hskrcGlobalTheme" class="hskrc-global-theme" type="button" aria-pressed="${currentTheme()==="dark"}">
            <span class="hskrc-global-theme-icon" aria-hidden="true">${currentTheme()==="dark"?"☾":"☀"}</span>
            <span id="hskrcGlobalThemeLabel">${currentTheme()==="dark"?L.themeOn:L.themeOff}</span>
          </button>
          <button id="hskrcGlobalLang" class="hskrc-global-lang" type="button">${L.lang}</button>
        </div>
      </div>`;
    document.body.insertBefore(header,document.body.firstChild);
    const main=document.querySelector("main");
    if(main){
      if(!main.id) main.id="hskrcMain";
      main.tabIndex=-1;
      const skip=document.createElement("a");
      skip.className="hskrc-skip-link";skip.href="#"+main.id;
      skip.textContent=lang()==="fa"?"رفتن به محتوا":"Skip to content";
      document.body.insertBefore(skip,header);
    }
    document.body.classList.add("hskrc-shared-ready");
  }

  function renderFooter(){
    const fa=lang()==="fa";
    let footer=document.querySelector(".hskrc-global-footer");
    if(!footer){footer=document.createElement("footer");footer.className="hskrc-global-footer";document.body.appendChild(footer);}
    const links=[
      ["library.html","Digital library","کتابخانه دیجیتال"],["articles.html","Articles & research","مقالات و پژوهش"],
      ["people.html","Historical figures","شخصیت‌های تاریخی"],["sources.html","Sources","منابع"],
      ["about.html","About HSKRC","درباره HSKRC"],["project-overview.html","Project overview","نمای کلی پروژه"],
      ["get-involved.html","Contribute","مشارکت"],["contact.html","Contact & feedback","تماس و بازخورد"],
      ["editorial-policy.html","Editorial policy","سیاست نشر"],["privacy.html","Privacy","حریم خصوصی"],["terms.html","Terms","شرایط استفاده"]
    ];
    footer.innerHTML=`<div class="hskrc-global-footer-inner">
      <div class="hskrc-footer-intro"><strong>HSKRC</strong><p>${fa?"مرکز دانش و پژوهش حسن صباح؛ کتابخانه، تاریخ و میراث فکری.":"Hassan Sabbah Knowledge & Research Centre. A place for books, history and intellectual heritage."}</p>
      <a class="hskrc-global-founder" href="${sitePath("founder.html")}">${fa?"بنیان‌گذار و مدیرعامل: کمال برلاس":"Founded by Kamal Barlas · Founder & CEO"}</a></div>
      <nav class="hskrc-footer-links" aria-label="${fa?"پیوندهای پایانی":"Footer navigation"}">${links.map(([url,en,per])=>`<a href="${sitePath(url)}">${fa?per:en}</a>`).join("")}</nav>
      <div class="hskrc-global-copy">© ${new Date().getFullYear()} HSKRC · ${fa?"تمام حقوق محفوظ است.":"All rights reserved."}</div></div>`;
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
    storage.setItem("hskrc_language",next);
    const fixed=document.body?.dataset?.fixedContentLanguage;
    const pageLang=fixed || next;
    document.documentElement.lang=pageLang;
    document.documentElement.dir=pageLang==="fa" ? "rtl" : "ltr";
    document.querySelectorAll("[data-en][data-fa]").forEach(el=>{
      const val=next==="fa" ? el.getAttribute("data-fa") : el.getAttribute("data-en");
      if(val!==null) el.textContent=val;
    });
  }

  function syncGlobalLabels(){
    const L=LABELS[lang()];
    const map={
      home:L.home,knowledge:L.knowledge,library:L.library,articles:L.articles,
      researchers:L.researchers,sources:L.sources,explorer:L.explorer,people:L.people,about:L.about,founder:L.founder,impact:L.impact,involved:L.involved,support:L.support,contact:L.contact
    };
    Object.entries(map).forEach(([k,v])=>{
      const el=document.querySelector(`.hskrc-global-nav [data-hskrc-key="${k}"]`);
      if(el) el.textContent=v;
    });
    const more=document.querySelector(".hskrc-global-more > summary"); if(more) more.textContent=L.more;
    const b=document.getElementById("hskrcGlobalLang");
    if(b) b.textContent=L.lang;
    const menu=document.getElementById("hskrcMenuToggle");
    if(menu) menu.firstChild.textContent=lang()==="fa"?"منو ":"Menu ";
    const skip=document.querySelector(".hskrc-skip-link");
    if(skip) skip.textContent=lang()==="fa"?"رفتن به محتوا":"Skip to content";
    document.querySelectorAll("[data-placeholder-en][data-placeholder-fa]").forEach(el=>el.placeholder=el.dataset[lang()==="fa"?"placeholderFa":"placeholderEn"]);
    const nav=document.getElementById("hskrcPrimaryNav");
    if(nav) nav.setAttribute("aria-label",lang()==="fa"?"منوی اصلی":"Primary navigation");
    renderFooter();
    syncAccount();
    syncThemeButton();
  }

  function syncThemeButton(){
    const btn=document.getElementById("hskrcGlobalTheme");
    const label=document.getElementById("hskrcGlobalThemeLabel");
    if(!btn || !label) return;
    const dark=currentTheme()==="dark";
    const L=LABELS[lang()];
    const icon=btn.querySelector(".hskrc-global-theme-icon");
    label.textContent=dark ? L.themeOn : L.themeOff;
    if(icon) icon.textContent=dark ? "☾" : "☀";
    btn.setAttribute("aria-pressed",String(dark));
    btn.setAttribute("aria-label",lang()==="fa" ? (dark ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک") : (dark ? "Turn dark mode off" : "Turn dark mode on"));
  }

  function bindTheme(){
    const btn=document.getElementById("hskrcGlobalTheme");
    if(!btn) return;
    syncThemeButton();
    btn.addEventListener("click",()=>{
      const next=currentTheme()==="dark" ? "light" : "dark";
      applyTheme(next,true);
      syncThemeButton();
    });
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

  function bindMobileMoreMenu(){
    const details=document.querySelector(".hskrc-global-more");
    const summary=details?.querySelector(":scope > summary");
    const menu=details?.querySelector(".hskrc-global-more-menu");
    if(!details || !summary || !menu) return;

    const mq=window.matchMedia("(max-width: 900px)");

    function clearMobilePosition(){
      ["position","top","left","right","width","max-height","overflow-y"].forEach(p=>menu.style.removeProperty(p));
    }

    function positionMobileMenu(){
      if(!details.open || !mq.matches){
        clearMobilePosition();
        return;
      }

      const rect=summary.getBoundingClientRect();
      const gutter=13;
      const width=Math.min(320,window.innerWidth-(gutter*2));
      const left=Math.max(gutter,Math.min(rect.left,window.innerWidth-width-gutter));
      const top=Math.min(rect.bottom+2,window.innerHeight-120);

      menu.style.setProperty("position","fixed","important");
      menu.style.setProperty("top",top+"px","important");
      menu.style.setProperty("left",left+"px","important");
      menu.style.setProperty("right","auto","important");
      menu.style.setProperty("width",width+"px","important");
      menu.style.setProperty("max-height",Math.max(110,window.innerHeight-top-gutter)+"px","important");
      menu.style.setProperty("overflow-y","auto","important");
    }

    details.addEventListener("toggle",()=>{
      if(details.open) requestAnimationFrame(positionMobileMenu);
      else clearMobilePosition();
    });

    document.addEventListener("click",(event)=>{
      if(details.open && !details.contains(event.target)) details.open=false;
    });

    document.addEventListener("keydown",(event)=>{
      if(event.key==="Escape" && details.open){
        details.open=false;
        summary.focus();
      }
    });

    window.addEventListener("resize",positionMobileMenu,{passive:true});
    window.addEventListener("orientationchange",()=>setTimeout(positionMobileMenu,120),{passive:true});
    window.addEventListener("scroll",positionMobileMenu,{passive:true});
  }

  async function syncAccount(){
    const a=document.getElementById("hskrcGlobalAccount");
    if(!a) return;

    const L=LABELS[lang()];

    // Fast path: Supabase persists the login session in localStorage.
    // This works even on static pages that do not load the Supabase SDK.
    if(storedSessionActive()){
      a.href=sitePath("account.html");
      a.textContent=L.myAccount;
      return;
    }

    a.href=sitePath("auth.html");
    a.textContent=L.account;


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
    bindTheme();
    bindMobileMoreMenu();
    const menuToggle=document.getElementById("hskrcMenuToggle");
    const primaryNav=document.getElementById("hskrcPrimaryNav");
    menuToggle.addEventListener("click",()=>{
      const open=menuToggle.getAttribute("aria-expanded")!=="true";
      menuToggle.setAttribute("aria-expanded",String(open));primaryNav.classList.toggle("is-open",open);
    });
    document.addEventListener("keydown",e=>{
      if(e.key==="Escape" && menuToggle.getAttribute("aria-expanded")==="true"){
        menuToggle.setAttribute("aria-expanded","false");primaryNav.classList.remove("is-open");menuToggle.focus();
      }
    });
    syncAccount();

    window.addEventListener("storage",(e)=>{
      if(e.key==="hskrc_language"){
        syncGlobalLabels();
        syncAccount();
      }
      if(e.key===THEME_KEY){
        applyTheme(currentTheme(),false);
        syncThemeButton();
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


/* =========================================================
   HSKRC SEO HELPERS
   Shared canonical/metadata utilities for dynamic pages.
   ========================================================= */
(function(){
  "use strict";

  const SITE_URL = "https://hskrc.org";

  window.HSKRCArticleUrl = function(article){
    if(!article || !article.id) return "articles.html";
    const slug = String(article.title || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
    const stem = slug ? `${slug}-${String(article.id).slice(0,8)}` : String(article.id);
    return `generated-articles/${stem}.html`;
  };

  function upsertMeta(selector, attr, value, content){
    let el = document.head.querySelector(selector);
    if(!el){
      el = document.createElement("meta");
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content || "");
    return el;
  }

  function setCanonical(url){
    let el = document.head.querySelector('link[rel="canonical"]');
    if(!el){
      el = document.createElement("link");
      el.rel = "canonical";
      document.head.appendChild(el);
    }
    el.href = url;
  }

  window.HSKRCSEO = {
    setDynamic(options){
      if(!options) return;

      const title = options.title || "HSKRC";
      const description = String(options.description || "Hassan Sabbah Knowledge & Research Centre")
        .replace(/\s+/g," ")
        .trim()
        .slice(0, 180);
      const canonical = options.canonical || window.location.href.split("#")[0];
      const lang = document.documentElement.lang || "en";

      document.title = title;
      setCanonical(canonical);

      upsertMeta('meta[name="description"]',"name","description",description);
      upsertMeta('meta[property="og:type"]',"property","og:type",options.ogType || "website");
      upsertMeta('meta[property="og:site_name"]',"property","og:site_name","HSKRC");
      upsertMeta('meta[property="og:title"]',"property","og:title",title);
      upsertMeta('meta[property="og:description"]',"property","og:description",description);
      upsertMeta('meta[property="og:url"]',"property","og:url",canonical);
      const socialImage = options.image || (SITE_URL + "/hskrc-social-preview.png");
      upsertMeta('meta[property="og:image"]',"property","og:image",socialImage);
      upsertMeta('meta[property="og:image:alt"]',"property","og:image:alt","HSKRC — Hassan Sabbah Knowledge & Research Centre");
      upsertMeta('meta[name="twitter:card"]',"name","twitter:card","summary_large_image");
      upsertMeta('meta[name="twitter:title"]',"name","twitter:title",title);
      upsertMeta('meta[name="twitter:description"]',"name","twitter:description",description);
      upsertMeta('meta[name="twitter:image"]',"name","twitter:image",socialImage);

      const pageId = canonical + "#webpage";
      const entity = options.entity ? {...options.entity} : null;
      if(entity && !entity["@id"]) entity["@id"] = canonical + "#entity";
      if(entity && !entity.url) entity.url = canonical;

      const page = {
        "@type": options.pageType || "WebPage",
        "@id": pageId,
        "url": canonical,
        "name": title,
        "description": description,
        "inLanguage": lang,
        "isPartOf": {"@id": SITE_URL + "/#website"},
        "publisher": {"@id": SITE_URL + "/#organization"}
      };
      if(entity) page.mainEntity = {"@id": entity["@id"]};

      const graph = [
        page,
        ...(entity ? [entity] : []),
        {
          "@type":"Organization",
          "@id":SITE_URL + "/#organization",
          "name":"HSKRC",
          "alternateName":"Hassan Sabbah Knowledge & Research Centre",
          "url":SITE_URL + "/",
          "founder":{"@id":SITE_URL + "/founder.html#kamal-barlas"}
        },
        {
          "@type":"Person",
          "@id":SITE_URL + "/founder.html#kamal-barlas",
          "name":"Kamal Barlas",
          "alternateName": ["کمال برلاس"],
          "jobTitle":["Founder","Chief Executive Officer"],
          "url":SITE_URL + "/founder.html",
          "worksFor":{"@id":SITE_URL + "/#organization"}
        },
        {
          "@type":"WebSite",
          "@id":SITE_URL + "/#website",
          "url":SITE_URL + "/",
          "name":"HSKRC",
          "alternateName":"Hassan Sabbah Knowledge & Research Centre",
          "publisher":{"@id":SITE_URL + "/#organization"}
        }
      ];

      let holder = document.getElementById("hskrcDynamicStructuredData");
      if(!holder){
        holder = document.createElement("script");
        holder.id = "hskrcDynamicStructuredData";
        holder.type = "application/ld+json";
        document.head.appendChild(holder);
      }
      holder.textContent = JSON.stringify({"@context":"https://schema.org","@graph":graph});
    }
  };
})();
