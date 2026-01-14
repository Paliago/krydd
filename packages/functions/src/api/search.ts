import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { semanticRecipeSearch, createEmbedding, findSimilarRecipes } from "@krydd/core/lib/vector-search";
import { RecipeModel } from "@krydd/core/models/recipe-model";
import { z } from "zod";

const app = new Hono();

// Search request schema
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  cuisine: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  maxResults: z.number().int().min(1).max(50).default(10),
});

// Ingredients search schema
const ingredientsSearchSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(20),
  maxResults: z.number().int().min(1).max(50).default(10),
});

/**
 * POST /search - Semantic search for recipes
 */
app.post("/", zValidator("json", searchSchema), async (c) => {
  const { query, cuisine, difficulty, maxResults } = c.req.valid("json");
  
  try {
    // Perform semantic search using vector embeddings
    const similarRecipes = await semanticRecipeSearch(query, {
      cuisine,
      difficulty,
      maxResults,
    });
    
    // If we have recipe IDs, fetch the full recipes
    let recipes: any[] = [];
    if (similarRecipes.length > 0) {
      const recipeIds = similarRecipes.map((r) => r.recipeId);
      recipes = await RecipeModel.batchGet(recipeIds);
      
      // Add similarity scores to recipes
      const similarityMap = new Map(similarRecipes.map((r) => [r.recipeId, r.similarity]));
      recipes = recipes.map((recipe) => ({
        ...recipe,
        similarityScore: similarityMap.get(recipe.id),
      }));
    }
    
    return c.json({
      success: true,
      data: {
        recipes,
        query,
        totalResults: recipes.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return c.json(
      {
        success: false,
        error: "Search failed",
      },
      500
    );
  }
});

/**
 * GET /search?q=... - Simple text search (fallback)
 */
app.get("/", async (c) => {
  const query = c.req.query("q");
  const maxResults = Number(c.req.query("maxResults")) || 10;
  
  if (!query) {
    return c.json(
      { success: false, error: "Query parameter 'q' is required" },
      400
    );
  }
  
  try {
    // For simple text search, use semantic search
    const similarRecipes = await semanticRecipeSearch(query, { maxResults });
    
    let recipes: any[] = [];
    if (similarRecipes.length > 0) {
      const recipeIds = similarRecipes.map((r) => r.recipeId);
      recipes = await RecipeModel.batchGet(recipeIds);
    }
    
    return c.json({
      success: true,
      data: {
        recipes,
        query,
        totalResults: recipes.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return c.json(
      { success: false, error: "Search failed" },
      500
    );
  }
});

/**
 * POST /search/ingredients - Search by ingredients
 */
app.post("/ingredients", zValidator("json", ingredientsSearchSchema), async (c) => {
  const { ingredients, maxResults } = c.req.valid("json");
  
  try {
    // Create embedding for the ingredients query
    const queryText = ingredients.join(" ");
    const queryEmbedding = await createEmbedding(queryText);
    
    // Get all recipes (in production, this would query an index)
    const allRecipes = await RecipeModel.list({ limit: 100 });
    const recipeIds = allRecipes.map((r) => r.id!);
    
    // Find similar recipes
    const similarRecipes = await findSimilarRecipes(queryEmbedding, recipeIds, maxResults);
    
    // Fetch full recipe data
    const recipes = await RecipeModel.batchGet(
      similarRecipes.map((r) => r.recipeId)
    );
    
    return c.json({
      success: true,
      data: {
        recipes,
        query: ingredients,
        totalResults: recipes.length,
      },
    });
  } catch (error) {
    console.error("Ingredients search error:", error);
    return c.json(
      { success: false, error: "Search failed" },
      500
    );
  }
});

/**
 * GET /search/recommendations - Get recipe recommendations
 */
app.get("/recommendations", async (c) => {
  const userId = c.req.query("userId");
  
  // In production, this would use user preferences and history
  // For now, return popular recipes
  try {
    const recipes = await RecipeModel.list({ limit: 10 });
    
    return c.json({
      success: true,
      data: {
        recipes,
        recommendations: "Based on popular recipes",
      },
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return c.json(
      { success: false, error: "Failed to get recommendations" },
      500
    );
  }
});

export default app;
