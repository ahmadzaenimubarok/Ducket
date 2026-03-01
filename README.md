# 🦆 Ducket - AI Smart Finance Tracker

A premium, intelligent financial forecasting dashboard built with **React**, **Vite**, **Supabase**, and **Groq AI**.

**Live Demo:** [https://ducketfinance.netlify.app/](https://ducketfinance.netlify.app/)

---

## ✨ Key Features

- **🤖 AI Smart Input (Natural Language)**: Log transactions by simply typing (e.g., "Paid 50k for lunch yesterday").
- **📝 AI-Powered Editor**: Edit your existing transactions by chatting with the AI.
- **🛡️ Privacy Toggle**: Hide/Show your sensitive financial totals with a single click.
- **📈 Intelligent Forecasting**: Get deep insights and trend analysis powered by Groq Llama 3.
- **🔐 Secure Authentication**: Multi-user support with isolated data handling via Supabase Row Level Security (RLS).
- **📱 Modern & Responsive**: A premium glassmorphism interface that looks stunning on mobile and desktop.
- **📉 Financial Visualization**: Interactive charts for revenue and expense analysis.

---

## 🚀 Getting Started

### 1. Prerequisite
Ensure you have **Node.js** installed on your machine.

### 2. Installations
```bash
git clone <your-repo-link>
cd forecasting
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your keys (see `.env.example`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### 4. Database Setup (Supplied SQL)
To enable multi-user security and dashboard views, you **MUST** run the provided SQL script in your Supabase SQL Editor:
- **File:** `supabase_setup.sql`
- This script handles Table creation, RLS Policies, and the Dashboard Summary View.

### 5. Run Development Server
```bash
npm run dev
```

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Vanilla CSS (Glassmorphism & Flexbox/Grid)
- **Backend/DB:** Supabase (Auth + PostgreSQL + RLS)
- **AI Engine:** Groq SDK (Llama 3.3 70B Model)
- **Icons & Charts:** Lucide-React & Recharts

---

## 🌐 Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your preferred static hosting (Netlify, Vercel, or Cloudflare Pages).

---

## 📄 License
© 2026 Ducket. All rights reserved.
