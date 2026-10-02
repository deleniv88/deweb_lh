# Deweb studio — версія для lh.pl (статичний хостинг)

Next.js + TinaCMS, зібраний у статичні файли (`out/`) і залитий на lh.pl по FTP.
Форма заявки — `public/api/quote.php` (Telegram + Gmail + захист від спаму).

```
Save в адмінці Tina → коміт у GitHub → GitHub Actions збирає сайт → FTP на lh.pl (~2–4 хв)
```

## Секрети GitHub (Settings → Secrets and variables → Actions → New repository secret)

| Назва | Що це |
|---|---|
| `FTP_SERVER` | FTP-сервер lh.pl (з панелі, напр. `serwer123456.lh.pl`) |
| `FTP_USERNAME` | логін FTP |
| `FTP_PASSWORD` | пароль FTP |
| `FTP_DIR` | папка домену на сервері, **зі слешем у кінці**, напр. `/domains/deweb.studio/public_html/` |
| `SITE_URL` | адреса сайту, напр. `https://deweb.studio` |
| `NEXT_PUBLIC_TINA_CLIENT_ID` | Client ID з Tina Cloud |
| `TINA_TOKEN` | Content (Read-only) token з Tina Cloud |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram (необов'язково) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NOTIFY_EMAIL` | Gmail (необов'язково, `NOTIFY_EMAIL` — куди слати) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (необов'язково) |

Якщо FTP-заливка падає з помилкою TLS — у `.github/workflows/deploy-lh.yml` заміни `protocol: ftps` на `protocol: ftp`.

## Локально
```bash
npm install
npm run dev        # сайт: http://localhost:3000, адмінка: /admin
```
