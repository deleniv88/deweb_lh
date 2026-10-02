/* Хедер: лого, вибір мови, меню. На головній посилання — якорі (#services),
   на інших сторінках — ведуть на головну (/#services). */

/* Мови сайту. Поки що сторінка лише англійською — EN активна.
   TODO: коли з'являться /pl і /ua, заміни href на реальні адреси. */
const LANGS = [
  { code: "EN", name: "English", href: "/", current: true },
  { code: "PL", name: "Polski", href: "#", current: false },
  { code: "UA", name: "Українська", href: "#", current: false },
];

export default function Header({ home = true }: { home?: boolean }) {
  const p = home ? "" : "/";
  const links = [
    { href: `${p}#services`, label: "Services" },
    { href: `${p}#projects`, label: "Projects" },
    { href: `${p}#process`, label: "Process" },
    { href: `${p}#faq`, label: "FAQ" },
  ];
  const active = LANGS.find((l) => l.current) || LANGS[0];
  return (
    <header className="site-header" data-site-header>
      <a href="/" className="logo" aria-label="Deweb studio — home">
        <span className="logo__main">D<span className="logo__e">e</span>web</span>
        <span className="logo__sub">studio</span>
      </a>
      <div className="header-right">
        <div className="lang" data-lang>
          <button className="glass lang__btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="lang-menu" aria-label={`Language: ${active.name}`}>
            <span className="pill">
              {active.code}
              <svg viewBox="0 0 8 4" fill="none" aria-hidden="true"><path d="M.5.5 4 3.5 7.5.5" stroke="#242527" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
          <ul className="lang__menu" id="lang-menu">
            {LANGS.map((l) => (
              <li key={l.code}>
                <a className="lang__item" href={l.href} hrefLang={l.code.toLowerCase() === "ua" ? "uk" : l.code.toLowerCase()} aria-current={l.current ? "true" : undefined}>
                  <span>{l.name}</span>
                  <span className="lang__code">{l.code}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <button className="glass burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="main-nav">
          <span className="pill"><i></i><i></i></span>
        </button>
        <nav className="glass nav" id="main-nav" aria-label="Main">
          <ul className="nav__list">
            {links.map((l) => (
              <li key={l.label}><a className="nav__link" href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
