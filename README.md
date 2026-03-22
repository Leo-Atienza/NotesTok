<p align="center">
  <h1 align="center">NotesTok</h1>
  <p align="center">
    <strong>Your Notes Become Your Study Companion</strong>
  </p>
  <p align="center">
    AI-powered study companion that transforms any study material into interactive micro-lessons with forced active recall quizzes, adaptive difficulty, and multi-modal delivery.
  </p>
  <p align="center">
    <a href="#features">Features</a> &bull;
    <a href="#how-it-works">How It Works</a> &bull;
    <a href="#tech-stack">Tech Stack</a> &bull;
    <a href="#getting-started">Getting Started</a> &bull;
    <a href="#architecture">Architecture</a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Build%20With%20AI-2026-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Build With AI 2026" />
    <img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-886FBF?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/GDG-UTSC-EA4335?style=for-the-badge&logo=google&logoColor=white" alt="GDG UTSC" />
  </p>
</p>

---

## The Problem

Studying is broken for most students. Traditional methods like highlighting and rereading are rated **LOW effectiveness** by cognitive science research ([Dunlosky et al., 2013](https://journals.sagepub.com/doi/10.1177/1529100612453266)). Meanwhile:

- **ADHD students** earn grades ~0.5 levels below peers ([DuPaul et al., 2021](https://doi.org/10.1007/s12402-020-00360-w))
- **International students** face 4.47x higher academic distress ([Chaliawala & Smith, 2025](https://doi.org/10.1007/s12144-024-07116-7))
- Only **practice testing** (active recall) is rated "high utility" — yet no mainstream tool enforces it

## The Solution

NotesTok takes any study material — PDFs, typed notes, photos of handwritten notes, or lecture recordings — and transforms it into **personalized, bite-sized interactive lessons** that adapt to how each student's brain works.

The core innovation: **Stop & Solve** — every 15-60 seconds, the lesson hard-pauses with a quiz question. Students cannot skip ahead without answering correctly. This enforces active recall, the single most effective study technique.

## Features

### Stop & Solve (Core Feature)
The lesson hard-pauses at quiz checkpoints. Students must answer correctly to continue. Wrong answers get progressive hints, then a full explanation, then the **Panic Button** — which calls Gemini to generate an entirely new explanation with a different analogy.

### Three Adaptive Learning Modes

| Mode | Target Persona | How It Works |
|------|---------------|-------------|
| **Scroll & Learn** | Focus-Seeking Student (ADHD) | 30-60s micro-segments, quizzes every 15-20s, gamification (XP, streaks) |
| **Commuter Audio** | Multi-Modal Learner | Podcast-style AI narration, voice-prompted quizzes, background playback |
| **Global Scholar** | ESL / International Student | Dual-layer simplification: exam terms stay unchanged, surrounding language simplified to CEFR B1-B2 |

### Personal AI Tutor
Each student gets a personal AI tutor powered by Gemini that remembers their strengths, weaknesses, and progress across sessions. It adapts difficulty in real-time and schedules spaced repetition for concepts the student struggled with.

### Gamification
XP rewards for correct answers, animated counters, and progress tracking — inspired by Duolingo's engagement model that improved retention from 12% to 55%.

## How It Works

```
1. Upload anything     →  PDF, text, images, or audio recordings
2. AI analyzes it      →  Gemini extracts key concepts and maps prerequisites
3. Generates a lesson  →  Lightweight JSON manifest (not a video file)
4. Delivers it         →  Interactive micro-lessons with TTS narration
5. Quizzes you         →  Stop & Solve forces active recall every 15-60s
6. AI adapts           →  Get it right? Speed up. Struggle? Simplify and re-explain.
```

### Why JSON Manifests, Not Videos

Traditional video learning tools require expensive GPU rendering. NotesTok generates a lightweight JSON blueprint that the client renders in real-time:

- **Instant generation** — lessons ready in seconds, not minutes
- **Adaptive mid-session** — if a student fails a quiz, Gemini regenerates a simpler explanation on the fly
- **Zero GPU costs** — no server-side video processing
- **Offline-capable** — a full chapter is 2-5 MB vs 200+ MB for video

## Tech Stack

The entire stack uses the **Google ecosystem**, aligning with the competition sponsor.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI** | Gemini 2.5 Flash | Content analysis, lesson generation, adaptive quizzing, language simplification |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui | Cross-platform web app with modern UI |
| **Voice** | Web Speech API (prototype) / Cloud TTS Chirp 3: HD (production) | Natural TTS narration in 30+ languages |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | Firebase Firestore | Learner profiles, lesson storage, offline sync |
| **Auth** | Firebase Auth | Google sign-in, 50K free MAU |
| **Deploy** | Vercel | Instant deployments, free tier |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Next.js)                  │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Upload   │  │ Lesson       │  │ Stop & Solve  │  │
│  │ Zone     │──│ Player       │──│ Quiz Gate     │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
│        │              │                │             │
│        │         TTS Engine       XP Counter         │
│        │        (Web Speech)     (Gamification)      │
└────────┼──────────────┼────────────────┼─────────────┘
         │              │                │
    ┌────▼────┐   ┌─────▼─────┐   ┌─────▼──────┐
    │/api/    │   │/api/      │   │/api/       │
    │analyze  │   │generate-  │   │panic       │
    │         │   │lesson     │   │simplify    │
    └────┬────┘   └─────┬─────┘   └─────┬──────┘
         │              │               │
         └──────────────┼───────────────┘
                        │
                ┌───────▼───────┐
                │  Google       │
                │  Gemini 2.5   │
                │  Flash        │
                └───────────────┘
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page + upload zone
│   ├── layout.tsx                    # Root layout with metadata
│   └── api/
│       ├── analyze/route.ts          # Notes → concept extraction
│       ├── generate-lesson/route.ts  # Concepts → lesson manifest
│       ├── panic/route.ts            # Panic button re-explanation
│       └── simplify/route.ts         # Global Scholar simplification
├── components/
│   ├── upload/UploadZone.tsx         # Drag-drop + text paste
│   ├── lesson/LessonPlayer.tsx       # Full lesson player
│   ├── quiz/StopAndSolve.tsx         # Quiz gate overlay
│   ├── gamification/                 # XP counter + popup
│   ├── scholar/                      # Global Scholar toggle
│   └── ui/                           # shadcn/ui components
├── hooks/
│   └── useLessonPlayer.ts           # Lesson state machine
└── lib/
    ├── gemini.ts                     # Gemini API client
    ├── prompts.ts                    # AI prompt templates
    ├── manifest-schema.ts            # JSON output schemas
    ├── tts.ts                        # Text-to-speech wrapper
    └── types.ts                      # TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key ([Get one free](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone the repository
git clone https://github.com/Leo-Atienza/NotesTok.git
cd NotesTok

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using NotesTok.

## The Science Behind NotesTok

NotesTok is built on three evidence-backed learning principles:

| Principle | Research | How NotesTok Uses It |
|-----------|----------|---------------------|
| **Active Recall** | Students who took recall tests retained 87% after 1 week vs 44% for restudying (Roediger & Karpicke, 2006) | Stop & Solve forces recall at every checkpoint |
| **Spaced Repetition** | 50%+ of new info lost within 1 day without reinforcement (Ebbinghaus, 1885; Murre & Dros, 2015) | AI tutor schedules review of failed concepts at increasing intervals |
| **Multimedia Learning** | Words + pictures outperform words alone; narration + visuals outperform text + visuals (Mayer, 2021) | Every lesson combines narration, visuals, text, and interaction |

## Competition

Built for **Build With AI 2026** — the AI case competition at the University of Toronto Scarborough, organized by Google Developer Group (GDG) UTSC.

**Case Brief**: "How can we build an AI-driven tool that helps students prepare for exams by adapting any academic content into a format that matches their unique learning style?"

---

<p align="center">
  <strong>NotesTok</strong> — Your notes become your feed. Your feed becomes your grade.<br/>
  Built for the Adaptive Brain. Powered by Google Gemini.
</p>
