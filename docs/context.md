# DropPilot AI --- Project Context

> **Project status:** Initial project setup\
> **Hackathon:** 24-hour hackathon\
> **Document purpose:** Source of truth for developers and AI coding
> assistants\
> **Last updated:** 13 November 2026

------------------------------------------------------------------------

## 1. Project Summary

### 1.1 Overview

**DropPilot AI** is an AI-powered dropshipping business manager designed
to help entrepreneurs discover products, create product listings,
compare suppliers, calculate pricing, synchronise products with an
online store, and understand their business performance.

Dropshipping sellers often spend significant time researching products,
preparing listings, comparing suppliers, deciding prices, and monitoring
profitability. DropPilot AI aims to bring these activities into one
platform and use AI to reduce repetitive work and provide explainable
recommendations.

The product is intended for:

-   Dropshipping entrepreneurs.
-   E-commerce sellers.
-   Digital agencies managing online stores.
-   Online retailers.

The initial product should prioritise dropshipping entrepreneurs.
Support for other customer groups can be expanded later.

### 1.2 Main user journey

1.  A user signs in to DropPilot AI.
2.  The user discovers products using the Product Discovery area.
3.  The user reviews product information and an opportunity analysis.
4.  The user generates a product title, description, SEO content, and
    marketing copy using AI.
5.  The user compares available suppliers and selects one.
6.  The user adjusts the selling price and reviews estimated profit.
7.  The user publishes or synchronises the product with a connected
    Shopify store.
8.  The user can review dashboard information and manage available order
    data.
9.  Existing sellers can import store performance data, set a monthly
    net-profit target, and receive AI-assisted recommendations through
    the Profit Goal Planner.

### 1.3 Scope and feature classification

#### Core MVP features

These are the primary requirements and should be prioritised:

1.  **Product Discovery Grid** --- browse, search, filter, and inspect
    products.
2.  **AI Product Listing Generation** --- generate editable product
    titles, descriptions, features, and SEO content.
3.  **Supplier Integration and Comparison** --- retrieve or display
    supplier product, price, availability, and shipping information.
4.  **Store Synchronisation** --- connect to and synchronise products
    with one e-commerce platform. Shopify is the planned first platform.

#### Additional features

Implement these after the core workflow is stable:

5.  **Live Profit & Price Slider** --- adjust selling price and relevant
    costs and immediately recalculate estimated profit and margin.
6.  **Supplier Trust Badges** --- display supplier indicators such as
    verified status, rating, delivery estimate, and availability. Only
    show values supported by actual or clearly labelled demo data.
7.  **Multi-Platform Content Generator** --- generate content variants
    for:
    -   Shopify SEO title and description.
    -   Instagram promotional captions and hashtags.
    -   TikTok hooks and short video scripts.
8.  **AI Profit Goal Planner & Recovery Assistant** --- help existing
    sellers set and track a monthly net-profit target, analyse imported
    store data, and receive practical recommendations.

Order management, customer dispute handling, advanced automation,
multi-store management, and additional marketplace integrations are
possible future enhancements. They are not required for the first
working MVP unless time permits.

### 1.4 Business model context

Potential revenue streams:

-   Monthly subscriptions.
-   Product research credits.
-   Order processing fees.
-   Supplier commissions or referral fees.
-   Premium automation modules.

These are business-model possibilities, not payment features that must
be implemented during the hackathon.

### 1.5 Product principles

-   Prefer a complete, demonstrable workflow over many incomplete
    screens.
-   Be transparent about demo, estimated, and externally sourced data.
-   Never imply that a product will definitely be profitable.
-   Never guarantee a user's profit target will be achieved.
-   Use backend code for deterministic calculations.
-   Use AI for language generation, explanations, and recommendations
    grounded in supplied data.

------------------------------------------------------------------------

## 2. Technology Stack

The following is the **approved planned stack** for the initial
implementation. Since the project is being created from scratch,
versions and exact package choices should be selected during setup and
then recorded here. Do not replace this stack without explicit
project-owner approval.

  -----------------------------------------------------------------------
  Layer                   Planned technology      Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                React.js, HTML, CSS,    User interface and
                          JavaScript              client-side
                                                  interactions

  Backend                 Node.js and Express.js  REST API, business
                                                  logic, integrations

  Database                MongoDB                 Users, products,
                                                  suppliers, listings,
                                                  orders, goals, and
                                                  imported records

  AI                      Google Gemini API       Listing generation,
                                                  product explanations,
                                                  and business
                                                  recommendations

  Authentication          JWT                     Authenticated API
                                                  access

  Charts                  Chart.js                Revenue, expense,
                                                  profit, and
                                                  goal-progress
                                                  visualisations

  Store integration       Shopify Admin API       Connected-store product
                                                  synchronisation

  Data import             CSV parsing in backend  Hackathon-friendly
                                                  store-data import

  Version control         Git                     Source control and team
                                                  collaboration

  Deployment              TBD                     Choose deployment
                                                  provider during
                                                  implementation
  -----------------------------------------------------------------------

### 2.1 Stack rules

-   Use React for the frontend and Express for the backend.
-   Use MongoDB as the planned persistent database.
-   Call Gemini from the backend only. Never expose the Gemini API key
    in frontend code.
-   Keep Shopify credentials and access tokens on the backend.
-   Use JWT authentication for protected API routes.
-   Use Chart.js for charts where charts are needed.
-   Do not add another frontend framework, backend framework, database,
    or AI provider without approval.
-   If a dependency or exact version is not yet selected, mark it as TBD
    rather than claiming it is installed.

### 2.2 Suggested package categories

The exact dependencies are TBD until installation. Expected categories
include:

-   Frontend: React, React DOM, a development/build tool, and an HTTP
    client if needed.
-   Backend: Express, MongoDB driver or Mongoose, JWT library, password
    hashing library, environment-variable loader, validation library,
    CSV parser, and CORS middleware.
-   AI: official or supported Google Gemini SDK.
-   Charts: Chart.js and its React integration if required.

Do not install every suggested package automatically. Add only packages
needed by implemented features.

------------------------------------------------------------------------

## 3. Planned Project Folder Structure

This is the proposed starting structure, not a claim that these files
already exist. The team may refine filenames while preserving the
separation of responsibilities.

``` text
droppilot-ai/
├── client/
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── environment.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── suppliers/
│   │   │   └── shopify/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── docs/
│   └── PRD.md
├── .env.example
├── .gitignore
├── context.md
└── README.md
```

### 3.1 Folder responsibilities

#### Frontend --- `client/src/`

-   `assets/`: local images, icons, and other static assets.
-   `components/`: reusable UI elements such as buttons, cards, badges,
    modals, form controls, and navigation.
-   `pages/`: route-level screens such as Dashboard, Product Discovery,
    Listing Studio, Suppliers, Pricing, Store Integration, and Profit
    Goal Planner.
-   `layouts/`: shared page layouts and navigation shells.
-   `services/`: frontend API-client functions. These call the backend;
    they must not contain private API credentials.
-   `hooks/`: reusable React hooks.
-   `context/`: shared client-side state where appropriate.
-   `utils/`: frontend formatting and presentation helpers.
-   `styles/`: global styles, design tokens, and shared CSS.

#### Backend --- `server/src/`

-   `config/`: database connection and environment configuration.
-   `controllers/`: request handlers that validate input, call services,
    and return responses.
-   `middleware/`: authentication, error handling, and
    request-processing middleware.
-   `models/`: MongoDB schemas/models.
-   `routes/`: Express route definitions.
-   `services/`: business logic and external-service integrations.
-   `services/ai/`: Gemini prompts and AI service functions.
-   `services/suppliers/`: supplier data access and supplier comparison
    logic.
-   `services/shopify/`: Shopify authentication and Admin API
    operations.
-   `utils/`: shared backend helpers.
-   `validators/`: request and imported-data validation.
-   `app.js`: Express application setup and middleware registration.
-   `server.js`: server startup and database connection lifecycle.

### 3.2 Suggested frontend pages

-   Login / Register.
-   Main Dashboard.
-   Product Discovery.
-   Product Details / Product Analysis.
-   AI Listing Studio.
-   Supplier Comparison.
-   Smart Pricing.
-   Shopify Store Connection / Sync.
-   Multi-Platform Content Generator.
-   AI Profit Goal Planner.
-   Goal Recovery Assistant.

Create pages when their functionality is being implemented; do not
create empty placeholder pages just to match this list.

------------------------------------------------------------------------

## 4. Coding Conventions

### 4.1 General

-   Use descriptive names that explain purpose.
-   Prefer small, focused functions and components.
-   Avoid duplicated business logic.
-   Keep frontend presentation separate from backend business logic.
-   Do not put database queries directly inside route definitions.
-   Keep external API calls inside service modules.
-   Validate all untrusted input on the backend.
-   Handle loading, empty, success, and error states in the UI.
-   Use consistent formatting and indentation.
-   Add comments for non-obvious logic, not for every line.
-   Do not leave secrets, access tokens, or private customer data in
    source control.

### 4.2 Naming

-   React components and component files: `PascalCase` (for example,
    `ProductCard.jsx`).
-   JavaScript variables and functions: `camelCase`.
-   Constants: `UPPER_SNAKE_CASE` when appropriate.
-   Backend route files: descriptive lowercase names (for example,
    `productRoutes.js`).
-   MongoDB model names: singular descriptive names (for example,
    `Product`).
-   API paths: lowercase plural resource names where appropriate (for
    example, `/api/products`).

### 4.3 API and error handling

-   Use JSON for API request and response bodies unless a file upload is
    required.
-   Use appropriate HTTP status codes.
-   Return a consistent error structure.
-   Never return stack traces, secret values, or internal credentials to
    clients.
-   Log useful server-side diagnostic information without logging
    secrets.
-   Use pagination for potentially large collections.
-   Use backend validation even if frontend validation is also present.

### 4.4 Financial and data rules

-   Store monetary values as integer minor units (for example, paise)
    where practical, or use a consistent decimal-safe representation. Do
    not rely on binary floating-point arithmetic for authoritative
    financial totals.
-   Record currency explicitly. The initial demo may use INR, but do not
    assume all future stores use INR.
-   Define which expenses are included in net profit.
-   Distinguish revenue, gross profit, and net profit.
-   Keep original imported data and its source identifiable.
-   Mark sample records and simulated supplier values clearly.
-   Do not mix sample data with real connected-store data without a
    visible source label.

------------------------------------------------------------------------

## 5. API Contract

### 5.1 API conventions

**Base path:** `/api`

All endpoints below are **planned contracts**. They are not implemented
merely because they are documented here. Update their status when
development begins.

#### Standard success response

``` json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

#### Standard error response

``` json
{
  "success": false,
  "message": "A human-readable error message",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

#### Authentication

Protected endpoints require:

``` http
Authorization: Bearer <JWT>
```

Do not put tokens in query strings. Never include actual tokens in
documentation or logs.

### 5.2 Authentication

  Method   Endpoint               Purpose                    Auth
  -------- ---------------------- -------------------------- ------
  POST     `/api/auth/register`   Register a user            No
  POST     `/api/auth/login`      Authenticate a user        No
  GET      `/api/auth/me`         Get current user profile   Yes

**Register request**

``` json
{
  "name": "Demo User",
  "email": "user@example.com",
  "password": "user-provided-password"
}
```

**Login request**

``` json
{
  "email": "user@example.com",
  "password": "user-provided-password"
}
```

**Auth success response data**

``` json
{
  "user": {
    "id": "user_id",
    "name": "Demo User",
    "email": "user@example.com"
  },
  "token": "jwt_token"
}
```

The token shown is a shape placeholder, not a real credential.

### 5.3 Product discovery and analysis

  ---------------------------------------------------------------------------------------
  Method            Endpoint                          Purpose           Auth
  ----------------- --------------------------------- ----------------- -----------------
  GET               `/api/products`                   Search and list   Yes
                                                      products          

  GET               `/api/products/:productId`        Get product       Yes
                                                      details           

  POST              `/api/products/analyze`           Analyse a product Yes
                                                      using available   
                                                      data              

  POST              `/api/products/:productId/save`   Save product to   Yes
                                                      user's catalogue  
  ---------------------------------------------------------------------------------------

**Product list query parameters**

-   `search`: optional text search.
-   `category`: optional category filter.
-   `page`: page number.
-   `limit`: page size.
-   `source`: `demo`, `supplier`, or another supported source.

**Product analysis request**

``` json
{
  "productId": "product_id",
  "analysisContext": {
    "targetMarket": "IN",
    "desiredMarginPercent": 30
  }
}
```

**Product response data**

``` json
{
  "items": [
    {
      "id": "product_id",
      "name": "Wireless Earbuds",
      "category": "Electronics",
      "description": "Product description",
      "supplierCost": 50000,
      "currency": "INR",
      "imageUrl": "https://example.com/product.jpg",
      "sourceType": "demo"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Amounts in this example use paise: `50000` represents ₹500. The
implementation must use one documented monetary convention consistently.

**Product analysis response data**

``` json
{
  "productId": "product_id",
  "opportunityScore": 78,
  "scoreLabel": "Demo estimate",
  "strengths": ["Potential margin based on supplied cost"],
  "risks": ["Market demand data has not been verified"],
  "recommendation": "Review supplier and competitor information before listing",
  "dataSource": "demo"
}
```

Scores and recommendations must be traceable to supplied information. Do
not fabricate live demand or trend data.

### 5.4 AI listing generation

  -----------------------------------------------------------------------------------
  Method            Endpoint                      Purpose           Auth
  ----------------- ----------------------------- ----------------- -----------------
  POST              `/api/ai/listings/generate`   Generate editable Yes
                                                  product listing   
                                                  content           

  -----------------------------------------------------------------------------------

**Request**

``` json
{
  "productId": "product_id",
  "productDetails": {
    "name": "Wireless Earbuds",
    "features": ["Bluetooth connectivity", "Charging case"],
    "specifications": {
      "colour": "Black"
    }
  },
  "tone": "professional",
  "targetAudience": "Everyday consumers"
}
```

**Response data**

``` json
{
  "title": "Generated product title",
  "description": "Generated product description",
  "keyFeatures": ["Feature one", "Feature two"],
  "seoTitle": "SEO title",
  "seoDescription": "SEO description",
  "keywords": ["wireless earbuds", "Bluetooth audio"],
  "generatedBy": "gemini",
  "status": "draft"
}
```

Generated content must remain editable and must not invent product
specifications, certifications, warranties, or performance claims.

### 5.5 Supplier management and comparison

  ---------------------------------------------------------------------------------------------
  Method            Endpoint                                Purpose           Auth
  ----------------- --------------------------------------- ----------------- -----------------
  GET               `/api/suppliers`                        List available    Yes
                                                            suppliers         

  GET               `/api/suppliers/:supplierId`            Get supplier      Yes
                                                            details           

  GET               `/api/suppliers/:supplierId/products`   List supplier     Yes
                                                            products          

  POST              `/api/suppliers/compare`                Compare suppliers Yes
                                                            for a product     
  ---------------------------------------------------------------------------------------------

**Compare request**

``` json
{
  "productId": "product_id",
  "supplierIds": ["supplier_a", "supplier_b"]
}
```

**Response data**

``` json
{
  "productId": "product_id",
  "comparisons": [
    {
      "supplierId": "supplier_a",
      "name": "Demo Supplier A",
      "unitCost": 50000,
      "currency": "INR",
      "availability": "in_stock",
      "estimatedShippingDays": 4,
      "rating": 4.6,
      "verified": false,
      "sourceType": "demo"
    }
  ],
  "recommendedSupplierId": "supplier_a",
  "recommendationReason": "Lowest available demo cost among the supplied options"
}
```

A supplier trust badge must reflect known fields only. A demo supplier
must never be presented as genuinely verified. Supplier recommendation
logic should be explainable and should consider more than price when
reliable data is available.

### 5.6 Pricing calculations

  --------------------------------------------------------------------------------
  Method            Endpoint                   Purpose           Auth
  ----------------- -------------------------- ----------------- -----------------
  POST              `/api/pricing/calculate`   Calculate         Yes
                                               estimated product 
                                               economics         

  --------------------------------------------------------------------------------

**Request**

``` json
{
  "currency": "INR",
  "sellingPrice": 99900,
  "supplierCost": 50000,
  "shippingCost": 5000,
  "platformFees": 3000,
  "advertisingCostPerOrder": 7000,
  "otherCosts": 0
}
```

**Response data**

``` json
{
  "currency": "INR",
  "totalCost": 65000,
  "estimatedProfit": 34900,
  "profitMarginPercent": 34.93,
  "calculationBasis": "backend",
  "isEstimate": true
}
```

The backend must perform the arithmetic. The frontend slider may call
this endpoint or calculate a preview using the same validated formula,
but the backend result is authoritative.

### 5.7 Shopify store synchronisation

  -------------------------------------------------------------------------------------------
  Method            Endpoint                              Purpose           Auth
  ----------------- ------------------------------------- ----------------- -----------------
  POST              `/api/stores/shopify/connect`         Begin or complete Yes
                                                          Shopify           
                                                          connection flow   

  GET               `/api/stores/shopify/status`          Get connection    Yes
                                                          status            

  POST              `/api/stores/shopify/products/sync`   Create or update  Yes
                                                          a product in      
                                                          Shopify           

  DELETE            `/api/stores/shopify/disconnect`      Disconnect the    Yes
                                                          store             
  -------------------------------------------------------------------------------------------

**Sync request**

``` json
{
  "productId": "product_id",
  "listing": {
    "title": "Product title",
    "descriptionHtml": "<p>Product description</p>",
    "price": "999.00",
    "currency": "INR"
  },
  "mode": "create"
}
```

**Sync response data**

``` json
{
  "store": "shopify",
  "status": "synced",
  "externalProductId": "shopify_product_id",
  "syncedAt": "2026-11-13T10:00:00.000Z"
}
```

Shopify connection must follow Shopify's current authentication, scopes,
API-version, and app requirements. Never collect or expose a merchant's
private access token through frontend code. A simulated sync must be
labelled as simulated and must not be reported as a real Shopify
publication.

### 5.8 Orders

  -------------------------------------------------------------------------------------
  Method            Endpoint                        Purpose           Auth
  ----------------- ------------------------------- ----------------- -----------------
  GET               `/api/orders`                   List available    Yes
                                                    order records     

  GET               `/api/orders/:orderId`          Get order details Yes

  PATCH             `/api/orders/:orderId/status`   Update locally    Yes
                                                    managed order     
                                                    status            
  -------------------------------------------------------------------------------------

**Status update request**

``` json
{
  "status": "processing"
}
```

**Order response data**

``` json
{
  "id": "order_id",
  "externalOrderId": "external_order_id",
  "status": "processing",
  "currency": "INR",
  "total": 99900,
  "sourceType": "demo"
}
```

Only implement real order synchronisation if the required platform
permissions and integration are available. Do not imply that a local
status change updates a supplier or shipping carrier.

### 5.9 AI Profit Goal Planner

  --------------------------------------------------------------------------------------
  Method            Endpoint                         Purpose           Auth
  ----------------- -------------------------------- ----------------- -----------------
  POST              `/api/profit-goals`              Create or update  Yes
                                                     monthly profit    
                                                     target            

  GET               `/api/profit-goals/current`      Get current goal  Yes
                                                     and progress      

  POST              `/api/profit-goals/import-csv`   Import store      Yes
                                                     performance data  
                                                     from CSV          

  POST              `/api/profit-goals/analyze`      Calculate         Yes
                                                     performance and   
                                                     request AI        
                                                     explanation       
  --------------------------------------------------------------------------------------

**Create goal request**

``` json
{
  "currency": "INR",
  "monthlyNetProfitTarget": 5000000,
  "month": "2026-11"
}
```

The example target is ₹50,000 represented in paise.

**Analyse request**

``` json
{
  "goalId": "goal_id",
  "period": "2026-11",
  "dataSource": "csv_import"
}
```

**Analysis response data**

``` json
{
  "goal": {
    "currency": "INR",
    "target": 5000000,
    "currentNetProfit": 3000000,
    "remainingProfit": 2000000,
    "progressPercent": 60
  },
  "financials": {
    "revenue": 15000000,
    "supplierCosts": 6500000,
    "advertisingCosts": 2000000,
    "shippingCosts": 1000000,
    "otherExpenses": 500000,
    "netProfit": 5000000
  },
  "productPerformance": [],
  "dataSource": "csv_import",
  "calculationBasis": "backend",
  "aiSummary": "Explanation generated from the calculated figures"
}
```

The values in this response are illustrative only. In the actual
implementation, `currentNetProfit` must agree with the included
financial totals and the defined accounting formula. Do not copy
inconsistent example figures into test fixtures.

### 5.10 Goal Recovery Assistant

  ----------------------------------------------------------------------------------------------
  Method            Endpoint                                 Purpose           Auth
  ----------------- ---------------------------------------- ----------------- -----------------
  POST              `/api/profit-goals/recovery-assistant`   Generate          Yes
                                                             data-grounded     
                                                             recovery          
                                                             suggestions       

  ----------------------------------------------------------------------------------------------

**Request**

``` json
{
  "goalId": "goal_id",
  "question": "Why am I behind my monthly profit target?"
}
```

**Response data**

``` json
{
  "answer": "Your advertising cost has increased compared with the previous period.",
  "possibleReasons": [
    {
      "reason": "Higher advertising cost",
      "evidence": "Advertising cost per order increased in the imported data"
    }
  ],
  "suggestedActions": [
    {
      "action": "Review campaigns with high spend and low conversions",
      "expectedImpact": "Potential cost reduction",
      "confidence": "medium"
    }
  ],
  "limitations": ["Recommendations depend on the completeness of imported data"]
}
```

Recommendations must be based on available records. If data is missing,
say so. Never promise that an action will achieve a specific profit.

### 5.11 Dashboard analytics

  ---------------------------------------------------------------------------------
  Method            Endpoint                    Purpose           Auth
  ----------------- --------------------------- ----------------- -----------------
  GET               `/api/dashboard/summary`    Get high-level    Yes
                                                business metrics  

  GET               `/api/dashboard/sales`      Get sales         Yes
                                                time-series data  

  GET               `/api/dashboard/products`   Get product       Yes
                                                performance       
                                                summary           
  ---------------------------------------------------------------------------------

**Summary response data**

``` json
{
  "currency": "INR",
  "totalRevenue": 0,
  "estimatedNetProfit": 0,
  "totalOrders": 0,
  "totalProducts": 0,
  "pendingOrders": 0,
  "dataSource": "demo"
}
```

### 5.12 Common status codes

-   `200`: successful read or update.
-   `201`: resource created.
-   `400`: invalid request or validation failure.
-   `401`: missing or invalid authentication.
-   `403`: authenticated user lacks permission.
-   `404`: resource not found.
-   `409`: conflicting resource or duplicate.
-   `413`: uploaded file too large.
-   `422`: valid JSON but semantically invalid data.
-   `429`: rate limit exceeded.
-   `500`: unexpected server error.
-   `502` or `503`: upstream integration unavailable.

------------------------------------------------------------------------

## 6. Environment Variables

The following are **variable names only**. Actual values must be
supplied privately through local environment configuration or deployment
secrets. Never commit `.env` files containing real credentials.

  ---------------------------------------------------------------------------
  Variable name             Purpose                 Required when
  ------------------------- ----------------------- -------------------------
  `PORT`                    Express server port     Backend setup

  `MONGODB_URI`             MongoDB connection      Database integration
                            string                  

  `JWT_SECRET`              Secret used to sign and Authentication
                            verify JWTs             

  `GEMINI_API_KEY`          Gemini API credential   AI features

  `SHOPIFY_CLIENT_ID`       Shopify app client      Shopify connection
                            identifier              

  `SHOPIFY_CLIENT_SECRET`   Shopify app client      Shopify connection
                            secret                  

  `SHOPIFY_SCOPES`          Requested Shopify API   Shopify connection
                            scopes                  

  `SHOPIFY_REDIRECT_URI`    OAuth callback URL      Shopify connection

  `CLIENT_URL`              Frontend origin used    Frontend/backend
                            for CORS and redirects  integration

  `SERVER_URL`              Public backend URL for  Deployment/integrations
                            callbacks where         
                            required                

  `NODE_ENV`                Runtime environment     Backend setup
  ---------------------------------------------------------------------------

If the chosen Shopify authentication flow uses a different credential
arrangement, update this list to match the actual implementation. Do not
invent or expose token values.

### 6.1 Environment file rules

-   Provide `.env.example` containing names and safe placeholder
    descriptions only.
-   Add `.env` to `.gitignore`.
-   Never place API keys in React environment variables or browser
    bundles.
-   Validate required environment variables at backend startup.
-   Do not print secret values in startup logs or error messages.

------------------------------------------------------------------------

## 7. AI Integration Rules

### 7.1 AI responsibilities

Use Gemini for tasks where natural-language generation or interpretation
is useful:

-   Product listing titles and descriptions.
-   SEO titles, descriptions, and keywords.
-   Instagram captions and TikTok hooks/scripts.
-   Explanations of product analysis.
-   Supplier comparison explanations based on supplied supplier records.
-   Business performance summaries.
-   Profit Goal Planner recommendations.
-   Goal Recovery Assistant responses.

### 7.2 AI must not be the source of truth for

-   Revenue totals.
-   Supplier costs.
-   Advertising costs.
-   Shipping costs.
-   Fees.
-   Net profit.
-   Profit margin.
-   Remaining target amount.
-   Goal progress percentage.
-   Product-level financial totals.

These values must be calculated and validated by backend code.

### 7.3 Grounding and safety rules

-   Send AI only the minimum relevant data needed for the task.
-   Use actual store, product, and supplier data wherever available.
-   Clearly label sample or simulated information.
-   Do not invent product specifications, supplier identities, ratings,
    delivery performance, stock status, market demand, or trend
    statistics.
-   If information is unavailable, state that it is unavailable.
-   Treat AI output as a suggestion requiring user review.
-   Do not guarantee revenue, sales, or profit.
-   Do not present estimated results as confirmed results.
-   Keep AI API keys on the server.
-   Handle AI timeouts, rate limits, malformed output, and provider
    errors.
-   Validate structured AI responses before returning them to the
    frontend.
-   Do not allow user-provided product text or imported data to override
    system-level application rules.

### 7.4 AI output handling

Where practical:

-   Request structured JSON from the model.
-   Validate required fields and types on the backend.
-   Sanitize generated HTML before rendering or sending it to Shopify.
-   Store the input data source and generation timestamp where useful.
-   Let users edit generated listings before publishing.
-   Make it clear which content was AI-generated.

------------------------------------------------------------------------

## 8. AI Profit Goal Planner & Recovery Assistant

### 8.1 Purpose

This feature is intended for existing dropshipping sellers who want to
set a monthly net-profit target, understand current performance, and
receive practical recommendations.

Example target: **₹50,000 monthly net profit**.

The feature should use real connected-store information where possible.
For the 24-hour hackathon MVP, sample store data and CSV imports are
acceptable and preferred over building complex live integrations.

### 8.2 Inputs

Analyse available data including:

-   Sales and refunds.
-   Orders and order dates.
-   Products and product quantities.
-   Supplier/product costs.
-   Advertising expenses.
-   Shipping expenses.
-   Platform/payment fees.
-   Other business expenses.

The CSV import flow must explain the expected columns, validate the
uploaded file, identify missing or invalid values, and show a preview
before importing. Do not silently treat missing expenses as zero unless
the user confirms that interpretation.

### 8.3 Backend calculations

Define and document the financial formula used by the implementation.

A starting formula is:

``` text
Net Profit =
  Recognised Revenue
  - Refunds and Discounts (if not already excluded from revenue)
  - Supplier Costs
  - Shipping Costs
  - Advertising Costs
  - Platform and Payment Fees
  - Other Business Expenses
```

Avoid double-counting refunds or discounts. The exact revenue definition
and treatment of taxes must be explicit in the implementation.

Calculate:

``` text
Remaining Profit = max(0, Monthly Target - Current Net Profit)

Progress Percentage =
  (Current Net Profit / Monthly Target) * 100
```

For display, progress may be capped at 100%, but retain the actual
calculated ratio for reporting. Handle zero or negative targets safely
and validate that the target is positive.

Also calculate product-level performance using the same consistent cost
definitions.

### 8.4 Product analysis

Identify:

-   Products contributing the highest net profit.
-   Products with low or negative net profit.
-   Products with high revenue but weak margins.
-   Products with high advertising cost relative to sales.
-   Products whose costs or performance changed, if comparison-period
    data exists.

Do not infer demand or conversion rates if those metrics were not
imported or connected.

### 8.5 AI recommendations

AI may explain the backend's calculated results and suggest:

-   Pricing changes to test.
-   Products to review or prioritise.
-   Advertising campaigns or spend to investigate.
-   Alternative suppliers to compare.
-   Cost categories that may need attention.

Recommendations should include the evidence used, assumptions, and
limitations. Avoid stating that an estimated action will definitely
produce a specific profit.

### 8.6 Goal Recovery Assistant

The assistant should help answer questions such as:

-   Why am I behind my monthly target?
-   Which products contribute most to my profit?
-   Which products are reducing my overall margin?
-   Which costs increased?
-   What should I investigate first?
-   What realistic actions could help improve performance?

It should identify evidence-backed possible reasons and rank suggested
actions by relevance or confidence. If there is insufficient data, it
must ask for or identify the missing information rather than guessing.

### 8.7 Progress tracking

Display:

-   Monthly target.
-   Current net profit.
-   Remaining amount.
-   Progress percentage.
-   Revenue and expense breakdown.
-   Product performance.
-   Last data import or sync time.
-   Data source: connected store, CSV import, or demo data.

The progress display is a measurement of current results, not a
prediction or guarantee of future profit.

------------------------------------------------------------------------

## 9. Core Product Feature Specifications

### 9.1 Product Discovery Grid

Users should be able to:

-   Browse products.
-   Search by product name.
-   Filter by category and available attributes.
-   View product images and specifications.
-   View supplier cost and source.
-   Open a product detail view.
-   Save a product for later analysis.

For demo data, show a visible demo-data label.

### 9.2 AI Product Listing Generator

Users provide or select product details and request:

-   Product title.
-   Product description.
-   Key features.
-   SEO title and description.
-   Search keywords.

Generated information must remain editable. Do not invent unsupported
specifications or claims.

### 9.3 Supplier Integration and Comparison

The system should support supplier records containing, where available:

-   Supplier identifier and name.
-   Product identifier.
-   Unit cost and currency.
-   Availability.
-   Shipping estimate.
-   Rating and review source.
-   Verification status and its source.
-   Data source and last-updated time.

Use a real supplier API only when access and permission are available.
Otherwise use clearly labelled sample supplier data. Do not claim a mock
dataset is a live supplier integration.

### 9.4 Shopify Store Synchronisation

Shopify is the planned first store platform.

The intended workflow:

1.  User initiates a secure Shopify connection.
2.  Backend completes the approved Shopify authentication flow.
3.  User selects a product and reviews its listing.
4.  Backend sends the product to Shopify using the approved Admin API.
5.  Backend reports the actual result and external product identifier.
6.  User can view sync status and relevant errors.

Do not claim sync success until Shopify confirms the operation. A
simulated demo must be labelled clearly.

### 9.5 Live Profit & Price Slider

Allow users to adjust selling price and, where appropriate, per-order
expenses. Update estimated profit and margin immediately.

Use the same financial definitions as the backend pricing endpoint. Show
currency and mark results as estimates. Do not imply that the selected
price is guaranteed to sell.

### 9.6 Supplier Trust Badges

Possible indicators:

-   Verified supplier.
-   Supplier rating.
-   Estimated shipping time.
-   Availability.
-   Data freshness.

Only display a verified badge when verification is supported by a
trusted source. For sample data, use labels such as `Demo rating` or
`Demo supplier`; do not imply real verification.

### 9.7 Multi-Platform Content Generator

Generate content variants for:

-   **Shopify SEO:** product title, SEO description, keywords.
-   **Instagram:** promotional caption and relevant hashtags.
-   **TikTok:** short-form video hook and script.

Use product facts supplied by the user or data source. Keep generated
content editable and avoid unsupported claims.

### 9.8 AI Profit Goal Planner & Recovery Assistant

Follow all requirements in Section 8. Treat this as an important
additional feature. For the hackathon, CSV import or sample data is
sufficient.

------------------------------------------------------------------------

## 10. Development Rules for AI Coding Assistants

These rules are mandatory for any AI coding assistant contributing to
this repository.

1.  Follow the project requirements and the PRD. If a PRD is added under
    `docs/PRD.md`, treat it as the detailed product specification.
2.  Follow this `context.md` as the project-wide technical and
    behavioural reference.
3.  **Do not change the approved technology stack** without explicit
    permission from the project owner.
4.  Do not introduce new frameworks, databases, AI providers, or major
    dependencies without approval.
5.  Do not unnecessarily rewrite working code.
6.  Do not remove existing functionality to implement a new feature.
7.  Do not modify unrelated files.
8.  Maintain compatibility between frontend and backend.
9.  Follow the documented API contracts. If a contract must change,
    update this document and the relevant frontend/backend code
    together.
10. Never hardcode API keys, passwords, tokens, or other credentials.
11. Do not fabricate real-world supplier integrations or claim that a
    simulated integration is live.
12. Clearly distinguish mock data, imported data, and live API data.
13. Perform financial calculations in backend code and test edge cases.
14. Use AI for explanations and recommendations, not authoritative
    financial arithmetic.
15. Test changes before considering a feature complete.
16. Prioritise a functional end-to-end MVP suitable for a 24-hour
    hackathon.
17. Prefer the simplest implementation that meets the requirement.
18. Do not create empty or decorative features and describe them as
    functional.
19. If a requirement is ambiguous, ask the project owner or mark the
    unresolved decision as TBD; do not silently invent a business rule.
20. Update this file when the approved stack, folder structure, API
    contract, or feature scope changes.

### 10.1 Required workflow before changing code

For each task, the AI coding assistant should:

1.  Read this `context.md` and the relevant PRD section.
2.  Inspect the files directly related to the requested change.
3.  Summarise the intended change briefly.
4.  Preserve existing project conventions.
5.  Implement only the requested scope.
6.  Run relevant checks or tests.
7.  Report files changed, behaviour implemented, and any remaining
    limitations.

### 10.2 Definition of done

A feature is not complete merely because its UI exists. Where
applicable, it must have:

-   Working frontend interaction.
-   Connected backend endpoint.
-   Validated input.
-   Correct business logic.
-   Appropriate loading, empty, and error states.
-   Correct data-source labelling.
-   Tested success and failure paths.
-   No exposed secrets.

------------------------------------------------------------------------

## 11. Decisions and Items Still TBD

The following must be confirmed during implementation:

-   Exact React project setup and build tool.
-   Exact dependency versions.
-   MongoDB hosting and database name.
-   Gemini model identifier and SDK version.
-   Shopify app setup, API version, scopes, and authentication flow.
-   Supplier API provider and availability of credentials.
-   Deployment provider.
-   CSV column schema and accounting treatment for taxes, refunds,
    discounts, and fees.
-   Whether the hackathon demo will use INR only or support multiple
    currencies.
-   Which features can be completed within the available time.

Do not represent any of these as already configured.

------------------------------------------------------------------------

## 12. Hackathon Implementation Priorities

Recommended implementation order:

### Priority 1 --- Working foundation

-   Initialise frontend and backend.
-   Configure MongoDB connection.
-   Set up environment validation.
-   Implement basic authentication if required for the demo.
-   Establish API communication.

### Priority 2 --- Core product workflow

-   Product Discovery Grid using clearly labelled sample data if no real
    source is ready.
-   AI Listing Generator using Gemini.
-   Supplier comparison using available real or demo data.
-   Shopify connection and product sync if credentials and setup permit.

### Priority 3 --- High-value additions

-   Live Profit & Price Slider.
-   Supplier Trust Badges.
-   Multi-Platform Content Generator.
-   Profit Goal Planner using sample data or CSV import.

### Priority 4 --- Polish and validation

-   Dashboard visualisation.
-   Error and empty states.
-   End-to-end demo workflow.
-   Test API failures and missing data.
-   Prepare a clear demonstration of what is real versus simulated.

**Hackathon rule:** A smaller number of complete, reliable features is
better than a large number of unfinished features.

------------------------------------------------------------------------

## 13. Reference and Documentation Links

Use official documentation and verify current versions before
implementation:

-   React: https://react.dev/
-   Node.js: https://nodejs.org/docs/
-   Express: https://expressjs.com/
-   MongoDB: https://www.mongodb.com/docs/
-   Google AI / Gemini: https://ai.google.dev/gemini-api/docs
-   Shopify developer documentation: https://shopify.dev/docs
-   Chart.js: https://www.chartjs.org/docs/
-   JSON Web Tokens: https://jwt.io/introduction
-   Git: https://git-scm.com/doc

------------------------------------------------------------------------

**End of context document.**
