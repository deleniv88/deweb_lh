/* =========================================================
   Мови сайту.
   Тексти сторінки (заголовки, кейси, послуги, FAQ…) редагуються в адмінці Tina
   окремо для кожної мови: content/home/home.json (EN), home-pl.json, home-ua.json.
   Тут — лише дрібні службові написи інтерфейсу (кнопки, підписи форми, дні тижня тощо).
   ========================================================= */

export type Locale = "en" | "pl" | "ua";

export const LOCALES: { code: Locale; label: string; name: string; path: string; htmlLang: string; file: string }[] = [
  { code: "en", label: "EN", name: "English", path: "/", htmlLang: "en", file: "home.json" },
  { code: "pl", label: "PL", name: "Polski", path: "/pl/", htmlLang: "pl", file: "home-pl.json" },
  { code: "ua", label: "UA", name: "Українська", path: "/ua/", htmlLang: "uk", file: "home-ua.json" },
];

export const localeOf = (code: Locale) => LOCALES.find((l) => l.code === code) || LOCALES[0];

/* адреса сторінки «Усі роботи» для мови: /works/, /pl/works/, /ua/works/ */
export const worksPath = (code: Locale) => `${localeOf(code).path}works/`;

const en = {
  nav: { services: "Services", projects: "Projects", process: "Process", faq: "FAQ" },
  home: "Deweb studio — home",
  menu: "Menu",
  mainNav: "Main",
  language: "Language",
  viewWebsite: "View website",
  projects: "Projects",
  prevProject: "Previous project",
  nextProject: "Next project",
  liveTpl: "Project {i} of {n}",
  featuresAria: "What every site includes",
  previewSoon: "Preview coming soon",
  week: "Week",
  weekShort: "W",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  after: "After",
  today: "Today",
  storiesAria: "Client video stories",
  prevStory: "Previous story",
  nextStory: "Next story",
  playTpl: "Play {name} with sound",
  videoTpl: "Video review: {name}",
  mute: "Mute",
  unmute: "Unmute",
  social: "Social and contact",
  close: "Close",
  works: {
    titleAccent: "Selected",
    titleRest: "work",
    metaTitle: "Selected work — Deweb studio",
    metaDescription: "Websites designed and built by Deweb studio for businesses in different niches.",
  },
  form: {
    nameLabel: "Your name",
    namePh: "What's your name?",
    contactLabel: "How should I contact you?",
    msgLabel: "Briefly describe your request",
    msgPh: "A landing page, a corporate site or a store? Any deadline?",
    send: "Send request",
    note: "No spam. Your details are used only to reply to your request.",
    errName: "Please enter your name",
    errSend: "Couldn't send the request. Please try again or write to me directly.",
    telegramPh: "Telegram username, e.g. @name",
    telegramErr: "Enter your Telegram username, e.g. @name",
    instagramPh: "Instagram handle, e.g. @name",
    instagramErr: "Enter your Instagram handle, e.g. @name",
    whatsappPh: "WhatsApp, e.g. +48 600 000 000",
    whatsappErr: "Enter a phone number with country code",
    emailPh: "Email, e.g. name@company.com",
    emailErr: "Enter a valid email address",
  },
};

export type UIStrings = typeof en;

const pl: UIStrings = {
  nav: { services: "Usługi", projects: "Projekty", process: "Proces", faq: "FAQ" },
  home: "Deweb studio — strona główna",
  menu: "Menu",
  mainNav: "Główna nawigacja",
  language: "Język",
  viewWebsite: "Zobacz stronę",
  projects: "Projekty",
  prevProject: "Poprzedni projekt",
  nextProject: "Następny projekt",
  liveTpl: "Projekt {i} z {n}",
  featuresAria: "Co zawiera każda strona",
  previewSoon: "Podgląd wkrótce",
  week: "Tydzień",
  weekShort: "T",
  days: ["Pn", "Wt", "Śr", "Cz", "Pt"],
  after: "Potem",
  today: "Dziś",
  storiesAria: "Wideo-opinie klientów",
  prevStory: "Poprzednia opinia",
  nextStory: "Następna opinia",
  playTpl: "Odtwórz opinię {name} z dźwiękiem",
  videoTpl: "Wideo-opinia: {name}",
  mute: "Wycisz",
  unmute: "Włącz dźwięk",
  social: "Social media i kontakt",
  close: "Zamknij",
  works: {
    titleAccent: "Wybrane",
    titleRest: "realizacje",
    metaTitle: "Wybrane realizacje — Deweb studio",
    metaDescription: "Strony internetowe zaprojektowane i wykonane przez Deweb studio dla firm z różnych branż.",
  },
  form: {
    nameLabel: "Twoje imię",
    namePh: "Jak masz na imię?",
    contactLabel: "Jak mam się z Tobą skontaktować?",
    msgLabel: "Krótko opisz, czego potrzebujesz",
    msgPh: "Landing page, strona firmowa czy sklep? Jaki termin?",
    send: "Wyślij zapytanie",
    note: "Zero spamu. Twoje dane służą wyłącznie do odpowiedzi na zapytanie.",
    errName: "Podaj swoje imię",
    errSend: "Nie udało się wysłać zapytania. Spróbuj ponownie lub napisz do mnie bezpośrednio.",
    telegramPh: "Nazwa w Telegramie, np. @imie",
    telegramErr: "Podaj nazwę użytkownika w Telegramie, np. @imie",
    instagramPh: "Profil na Instagramie, np. @imie",
    instagramErr: "Podaj nazwę profilu na Instagramie, np. @imie",
    whatsappPh: "WhatsApp, np. +48 600 000 000",
    whatsappErr: "Podaj numer telefonu z kierunkowym",
    emailPh: "E-mail, np. imie@firma.pl",
    emailErr: "Podaj poprawny adres e-mail",
  },
};

const ua: UIStrings = {
  nav: { services: "Послуги", projects: "Проєкти", process: "Процес", faq: "FAQ" },
  home: "Deweb studio — головна",
  menu: "Меню",
  mainNav: "Головна навігація",
  language: "Мова",
  viewWebsite: "Переглянути сайт",
  projects: "Проєкти",
  prevProject: "Попередній проєкт",
  nextProject: "Наступний проєкт",
  liveTpl: "Проєкт {i} з {n}",
  featuresAria: "Що є в кожному сайті",
  previewSoon: "Превʼю незабаром",
  week: "Тиждень",
  weekShort: "Т",
  days: ["Пн", "Вт", "Ср", "Чт", "Пт"],
  after: "Далі",
  today: "Сьогодні",
  storiesAria: "Відеовідгуки клієнтів",
  prevStory: "Попередній відгук",
  nextStory: "Наступний відгук",
  playTpl: "Увімкнути відгук {name} зі звуком",
  videoTpl: "Відеовідгук: {name}",
  mute: "Вимкнути звук",
  unmute: "Увімкнути звук",
  social: "Соцмережі та контакти",
  close: "Закрити",
  works: {
    titleAccent: "Вибрані",
    titleRest: "роботи",
    metaTitle: "Вибрані роботи — Deweb studio",
    metaDescription: "Сайти, які Deweb studio спроєктувала і зробила для бізнесів з різних ніш.",
  },
  form: {
    nameLabel: "Ваше імʼя",
    namePh: "Як вас звати?",
    contactLabel: "Як з вами звʼязатися?",
    msgLabel: "Коротко опишіть ваш запит",
    msgPh: "Лендінг, корпоративний сайт чи магазин? Які терміни?",
    send: "Надіслати запит",
    note: "Без спаму. Ваші дані використовуються лише для відповіді на запит.",
    errName: "Вкажіть ваше імʼя",
    errSend: "Не вдалося надіслати запит. Спробуйте ще раз або напишіть мені напряму.",
    telegramPh: "Нік у Telegram, напр. @name",
    telegramErr: "Вкажіть нік у Telegram, напр. @name",
    instagramPh: "Профіль в Instagram, напр. @name",
    instagramErr: "Вкажіть профіль в Instagram, напр. @name",
    whatsappPh: "WhatsApp, напр. +48 600 000 000",
    whatsappErr: "Вкажіть номер телефону з кодом країни",
    emailPh: "Email, напр. name@company.com",
    emailErr: "Вкажіть правильну адресу email",
  },
};

export const UI: Record<Locale, UIStrings> = { en, pl, ua };

export const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
