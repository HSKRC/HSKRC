import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SITE_URL = "https://hskrc.org";
const OUTPUT_DIR = "generated-articles";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_URL or SUPABASE_ANON_KEY is missing."
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeDescription(article) {
  const text = stripHtml(
    article.excerpt ||
    article.content ||
    ""
  );

  if (!text) {
    return "Research article published by HSKRC.";
  }

  if (text.length <= 160) {
    return text;
  }

  return text.slice(0, 157).trimEnd() + "...";
}

function makeSlug(article) {
  const titleSlug = String(article.title || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  if (titleSlug) {
    return `${titleSlug}-${article.id.slice(0, 8)}`;
  }

  return article.id;
}

function isoDate(value) {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function coverUrl(article) {
  if (!article.cover_path) {
    return null;
  }

  if (/^https?:\/\//i.test(article.cover_path)) {
    return article.cover_path;
  }

  const cleanPath = String(article.cover_path)
    .replace(/^\/+/, "");

  return (
    `${SUPABASE_URL}/storage/v1/object/public/` +
    `article-covers/${cleanPath}`
  );
}

function articleBody(content = "") {
  return String(content || "");
}

function buildHtml(article, slug) {
  const canonical =
    `${SITE_URL}/${OUTPUT_DIR}/${slug}.html`;

  const title =
    article.title || "HSKRC Research Article";

  const description =
    makeDescription(article);

  const author =
    article.author || "HSKRC";

  const category =
    article.category || "Research";

  const published =
    isoDate(
      article.published_at ||
      article.created_at
    );

  const modified =
    isoDate(
      article.updated_at ||
      article.published_at ||
      article.created_at
    );

  const image =
    coverUrl(article);

  /*
    Detect Persian/Arabic-script articles.

    If the title or description contains characters
    from the Arabic/Persian Unicode range, the
    generated page uses Persian language metadata
    and right-to-left direction.
  */
  const lang =
    /[\u0600-\u06FF]/.test(
      `${title} ${description}`
    )
      ? "fa"
      : "en";

  const dir =
    lang === "fa"
      ? "rtl"
      : "ltr";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        "url": canonical,
        "name": `${title} | HSKRC`,
        "description": description,
        "inLanguage": lang,
        "isPartOf": {
          "@id": `${SITE_URL}/#website`
        },
        "mainEntity": {
          "@id": `${canonical}#article`
        },
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        }
      },
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        "url": canonical,
        "headline": title,
        "description": description,
        "inLanguage": lang,
        "articleSection": category,
        "mainEntityOfPage": {
          "@id": `${canonical}#webpage`
        },
        "author": {
          "@type": "Organization",
          "name": author
        },
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        },
        ...(published
          ? {
              "datePublished": published
            }
          : {}),
        ...(modified
          ? {
              "dateModified": modified
            }
          : {}),
        ...(image
          ? {
              "image": [image]
            }
          : {})
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "HSKRC",
        "alternateName":
          "Hassan Sabbah Knowledge & Research Centre",
        "url": `${SITE_URL}/`,
        "founder": {
          "@id":
            `${SITE_URL}/founder.html#kamal-barlas`
        }
      },
      {
        "@type": "Person",
        "@id":
          `${SITE_URL}/founder.html#kamal-barlas`,
        "name": "Kamal Barlas",
        "alternateName": [
          "Kamaluddin Barlas",
          "کمال برلاس",
          "کمال‌الدین برلاس"
        ],
        "jobTitle": [
          "Founder",
          "Chief Executive Officer"
        ],
        "url":
          `${SITE_URL}/founder.html`,
        "worksFor": {
          "@id":
            `${SITE_URL}/#organization`
        }
      },
      {
        "@type": "WebSite",
        "@id":
          `${SITE_URL}/#website`,
        "url":
          `${SITE_URL}/`,
        "name":
          "HSKRC",
        "alternateName":
          "Hassan Sabbah Knowledge & Research Centre",
        "publisher": {
          "@id":
            `${SITE_URL}/#organization`
        }
      }
    ]
  };

  const schemaJson =
    JSON.stringify(schema)
      .replace(/</g, "\\u003c");

  const publishedText =
    published
      ? new Date(
          published
        ).toLocaleDateString(
          lang === "fa"
            ? "fa-IR"
            : "en-AU",
          {
            year: "numeric",
            month: "long",
            day: "numeric"
          }
        )
      : "";

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>${escapeHtml(title)} | HSKRC</title>

<meta
  name="description"
  content="${escapeHtml(description)}"
>

<meta
  name="robots"
  content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
>

<meta
  name="author"
  content="HSKRC"
>

<link
  rel="canonical"
  href="${escapeHtml(canonical)}"
>

<meta
  property="og:type"
  content="article"
>

<meta
  property="og:site_name"
  content="HSKRC"
>

<meta
  property="og:title"
  content="${escapeHtml(title)} | HSKRC"
>

<meta
  property="og:description"
  content="${escapeHtml(description)}"
>

<meta
  property="og:url"
  content="${escapeHtml(canonical)}"
>

${image
  ? `<meta
  property="og:image"
  content="${escapeHtml(image)}"
>`
  : ""}

${published
  ? `<meta
  property="article:published_time"
  content="${escapeHtml(published)}"
>`
  : ""}

${modified
  ? `<meta
  property="article:modified_time"
  content="${escapeHtml(modified)}"
>`
  : ""}

<meta
  property="article:section"
  content="${escapeHtml(category)}"
>

<meta
  name="twitter:card"
  content="${image
    ? "summary_large_image"
    : "summary"}"
>

<meta
  name="twitter:title"
  content="${escapeHtml(title)} | HSKRC"
>

<meta
  name="twitter:description"
  content="${escapeHtml(description)}"
>

${image
  ? `<meta
  name="twitter:image"
  content="${escapeHtml(image)}"
>`
  : ""}

<link
  rel="stylesheet"
  href="../hskrc-global.css"
>

<script type="application/ld+json">
${schemaJson}
</script>

<style>

body {
  margin: 0;
  background: #0d1117;
  color: #f1f5f9;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;
  line-height: 1.75;
}

html[dir="rtl"] body {
  font-family:
    Tahoma,
    Arial,
    sans-serif;
}

.wrap {
  max-width: 1000px;
  margin: auto;
  padding: 24px;
}

header {
  border-bottom:
    1px solid
    rgba(255,255,255,.10);
}

nav {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
}

nav a,
footer a {
  color: #f1f5f9;
  text-decoration: none;
}

nav a:hover,
footer a:hover {
  text-decoration: underline;
}

.brand {
  font-weight: 800;
  margin-right: auto;
}

html[dir="rtl"] .brand {
  margin-right: 0;
  margin-left: auto;
}

article {
  max-width: 850px;
  margin: 50px auto;
}

h1 {
  line-height: 1.18;
  font-size:
    clamp(
      32px,
      5vw,
      54px
    );
  margin-bottom: 16px;
}

.meta {
  color: #9ca3af;
  margin-bottom: 30px;
}

.cover {
  width: 100%;
  max-height: 560px;
  object-fit: cover;
  border-radius: 18px;
  margin: 12px 0 30px;
}

.content {
  font-size: 18px;
}

.content img {
  max-width: 100%;
  height: auto;
}

.content a {
  color: #c9a45c;
}

.content p {
  margin:
    0 0 1.25em;
}

.content h2,
.content h3 {
  line-height: 1.35;
  margin-top: 1.6em;
}

footer {
  border-top:
    1px solid
    rgba(255,255,255,.10);
  margin-top: 60px;
  color: #9ca3af;
}

</style>

</head>

<body>

<header>
  <div class="wrap">

    <nav>

      <a
        class="brand"
        href="../index.html"
      >
        HSKRC
      </a>

      <a href="../articles.html">
        Articles
      </a>

      <a href="../research-explorer.html">
        Research
      </a>

      <a href="../library.html">
        Library
      </a>

      <a href="../about.html">
        About
      </a>

      <a href="../founder.html">
        Founder &amp; CEO
      </a>

    </nav>

  </div>
</header>

<main class="wrap">

<article>

<h1>
${escapeHtml(title)}
</h1>

<div class="meta">

${escapeHtml(author)}

${publishedText
  ? ` · ${escapeHtml(publishedText)}`
  : ""}

${category
  ? ` · ${escapeHtml(category)}`
  : ""}

</div>

${image
  ? `<img
  class="cover"
  src="${escapeHtml(image)}"
  alt="${escapeHtml(title)}"
>`
  : ""}

<div class="content">
${articleBody(article.content)}
</div>

</article>

</main>

<footer>

  <div class="wrap">

    Founded by

    <a href="../founder.html">
      <strong>
        Kamal Barlas
      </strong>
    </a>

    (Kamaluddin Barlas)
    — Founder &amp; CEO
    · © 2026 HSKRC

  </div>

</footer>

</body>

</html>`;
}

async function fetchArticles() {

  const endpoint =
    `${SUPABASE_URL}/rest/v1/articles` +
    `?select=id,title,author,category,excerpt,content,cover_path,published,published_at,created_at,updated_at` +
    `&published=eq.true` +
    `&order=published_at.desc`;

  const response =
    await fetch(
      endpoint,
      {
        headers: {
          apikey:
            SUPABASE_ANON_KEY,

          Authorization:
            `Bearer ${SUPABASE_ANON_KEY}`,

          Accept:
            "application/json"
        }
      }
    );

  if (!response.ok) {

    const body =
      await response.text();

    throw new Error(
      `Supabase request failed: ` +
      `${response.status} ${body}`
    );
  }

  return response.json();
}

function xmlEscape(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function updateSitemap(
  generated
) {

  const sitemapPath =
    "sitemap.xml";

  let sitemap = "";

  try {

    sitemap =
      await fs.readFile(
        sitemapPath,
        "utf8"
      );

  } catch {

    sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

  }

  /*
    Remove generated article entries from
    previous runs so duplicates are not
    created.
  */
  sitemap =
    sitemap.replace(
      /\s*<url>\s*<loc>https:\/\/hskrc\.org\/generated-articles\/[\s\S]*?<\/url>/g,
      ""
    );

  const entries =
    generated
      .map(
        ({
          url,
          lastmod
        }) => `
  <url>
    <loc>${xmlEscape(url)}</loc>
    ${lastmod
      ? `<lastmod>${xmlEscape(
          lastmod.slice(0, 10)
        )}</lastmod>`
      : ""}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join("");

  sitemap =
    sitemap.replace(
      "</urlset>",
      `${entries}\n</urlset>`
    );

  await fs.writeFile(
    sitemapPath,
    sitemap,
    "utf8"
  );
}

async function main() {

  console.log(
    "Fetching published HSKRC articles..."
  );

  const articles =
    await fetchArticles();

  console.log(
    `Found ${articles.length} published article(s).`
  );

  await fs.rm(
    OUTPUT_DIR,
    {
      recursive: true,
      force: true
    }
  );

  await fs.mkdir(
    OUTPUT_DIR,
    {
      recursive: true
    }
  );

  const generated = [];

  for (
    const article of articles
  ) {

    const slug =
      makeSlug(article);

    const filename =
      `${slug}.html`;

    const outputPath =
      path.join(
        OUTPUT_DIR,
        filename
      );

    const html =
      buildHtml(
        article,
        slug
      );

    await fs.writeFile(
      outputPath,
      html,
      "utf8"
    );

    const url =
      `${SITE_URL}/${OUTPUT_DIR}/${filename}`;

    generated.push({
      url,

      lastmod:
        isoDate(
          article.updated_at ||
          article.published_at ||
          article.created_at
        )
    });

    console.log(
      `Generated: ${url}`
    );
  }

  await updateSitemap(
    generated
  );

  console.log(
    "sitemap.xml updated."
  );

  console.log(
    "SEO article generation completed."
  );
}

main().catch(
  error => {

    console.error(error);

    process.exit(1);

  }
);
