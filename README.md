# LinkFlow ⚡ — Modern Scalable URL Shortener Platform

LinkFlow is a high-performance, full-stack URL shortening and analytics platform inspired by Bitly. Built with **FastAPI**, **Neon Lakebase PostgreSQL**, and **Next.js 14 (App Router)**.

---

## 🌟 Features

- **High-Performance Redirection**: Sub-millisecond redirects with 301 (Permanent) and 302 (Temporary) support.
- **Custom Aliases & Expiration**: Create branded short links with custom slugs and optional auto-expiration timestamps.
- **Rich Analytics & Telemetry**: 14-day aggregate click telemetry, daily breakdown, referrers, and browser/device metadata tracking.
- **Complete Auth Portal**: Registration, JWT session cookie login, email verification, password reset, and user dashboard.
- **Cloud Database Ready**: Native integration with Neon Lakebase Postgres (Serverless PostgreSQL).
- **Graceful Cache-Aside Architecture**: Optional Redis caching with seamless fallback to Postgres.
- **One-Click Local Launcher**: Single `server.bat` script launches both backend and frontend automatically.

---

## 🏗️ Project Structure

```
SESD-project/
├── backend/                    # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                # API Endpoints (v1: auth, urls, analytics)
│   │   ├── core/               # Configuration, security (bcrypt/JWT), Redis client
│   │   ├── database/           # SQLAlchemy session and engine management
│   │   ├── models/             # ORM models (User, URL, ClickEvent, etc.)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── services/           # Business logic (URL hashing, analytics, email)
│   ├── migrations/             # Alembic database migrations
│   ├── tests/                  # Pytest test suite (25/25 passing)
│   ├── alembic.ini             # Alembic configuration
│   ├── pytest.ini              # Pytest configuration
│   ├── requirements.txt        # Python backend dependencies
│   └── .env.example            # Backend environment template
│
├── frontend/                   # Next.js 14 Frontend Application
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login, signup, verify-email, reset-password
│   │   ├── dashboard/          # Overview, My Links, Create, Analytics, Profile
│   │   ├── globals.css         # Tailwind dark theme styles
│   │   └── page.tsx            # High-conversion landing page
│   ├── components/             # Reusable UI components (Navbar, Footer, etc.)
│   ├── context/                # AuthContext & session management
│   ├── lib/                    # API client (lib/api.ts) and utilities
│   ├── package.json            # Frontend npm configuration
│   └── .env.example            # Frontend environment template
│
├── server.bat                  # One-click Windows development launcher
├── .env.example                # Unified environment variables template
├── .gitignore                  # Git ignore rules (secrets, DBs, caches)
├── neon.ts                     # Neon cloud configuration
└── package.json                # Root package configuration
```

---

## 🚀 Quick Start (Windows)

The easiest way to start both servers is using the provided `server.bat` launcher:

1. **Clone or pull the repository**:
   ```bash
   git clone <repo-url>
   cd SESD-project
   ```

2. **Set up your environment variables**:
   ```bash
   copy .env.example .env.local
   copy backend\.env.example backend\.env.local
   copy frontend\.env.example frontend\.env.local
   ```
   *Fill in your database credentials in `.env.local`.*

3. **Double-click `server.bat`** (or run `.\server.bat` in terminal).
   - Validates Python virtual environment & dependencies.
   - Applies pending Alembic database migrations.
   - Starts FastAPI backend at `http://localhost:8000`.
   - Starts Next.js frontend at `http://localhost:3000`.
   - Automatically opens your default web browser to the app.

---

## 🛠️ Manual Setup

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Run tests
pytest

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Configuration

Copy `.env.example` to `.env.local`:

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Direct unpooled connection for migrations | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET_KEY` | Secret key for JWT session tokens (min 32 chars) | `openssl rand -hex 32` |
| `FRONTEND_URL` | Frontend origin for CORS and email links | `http://localhost:3000` |
| `BACKEND_URL` | Backend origin for redirect routes | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | API endpoint for frontend client calls | `http://localhost:8000` |
| `REDIS_ENABLED` | Enable Redis cache (`true`/`false`) | `false` |
| `ENVIRONMENT` | Environment (`development`/`production`) | `development` |

> **Development Mode Note**: When SMTP is not configured, email verification tokens and password reset links are printed directly to the backend terminal log.

---

## 📡 Key Endpoints

- **Web App**: `http://localhost:3000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Redoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`
- **URL Redirection**: `http://localhost:8000/r/{short_code}`

---

## 🔒 Security Best Practices

- All passwords hashed using `bcrypt` (12 rounds).
- Short codes generated using cryptographically secure random characters.
- SQL injection prevention via SQLAlchemy 2.0 ORM parameterization.
- HTTP-only and Secure JWT cookies with CSRF defense.
- Sensitive environment files (`.env*`, `*.db`) are strictly excluded via `.gitignore`.

