# Worthy Papercuts 📚

A full-stack book tracking and discovery platform with AI-powered recommendations and an intelligent conversational assistant. Users can search for books, manage reading lists, and rate and review titles. Built as a portfolio project to showcase microservice architecture, machine learning integration, and modern AI agent development.

---

## Live Demo

> _Link to deployed app here_

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Planned Features](#planned-features)
- [Author](#author)

---

## Overview

The interesting part of this project is not just the features — it's the deliberate engineering decisions behind them.

Rather than building a monolith, the system is split into three independently deployable services: a NestJS API, a Python ML microservice, and a React frontend. Recommendations are decoupled from the request cycle entirely — pre-computed on a schedule and served instantly from the database. The AI chatbot is implemented as a proper tool-calling agent rather than a simple prompt wrapper, giving it the ability to take real actions on a user's behalf.

The stack was chosen to reflect real-world trade-offs:

- **NestJS + TypeScript** for a structured, scalable backend with clear module boundaries
- **React** for a lightweight frontend that calls Google Books API directly, keeping book search out of the backend
- **Python + scikit-learn** for the ML layer — keeping data science concerns out of the Node service
- **Google ADK + Gemini** for an agent that reasons over tools rather than just generating text
- **PostgreSQL on Neon.tech** for a serverless-friendly managed database

---

## Features

### Core

- 🔐 JWT authentication — register, login, logout
- 📚 Search for books via Google Books API
- 📋 Save books to lists — **To Read**, **Currently Reading**, **Finished**
- 🔄 Move books between lists
- ⭐ Rate and review finished books
- 🔍 Search and filter within your own lists
- 👥 View other users' ratings and reviews on book detail pages

### AI Features

- 🤖 **AI Book Recommendations** — personalized suggestions powered by a Python ML microservice using content-based filtering (TF-IDF + cosine similarity). Recommendations are pre-computed on a schedule and pulled from Google Books API based on your taste profile
- 💬 **AI Chatbot Agent** — powered by Google ADK and Gemini. Can search for books, add them to your lists, fetch your recommendations, and discuss literary topics conversationally

---

## Architecture

```
                    ┌─────────────────────┐
                    │   Google Books API  │◄──────────────────────┐
                    └──────────┬──────────┘                       │
                               │ book search (direct)             │ recommendation
                               ▼                                  │ candidates
┌──────────────────────────────────────────────────────────┐      │
│                       React Frontend                     │      │
│    Dashboard │ Explore │ ChatBot │ LoginRegister         │      │
└────────────────────────────┬─────────────────────────────┘      │
                             │ HTTP / REST + JWT                  │
┌────────────────────────────▼─────────────────────────────┐      │
│                      NestJS Backend                      │      │
│     Auth │ Lists │ Reviews │ Recommender │ Chatbot Agent │──────┘
└──────┬────────────────────────────────────────┬──────────┘
       │ HTTP (cron-triggered)                  │ TypeORM
       │                               ┌────────▼────────┐
┌──────▼──────────────┐                │   PostgreSQL DB │
│  Python Recommender │                │   (Neon.tech)   │
│   ML Microservice   │                └─────────────────┘
│   (scikit-learn /   │
│   TF-IDF + cosine)  │
└─────────────────────┘
```

### Request Flow — Recommendations

```
Scheduled job (every 12 hours)
        │
        ▼
NestJS fetches user's finished books + ratings from DB
        │
        ▼
POST to Python /recommend
        │
        ▼
Python extracts taste profile (top genres, authors, keywords)
Builds search queries → hits Google Books API
Scores candidates via cosine similarity
        │
        ▼
Returns top 10 books → NestJS saves to recommendations table
        │
        ▼
User hits GET /recommendations → instant response from DB ⚡
```

### Request Flow — AI Chatbot

```
User: "Add Dune to my reading list"
        │
        ▼
POST /chatbot/message → NestJS ChatbotService
        │
        ▼
Google ADK Agent (Gemini 1.5 Flash)
  → calls search_books tool (Google Books API)
  → confirms book with user
  → calls add_book_to_list tool (directly hits ListsService)
        │
        ▼
"Done! I've added Dune by Frank Herbert to your To Read list."
```

---

## Tech Stack

### [Backend](https://github.com/blackbook98/book-share-service)

| Technology                 | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| NestJS + TypeScript        | REST API, business logic, agent              |
| TypeORM                    | ORM for PostgreSQL                           |
| PostgreSQL (Neon.tech)     | Primary database                             |
| JWT + Passport.js          | Authentication                               |
| Google ADK (`@google/adk`) | AI agent framework                           |
| Gemini 2.5 Flash           | LLM powering the chatbot                     |
| `@nestjs/schedule`         | Cron jobs for recommendation pre-computation |

### [Python ML Service](https://github.com/blackbook98/worthy-papercuts-recommender)

| Technology    | Purpose                                  |
| ------------- | ---------------------------------------- |
| FastAPI       | Lightweight API framework                |
| scikit-learn  | TF-IDF vectorization + cosine similarity |
| httpx         | Async Google Books API calls             |
| python-dotenv | Environment variable management          |

### [Frontend](https://github.com/blackbook98/worthy-papercuts)

| Technology       | Purpose                                     |
| ---------------- | ------------------------------------------- |
| React            | Frontend framework                          |
| Google Books API | Book search (called directly from frontend) |

### Infrastructure

| Technology            | Purpose                          |
| --------------------- | -------------------------------- |
| Google Cloud Run      | Serverless container hosting     |
| Docker                | Containerization                 |
| GCP Artifact Registry | Container image storage          |
| Cloud Scheduler       | Triggers recommendation cron job |

---

## API Documentation

The NestJS backend exposes the following endpoints. All endpoints except auth require a valid JWT in the `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| POST   | `/auth/register` | Register a new user   |
| POST   | `/auth/login`    | Login and receive JWT |
| POST   | `/auth/logout`   | Logout                |

### Lists

| Method | Endpoint         | Description                 |
| ------ | ---------------- | --------------------------- |
| GET    | `/lists`         | Get user's reading lists    |
| POST   | `/saveLists`     | Add a book to a list        |
| PATCH  | `/lists/:bookId` | Move book to different list |
| DELETE | `/lists/:bookId` | Remove book from lists      |

### Reviews

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| POST   | `/reviews`              | Create a review            |
| PATCH  | `/reviews/:id`          | Edit own review            |
| DELETE | `/reviews/:id`          | Delete own review          |
| GET    | `/reviews/book/:bookId` | Get all reviews for a book |

### Recommendations

| Method | Endpoint           | Description                      |
| ------ | ------------------ | -------------------------------- |
| GET    | `/recommendations` | Get personalized recommendations |

### Chatbot

| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| POST   | `/chatbot/message` | Send a message to the AI agent |

### Python Recommender (internal)

| Method | Endpoint     | Description                        |
| ------ | ------------ | ---------------------------------- |
| POST   | `/recommend` | Compute recommendations for a user |
| GET    | `/health`    | Health check                       |

---

## Project Structure

Each service lives in its own repository. Click the section headers to visit each repo.

### [Backend](https://github.com/blackbook98/book-share-service)

```
src/
├── auth/                 # JWT auth, guards, strategies
├── user/                 # User entity and service
├── recommender/          # Cron job, recommendation storage
├── chatbot/              # ADK agent, tools for agent
│   └── tools/
│       ├── books.tool.ts
│       └── lists.tool.ts
└── database/
    └── models/           # TypeORM entities
```

### [Frontend](https://github.com/blackbook98/worthy-papercuts)

```
src/
├── Components/
│   ├── About.js
│   ├── ChatBot.js
│   ├── Dashboard.js
│   ├── Explore.js
│   ├── LoginRegister.js
│   ├── Logout.js
│   └── ReviewModal.js
├── helpers/
│   └── helper_axios.js
├── App.js
└── index.js
```

### [Python Recommender](https://github.com/blackbook98/worthy-papercuts-recommender)

```
├── main.py               # FastAPI app
├── recommender.py        # TF-IDF + cosine similarity logic
└── requirements.txt
```

---

## Planned Features

- **Collaborative filtering** — cross-user recommendations once the platform has sufficient rating data
- **User profile page** — reading stats, favourite genres, reviews written
- **Book exchange system** — match users within 10km who want to exchange books, using PostGIS geospatial queries
- **Reading pace tracker** — log reading sessions and predict finish dates

---

## Author

Built by **Oindrila Chakraborti**

- GitHub: [blackbook98](https://github.com/blackbook98)
- LinkedIn: [oindrila-chakraborti](https://www.linkedin.com/in/oindrila-chakraborti)
