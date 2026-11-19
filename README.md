# Survey Platform

A complete full-stack survey application. Administrators build conditional surveys, publish them, share public links, and review live analytics. Respondents never need an account.

**Stack:** Next.js 16 (React 19, TypeScript, Tailwind CSS 4) · Laravel 13 (PHP 8.3) · MySQL 8+

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Detailed setup](#detailed-setup)
- [Using the app](#using-the-app)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [API reference](#api-reference)
- [Testing and verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Security notes and limitations](#security-notes-and-limitations)

---

## Features

- Dashboard with totals, recent surveys, response counts, statuses, and quick actions
- Survey builder with text, single-choice, checkbox, and 1–5 rating questions
- Required fields, ordered questions, editable options, and up/down reordering
- Conditional questions that depend on an earlier multiple-choice answer
- Draft/published lifecycle; drafts are never exposed through the public API
- Responsive public form with inline validation, live conditional visibility, and double-submit protection
- Live analytics: option counts and percentages, rating averages and distributions, text answers
- Loading, empty, error, success, unavailable, and destructive-confirmation states
- Rate-limited public submissions with transactional response storage
- Laravel Sanctum session authentication for all admin pages and APIs

---

## Quick start

**Requirements:** PHP 8.3+, Composer 2, Node.js 20+, npm, MySQL 8+. See [Prerequisites](#prerequisites) for details.

```bash
# 1. Clone
git clone https://github.com/dhirajs16/survey.git
cd survey

# 2. Create the database
mysql -u root -p -e "CREATE DATABASE survey_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Backend (Terminal 1)
cd backend
cp .env.example .env            # Windows PowerShell: Copy-Item .env.example .env
composer install
php artisan key:generate
# -> edit backend/.env and set DB_PASSWORD if your MySQL user has one
php artisan migrate --seed
php artisan serve               # API on http://localhost:8000

# 4. Frontend (Terminal 2)
cd frontend
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
npm install
npm run dev                     # App on http://localhost:3000
```

Then open **http://localhost:3000** and sign in:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `password` |

A sample published survey is available at **http://localhost:3000/survey/product-feedback**.

> Change the seeded password in any environment that is not your own machine.

---

## Detailed setup

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| PHP | 8.3+ | Extensions: `pdo_mysql`, `mbstring`, `openssl`, plus standard Laravel extensions (`ctype`, `fileinfo`, `json`, `tokenizer`, `xml`) |
| Composer | 2.x | https://getcomposer.org |
| Node.js | 20+ | Includes npm |
| MySQL | 8+ | Or a compatible MySQL server |
| `pdo_sqlite` | optional | Only needed to run backend tests |

Check your versions:

```bash
php -v
composer -V
node -v
npm -v
mysql --version
```

### 1. Clone the repository

```bash
git clone https://github.com/dhirajs16/survey.git
cd survey
```

### 2. Create the database

Using the MySQL CLI:

```bash
mysql -u root -p -e "CREATE DATABASE survey_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Or run this in any MySQL client (Workbench, phpMyAdmin, DBeaver, etc.):

```sql
CREATE DATABASE survey_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure and start the Laravel API

```bash
cd backend
```

Copy the environment file:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Install dependencies and generate the app key:

```bash
composer install
php artisan key:generate
```

Open `backend/.env` and confirm these values match your MySQL setup:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=survey_studio
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:3000
```

Run migrations, seed the sample data, and start the server:

```bash
php artisan migrate --seed
php artisan serve
```

The API is now running at `http://localhost:8000`. Leave this terminal open.

### 4. Configure and start the Next.js frontend

Open a **second terminal** from the project root:

```bash
cd frontend
```

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

Confirm `frontend/.env.local` contains:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Install and run:

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. The root URL redirects to the admin dashboard.

### Environment variables at a glance

| File | Variable | Purpose | Local default |
|---|---|---|---|
| `backend/.env` | `DB_*` | MySQL connection | `127.0.0.1:3306`, db `survey_studio` |
| `backend/.env` | `FRONTEND_URL` | Origin allowed by CORS and Sanctum | `http://localhost:3000` |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Laravel API base URL | `http://localhost:8000/api` |

---

## Using the app

1. **Sign in** at `http://localhost:3000` with the seeded admin account.
2. **Create a survey** from the dashboard and add questions (text, single-choice, checkbox, or 1–5 rating).
3. **Add conditions** to show a question only when an earlier multiple-choice question has a specific answer.
4. **Publish** the survey. A public link of the form `/survey/<slug>` becomes available.
5. **Share the link.** Respondents submit without an account.
6. **Review analytics** for option counts, percentages, rating averages and distributions, and text answers.
7. **Unpublish** at any time to return the survey to draft; the public link then returns 404.

---

## Project structure

```
survey/
├── backend/     Laravel 13 JSON API (PHP 8.3, Eloquent, Form Requests, API Resources)
├── frontend/    Next.js 16 App Router web interface (React 19, TypeScript, Tailwind CSS 4)
└── README.md
```

---

## Architecture

| Layer | Technology | Directory |
|---|---|---|
| Web interface | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 | `frontend/` |
| JSON API | Laravel 13, PHP 8.3, Eloquent, Form Requests, API Resources | `backend/` |
| Database | MySQL 8+ | external |

The frontend talks to Laravel through `NEXT_PUBLIC_API_URL`. Laravel CORS permits the origin set in `FRONTEND_URL`.

### Database design

Surveys store an ordered, versioned question schema in a MySQL JSON column. This keeps builder changes atomic and avoids complex ordering tables. Responses and answers are normalized: each response belongs to a survey, and each answer has a stable `question_id` plus a JSON value. This hybrid approach keeps authoring flexible while keeping individual answers queryable and analytics reliable.

Foreign keys cascade deletes, slugs and per-response question IDs are unique, and commonly queried fields are indexed.

---

## API reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/login` | No | Start an authenticated admin session |
| POST | `/api/logout` | Yes | End the current admin session |
| GET | `/api/user` | Yes | Read the authenticated administrator |
| GET | `/api/admin/dashboard` | Yes | Dashboard metrics and recent surveys |
| GET / POST | `/api/admin/surveys` | Yes | List or create surveys |
| GET / PUT / DELETE | `/api/admin/surveys/{id}` | Yes | Read, update, or delete a survey |
| POST | `/api/admin/surveys/{id}/publish` | Yes | Publish a survey |
| POST | `/api/admin/surveys/{id}/unpublish` | Yes | Return a survey to draft |
| GET | `/api/admin/surveys/{id}/analytics` | Yes | Calculated response analytics |
| GET | `/api/public/surveys/{slug}` | No | Read a published survey |
| POST | `/api/public/surveys/{slug}/responses` | No | Submit a validated response |

**Conventions**

- Validation failures return HTTP `422` with Laravel's standard JSON body (`message` and `errors`).
- Missing or unpublished public surveys return `404`.
- Public submissions are limited to **20 per minute per client**.

---

## Testing and verification

```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd ../backend
php artisan test
php artisan route:list --path=api
```

Windows PowerShell users can use `cd ..\backend` for the last directory change.

Backend tests use an isolated in-memory SQLite database and never touch development data, so `pdo_sqlite` must be enabled. The feature suite covers the full create → publish → submit → analytics flow, required conditional answers, hidden-answer rejection, and invalid condition configuration.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `SQLSTATE[HY000] [1049] Unknown database` | The database does not exist. Run the `CREATE DATABASE` step. |
| `Access denied for user` | Fix `DB_USERNAME` and `DB_PASSWORD` in `backend/.env`, then run `php artisan config:clear`. |
| `could not find driver` | Enable `pdo_mysql` (or `pdo_sqlite` for tests) in your `php.ini`, then restart the terminal. |
| `No application encryption key has been specified` | Run `php artisan key:generate` in `backend/`. |
| Login fails, shows 419, or session is lost | Use `localhost` everywhere. Do not mix `localhost` and `127.0.0.1` between the browser URL, `FRONTEND_URL`, and `NEXT_PUBLIC_API_URL`. Then run `php artisan config:clear`. |
| CORS error in the browser console | Make sure `FRONTEND_URL` exactly matches the URL you open the frontend on (including port), then restart `php artisan serve`. |
| Frontend cannot reach the API | Confirm `php artisan serve` is running and `NEXT_PUBLIC_API_URL` ends in `/api`. Restart `npm run dev` after editing `.env.local`. |
| Port 3000 or 8000 already in use | Stop the other process, or use `php artisan serve --port=8001` / `npm run dev -- -p 3001` and update `NEXT_PUBLIC_API_URL` / `FRONTEND_URL` to match. |
| Want a clean database | `php artisan migrate:fresh --seed` (this erases all data). |
| Config changes not applied | `php artisan config:clear` and `php artisan cache:clear`. |

---

## Deployment

**Frontend** (`frontend/`): deploy to Vercel or any Node host. Set `NEXT_PUBLIC_API_URL` to the public Laravel `/api` URL and run `npm run build`.

**Backend** (`backend/`): deploy to a PHP 8.3+ host with HTTPS and MySQL.

1. Set `APP_ENV=production`, `APP_DEBUG=false`, a generated `APP_KEY`, database credentials, and `FRONTEND_URL`.
2. During each release run:
   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   ```
3. Point the web server document root at `backend/public`.
4. Provide a persistent, writable `storage/` directory.
5. Use a shared cache such as Redis for rate limiting when running multiple API instances.
6. Never commit real `.env` files. The example files contain no secrets.

---

## Security notes and limitations

- Laravel Sanctum protects every admin API with CSRF-protected, HTTP-only session-cookie authentication. Public survey read and submit routes are anonymous.
- The seeded admin (`admin@example.com` / `password`) is for local development only. Change it before any shared or production use.
- This implementation has one shared admin workspace. Add survey ownership and policies if multiple independent organizations will share a deployment.
- Rate limiting reduces abuse but does not guarantee one response per person.
- Analytics return at most the first 100 text answers per question to keep payloads bounded.
