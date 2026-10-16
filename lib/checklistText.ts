/* =========================================================
   Чек-лист «Сайт зробив AI?» (/checklist/, /en/checklist/, /ua/checklist/): усі тексти сторінки.
   Приклади good/bad — маленькі HTML-макети (класи ck-* у app/globals.css), вставляються як є.
   ========================================================= */
import type { Locale } from "./i18n";

export type CkItem = { t: string; s: string; why: string; how: string[]; good: string; bad: string };
export type CkTexts = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; titleAccent: string; titleRest: string; lead: string };
  bar: { start: string; time: string; progress: string; problems: string; allGood: string; doneBad: string; doneOk: string; summaryBelow: string; yes: string; no: string; na: string };
  item: { how: string; example: string; good: string; bad: string; ask: string; yes: string; no: string; na: string; of: string };
  result: {
    empty: string; emptyText: string; notReady: string; notReadyText: string; unknownText: string;
    soFar: string; left: string; doneUnknown: string; doneOk: string; doneText: string;
    deepLabel: string; deepText: string; placeholder: string; go: string; reset: string;
  };
  /* відмінювання «пункт»: [1, 2–4, 5+] — для EN/PL свої форми */
  points: (n: number) => string;
  groups: { title: string; items: CkItem[] }[];
};

const LOCK = '<svg class="ck-ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2" fill="#17a46b"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#17a46b" stroke-width="1.6"/></svg>';
const WARN = '<svg class="ck-ic" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2l6.5 11.5h-13L8 2z" fill="#e2483d"/><rect x="7.3" y="6" width="1.4" height="4" fill="#fff"/><rect x="7.3" y="11" width="1.4" height="1.4" fill="#fff"/></svg>';
const m = (s: string) => `<span class="ck-mono">${s}</span>`;
const PHONE_OK = '<div class="ck-phone"><i class="h"></i><i></i><i></i><i style="width:70%"></i><i class="blk"></i><i></i></div>';
const PHONE_BAD = '<div class="ck-phone br"><i class="h"></i><i></i><i class="wide"></i><i></i><i style="width:130%"></i></div>';
const dial = (n: number, ok: boolean, label: string, verdict: string) =>
  `<div class="ck-score"><span class="ck-dial ${ok ? "g" : "r"}">${n}</span><span>${label}<br><b${ok ? "" : ' class="ck-bad-t"'}>${verdict}</b></span></div>`;
const tab = (fav: boolean, text: string) => `<div class="ck-tab"><span class="ck-fav${fav ? "" : " globe"}">${fav ? "D" : ""}</span><span>${text}</span></div>`;
const msg = (inner: string) => `<div class="ck-msg">${inner}</div>`;
const p404 = (title: string, btn: string) => `<div class="ck-404"><b>404</b>${title}<span class="ck-404-btn">${btn}</span></div>`;
const P404_BAD = '<div class="ck-404 plain"><b>404</b>This page could not be found.</div>';
const ext = (href: string, label: string) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;

/* ---------------- UA ---------------- */
const ua: CkTexts = {
  meta: {
    title: "Сайт зробив AI? Чек-лист із 13 пунктів — deweb studio",
    description: "Перевірте сайт, зроблений з AI, без знання коду: форма, швидкість, телефон, Google, прев’ю. Приклади як має бути і як ні.",
  },
  hero: {
    eyebrow: "Чек-лист для сайтів з AI",
    titleAccent: "Сайт зробив AI?",
    titleRest: "Перевірте 13 речей, без яких він не готовий",
    lead: "Без знання коду, з телефоном і браузером. Відкривайте пункт, дивіться приклад і відповідайте «Так» чи «Ні». Наприкінці побачите, що виправити.",
  },
  bar: { start: "Почніть з першого пункту", time: "≈ 15 хвилин на все", progress: "Перевірено {d} з {n}", problems: "Знайдено проблем: {b}", allGood: "Поки все добре", doneBad: "Готово: {b2} треба виправити", doneOk: "Готово: базу пройдено", summaryBelow: "Підсумок унизу сторінки", yes: "так", no: "ні", na: "не знаю" },
  item: { how: "Як перевірити", example: "Приклад", good: "Так має бути", bad: "Так не має бути", ask: "У вас так?", yes: "Так", no: "Ні", na: "Не знаю", of: "з" },
  result: {
    empty: "Пройдіть чек-лист, і тут з’явиться підсумок",
    emptyText: "Пункти з відповіддю «Ні» зберуться в список того, що треба виправити.",
    notReady: "Сайт ще не готовий: {b2} треба виправити",
    notReadyText: "Почніть з форми й швидкості: вони напряму впливають на заявки.",
    unknownText: "Ще {u} не вдалося перевірити самостійно.",
    soFar: "Поки без проблем",
    left: "Залишилось: {l}.",
    doneUnknown: "База в порядку, але {u} під питанням",
    doneOk: "Базу пройдено. Тепер перевірте глибше",
    doneText: "Ці пункти показують, що сайт працює. Автоматична перевірка покаже SEO, безпеку і швидкість детально.",
    deepLabel: "Повна автоматична перевірка",
    deepText: "SEO, швидкість, безпека й аналітика за адресою сайту. Займає хвилину, безкоштовно.",
    placeholder: "вашсайт.com",
    go: "Перевірити повністю",
    reset: "Почати спочатку",
  },
  points: (n) => {
    const a = n % 10, b = n % 100;
    return `${n} ${a === 1 && b !== 11 ? "пункт" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "пункти" : "пунктів"}`;
  },
  groups: [
    { title: "Працює", items: [
      { t: "Сайт відкривається з замком (https)", s: "Одна адреса, без попереджень браузера",
        why: "Без замка браузер пише «Небезпечно», і люди закривають сторінку. Google теж знижує такий сайт.",
        how: [`Введіть адресу сайту без ${m("https://")}, наприклад ${m("вашсайт.com")}`, `Потім з ${m("www.")} на початку`, "Обидва рази має відкритись одна адреса з замком"],
        good: `<div class="ck-addr">${LOCK}<span>вашсайт.com</span></div>`,
        bad: `<div class="ck-addr">${WARN}<span class="ck-warn">Небезпечно</span><span>http://вашсайт.com</span></div>` },
      { t: "Форма заявки реально доходить", s: "Найчастіша помилка сайтів з AI",
        why: "AI часто робить гарну форму з повідомленням «Дякуємо!», яка нікуди нічого не надсилає. Заявки клієнтів просто зникають.",
        how: ["Відкрийте сайт з телефона", "Заповніть форму своїми даними й надішліть", "Перевірте пошту (і папку «Спам») або месенджер: заявка має прийти за хвилину"],
        good: msg("<b>Нова заявка з сайту</b>Олена, +48 512 …<br>«Потрібен сайт для салону»"),
        bad: msg('<b>Дякуємо! Ми зв’яжемося з вами</b><span class="ck-quote">…а на пошту нічого не прийшло</span>') },
      { t: "Усі кнопки й посилання працюють", s: "Меню, кнопки, телефон, месенджери",
        why: `Кнопка, що веде на ${m("#")} або порожню сторінку, коштує вам клієнта, який уже вирішив звернутися.`,
        how: ["Натисніть кожен пункт меню і кожну кнопку", "На телефоні натисніть номер: має відкритись дзвінок", "Посилання на Instagram, Telegram, WhatsApp ведуть на ваш профіль, а не на головну соцмережі"],
        good: msg("Тап по <b class=\"ck-in\">+48 512 000 000</b> → відкривається дзвінок"),
        bad: msg(`Кнопка «Записатися» → ${m("вашсайт.com/#")}, нічого не відбувається`) },
      { t: "Сайт швидкий на телефоні", s: "Оцінка PageSpeed не червона",
        why: "Якщо сторінка вантажиться довше 3 секунд, більше половини людей з телефона її покидають.",
        how: [`Відкрийте ${ext("https://pagespeed.web.dev", "pagespeed.web.dev")}`, "Вставте адресу сайту, натисніть «Аналізувати»", "Дивіться оцінку «Мобільний»: зелена або помаранчева нормально, червона погано"],
        good: dial(92, true, "Мобільний", "Добре"),
        bad: dial(34, false, "Мобільний", "Повільно") },
      { t: "Неіснуюча сторінка не ламає сайт", s: "Є сторінка «не знайдено» з кнопкою на головну",
        why: "Люди потрапляють на старі або помилкові посилання. Порожня біла сторінка виглядає як зламаний сайт.",
        how: [`Допишіть до адреси щось випадкове: ${m("вашсайт.com/abc123")}`, "Має відкритись сторінка в дизайні сайту з кнопкою на головну"],
        good: p404("Такої сторінки немає", "На головну"),
        bad: P404_BAD },
    ] },
    { title: "Виглядає", items: [
      { t: "Нормально виглядає на телефоні", s: "Нічого не налазить і не їде вбік",
        why: "З телефона заходить 60–80% відвідувачів. Сайт, який гарний лише на комп’ютері, для них зламаний.",
        how: ["Прогорніть усі сторінки на своєму телефоні від верху до низу", "Сторінка не має рухатись вліво-вправо", "Відкрийте й закрийте меню, перевірте форму"],
        good: PHONE_OK, bad: PHONE_BAD },
      { t: "Немає чужого або вигаданого тексту", s: "Lorem ipsum, фейкові відгуки, чужі контакти",
        why: "AI заповнює порожнечу вигаданими цифрами, відгуками й нагородами. Клієнт, який це помітить, більше не повірить сайту.",
        how: ["Прочитайте весь текст, а не тільки заголовки", `Пошук Ctrl+F: ${m("lorem")}, ${m("example")}, ${m("John Doe")}`, "Кожна цифра й відгук мають бути справжніми"],
        good: msg("«12 років у Вроцлаві, 340 відгуків у Google»"),
        bad: msg('<span class="ck-strike">Понад 10 000 задоволених клієнтів</span><br><span class="ck-quote">Lorem ipsum dolor sit amet…</span>') },
      { t: "Картинки ваші й не важкі", s: "Без чужих логотипів і водяних знаків",
        why: "Чужі фото можуть принести претензії щодо авторських прав, а важкі картинки уповільнюють сайт.",
        how: ["Перегляньте всі зображення: це ваші фото або куплені чи безкоштовні стоки", "Немає водяних знаків і чужих логотипів", "Сторінка не вантажиться довго через картинки на мобільному інтернеті"],
        good: msg("Ваші фото команди й робіт, вага до ~300 КБ"),
        bad: msg('Фото з водяним знаком <b class="ck-in ck-bad-t">shutterstock</b>, 8 МБ') },
      { t: "Своя іконка сайту (favicon)", s: "Ваш значок у вкладці браузера",
        why: "Серед десятка вкладок людина шукає ваш сайт за значком. Стандартний значок конструктора виглядає недоробленим.",
        how: ["Подивіться на вкладку браузера", "Має бути ваш логотип або літера, а не глобус чи логотип конструктора"],
        good: tab(true, "Студія Усмішка — стоматолог…"), bad: tab(false, "Vite + React + TS") },
    ] },
    { title: "Знаходять і діляться", items: [
      { t: "Назва вкладки про ваш бізнес", s: "Не «Home», «React App» чи «My Site»",
        why: "Цей текст Google показує синім заголовком у пошуку. «React App» ніхто не натисне.",
        how: ["Відкрийте кожну сторінку і прочитайте назву у вкладці", "Назва має містити, що ви робите і де: послуга, місто, назва"],
        good: tab(true, "Стоматологія Усмішка — Вроцлав"), bad: tab(false, "React App") },
      { t: "Гарне прев’ю, коли надсилаєте посилання", s: "Картинка, назва й опис у месенджері",
        why: "Посилання з картинкою натискають у кілька разів частіше, ніж голу адресу.",
        how: ["Надішліть посилання на сайт собі в Telegram або WhatsApp", "Має з’явитись картка з картинкою, назвою й описом"],
        good: '<div class="ck-card"><div class="ck-card-img"></div><div class="ck-card-t"><b>Стоматологія Усмішка</b><span>Лікування й імплантація у Вроцлаві</span></div></div>',
        bad: msg('<span class="ck-bare">https://usmishka-dental.vercel.app</span>') },
      { t: "Google бачить сайт", s: "Додано в Google Search Console",
        why: "Без цього Google може тижнями не знати про сайт, а ви не бачите, за якими запитами вас шукають.",
        how: [`Додайте сайт у ${ext("https://search.google.com/search-console", "Google Search Console")}`, `Через тиждень наберіть у Google ${m("site:вашсайт.com")}`, "Мають показатись ваші сторінки"],
        good: '<div class="ck-serp"><span class="ck-serp-u">вашсайт.com</span><b>Стоматологія Усмішка — Вроцлав</b><span>Лікування, імплантація, гігієна…</span></div>',
        bad: `<div class="ck-serp"><span>За запитом ${m("site:вашсайт.com")} нічого не знайдено</span></div>` },
      { t: "Є статистика відвідувань", s: "Google Analytics або Microsoft Clarity",
        why: "Без статистики ви не знаєте, скільки людей приходить, звідки і де вони йдуть з сайту.",
        how: ["Попросіть доступ до Google Analytics або Clarity сайту", "Відкрийте сайт з телефона", "У звіті «У реальному часі» має з’явитись ваш візит"],
        good: msg("<b>Зараз на сайті: 1</b>Польща · мобільний · /"),
        bad: msg("«Статистика? Її немає»") },
    ] },
  ],
};

/* ---------------- PL ---------------- */
const pl: CkTexts = {
  meta: {
    title: "Stronę zrobiło AI? Checklista 13 punktów — deweb studio",
    description: "Sprawdź stronę zrobioną z AI bez znajomości kodu: formularz, szybkość, telefon, Google, podgląd linku. Przykłady jak ma być, a jak nie.",
  },
  hero: {
    eyebrow: "Checklista dla stron z AI",
    titleAccent: "Stronę zrobiło AI?",
    titleRest: "Sprawdź 13 rzeczy, bez których nie jest gotowa",
    lead: "Bez znajomości kodu, z telefonem i przeglądarką. Otwieraj punkt, zobacz przykład i odpowiedz „Tak” lub „Nie”. Na końcu zobaczysz, co poprawić.",
  },
  bar: { start: "Zacznij od pierwszego punktu", time: "≈ 15 minut na całość", progress: "Sprawdzono {d} z {n}", problems: "Znalezione problemy: {b}", allGood: "Na razie wszystko dobrze", doneBad: "Gotowe: do poprawy {b2}", doneOk: "Gotowe: podstawy zaliczone", summaryBelow: "Podsumowanie na dole strony", yes: "tak", no: "nie", na: "nie wiem" },
  item: { how: "Jak sprawdzić", example: "Przykład", good: "Tak ma być", bad: "Tak nie powinno być", ask: "Czy u Ciebie tak jest?", yes: "Tak", no: "Nie", na: "Nie wiem", of: "z" },
  result: {
    empty: "Przejdź checklistę, a tu pojawi się podsumowanie",
    emptyText: "Punkty z odpowiedzią „Nie” trafią na listę rzeczy do poprawy.",
    notReady: "Strona nie jest jeszcze gotowa: do poprawy {b2}",
    notReadyText: "Zacznij od formularza i szybkości: bezpośrednio wpływają na zapytania.",
    unknownText: "Nie udało się samodzielnie sprawdzić: {u}.",
    soFar: "Na razie bez problemów",
    left: "Zostało: {l}.",
    doneUnknown: "Podstawy w porządku, ale pod znakiem zapytania: {u}",
    doneOk: "Podstawy zaliczone. Teraz sprawdź dokładniej",
    doneText: "Te punkty pokazują, że strona działa. Automatyczny audyt pokaże szczegółowo SEO, bezpieczeństwo i szybkość.",
    deepLabel: "Pełny automatyczny audyt",
    deepText: "SEO, szybkość, bezpieczeństwo i analityka po adresie strony. Zajmuje minutę, za darmo.",
    placeholder: "twojastrona.pl",
    go: "Sprawdź dokładnie",
    reset: "Zacznij od nowa",
  },
  points: (n) => {
    const a = n % 10, b = n % 100;
    return `${n} ${n === 1 ? "punkt" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "punkty" : "punktów"}`;
  },
  groups: [
    { title: "Działa", items: [
      { t: "Strona otwiera się z kłódką (https)", s: "Jeden adres, bez ostrzeżeń przeglądarki",
        why: "Bez kłódki przeglądarka pokazuje „Niezabezpieczona” i ludzie zamykają stronę. Google też obniża taką stronę.",
        how: [`Wpisz adres strony bez ${m("https://")}, np. ${m("twojastrona.pl")}`, `Potem z ${m("www.")} na początku`, "Za każdym razem ma się otworzyć ten sam adres z kłódką"],
        good: `<div class="ck-addr">${LOCK}<span>twojastrona.pl</span></div>`,
        bad: `<div class="ck-addr">${WARN}<span class="ck-warn">Niezabezpieczona</span><span>http://twojastrona.pl</span></div>` },
      { t: "Formularz naprawdę dochodzi", s: "Najczęstszy błąd stron z AI",
        why: "AI często robi ładny formularz z komunikatem „Dziękujemy!”, który niczego nigdzie nie wysyła. Zapytania klientów po prostu znikają.",
        how: ["Otwórz stronę na telefonie", "Wypełnij formularz swoimi danymi i wyślij", "Sprawdź pocztę (też „Spam”) lub komunikator: zapytanie ma dojść w ciągu minuty"],
        good: msg("<b>Nowe zapytanie ze strony</b>Anna, +48 512 …<br>„Potrzebuję strony dla salonu”"),
        bad: msg('<b>Dziękujemy! Odezwiemy się</b><span class="ck-quote">…a na pocztę nic nie przyszło</span>') },
      { t: "Wszystkie przyciski i linki działają", s: "Menu, przyciski, telefon, komunikatory",
        why: `Przycisk prowadzący do ${m("#")} lub pustej strony kosztuje Cię klienta, który już zdecydował się napisać.`,
        how: ["Kliknij każdy punkt menu i każdy przycisk", "Na telefonie dotknij numeru: ma się otworzyć połączenie", "Linki do Instagrama, Telegrama, WhatsAppa prowadzą do Twojego profilu, a nie na stronę główną serwisu"],
        good: msg("Dotknięcie <b class=\"ck-in\">+48 512 000 000</b> → otwiera się połączenie"),
        bad: msg(`Przycisk „Umów się” → ${m("twojastrona.pl/#")}, nic się nie dzieje`) },
      { t: "Strona jest szybka na telefonie", s: "Wynik PageSpeed nie jest czerwony",
        why: "Jeśli strona ładuje się dłużej niż 3 sekundy, ponad połowa osób z telefonu ją opuszcza.",
        how: [`Otwórz ${ext("https://pagespeed.web.dev", "pagespeed.web.dev")}`, "Wklej adres strony i kliknij „Analizuj”", "Patrz na wynik „Komórka”: zielony lub pomarańczowy jest OK, czerwony źle"],
        good: dial(92, true, "Komórka", "Dobrze"),
        bad: dial(34, false, "Komórka", "Wolno") },
      { t: "Nieistniejąca podstrona nie psuje strony", s: "Jest strona „nie znaleziono” z przyciskiem na główną",
        why: "Ludzie trafiają na stare lub błędne linki. Pusta biała strona wygląda jak zepsuta witryna.",
        how: [`Dopisz do adresu coś losowego: ${m("twojastrona.pl/abc123")}`, "Ma się otworzyć strona w designie witryny z przyciskiem na główną"],
        good: p404("Nie ma takiej strony", "Na główną"),
        bad: P404_BAD },
    ] },
    { title: "Wygląda", items: [
      { t: "Dobrze wygląda na telefonie", s: "Nic nie nachodzi i nie ucieka w bok",
        why: "Z telefonu wchodzi 60–80% odwiedzających. Strona ładna tylko na komputerze jest dla nich zepsuta.",
        how: ["Przewiń wszystkie podstrony na swoim telefonie od góry do dołu", "Strona nie może przesuwać się w lewo i prawo", "Otwórz i zamknij menu, sprawdź formularz"],
        good: PHONE_OK, bad: PHONE_BAD },
      { t: "Nie ma cudzego ani wymyślonego tekstu", s: "Lorem ipsum, fałszywe opinie, cudze kontakty",
        why: "AI wypełnia pustkę wymyślonymi liczbami, opiniami i nagrodami. Klient, który to zauważy, przestanie ufać stronie.",
        how: ["Przeczytaj cały tekst, nie tylko nagłówki", `Szukaj Ctrl+F: ${m("lorem")}, ${m("example")}, ${m("Jan Kowalski")}`, "Każda liczba i opinia musi być prawdziwa"],
        good: msg("„12 lat we Wrocławiu, 340 opinii w Google”"),
        bad: msg('<span class="ck-strike">Ponad 10 000 zadowolonych klientów</span><br><span class="ck-quote">Lorem ipsum dolor sit amet…</span>') },
      { t: "Zdjęcia są Twoje i lekkie", s: "Bez cudzych logo i znaków wodnych",
        why: "Cudze zdjęcia mogą skończyć się roszczeniami o prawa autorskie, a ciężkie obrazy spowalniają stronę.",
        how: ["Przejrzyj wszystkie obrazy: Twoje zdjęcia albo kupione lub darmowe stocki", "Brak znaków wodnych i cudzych logo", "Strona nie ładuje się długo przez zdjęcia na mobilnym internecie"],
        good: msg("Twoje zdjęcia zespołu i realizacji, do ~300 KB"),
        bad: msg('Zdjęcie ze znakiem wodnym <b class="ck-in ck-bad-t">shutterstock</b>, 8 MB') },
      { t: "Własna ikona strony (favicon)", s: "Twój znak w karcie przeglądarki",
        why: "Wśród kilkunastu kart ludzie szukają Twojej strony po ikonie. Domyślna ikona kreatora wygląda na niedokończoną.",
        how: ["Spójrz na kartę przeglądarki", "Ma być Twoje logo lub litera, a nie globus czy logo kreatora"],
        good: tab(true, "Uśmiech — dentysta Wrocław…"), bad: tab(false, "Vite + React + TS") },
    ] },
    { title: "Znajdują i udostępniają", items: [
      { t: "Nazwa karty mówi o Twojej firmie", s: "Nie „Home”, „React App” czy „My Site”",
        why: "Ten tekst Google pokazuje jako niebieski tytuł w wynikach. W „React App” nikt nie kliknie.",
        how: ["Otwórz każdą podstronę i przeczytaj nazwę w karcie", "Nazwa ma mówić, co robisz i gdzie: usługa, miasto, nazwa"],
        good: tab(true, "Gabinet Uśmiech — dentysta Wrocław"), bad: tab(false, "React App") },
      { t: "Ładny podgląd, gdy wysyłasz link", s: "Obrazek, tytuł i opis w komunikatorze",
        why: "Link z obrazkiem klika się kilka razy częściej niż goły adres.",
        how: ["Wyślij link do strony sobie na Messengerze lub WhatsAppie", "Ma się pojawić karta z obrazkiem, tytułem i opisem"],
        good: '<div class="ck-card"><div class="ck-card-img"></div><div class="ck-card-t"><b>Gabinet Uśmiech</b><span>Leczenie i implanty we Wrocławiu</span></div></div>',
        bad: msg('<span class="ck-bare">https://usmiech-dental.vercel.app</span>') },
      { t: "Google widzi stronę", s: "Dodana do Google Search Console",
        why: "Bez tego Google może tygodniami nie wiedzieć o stronie, a Ty nie widzisz, po jakich frazach Cię szukają.",
        how: [`Dodaj stronę do ${ext("https://search.google.com/search-console", "Google Search Console")}`, `Po tygodniu wpisz w Google ${m("site:twojastrona.pl")}`, "Mają się pokazać Twoje podstrony"],
        good: '<div class="ck-serp"><span class="ck-serp-u">twojastrona.pl</span><b>Gabinet Uśmiech — dentysta Wrocław</b><span>Leczenie, implanty, higienizacja…</span></div>',
        bad: `<div class="ck-serp"><span>Dla zapytania ${m("site:twojastrona.pl")} nic nie znaleziono</span></div>` },
      { t: "Są statystyki odwiedzin", s: "Google Analytics lub Microsoft Clarity",
        why: "Bez statystyk nie wiesz, ile osób przychodzi, skąd i gdzie opuszczają stronę.",
        how: ["Poproś o dostęp do Google Analytics lub Clarity strony", "Otwórz stronę na telefonie", "W raporcie „Czas rzeczywisty” ma się pojawić Twoja wizyta"],
        good: msg("<b>Teraz na stronie: 1</b>Polska · telefon · /"),
        bad: msg("„Statystyki? Nie ma”") },
    ] },
  ],
};

/* ---------------- EN ---------------- */
const en: CkTexts = {
  meta: {
    title: "Website built with AI? A 13-point checklist — deweb studio",
    description: "Check a website built with AI without knowing code: form, speed, phone, Google, link preview. Examples of right and wrong.",
  },
  hero: {
    eyebrow: "Checklist for AI-built websites",
    titleAccent: "Built your site with AI?",
    titleRest: "Check 13 things it can’t launch without",
    lead: "No code needed, just your phone and a browser. Open each point, look at the example and answer Yes or No. At the end you’ll see what to fix.",
  },
  bar: { start: "Start with the first point", time: "≈ 15 minutes in total", progress: "Checked {d} of {n}", problems: "Problems found: {b}", allGood: "All good so far", doneBad: "Done: {b2} to fix", doneOk: "Done: the basics are covered", summaryBelow: "Summary at the bottom", yes: "yes", no: "no", na: "not sure" },
  item: { how: "How to check", example: "Example", good: "Right", bad: "Wrong", ask: "Is it like this on your site?", yes: "Yes", no: "No", na: "Not sure", of: "of" },
  result: {
    empty: "Go through the checklist and your summary will appear here",
    emptyText: "Points you answer No to will form a list of what to fix.",
    notReady: "Not ready yet: {b2} to fix",
    notReadyText: "Start with the form and speed: they directly affect enquiries.",
    unknownText: "You couldn’t check {u} on your own.",
    soFar: "No problems so far",
    left: "{l} left.",
    doneUnknown: "The basics look fine, with {u} still unclear",
    doneOk: "Basics covered. Now check deeper",
    doneText: "These points show the site works. The automatic check covers SEO, security and speed in detail.",
    deepLabel: "Full automatic check",
    deepText: "SEO, speed, security and analytics from your site’s address. Takes a minute, free.",
    placeholder: "yoursite.com",
    go: "Run a full check",
    reset: "Start over",
  },
  points: (n) => `${n} ${n === 1 ? "point" : "points"}`,
  groups: [
    { title: "Works", items: [
      { t: "The site opens with a padlock (https)", s: "One address, no browser warnings",
        why: "Without the padlock the browser says “Not secure” and people leave. Google ranks such sites lower too.",
        how: [`Type the address without ${m("https://")}, e.g. ${m("yoursite.com")}`, `Then with ${m("www.")} in front`, "Both times the same address with a padlock should open"],
        good: `<div class="ck-addr">${LOCK}<span>yoursite.com</span></div>`,
        bad: `<div class="ck-addr">${WARN}<span class="ck-warn">Not secure</span><span>http://yoursite.com</span></div>` },
      { t: "The contact form actually delivers", s: "The most common bug on AI-built sites",
        why: "AI often builds a nice form that says “Thank you!” and sends nothing anywhere. Client enquiries simply disappear.",
        how: ["Open the site on your phone", "Fill in the form with your details and send it", "Check your email (and Spam) or messenger: the enquiry should arrive within a minute"],
        good: msg("<b>New enquiry from the website</b>Anna, +48 512 …<br>“I need a site for my salon”"),
        bad: msg('<b>Thank you! We’ll be in touch</b><span class="ck-quote">…and nothing arrived in the inbox</span>') },
      { t: "Every button and link works", s: "Menu, buttons, phone, messengers",
        why: `A button that leads to ${m("#")} or an empty page costs you a client who had already decided to get in touch.`,
        how: ["Click every menu item and every button", "On a phone, tap the number: a call should start", "Instagram, Telegram and WhatsApp links lead to your profile, not the app’s home page"],
        good: msg("Tap <b class=\"ck-in\">+48 512 000 000</b> → a call starts"),
        bad: msg(`“Book now” → ${m("yoursite.com/#")}, nothing happens`) },
      { t: "The site is fast on a phone", s: "The PageSpeed score isn’t red",
        why: "If a page takes longer than 3 seconds to load, more than half of mobile visitors leave.",
        how: [`Open ${ext("https://pagespeed.web.dev", "pagespeed.web.dev")}`, "Paste your site address and click Analyze", "Look at the Mobile score: green or orange is fine, red is bad"],
        good: dial(92, true, "Mobile", "Good"),
        bad: dial(34, false, "Mobile", "Slow") },
      { t: "A missing page doesn’t break the site", s: "A “not found” page with a link home",
        why: "People land on old or mistyped links. A blank white page looks like a broken website.",
        how: [`Add something random to the address: ${m("yoursite.com/abc123")}`, "A page in the site’s design with a button to the home page should open"],
        good: p404("This page doesn’t exist", "Go home"),
        bad: P404_BAD },
    ] },
    { title: "Looks right", items: [
      { t: "Looks fine on a phone", s: "Nothing overlaps or slides sideways",
        why: "60–80% of visitors come from phones. A site that only looks good on a computer is broken for them.",
        how: ["Scroll every page on your phone from top to bottom", "The page must not move left and right", "Open and close the menu, try the form"],
        good: PHONE_OK, bad: PHONE_BAD },
      { t: "No placeholder or made-up text", s: "Lorem ipsum, fake reviews, someone else’s contacts",
        why: "AI fills gaps with invented numbers, reviews and awards. A client who notices will stop trusting the site.",
        how: ["Read all the text, not just headings", `Search with Ctrl+F: ${m("lorem")}, ${m("example")}, ${m("John Doe")}`, "Every number and review must be real"],
        good: msg("“12 years in Wrocław, 340 Google reviews”"),
        bad: msg('<span class="ck-strike">Over 10,000 happy clients</span><br><span class="ck-quote">Lorem ipsum dolor sit amet…</span>') },
      { t: "Images are yours and light", s: "No other brands’ logos or watermarks",
        why: "Other people’s photos can lead to copyright claims, and heavy images slow the site down.",
        how: ["Look through every image: your own photos, or bought or free stock", "No watermarks or other brands’ logos", "The page doesn’t take long to load on mobile data because of images"],
        good: msg("Your own team and project photos, up to ~300 KB"),
        bad: msg('Photo with a <b class="ck-in ck-bad-t">shutterstock</b> watermark, 8 MB') },
      { t: "Its own site icon (favicon)", s: "Your mark in the browser tab",
        why: "Among a dozen tabs people find your site by its icon. A builder’s default icon looks unfinished.",
        how: ["Look at the browser tab", "It should be your logo or letter, not a globe or a builder’s logo"],
        good: tab(true, "Smile Dental — Wrocław dentist…"), bad: tab(false, "Vite + React + TS") },
    ] },
    { title: "Found and shared", items: [
      { t: "The tab title is about your business", s: "Not “Home”, “React App” or “My Site”",
        why: "Google shows this text as the blue headline in search results. Nobody clicks “React App”.",
        how: ["Open every page and read the title in the tab", "It should say what you do and where: service, city, name"],
        good: tab(true, "Smile Dental — dentist in Wrocław"), bad: tab(false, "React App") },
      { t: "A good preview when you share a link", s: "Image, title and description in messengers",
        why: "Links with an image get clicked several times more often than a bare address.",
        how: ["Send the site link to yourself on WhatsApp or Messenger", "A card with an image, title and description should appear"],
        good: '<div class="ck-card"><div class="ck-card-img"></div><div class="ck-card-t"><b>Smile Dental</b><span>Treatment and implants in Wrocław</span></div></div>',
        bad: msg('<span class="ck-bare">https://smile-dental.vercel.app</span>') },
      { t: "Google can see the site", s: "Added to Google Search Console",
        why: "Without it Google may not know about the site for weeks, and you can’t see what people search to find you.",
        how: [`Add the site to ${ext("https://search.google.com/search-console", "Google Search Console")}`, `After a week, search Google for ${m("site:yoursite.com")}`, "Your pages should show up"],
        good: '<div class="ck-serp"><span class="ck-serp-u">yoursite.com</span><b>Smile Dental — dentist in Wrocław</b><span>Treatment, implants, hygiene…</span></div>',
        bad: `<div class="ck-serp"><span>No results for ${m("site:yoursite.com")}</span></div>` },
      { t: "Visits are tracked", s: "Google Analytics or Microsoft Clarity",
        why: "Without analytics you don’t know how many people come, where from, and where they leave.",
        how: ["Ask for access to the site’s Google Analytics or Clarity", "Open the site on your phone", "Your visit should appear in the Realtime report"],
        good: msg("<b>On the site now: 1</b>Poland · mobile · /"),
        bad: msg("“Analytics? There isn’t any”") },
    ] },
  ],
};

export const CHECKLIST: Record<Locale, CkTexts> = { en, pl, ua };
