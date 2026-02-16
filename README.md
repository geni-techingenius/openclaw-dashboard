# OpenClaw Dashboard

A web dashboard for managing and monitoring multiple OpenClaw gateway instances.

![Dashboard Preview](docs/preview.png)

## Features

- 🖥️ **Multi-Gateway Management** - Connect and monitor multiple OpenClaw instances
- 📊 **Real-time Status** - Live status indicators for each gateway
- 💬 **Session Viewer** - Browse active sessions across all gateways
- 📝 **Conversation History** - View message history for any session
- ⏰ **Cron Jobs** - View and manage scheduled tasks
- 📈 **Usage Metrics** - Track token usage and costs per gateway
- 📋 **Logs** - Real-time log viewing
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

### Prerequisites

- Node.js 18+ 
- npm or yarn
- One or more OpenClaw instances with API access

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

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/dist/
# Serve with any static server or configure backend to serve them
```

## Configuration

### Backend Environment

Create `backend/.env`:

```env
PORT=3001
```

### Adding a Gateway

1. Open the dashboard at `http://localhost:3000`
2. Go to **Gateways** page
3. Click **+ Add Gateway**
4. Enter:
   - **Name**: Descriptive name (e.g., "Production Server")
   - **URL**: OpenClaw gateway URL (e.g., `http://localhost:4445`)
   - **Token**: API token from your OpenClaw config
5. Click **Create Gateway**
6. Use the **Sync** buttons to pull sessions, cron jobs, and usage data

## Pages

### Dashboard
Overview of all gateways with status indicators and quick access to details.

### Gateways
Manage gateway connections - add, edit, or remove gateways.

### Sessions
View active sessions per gateway. Sync to fetch latest session list from the gateway.

### Cron Jobs
View scheduled tasks. Shows schedule type, payload, and next run time.

### Usage
Monitor token usage and costs. Shows input/output tokens and estimated costs broken down by model.

### History
Browse conversation history for any session. Search and filter messages.

## API Endpoints

### Gateways
- `GET /api/gateways` - List all gateways
- `GET /api/gateways/:id` - Get single gateway
- `POST /api/gateways` - Create gateway
- `PUT /api/gateways/:id` - Update gateway
- `DELETE /api/gateways/:id` - Delete gateway
- `POST /api/gateways/:id/proxy` - Proxy request to gateway

### Sessions
- `GET /api/gateways/:id/sessions` - List cached sessions
- `POST /api/gateways/:id/sync-sessions` - Sync from gateway

### Messages
- `GET /api/sessions/:id/messages` - Get session messages
- `POST /api/gateways/:id/sessions/:key/sync-messages` - Sync messages from gateway

### Cron
- `GET /api/gateways/:id/cron` - List cached cron jobs
- `POST /api/gateways/:id/sync-cron` - Sync from gateway

### Usage
- `GET /api/gateways/:id/usage` - Get usage stats
- `POST /api/gateways/:id/sync-usage` - Sync usage from gateway

### Logs
- `GET /api/gateways/:id/logs` - Get gateway logs

### Health
- `GET /api/health` - Health check

## Database Schema

SQLite database (`backend/data/dashboard.db`) with the following tables:

| Table | Description |
|-------|-------------|
| `gateways` | OpenClaw instances with connection details |
| `sessions` | Cached sessions from each gateway |
| `messages` | Message history cache |
| `cron_jobs` | Scheduled tasks |
| `usage_stats` | Token/cost tracking |

## Tech Stack

- **Frontend**: React 19, Vite 7, TailwindCSS v4, React Query 5, React Router 7
- **Backend**: Node.js, Express 4, better-sqlite3
- **Database**: SQLite with WAL mode
- **Testing**: Vitest (frontend), Node.js Test Runner (backend)

## Development

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Code Style

```bash
# Lint frontend
cd frontend
npm run lint
```

### Project Structure

```
openclaw-dashboard/
├── backend/
│   ├── index.js          # Express server
│   ├── schema.sql        # Database schema
│   ├── data/             # SQLite database (gitignored)
│   └── test/             # Backend tests
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   │   ├── Card.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── UsageMetrics.jsx
│   │   │   ├── ConversationViewer.jsx
│   │   │   └── LogViewer.jsx
│   │   ├── pages/        # Route pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Gateways.jsx
│   │   │   ├── Sessions.jsx
│   │   │   ├── CronJobs.jsx
│   │   │   ├── Usage.jsx
│   │   │   └── History.jsx
│   │   ├── hooks/        # React Query hooks
│   │   ├── lib/          # API client
│   │   └── test/         # Frontend tests
│   └── vite.config.js
│
├── docs/                 # Documentation
└── README.md
```

## Security Notes

- Gateway API tokens are stored in the SQLite database
- The dashboard backend acts as a proxy to OpenClaw gateways
- Consider running behind a reverse proxy with authentication in production
- The `.env` file and `data/` directory are gitignored

## Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Multi-user authentication
- [ ] Dark/light theme toggle
- [ ] Export data (CSV/JSON)
- [ ] Gateway health monitoring alerts
- [ ] Direct cron job management (create/edit/delete)
- [ ] Session management (send messages)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Built with 🐾 for [OpenClaw](https://github.com/openclaw/openclaw)

**TechInGenius** - Innovating Support, One Byte at a Time
