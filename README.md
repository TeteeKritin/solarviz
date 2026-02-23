# SolarVIZ — Local Dev & Docker Quickstart

This README explains how to run SolarVIZ locally with Docker and how to start the frontend for development.

Prerequisites
- Docker Desktop (Windows) or Docker Engine + docker-compose
- (Optional) Node.js 18+ and npm/yarn to run frontend dev server locally

Quickstart (Docker, recommended)
1. Copy or review `backend/.env` and update any secrets if needed.
2. From project root, build and start services:

```powershell
docker-compose up -d --build
```

3. Apply database migrations (inside backend container):

```powershell
docker-compose exec backend alembic upgrade head
```

4. Seed solar dataset (optional — file in `data/`):

```powershell
docker-compose exec backend python scripts/import_solar_data.py /app/data/data_solar_intensity_2560.csv
```

5. Open the app: frontend is served through Nginx at `http://localhost/`. API is available at `http://localhost/api/v1/`.

Frontend local development (no Docker)
- Install dependencies and run dev server (Parcel):

```bash
cd frontend
npm install
npm run dev
```

By default the frontend `ApiClient` uses the relative base path `/api/v1` (see `frontend/src/services/api.ts`), so in dev you can proxy or run the backend behind the same host (or set up a small proxy).

If you need to point the dev server directly to a backend running on another host/port, change `BASE_URL` in `frontend/src/services/api.ts` to the full URL (for example `http://localhost:8000/api/v1`).

Troubleshooting
- If the backend cannot connect to the DB inside Docker, ensure `backend/.env` uses the service hostname `postgres`:

```
DATABASE_URL=postgresql://solarviz:solarviz_secret@postgres:5432/solarviz_db
```

- If images fail to pull on Raspberry Pi, build multi-arch images with Docker Buildx and push to a registry (see `docker buildx build --platform linux/arm64 ... --push`).

Next steps you might want me to do:
- Add `backend/.env.example` and `.env` template
- Add a small health-check/retry wrapper for backend startup
- Add GitHub Actions workflow to build multi-arch images

---
File references:
- Backend env: `backend/.env`
- Frontend API client: `frontend/src/services/api.ts`
- Docker compose: `docker-compose.yml`
