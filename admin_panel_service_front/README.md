# WhatsApp Bulk Messaging Platform

A full-stack WhatsApp bulk messaging platform with multi-role support (Admin, Client, Reseller), real-time campaign management, virtual number rotation, and AI-powered message generation.

---

## 🔗 Live Links

| Service | URL |
|---|---|
| **Frontend (Admin Panel)** | https://effervescent-melomakarona-20b65a.netlify.app/login |
| **Backend API** | https://admin-whatsapp.onrender.com |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Queue | Redis + Bull |
| WhatsApp | Baileys (`@whiskeysockets/baileys`) — no Chrome/Puppeteer |
| Auth | JWT (RS256), RBAC |
| Deployment | Netlify (frontend) · Render (backend) |

---

## 📁 Project Structure

```
Code/
├── admin_panel_service_front/   ← Next.js frontend
└── admin_whatsApp_backend/      ← Express.js backend + worker
```

---

## ✨ Features

### 🔐 Authentication & Roles
- JWT-based login with 7-day token expiry
- Three role tiers:
  - **Admin** — full platform control
  - **Reseller** — manages own clients and campaigns
  - **Client** — runs own campaigns, links own WhatsApp
- Rate-limited login endpoint (brute-force protection)

---

### 📱 WhatsApp Account Management
- Connect multiple WhatsApp accounts via **QR code scan** or **8-digit pairing code** (no camera needed)
- Powered by **Baileys** — pure WebSocket, no Chrome/Puppeteer required
- Sessions persist to disk (`.baileys_auth/`) — survives server restarts
- **Server-Sent Events (SSE)** push real-time status updates to the admin panel
- Admin accounts: round-robin load balancing across all connected numbers
- Client accounts: each client links their own WhatsApp number
- Auto-reconnect on disconnect with exponential backoff (max 10 retries)

**Account statuses:** `loading` → `qr` → `pairing` → `ready` / `disconnected`

---

### 📣 Campaign Management
- **Campaign types:** Text, DP (image), Button, Action Button, Button SMS
- **Full lifecycle:** `draft` → `queued` → `running` → `paused` / `completed` / `cancelled`
- **Resume support** — paused campaigns resume from where they stopped (only remaining recipients charged)
- **Recipient upload** — bulk phone number import (up to 100,000 recipients)
- **CSV export** — download sent/failed report per campaign
- **Real-time SSE** — admin panel auto-updates when a campaign pauses or completes

---

### 💬 Message Intelligence

#### Spintax Support
Vary message text automatically to avoid spam fingerprinting:
```
{Hi|Hello|Hey} {there|friend}, check out our {offer|deal|promotion}!
```
Each recipient receives a randomly expanded version — no two messages are identical.

#### Human-Like Delay Engine
Delays between messages are fully randomised with no detectable pattern:
- **Normal mode:** configured range ± 30% jitter (default 5–7s)
- **Burst mode:** 15% chance of 1–3s gap (mimics fast typing)
- **Long break:** ~4% chance per message of a 1–5 minute pause (mimics human fatigue)

Configure in `.env`:
```env
DEFAULT_DELAY_MIN=5000    # minimum ms between messages
DEFAULT_DELAY_MAX=7000    # maximum ms between messages
```

---

### 🔢 Virtual Number Pool
- Add SIM/VoIP numbers as **virtual numbers** for sending
- System automatically rotates numbers per message (round-robin)
- Each number has:
  - **Daily message cap** (`MAX_MESSAGES_PER_NUMBER_PER_DAY`)
  - **Per-send cooldown** (`COOLDOWN_SECONDS`)
  - **Auto-block** after 5 consecutive failures
  - **Auto-unblock** after 6 hours (soft blocks only)
- **Auto-provision WhatsApp** — when a campaign runs, unprovisioned numbers automatically get a Baileys session started; admin is notified via SSE to scan QR

---

### 🛡️ Anti-Blocking System

#### Error Classification
| Error Type | Cause | Action |
|---|---|---|
| `meta_block` | WhatsApp banned the number | Mark blocked, try fallback number |
| `operator_block` | ISP/carrier network block (ETIMEDOUT, ECONNRESET, 503) | Mark blocked, try fallback number |
| `rate_limited` | Too many messages too fast | 5× extended cooldown on that number |
| `not_on_whatsapp` | Recipient not on WhatsApp | Mark failed, continue |
| `technical` | Connection crash | Log, continue (no number penalty) |
| `recipient_failure` | Generic send error | Track consecutive failures |

#### Campaign Auto-Pause
Campaign automatically pauses (with live admin notification) when:
- `all_numbers_blocked` — all virtual numbers are blocked or exhausted
- `meta_block` / `operator_block` — hard block detected and no fallback available
- `no_wa_sessions` — no WhatsApp sessions are ready to send

The admin sees the exact reason and a **Resume** button in the campaign list.

---

### 💳 Credits System
- Each message costs configurable credits (`COST_PER_MESSAGE`)
- Credits deducted at campaign start (only for pending recipients on resume)
- Admin can top up credits per user
- Full transaction history

---

### 📊 Analytics & Reports
- Admin dashboard: overview stats (sent, failed, running campaigns, connected accounts)
- Campaign reports: per-campaign delivery rates, success %, sent/failed breakdown
- Credit reports: transaction history, usage per user
- WhatsApp reports: account health, message logs

---

### 🤖 AI Message Generation
- Generate campaign message body using AI
- Integrated into the campaign composer

---

### 🔑 API Keys
- Clients and admins can generate API keys for third-party integrations
- Admin can view and revoke all keys across the platform

---

### 🎯 Demo Requests
- Clients can submit demo requests
- Admin reviews and updates status

---

## ⚙️ Environment Variables

### Backend (`admin_whatsApp_backend/.env`)

```env
# Server
NODE_ENV=development
PORT=5000
API_PREFIX=/api

# Database
MONGODB_URI=mongodb+srv://...

# Redis (Bull queue)
REDIS_ENABLED=1
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
ENCRYPTION_KEY=32_char_hex_key

# Sending limits
CHUNK_SIZE=500                        # recipients per queue job
COOLDOWN_SECONDS=8                    # seconds between reuse of same number
COST_PER_MESSAGE=1                    # credits per message
MAX_MESSAGES_PER_NUMBER_PER_DAY=1100  # daily cap per virtual number

# Delay between messages (ms)
DEFAULT_DELAY_MIN=5000                # 5 seconds
DEFAULT_DELAY_MAX=7000                # 7 seconds

# Optional: persistent Baileys auth for cloud (e.g. Render disk)
BAILEYS_AUTH_PATH=/var/data/baileys_auth
```

### Frontend (`admin_panel_service_front/.env`)

```env
NEXT_PUBLIC_API_URL=https://admin-whatsapp.onrender.com
```

---

## 🚀 Local Development

### Backend
```bash
cd admin_whatsApp_backend
npm install
# Set up .env (copy values above)
npm start            # API server on :5000
node workers/whatsappWorker.js   # message queue worker (separate terminal)
```

### Frontend
```bash
cd admin_panel_service_front
npm install
# Set NEXT_PUBLIC_API_URL in .env
npm run dev          # Next.js dev server on :3000
```

---

## 🌐 Deployment

### Backend — Render
1. Connect repo to Render → New Web Service
2. Build command: `npm install`
3. Start command: `node server.js`
4. Add a **Persistent Disk** (mount at `/var/data`) and set `BAILEYS_AUTH_PATH=/var/data/baileys_auth`
5. Set all env vars in Render dashboard
6. Add a second service (Background Worker) with start command: `node workers/whatsappWorker.js`

### Frontend — Netlify
1. Connect repo to Netlify → New Site
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add env var: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| POST | `/api/campaigns/:id/start` | Start / resume campaign |
| POST | `/api/campaigns/:id/pause` | Pause campaign |
| GET | `/api/campaigns/events` | SSE — real-time campaign events |
| GET | `/api/whatsapp/accounts` | List WA accounts (admin) |
| POST | `/api/whatsapp/accounts` | Add WA account |
| POST | `/api/whatsapp/accounts/:id/reconnect` | Reconnect account |
| POST | `/api/whatsapp/accounts/:id/pairing-code` | Get pairing code |
| GET | `/api/whatsapp/events` | SSE — real-time WA account status |
| GET | `/api/whatsapp/my` | Client's own WA session |
| POST | `/api/whatsapp/my/connect` | Connect client WA |
| POST | `/api/whatsapp/my/pairing-code` | Pairing code for client WA |
| GET | `/api/numbers` | List virtual numbers |
| POST | `/api/numbers` | Add virtual number |
| POST | `/api/numbers/:id/provision-whatsapp` | Provision WA for number |
| POST | `/api/numbers/:id/unblock` | Unblock number |
| POST | `/api/credits/purchase` | Top up credits |
| GET | `/api/analytics/overview` | Analytics overview |
| POST | `/api/ai/generate-message` | AI message generation |
| POST | `/api/whatsapp/send-bulk` | Send bulk (legacy direct) |

---

## 🗺️ Frontend Pages

### Admin
| Page | Path |
|---|---|
| Dashboard | `/admin/dashboard` |
| Campaigns | `/admin/campaigns` |
| WhatsApp Accounts | `/admin/whatsapp-login` |
| Virtual Numbers | `/admin/numbers` |
| Users | `/admin/users` |
| Credits | `/admin/credits` |
| Analytics | `/admin/analytics` |
| API Keys | `/admin/api` |
| Chatbot | `/admin/chatbot` |
| Demo Requests | `/admin/demo-requests` |
| Settings | `/admin/settings` |
| Reports → Campaigns | `/admin/reports/campaigns` |
| Reports → Credits | `/admin/reports/credits` |
| Reports → WhatsApp | `/admin/reports/whatsapp` |

### Client
| Page | Path |
|---|---|
| Dashboard | `/client/dashboard` |
| Text Campaign | `/client/campaigns` |
| DP Campaign | `/client/dp-campaign` |
| Button Campaign | `/client/campaigns/[id]` |
| Action Button | `/client/action-button` |
| Button SMS | `/client/button-sms` |
| My WhatsApp | `/client/whatsapp-login` |
| Credits | `/client/credits` |
| API Keys | `/client/api` |
| Chatbot | `/client/chatbot` |
| WhatsApp Report | `/client/whatsapp-report` |
| Demo Requests | `/client/demo-requests` |

### Reseller
| Page | Path |
|---|---|
| Dashboard | `/reseller/dashboard` |
| Clients | `/reseller/clients` |
| Campaigns | `/reseller/campaigns` |
| Credits | `/reseller/credits` |
| Analytics | `/reseller/analytics` |
| API Keys | `/reseller/api` |
| Demo Requests | `/reseller/demo-requests` |

---

## 📦 Key Dependencies

### Backend
| Package | Purpose |
|---|---|
| `@whiskeysockets/baileys` | WhatsApp WebSocket client (no Chrome) |
| `bull` | Redis-backed job queue |
| `ioredis` | Redis client |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth |
| `express` | HTTP server |
| `multer` | File upload (media messages) |
| `qrcode` | QR code generation |
| `helmet` | HTTP security headers |
| `pino` | High-performance logging |

### Frontend
| Package | Purpose |
|---|---|
| `next` | React framework (SSR + routing) |
| `react` | UI library |
| `lucide-react` | Icon set |
| `tailwindcss` | Utility CSS |

---

## 🔒 Security

- All API endpoints protected by JWT middleware
- Role-based access control (admin / reseller / client) on every route
- Auth rate limiting (brute-force protection)
- Encrypted virtual number VPN passwords (AES)
- Helmet HTTP security headers
- SSE endpoints use token-in-query-param auth (EventSource limitation)

---

## 📈 Throughput Guide

| Accounts | Delay Setting | Messages/Hour | Messages/Day |
|---|---|---|---|
| 1 account | 6s (default) | ~600 | ~14,400 |
| 2 accounts | 6s | ~1,200 | ~28,800 |
| 3 accounts | 6s | ~1,800 | ~43,200 |
| 1 account | 86s (safe) | ~42 | ~1,000 |

> ⚠️ WhatsApp may rate-limit or ban numbers sending at high velocity. New numbers should be warmed up gradually (start at 50–100/day, increase weekly).
