# DropPilot AI

> AI-Powered Dropshipping Copilot: Product Discovery, Smart Pricing, Supplier Intelligence & Profit Goal Planning.

Built for the **PCCE Doomsday Hackathon (DEV ASTRA)**.

---

## 1. Overview

**DropPilot AI** is an all-in-one platform designed to assist dropshippers with data-backed decisions. It replaces guesswork with:
- **Product Discovery & Analysis**: Trend scoring, margin estimates, and market demand insights.
- **Supplier Intelligence & Trust Badges**: Multi-supplier comparisons assessing reliability, cost, and shipping speed.
- **AI Listing Studio & Multi-Platform Copy**: High-converting listings, SEO tags, and social media hooks generated via Google Gemini.
- **Smart Profit & Price Slider**: Interactive scenario modeling with deterministic financial math.
- **Shopify Store Integration**: One-click product and inventory synchronization via Shopify Admin API.
- **AI Profit Goal Planner & Recovery Assistant**: Real-time pacing tracker and strategic AI advisor for recovering missed profit targets.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React.js (Vite), HTML5, CSS3, JavaScript | Interactive, responsive client dashboard |
| **Backend** | Node.js, Express.js | Modular REST API and business logic services |
| **Database** | MongoDB & Mongoose | Document storage for users, products, suppliers, listings, orders, and goals |
| **AI Engine** | Google Gemini API | Natural language listing generation and goal advisory (backend only) |
| **Authentication** | JWT (JSON Web Tokens) | Stateless, secure endpoint protection |
| **Data Visualisation** | Chart.js | Visual performance metrics and goal milestone progress |
| **Store Integration**| Shopify Admin API | Connected storefront catalog synchronisation |
| **Data Ingestion** | CSV Parser (Backend) | Ingestion of external store orders and performance history |

---

## 3. Project Structure

```text
├── docs/                      # PRD, Context, and Architectural specifications
├── client/                    # React frontend application
│   ├── public/                # Static assets (favicons, images)
│   └── src/
│       ├── assets/            # Component-level static media
│       ├── components/        # Reusable UI elements (cards, badges, modals, charts)
│       ├── context/           # React Context state providers
│       ├── hooks/             # Custom utility hooks
│       ├── layouts/           # Page layout frames (MainLayout, AuthLayout)
│       ├── pages/             # View components for application routes
│       ├── services/          # Frontend API HTTP clients
│       ├── styles/            # CSS stylesheets and design tokens
│       └── utils/             # Formatters and constants
├── server/                    # Node.js & Express REST API
│   └── src/
│       ├── config/            # DB connection and environment validation
│       ├── controllers/       # HTTP request handlers
│       ├── middleware/        # Auth, error handling, and input validation
│       ├── models/            # Mongoose data models
│       ├── routes/            # Express route endpoints
│       ├── services/          # Business logic (AI, Shopify, Suppliers, Pricing)
│       ├── utils/             # Deterministic financial calculators and helpers
│       └── validators/        # Request schema validation
├── .env.example               # Template for required environment variables
├── .gitignore                 # Files excluded from git tracking
└── README.md                  # Project documentation
```

---

## 4. Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas connection)
- Google Gemini API Key

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd DEV-ASTRA-Doom-n--Debug-
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in the root (or server) and populate actual keys:
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies:**
   - **Backend:**
     ```bash
     cd server
     npm install
     ```
   - **Frontend:**
     ```bash
     cd ../client
     npm install
     ```

4. **Run the Applications:**
   - **Backend (Port 5000):**
     ```bash
     cd server
     npm run dev
     ```
   - **Frontend (Port 5173):**
     ```bash
     cd client
     npm run dev
     ```

---

## 5. Security & Principles

- **No client-side API secrets**: Google Gemini keys and Shopify credentials remain strictly on the backend.
- **Deterministic financial arithmetic**: Profit, margins, and fees are computed by validated backend algorithms, never hallucinated by LLMs.
