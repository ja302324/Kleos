# Kleos

> *From the Greek word for glory achieved through great deeds — inspired by the biblical Paraclete, the helper and advocate.*

Kleos is an AI-powered design companion. Describe your creative vision, and Kleos finds the inspiration, suggests design directions, and helps you create.

---

## Features

- **AI Design Briefs** — Describe a project and get 3 distinct design directions powered by Claude AI
- **Inspiration Engine** — Each direction comes with curated inspiration images from Unsplash
- **Kleos Spirit** — An animated geodesic orb that responds to your interactions (voice coming soon)
- **Project Library** — Save and revisit your briefs and design directions
- **Voice Interface** — Talk to Kleos directly using Web Speech API *(Sprint 4)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| Database & Auth | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| Images | Unsplash API |
| Animation | HTML5 Canvas |
| Deployment | Vercel *(Sprint 5)* |

---

## Project Structure

```
kleos/
├── design-companion/     # React frontend
│   ├── src/
│   │   ├── components/   # Shared components (KleosOrb)
│   │   ├── pages/        # GetStarted, SignIn, SignUp, Dashboard
│   │   ├── services/     # API service layer (kleosApi.js)
│   │   └── supabaseClient.js
│   └── ...
└── backend/              # FastAPI backend
    ├── main.py           # API routes
    ├── requirements.txt
    └── .env              # API keys (not committed)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account
- Anthropic API key
- Unsplash developer account

### Frontend

```bash
cd design-companion
npm install
npm run dev
```

Create a `.env.local` file in `design-companion/`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Create a `.env` file in `backend/`:

```
ANTHROPIC_API_KEY=your_anthropic_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

---

## Sprint Roadmap

- [x] **Sprint 1** — Supabase auth, database schema, React + Vite setup
- [x] **Sprint 2** — Landing page, auth UI, dashboard shell, React Router
- [x] **Sprint 3** — Claude API + Unsplash API integration
- [ ] **Sprint 4** — Voice interface, Web Speech API, audio-reactive orb
- [ ] **Sprint 5** — Polish, mobile responsiveness, Vercel deployment

---

## License

MIT
