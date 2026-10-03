# Routy — Hackathon Monorepo

Monorepo aplikacji **Routy** składające się z:

- `mobile/` — aplikacja **Expo (React Native) + Expo Router + TanStack Query + Supabase**
- `backend/` — API **FastAPI + SQLAlchemy (async) + Alembic + Supabase**

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
└── backend/
    ├── pyproject.toml      # zależności (uv)
    ├── alembic/            # migracje (nie aplikuj automatycznie!)
    └── app/
        ├── main.py
        ├── core/           # config, exceptions, logging, security
        ├── db/             # session, base
        ├── models/         # modele SQLAlchemy
        ├── schemas/        # Pydantic (request/response)
        ├── services/       # logika biznesowa
        ├── api/v1/endpoints/  # health
        ├── api/deps.py     # get_current_user (JWT Supabase)
        └── middleware/     # RequestLoggingMiddleware
```

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

# migracje — WYGENERUJ (nie aplikuj!)
uv run alembic revision --autogenerate -m "initial"

# aplikacja migracji (po weryfikacji wygenerowanego pliku):
uv run alembic upgrade head

# uruchom serwer (http://localhost:8000, docs na /docs)
uv run uvicorn app.main:app --reload
```

### Lint / format (Ruff)

```bash
cd backend
uv run ruff check --fix .
uv run ruff format .
```

### Endpointy

| Metoda | Ścieżka          | Auth |
| ------ | ---------------- | ---- |
| GET    | `/api/v1/health` | ❌   |

- Każdy request jest logowany przez `RequestLoggingMiddleware` (poziom ustawiany przez `LOG_LEVEL`).
- Auth wyłącza się env-em `AUTH_REQUIRED=false` (poziom ustalimy później).

---

## 3. Mobile

```bash
cd mobile

# kopiuj zmienne środowiskowe
cp .env.example .env.local    # uzupełnij EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY

# zależności (już zainstalowane na poziomie root — w razie potrzeby:)
npm install
```

### Uruchomienie na emulatorze Android (Pixel 8 Pro)

1. W **Android Studio** otwórz **Device Manager** i uruchom emulator **Pixel 8 Pro** (API 34+).
2. Upewnij się, że backend działa na `http://localhost:8000`.
3. Wystartuj Expo i otwórz na Androidzie:

```bash
# z katalogu root:
npm run mobile:android

# albo z mobile:
npx expo start --android
```

> Android emulator nie widzi `localhost` hosta — `src/lib/env.ts` automatycznie zamienia go na `10.0.2.2`.
> Na fizycznym urządzeniu ustaw `EXPO_PUBLIC_API_URL` na adres IP komputera w LAN.

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
