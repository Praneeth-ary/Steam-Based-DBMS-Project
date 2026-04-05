<<<<<<< HEAD
# Steam-Based-DBMS-Project
Steam-like Digital Game Distribution Platform built using React, Node.js, and MySQL, showcasing a fully normalized (BCNF) database with transaction-safe purchases, role-based access, and dynamic offers system
=======
# GDPS — Digital Game Distribution Platform

Production-style demo implementing the **Database Design Document (SDD Final.pdf)**: MySQL InnoDB, 3NF schema, JWT + RBAC, Express API, Next.js UI, and a **Database Visualization Mode** for evaluators.

## Prerequisites

- Node.js 20+
- Docker (optional, for MySQL) **or** a local MySQL 8 server

## Quick start (Docker MySQL)

```bash
cd gdps-platform
docker compose up -d
# Wait until healthy (~30s first run)

cp backend/.env.example backend/.env
# Defaults match docker-compose (user gdps / password gdps_secret / db gdps)

cd backend && npm install && npm start
```

In another terminal:

```bash
cd gdps-platform/frontend
cp .env.local.example .env.local
npm install
npm run dev
```

- **Frontend:** http://localhost:3000  
- **API:** http://localhost:4000/api/health  

### Manual MySQL (no Docker)

1. Create database `gdps` and a user with full rights on it.
2. Run `database/01_schema.sql` then `database/02_seed.sql` in MySQL Workbench or CLI.
3. Set `backend/.env` `DB_*` variables accordingly.

The seed includes **26 games** on the store. You can add the rest with:

```bash
mysql -h 127.0.0.1 -u gdps -p gdps < database/04_more_games.sql
```

## Demo accounts (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gdps.com | admin123 |
| Developer | aurora@dev.com | dev123 |
| Producer | globalplay@studio.com | dev123 |
| Consumer | elena@mail.local | consumer123 |

## Project highlights

- **Purchase flow:** single transaction → `INSERT purchases`, `INSERT payments`, `INSERT user_library` (open **DB mode** in the UI to watch SQL).
- **Reviews:** API checks `user_library` before insert; DB `UNIQUE(user_id, game_id)` on `reviews`.
- **Offers:** dynamic `sale_price` from `offers.percentage_off` when `NOW()` is inside the window.
- **Admin dashboard:** revenue = `SUM(purchases.price_paid)`, top games, user counts by role.

## Deployment suggestions

- **Frontend:** [Vercel](https://vercel.com) — set `NEXT_PUBLIC_API_URL` to your API URL.
- **Backend:** [Render](https://render.com) / Fly.io — set `FRONTEND_ORIGIN` to the Vercel domain, `JWT_SECRET` to a strong value, and `DB_*` to your host.
- **Database:** [Railway](https://railway.app) MySQL, [PlanetScale](https://planetscale.com) (note: PlanetScale may restrict some FK/CHECK semantics; prefer vanilla MySQL 8 for class demos).

## Scripts

| Path | Command | Purpose |
|------|---------|---------|
| `backend/` | `npm run dev` | API with hot reload (`node --watch`) |
| `backend/` | `npm start` | Run API (plain Node.js) |
| `frontend/` | `npm run dev` | Next.js dev |
| `frontend/` | `npm run build` | Production build |

## License

>>>>>>> e1bfb79 (Initial commit: Steam Based DBMS project)
