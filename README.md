# VERTEX — AI-Based Industrial Fire Detection & Classification

**SIH 2026 Problem 26162** | National Technical Research Organisation (NTRO)

An AI-enabled geospatial platform that detects, classifies, and monitors industrial fires and persistent thermal sources by integrating NASA FIRMS thermal anomaly data, OpenStreetMap industrial infrastructure, and Google Gemini AI classification — visualized on an interactive 3D MapLibre dashboard.

## What It Does

1. **Ingests** real-time thermal hotspots from NASA FIRMS (VIIRS/MODIS satellites)
2. **Enriches** each hotspot with nearby industrial context from OpenStreetMap
3. **Classifies** relevant candidates using Gemini AI into:
   - 🔴 Industrial Fire
   - 🟠 Industrial Flare
   - 🟢 Vegetation Fire
   - 🟡 Agricultural Burn
   - ⚪ Unknown
4. **Stores** classifications with confidence scores and evidence in Supabase (PostGIS)
5. **Visualizes** everything on an interactive 3D MapLibre GL dashboard

> **Note:** All classifications are AI-assisted and may not reflect ground truth. Confidence scores and evidence are provided for informed human decision-making.

## Architecture

```
NASA FIRMS → Hotspot Ingestion → Validation → OSM Enrichment → Candidate Scoring
→ Gemini AI Classification → Confidence + Evidence → Supabase → MapLibre Dashboard
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, MapLibre GL JS, Tailwind CSS, Recharts |
| Backend | FastAPI (Python), google-genai SDK |
| Database | Supabase (PostgreSQL + PostGIS) |
| AI | Google Gemini 2.0 Flash |
| Data | NASA FIRMS, OpenStreetMap Overpass API |

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- API keys (see `.env.example`)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `backend/.env` and `frontend/.env.local`.

**Required:** FIRMS_MAP_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, GEMINI_API_KEY

**Optional:** EARTHDATA_USER/PASS, CDSE_CLIENT_ID/SECRET

See `.env.example` for full details.

## Security

- All secrets in `.env` files, never committed
- `.gitignore` covers all credential files
- Gemini API key never exposed to frontend
- All external API calls through backend only
- Supabase Row Level Security enabled
- Rate limiting on API endpoints

## License

SIH 2026 — Internal use.
