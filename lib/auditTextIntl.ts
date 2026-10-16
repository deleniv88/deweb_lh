/* =========================================================
   Website check: EN and PL texts (same format as `ua` in auditText.ts).
   ========================================================= */
import type { AuditTexts } from "./auditText";

/* ------------------------------ EN ------------------------------ */

const kbEn = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1)} MB` : `${n} KB`);
const listEn = (a: unknown) => (Array.isArray(a) ? a.join(", ") : "");

export const en: AuditTexts = (() => {
  const kb = kbEn;
  const list = listEn;
  const t: AuditTexts = {
    meta: {
      title: "Free website check — deweb studio",
      description: "Enter your website address and get a report in a minute: security, speed, Google, link previews and tips for your exact platform.",
    },
    hero: {
      eyebrow: "Free website check",
      titleAccent: "Where is your website",
      titleRest: "losing clients?",
      lead: "Enter your website address. In a minute we’ll check 30+ points: security, speed, Google visibility and link previews in messengers. The tips depend on what your site is built with: WordPress, Wix, Tilda, Shopify or custom code.",
    },
    form: {
      prefix: "https://",
      placeholder: "your-site.com",
      go: "Check my website",
      going: "Checking…",
      perks: ["No sign-up", "PDF report", "Tips for your platform"],
      example: "See what a perfect website’s report looks like",
    },
    err: {
      url: "Enter a website address, e.g. your-site.com",
      rate: "Too many checks from your address. Try again in 10 minutes.",
      busy: "There have been a lot of checks today. Try again tomorrow or message me.",
      captcha: "We couldn’t confirm you’re human. Refresh the page and try again.",
      dns: "This domain doesn’t exist. Check that the address is correct.",
      unreachable: "The website isn’t responding. It may be down right now.",
      status: "The website responded with an error, so we couldn’t check it.",
      net: "Couldn’t connect to the website.",
      generic: "Something went wrong. Try again in a minute.",
      notFound: "No report found at this link. Check the website again.",
    },
    steps: ["Finding the server and SSL", "Detecting the platform and hosting", "Reading robots.txt and sitemap", "Checking titles and previews", "Looking for broken links", "Checking security", "Analytics, form, GDPR"],
    progress: (h) => `Checking ${h}…`,
    of100: "out of 100",
    scoreAria: (n) => `Score ${n} out of 100`,
    verdict: (n) =>
      n >= 80 ? "Your website is in good shape. Just a few small things left."
        : n >= 55 ? "The basics are there, but the site is underperforming: you’re losing some clients and Google rankings."
          : "Your website is holding your business back. Start with the “important” items, they make the biggest difference.",
    chips: { bad: "issues", warn: "to improve", ok: "fine" },
    custom: "Custom code",
    platNote: (id, name) =>
      id === "wp" ? "Built with WordPress: besides the general points, we check the version, exposed admin logins, xmlrpc and system files. Tips use WordPress plugins and settings."
        : id === "cms" ? `Built with ${name}: we check everything, including the server. The tips are general, look for the settings in the ${name} admin panel or your hosting.`
          : id === "custom" ? "Built with custom code: we check everything, including the server. The tips are for your developer: what to change in the code or server config."
            : `Built with ${name}: the server, SSL, caching and security headers are handled by ${name} itself, so those points don’t count toward the score. The tips show where to change things in the ${name} dashboard.`,
    groupOk: (ok, all) => `${ok} of ${all} fine`,
    crit: "important",
    fixLabel: "How to fix:",
    status: { ok: "Good", warn: "Could be better", bad: "Problem", na: "Not counted", wait: "Checking" },
    na: (name) => `${name} handles this, you don’t need to do anything.`,
    naPsi: "Google PageSpeed didn’t respond right now. Check manually at pagespeed.web.dev.",
    wait: "Measuring with Google PageSpeed, this takes up to a minute…",
    speedNote: "The score will update once Google PageSpeed finishes measuring speed.",
    locked: "Details and how to fix it on your platform",
    gate: {
      title: "Full report and PDF",
      text: (n, plat) => `${n} more ${n === 1 ? "check" : "checks"} with tips on how to fix things on ${plat}. Leave your contact and the report opens right away.`,
      ways: { email: "Email", ig: "Instagram", tg: "Telegram" },
      phEmail: "you@email.com",
      phNick: "@username",
      send: "Open the full report",
      consent: "I may reach out with a tip about your website. No spam.",
      err: "Enter your email or username to open the report.",
    },
    actions: { pdf: "Download PDF", link: "Copy report link", copied: "Link copied", again: "Check another website" },
    example: { flag: "Example: this is the report of a website that passes every check.", back: "Check your website", host: "your-company.com" },
    manual: {
      title: "What to check yourself",
      note: "can’t be seen from here",
      items: [
        ["Enquiries arrive", "Send a test enquiry from your phone: did it land in your email or Telegram, not in spam?"],
        ["Analytics sees visits", "Google Analytics → Realtime: you can see your own visit."],
        ["Site is in Search Console", "search.google.com/search-console: the site and sitemap are added, no errors."],
        ["Easy to use on a phone", "Go through the site on iPhone and Android from start to enquiry."],
        ["Access is in your name", "Domain, hosting, admin panel and analytics are registered to your account."],
        ["Backups exist", "A backup at least once a week, and you know how to restore it."],
      ],
    },
    cta: {
      title: "Want someone to fix this for you?",
      text: "Message me. I’ll look at the report and tell you what will make the biggest difference, or build you a new website that passes every check.",
      btn: "Message me",
    },
    printed: (d) => `deweb.studio report · ${d}`,
    groups: {
      domain: "Domain and HTTPS", google: "Google visibility", preview: "Titles and previews", content: "Content",
      speed: "Speed", security: "Security", legal: "Legal", track: "Analytics and form",
    },
    checks: {
      https: {
        t: "Site runs on HTTPS",
        ok: (p) => (p.until ? `Padlock in the browser, certificate valid until ${p.until}.` : "Padlock in the browser, certificate is valid."),
        warn: (p) => `The certificate expires on ${p.until}. If it isn’t renewed, browsers will show “Not secure”.`,
        bad: () => "The site doesn’t open over https or the certificate is invalid: the browser shows “Not secure”.",
        fix: { def: "Turn on free SSL (Let’s Encrypt) in your hosting panel with auto-renewal.", hosted: "Check in the site builder’s dashboard that the domain is connected and SSL is on." },
      },
      redir: {
        t: "http:// redirects to https://",
        ok: (p) => (p.code ? `${p.code} redirect to https.` : "The site only works over https."),
        warn: (p) => `There is a redirect, but it’s temporary (${p.code}). Google understands a permanent 301 better.`,
        bad: () => "The http:// address opens the site without redirecting, so Google sees two copies.",
        fix: { def: "Add a 301 redirect from http to https in .htaccess or your hosting panel.", wp: "The Really Simple SSL plugin, or 3 lines in .htaccess." },
      },
      www: {
        t: "One version of the domain",
        ok: (p) => (p.nodns ? `${p.alt} isn’t set up, so there’s no duplicate.` : `${p.alt} leads to the main address.`),
        warn: (p) => (p.code >= 300 && p.code < 400 ? `${p.alt} leads to the main address with a temporary ${p.code} redirect.` : `${p.alt} opens a separate copy of the site, so Google sees two websites.`),
        fix: { def: "Set up a 301 from the other version (www or non-www) to the main address.", wp: "Settings → General: Site Address, plus a 301 in .htaccess.", wix: "Wix: Settings → Domains → primary domain.", tilda: "Tilda: Site Settings → Domain → redirect from www." },
      },
      "404": {
        t: "404 page",
        ok: () => "A non-existent address returns a 404 code.",
        warn: (p) => `A non-existent address returns code ${p.code}, and Google treats such pages as duplicates.`,
        fix: { def: "Make a separate 404 page that returns a 404 code and has a button to the homepage.", wp: "Your theme needs a 404.php template; plugins that redirect 404s to the homepage are better switched off." },
      },
      robots: {
        t: "robots.txt doesn’t hide the site",
        ok: (p) => `The site is open to Google${p.sitemap ? ", robots.txt links to the sitemap" : ""}.`,
        warn: () => "There’s no robots.txt. The site is visible, but Google doesn’t know what to skip or where the sitemap is.",
        bad: () => "robots.txt says “Disallow: /”, so Google can’t see a single page.",
        fix: { def: "Remove “Disallow: /” and keep only system folders blocked. Add a Sitemap line.", wp: "Settings → Reading → untick “Discourage search engines from indexing this site”." },
      },
      sitemap: {
        t: "sitemap.xml",
        ok: (p) => (p.index ? "Sitemap index found." : `Sitemap found: ${p.n} URLs.`),
        warn: () => "No sitemap.xml found: Google takes longer to discover new pages.",
        fix: { def: "Generate a sitemap.xml and submit it in Google Search Console.", wp: "Yoast SEO or Rank Math creates the sitemap automatically.", wix: "Wix creates the sitemap itself: check that the site is published and connected to Search Console.", tilda: "Tilda: Site Settings → SEO → turn on the sitemap." },
      },
      noindex: {
        t: "Homepage can be indexed",
        ok: () => "No noindex on the homepage.",
        bad: () => "The homepage has noindex, so it doesn’t show up in Google.",
        fix: { def: "Remove the noindex tag from public pages.", wp: "Settings → Reading, plus “Allow search engines to show this page in search results” in Yoast/Rank Math.", wix: "Wix: page SEO settings → “Let search engines index this page”.", tilda: "Tilda: Page Settings → SEO → remove the indexing ban." },
      },
      canon: {
        t: "Canonical on the page",
        ok: () => "The page’s main address is specified.",
        warn: (p) => (p.other ? `Canonical points to another domain (${p.url}), and Google may show it instead of this site.` : "No canonical: Google decides on its own which copy of the page to show."),
        fix: { def: "Add <link rel=\"canonical\"> with the main address to every page.", wp: "Yoast SEO or Rank Math adds canonical automatically." },
      },
      title: {
        t: "Page title",
        ok: (p) => `“${p.text}”, ${p.len} characters.`,
        warn: (p) => (p.len < 15 ? `The title “${p.text}” is ${p.len} characters and tells neither people nor Google anything.` : `The title is long (${p.len} characters), Google will cut it off in search.`),
        bad: () => "The page has no title.",
        fix: { def: "Up to 60 characters: what you do and where. For example, “Beauty salon in Kraków — Anna”.", wp: "Yoast SEO / Rank Math → “SEO title” field on the page.", wix: "Wix: page → SEO Basics → title tag.", tilda: "Tilda: Page Settings → Main → title." },
      },
      desc: {
        t: "Google description (meta description)",
        ok: (p) => `${p.len} characters.`,
        warn: (p) => (p.len < 50 ? `The description is short (${p.len} characters).` : `The description is long (${p.len} characters), Google will cut it off.`),
        bad: () => "There’s no description, so Google grabs a random bit of text.",
        fix: { def: "Write 120–155 characters on why people should click on you.", wp: "Yoast SEO / Rank Math → “Meta description”.", wix: "Wix: page → SEO Basics → meta description.", tilda: "Tilda: Page Settings → Main → description." },
      },
      og: {
        t: "Link preview in messengers",
        ok: (p) => `There’s an image${p.w ? ` ${p.w}×${p.h}` : ""}${p.kb ? `, ${kb(p.kb)}` : ""}.`,
        warn: (p) => (!p.ok ? "A preview image is set, but it doesn’t load." : p.kb > 600 ? `The preview image is heavy (${kb(p.kb)}), messengers may not show it.` : `The preview image is too small (${p.w}×${p.h}).`),
        bad: () => "No preview image: in Telegram and WhatsApp the link looks empty.",
        fix: { def: "Add an og:image 1200×630, JPG under 300 KB.", wp: "Yoast SEO / Rank Math → “Social” tab on the page.", wix: "Wix: SEO → Social Share → share image.", tilda: "Tilda: Page Settings → Facebook / social → cover image.", shopify: "Shopify: Online Store → Preferences → social sharing image." },
      },
      fav: {
        t: "Site icon",
        ok: () => "There’s a favicon and an iPhone icon.",
        warn: () => "There’s a favicon, but no iPhone icon (apple-touch-icon).",
        bad: () => "No icon, the browser tab shows a grey globe.",
        fix: { def: "Add a 512×512 PNG favicon and a 180×180 apple-touch-icon.", wp: "Appearance → Customize → Site Identity → Site Icon.", wix: "Wix: Settings → Favicon.", tilda: "Tilda: Site Settings → Favicon." },
      },
      viewport: {
        t: "Mobile-friendly",
        ok: () => "There’s a meta viewport, the site scales to the screen.",
        bad: () => "No meta viewport: on a phone the site shows as a shrunken copy of the desktop version.",
        fix: { def: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." },
      },
      lang: {
        t: "Page language",
        ok: (p) => `Language set: ${p.lang}.`,
        warn: () => "The page language isn’t set (lang attribute).",
        fix: { def: "Add the language to the <html lang=\"en\"> tag.", wp: "Settings → General → Site Language." },
      },
      h1: {
        t: "One H1 heading",
        ok: (p) => `One H1: “${p.text}”.`,
        warn: (p) => `Found ${p.n} H1 headings, which makes it harder for Google to understand what the page is about.`,
        bad: () => "There’s no H1 heading.",
        fix: { def: "Keep one H1 per page with the main message, make the rest H2.", wp: "Change the heading levels in the editor; the logo in your theme shouldn’t be an H1." },
      },
      alt: {
        t: "Image descriptions (alt)",
        ok: (p) => (p.n ? `All ${p.n} images have a description.` : "There are no images on the homepage."),
        warn: (p) => `${p.miss} of ${p.n} images have no alt text.`,
        bad: (p) => `${p.miss} of ${p.n} images have no alt text.`,
        fix: { def: "Add a short description to every image.", wp: "Media Library → image → “Alternative Text”.", wix: "Wix: click the image → Settings → “What’s in the image?”.", tilda: "Tilda: block Content → “Alt” field next to the image." },
      },
      schema: {
        t: "Schema.org markup",
        ok: (p) => `Markup found: ${p.types}.`,
        warn: (p) => (p.bad ? "There’s markup, but the code has an error." : "No markup, so no chance of star ratings and opening hours in search."),
        fix: { def: "Add LocalBusiness or Organization JSON-LD with your address and contacts.", wp: "Rank Math or Yoast: Schema → Local Business.", wix: "Wix: SEO → Structured Data.", tilda: "Tilda: a T123 (HTML) block with the JSON-LD code." },
      },
      links: {
        t: "Broken links",
        ok: (p) => `Checked ${p.n} internal links, all working.`,
        warn: (p) => `${p.broken} of ${p.n} links lead nowhere: ${list(p.list)}.`,
        bad: (p) => `${p.broken} of ${p.n} links lead nowhere: ${list(p.list)}.`,
        fix: { def: "Fix the addresses or remove these links from the menu and text.", wp: "Redirection plugin: 301 from old addresses to new ones." },
      },
      text: {
        t: "Enough text",
        ok: (p) => `About ${p.words} words on the homepage.`,
        warn: (p) => `Only about ${p.words} words on the homepage: Google can’t understand much about the site.`,
        fix: { def: "Describe your services, city, advantages and answer common questions — at least 300 words." },
      },
      psi_m: {
        t: "Speed on mobile",
        ok: (p) => `PageSpeed ${p.score} out of 100, the main content appears in ${p.lcp} s.`,
        warn: (p) => `PageSpeed ${p.score} out of 100, the main content appears in ${p.lcp} s.`,
        bad: (p) => `PageSpeed ${p.score} out of 100, the main content only appears after ${p.lcp} s. Some people leave before that.`,
        fix: { def: "The essentials: compress images, enable caching and remove unnecessary scripts from the first screen.", wp: "A caching plugin (LiteSpeed Cache or WP Rocket) and WebP image conversion; switch off plugins you don’t need.", wix: "Wix: fewer animations and videos on the first screen, fewer third-party apps.", tilda: "Tilda: Site Settings → More → “Lazy load”; fewer Zero Blocks on the first screen.", shopify: "Shopify: a lighter theme and fewer apps in your store." },
      },
      psi_d: {
        t: "Speed on desktop",
        ok: (p) => `PageSpeed ${p.score} out of 100.`,
        warn: (p) => `PageSpeed ${p.score} out of 100.`,
        bad: (p) => `PageSpeed ${p.score} out of 100: the site loads slowly even on a computer.`,
        fix: { def: "Same steps as for mobile." },
      },
      img: {
        t: "Image size",
        ok: (p) => (p.n ? `The heaviest image is ${kb(p.kb)}.` : "There are no images on the homepage."),
        warn: (p) => `The heaviest image is ${kb(p.kb)}${p.name ? ` (${p.name})` : ""}.`,
        bad: (p) => `The heaviest image is ${kb(p.kb)}${p.name ? ` (${p.name})` : ""}, it slows the site down a lot.`,
        fix: { def: "Compress images to 200–300 KB and convert them to WebP.", wp: "Imagify, ShortPixel or Converter for Media plugin.", wix: "Wix compresses images itself, but upload photos no larger than 2500 px.", tilda: "Tilda compresses images itself, but upload photos no larger than 2000 px." },
      },
      gzip: {
        t: "Compression and caching",
        ok: (p) => `${p.enc} compression is on${p.cache === 1 ? ", files are cached" : ""}.`,
        warn: (p) => (!p.enc ? "The server doesn’t compress pages." : "Style and script files aren’t cached in the browser."),
        bad: () => "The server doesn’t compress pages, and files aren’t cached.",
        fix: { def: "Turn on gzip/brotli and caching in .htaccess or your hosting panel.", wp: "A caching plugin turns this on for you." },
      },
      files: {
        t: "System files are protected",
        ok: () => ".env, .git, backups and configs can’t be opened from a browser.",
        bad: (p) => `These open in a browser: ${list(p.list)}. They may contain passwords.`,
        fix: { def: "Delete these files from the server right away and change any passwords they contained.", wp: "Delete the files via FTP and change the database password in your hosting panel and wp-config.php." },
      },
      cms: {
        t: "WordPress version",
        ok: (p) => (p.ver ? `WordPress ${p.ver}, up to date.` : "The WordPress version isn’t visible from outside."),
        warn: (p) => `WordPress version ${p.ver} is visible in the page code.`,
        bad: (p) => `WordPress ${p.ver} is outdated${p.latest ? ` (latest is ${p.latest})` : ""}: old versions have known vulnerabilities.`,
        fix: { def: "Update WordPress, themes and plugins, and hide the version (Wordfence plugin)." },
      },
      users: {
        t: "Admin logins aren’t visible",
        ok: () => "The user list is closed.",
        warn: (p) => `Logins are visible at /wp-json/wp/v2/users: ${list(p.names)}.`,
        fix: { def: "Close the user list with a security plugin (Wordfence) and don’t use “admin” as a login." },
      },
      xmlrpc: {
        t: "xmlrpc.php is disabled",
        ok: () => "xmlrpc is closed.",
        warn: () => "xmlrpc.php is open, and it’s the most common way to brute-force passwords.",
        fix: { def: "Disable xmlrpc in Wordfence or via .htaccess." },
      },
      list: {
        t: "No directory listing",
        ok: () => "Folders don’t show their contents.",
        warn: (p) => `The ${list(p.list)} folder shows a list of all its files.`,
        fix: { def: "Add “Options -Indexes” to .htaccess." },
      },
      heads: {
        t: "Security headers",
        ok: (p) => `${p.n} of 6 security headers.`,
        warn: (p) => `${p.n} of 6 security headers${p.miss?.length ? `, missing: ${list(p.miss)}` : ""}.${p.leak ? ` The server reveals its software version: ${p.leak}.` : ""}`,
        bad: (p) => `${p.n} of 6 security headers.${p.leak ? ` The server reveals its software version: ${p.leak}.` : ""}`,
        fix: { def: "Add HSTS, X-Content-Type-Options, Referrer-Policy and X-Frame-Options in .htaccess or the server config, and hide the server version.", wp: "Headers Security Advanced & HSTS WP plugin or rules in .htaccess." },
      },
      mixed: {
        t: "No mixed content",
        ok: () => "All files load over https.",
        warn: (p) => `${p.n} files load over http://, and the browser may block them.`,
        fix: { def: "Replace http:// with https:// in links to images and scripts.", wp: "Better Search Replace plugin: replace http://your-domain with https://your-domain." },
      },
      priv: {
        t: "Privacy policy",
        ok: () => "There’s a link to the privacy policy.",
        bad: () => "No privacy policy link found. In the EU it’s required if you have a form or analytics.",
        fix: { def: "Add a privacy policy page and link to it in the footer and under the form.", wp: "Settings → Privacy → create the page." },
      },
      cookie: {
        t: "Cookie consent banner",
        ok: (p) => (p.cmp ? "There’s a cookie consent banner." : "No trackers that require consent were found."),
        warn: () => "There are trackers, but no consent banner. In the EU that’s a GDPR violation.",
        fix: { def: "Add a consent banner (Cookiebot, CookieYes) with Google Consent Mode.", wp: "Complianz or CookieYes plugin.", wix: "Wix: Settings → Privacy & Cookies → Cookie Banner.", tilda: "Tilda: Site Settings → More → Cookie banner." },
      },
      ga: {
        t: "Analytics",
        ok: (p) => `Found: ${list(p.list)}.`,
        warn: () => "No analytics found: you don’t know where your clients come from.",
        fix: { def: "Connect Google Analytics 4 and Microsoft Clarity (both free).", wp: "Site Kit by Google plugin.", wix: "Wix: Marketing & SEO → Marketing Integrations → Google Analytics.", tilda: "Tilda: Site Settings → Analytics." },
      },
      captcha: {
        t: "Form spam protection",
        ok: (p) => (p.cap ? `Protected: ${p.cap}.` : "The form is protected by the platform."),
        warn: () => "The form has no captcha or other protection, so bots can flood you with fake enquiries.",
        fix: { def: "Add Cloudflare Turnstile or reCAPTCHA.", wp: "Contact Form 7 / WPForms have built-in Turnstile support." },
      },
    },
  };
  return t;
})();

/* ------------------------------ PL ------------------------------ */

const kbPl = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1).replace(".", ",")} MB` : `${n} KB`);
const listPl = (a: unknown) => (Array.isArray(a) ? a.join(", ") : "");
/* odmiana: 1 sprawdzenie, 2–4 sprawdzenia, 5+ sprawdzeń */
const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n), d = a % 10, h = a % 100;
  return a === 1 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
};

export const pl: AuditTexts = (() => {
  const kb = kbPl;
  const list = listPl;
  const t: AuditTexts = {
    meta: {
      title: "Darmowy audyt strony — deweb studio",
      description: "Wpisz adres strony i w minutę dostaniesz raport: bezpieczeństwo, szybkość, Google, podgląd linku i wskazówki dla Twojej platformy.",
    },
    hero: {
      eyebrow: "Darmowy audyt strony",
      titleAccent: "Gdzie Twoja strona",
      titleRest: "traci klientów?",
      lead: "Wpisz adres strony. W minutę sprawdzimy ponad 30 punktów: bezpieczeństwo, szybkość, widoczność w Google i podgląd linku w komunikatorach. Wskazówki zależą od tego, na czym zbudowana jest strona: WordPress, Wix, Tilda, Shopify czy własny kod.",
    },
    form: {
      prefix: "https://",
      placeholder: "twoja-strona.pl",
      go: "Sprawdź stronę",
      going: "Sprawdzamy…",
      perks: ["Bez rejestracji", "Raport w PDF", "Wskazówki dla Twojej platformy"],
      example: "Zobacz, jak wygląda raport idealnej strony",
    },
    err: {
      url: "Wpisz adres strony, np. salon-anna.pl",
      rate: "Za dużo sprawdzeń z Twojego adresu. Spróbuj za 10 minut.",
      busy: "Dziś było już bardzo dużo sprawdzeń. Spróbuj jutro albo napisz do mnie.",
      captcha: "Nie udało się potwierdzić, że jesteś człowiekiem. Odśwież stronę i spróbuj ponownie.",
      dns: "Taka domena nie istnieje. Sprawdź, czy adres jest wpisany poprawnie.",
      unreachable: "Strona nie odpowiada. Możliwe, że teraz nie działa.",
      status: "Strona odpowiedziała błędem, więc nie udało się jej sprawdzić.",
      net: "Nie udało się połączyć ze stroną.",
      generic: "Coś poszło nie tak. Spróbuj ponownie za minutę.",
      notFound: "Nie znaleziono raportu pod tym linkiem. Sprawdź stronę jeszcze raz.",
    },
    steps: ["Szukamy serwera i SSL", "Rozpoznajemy platformę i hosting", "Czytamy robots.txt i sitemap", "Sprawdzamy tytuły i podglądy", "Szukamy niedziałających linków", "Sprawdzamy bezpieczeństwo", "Analityka, formularz, RODO"],
    progress: (h) => `Sprawdzamy ${h}…`,
    of100: "na 100",
    scoreAria: (n) => `Wynik ${n} na 100`,
    verdict: (n) =>
      n >= 80 ? "Strona jest w dobrym stanie. Zostało kilka drobiazgów."
        : n >= 55 ? "Podstawy są, ale strona nie wykorzystuje swojego potencjału: tracisz część klientów i pozycji w Google."
          : "Strona przeszkadza Twojemu biznesowi. Zacznij od punktów „ważne”, dają największy efekt.",
    chips: { bad: "problemów", warn: "do poprawy", ok: "w porządku" },
    custom: "Własny kod",
    platNote: (id, name) =>
      id === "wp" ? "Strona na WordPressie: oprócz ogólnych punktów sprawdzamy wersję, widoczne loginy administratorów, xmlrpc i pliki systemowe. Wskazówki dotyczą wtyczek i ustawień WordPressa."
        : id === "cms" ? `Strona na platformie ${name}: sprawdzamy wszystko, łącznie z serwerem. Wskazówki są ogólne, ustawień szukaj w panelu ${name} albo u hostingodawcy.`
          : id === "custom" ? "Strona na własnym kodzie: sprawdzamy wszystko, łącznie z serwerem. Wskazówki są dla programisty: co zmienić w kodzie lub konfiguracji serwera."
            : `Strona na platformie ${name}: serwerem, SSL, cache i nagłówkami bezpieczeństwa zarządza sam ${name}, więc te punkty nie liczą się do wyniku. Wskazówki pokazują, gdzie to zmienić w panelu ${name}.`,
    groupOk: (ok, all) => `${ok} z ${all} w porządku`,
    crit: "ważne",
    fixLabel: "Jak naprawić:",
    status: { ok: "Dobrze", warn: "Warto poprawić", bad: "Problem", na: "Nie liczy się", wait: "Sprawdzamy" },
    na: (name) => `To ustawia ${name}, nie musisz nic robić.`,
    naPsi: "Google PageSpeed teraz nie odpowiedział. Sprawdź ręcznie na pagespeed.web.dev.",
    wait: "Mierzymy przez Google PageSpeed, to potrwa do minuty…",
    speedNote: "Wynik zaktualizuje się, gdy Google PageSpeed skończy mierzyć szybkość.",
    locked: "Szczegóły i wskazówka, jak to naprawić na Twojej platformie",
    gate: {
      title: "Pełny raport i PDF",
      text: (n, plat) => `Jeszcze ${n} ${plural(n, "sprawdzenie", "sprawdzenia", "sprawdzeń")} ze wskazówkami, jak to naprawić na platformie ${plat}. Zostaw kontakt, a raport otworzy się od razu.`,
      ways: { email: "Email", ig: "Instagram", tg: "Telegram" },
      phEmail: "ty@poczta.pl",
      phNick: "@nick",
      send: "Otwórz pełny raport",
      consent: "Mogę napisać ze wskazówką dotyczącą Twojej strony. Bez spamu.",
      err: "Wpisz email albo nick, żeby otworzyć raport.",
    },
    actions: { pdf: "Pobierz PDF", link: "Skopiuj link do raportu", copied: "Link skopiowany", again: "Sprawdź inną stronę" },
    example: { flag: "Przykład: tak wygląda raport strony, która przechodzi wszystkie testy.", back: "Sprawdź swoją stronę", host: "twoja-firma.pl" },
    manual: {
      title: "Co sprawdzić samemu",
      note: "stąd tego nie widać",
      items: [
        ["Zgłoszenia docierają", "Wyślij testowe zgłoszenie z telefonu: trafiło na maila lub Telegram, a nie do spamu?"],
        ["Analityka widzi wizyty", "Google Analytics → Czas rzeczywisty: widać Twoją wizytę."],
        ["Strona w Search Console", "search.google.com/search-console: strona i sitemap są dodane, bez błędów."],
        ["Wygodnie na telefonie", "Przejdź stronę na iPhonie i Androidzie od wejścia do wysłania zgłoszenia."],
        ["Dostępy są Twoje", "Domena, hosting, panel i analityka są zarejestrowane na Twoje konto."],
        ["Są kopie zapasowe", "Backup przynajmniej raz w tygodniu, i wiesz, jak go przywrócić."],
      ],
    },
    cta: {
      title: "Chcesz, żeby ktoś to naprawił za Ciebie?",
      text: "Napisz do mnie. Przejrzę raport i powiem, co da największy efekt, albo zrobię nową stronę, która przejdzie wszystkie testy.",
      btn: "Napisz do mnie",
    },
    printed: (d) => `Raport deweb.studio · ${d}`,
    groups: {
      domain: "Domena i HTTPS", google: "Widoczność w Google", preview: "Tytuły i podglądy", content: "Treść",
      speed: "Szybkość", security: "Bezpieczeństwo", legal: "Kwestie prawne", track: "Analityka i formularz",
    },
    checks: {
      https: {
        t: "Strona działa przez HTTPS",
        ok: (p) => (p.until ? `Kłódka w przeglądarce, certyfikat ważny do ${p.until}.` : "Kłódka w przeglądarce, certyfikat jest ważny."),
        warn: (p) => `Certyfikat wygasa ${p.until}. Jeśli się nie odnowi, przeglądarka pokaże „Niezabezpieczona”.`,
        bad: () => "Strona nie otwiera się przez https albo certyfikat jest nieważny: przeglądarka pokazuje „Niezabezpieczona”.",
        fix: { def: "Włącz darmowy SSL (Let’s Encrypt) w panelu hostingu z automatycznym odnawianiem.", hosted: "Sprawdź w panelu kreatora, czy domena jest podłączona i SSL włączony." },
      },
      redir: {
        t: "http:// przekierowuje na https://",
        ok: (p) => (p.code ? `Przekierowanie ${p.code} na https.` : "Strona działa tylko przez https."),
        warn: (p) => `Przekierowanie jest, ale tymczasowe (${p.code}). Google lepiej rozumie stałe 301.`,
        bad: () => "Adres z http:// otwiera stronę bez przekierowania, więc Google widzi dwie kopie.",
        fix: { def: "Dodaj przekierowanie 301 z http na https w .htaccess albo w panelu hostingu.", wp: "Wtyczka Really Simple SSL albo 3 linijki w .htaccess." },
      },
      www: {
        t: "Jedna wersja domeny",
        ok: (p) => (p.nodns ? `Adres ${p.alt} nie jest skonfigurowany, więc nie ma duplikatu.` : `${p.alt} prowadzi na główny adres.`),
        warn: (p) => (p.code >= 300 && p.code < 400 ? `${p.alt} prowadzi na główny adres tymczasowym przekierowaniem ${p.code}.` : `${p.alt} otwiera osobną kopię strony, więc Google widzi dwie strony.`),
        fix: { def: "Ustaw 301 z drugiej wersji (z www lub bez www) na główny adres.", wp: "Ustawienia → Ogólne: Adres witryny, plus 301 w .htaccess.", wix: "Wix: Ustawienia → Domeny → domena główna.", tilda: "Tilda: ustawienia strony → Domena → przekierowanie z www." },
      },
      "404": {
        t: "Strona 404",
        ok: () => "Nieistniejący adres zwraca kod 404.",
        warn: (p) => `Nieistniejący adres odpowiada kodem ${p.code}, a Google traktuje takie strony jak duplikaty.`,
        fix: { def: "Zrób osobną stronę 404 z kodem 404 i przyciskiem na stronę główną.", wp: "Motyw powinien mieć szablon 404.php; wtyczki, które przekierowują 404 na stronę główną, lepiej wyłączyć." },
      },
      robots: {
        t: "robots.txt nie ukrywa strony",
        ok: (p) => `Strona jest otwarta dla Google${p.sitemap ? ", w robots.txt jest link do sitemap" : ""}.`,
        warn: () => "Brak pliku robots.txt. Strona jest widoczna, ale Google nie wie, co pominąć i gdzie jest mapa strony.",
        bad: () => "W robots.txt jest „Disallow: /”, więc Google nie widzi ani jednej podstrony.",
        fix: { def: "Usuń „Disallow: /” i zablokuj tylko foldery systemowe. Dodaj linijkę Sitemap.", wp: "Ustawienia → Czytanie → odznacz „Proś wyszukiwarki o nieindeksowanie tej witryny”." },
      },
      sitemap: {
        t: "Mapa strony sitemap.xml",
        ok: (p) => (p.index ? "Znaleziono indeks map strony." : `Znaleziono mapę strony: ${p.n} adresów.`),
        warn: () => "Nie znaleziono sitemap.xml: Google dłużej odkrywa nowe podstrony.",
        fix: { def: "Wygeneruj sitemap.xml i prześlij go w Google Search Console.", wp: "Wtyczka Yoast SEO albo Rank Math utworzy mapę automatycznie.", wix: "Wix tworzy mapę sam: sprawdź, czy strona jest opublikowana i podłączona do Search Console.", tilda: "Tilda: ustawienia strony → SEO → włącz sitemap." },
      },
      noindex: {
        t: "Strona główna może być indeksowana",
        ok: () => "Na stronie głównej nie ma blokady noindex.",
        bad: () => "Strona główna ma noindex, więc nie pojawia się w Google.",
        fix: { def: "Usuń znacznik noindex z publicznych podstron.", wp: "Ustawienia → Czytanie, a także opcja „Pokazywać w wynikach wyszukiwania” w Yoast/Rank Math.", wix: "Wix: ustawienia SEO podstrony → „Pozwól wyszukiwarkom indeksować tę stronę”.", tilda: "Tilda: ustawienia podstrony → SEO → zdejmij blokadę indeksowania." },
      },
      canon: {
        t: "Canonical na stronie",
        ok: () => "Podany jest główny adres podstrony.",
        warn: (p) => (p.other ? `Canonical prowadzi na inną domenę (${p.url}), a Google może pokazywać ją zamiast tej strony.` : "Brak canonical: Google sam wybiera, którą kopię podstrony pokazać."),
        fix: { def: "Dodaj <link rel=\"canonical\"> z głównym adresem na każdej podstronie.", wp: "Yoast SEO albo Rank Math dodają canonical same." },
      },
      title: {
        t: "Tytuł strony (title)",
        ok: (p) => `„${p.text}”, ${p.len} znaków.`,
        warn: (p) => (p.len < 15 ? `Tytuł „${p.text}” ma ${p.len} znaków i nic nie mówi ani ludziom, ani Google.` : `Tytuł jest długi (${p.len} znaków), Google utnie go w wynikach.`),
        bad: () => "Strona nie ma tytułu.",
        fix: { def: "Do 60 znaków: czym się zajmujesz i gdzie. Na przykład „Salon kosmetyczny w Krakowie — Anna”.", wp: "Yoast SEO / Rank Math → pole „Tytuł SEO” na stronie.", wix: "Wix: podstrona → Podstawy SEO → tytuł.", tilda: "Tilda: ustawienia podstrony → Główne → tytuł." },
      },
      desc: {
        t: "Opis dla Google (description)",
        ok: (p) => `${p.len} znaków.`,
        warn: (p) => (p.len < 50 ? `Opis jest krótki (${p.len} znaków).` : `Opis jest długi (${p.len} znaków), Google go utnie.`),
        bad: () => "Brak opisu, więc Google bierze przypadkowy fragment tekstu.",
        fix: { def: "Napisz 120–155 znaków o tym, dlaczego warto kliknąć właśnie w Ciebie.", wp: "Yoast SEO / Rank Math → „Opis meta”.", wix: "Wix: podstrona → Podstawy SEO → opis.", tilda: "Tilda: ustawienia podstrony → Główne → opis." },
      },
      og: {
        t: "Podgląd linku w komunikatorach",
        ok: (p) => `Jest obrazek${p.w ? ` ${p.w}×${p.h}` : ""}${p.kb ? `, ${kb(p.kb)}` : ""}.`,
        warn: (p) => (!p.ok ? "Obrazek podglądu jest podany, ale się nie otwiera." : p.kb > 600 ? `Obrazek podglądu jest ciężki (${kb(p.kb)}), komunikatory mogą go nie pokazać.` : `Obrazek podglądu jest za mały (${p.w}×${p.h}).`),
        bad: () => "Brak obrazka podglądu: w Messengerze i WhatsAppie link wygląda pusto.",
        fix: { def: "Dodaj og:image 1200×630, JPG do 300 KB.", wp: "Yoast SEO / Rank Math → zakładka „Social” na stronie.", wix: "Wix: SEO → Social media → obraz do udostępniania.", tilda: "Tilda: ustawienia podstrony → Social media → okładka.", shopify: "Shopify: Sklep online → Preferencje → obraz do udostępniania w mediach społecznościowych." },
      },
      fav: {
        t: "Ikona strony",
        ok: () => "Jest favicon i ikona dla iPhone’a.",
        warn: () => "Jest favicon, ale brak ikony dla iPhone’a (apple-touch-icon).",
        bad: () => "Brak ikony, w karcie przeglądarki widać szary globus.",
        fix: { def: "Dodaj favicon 512×512 PNG i apple-touch-icon 180×180.", wp: "Wygląd → Dostosuj → Tożsamość witryny → Ikona witryny.", wix: "Wix: Ustawienia → Favicon.", tilda: "Tilda: ustawienia strony → Favicon." },
      },
      viewport: {
        t: "Dopasowanie do telefonu",
        ok: () => "Jest meta viewport, strona skaluje się do ekranu.",
        bad: () => "Brak meta viewport: na telefonie strona wyświetla się jako pomniejszona wersja desktopowa.",
        fix: { def: "Dodaj <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." },
      },
      lang: {
        t: "Język strony",
        ok: (p) => `Podany język: ${p.lang}.`,
        warn: () => "Język strony nie jest podany (atrybut lang).",
        fix: { def: "Dodaj język w znaczniku <html lang=\"pl\">.", wp: "Ustawienia → Ogólne → Język witryny." },
      },
      h1: {
        t: "Jeden nagłówek H1",
        ok: (p) => `Jeden H1: „${p.text}”.`,
        warn: (p) => `Na stronie jest ${p.n} ${plural(Number(p.n) || 0, "nagłówek", "nagłówki", "nagłówków")} H1, przez co Google gorzej rozumie, o czym jest strona.`,
        bad: () => "Brak nagłówka H1.",
        fix: { def: "Zostaw jeden H1 na podstronę z główną myślą, resztę zamień na H2.", wp: "W edytorze zmień poziom nagłówków; logo w motywie nie powinno być H1." },
      },
      alt: {
        t: "Opisy obrazków (alt)",
        ok: (p) => (p.n ? `Wszystkie obrazki (${p.n}) mają opis.` : "Na stronie głównej nie ma obrazków."),
        warn: (p) => `${p.miss} z ${p.n} obrazków bez opisu alt.`,
        bad: (p) => `${p.miss} z ${p.n} obrazków bez opisu alt.`,
        fix: { def: "Dodaj krótki opis do każdego obrazka.", wp: "Biblioteka mediów → obrazek → „Tekst alternatywny”.", wix: "Wix: kliknij obrazek → Ustawienia → „Co jest na obrazie?”.", tilda: "Tilda: treść bloku → pole „Alt” przy obrazku." },
      },
      schema: {
        t: "Znaczniki Schema.org",
        ok: (p) => `Są znaczniki: ${p.types}.`,
        warn: (p) => (p.bad ? "Znaczniki są, ale z błędem w kodzie." : "Brak znaczników, więc nie ma szans na gwiazdki i godziny otwarcia w wynikach wyszukiwania."),
        fix: { def: "Dodaj JSON-LD LocalBusiness lub Organization z adresem i kontaktem.", wp: "Rank Math albo Yoast: Schema → Local Business.", wix: "Wix: SEO → Dane strukturalne.", tilda: "Tilda: blok T123 (HTML) z kodem JSON-LD." },
      },
      links: {
        t: "Niedziałające linki",
        ok: (p) => `Sprawdzono ${p.n} linków wewnętrznych, wszystkie działają.`,
        warn: (p) => `${p.broken} z ${p.n} linków prowadzi donikąd: ${list(p.list)}.`,
        bad: (p) => `${p.broken} z ${p.n} linków prowadzi donikąd: ${list(p.list)}.`,
        fix: { def: "Popraw adresy albo usuń te linki z menu i tekstu.", wp: "Wtyczka Redirection: 301 ze starych adresów na nowe." },
      },
      text: {
        t: "Wystarczająco tekstu",
        ok: (p) => `Na stronie głównej jest około ${p.words} słów.`,
        warn: (p) => `Na stronie głównej jest tylko około ${p.words} słów: Google niewiele może zrozumieć o stronie.`,
        fix: { def: "Dodaj opis usług, miasta, zalet i odpowiedzi na częste pytania — przynajmniej 300 słów." },
      },
      psi_m: {
        t: "Szybkość na telefonie",
        ok: (p) => `PageSpeed ${p.score} na 100, główna treść pojawia się po ${p.lcp} s.`,
        warn: (p) => `PageSpeed ${p.score} na 100, główna treść pojawia się po ${p.lcp} s.`,
        bad: (p) => `PageSpeed ${p.score} na 100, główna treść pojawia się dopiero po ${p.lcp} s. Część osób wychodzi wcześniej.`,
        fix: { def: "Najważniejsze: skompresuj obrazki, włącz cache i usuń zbędne skrypty z pierwszego ekranu.", wp: "Wtyczka cache (LiteSpeed Cache albo WP Rocket) i konwersja obrazków do WebP; wyłącz zbędne wtyczki.", wix: "Wix: mniej animacji i wideo na pierwszym ekranie, mniej zewnętrznych aplikacji.", tilda: "Tilda: ustawienia strony → Więcej → „Lazy load”; mniej Zero Blocków na pierwszym ekranie.", shopify: "Shopify: lżejszy motyw i mniej aplikacji w sklepie." },
      },
      psi_d: {
        t: "Szybkość na komputerze",
        ok: (p) => `PageSpeed ${p.score} na 100.`,
        warn: (p) => `PageSpeed ${p.score} na 100.`,
        bad: (p) => `PageSpeed ${p.score} na 100: strona ładuje się wolno nawet na komputerze.`,
        fix: { def: "Te same kroki co dla telefonu." },
      },
      img: {
        t: "Waga obrazków",
        ok: (p) => (p.n ? `Najcięższy obrazek waży ${kb(p.kb)}.` : "Na stronie głównej nie ma obrazków."),
        warn: (p) => `Najcięższy obrazek waży ${kb(p.kb)}${p.name ? ` (${p.name})` : ""}.`,
        bad: (p) => `Najcięższy obrazek waży ${kb(p.kb)}${p.name ? ` (${p.name})` : ""} i mocno spowalnia stronę.`,
        fix: { def: "Skompresuj obrazki do 200–300 KB i zapisz w WebP.", wp: "Wtyczka Imagify, ShortPixel albo Converter for Media.", wix: "Wix kompresuje sam, ale wgrywaj zdjęcia nie większe niż 2500 px.", tilda: "Tilda kompresuje sama, ale wgrywaj zdjęcia nie większe niż 2000 px." },
      },
      gzip: {
        t: "Kompresja i cache",
        ok: (p) => `Kompresja ${p.enc} włączona${p.cache === 1 ? ", pliki są cache’owane" : ""}.`,
        warn: (p) => (!p.enc ? "Serwer nie kompresuje stron." : "Pliki stylów i skryptów nie są cache’owane w przeglądarce."),
        bad: () => "Serwer nie kompresuje stron, a pliki nie są cache’owane.",
        fix: { def: "Włącz gzip/brotli i cache w .htaccess albo w panelu hostingu.", wp: "Wtyczka cache włączy to sama." },
      },
      files: {
        t: "Pliki systemowe są zamknięte",
        ok: () => ".env, .git, kopie zapasowe i pliki konfiguracyjne są niedostępne z przeglądarki.",
        bad: (p) => `Z przeglądarki otwiera się: ${list(p.list)}. Mogą tam być hasła.`,
        fix: { def: "Pilnie usuń te pliki z serwera i zmień hasła, które w nich były.", wp: "Usuń pliki przez FTP i zmień hasło do bazy w panelu hostingu oraz w wp-config.php." },
      },
      cms: {
        t: "Wersja WordPressa",
        ok: (p) => (p.ver ? `WordPress ${p.ver}, aktualna wersja.` : "Wersji WordPressa nie widać z zewnątrz."),
        warn: (p) => `Wersja WordPressa ${p.ver} jest widoczna w kodzie strony.`,
        bad: (p) => `WordPress ${p.ver} jest nieaktualny${p.latest ? ` (aktualna wersja to ${p.latest})` : ""}: stare wersje mają znane luki bezpieczeństwa.`,
        fix: { def: "Zaktualizuj WordPressa, motywy i wtyczki oraz ukryj wersję (wtyczka Wordfence)." },
      },
      users: {
        t: "Loginy administratorów są ukryte",
        ok: () => "Lista użytkowników jest zamknięta.",
        warn: (p) => `Pod adresem /wp-json/wp/v2/users widać loginy: ${list(p.names)}.`,
        fix: { def: "Zamknij listę użytkowników wtyczką bezpieczeństwa (Wordfence) i nie używaj loginu admin." },
      },
      xmlrpc: {
        t: "xmlrpc.php wyłączony",
        ok: () => "xmlrpc jest zamknięty.",
        warn: () => "xmlrpc.php jest otwarty, a to przez niego najczęściej łamie się hasła.",
        fix: { def: "Wyłącz xmlrpc w Wordfence albo przez .htaccess." },
      },
      list: {
        t: "Lista plików jest ukryta",
        ok: () => "Foldery nie pokazują swojej zawartości.",
        warn: (p) => `Folder ${list(p.list)} pokazuje listę wszystkich plików.`,
        fix: { def: "Dodaj „Options -Indexes” w .htaccess." },
      },
      heads: {
        t: "Nagłówki bezpieczeństwa",
        ok: (p) => `${p.n} z 6 nagłówków bezpieczeństwa.`,
        warn: (p) => `${p.n} z 6 nagłówków bezpieczeństwa${p.miss?.length ? `, brakuje: ${list(p.miss)}` : ""}.${p.leak ? ` Serwer ujawnia wersję oprogramowania: ${p.leak}.` : ""}`,
        bad: (p) => `${p.n} z 6 nagłówków bezpieczeństwa.${p.leak ? ` Serwer ujawnia wersję oprogramowania: ${p.leak}.` : ""}`,
        fix: { def: "Dodaj HSTS, X-Content-Type-Options, Referrer-Policy i X-Frame-Options w .htaccess lub konfiguracji serwera i ukryj wersję serwera.", wp: "Wtyczka Headers Security Advanced & HSTS WP albo reguły w .htaccess." },
      },
      mixed: {
        t: "Brak mieszanej zawartości",
        ok: () => "Wszystkie pliki ładują się przez https.",
        warn: (p) => `Plików ładowanych przez http://: ${p.n}. Przeglądarka może je zablokować.`,
        fix: { def: "Zamień http:// na https:// w linkach do obrazków i skryptów.", wp: "Wtyczka Better Search Replace: zamień http://twoja-domena na https://twoja-domena." },
      },
      priv: {
        t: "Polityka prywatności",
        ok: () => "Link do polityki prywatności jest.",
        bad: () => "Nie znaleziono linku do polityki prywatności. Przy formularzu i analityce w UE jest obowiązkowa.",
        fix: { def: "Dodaj stronę polityki prywatności i link do niej w stopce i pod formularzem.", wp: "Ustawienia → Prywatność → utwórz stronę." },
      },
      cookie: {
        t: "Baner zgody na cookies",
        ok: (p) => (p.cmp ? "Jest baner zgody na cookies." : "Nie znaleziono trackerów, które wymagają zgody."),
        warn: () => "Trackery są, a banera zgody nie znaleziono. W UE to naruszenie RODO.",
        fix: { def: "Podłącz baner zgody (Cookiebot, CookieYes) z Google Consent Mode.", wp: "Wtyczka Complianz albo CookieYes.", wix: "Wix: Ustawienia → Prywatność i pliki cookie → baner.", tilda: "Tilda: ustawienia strony → Więcej → baner cookies." },
      },
      ga: {
        t: "Analityka",
        ok: (p) => `Znaleziono: ${list(p.list)}.`,
        warn: () => "Nie znaleziono analityki: nie wiesz, skąd przychodzą klienci.",
        fix: { def: "Podłącz Google Analytics 4 i Microsoft Clarity (za darmo).", wp: "Wtyczka Site Kit by Google.", wix: "Wix: Marketing i SEO → Integracje marketingowe → Google Analytics.", tilda: "Tilda: ustawienia strony → Analityka." },
      },
      captcha: {
        t: "Ochrona formularza przed spamem",
        ok: (p) => (p.cap ? `Jest ochrona: ${p.cap}.` : "Formularz chroni platforma."),
        warn: () => "Formularz nie ma captchy ani innej ochrony, więc boty mogą zasypać Cię zgłoszeniami.",
        fix: { def: "Dodaj Cloudflare Turnstile albo reCAPTCHA.", wp: "Contact Form 7 / WPForms mają wbudowaną obsługę Turnstile." },
      },
    },
  };
  return t;
})();
