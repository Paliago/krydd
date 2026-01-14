import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { RecipeModel } from "@krydd/core/models/recipe-model";
import {
  createRecipeInputSchema,
  updateRecipeInputSchema,
  recipeFilterSchema,
} from "@krydd/core/models/recipe";
import { storeRecipeEmbedding, createRecipeEmbedding } from "@krydd/core/lib/vector-search";

const app = new Hono();

/**
 * GET /recipes - List recipes
 */
app.get("/", zValidator("query", recipeFilterSchema), async (c) => {
  const filter = c.req.valid("query");
  
  const recipes = await RecipeModel.list(filter);
  
  return c.json({
    success: true,
    data: recipes,
    count: recipes.length,
  });
});

/**
 * GET /recipes/:id - Get a single recipe
 */
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  
  const recipe = await RecipeModel.get(id);
  
  if (!recipe) {
    return c.json(
      { success: false, error: "Recipe not found" },
      404
    );
  }
  
  return c.json({
    success: true,
    data: recipe,
  });
});

/**
 * POST /recipes - Create a new recipe
 */
app.post("/", zValidator("json", createRecipeInputSchema), async (c) => {
  const data = c.req.valid("json");
  
  // Extract authorId from authenticated session (to be implemented)
  // For now, we'll use the provided authorId
  const recipe = await RecipeModel.create(data);
  
  // Create and store embedding for semantic search
  try {
    const embedding = await createRecipeEmbedding(recipe);
    await storeRecipeEmbedding(recipe.id!, embedding);
  } catch (error) {
    console.error("Error creating recipe embedding:", error);
    // Don't fail the recipe creation if embedding fails
  }
  
  return c.json(
    {
      success: true,
      data: recipe,
    },
    201
  );
});

/**
 * PUT /recipes/:id - Update a recipe
 */
app.put("/:id", zValidator("json", updateRecipeInputSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  
  const recipe = await RecipeModel.update(id, data);
  
  if (!recipe) {
    return c.json(
      { success: false, error: "Recipe not found" },
      404
    );
  }
  
  // Update embedding if title, description, or ingredients changed
  try {
    const embedding = await createRecipeEmbedding(recipe);
    await storeRecipeEmbedding(recipe.id!, embedding);
  } catch (error) {
    console.error("Error updating recipe embedding:", error);
  }
  
  return c.json({
    success: true,
    data: recipe,
  });
});

/**
 * DELETE /recipes/:id - Delete a recipe
 */
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  
  const deleted = await RecipeModel.remove(id);
  
  if (!deleted) {
    return c.json(
      { success: false, error: "Recipe not found" },
      404
    );
  }
  
  return c.json({
    success: true,
    message: "Recipe deleted successfully",
  });
});

/**
 * GET /recipes/author/:authorId - Get recipes by author
 */
app.get("/author/:authorId", async (c) => {
  const authorId = c.req.param("authorId");
  const limit = Number(c.req.query("limit")) || 20;
  const cursor = c.req.query("cursor") || undefined;
  
  const result = await RecipeModel.listByAuthor(authorId, limit, cursor);
  
  return c.json({
    success: true,
    data: result.recipes,
    nextCursor: result.nextCursor,
  });
});

/**
 * GET /recipes/cuisine/:cuisine - Get recipes by cuisine
 */
app.get("/cuisine/:cuisine", async (c) => {
  const cuisine = c.req.param("cuisine");
  const limit = Number(c.req.query("limit")) || 20;
  const cursor = c.req.query("cursor") || undefined;
  
  const result = await RecipeModel.listByCuisine(cuisine, limit, cursor);
  
  return c.json({
    success: true,
    data: result.recipes,
    nextCursor: result.nextCursor,
  });
});

export default app;
