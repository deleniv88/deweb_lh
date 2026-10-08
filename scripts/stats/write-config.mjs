/* Пароль сторінки /stats → stats/data/config.php (на сервері, у репозиторії його немає).
   Зберігаємо не сам пароль, а HMAC від нього, окремий ключ для підпису cookie входу
   і ключ, з яким workflow запускає тижневий звіт у Telegram (stats/cron.php).
   Ключі детерміновані: поки пароль той самий, вхід не злітає після щоденного оновлення.
   node scripts/stats/write-config.mjs <папка>   (змінна STATS_PASSWORD) */

import { writeFileSync, mkdirSync } from "node:fs";
import { createHmac } from "node:crypto";

const dir = process.argv[2] || "stats-data";
const pw = process.env.STATS_PASSWORD || "";
if (pw.length < 8) { console.error("STATS_PASSWORD порожній або коротший за 8 символів"); process.exit(1); }

const h = (salt) => createHmac("sha256", pw).update(salt).digest("hex");
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/config.php`, `<?php\nreturn ['pw' => '${h("deweb-stats-password")}', 'key' => '${h("deweb-stats-cookie")}', 'cron' => '${h("deweb-stats-cron")}'];\n`);
/* усе в stats/data читає тільки PHP; напряму з браузера — заборонено */
writeFileSync(`${dir}/.htaccess`, `<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n`);
console.log("config.php і .htaccess записано");
