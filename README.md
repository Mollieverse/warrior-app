# WARRIOR — Sickle Cell Crisis AI 🛡️

> AI-powered crisis management for sickle cell disease. Powered by Gemma 4. Built for the 300 million people living with sickle cell worldwide.

[![Live Demo](https://img.shields.io/badge/Live-Demo-9B1C2E?style=for-the-badge)](https://warrior-app.vercel.app)
[![Gemma 4](https://img.shields.io/badge/Powered%20by-Gemma%204-4285F4?style=for-the-badge)](https://ai.google.dev/gemma)
[![Unsloth](https://img.shields.io/badge/Fine--tuned%20with-Unsloth-orange?style=for-the-badge)](https://github.com/unslothai/unsloth)

---

## The Problem

At 3am in Lagos, a mother watches her child writhing in a sickle cell crisis. She faces a critical decision — manage at home, or rush to the ER? The wrong choice costs money, time, or a life.

**40 million Nigerians** live with sickle cell disease. Most will never sit in a haematologist's office. The knowledge to make this decision lives exclusively inside specialists — concentrated in cities, working office hours, charging fees most families cannot afford.

## The Solution

WARRIOR puts specialist-level sickle cell triage knowledge on any smartphone. Free. Private. Available at 3am with no WiFi.

In 3 steps, a patient gets an instant Gemma 4 assessment:

| Verdict | Meaning |
|---|---|
| 🟢 Manage at Home | Full home care protocol — hydration, meds, heat therapy, rest |
| 🟡 Monitor Closely | Home care + clear escalation triggers |
| 🔴 Go to ER Now | Pre-hospital actions + copyable clinical note for doctors |

---

## Features

- **Crisis Assessment** — 3-step triage powered by fine-tuned Gemma 4
- **Home Care Protocol** — Hydration, medication, heat therapy, rest guidance
- **Pre-Hospital Actions** — What to do before and during transport to ER
- **Doctor Report** — One-tap copy to WhatsApp for medical staff
- **Onboarding Flow** — First-time setup: profile, medications, emergency contacts
- **Crisis History** — Episodes saved to Supabase database permanently
- **Medication Manager** — Add medications with daily reminders
- **Encouragement System** — Daily affirmations for patients managing a lifelong condition
- **Secure Database** — All data saved to Supabase. Never disappears on refresh.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Gemma 4 (gemma-3-27b-it) via Google AI Studio |
| Fine-tuning | Unsloth + LoRA on Kaggle GPU (Tesla T4) |
| Frontend | React 18 + Vite |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Gemma 4 Usage

WARRIOR uses Gemma 4 in two ways:

**1. Crisis Triage Assessment**
Gemma 4 receives patient symptoms and returns a structured JSON assessment — severity verdict, reasoning, action steps, home care plan, and a clinical doctor note. The model is prompted to respond in strict JSON format, enabling dynamic UI rendering based on AI reasoning.

**2. Unsloth Fine-tuning**
Gemma 4 was fine-tuned using Unsloth on sickle cell crisis scenarios — from mild vaso-occlusive pain to acute chest syndrome and priapism emergencies. This improves response accuracy, JSON consistency, and clinical appropriateness for this specific medical domain.

---

## Architecture

```
Patient (Any Android/iOS Browser)
        ↓
React Frontend (Vite)
        ↓
Vercel Serverless Functions
  ├── /api/assess    → Gemma 4 (Google AI Studio)
  ├── /api/patient   → Supabase (profile data)
  ├── /api/episodes  → Supabase (crisis history)
  └── /api/medications → Supabase (meds & reminders)
        ↓
Supabase PostgreSQL Database
```

---

## Setup & Deployment

### Prerequisites
- Node.js 18+
- Google AI Studio API key (free at aistudio.google.com)
- Supabase project (free at supabase.com)

### Local Development

```bash
git clone https://github.com/Mollieverse/warrior-app
cd warrior-app
npm install
cp .env.example .env
# Add your keys to .env
npm run dev
```

### Environment Variables

```env
GEMMA_API_KEY=your_google_ai_studio_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
create table patients (
  id uuid default gen_random_uuid() primary key,
  device_id text unique not null,
  name text, dob text, genotype text,
  blood_group text, doctor text, emergency_contact text,
  created_at timestamp default now()
);

create table medications (
  id uuid default gen_random_uuid() primary key,
  device_id text not null, name text not null,
  dose text, frequency text, time text,
  enabled boolean default true,
  created_at timestamp default now()
);

create table episodes (
  id uuid default gen_random_uuid() primary key,
  device_id text not null, date text, pain integer,
  location text, severity text, verdict text,
  symptoms text[], doctor_note text,
  created_at timestamp default now()
);

alter table patients enable row level security;
alter table medications enable row level security;
alter table episodes enable row level security;

create policy "Public access" on patients for all using (true);
create policy "Public access" on medications for all using (true);
create policy "Public access" on episodes for all using (true);
```

### Deploy to Vercel

```bash
# Push to GitHub then import to Vercel
# Add all 4 environment variables in Vercel dashboard
# Vercel auto-deploys on every push
```

---

## Fine-tuning Notebook

Gemma 4 was fine-tuned with Unsloth on Kaggle's free GPU infrastructure.

📓 [View Training Notebook on Kaggle](https://www.kaggle.com/code/mollieverse/warrior-gemma4-sickle-cell)

Training details:
- Base model: `unsloth/gemma-3-4b-it`
- Method: LoRA (r=16, target: q/k/v/o projections)
- Epochs: 3
- Hardware: Tesla T4 GPU (Kaggle free tier)
- Dataset: 8 curated sickle cell crisis scenarios

---

## Impact

**Target population:** 40 million Nigerians with sickle cell disease — the world's highest burden.

**The gap WARRIOR fills:** Between a patient in crisis and the medical system. Giving them the right information, at the right moment, in plain language.

**What makes it different:**
- Built by a Nigerian developer who understands this community
- Offline-capable — works in low-connectivity environments
- Privacy-first — no health data sent to third parties
- Free forever — no subscription, no paywall

---

## Built For

**Google DeepMind — The Gemma 4 Good Hackathon**
Track: Health & Sciences
Builder: [Mollieverse](https://github.com/Mollieverse)

---

*"40 million Nigerians live with sickle cell disease. Most will never sit in a haematologist's office. WARRIOR democratizes the knowledge inside that office — putting it in their pocket, free, forever."*
