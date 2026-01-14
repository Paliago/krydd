import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { invokeClaude } from "@krydd/core/lib/bedrock";
import { suggestRecipesFromIngredients, generateWeeklyMealPlan, suggestSubstitutions } from "@krydd/core/lib/bedrock";
import { RecipeModel } from "@krydd/core/models/recipe-model";
import { createEmbedding, semanticRecipeSearch } from "@krydd/core/lib/vector-search";
import { z } from "zod";

const app = new Hono();

// Chat message schema
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    recentRecipes: z.array(z.string()).optional(),
    preferences: z.record(z.unknown()).optional(),
  }).optional(),
});

// Chat history item
const chatHistorySchema = z.array(z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
}));

/**
 * POST /chat - AI-powered recipe assistant
 */
app.post("/", zValidator("json", chatMessageSchema), async (c) => {
  const { message, context } = c.req.valid("json");
  
  try {
    // System prompt for the recipe assistant
    const systemPrompt = `You are Krydd, a helpful recipe assistant. 
    
    Your expertise includes:
    - Finding recipes based on ingredients
    - Providing cooking tips and substitutions
    - Creating meal plans
    - Answering recipe questions
    
    Be friendly, encouraging, and provide practical advice. 
    When suggesting recipes, be specific with measurements and instructions.
    
    Current context: ${context?.preferences ? JSON.stringify(context.preferences) : "No specific preferences"}`;

    // Get recent recipes for context if provided
    let contextRecipes: any[] = [];
    if (context?.recentRecipes && context.recentRecipes.length > 0) {
      contextRecipes = await RecipeModel.batchGet(context.recentRecipes);
    }

    // Build the full prompt with context
    let fullPrompt = message;
    if (contextRecipes.length > 0) {
      fullPrompt = `Context: The user has been looking at these recipes:\n` +
        contextRecipes.map((r) => `- ${r.title}`).join("\n") +
        `\n\nUser question: ${message}`;
    }

    // Invoke Claude for response
    const response = await invokeClaude(fullPrompt, {
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    });

    return c.json({
      success: true,
      data: {
        response,
        messageId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to process chat message",
      },
      500
    );
  }
});

/**
 * POST /chat/search - AI-powered recipe search
 */
app.post("/search", zValidator("json", chatMessageSchema), async (c) => {
  const { message } = c.req.valid("json");
  
  try {
    // Use semantic search to find relevant recipes
    const searchResults = await semanticRecipeSearch(message, { maxResults: 10 });
    
    // Get full recipe data
    let recipes: any[] = [];
    if (searchResults.length > 0) {
      const recipeIds = searchResults.map((r) => r.recipeId);
      recipes = await RecipeModel.batchGet(recipeIds);
    }

    // Generate AI summary of the search results
    const summary = await invokeClaude(
      `The user searched for "${message}". Here are the found recipes: ` +
      recipes.map((r) => `${r.title}: ${r.description || "No description"}`).join("; ") ||
      "No recipes found matching this search.",
      {
        maxTokens: 512,
        temperature: 0.5,
      }
    );

    return c.json({
      success: true,
      data: {
        recipes,
        summary,
        searchQuery: message,
        totalResults: recipes.length,
      },
    });
  } catch (error) {
    console.error("Chat search error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to search recipes",
      },
      500
    );
  }
});

/**
 * POST /chat/suggest - Get AI suggestions based on ingredients
 */
app.post("/suggest", zValidator("json", z.object({
  ingredients: z.array(z.string()).min(1),
  preferences: z.record(z.unknown()).optional(),
})), async (c) => {
  const { ingredients, preferences } = c.req.valid("json");
  
  try {
    const suggestions = await suggestRecipesFromIngredients(ingredients, preferences);
    
    return c.json({
      success: true,
      data: {
        suggestions,
        basedOnIngredients: ingredients,
      },
    });
  } catch (error) {
    console.error("Suggest error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate suggestions",
      },
      500
    );
  }
});

/**
 * POST /chat/meal-plan - Generate a meal plan
 */
app.post("/meal-plan", zValidator("json", z.object({
  preferences: z.object({
    cuisines: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    caloriesPerDay: z.number().optional(),
    mealsPerDay: z.number().min(2).max(6).default(3),
  }).optional(),
})), async (c) => {
  const { preferences } = c.req.valid("json");
  
  try {
    const mealPlan = await generateWeeklyMealPlan(preferences || {});
    
    return c.json({
      success: true,
      data: {
        mealPlan,
        preferences,
      },
    });
  } catch (error) {
    console.error("Meal plan generation error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate meal plan",
      },
      500
    );
  }
});

/**
 * POST /chat/substitutions - Get ingredient substitutions
 */
app.post("/substitutions", zValidator("json", z.object({
  ingredient: z.string().min(1),
  dietaryRestriction: z.string().optional(),
})), async (c) => {
  const { ingredient, dietaryRestriction } = c.req.valid("json");
  
  try {
    const substitutions = await suggestSubstitutions(ingredient, dietaryRestriction);
    
    return c.json({
      success: true,
      data: {
        ingredient,
        substitutions,
        dietaryRestriction,
      },
    });
  } catch (error) {
    console.error("Substitutions error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get substitutions",
      },
      500
    );
  }
});

export default app;
