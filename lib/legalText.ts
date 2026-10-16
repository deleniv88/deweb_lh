import type { Locale } from "./i18n";

/* =========================================================
   Тексти юридичних сторінок: Політика приватності й cookies та Регламент (PL / EN / UA).
   Польська версія — основна (бізнес у Польщі, RODO + UŚUDE + PKE), EN і UA — переклади.
   Описано лише те, що сайт реально робить: форма (quote.php → Telegram, Gmail, CRM), AI-чат (chat.php → Anthropic,
   Google Календар/Meet), аудит сайту (audit.php), чек-лист (localStorage), Turnstile, CookieYes (з GTM),
   GA4 / Google Ads (GTM, gtag), Meta Pixel, Microsoft Clarity. Змінився сервіс — онови текст і дату.

   Розмітка в рядках: [текст](адреса) — посилання, **текст** — жирний.
   Плейсхолдери {name} {email} {address} {nip} підставляються з OWNER; порожнє поле показується як «[заповнити]».
   Блок: рядок — абзац, масив рядків — список, { head, rows } — таблиця.
   ========================================================= */

export const OWNER = {
  name: "Andrii Deleniv",
  email: "andrii.deleniv@gmail.com",
  address: "",
  nip: "",
};

export const LEGAL_UPDATED = { pl: "16 października 2026", en: "16 October 2026", ua: "16 жовтня 2026" } as const;

export type LegalBlock = string | string[] | { head: string[]; rows: string[][] };
export type LegalDoc = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  lead: string;
  sections: { h: string; body: LegalBlock[] }[];
};


export const LEGAL_UI: Record<Locale, { updated: string; missing: string; contents: string }> = {
  pl: { updated: "Aktualizacja", missing: "do uzupełnienia", contents: "Spis treści" },
  en: { updated: "Last updated", missing: "to be filled in", contents: "Contents" },
  ua: { updated: "Оновлено", missing: "заповнити", contents: "Зміст" },
};

/* ---------------------------------------------------------------- PL */

const cookieRowsPl = [
  ["dw_lang", "deweb.studio", "Zapamiętuje wybraną wersję językową", "1 rok", "Niezbędne"],
  ["cookieyes-consent", "CookieYes", "Zapisuje Twój wybór w banerze cookies", "1 rok", "Niezbędne"],
  ["dw_chat (sessionStorage)", "deweb.studio", "Treść rozmowy z czatem, żeby nie znikała przy przejściu na inną podstronę", "Do zamknięcia karty", "Niezbędne"],
  ["dw_chat_teaser, dw-checklist (localStorage)", "deweb.studio", "Powitanie czatu najwyżej raz na dobę; Twoje odpowiedzi w checkliście", "Do usunięcia w przeglądarce", "Funkcjonalne"],
  ["Cloudflare Turnstile", "Cloudflare", "Odróżnia ludzi od botów przy formularzu, czacie i audycie", "Sesja", "Niezbędne"],
  ["_ga, _ga_*", "Google Analytics", "Statystyki odwiedzin: skąd przychodzą goście, które strony czytają", "Do 2 lat", "Analityczne"],
  ["_clck, _clsk, CLID, MUID", "Microsoft Clarity", "Mapy kliknięć i nagrania sesji (ruch myszy, przewijanie, kliknięcia)", "_clsk 1 dzień, pozostałe do 1 roku", "Analityczne"],
  ["_gcl_au", "Google Ads", "Pomiar skuteczności reklam Google (czy reklama doprowadziła do zapytania)", "90 dni", "Reklamowe"],
  ["_fbp, fr", "Meta (Facebook, Instagram)", "Pomiar reklam i remarketing w Facebooku i Instagramie", "Do 90 dni", "Reklamowe"],
];

const privacyPl: LegalDoc = {
  meta: {
    title: "Polityka prywatności i cookies — Deweb studio",
    description: "Jak deweb.studio przetwarza dane osobowe z formularza, czatu AI i audytu strony oraz z jakich plików cookies korzysta.",
  },
  eyebrow: "Dokumenty",
  title: "Polityka prywatności i plików cookies",
  lead: "Krótko i konkretnie: jakie dane zbiera ta strona, po co, komu je przekazuję i jakie masz prawa.",
  sections: [
    {
      h: "1. Administrator danych",
      body: [
        "Administratorem Twoich danych osobowych jest **{name}**, prowadzący działalność pod nazwą Deweb studio, {address}, NIP {nip} (dalej „ja” lub „Administrator”).",
        "We wszystkich sprawach dotyczących danych osobowych napisz na [{email}](mailto:{email}). Nie wyznaczyłem inspektora ochrony danych, bo nie mam takiego obowiązku.",
      ],
    },
    {
      h: "2. Jakie dane zbieram, po co i na jakiej podstawie",
      body: [
        "**Formularz zapytania o wycenę.** Imię, wybrany sposób kontaktu i sam kontakt (e-mail, nick w Telegramie lub Instagramie, numer WhatsApp), opis projektu i język strony. Używam ich, żeby odpowiedzieć, przygotować wycenę i ewentualnie zawrzeć umowę. Podstawa: art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy na Twoje żądanie), a gdy wiadomość nie dotyczy umowy, art. 6 ust. 1 lit. f RODO (mój uzasadniony interes, czyli odpowiadanie na wiadomości).",
        "**Czat z asystentem AI.** Treść rozmowy, a jeśli sam je podasz, także imię, e-mail lub inny kontakt i dogodny termin rozmowy. Czat odpowiada na pytania, umawia bezpłatną rozmowę wideo (Google Meet) albo przekazuje mi prośbę o kontakt. Podstawa: art. 6 ust. 1 lit. b i f RODO. Odpowiedzi generuje model AI firmy Anthropic, dlatego treść rozmowy jest do niej wysyłana. Na serwerze nie zapisuję rozmów. Zapisuję je tylko wtedy, gdy umówisz rozmowę albo poprosisz o kontakt: wtedy rozmowa i dane kontaktowe trafiają do mojego CRM i powiadomienia, a przy rezerwacji Google Kalendarz wysyła Ci zaproszenie e-mailem.",
        "**Bezpłatny audyt strony.** Adres sprawdzanej strony i wynik audytu, a jeśli chcesz pełny raport, Twój e-mail albo nick w Instagramie lub Telegramie. Podstawa: art. 6 ust. 1 lit. b RODO (wykonanie audytu i udostępnienie raportu) oraz art. 6 ust. 1 lit. f RODO (jednorazowa wiadomość z poradą dotyczącą wyniku). Możesz się temu sprzeciwić w każdej chwili, wystarczy odpisać.",
        "**Checklista „Stronę zrobiło AI?”.** Twoje odpowiedzi zostają tylko w Twojej przeglądarce i nie są do mnie wysyłane.",
        "**Kontakt e-mailem i przez komunikatory.** Dane, które sam podasz w korespondencji. Podstawa: art. 6 ust. 1 lit. b lub f RODO.",
        "**Współpraca.** Jeśli zawrzemy umowę, przetwarzam dane potrzebne do jej wykonania (art. 6 ust. 1 lit. b RODO) oraz do wystawienia faktur i rozliczeń podatkowych (art. 6 ust. 1 lit. c RODO).",
        "**Bezpieczeństwo i ochrona przed spamem.** Adres IP, data i godzina, odwiedzona podstrona i dane przeglądarki trafiają do logów serwera. Adres IP służy też do limitów chroniących formularz, czat i audyt przed nadużyciami (zapisywany jako skrót i usuwany najpóźniej po 24 godzinach), a Cloudflare Turnstile sprawdza, czy jesteś człowiekiem. Podstawa: art. 6 ust. 1 lit. f RODO (bezpieczeństwo strony).",
        "**Statystyki bez danych osobowych.** Na własnym serwerze liczę zdarzenia takie jak „otwarto formularz” czy „wysłano zapytanie” (sama liczba i język strony, bez IP i bez cookies).",
        "**Analityka i reklama, tylko za zgodą.** Google Analytics, Microsoft Clarity, Google Ads i Meta Pixel pokazują mi, jak goście korzystają ze strony i czy reklamy działają. Clarity nagrywa ruchy myszy, przewijanie i kliknięcia; treść wpisywana w pola formularzy jest maskowana. Te narzędzia uruchamiają się dopiero po Twojej zgodzie w banerze. Podstawa: art. 6 ust. 1 lit. a RODO i art. 399 Prawa komunikacji elektronicznej.",
      ],
    },
    {
      h: "3. Komu przekazuję dane",
      body: [
        "Nie sprzedaję danych. Korzystam z usług firm, które przetwarzają je w moim imieniu lub jako osobni administratorzy:",
        [
          "**LH.pl sp. z o.o.** (Poznań): hosting strony i serwera.",
          "**Google** (Google Ireland Ltd, Google LLC): Gmail (powiadomienia o zapytaniach), Google Kalendarz i Meet (rozmowy wideo), Google Tag Manager, Google Analytics, Google Ads.",
          "**Telegram** (Telegram FZ-LLC): powiadomienia o nowych zapytaniach w moim prywatnym czacie.",
          "**Anthropic PBC** (USA): model AI, który odpowiada w czacie. Według umowy z Anthropic dane z API nie służą do trenowania modeli.",
          "**Cloudflare, Inc.** (USA): Turnstile, ochrona przed botami.",
          "**CookieYes Limited** (Wielka Brytania): baner cookies i zapis Twojej zgody.",
          "**Microsoft Ireland Operations Ltd**: Microsoft Clarity (za zgodą).",
          "**Meta Platforms Ireland Ltd**: Meta Pixel (za zgodą).",
          "**Tina (SSW)**: serwer, z którego wczytują się zdjęcia na stronie, więc widzi Twój adres IP.",
          "Organy publiczne, gdy wymaga tego prawo.",
        ],
      ],
    },
    {
      h: "4. Przekazywanie danych poza EOG",
      body: [
        "Google, Microsoft, Meta, Cloudflare i Anthropic mogą przetwarzać dane w USA. Podstawą jest decyzja Komisji Europejskiej o odpowiednim stopniu ochrony (EU-US Data Privacy Framework) dla firm z certyfikatem albo standardowe klauzule umowne zatwierdzone przez Komisję. Wielka Brytania ma decyzję o odpowiednim stopniu ochrony. Powiadomienia przez Telegram przekazuję poza EOG, aby obsłużyć Twoje zapytanie (art. 49 ust. 1 lit. b RODO).",
      ],
    },
    {
      h: "5. Jak długo przechowuję dane",
      body: [
        [
          "Zapytania, które nie kończą się współpracą: do 12 miesięcy od ostatniego kontaktu.",
          "Dane klientów: przez czas współpracy, a potem do upływu terminów przedawnienia roszczeń; dokumenty księgowe przez 5 lat od końca roku podatkowego.",
          "Raporty audytu: do 12 miesięcy.",
          "Rozmowa z czatem w przeglądarce: do zamknięcia karty.",
          "Limity antyspamowe po adresie IP: do 24 godzin.",
          "Dane analityczne: do 14 miesięcy; cookies zgodnie z tabelą niżej.",
          "Dane przetwarzane na podstawie zgody: do jej wycofania.",
        ],
      ],
    },
    {
      h: "6. Twoje prawa",
      body: [
        "Masz prawo do dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania i przeniesienia. Możesz w każdej chwili wnieść sprzeciw wobec przetwarzania na podstawie mojego uzasadnionego interesu i wycofać zgodę na cookies (link „Ustawienia cookies” w stopce). Wycofanie zgody nie wpływa na zgodność z prawem wcześniejszego przetwarzania.",
        "Żeby skorzystać z praw, napisz na [{email}](mailto:{email}). Odpowiem najpóźniej w ciągu miesiąca.",
        "Masz też prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, [uodo.gov.pl](https://uodo.gov.pl)).",
      ],
    },
    {
      h: "7. Dobrowolność i automatyczne decyzje",
      body: [
        "Podanie danych jest dobrowolne, ale bez kontaktu nie mogę odpowiedzieć na zapytanie ani przesłać raportu. Nie podejmuję wobec Ciebie decyzji opartych wyłącznie na automatycznym przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne. Asystent AI tylko odpowiada na pytania; o współpracy decyduję ja.",
      ],
    },
    {
      h: "8. Pliki cookies i podobne technologie",
      body: [
        "Cookies to małe pliki zapisywane w przeglądarce. Strona korzysta też z pamięci przeglądarki (localStorage i sessionStorage), która działa podobnie. Niezbędne pliki działają zawsze, bo bez nich strona nie działa poprawnie. Analityczne i reklamowe włączają się dopiero po Twojej zgodzie w banerze.",
        { head: ["Nazwa", "Dostawca", "Cel", "Czas", "Rodzaj"], rows: cookieRowsPl },
        "Zgodę zmienisz lub wycofasz w każdej chwili przez link „Ustawienia cookies” w stopce. Cookies możesz też usunąć lub zablokować w ustawieniach przeglądarki, ale wtedy część funkcji może nie działać. Dostawcy mogą zmieniać nazwy swoich plików; aktualną listę pokazuje baner.",
      ],
    },
    {
      h: "9. Zmiany polityki",
      body: [
        "Gdy zmienią się narzędzia na stronie lub przepisy, zaktualizuję tę politykę i datę u góry strony.",
      ],
    },
  ],
};

const termsPl: LegalDoc = {
  meta: {
    title: "Regulamin — Deweb studio",
    description: "Zasady korzystania ze strony deweb.studio i jej bezpłatnych usług: formularza, czatu AI, audytu strony i checklisty.",
  },
  eyebrow: "Dokumenty",
  title: "Regulamin świadczenia usług drogą elektroniczną",
  lead: "Zasady korzystania ze strony deweb.studio i jej bezpłatnych narzędzi.",
  sections: [
    {
      h: "§1. Postanowienia ogólne",
      body: [
        "Regulamin określa zasady korzystania ze strony deweb.studio (dalej „Strona”) i usług świadczonych na niej drogą elektroniczną, zgodnie z ustawą z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną.",
        "Usługodawcą jest **{name}**, prowadzący działalność pod nazwą Deweb studio, {address}, NIP {nip}, e-mail: [{email}](mailto:{email}).",
        "Korzystając ze Strony, akceptujesz Regulamin. Jest on dostępny bezpłatnie w każdej chwili pod tym adresem i możesz go zapisać lub wydrukować.",
      ],
    },
    {
      h: "§2. Usługi",
      body: [
        "Na Stronie bezpłatnie udostępniam:",
        [
          "przeglądanie treści: oferty, realizacji, opinii i bloga;",
          "formularz zapytania o wycenę;",
          "czat z asystentem AI, który odpowiada na pytania i pozwala umówić bezpłatną rozmowę wideo;",
          "bezpłatny audyt strony internetowej i raport z wynikami;",
          "checklistę „Stronę zrobiło AI?”.",
        ],
        "Umowa o świadczenie usługi zawiera się z chwilą rozpoczęcia korzystania z niej i kończy się, gdy przestajesz z niej korzystać (np. zamykasz stronę albo wysyłasz formularz). Możesz to zrobić w każdej chwili bez podania przyczyny.",
        "Wycena, odpowiedzi czatu i raport z audytu nie są ofertą w rozumieniu Kodeksu cywilnego. Umowę na zaprojektowanie lub wykonanie strony zawieramy osobno, na warunkach uzgodnionych indywidualnie.",
      ],
    },
    {
      h: "§3. Wymagania techniczne",
      body: [
        "Do korzystania ze Strony potrzebujesz urządzenia z dostępem do internetu i aktualnej przeglądarki z włączonym JavaScriptem i cookies niezbędnymi. Do kontaktu potrzebny jest adres e-mail lub konto w wybranym komunikatorze.",
        "Korzystanie z internetu wiąże się z typowymi zagrożeniami, takimi jak złośliwe oprogramowanie czy phishing. Strona działa przez szyfrowane połączenie HTTPS, a formularze są chronione przed botami.",
      ],
    },
    {
      h: "§4. Zasady korzystania",
      body: [
        "Zabronione jest przesyłanie treści bezprawnych, spamu i szkodliwego kodu, próby obejścia zabezpieczeń oraz masowe, automatyczne korzystanie z formularza, czatu i audytu. Narzędzia mają limity zapytań chroniące je przed nadużyciami.",
        "Audyt analizuje wyłącznie publicznie dostępne informacje o wskazanej stronie. Nie używaj go w sposób naruszający prawa innych osób.",
        "Treści i projekty na Stronie są chronione prawem autorskim. Bez mojej zgody nie wolno ich kopiować ani rozpowszechniać poza dozwolonym użytkiem.",
      ],
    },
    {
      h: "§5. Czat AI i audyt",
      body: [
        "Odpowiedzi czatu generuje sztuczna inteligencja i mogą zawierać błędy. Mają charakter informacyjny i nie są wiążącą ofertą ani poradą prawną. Wiążące są tylko ustalenia, które potwierdzę osobiście, np. e-mailem.",
        "Wynik audytu jest automatyczny i orientacyjny. Zależy od tego, co sprawdzana strona pokazuje w chwili audytu, i nie zastępuje pełnej analizy.",
      ],
    },
    {
      h: "§6. Odpowiedzialność",
      body: [
        "Dbam o to, żeby Strona działała bez przerw, ale mogą zdarzyć się przerwy techniczne. W granicach dopuszczalnych przez prawo nie odpowiadam za decyzje podjęte wyłącznie na podstawie odpowiedzi czatu lub wyniku audytu. Nie wyłącza to odpowiedzialności wobec konsumentów w zakresie, w jakim przepisy na to nie pozwalają.",
      ],
    },
    {
      h: "§7. Reklamacje",
      body: [
        "Reklamacje dotyczące działania Strony wyślij na [{email}](mailto:{email}). Opisz problem i podaj kontakt do odpowiedzi. Odpowiem w ciągu 14 dni.",
        "Konsument może skorzystać z pozasądowych sposobów rozpatrywania sporów, np. pomocy miejskiego lub powiatowego rzecznika konsumentów albo Inspekcji Handlowej.",
      ],
    },
    {
      h: "§8. Dane osobowe",
      body: [
        "Zasady przetwarzania danych osobowych i używania cookies opisuje [Polityka prywatności](/polityka-prywatnosci/).",
      ],
    },
    {
      h: "§9. Postanowienia końcowe",
      body: [
        "Mogę zmienić Regulamin z ważnych przyczyn, np. zmiany przepisów lub usług. Zmiana obowiązuje od opublikowania nowej wersji na Stronie i nie dotyczy usług rozpoczętych wcześniej.",
        "W sprawach nieuregulowanych stosuje się prawo polskie. Nie ogranicza to praw konsumenta wynikających z bezwzględnie obowiązujących przepisów państwa jego zamieszkania.",
        "Regulamin obowiązuje od 16 października 2026 r.",
      ],
    },
  ],
};

/* ---------------------------------------------------------------- EN */

const cookieRowsEn = [
  ["dw_lang", "deweb.studio", "Remembers the language version you chose", "1 year", "Necessary"],
  ["cookieyes-consent", "CookieYes", "Stores your choice in the cookie banner", "1 year", "Necessary"],
  ["dw_chat (sessionStorage)", "deweb.studio", "Keeps your chat conversation when you move to another page", "Until the tab is closed", "Necessary"],
  ["dw_chat_teaser, dw-checklist (localStorage)", "deweb.studio", "Shows the chat greeting at most once a day; keeps your checklist answers", "Until cleared in the browser", "Functional"],
  ["Cloudflare Turnstile", "Cloudflare", "Tells people from bots on the form, chat and audit", "Session", "Necessary"],
  ["_ga, _ga_*", "Google Analytics", "Visit statistics: where visitors come from and what they read", "Up to 2 years", "Analytics"],
  ["_clck, _clsk, CLID, MUID", "Microsoft Clarity", "Click maps and session recordings (mouse movement, scrolling, clicks)", "_clsk 1 day, others up to 1 year", "Analytics"],
  ["_gcl_au", "Google Ads", "Measures whether a Google ad led to an enquiry", "90 days", "Advertising"],
  ["_fbp, fr", "Meta (Facebook, Instagram)", "Ad measurement and remarketing on Facebook and Instagram", "Up to 90 days", "Advertising"],
];

const privacyEn: LegalDoc = {
  meta: {
    title: "Privacy and Cookie Policy — Deweb studio",
    description: "How deweb.studio handles personal data from the quote form, AI chat and website audit, and which cookies it uses.",
  },
  eyebrow: "Legal",
  title: "Privacy and Cookie Policy",
  lead: "In plain words: what data this website collects, why, who I share it with and what your rights are.",
  sections: [
    {
      h: "1. Data controller",
      body: [
        "The controller of your personal data is **{name}**, trading as Deweb studio, {address}, Polish tax ID (NIP) {nip} (“I” or “the Controller”).",
        "For anything about your personal data, write to [{email}](mailto:{email}). I have not appointed a data protection officer because I am not required to.",
      ],
    },
    {
      h: "2. What data I collect, why and on what basis",
      body: [
        "**Quote form.** Your name, the contact method you chose and the contact itself (email, Telegram or Instagram handle, WhatsApp number), your project description and the page language. I use them to reply, prepare a quote and, if we agree, sign a contract. Legal basis: Art. 6(1)(b) GDPR (steps taken at your request before entering into a contract) or, when your message is not about a contract, Art. 6(1)(f) GDPR (my legitimate interest in answering messages).",
        "**AI assistant chat.** The conversation and, if you give them, your name, email or other contact and a convenient time for a call. The chat answers questions, books a free video call (Google Meet) or passes me a request to get in touch. Legal basis: Art. 6(1)(b) and (f) GDPR. Replies are generated by an AI model from Anthropic, so the conversation is sent to Anthropic. I do not store conversations on the server, except when you book a call or ask to be contacted: then the conversation and your contact details go to my CRM and a notification, and when you book, Google Calendar emails you an invitation.",
        "**Free website audit.** The address of the website being checked and the audit result and, if you want the full report, your email or Instagram or Telegram handle. Legal basis: Art. 6(1)(b) GDPR (running the audit and giving you the report) and Art. 6(1)(f) GDPR (one message with advice on the result). You can object at any time by replying.",
        "**“Built your site with AI?” checklist.** Your answers stay in your browser and are not sent to me.",
        "**Email and messengers.** Whatever you give me in our correspondence. Legal basis: Art. 6(1)(b) or (f) GDPR.",
        "**Working together.** If we sign a contract, I process the data needed to perform it (Art. 6(1)(b) GDPR) and to issue invoices and meet tax obligations (Art. 6(1)(c) GDPR).",
        "**Security and spam protection.** Your IP address, date and time, the page visited and browser details are kept in server logs. The IP address is also used for limits that protect the form, chat and audit from abuse (stored as a hash and deleted within 24 hours), and Cloudflare Turnstile checks that you are human. Legal basis: Art. 6(1)(f) GDPR (website security).",
        "**Statistics without personal data.** On my own server I count events such as “form opened” or “enquiry sent” (only the number and the page language, no IP and no cookies).",
        "**Analytics and advertising, only with your consent.** Google Analytics, Microsoft Clarity, Google Ads and Meta Pixel show me how visitors use the site and whether ads work. Clarity records mouse movement, scrolling and clicks; text typed into form fields is masked. These tools start only after you agree in the banner. Legal basis: Art. 6(1)(a) GDPR and Art. 399 of the Polish Electronic Communications Law.",
      ],
    },
    {
      h: "3. Who I share data with",
      body: [
        "I do not sell data. I use services from companies that process it on my behalf or as separate controllers:",
        [
          "**LH.pl sp. z o.o.** (Poznań, Poland): website and server hosting.",
          "**Google** (Google Ireland Ltd, Google LLC): Gmail (enquiry notifications), Google Calendar and Meet (video calls), Google Tag Manager, Google Analytics, Google Ads.",
          "**Telegram** (Telegram FZ-LLC): notifications about new enquiries in my private chat.",
          "**Anthropic PBC** (USA): the AI model that answers in the chat. Under Anthropic’s terms, API data is not used to train models.",
          "**Cloudflare, Inc.** (USA): Turnstile bot protection.",
          "**CookieYes Limited** (UK): the cookie banner and a record of your consent.",
          "**Microsoft Ireland Operations Ltd**: Microsoft Clarity (with consent).",
          "**Meta Platforms Ireland Ltd**: Meta Pixel (with consent).",
          "**Tina (SSW)**: the server the website’s images load from, so it sees your IP address.",
          "Public authorities, when the law requires it.",
        ],
      ],
    },
    {
      h: "4. Transfers outside the EEA",
      body: [
        "Google, Microsoft, Meta, Cloudflare and Anthropic may process data in the USA. The transfer is based on the European Commission’s adequacy decision (EU-US Data Privacy Framework) for certified companies or on the Commission’s standard contractual clauses. The UK has an adequacy decision. Telegram notifications are transferred outside the EEA to handle your enquiry (Art. 49(1)(b) GDPR).",
      ],
    },
    {
      h: "5. How long I keep data",
      body: [
        [
          "Enquiries that do not lead to a project: up to 12 months after our last contact.",
          "Client data: for as long as we work together, then until legal claims are time-barred; accounting records for 5 years from the end of the tax year.",
          "Audit reports: up to 12 months.",
          "Chat conversation in your browser: until you close the tab.",
          "IP-based spam limits: up to 24 hours.",
          "Analytics data: up to 14 months; cookies as listed in the table below.",
          "Data processed on the basis of consent: until you withdraw it.",
        ],
      ],
    },
    {
      h: "6. Your rights",
      body: [
        "You have the right to access, rectify and erase your data, to restrict processing and to data portability. You can object at any time to processing based on my legitimate interest and withdraw your cookie consent (the “Cookie settings” link in the footer). Withdrawing consent does not affect processing that took place before.",
        "To use these rights, write to [{email}](mailto:{email}). I will reply within one month.",
        "You can also lodge a complaint with the Polish data protection authority, the President of the Personal Data Protection Office (ul. Stawki 2, 00-193 Warsaw, [uodo.gov.pl](https://uodo.gov.pl)), or with the authority in your country.",
      ],
    },
    {
      h: "7. Voluntary data and automated decisions",
      body: [
        "Giving your data is voluntary, but without a contact I cannot reply to your enquiry or send the report. I do not make decisions about you based solely on automated processing, including profiling, that have legal effects. The AI assistant only answers questions; decisions about working together are mine.",
      ],
    },
    {
      h: "8. Cookies and similar technologies",
      body: [
        "Cookies are small files stored in your browser. The site also uses browser storage (localStorage and sessionStorage), which works in a similar way. Necessary ones are always on because the site does not work properly without them. Analytics and advertising ones start only after you agree in the banner.",
        { head: ["Name", "Provider", "Purpose", "Duration", "Type"], rows: cookieRowsEn },
        "You can change or withdraw consent at any time via the “Cookie settings” link in the footer. You can also delete or block cookies in your browser settings, but some features may then stop working. Providers may rename their cookies; the banner shows the current list.",
      ],
    },
    {
      h: "9. Changes to this policy",
      body: [
        "When the tools on the site or the law change, I will update this policy and the date at the top of the page. The Polish version is the binding one.",
      ],
    },
  ],
};

const termsEn: LegalDoc = {
  meta: {
    title: "Terms of Service — Deweb studio",
    description: "Rules for using deweb.studio and its free services: the quote form, AI chat, website audit and checklist.",
  },
  eyebrow: "Legal",
  title: "Terms of Service",
  lead: "Rules for using deweb.studio and its free tools.",
  sections: [
    {
      h: "§1. General",
      body: [
        "These Terms set out the rules for using deweb.studio (the “Website”) and the services provided on it electronically, in line with the Polish Act of 18 July 2002 on providing services by electronic means.",
        "The service provider is **{name}**, trading as Deweb studio, {address}, Polish tax ID (NIP) {nip}, email: [{email}](mailto:{email}).",
        "By using the Website you accept these Terms. They are available free of charge at this address at any time, and you can save or print them.",
      ],
    },
    {
      h: "§2. Services",
      body: [
        "The Website offers, free of charge:",
        [
          "browsing content: services, projects, reviews and the blog;",
          "a quote request form;",
          "an AI assistant chat that answers questions and lets you book a free video call;",
          "a free website audit with a report;",
          "the “Built your site with AI?” checklist.",
        ],
        "The agreement for a service starts when you begin using it and ends when you stop (for example, when you close the page or send the form). You can stop at any time without giving a reason.",
        "Quotes, chat replies and audit reports are not offers within the meaning of the Polish Civil Code. A contract for designing or building a website is concluded separately on individually agreed terms.",
      ],
    },
    {
      h: "§3. Technical requirements",
      body: [
        "To use the Website you need a device with internet access and an up-to-date browser with JavaScript and necessary cookies enabled. To be contacted, you need an email address or an account in the messenger you choose.",
        "Using the internet carries common risks such as malware and phishing. The Website uses an encrypted HTTPS connection and its forms are protected against bots.",
      ],
    },
    {
      h: "§4. Acceptable use",
      body: [
        "You may not send unlawful content, spam or malicious code, try to bypass security, or use the form, chat and audit in bulk or automatically. The tools have request limits to protect them from abuse.",
        "The audit analyses only publicly available information about the website you enter. Do not use it in a way that infringes other people’s rights.",
        "The content and designs on the Website are protected by copyright. You may not copy or distribute them without my permission, except as allowed by law.",
      ],
    },
    {
      h: "§5. AI chat and audit",
      body: [
        "Chat replies are generated by artificial intelligence and may contain mistakes. They are for information only and are not a binding offer or legal advice. Only arrangements I confirm personally, for example by email, are binding.",
        "The audit result is automatic and indicative. It depends on what the checked website shows at the time and does not replace a full review.",
      ],
    },
    {
      h: "§6. Liability",
      body: [
        "I do my best to keep the Website running, but technical breaks can happen. To the extent permitted by law, I am not liable for decisions made solely on the basis of chat replies or audit results. This does not limit liability towards consumers where the law does not allow it.",
      ],
    },
    {
      h: "§7. Complaints",
      body: [
        "Send complaints about how the Website works to [{email}](mailto:{email}). Describe the problem and give a contact for the reply. I will reply within 14 days.",
        "Consumers can use out-of-court dispute resolution, for example the help of a local consumer ombudsman.",
      ],
    },
    {
      h: "§8. Personal data",
      body: [
        "How personal data and cookies are handled is described in the [Privacy Policy](/en/privacy-policy/).",
      ],
    },
    {
      h: "§9. Final provisions",
      body: [
        "I may change these Terms for important reasons, such as changes in the law or in the services. A change applies from the moment the new version is published on the Website and does not affect services already started.",
        "Polish law applies to matters not covered here. This does not limit consumer rights under mandatory laws of the country where the consumer lives. The Polish version is the binding one.",
        "These Terms apply from 16 October 2026.",
      ],
    },
  ],
};

/* ---------------------------------------------------------------- UA */

const cookieRowsUa = [
  ["dw_lang", "deweb.studio", "Запам’ятовує обрану мовну версію", "1 рік", "Необхідні"],
  ["cookieyes-consent", "CookieYes", "Зберігає ваш вибір у банері cookies", "1 рік", "Необхідні"],
  ["dw_chat (sessionStorage)", "deweb.studio", "Зберігає розмову в чаті, коли ви переходите на іншу сторінку", "До закриття вкладки", "Необхідні"],
  ["dw_chat_teaser, dw-checklist (localStorage)", "deweb.studio", "Привітання чату не частіше ніж раз на добу; ваші відповіді в чек-листі", "Доки ви не видалите їх у браузері", "Функціональні"],
  ["Cloudflare Turnstile", "Cloudflare", "Відрізняє людей від ботів у формі, чаті й аудиті", "Сесія", "Необхідні"],
  ["_ga, _ga_*", "Google Analytics", "Статистика відвідувань: звідки приходять і що читають", "До 2 років", "Аналітичні"],
  ["_clck, _clsk, CLID, MUID", "Microsoft Clarity", "Мапи кліків і записи сесій (рух миші, прокрутка, кліки)", "_clsk 1 день, решта до 1 року", "Аналітичні"],
  ["_gcl_au", "Google Ads", "Показує, чи реклама Google привела до заявки", "90 днів", "Рекламні"],
  ["_fbp, fr", "Meta (Facebook, Instagram)", "Вимірювання реклами й ремаркетинг у Facebook та Instagram", "До 90 днів", "Рекламні"],
];

const privacyUa: LegalDoc = {
  meta: {
    title: "Політика конфіденційності та cookies — Deweb studio",
    description: "Як deweb.studio обробляє персональні дані з форми, AI-чату й аудиту сайту та які cookies використовує.",
  },
  eyebrow: "Документи",
  title: "Політика конфіденційності та cookies",
  lead: "Коротко і по суті: які дані збирає цей сайт, навіщо, кому я їх передаю і які у вас права.",
  sections: [
    {
      h: "1. Адміністратор даних",
      body: [
        "Адміністратор ваших персональних даних — **{name}**, що веде діяльність під назвою Deweb studio, {address}, NIP {nip} (далі «я» або «Адміністратор»).",
        "З усіх питань щодо персональних даних пишіть на [{email}](mailto:{email}). Інспектора із захисту даних я не призначав, бо такого обов’язку не маю.",
      ],
    },
    {
      h: "2. Які дані я збираю, навіщо і на якій підставі",
      body: [
        "**Форма запиту на прорахунок.** Ім’я, обраний спосіб зв’язку і сам контакт (email, нік у Telegram чи Instagram, номер WhatsApp), опис проєкту і мова сторінки. Використовую їх, щоб відповісти, підготувати прорахунок і, якщо домовимося, укласти договір. Підстава: ст. 6(1)(b) GDPR (дії до укладення договору на ваш запит), а якщо повідомлення не стосується договору, ст. 6(1)(f) GDPR (мій законний інтерес відповідати на повідомлення).",
        "**Чат з AI-асистентом.** Текст розмови, а якщо ви їх вкажете, ще ім’я, email чи інший контакт і зручний час для дзвінка. Чат відповідає на запитання, бронює безкоштовний відеодзвінок (Google Meet) або передає мені прохання зв’язатися. Підстава: ст. 6(1)(b) і (f) GDPR. Відповіді генерує AI-модель компанії Anthropic, тому текст розмови надсилається їй. На сервері я розмови не зберігаю. Зберігаю їх лише тоді, коли ви бронюєте дзвінок або просите зв’язатися: тоді розмова й контакти потрапляють у мою CRM і сповіщення, а під час бронювання Google Календар надсилає вам запрошення на email.",
        "**Безкоштовний аудит сайту.** Адреса сайту, який ви перевіряєте, і результат аудиту, а якщо ви хочете повний звіт, ваш email або нік в Instagram чи Telegram. Підстава: ст. 6(1)(b) GDPR (проведення аудиту і надання звіту) та ст. 6(1)(f) GDPR (одне повідомлення з порадою щодо результату). Ви можете заперечити проти цього будь-коли, просто відповівши на лист.",
        "**Чек-лист «Сайт зробив AI?».** Ваші відповіді лишаються лише у вашому браузері й мені не надсилаються.",
        "**Листування й месенджери.** Дані, які ви надаєте у листуванні. Підстава: ст. 6(1)(b) або (f) GDPR.",
        "**Співпраця.** Якщо ми укладемо договір, я обробляю дані, потрібні для його виконання (ст. 6(1)(b) GDPR), а також для рахунків і податкової звітності (ст. 6(1)(c) GDPR).",
        "**Безпека і захист від спаму.** IP-адреса, дата й час, відкрита сторінка і дані браузера потрапляють у журнали сервера. IP також використовується для лімітів, що захищають форму, чат і аудит від зловживань (зберігається як хеш і видаляється щонайпізніше за 24 години), а Cloudflare Turnstile перевіряє, що ви людина. Підстава: ст. 6(1)(f) GDPR (безпека сайту).",
        "**Статистика без персональних даних.** На власному сервері я рахую події на кшталт «відкрили форму» чи «надіслали заявку» (лише кількість і мова сторінки, без IP і без cookies).",
        "**Аналітика й реклама, лише за згодою.** Google Analytics, Microsoft Clarity, Google Ads і Meta Pixel показують мені, як відвідувачі користуються сайтом і чи працює реклама. Clarity записує рух миші, прокрутку й кліки; текст, який ви вводите у поля форм, маскується. Ці інструменти запускаються лише після вашої згоди в банері. Підстава: ст. 6(1)(a) GDPR і ст. 399 польського Закону про електронні комунікації.",
      ],
    },
    {
      h: "3. Кому я передаю дані",
      body: [
        "Я не продаю дані. Користуюся сервісами компаній, які обробляють їх від мого імені або як окремі адміністратори:",
        [
          "**LH.pl sp. z o.o.** (Познань, Польща): хостинг сайту й сервера.",
          "**Google** (Google Ireland Ltd, Google LLC): Gmail (сповіщення про заявки), Google Календар і Meet (відеодзвінки), Google Tag Manager, Google Analytics, Google Ads.",
          "**Telegram** (Telegram FZ-LLC): сповіщення про нові заявки в моєму приватному чаті.",
          "**Anthropic PBC** (США): AI-модель, яка відповідає в чаті. За умовами Anthropic дані з API не використовуються для навчання моделей.",
          "**Cloudflare, Inc.** (США): Turnstile, захист від ботів.",
          "**CookieYes Limited** (Велика Британія): банер cookies і запис вашої згоди.",
          "**Microsoft Ireland Operations Ltd**: Microsoft Clarity (за згодою).",
          "**Meta Platforms Ireland Ltd**: Meta Pixel (за згодою).",
          "**Tina (SSW)**: сервер, з якого завантажуються фото на сайті, тому він бачить вашу IP-адресу.",
          "Державні органи, коли цього вимагає закон.",
        ],
      ],
    },
    {
      h: "4. Передача даних за межі ЄЕЗ",
      body: [
        "Google, Microsoft, Meta, Cloudflare і Anthropic можуть обробляти дані в США. Підстава: рішення Європейської комісії про належний рівень захисту (EU-US Data Privacy Framework) для сертифікованих компаній або стандартні договірні положення, затверджені Комісією. Для Великої Британії є рішення про належний рівень захисту. Сповіщення через Telegram передаються за межі ЄЕЗ, щоб опрацювати вашу заявку (ст. 49(1)(b) GDPR).",
      ],
    },
    {
      h: "5. Як довго я зберігаю дані",
      body: [
        [
          "Заявки, після яких співпраці не було: до 12 місяців від останнього контакту.",
          "Дані клієнтів: поки триває співпраця, а потім до спливу строків позовної давності; бухгалтерські документи 5 років від кінця податкового року.",
          "Звіти аудиту: до 12 місяців.",
          "Розмова з чатом у браузері: до закриття вкладки.",
          "Антиспам-ліміти за IP: до 24 годин.",
          "Дані аналітики: до 14 місяців; cookies згідно з таблицею нижче.",
          "Дані, які обробляються за згодою: доки ви її не відкличете.",
        ],
      ],
    },
    {
      h: "6. Ваші права",
      body: [
        "Ви маєте право на доступ до своїх даних, їх виправлення, видалення, обмеження обробки та перенесення. Ви можете будь-коли заперечити проти обробки на підставі мого законного інтересу і відкликати згоду на cookies (посилання «Налаштування cookies» у футері). Відкликання згоди не впливає на законність обробки до того.",
        "Щоб скористатися правами, напишіть на [{email}](mailto:{email}). Відповім щонайпізніше протягом місяця.",
        "Також ви можете подати скаргу до Голови Управління із захисту персональних даних Польщі (UODO, ul. Stawki 2, 00-193 Warszawa, [uodo.gov.pl](https://uodo.gov.pl)) або до органу у вашій країні.",
      ],
    },
    {
      h: "7. Добровільність і автоматичні рішення",
      body: [
        "Надавати дані добровільно, але без контакту я не зможу відповісти на заявку чи надіслати звіт. Я не ухвалюю щодо вас рішень лише на основі автоматичної обробки, зокрема профілювання, які мали б юридичні наслідки. AI-асистент лише відповідає на запитання; рішення про співпрацю ухвалюю я.",
      ],
    },
    {
      h: "8. Cookies та схожі технології",
      body: [
        "Cookies — це невеликі файли, які зберігаються в браузері. Сайт також використовує пам’ять браузера (localStorage і sessionStorage), яка працює схоже. Необхідні працюють завжди, бо без них сайт не працює як слід. Аналітичні й рекламні вмикаються лише після вашої згоди в банері.",
        { head: ["Назва", "Постачальник", "Мета", "Строк", "Тип"], rows: cookieRowsUa },
        "Змінити або відкликати згоду можна будь-коли через посилання «Налаштування cookies» у футері. Cookies також можна видалити чи заблокувати в налаштуваннях браузера, але тоді частина функцій може не працювати. Постачальники можуть змінювати назви своїх файлів; актуальний перелік показує банер.",
      ],
    },
    {
      h: "9. Зміни політики",
      body: [
        "Коли зміняться інструменти на сайті або закон, я оновлю цю політику й дату вгорі сторінки. Обов’язковою є польська версія.",
      ],
    },
  ],
};

const termsUa: LegalDoc = {
  meta: {
    title: "Правила користування — Deweb studio",
    description: "Правила користування сайтом deweb.studio та його безкоштовними сервісами: формою, AI-чатом, аудитом сайту й чек-листом.",
  },
  eyebrow: "Документи",
  title: "Правила користування сайтом",
  lead: "Правила користування сайтом deweb.studio і його безкоштовними інструментами.",
  sections: [
    {
      h: "§1. Загальні положення",
      body: [
        "Ці Правила визначають умови користування сайтом deweb.studio (далі «Сайт») і послугами, які надаються на ньому електронним способом, відповідно до польського Закону від 18 липня 2002 р. про надання послуг електронним способом.",
        "Постачальник послуг — **{name}**, що веде діяльність під назвою Deweb studio, {address}, NIP {nip}, email: [{email}](mailto:{email}).",
        "Користуючись Сайтом, ви приймаєте ці Правила. Вони безкоштовно доступні за цією адресою в будь-який час, їх можна зберегти або роздрукувати.",
      ],
    },
    {
      h: "§2. Послуги",
      body: [
        "На Сайті безкоштовно доступні:",
        [
          "перегляд вмісту: послуг, робіт, відгуків і блогу;",
          "форма запиту на прорахунок;",
          "чат з AI-асистентом, який відповідає на запитання й дає змогу забронювати безкоштовний відеодзвінок;",
          "безкоштовний аудит сайту зі звітом;",
          "чек-лист «Сайт зробив AI?».",
        ],
        "Договір про надання послуги укладається, коли ви починаєте нею користуватися, і завершується, коли припиняєте (наприклад, закриваєте сторінку або надсилаєте форму). Зробити це можна будь-коли без пояснення причин.",
        "Прорахунок, відповіді чату і звіт аудиту не є офертою в розумінні Цивільного кодексу Польщі. Договір на дизайн чи розробку сайту укладається окремо, на індивідуально погоджених умовах.",
      ],
    },
    {
      h: "§3. Технічні вимоги",
      body: [
        "Для користування Сайтом потрібен пристрій з доступом до інтернету й актуальний браузер з увімкненим JavaScript і необхідними cookies. Для зв’язку потрібна email-адреса або акаунт в обраному месенджері.",
        "Користування інтернетом пов’язане з типовими загрозами, як-от шкідливе ПЗ чи фішинг. Сайт працює через зашифроване з’єднання HTTPS, а форми захищені від ботів.",
      ],
    },
    {
      h: "§4. Правила користування",
      body: [
        "Заборонено надсилати незаконний вміст, спам і шкідливий код, намагатися обійти захист, а також масово чи автоматично використовувати форму, чат і аудит. Інструменти мають ліміти запитів, що захищають їх від зловживань.",
        "Аудит аналізує лише загальнодоступну інформацію про вказаний сайт. Не використовуйте його так, щоб порушувати права інших людей.",
        "Вміст і дизайни на Сайті захищені авторським правом. Копіювати чи поширювати їх без моєї згоди не можна, крім випадків, дозволених законом.",
      ],
    },
    {
      h: "§5. AI-чат і аудит",
      body: [
        "Відповіді чату генерує штучний інтелект, і вони можуть містити помилки. Вони мають інформаційний характер і не є обов’язковою пропозицією чи юридичною порадою. Обов’язковими є лише домовленості, які я підтверджую особисто, наприклад листом.",
        "Результат аудиту автоматичний і орієнтовний. Він залежить від того, що показує сайт у момент перевірки, і не замінює повного аналізу.",
      ],
    },
    {
      h: "§6. Відповідальність",
      body: [
        "Я дбаю, щоб Сайт працював без перерв, але технічні перерви можливі. У межах, дозволених законом, я не відповідаю за рішення, ухвалені лише на основі відповідей чату чи результату аудиту. Це не обмежує відповідальності перед споживачами там, де закон цього не дозволяє.",
      ],
    },
    {
      h: "§7. Скарги",
      body: [
        "Скарги щодо роботи Сайту надсилайте на [{email}](mailto:{email}). Опишіть проблему й залиште контакт для відповіді. Відповім протягом 14 днів.",
        "Споживач може скористатися позасудовими способами вирішення спорів, наприклад допомогою місцевого омбудсмена із захисту прав споживачів.",
      ],
    },
    {
      h: "§8. Персональні дані",
      body: [
        "Як обробляються персональні дані й cookies, описано в [Політиці конфіденційності](/ua/privacy-policy/).",
      ],
    },
    {
      h: "§9. Прикінцеві положення",
      body: [
        "Я можу змінити Правила з важливих причин, наприклад через зміну законодавства чи послуг. Зміна діє з моменту публікації нової версії на Сайті й не стосується послуг, розпочатих раніше.",
        "У питаннях, не врегульованих тут, застосовується право Польщі. Це не обмежує прав споживача за імперативними нормами країни, де він проживає. Обов’язковою є польська версія.",
        "Правила діють з 16 жовтня 2026 р.",
      ],
    },
  ],
};

export const LEGAL: Record<Locale, { privacy: LegalDoc; terms: LegalDoc }> = {
  pl: { privacy: privacyPl, terms: termsPl },
  en: { privacy: privacyEn, terms: termsEn },
  ua: { privacy: privacyUa, terms: termsUa },
};
