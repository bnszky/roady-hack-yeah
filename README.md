# Routy — Hackathon Monorepo

Monorepo aplikacji **Routy** składające się z:

- `mobile/` — aplikacja **Expo (React Native) + Expo Router + TanStack Query + Supabase**
- `backend/` — API **FastAPI + SQLAlchemy (async) + Alembic + Supabase**
- `web/` — panel administracji **Vite + React + TanStack Query + shadcn/ui + React Leaflet**

---

## Struktura

```
.
├── package.json            # npm workspaces (mobile), husky + lint-staged + prettier
├── .husky/pre-commit       # formatowanie przed commitem (prettier via lint-staged)
├── .prettierrc             # wspólna konfiguracja Prettier
├── .cursor/
│   ├── backend.mdc         # zasady dla backendu
│   ├── mobile.mdc          # zasady dla mobile
│   └── web-admin.mdc       # zasady dla panelu web
├── mobile/
│   └── src/
│       ├── app/            # ekrany (Expo Router, file-based routing)
│       │   └── (tabs)/     # index (Home), settings
│       ├── api/            # warstwa HTTP (client.ts)
│       ├── hooks/          # hooki TanStack Query (use-auth)
│       ├── lib/            # supabase.ts, env.ts, query-client.ts
│       ├── components/     # komponenty UI (ThemedText/View, Loading, ErrorState)
│       └── constants/      # theme.ts (kolory, spacing)
├── backend/
│   ├── pyproject.toml      # zależności (uv)
│   ├── alembic/            # migracje (nie aplikuj automatycznie!)
│   ├── scripts/seed.py     # kategorie + dane demo
│   └── app/
│       ├── main.py
│       ├── core/           # config, exceptions, logging, security, geo
│       ├── db/             # session, base
│       ├── models/         # Category, Problem, ProblemReport
│       ├── schemas/        # Pydantic (request/response)
│       ├── services/       # logika biznesowa (problemy, kategorie, trasa OSRM, asystent DeepSeek)
│       ├── api/v1/endpoints/  # health, categories, problems, routes, assistant, stats
│       ├── api/deps.py     # DbSession, get_current_user (JWT Supabase)
│       └── middleware/     # RequestLoggingMiddleware
└── web/                    # panel administracji
    └── src/
        ├── pages/          # mapa, lista zgłoszeń, szczegóły, kategorie
        ├── components/     # mapa, filtry, dialogi; shared/ ; ui/ (shadcn — nie edytować)
        ├── api/            # hooki TanStack Query
        ├── types/          # typy zgodne z backend/app/schemas
        └── lib/
```

---

## Model danych

- **Category** — `name`, `icon` (nazwa ikony lucide), `description`, `is_importance_level_required` (czy pytać o uciążliwość 1–5), `status` (`approved` / `pending` — propozycja użytkownika / `rejected`).
- **Problem** — jeden realny problem w danym miejscu: `category_id`, `latitude`/`longitude`, `description`, `status` (`new` / `in_progress` / `resolved` / `rejected`), `status_note`, oraz agregaty przeliczane po każdym zgłoszeniu: `is_observable`, `reports_count`, `confirmations_count`, `denials_count`, `consecutive_denials`, `importance_level_average`, `first_reported_at`, `last_reported_at`.
- **ProblemReport** — każde zgłoszenie/odpowiedź: `problem_id`, `is_observable` (TAK/NIE), `importance_level` (1–5), `description`, `latitude`/`longitude`, `source` (`form` / `voice` / `proximity_prompt`), `transcript`, `reported_at`.

Reguły:

- Nowe zgłoszenie tej samej kategorii w promieniu `PROBLEM_DEDUPE_RADIUS_M` (30 m) od istniejącego, występującego problemu jest do niego **dopisywane** zamiast tworzyć nowy problem.
- Problem przestaje być widoczny (`is_observable=false`), gdy liczba odpowiedzi „NIE” od ostatniego „TAK” osiągnie `PROBLEM_DENIAL_THRESHOLD` (3). Kolejne „TAK” przywraca go.
- `confirmations_count` liczy zgłoszenie początkowe i wszystkie „TAK”.
- Uciążliwość jest zapisywana tylko dla kategorii z `is_importance_level_required=true` (przy nowym zgłoszeniu jest wtedy wymagana).

---

## Wymagania

- **Node.js** 18+ (testowane na 24)
- **Android Studio** z emulatorem (Pixel 8 Pro / API 34+)
- **uv** (instalacja: `irm https://astral.sh/uv/install.ps1 | iex`)
- **Supabase** (konto + projekt)

---

## 1. Konfiguracja Supabase

1. Załóż projekt na [supabase.com](https://supabase.com).
2. **Project Settings → API** — skopiuj:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (tylko backend, **nigdy nie trafia do mobile**)
3. **Project Settings → Database → Connection string** (Transaction pooler, port `6543`) → `DATABASE_URL`.

> Lokalnie możesz też użyć Supabase CLI (`supabase start`) — wtedy `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres`.

---

## 2. Backend

```bash
cd backend

# kopiuj konfigurację
cp .env.example .env          # i uzupełnij wartościami z Supabase

# zależności (tworzy .venv z Python 3.11)
uv sync

# nowe migracje po zmianie modeli — WYGENERUJ (nie aplikuj!)
uv run alembic revision --autogenerate -m "opis zmiany"

# aplikacja migracji (po weryfikacji wygenerowanego pliku):
uv run alembic upgrade head

# kategorie startowe (idempotentne); --demo dodaje ~30 przykładowych problemów w Krakowie
uv run python -m scripts.seed --demo

# uruchom serwer (http://localhost:8000, docs na /docs)

uv run uvicorn app.main:app --reload --host 0.0.0.0
```

### Lint / format (Ruff)

```bash
cd backend
uv run ruff check --fix .
uv run ruff format .
```

### Endpointy

Pełna dokumentacja: Swagger na `http://localhost:8000/docs`. Na razie bez autoryzacji.

| Metoda | Ścieżka                            | Opis                                                      |
| ------ | ---------------------------------- | --------------------------------------------------------- |
| GET    | `/api/v1/health`                   | Healthcheck                                               |
| GET    | `/api/v1/categories?status=`       | Lista kategorii (`pending` = propozycje użytkowników)     |
| POST   | `/api/v1/categories`               | Nowa kategoria (admin, od razu zatwierdzona)              |
| PATCH  | `/api/v1/categories/{id}`          | Edycja kategorii                                          |
| DELETE | `/api/v1/categories/{id}`          | Usunięcie kategorii bez problemów                         |
| POST   | `/api/v1/categories/{id}/approve`  | Zatwierdzenie propozycji                                  |
| POST   | `/api/v1/categories/{id}/reject`   | Odrzucenie (opcjonalnie przeniesienie problemów)          |
| GET    | `/api/v1/problems`                 | Mapa/lista: filtry, bbox, sortowanie, paginacja           |
| POST   | `/api/v1/problems`                 | Zgłoszenie (dopisuje do istniejącego lub tworzy nowy)     |
| GET    | `/api/v1/problems/nearby`          | Problemy w pobliżu (popup „czy problem dalej występuje?”) |
| GET    | `/api/v1/problems/{id}`            | Szczegóły + historia zgłoszeń                             |
| PATCH  | `/api/v1/problems/{id}`            | Zmiana statusu / notatki / kategorii (admin)              |
| DELETE | `/api/v1/problems/{id}`            | Usunięcie problemu (admin)                                |
| POST   | `/api/v1/problems/{id}/responses`  | Odpowiedź TAK/NIE + uciążliwość 1–5                       |
| POST   | `/api/v1/routes/problems`          | Trasa piesza A→B (OSRM) + problemy wzdłuż trasy           |
| POST   | `/api/v1/assistant/report-draft`   | Tekst z mowy → szkic zgłoszenia (nic nie zapisuje)        |
| POST   | `/api/v1/assistant/response-draft` | Tekst z mowy → szkic odpowiedzi TAK/NIE                   |
| GET    | `/api/v1/stats/summary`            | Statystyki do dashboardu                                  |

Przykład — mapa tylko dobrze potwierdzonych, występujących problemów:
`GET /api/v1/problems?is_observable=true&min_confirmations=5&category_ids=<id>&category_ids=<id>`

Asystent głosowy wymaga `DEEPSEEK_API_KEY` w `backend/.env` (model `deepseek-flash`); bez klucza endpointy `/assistant/*` zwracają 503.

- Każdy request jest logowany przez `RequestLoggingMiddleware` (poziom ustawiany przez `LOG_LEVEL`).
- Auth wyłącza się env-em `AUTH_REQUIRED=false` (poziom ustalimy później).

---

## 2a. Panel administracji (web)

```bash
cd web
cp .env.example .env.local    # VITE_API_URL (domyślnie http://localhost:8000/api/v1)
npm install
npm run dev                   # http://localhost:5173

npm run lint                  # oxlint
npm run build                 # tsc + vite build
```

Widoki: mapa zgłoszeń z filtrami (kolor = średnia uciążliwość, wielkość = liczba potwierdzeń), lista zgłoszeń z sortowaniem po potwierdzeniach / uciążliwości, szczegóły problemu (historia potwierdzeń, zmiana statusu z notatką), zarządzanie kategoriami i zatwierdzanie propozycji użytkowników.

---

## 3. Mobile

```bash
cd mobile

# kopiuj zmienne środowiskowe
cp .env.example .env.local    # uzupełnij EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN (Supabase opcjonalnie)

# zależności (już zainstalowane na poziomie root — w razie potrzeby:)
npm install
```

### Dev build (wymagany — aplikacja nie działa w Expo Go)

Mapa (Mapbox) i rozpoznawanie mowy to moduły natywne, więc potrzebny jest własny dev build zamiast Expo Go.

```bash
cd mobile
npx expo run:android            # emulator
npx expo run:android --device   # telefon podłączony przez USB (debugowanie USB włączone)
```

Pełny build jest potrzebny tylko po zmianie pakietów natywnych / `app.json`. Na co dzień: `npx expo start` i otwórz zainstalowaną aplikację **Routy**.

- **Adres backendu:** `EXPO_PUBLIC_API_URL=http://localhost:8000` działa wszędzie — `src/lib/env.ts` podmienia `localhost` na `10.0.2.2` na emulatorze i na IP komputera (tego samego co Metro) na telefonie. Backend uruchom z `--host 0.0.0.0`. Aktualny adres i status połączenia widać w zakładce **Aktywność → Serwer**.
- **Rozpoznawanie mowy** wymaga aplikacji Google na urządzeniu (dostarcza usługę rozpoznawania). Emulatory bez Sklepu Play zwykle jej nie mają — testuj głos na telefonie.

### Formatowanie / lint / typy

```bash
# z root (formatuje mobile + pliki root):
npm run format          # prettier --write .
npm run format:check    # prettier --check .

# mobile:
npm run lint            # expo lint
npm run typecheck       # tsc --noEmit
```

> Przed commitem hook `pre-commit` automatycznie formatuje zmienione pliki (`prettier --write` przez lint-staged).
