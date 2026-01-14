# Krydd Recipe App - Development Plan

## Overview
Build a recipe app using AWS primitives with SST v3 + Pulumi, leveraging AWS AI services (Bedrock, Strands SDK) for intelligent features. Monolithic Hono API with DynamoDB and S3 Vector Search.

## Template Structure (Already Set Up)
The repo uses the SST v3 monorepo template with:
- `packages/core/` - Shared code (models, utilities)
- `packages/functions/` - Lambda functions
- `packages/scripts/` - Scripts for sst shell
- `infra/` - Infrastructure definitions
- `sst.config.ts` - SST configuration

## Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                      Krydd Recipe App                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌─────────────────────────────────────┐   │
│  │   Frontend   │───▶│     Monolithic Hono API             │   │
│  │  (Next.js/   │    │  ┌─────────────────────────────┐    │   │
│  │   Mobile)    │    │  │  Single Lambda + Function   │    │   │
│  └──────────────┘    │  │  URL (sst.aws.Function)     │    │   │
│                      │  │                             │    │   │
│  ┌──────────────┐    │  │  Routes:                    │    │   │
│  │   Auth       │◀───│  │  - /auth/*  (sst.auth)      │    │   │
│  │  (sst.auth)  │    │  │  - /recipes/*              │    │   │
│  └──────────────┘    │  │  - /search/*               │    │   │
│                      │  │  - /meal-plan/*            │    │   │
│                      │  │  - /chat/* (Strands)       │    │   │
│                      │  └─────────────────────────────┘    │   │
│                      └─────────────────────────────────────┘   │
│                                    │                            │
│         ┌──────────────────────────┼────────────────────────┐  │
│         ▼                          ▼                        ▼  │
│   ┌──────────────┐    ┌──────────────────┐    ┌───────────┐   │
│   │  DynamoDB    │    │    Bedrock       │    │  S3       │   │
│   │  Tables      │    │  ┌────────────┐  │    │  (Images) │   │
│   │  - Recipes   │    │  │ Claude 4   │  │    │  - Images │   │
│   │  - Users     │    │  │ Sonnet     │  │    │  - Vector │   │
│   │  - MealPlans │    │  └────────────┘  │    │    Store  │   │
│   └──────────────┘    │  ┌────────────┐  │    └───────────┘   │
│                       │  │ S3 Vector  │  │                    │
│                       │  │ Search     │  │                    │
│                       │  └────────────┘  │                    │
│                       └──────────────────┘                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## AWS Primitives Stack

| Service | SST Construct / Pulumi | Use Case |
|---------|----------------------|----------|
| Compute | `sst.aws.Function` with `url: true` | Monolithic Hono API |
| Storage | `sst.aws.Bucket` / Pulumi `aws.s3.Bucket` | Recipe images, vector store |
| Database | `sst.aws.Table` / Pulumi `aws.dynamodb.Table` | Recipes, users, meal plans |
| Auth | `sst.auth` (OIDC/OAuth) | User authentication |
| AI | Bedrock API (direct SDK) | Claude 4 Sonnet for intelligence |
| Vector Search | S3 Vector Search + Titan Embeddings | Recipe semantic search |

## Phase 1: Foundation (Week 1)

### 1.1 Update Project Name & Dependencies
```json
{
  "name": "krydd",
  "version": "0.0.0",
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "npx sst dev",
    "deploy": "npx sst deploy"
  },
  "devDependencies": {
    "@tsconfig/node22": "^22",
    "typescript": "^5"
  },
  "dependencies": {
    "sst": "^3",
    "hono": "^4.0.0",
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/client-bedrock-runtime": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "strands-sdk": "^1.0.0",
    "zod": "^3.24.0"
  }
}
```

### 1.2 Project Structure Update
```
krydd/
├── sst.config.ts                    # SST config (update name)
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── apps/
│   └── api/                         # Hono API (single Lambda)
│       ├── src/
│       │   ├── index.ts             # Hono app entry
│       │   ├── routes/              # Route handlers
│       │   │   ├── auth.ts          # sst.auth handlers
│       │   │   ├── recipes.ts       # Recipe CRUD
│       │   │   ├── search.ts        # Vector search
│       │   │   ├── meal-plan.ts     # Meal planning
│       │   │   └── chat.ts          # AI chat (Strands)
│       │   ├── lib/
│       │   │   ├── db.ts            # DynamoDB client
│       │   │   ├── auth.ts          # Auth utilities
│       │   │   ├── s3.ts            # S3 client
│       │   │   └── bedrock.ts       # Bedrock client
│       │   └── types/
│       │       └── index.ts         # TypeScript types
│       └── package.json
├── packages/
│   ├── core/                        # Shared code
│   │   └── src/
│   │       ├── models/              # DynamoDB models
│   │       ├── errors/              # Error classes
│   │       └── utils/               # Helpers
│   └── ai/                          # AI layer
│       └── src/
│           ├── agent.ts             # Strands agent
│           └── prompts.ts           # Prompt templates
├── infra/
│   ├── main.ts                      # Pulumi entry (optional)
│   ├── tables.ts                    # DynamoDB tables
│   ├── storage.ts                   # S3 buckets
│   └── api.ts                       # Hono API function
└── README.md
```

### 1.3 DynamoDB Schema
```typescript
// infra/tables.ts
import { Table } from "sst/aws/table";
import { dynamodb } from "@aws-sdk/lib-dynamodb";

export const recipesTable = new Table("Recipes", {
  columns: {
    id: { type: "string", partitionKey: true },
    title: { type: "string" },
    description: { type: "string" },
    ingredients: { type: "list" },
    instructions: { type: "list" },
    prepTime: { type: "number" },
    cookTime: { type: "number" },
    servings: { type: "number" },
    difficulty: { type: "string" },
    cuisine: { type: "string" },
    dietaryTags: { type: "list" },
    imageUrl: { type: "string" },
    authorId: { type: "string" },
    embeddingId: { type: "string" }, // S3 Vector Search reference
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  globalIndexes: {
    "byAuthor": { partitionKey: "authorId", sortKey: "createdAt" },
    "byCuisine": { partitionKey: "cuisine", sortKey: "title" },
  },
});

export const usersTable = new Table("Users", {
  columns: {
    id: { type: "string", partitionKey: true },
    email: { type: "string" },
    name: { type: "string" },
    dietaryRestrictions: { type: "list" },
    preferences: { type: "map" },
    createdAt: { type: "string" },
  },
});

export const mealPlansTable = new Table("MealPlans", {
  columns: {
    id: { type: "string", partitionKey: true },
    userId: { type: "string" },
    weekStartDate: { type: "string" },
    meals: { type: "map" },
    createdAt: { type: "string" },
  },
});
```

### 1.4 Hono API Setup
```typescript
// apps/api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./routes/auth";
import { recipes } from "./routes/recipes";
import { search } from "./routes/search";
import { mealPlan } from "./routes/meal-plan";
import { chat } from "./routes/chat";

const app = new Hono();

app.use("/*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Mount routes
app.route("/auth", auth);
app.route("/recipes", recipes);
app.route("/search", search);
app.route("/meal-plan", mealPlan);
app.route("/chat", chat);

export default app;
```

## Phase 2: Core Infrastructure (Week 2)

### 2.1 Storage (S3 + Vector Search)
```typescript
// infra/storage.ts
import { Bucket } from "sst/aws/bucket";

export const imageBucket = new Bucket("Images", {
  name: "krydd-images",
  cors: [
    {
      allowedMethods: ["GET", "PUT", "POST"],
      allowedOrigins: ["http://localhost:3000", "https://krydd.app"],
      allowedHeaders: ["*"],
      maxAge: 3600,
    },
  ],
  notifications: {
    resize: {
      filter: "*.{jpg,jpeg,png}",
      function: "functions/src/image-resize.handler",
    },
  },
});

export const vectorBucket = new Bucket("Vectors", {
  name: "krydd-vectors",
});
```

### 2.2 S3 Vector Search Setup
```typescript
// lib/vector-search.ts
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { fromBase64, toBase64 } from "@aws-sdk/util-base64";

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });
const s3 = new S3Client({ region: "us-east-1" });

const EMBEDDING_MODEL = "amazon.titan-embed-text-v2:0";
const VECTOR_BUCKET = process.env.VECTOR_BUCKET!;

export async function createEmbedding(text: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: EMBEDDING_MODEL,
    body: JSON.stringify({
      inputText: text,
      dimensions: 1024,
    }),
    contentType: "application/json",
    accept: "application/json",
  });

  const response = await bedrock.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));
  return body.embedding;
}

export async function storeRecipeEmbedding(
  recipeId: string,
  embedding: number[]
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: VECTOR_BUCKET,
    Key: `recipes/${recipeId}.json`,
    Body: JSON.stringify({ recipeId, embedding }),
    ContentType: "application/json",
  });
  await s3.send(command);
}

export async function searchRecipes(
  queryEmbedding: number[],
  topK: number = 10
): Promise<string[]> {
  // S3 Vector Search uses approximate nearest neighbor search
  // Store embeddings in S3 and query using vector search index
  // This is a simplified version - actual implementation uses
  // S3 Select or external vector DB for ANN search

  const response = await searchWithAnn(queryEmbedding, topK);
  return response.recipeIds;
}
```

### 2.3 DynamoDB CRUD Operations
```typescript
// packages/core/src/models/recipes.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { recipesTable } from "sst/aws/table";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisine?: string;
  dietaryTags: string[];
  imageUrl?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  const command = new PutCommand({
    TableName: recipesTable.name,
    Item: recipe,
  });
  await docClient.send(command);
  return recipe;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const command = new GetCommand({
    TableName: recipesTable.name,
    Key: { id },
  });
  const response = await docClient.send(command);
  return response.Item as Recipe | null;
}

export async function listRecipesByAuthor(
  authorId: string,
  limit?: number
): Promise<Recipe[]> {
  const command = new QueryCommand({
    TableName: recipesTable.name,
    IndexName: "byAuthor",
    KeyConditionExpression: "authorId = :authorId",
    ExpressionAttributeValues: { ":authorId": authorId },
    Limit: limit,
    ScanIndexForward: false,
  });
  const response = await docClient.send(command);
  return (response.Items || []) as Recipe[];
}

export async function searchRecipesByIngredients(
  ingredients: string[],
  limit: number = 20
): Promise<Recipe[]> {
  // Simple filter scan - for production use vector search
  const command = new ScanCommand({
    TableName: recipesTable.name,
    FilterExpression: `contains(ingredients.name, :ingredient)`,
    ExpressionAttributeValues: { ":ingredient": ingredients[0] },
    Limit: limit,
  });
  const response = await docClient.send(command);
  return (response.Items || []) as Recipe[];
}
```

## Phase 3: Authentication (Week 2-3)

### 3.1 SST Auth Setup
```typescript
// apps/api/src/routes/auth.ts
import { Hono } from "hono";
import { auth } from "sst/auth";
import { config } from "sst/config";

export const authHandler = auth.handleAuth({
  // GitHub OAuth example
  github: auth.handleGithub({
    clientId: config.githubClientId,
    clientSecret: config.githubClientSecret,
  }),
  // Google OAuth example
  google: auth.handleGoogle({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
  }),
});

export const auth = new Hono();

auth.use("/*", authHandler);
auth.get("/callback", async (c) => {
  const session = await auth.getSession(c);
  // Create or update user in DynamoDB
  // Return user profile
  return c.json({ user: session.user });
});
```

### 3.2 Auth Utilities
```typescript
// apps/api/src/lib/auth.ts
import { getSession } from "sst/auth";

export async function requireAuth(c: any) {
  const session = await getSession(c);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getUserId(c: any): Promise<string | null> {
  const session = await getSession(c);
  return session?.user?.id || null;
}
```

## Phase 4: AI Integration (Week 3-4)

### 4.1 Strands Agent Setup
```typescript
// packages/ai/src/agent.ts
import { Agent } from "strands";
import { BedrockModel } from "strands/models/bedrock";
import { searchRecipes, getRecipe } from "@krydd/core/models/recipes";
import { createEmbedding } from "@krydd/core/vector-search";

// Configure Claude 4 Sonnet for recipe intelligence
const model = new BedrockModel({
  modelId: "anthropic.claude-4-sonnet-20250514",
  regionName: "us-east-1",
});

export const recipeAgent = new Agent({
  model,
  systemPrompt: `You are Krydd, a helpful recipe assistant.
  Help users:
  - Find recipes based on ingredients they have
  - Suggest meal plans for the week
  - Provide cooking tips and substitutions
  - Answer questions about recipes
  
  Be friendly, encouraging, and helpful.`,
  tools: [
    {
      name: "search_recipes",
      description: "Search for recipes by ingredients or keywords",
      handler: async ({ query }) => {
        const embedding = await createEmbedding(query);
        const recipeIds = await searchRecipes(embedding);
        const recipes = await Promise.all(
          recipeIds.map((id) => getRecipe(id))
        );
        return recipes.filter(Boolean);
      },
    },
    {
      name: "get_recipe",
      description: "Get full recipe details by ID",
      handler: async ({ recipeId }) => {
        return await getRecipe(recipeId);
      },
    },
    {
      name: "suggest_substitutions",
      description: "Suggest ingredient substitutions",
      handler: async ({ ingredient, dietaryRestriction }) => {
        // Use Claude to suggest substitutions
        return await generateSubstitutions(ingredient, dietaryRestriction);
      },
    },
    {
      name: "generate_meal_plan",
      description: "Generate a weekly meal plan",
      handler: async ({ preferences, constraints }) => {
        return await createMealPlan(preferences, constraints);
      },
    },
  ],
});

export async function chatWithKrydd(message: string, userId: string) {
  const result = await recipeAgent(message, {
    sessionId: userId,
  });
  return result;
}
```

### 4.2 Chat Route
```typescript
// apps/api/src/routes/chat.ts
import { Hono } from "hono";
import { chatWithKrydd } from "@krydd/ai/agent";
import { requireAuth } from "../lib/auth";

export const chat = new Hono();

chat.post("/", requireAuth, async (c) => {
  const { message } = await c.req.json();
  const session = c.var.session;
  
  const response = await chatWithKrydd(message, session.user.id);
  
  return c.json({ response });
});
```

## Phase 5: Frontend & API Integration (Week 4-5)

### 5.1 Frontend Structure
```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home/search
│   │   ├── recipes/
│   │   │   ├── page.tsx          # Recipe list
│   │   │   └── [id]/page.tsx     # Recipe detail
│   │   ├── meal-planner/
│   │   │   └── page.tsx          # Meal planning
│   │   └── chat/
│   │       └── page.tsx          # AI chat
│   ├── components/
│   │   ├── RecipeCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── IngredientInput.tsx
│   │   └── ChatWindow.tsx
│   └── lib/
│       ├── api.ts                # API client
│       └── stores/               # State management
├── package.json
└── next.config.js
```

### 5.2 API Client
```typescript
// apps/web/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  recipes: {
    list: () => fetchAPI("/recipes"),
    get: (id: string) => fetchAPI(`/recipes/${id}`),
    create: (data: any) => fetchAPI("/recipes", { method: "POST", body: JSON.stringify(data) }),
    search: (query: string) => fetchAPI(`/search?q=${encodeURIComponent(query)}`),
  },
  mealPlan: {
    get: (weekStart: string) => fetchAPI(`/meal-plan/${weekStart}`),
    create: (data: any) => fetchAPI("/meal-plan", { method: "POST", body: JSON.stringify(data) }),
  },
  chat: {
    send: (message: string) => fetchAPI("/chat", { method: "POST", body: JSON.stringify({ message }) }),
  },
};
```

## Phase 6: Deployment & CI/CD (Week 6)

### 6.1 SST Configuration
```typescript
// sst.config.ts
import { API } from "./apps/api/src";
import { Bucket } from "sst/aws/bucket";
import { Table } from "sst/aws/table";

export default $config({
  app(input) {
    return {
      name: "krydd",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const images = new Bucket("Images");
    const vectors = new Bucket("Vectors");
    
    const recipesTable = new Table("Recipes", {
      columns: {
        id: { type: "string", partitionKey: true },
        // ... other columns
      },
    });
    
    const usersTable = new Table("Users", {
      columns: {
        id: { type: "string", partitionKey: true },
        // ... other columns
      },
    });
    
    const mealPlansTable = new Table("MealPlans", {
      columns: {
        id: { type: "string", partitionKey: true },
        // ... other columns
      },
    });
    
    const api = new API("API", {
      link: [images, vectors, recipesTable, usersTable, mealPlansTable],
    });
    
    return {
      apiUrl: api.url,
      imagesBucket: images.name,
    };
  },
});
```

### 6.2 Environment Variables
```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
AWS_REGION=us-east-1

# .env.production (set in SST)
NEXT_PUBLIC_API_URL=https://your-api.execute-api.region.amazonaws.com
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 6.3 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/KryddDeployRole
          aws-region: us-east-1
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Deploy
        run: npx sst deploy --stage production
        env:
          STAGE: production
```

## Technology Decisions

| Category | Choice | Reason |
|----------|--------|--------|
| API Framework | Hono | Lightweight, works great with Cloudflare/Lambda |
| Database | DynamoDB | Serverless, pay-per-use, fast |
| Auth | sst.auth | Built-in, supports OIDC/OAuth |
| AI | Strands SDK + Bedrock | Open-source, model-agnostic |
| Vector Search | S3 Vector Search | AWS native, cost-effective |
| Frontend | Next.js | Mature, good DX |
| State | Zustand | Lightweight, type-safe |

## Next Steps

1. ⬜ Rename project in `package.json` and `sst.config.ts`
2. ⬜ Add Hono and AWS SDK dependencies
3. ⬜ Set up DynamoDB tables in `infra/tables.ts`
4. ⬜ Create Hono API in `apps/api/src/index.ts`
5. ⬜ Implement auth routes with `sst.auth`
6. ⬜ Build recipe CRUD routes
7. ⬜ Add S3 Vector Search integration
8. ⬜ Integrate Strands agent for AI features
9. ⬜ Build frontend application
10. ⬜ Set up CI/CD pipeline
11. ⬜ Deploy to production

## References

- [SST v3 Documentation](https://sst.dev/docs/)
- [SST Auth](https://sst.dev/docs/auth/)
- [Hono](https://hono.dev/)
- [Strands SDK](https://github.com/strands-agents/sdk-python)
- [DynamoDB SDK](https://docs.aws.amazon.com/dynamodb/index.html)
- [S3 Vector Search](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors.html)
- [Bedrock Runtime](https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-runtime.html)
