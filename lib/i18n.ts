/* =========================================================
   Мови сайту.
   Тексти сторінки (заголовки, кейси, послуги, FAQ…) редагуються в адмінці Tina
   окремо для кожної мови: content/home/home.json (EN), home-pl.json, home-ua.json.
   Тут — лише дрібні службові написи інтерфейсу (кнопки, підписи форми, дні тижня тощо).
   ========================================================= */

export type Locale = "en" | "pl" | "ua";

/* Основна мова — польська: вона відкривається на / (і /realizacje/), англійська — на /en/, українська — на /ua/.
   Старі адреси /pl/... ведуть на / 301-редиректом (public/.htaccess). */
export const LOCALES: { code: Locale; label: string; name: string; path: string; htmlLang: string; file: string }[] = [
  { code: "en", label: "EN", name: "English", path: "/en/", htmlLang: "en", file: "home.json" },
  { code: "pl", label: "PL", name: "Polski", path: "/", htmlLang: "pl", file: "home-pl.json" },
  { code: "ua", label: "UA", name: "Українська", path: "/ua/", htmlLang: "uk", file: "home-ua.json" },
];

export const DEFAULT_LOCALE: Locale = "pl";

export const localeOf = (code: Locale) => LOCALES.find((l) => l.code === code) || LOCALES.find((l) => l.code === DEFAULT_LOCALE)!;

/* адреса сторінки «Усі роботи» для мови: /realizacje/ (PL), /en/works/, /ua/works/ */
export const worksPath = (code: Locale) => (code === "pl" ? "/realizacje/" : `${localeOf(code).path}works/`);
/* файл сторінки робіт для мови: content/works/works.json, works-pl.json, works-ua.json */
export const worksFile = (code: Locale) => localeOf(code).file.replace("home", "works");

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
    /* запасні SEO-тексти, якщо в адмінці (Сторінка робіт → SEO) порожньо */
    metaTitle: "Selected work — Deweb studio",
    metaDescription: "Websites designed and built by Deweb studio for businesses in different niches.",
  },
  chat: {
    open: "Ask the AI assistant",
    title: "Deweb assistant",
    status: "AI · replies instantly",
    hello: "Hi! I'm Andrew's AI assistant. Ask me about prices, timing or how we'd work together, and I can set up a free call with Andrew.",
    chips: ["How much does a website cost?", "How long does it take?", "Book a call with Andrew"],
    placeholder: "Type your question…",
    send: "Send",
    note: "AI can make mistakes. Your messages are used only to answer you.",
    restart: "New chat",
    errGeneric: "Something went wrong. Please try again or use the quote form.",
    errBusy: "I'm a bit overloaded right now. Please try again in a minute.",
    errOff: "The chat is resting right now. Leave a request in the form and Andrew will reply soon.",
    errRate: "Too many messages. Please take a short break and try again.",
    openForm: "Open the quote form",
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
    /* запасні SEO-тексти, якщо в адмінці (Сторінка робіт → SEO) порожньо */
    metaTitle: "Wybrane realizacje — Deweb studio",
    metaDescription: "Strony internetowe zaprojektowane i wykonane przez Deweb studio dla firm z różnych branż.",
  },
  chat: {
    open: "Zapytaj asystenta AI",
    title: "Asystent Deweb",
    status: "AI · odpowiada od razu",
    hello: "Cześć! Jestem asystentem AI Andrzeja. Zapytaj o ceny, terminy albo współpracę, a mogę też umówić bezpłatną rozmowę z Andrzejem.",
    chips: ["Ile kosztuje strona?", "Ile trwa realizacja?", "Umów rozmowę z Andrzejem"],
    placeholder: "Napisz pytanie…",
    send: "Wyślij",
    note: "AI może się mylić. Wiadomości służą tylko do odpowiedzi.",
    restart: "Nowa rozmowa",
    errGeneric: "Coś poszło nie tak. Spróbuj ponownie albo skorzystaj z formularza.",
    errBusy: "Mam teraz dużo pytań. Spróbuj ponownie za minutę.",
    errOff: "Czat teraz odpoczywa. Zostaw zapytanie w formularzu, a Andrzej szybko odpowie.",
    errRate: "Za dużo wiadomości. Zrób krótką przerwę i spróbuj ponownie.",
    openForm: "Otwórz formularz wyceny",
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
    /* запасні SEO-тексти, якщо в адмінці (Сторінка робіт → SEO) порожньо */
    metaTitle: "Вибрані роботи — Deweb studio",
    metaDescription: "Сайти, які Deweb studio спроєктувала і зробила для бізнесів з різних ніш.",
  },
  chat: {
    open: "Запитати AI-асистента",
    title: "Асистент Deweb",
    status: "AI · відповідає одразу",
    hello: "Привіт! Я AI-асистент Андрія. Запитайте про ціни, терміни чи співпрацю, а ще я можу запланувати безкоштовний дзвінок з Андрієм.",
    chips: ["Скільки коштує сайт?", "Скільки триває розробка?", "Записатися на дзвінок з Андрієм"],
    placeholder: "Напишіть питання…",
    send: "Надіслати",
    note: "AI може помилятися. Повідомлення використовуються лише для відповіді.",
    restart: "Нова розмова",
    errGeneric: "Щось пішло не так. Спробуйте ще раз або скористайтеся формою.",
    errBusy: "Зараз багато запитів. Спробуйте ще раз за хвилину.",
    errOff: "Чат зараз відпочиває. Залиште заявку у формі, і Андрій скоро відповість.",
    errRate: "Забагато повідомлень. Зробіть коротку паузу і спробуйте ще раз.",
    openForm: "Відкрити форму заявки",
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
