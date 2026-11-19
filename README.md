# Lunaris Hacks Portal & Sponsor CRM

Full-stack operations and hackathon management platform built for **Lunaris Hacks** (Toronto Metropolitan University's student-run engineering hackathon serving **100+ participants across ~30 teams and 15+ corporate sponsors**).

## Architecture & Key Features
- **Automated Sponsor CSV Ingestion Pipeline (`FastAPI` + `pandas`):** Replaces manual spreadsheet cleanup with schema-validated, deduplicated batch ingestion (`POST /api/sponsors/ingest-csv`) that normalizes company names, contact emails, and funding tiers.
- **Sponsor Pipeline & Funding Tracker (`PostgreSQL` + `SQLAlchemy`):** Tracks corporate outreach stages (`Prospect` -> `Contacted` -> `Committed` -> `Paid`) and aggregates real-time committed vs. pipeline sponsorship funding.
- **Hacker Team Registration Portal (`React` + `TypeScript` + `Tailwind CSS`):** Provides track-based team registration (`AI/ML`, `FinTech`, `Hardware`, `Sustainability`) and live participant metrics.
- **Containerized Deployment (`Docker Compose`):** Single-command local spin-up with PostgreSQL and automatic database seeding.

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Pydantic, pandas
- **Database & Infrastructure:** PostgreSQL 16, Docker, Docker Compose

## Quick Start

### 1. Run Backend + PostgreSQL via Docker
```bash
docker-compose up --build
```
API documentation is automatically available at `http://localhost:8000/docs`.

### 2. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` and test uploading `sample_sponsors.csv` via the **Import Sponsor CSV** button.
