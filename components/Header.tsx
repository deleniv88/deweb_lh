import { LOCALES, UI, localeOf, worksPath, type Locale } from "../lib/i18n";

/* Хедер: лого, вибір мови, меню. На головній посилання — якорі (#services),
   на інших сторінках (блог) — ведуть на головну потрібної мови.
   page — та сама сторінка в інших мовах (напр. "works" → /realizacje/, /en/works/, /ua/works/); без нього вибір мови веде на головну. */
export default function Header({ home = true, locale = "en", page }: { home?: boolean; locale?: Locale; page?: "works" }) {
  const t = UI[locale];
  const cur = localeOf(locale);
  const p = home ? "" : cur.path;
  const links = [
    { href: `${p}#services`, label: t.nav.services },
    { href: `${p}#projects`, label: t.nav.projects },
    { href: `${p}#process`, label: t.nav.process },
    { href: `${p}#faq`, label: t.nav.faq },
  ];
  return (
    <header className="site-header" data-site-header>
      <a href={cur.path} className="logo" aria-label={t.home}>
        <span className="logo__main">D<span className="logo__e">e</span>web</span>
        <span className="logo__sub">studio</span>
      </a>
      <div className="header-right">
        <div className="lang" data-lang>
          <button className="glass lang__btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="lang-menu" aria-label={`${t.language}: ${cur.name}`}>
            <span className="pill">
              {cur.label}
              <svg viewBox="0 0 8 4" fill="none" aria-hidden="true"><path d="M.5.5 4 3.5 7.5.5" stroke="#242527" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
          <ul className="lang__menu" id="lang-menu">
            {LOCALES.map((l) => (
              <li key={l.code}>
                <a className="lang__item" href={page === "works" ? worksPath(l.code) : l.path} hrefLang={l.htmlLang} lang={l.htmlLang} aria-current={l.code === locale ? "true" : undefined}>
                  <span>{l.name}</span>
                  <span className="lang__code">{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <button className="glass burger" type="button" aria-label={t.menu} aria-expanded="false" aria-controls="main-nav">
          <span className="pill"><i></i><i></i></span>
        </button>
        <nav className="glass nav" id="main-nav" aria-label={t.mainNav}>
          <ul className="nav__list">
            {links.map((l) => (
              <li key={l.href}><a className="nav__link" href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
