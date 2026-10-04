import { defineConfig } from "tinacms";

/* Гілка GitHub, у яку Tina зберігає зміни.
   На Vercel береться автоматично з VERCEL_GIT_COMMIT_REF. */
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const textarea = { component: "textarea" } as const;

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
            return f === "home-pl" ? "/pl/" : f === "home-ua" ? "/ua/" : "/";
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
            label: "Recent work (кейси)",
            fields: [
              { type: "string", name: "titleAccent", label: "Заголовок — синє слово" },
              { type: "string", name: "titleRest", label: "Заголовок — решта" },
              { type: "string", name: "lead", label: "Підзаголовок (Enter = новий рядок)", ui: textarea },
              { type: "string", name: "buttonLabel", label: "Кнопка — текст" },
              { type: "string", name: "buttonHref", label: "Кнопка — посилання" },
              {
                type: "object",
                name: "cases",
                label: "Кейси",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Новий кейс" }) },
                fields: [
                  { type: "image", name: "image", label: "Скрін сайту (16:9)" },
                  { type: "string", name: "name", label: "Назва" },
                  { type: "string", name: "category", label: "Категорія (Automotive · Corporate website)" },
                  { type: "string", name: "city", label: "Місто (Wrocław)" },
                  { type: "string", name: "url", label: "Посилання на сайт (https://…), відкривається в новій вкладці" },
                ],
              },
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
        ],
      },
    ],
  },
});
