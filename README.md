# DropPilot AI 🚀

> **Autonomous AI Dropshipping Business Manager**  
> *End-to-End Product Discovery, Multi-Model AI Intelligence, Unit Economics, Real Shopify Storefront Sync & Profit Accounting.*

**Built for DEV ASTRA 2.0 Hackathon (Problem Statement 18: AI Dropshipping Business Manager)**

[![Tests](https://img.shields.io/badge/tests-101%2F101%20passing-brightgreen.svg)](#6-testing--verification)
[![Shopify](https://img.shields.io/badge/shopify-live%20sync%20verified-success.svg)](https://droppilot-demo-store.myshopify.com)
[![AI](https://img.shields.io/badge/ai-gemini%20%2B%20minilm%20%2B%20roberta-orange.svg)](#3-multi-model-ai-architecture)
[![Database](https://img.shields.io/badge/database-mongodb%20atlas%20active-green.svg)](#4-setup--installation-guide)

---

## 1. Project Overview

Over 90% of beginner dropshippers fail in their first month due to operational fragmentation—juggling separate tools for product hunting, supplier checks, pricing guesswork, ad copy, and store inventory.

**DropPilot AI** transforms this fragmented workflow into a unified, data-grounded pipeline:
* **Product Discovery & Multi-Criteria Scoring**: 5-dimensional evaluation (Margin 30%, Demand 25%, Supplier 20%, Shipping 10%, Semantic query 15%) bounded between 0–100.
* **Customer Feedback Sentiment (RoBERTa)**: Batch sentiment analysis of real buyer reviews using CardiffNLP RoBERTa.
* **Semantic Discovery (MiniLM)**: Lifestyle and intent search powered by Hugging Face `all-MiniLM-L6-v2` with deterministic lexical cosine fallback.
* **Supplier Intelligence & Landed Cost**: 3-way side-by-side comparison auditing reliability, shipping speed, and landed unit costs.
* **Deterministic Smart Pricing**: Integer-paise unit economics modeling break-even ROAS, CAC thresholds, and net margins (preventing floating-point rounding errors).
* **Gemini AI Listing Studio**: Google Gemini 1.5/2.0 engine generating SEO titles (under 60 chars), meta descriptions (under 155 chars), and target keywords.
* **Live Shopify Storefront Sync**: Direct Admin REST API integration pushing products, inventory policies, and high-res imagery to live Shopify stores with 1-click publishing.
* **Automated CFO Profit Planner**: Monthly profit target tracking, order ledger CSV reconciliation, and AI-driven goal recovery pacing.

---

## 2. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 5, TailwindCSS, Chart.js | Champagne-aesthetic studio workspace (`#FFF1D6`, `#FCE8CC`), zero layout shift, responsive dashboards |
| **Backend** | Node.js (v20+), Express.js (ESM) | Modular REST API with strict Joi/manual schema validation & structured envelopes |
| **Database** | MongoDB Atlas & Mongoose 8 | Multi-node replica set (`Cluster0`) with automatic in-memory fallback for offline testing |
| **Generative AI** | Google Gemini API (`@google/genai` v3) | High-converting listing creation, multi-platform copy (Shopify, Amazon, Social), and recovery chat |
| **NLP & Vectors** | Hugging Face Serverless Router | CardiffNLP RoBERTa sentiment + MiniLM semantic vector embeddings with circuit breaker |
| **Store Sync** | Shopify Admin REST API (2024-07) | Real product publishing, image attachments, and `inventory_policy: 'continue'` fulfillment |
| **Financial Engine**| Custom Deterministic Math | Exact integer-paise unit economics eliminating IEEE 754 floating-point errors |

---

## 3. Multi-Model AI Architecture

```
[ User Query / Product Intent ]
             │
             ├──► Hugging Face MiniLM (Semantic Vector Search)
             │    └── Fallback: Deterministic Lexical Cosine Engine
             │
             ├──► CardiffNLP RoBERTa (Review Sentiment Analysis)
             │    └── Fallback: High-Fidelity Sentiment Lexicon
             │
             ├──► Multi-Criteria Opportunity Engine (0 - 100 Score)
             │    └── Margin (30%) + Demand (25%) + Supplier (20%) + Speed (10%) + Semantic (15%)
             │
             ├──► Deterministic Pricing Math (Break-Even ROAS & Margins)
             │
             ├──► Google Gemini 1.5/2.0 (SEO Copy, Descriptions, Channel Tags)
             │
             └──► Shopify Admin REST API (Live Store Publishing)
```

---

## 4. Setup & Installation Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9+
* **Git** installed on your system

### Step 1: Clone the Repository
```bash
git clone https://github.com/bhaveshkankonkar1411-sketch/DEV-ASTRA-Doom-n--Debug-.git
cd DEV-ASTRA-Doom-n--Debug-
```

### Step 2: Install Dependencies
Install dependencies for both client and server:

```bash
# 1. Install Frontend packages
cd client
npm install

# 2. Install Backend packages
cd ../server
npm install
```

### Step 3: Configure Environment Variables
Inside the `server/` directory, create a `.env` file (refer to `.env.example` in root):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.vkr3bew.mongodb.net/droppilot?retryWrites=true&w=majority
JWT_SECRET=droppilot_super_secret_jwt_key_2026

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Hugging Face
HUGGINGFACE_API_KEY=your_huggingface_token_here

# Shopify Live Integration
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_ACCESS_TOKEN=your_shopify_admin_access_token
SHOPIFY_SHOP_DOMAIN=droppilot-demo-store.myshopify.com
```

> **Note:** If external credentials are unset, DropPilot's built-in demo fixtures and deterministic fallbacks allow full exploration with zero crashes.

### Step 4: Run the Application

Open two terminal windows:

* **Terminal 1: Start Backend API**
  ```bash
  cd server
  npm start
  ```
  *(Server runs at `http://localhost:5000` — `GET /health` returns `200 OK`)*

* **Terminal 2: Start Frontend Application**
  ```bash
  cd client
  npm run dev
  ```
  *(Vite app opens at `http://localhost:5173`)*

---

## 5. Live Demo Walkthrough Procedure

Follow this flow for the complete judge demonstration:

1. **Home Launchpad (`/home`)**: Introduction to the dropshipping autopilot cockpit.
2. **Overview Dashboard (`/overview`)**: Live KPI metrics (Revenue, Net Profit, Avg Margin, Profit Target Ring).
3. **Product Discovery (`/discover`)**:
   * Search `"fan"` or `"ergonomic"` to trigger MiniLM Semantic Search (`⚡ 95% match`).
   * Inspect CardiffNLP RoBERTa Sentiment Analysis on verified reviews.
   * View the 0–100 AI Opportunity Score breakdown.
4. **Supplier Intelligence (`/suppliers`)**:
   * Side-by-side 3-way supplier audit.
   * Total Landed Cost calculations and verified trust badges.
5. **Smart Pricing Engine (`/pricing`)**:
   * Interactive pricing sliders with real-time break-even ROAS and net profit margins.
6. **AI Listing Studio (`/content` / `/listing`)**:
   * Select channel (Shopify SEO, Amazon, Social).
   * Click **"Create channel copy"** to run live Google Gemini generation.
   * Click **"Save to Database"** to persist copy to MongoDB Atlas.
7. **Shopify Synchronisation (`/shopify`)**:
   * Select products (*Posture Support Brace*, *Portable Neck Fan*).
   * Click **"Sync Selected Products"**.
   * View live storefront at `https://droppilot-demo-store.myshopify.com` with active "Add to Cart" and images.
8. **Profit Goal Planner & Recovery (`/goals` / `/recovery`)**:
   * Monthly goal setting, milestone progression, and order ledger CSV ingestion.
   * Pacing recovery advisor with daily order shortfall recommendations.

---

## 6. Testing & Verification

DropPilot includes comprehensive test suites across both client and server:

```bash
# Run Client Contract & End-to-End Tests (21/21 Passing)
cd client
npm test

# Run Server PRD Test Matrix & API Suites (80/80 Passing)
cd ../server
npm test

# Verify Vite Production Build
cd ../client
npm run build
```

**Total Test Coverage:** **101 tests passed, 0 failures, 100% green build.**

---

## 7. Security & Integrity Highlights

* **Zero Hardcoded Secrets**: All private API tokens remain strictly on the backend inside gitignored `.env`.
* **Deterministic Accounting**: Financial calculations are run on server-validated algorithms, never hallucinated by LLMs.
* **Resilient Dual-Path Architecture**: External API timeouts (15s on Gemini, 10s on Hugging Face) cleanly degrade to deterministic fallbacks with transparent UI source disclosures.

---

## 8. Team — Dev Astra (Doom & Debug)

* **Hackathon:** PCCE Doomsday Hackathon (DEV ASTRA 2.0)
* **Problem Statement 18:** AI Dropshipping Business Manager
* **Repository:** [bhaveshkankonkar1411-sketch/DEV-ASTRA-Doom-n--Debug-](https://github.com/bhaveshkankonkar1411-sketch/DEV-ASTRA-Doom-n--Debug-)
