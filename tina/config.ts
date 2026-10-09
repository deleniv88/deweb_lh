import { defineConfig } from "tinacms";

/* Гілка GitHub, у яку Tina зберігає зміни.
   На Vercel береться автоматично з VERCEL_GIT_COMMIT_REF. */
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const textarea = { component: "textarea" } as const;

/* Поле Schema.org: сирий JSON-LD. Порожнє = сайт підставить стандартну розмітку сам. */
const schemaField = {
  type: "string",
  name: "schema",
  label: "Schema.org (JSON-LD). Порожньо = стандартна розмітка",
  description:
    "Вставте JSON без тегу <script>, напр. {\"@context\":\"https://schema.org\",\"@type\":\"ProfessionalService\",…}. Можна масив з кількох об'єктів. Перевірка: validator.schema.org",
  ui: {
    component: "textarea",
    validate: (value?: string) => {
      if (!value || !value.trim()) return;
      try {
        const v = JSON.parse(value);
        if (typeof v !== "object" || v === null) return "Має бути JSON-об'єкт або масив";
      } catch (e) {
        return `Невалідний JSON: ${(e as Error).message}`;
      }
    },
  },
} as const;

/* Картинка для посилань (Open Graph / Twitter): що видно, коли сторінку кидають у месенджер чи соцмережу. */
const shareImageField = {
  type: "image",
  name: "shareImage",
  label: "Картинка для посилань (месенджери, соцмережі)",
  description:
    "1200×630 або 1800×945 (≈1.91:1), JPG до 300 КБ (інакше WhatsApp її не покаже). Порожньо = картинка з «Налаштування сайту».",
} as const;

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID, // з Tina Cloud
  token: process.env.TINA_TOKEN, // з Tina Cloud (read-only token)

  build: {
    outputFolder: "admin", // адмінка → /admin
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads", // усі фото лежать у public/uploads
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      /* ================= ГОЛОВНА ================= */
      {
        name: "home",
        label: "Головна сторінка (EN · PL · UA)",
        path: "content/home",
        format: "json",
        ui: {
          // кожна мова — окремий документ: home (EN), home-pl (PL), home-ua (UA)
          router: ({ document }) => {
            const f = document._sys.filename;
            return f === "home-pl" ? "/" : f === "home-ua" ? "/ua/" : "/en/";
          },
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: [
              { type: "string", name: "title", label: "Title (вкладка браузера, Google)" },
              { type: "string", name: "description", label: "Description (Google)", ui: textarea },
              shareImageField,
              schemaField,
            ],
          },
          {
            type: "object",
            name: "hero",
            label: "Hero (перший екран)",
            fields: [
              { type: "string", name: "titleLine1", label: "Заголовок — рядок 1" },
              { type: "string", name: "titleLine2", label: "Заголовок — рядок 2" },
              { type: "string", name: "titleAccent", label: "Виділені синім слова в заголовку, напр. «into clients»" },
              { type: "string", name: "lead", label: "Підзаголовок", ui: textarea },
              { type: "string", name: "ctaLabel", label: "Кнопка — текст" },
              { type: "string", name: "ctaHref", label: "Кнопка — посилання" },
              { type: "image", name: "photo", label: "Фото" },
              { type: "string", name: "photoAlt", label: "Фото — опис (alt)" },
              { type: "string", name: "name", label: "Підпис біля фото" },
              {
                type: "object",
                name: "stats",
                label: "Статистика",
                list: true,
                ui: { itemProps: (item) => ({ label: `${item?.value ?? ""} ${item?.label ?? ""}` }) },
                fields: [
                  { type: "string", name: "value", label: "Число (70+, 6…)" },
                  { type: "string", name: "label", label: "Підпис" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "work",
            label: "Recent work (самі кейси — у колекції «Кейси», галочка «Показувати на головній»)",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта" },
              { type: "string", name: "lead", label: "Підзаголовок (Enter = новий рядок)", ui: textarea },
              { type: "string", name: "buttonLabel", label: "Кнопка — текст" },
              { type: "string", name: "buttonHref", label: "Кнопка — посилання" },
            ],
          },
          {
            type: "object",
            name: "services",
            label: "Services (послуги)",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта (Enter = перенос на мобільному)", ui: textarea },
              { type: "string", name: "lead", label: "Підзаголовок" },
              { type: "string", name: "note", label: "Примітка під підзаголовком" },
              {
                type: "object",
                name: "items",
                label: "Картки послуг",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Нова послуга" }) },
                fields: [
                  { type: "string", name: "type", label: "Тип (One-page site)" },
                  { type: "string", name: "timeline", label: "Термін (Timeline: 2–3 weeks)" },
                  { type: "string", name: "name", label: "Назва" },
                  { type: "string", name: "description", label: "Опис", ui: textarea },
                  { type: "string", name: "features", label: "Пункти списку", list: true },
                  { type: "string", name: "buttonLabel", label: "Кнопка — текст" },
                  { type: "string", name: "buttonHref", label: "Кнопка — посилання" },
                  { type: "image", name: "image", label: "Картинка (748×421, кути вже заокруглені)" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "features",
            label: "Every site includes",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта" },
              { type: "string", name: "lead", label: "Підзаголовок" },
              {
                type: "object",
                name: "items",
                label: "Переваги",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Нова перевага" }) },
                fields: [
                  {
                    type: "string",
                    name: "icon",
                    label: "Іконка",
                    options: [
                      { value: "fast", label: "Швидкість" },
                      { value: "devices", label: "Пристрої" },
                      { value: "edit", label: "Олівець" },
                      { value: "inbox", label: "Вхідні" },
                      { value: "chart", label: "Графік" },
                      { value: "globe", label: "Глобус" },
                    ],
                  },
                  { type: "string", name: "name", label: "Назва" },
                  { type: "string", name: "description", label: "Опис" },
                  { type: "image", name: "image", label: "Картинка 2:1 (порожньо = заглушка)" },
                  { type: "string", name: "imageAlt", label: "Картинка — опис (alt)" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "projectLine",
            label: "Project line (етапи роботи)",
            fields: [
              { type: "string", name: "title", label: "Заголовок" },
              { type: "string", name: "note", label: "Примітка справа (Enter = новий рядок)", ui: textarea },
              { type: "string", name: "hint", label: "Підказка внизу" },
              { type: "string", name: "buttonLabel", label: "Кнопка — текст" },
              { type: "string", name: "buttonHref", label: "Кнопка — посилання" },
              {
                type: "object",
                name: "steps",
                label: "Етапи",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Новий етап" }) },
                fields: [
                  { type: "string", name: "name", label: "Назва" },
                  {
                    type: "string",
                    name: "icon",
                    label: "Іконка",
                    options: [
                      { value: "users", label: "Люди" },
                      { value: "chart", label: "Графік" },
                      { value: "sitemap", label: "Структура" },
                      { value: "palette", label: "Палітра" },
                      { value: "code", label: "Код" },
                      { value: "rocket", label: "Ракета" },
                      { value: "headset", label: "Навушники" },
                    ],
                  },
                  { type: "number", name: "start", label: "Початок — робочий день (1–20, 21 = After)" },
                  { type: "number", name: "span", label: "Тривалість — днів" },
                  {
                    type: "string",
                    name: "variant",
                    label: "Колір смуги",
                    options: [
                      { value: "solid", label: "Синій" },
                      { value: "soft", label: "Світло-синій" },
                      { value: "light", label: "Лавандовий" },
                      { value: "gradient", label: "Градієнт" },
                      { value: "dark", label: "Темний" },
                      { value: "outline", label: "Контурний" },
                    ],
                  },
                  { type: "string", name: "when", label: "Коли (для мобілки: Week 1–2)" },
                  { type: "string", name: "description", label: "Опис (у підказці)", ui: textarea },
                  { type: "string", name: "result", label: "Результат (→ …)" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "testimonials",
            label: "Clients about us (відео-відгуки)",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта" },
              { type: "string", name: "lead", label: "Підзаголовок" },
              {
                type: "object",
                name: "items",
                label: "Відгуки",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Новий відгук" }) },
                fields: [
                  { type: "string", name: "name", label: "Ім'я / назва" },
                  { type: "string", name: "company", label: "Підпис під ім'ям" },
                  { type: "image", name: "avatar", label: "Аватар / лого (необов'язково)" },
                  { type: "string", name: "avatarText", label: "Текст в аватарі, якщо немає картинки (M4M)" },
                  { type: "string", name: "caption", label: "Підпис унизу картки", ui: textarea },
                  { type: "string", name: "video", label: "Відео — шлях до mp4 (/uploads/videos/назва.mp4)" },
                  { type: "image", name: "poster", label: "Кадр-заставка (показується, поки відео вантажиться)" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "about",
            label: "About me (про мене)",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта" },
              { type: "string", name: "text", label: "Текст (**так** = жирний)", ui: textarea },
              { type: "image", name: "photo", label: "Фото" },
              { type: "string", name: "name", label: "Ім'я на фото" },
              { type: "string", name: "role", label: "Підпис під ім'ям" },
              { type: "string", name: "soloTitle", label: "Синя картка — заголовок" },
              { type: "string", name: "soloText", label: "Синя картка — текст", ui: textarea },
              {
                type: "object", name: "facts", label: "Факти", list: true,
                ui: { itemProps: (item) => ({ label: `${item?.value ?? ""} ${item?.label ?? ""}` }) },
                fields: [
                  { type: "string", name: "value", label: "Значення (70+)" },
                  { type: "string", name: "label", label: "Підпис" },
                ],
              },
              { type: "string", name: "buttonLabel", label: "Кнопка — текст" },
            ],
          },
          {
            type: "object",
            name: "faq",
            label: "FAQ",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта" },
              { type: "string", name: "lead", label: "Підзаголовок", ui: textarea },
              { type: "string", name: "askLabel", label: "Посилання «Задати питання»" },
              {
                type: "object", name: "items", label: "Питання", list: true,
                ui: { itemProps: (item) => ({ label: item?.question || "Нове питання" }) },
                fields: [
                  { type: "string", name: "question", label: "Питання" },
                  { type: "string", name: "answer", label: "Відповідь (**так** = жирний)", ui: textarea },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "footer",
            label: "Футер",
            fields: [
              { type: "string", name: "chipFrom", label: "Плашка — зліва (Idea)" },
              { type: "string", name: "chipTo", label: "Плашка — справа (Reality)" },
              { type: "string", name: "headline", label: "Великий заголовок", ui: textarea },
              { type: "string", name: "buttonLabel", label: "Кнопка — текст" },
              {
                type: "object", name: "links", label: "Посилання", list: true,
                ui: { itemProps: (item) => ({ label: item?.label || "Посилання" }) },
                fields: [
                  { type: "string", name: "icon", label: "Іконка", options: ["instagram", "telegram", "linkedin", "email", "whatsapp"] },
                  { type: "string", name: "label", label: "Назва" },
                  { type: "string", name: "url", label: "Посилання (https://… або mailto:…)" },
                ],
              },
              { type: "string", name: "copyright", label: "Копірайт" },
              { type: "string", name: "middle", label: "Текст посередині" },
              { type: "string", name: "privacyLabel", label: "Політика — текст" },
              { type: "string", name: "privacyUrl", label: "Політика — посилання" },
            ],
          },
          {
            type: "object",
            name: "quoteForm",
            label: "Поп-ап заявки",
            fields: [
              { type: "string", name: "tag", label: "Плашка" },
              { type: "string", name: "title", label: "Заголовок" },
              { type: "string", name: "subtitle", label: "Підзаголовок", ui: textarea },
              { type: "string", name: "successTitle", label: "Після відправки — заголовок" },
              { type: "string", name: "successText", label: "Після відправки — текст" },
              { type: "string", name: "fabLabel", label: "Плаваюча кнопка — текст" },
            ],
          },
        ],
      },

      /* ================= СТОРІНКА РОБІТ ================= */
      {
        name: "works",
        label: "Сторінка робіт (EN · PL · UA) — тексти",
        path: "content/works",
        format: "json",
        ui: {
          // works (EN), works-pl (PL), works-ua (UA)
          router: ({ document }) => {
            const f = document._sys.filename;
            return f === "works-pl" ? "/realizacje/" : f === "works-ua" ? "/ua/works/" : "/en/works/";
          },
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: [
              { type: "string", name: "title", label: "Title (вкладка браузера, Google)" },
              { type: "string", name: "description", label: "Description (опис у Google)", ui: textarea },
              shareImageField,
            ],
          },
          { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
          { type: "string", name: "titleRest", label: "Заголовок — решта" },
          { type: "string", name: "lead", label: "Підзаголовок (Enter = новий рядок)", ui: textarea },
        ],
      },

      /* ================= КЕЙСИ ================= */
      {
        // один файл = один кейс, тексти для всіх 3 мов в одній формі
        name: "case",
        label: "Кейси (усі роботи)",
        path: "content/cases",
        format: "json",
        ui: {
          router: () => "/realizacje/",
          filename: {
            slugify: (values) =>
              `${values?.name || "case"}`
                .toLowerCase()
                .replace(/ł/g, "l")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
          },
        },
        fields: [
          { type: "string", name: "name", label: "Назва", isTitle: true, required: true },
          { type: "boolean", name: "showOnHome", label: "Показувати на головній (Recent work)" },
          { type: "number", name: "order", label: "Порядок (менше число = раніше; напр. 10, 20, 30…)" },
          { type: "image", name: "image", label: "Скрін сайту (16:9)" },
          { type: "string", name: "url", label: "Посилання на сайт (https://…), відкривається в новій вкладці" },
          {
            type: "object",
            name: "en",
            label: "EN",
            fields: [
              { type: "string", name: "category", label: "Категорія (Automotive · Corporate website)" },
              { type: "string", name: "city", label: "Місто (Wrocław)" },
            ],
          },
          {
            type: "object",
            name: "pl",
            label: "PL",
            fields: [
              { type: "string", name: "category", label: "Kategoria (Motoryzacja · Strona firmowa)" },
              { type: "string", name: "city", label: "Miasto (Wrocław)" },
            ],
          },
          {
            type: "object",
            name: "ua",
            label: "UA",
            fields: [
              { type: "string", name: "category", label: "Категорія (Автосервіс · Корпоративний сайт)" },
              { type: "string", name: "city", label: "Місто (Вроцлав)" },
            ],
          },
        ],
      },

      /* ================= БЛОГ ================= */
      {
        name: "post",
        label: "Blog",
        path: "content/posts",
        format: "mdx",
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}`,
          filename: {
            // назва файлу = адреса статті (/blog/nazva-statti)
            slugify: (values) =>
              `${values?.title || "post"}`
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/ł/g, "l")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
          },
        },
        defaultItem: () => ({ date: new Date().toISOString() }),
        fields: [
          { type: "string", name: "title", label: "Заголовок", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Дата" },
          { type: "string", name: "excerpt", label: "Короткий опис (для списку і Google)", ui: textarea },
          { type: "image", name: "cover", label: "Обкладинка" },
          { type: "rich-text", name: "body", label: "Текст статті", isBody: true },
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: [schemaField],
          },
        ],
      },

      /* ================= ЗНАННЯ ДЛЯ AI-ЧАТУ ================= */
      {
        name: "ai",
        label: "Знання для AI-чату",
        path: "content/ai",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: "object",
            name: "topics",
            label: "Теми",
            description:
              "Те, що AI-асистент має знати, але чого немає на сайті: орієнтовні ціни, технології, як проходить робота, деталі кейсів, що відповідати на заперечення. Пишіть будь-якою мовою, асистент відповідатиме мовою відвідувача. Тексти сайту він і так знає. Зміни діють після деплою (2–4 хв).",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title || "Нова тема" }) },
            fields: [
              { type: "string", name: "title", label: "Тема", description: "Напр. «Ціни», «Технології», «Кейс AMIMED»" },
              { type: "string", name: "text", label: "Що асистент має знати", ui: { component: "textarea" } },
            ],
          },
          {
            type: "string",
            name: "rules",
            label: "Чого не казати / не обіцяти",
            description: "Напр. «не називати точну ціну без брифу», «не обіцяти запуск швидше ніж за 2 тижні».",
            ui: { component: "textarea" },
          },
        ],
      },
      /* ================= НАЛАШТУВАННЯ САЙТУ ================= */
      {
        name: "settings",
        label: "Налаштування сайту",
        path: "content/settings",
        format: "json",
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: "image",
            name: "shareImage",
            label: "Картинка для посилань — за замовчуванням",
            description:
              "Показується, коли посилання на сайт кидають у Telegram, WhatsApp, Facebook, LinkedIn тощо — для всіх сторінок і мов. Окрему картинку для мови/сторінки можна задати в її SEO. 1200×630 або 1800×945, JPG до 300 КБ.",
          },
          {
            type: "boolean",
            name: "blogIndexed",
            label: "Блог видно в Google",
            description:
              "Вимкнено: усі сторінки /blog/ отримують noindex, nofollow (Google їх прибере з пошуку). Сторінки лишаються доступні за прямим посиланням.",
          },
          {
            type: "string",
            name: "hiddenPages",
            label: "Сховати від Google сторінки",
            description: "Позначені сторінки отримують noindex, nofollow. За прямим посиланням вони відкриваються.",
            list: true,
            options: [
              { value: "en", label: "Головна EN (/en/)" },
              { value: "pl", label: "Головна PL (/)" },
              { value: "ua", label: "Головна UA (/ua/)" },
              { value: "blog", label: "Список статей (/blog/)" },
              { value: "works", label: "Роботи EN (/en/works/)" },
              { value: "works-pl", label: "Роботи PL (/realizacje/)" },
              { value: "works-ua", label: "Роботи UA (/ua/works/)" },
            ],
            ui: { component: "checkbox-group" },
          },
          {
            type: "object",
            name: "hiddenPosts",
            label: "Сховати від Google статті",
            description: "Додайте статті, які не мають бути в пошуку (діє, коли блог видно в Google).",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.post?.split("/").pop()?.replace(/\.mdx$/, "") || "Оберіть статтю" }) },
            fields: [{ type: "reference", name: "post", label: "Стаття", collections: ["post"] }],
          },
        ],
      },
    ],
  },
});
