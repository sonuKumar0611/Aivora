# Aivora – AI Customer Support Automation Platform

A production-ready MVP where businesses can create, test, and deploy AI chatbots using their own knowledge base.

- **Frontend:** Next.js (App Router), TailwindCSS, React Query – deploy to **Vercel**
- **Backend:** Node.js, Express, MongoDB, OpenAI – deploy to **Render**
- **Features:** Auth (JWT), Bot CRUD, Knowledge Base (PDF/text/URL → RAG), Test Chat, Analytics, Embeddable Widget

---

## Project structure

```
customer-support-ai/
├── backend/          # Express API (Render)
├── frontend/         # Next.js app (Vercel)
├── .env.example      # Root env template
├── .env.backend.example
├── .env.frontend.example
└── README.md
```

---

## Local development

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- OpenAI API key

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, FRONTEND_URL=http://localhost:3000
npm install
npm run dev
```

API runs at `http://localhost:4000`. Health: `GET /health`.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### 3. Environment variables

**Backend (`.env`):**

| Variable         | Description                    |
|------------------|--------------------------------|
| `NODE_ENV`       | `development` or `production`  |
| `PORT`           | Server port (default 4000)     |
| `MONGODB_URI`    | MongoDB connection string      |
| `JWT_SECRET`     | Secret for JWT (min 16 chars) |
| `OPENAI_API_KEY` | OpenAI API key (for RAG/chat)  |
| `FRONTEND_URL`   | Frontend origin (CORS)         |

**Frontend (`.env.local`):**

| Variable               | Description              |
|------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL     |

---

## API overview

| Method | Endpoint                     | Auth    | Description           |
|--------|------------------------------|--------|-----------------------|
| POST   | `/api/auth/signup`           | No     | Register              |
| POST   | `/api/auth/login`             | No     | Login                 |
| GET    | `/api/auth/me`               | Yes    | Current user          |
| GET    | `/api/bots`                  | Yes    | List bots             |
| POST   | `/api/bots`                  | Yes    | Create bot            |
| GET    | `/api/bots/:id`              | Yes    | Get bot               |
| PUT    | `/api/bots/:id`              | Yes    | Update bot            |
| DELETE | `/api/bots/:id`              | Yes    | Delete bot            |
| POST   | `/api/knowledge/upload`      | Yes    | Upload PDF/text/URL   |
| GET    | `/api/knowledge/:botId`      | Yes    | List knowledge        |
| POST   | `/api/chat/:botId`           | Optional| Send message (RAG)    |
| GET    | `/api/analytics/:botId`      | Yes    | Analytics             |

---

## Deployment

### Backend (Render)

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your repo; set **Root Directory** to `backend`.
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`
5. Add environment variables in Render dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI` (e.g. Atlas connection string)
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `FRONTEND_URL` = your Vercel frontend URL (e.g. `https://aivora.vercel.app`)
6. Deploy. Note the service URL (e.g. `https://aivora-api.onrender.com`).

**MongoDB Atlas:** In Network Access, allow `0.0.0.0/0` (or add Render’s IPs if you restrict).

### Frontend (Vercel)

1. Import the repo on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g. `https://aivora-api.onrender.com`)
4. Deploy.

### Widget embed

After deployment, the chat widget is served at:

`https://<your-vercel-domain>/widget.js`

Embed on any site:

```html
<script
  src="https://<your-vercel-domain>/widget.js"
  data-bot="BOT_ID"
  data-api="https://<your-render-backend-url>"
></script>
```

Replace `BOT_ID` with the bot’s ID (from dashboard → My Bots → Edit bot → Embed widget section).

---

## License

MIT.
