# OpenClaw Dashboard

A web dashboard for managing and monitoring multiple OpenClaw gateway instances.

## Features

- 🖥️ **Multi-Gateway Management** - Connect and monitor multiple OpenClaw instances
- 📊 **Real-time Status** - Live status indicators for each gateway
- 💬 **Session Viewer** - Browse active sessions across all gateways
- ⏰ **Cron Jobs** - View and manage scheduled tasks
- 🔄 **Sync** - Pull latest data from connected gateways

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Express API    │────▶│ OpenClaw Gateway│
│  (Vite + TW4)   │     │  (SQLite)       │     │  (REST API)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     :3000                   :3001                   :4445
```

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend.

## Database Schema

SQLite database with the following tables:

- **gateways** - OpenClaw instances with connection details
- **sessions** - Cached sessions from each gateway
- **messages** - Message history cache
- **cron_jobs** - Scheduled tasks
- **usage_stats** - Token/cost tracking

## API Endpoints

### Gateways
- `GET /api/gateways` - List all gateways
- `POST /api/gateways` - Create gateway
- `PUT /api/gateways/:id` - Update gateway
- `DELETE /api/gateways/:id` - Delete gateway
- `POST /api/gateways/:id/proxy` - Proxy request to gateway

### Sessions
- `GET /api/gateways/:id/sessions` - List cached sessions
- `POST /api/gateways/:id/sync-sessions` - Sync from gateway

### Cron
- `GET /api/gateways/:id/cron` - List cached cron jobs
- `POST /api/gateways/:id/sync-cron` - Sync from gateway

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS v4, React Query, React Router
- **Backend**: Node.js, Express, better-sqlite3
- **Database**: SQLite

## Development

### Environment Variables

Backend (`.env`):
```
PORT=3001
```

### Adding a Gateway

1. Go to Gateways page
2. Click "Add Gateway"
3. Enter name, URL (e.g., `http://localhost:4445`), and API token
4. The dashboard will sync sessions and cron jobs

## License

MIT

---

Built with 🐾 for [OpenClaw](https://github.com/openclaw/openclaw)
