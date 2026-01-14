# Krydd - AI-Powered Recipe App

A modern recipe application built with AWS primitives using SST v3 + Pulumi, leveraging AWS AI services for intelligent features.

## Features

- 🍳 **Recipe Management** - Create, read, update, and delete recipes with rich metadata
- 🔍 **Semantic Search** - S3 Vector Search for intelligent recipe discovery
- 📅 **Meal Planning** - Weekly meal planning with AI assistance
- 🤖 **AI Assistant** - Claude 4 Sonnet powered recipe suggestions and cooking tips
- 🔐 **Authentication** - Secure user authentication with email and GitHub OAuth
- 📱 **Responsive Frontend** - React Router-based SPA

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Krydd Recipe App                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌─────────────────────────────────────┐   │
│  │   Frontend   │───▶│     Monolithic Hono API             │   │
│  │  (React)     │    │  ┌─────────────────────────────┐    │   │
│  └──────────────┘    │  │  Single Lambda + Function   │    │   │
│                      │  │  URL (sst.aws.Function)     │    │   │
│  ┌──────────────┐    │  │                             │    │   │
│  │   Auth       │◀───│  │  Routes:                    │    │   │
│  │  (sst.auth)  │    │  │  - /api/auth/*  (sst.auth)  │    │   │
│  └──────────────┘    │  │  - /api/recipes/*           │    │   │
│                      │  │  - /api/search/*            │    │   │
│                      │  │  - /api/meal-plan/*         │    │   │
│                      │  │  - /api/chat/* (AI)         │    │   │
│                      │  └─────────────────────────────┘    │   │
│                      └─────────────────────────────────────┘   │
│                                    │                            │
│         ┌──────────────────────────┼────────────────────────┐  │
│         ▼                          ▼                        ▼  │
│   ┌──────────────┐    ┌──────────────────┐    ┌───────────┐   │
│   │  DynamoDB    │    │    Bedrock       │    │  S3       │   │
│   │  Tables      │    │  ┌────────────┐  │    │  Buckets  │   │
│   │  - Recipes   │    │  │ Claude 4   │  │    │  - Images │   │
│   │  - MealPlans │    │  │ Sonnet     │  │    │  - Vectors│   │
│   │  - Users     │    │  └────────────┘  │    └───────────┘   │
│   └──────────────┘    │  ┌────────────┐  │                    │
│                       │  │ S3 Vector  │  │                    │
│                       │  │ Search     │  │                    │
│                       │  └────────────┘  │                    │
│                       └──────────────────┘                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | SST v3 + Pulumi |
| API | Hono (single Lambda) |
| Database | DynamoDB |
| Storage | S3 (Images + Vector Store) |
| Auth | sst.auth (OpenAuth) |
| AI | Bedrock + Claude 4 Sonnet |
| Vector Search | S3 Vector Search + Titan Embeddings |
| Frontend | React Router v7 |
| State | TanStack Query |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 22+
- AWS CLI configured
- Bun or npm

### Installation

```bash
# Clone the repository
cd krydd

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1

# Auth Configuration (for GitHub OAuth)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email (optional, for email auth)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

## Project Structure

```
krydd/
├── sst.config.ts              # SST configuration
├── package.json               # Root package.json
├── infra/                     # Infrastructure definitions
│   ├── auth.ts               # Auth configuration
│   ├── api.ts                # API function
│   ├── tables.ts             # DynamoDB tables
│   ├── storage.ts            # S3 buckets
│   └── web.ts                # Frontend deployment
├── packages/
│   ├── core/                 # Shared code
│   │   └── src/
│   │       ├── models/       # Data models
│   │       │   ├── recipe.ts
│   │       │   └── meal-plan.ts
│   │       └── lib/          # Utilities
│   │           ├── ddb.ts
│   │           ├── s3.ts
│   │           ├── bedrock.ts
│   │           └── vector-search.ts
│   ├── functions/            # Lambda functions
│   │   └── src/
│   │       ├── api.ts        # Main API entry
│   │       └── api/          # API routes
│   │           ├── recipes.ts
│   │           ├── search.ts
│   │           ├── meal-plan.ts
│   │           └── chat.ts
│   └── web/                  # React frontend
│       ├── app/
│       │   ├── routes/       # Page routes
│       │   ├── components/   # UI components
│       │   └── lib/          # Frontend utilities
│       └── package.json
└── bun.lock                  # Lock file
```

## API Endpoints

### Recipes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List recipes |
| GET | `/api/recipes/:id` | Get single recipe |
| POST | `/api/recipes` | Create recipe |
| PUT | `/api/recipes/:id` | Update recipe |
| DELETE | `/api/recipes/:id` | Delete recipe |
| GET | `/api/recipes/author/:authorId` | Get recipes by author |
| GET | `/api/recipes/cuisine/:cuisine` | Get recipes by cuisine |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=...` | Text search |
| POST | `/api/search` | Semantic search |
| POST | `/api/search/ingredients` | Search by ingredients |
| GET | `/api/search/recommendations` | Get recommendations |

### Meal Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meal-plan` | List meal plans |
| GET | `/api/meal-plan/:weekStart` | Get meal plan for week |
| POST | `/api/meal-plan` | Create meal plan |
| PUT | `/api/meal-plan/:weekStart` | Update meal plan |
| PATCH | `/api/meal-plan/:weekStart/days` | Update specific days |
| DELETE | `/api/meal-plan/:id` | Delete meal plan |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | AI chat assistant |
| POST | `/api/chat/search` | AI-powered search |
| POST | `/api/chat/suggest` | Recipe suggestions |
| POST | `/api/chat/meal-plan` | Generate meal plan |
| POST | `/api/chat/substitutions` | Ingredient substitutions |

## DynamoDB Schema

### Recipes Table

```
PK: "RECIPE"
SK: "RECIPE#<id>"
GSI1PK: "AUTHOR#<authorId>"
GSI1SK: "RECIPE#<id>"
GSI2PK: "CUISINE#<cuisine>"
GSI2SK: "RECIPE#<createdAt>"

Fields: id, title, description, ingredients, instructions,
        prepTime, cookTime, servings, difficulty, cuisine,
        dietaryTags, imageUrl, authorId, createdAt, updatedAt
```

### MealPlans Table

```
PK: "USER#<userId>"
SK: "MEALPLAN#<weekStartDate>"
GSI1PK: "MEALPLAN#<weekStartDate>"
GSI1SK: "USER#<userId>"

Fields: id, userId, weekStartDate, days, goals, preferences,
        createdAt, updatedAt
```

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run deploy --stage production
```

## AWS Services Used

- **Lambda** - Serverless compute for API
- **DynamoDB** - NoSQL database for recipes and meal plans
- **S3** - Object storage for images and vector embeddings
- **Bedrock** - AI/ML for Claude 4 and Titan embeddings
- **Cognito** - User authentication (via sst.auth)
- **API Gateway** - Function URL for API access
- **CloudFront** - CDN for frontend and assets

## License

MIT
