import { z } from "zod";

// Ingredient schema for recipe ingredients
export const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// Recipe difficulty levels
export const difficultyEnum = z.enum(["easy", "medium", "hard"]);

// Main recipe schema
export const recipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ingredients: z.array(ingredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  prepTime: z.number().int().min(0), // in minutes
  cookTime: z.number().int().min(0), // in minutes
  servings: z.number().int().min(1),
  difficulty: difficultyEnum,
  cuisine: z.string().optional(),
  dietaryTags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  authorId: z.string().uuid(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;

// Recipe creation input (without id and timestamps)
export const createRecipeInputSchema = recipeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Recipe update input (all fields optional)
export const updateRecipeInputSchema = recipeSchema.partial();

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Recipe filter for queries
export const recipeFilterSchema = z.object({
  authorId: z.string().uuid().optional(),
  cuisine: z.string().optional(),
  difficulty: difficultyEnum.optional(),
  dietaryTags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type RecipeFilter = z.infer<typeof recipeFilterSchema>;
