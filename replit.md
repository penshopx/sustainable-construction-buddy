# PUB ASPEKINDO — Pengembangan Usaha Berkelanjutan

## Overview

A comprehensive digital competency ecosystem platform for BUJK (Badan Usaha Jasa Konstruksi) personnel in Indonesia. Built with React + Vite + TypeScript + Tailwind CSS, backed by Supabase for authentication, database, and Edge Functions.

## Architecture

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (hosted) — Auth, PostgreSQL database, Edge Functions, Storage, Realtime
- **Routing**: React Router v6
- **State**: TanStack React Query + React Context (AuthProvider)
- **AI**: Supabase Edge Functions calling `ai.gateway.lovable.dev` (requires `LOVABLE_API_KEY` secret in Supabase Edge Function secrets, NOT in Replit env)

## Key Features

- Pre-test / competency assessment with server-side answer checking
- E-course modules with quizzes and certificates
- Project management toolkit (Risk Register, Budget Tracker, K3 Checklist)
- LKUT (annual business report), PANCEK (anti-corruption assessment), SMAP (ISO 37001)
- AI Mentor chatbot (3 modes: learning, expert, project)
- Helpdesk AI chatbot
- Marketplace for construction templates/tools
- BUJK company directory
- Leaderboard and performance grading
- Innovation Hub (8 innovation categories)
- Program management (pub_programs)
- Admin dashboard

## Running the App

```bash
npm run dev
```

Starts on port 5000 (Replit webview).

## Environment Variables (Replit Secrets / .env)

These are set in `.env` and are only used at build-time by Vite:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

> The `LOVABLE_API_KEY` (for AI features) is stored as a secret in the **Supabase Edge Functions** dashboard, not here. AI features call Edge Functions which proxy to the AI gateway.

## Supabase Project

- Project ID: `vwbgdyykeiilhffwvnku`
- All migrations are in `supabase/migrations/`
- Edge Functions: `supabase/functions/` (deployed to Supabase, not Replit)

## Project Structure

```
src/
  App.tsx              — Root router with all routes
  main.tsx             — React entry point
  pages/               — Page components (one per route)
  components/          — Reusable UI components
  hooks/               — Custom React hooks (useAuth, etc.)
  integrations/
    supabase/
      client.ts        — Supabase client
      types.ts         — Auto-generated database types
  lib/                 — Utilities
supabase/
  functions/           — Supabase Edge Functions (Deno)
  migrations/          — SQL migrations (applied to hosted Supabase)
```

## Deployment Notes

- Deploy via Replit Deployments
- The app is a static SPA — build with `npm run build`
- All backend logic lives in Supabase (hosted), no separate server needed
- Edge Functions with AI capabilities require `LOVABLE_API_KEY` set in Supabase dashboard
