import { z } from "zod";

// Meal type enum
export const mealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

// Meal entry schema
export const mealEntrySchema = z.object({
  recipeId: z.string().uuid(),
  mealType: mealTypeEnum,
  notes: z.string().optional(),
});

export type MealEntry = z.infer<typeof mealEntrySchema>;

// Day meals schema (meals for a single day)
export const dayMealsSchema = z.object({
  date: z.string().date(), // YYYY-MM-DD format
  breakfast: z.array(mealEntrySchema).optional(),
  lunch: z.array(mealEntrySchema).optional(),
  dinner: z.array(mealEntrySchema).optional(),
  snacks: z.array(mealEntrySchema).optional(),
});

export type DayMeals = z.infer<typeof dayMealsSchema>;

// Full meal plan schema
export const mealPlanSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  weekStartDate: z.string().date(), // YYYY-MM-DD format (Monday of the week)
  days: z.record(z.string().date(), dayMealsSchema), // Date -> DayMeals mapping
  goals: z.object({
    calories: z.number().int().min(0).optional(),
    protein: z.number().int().min(0).optional(),
    carbs: z.number().int().min(0).optional(),
    fat: z.number().int().min(0).optional(),
  }).optional(),
  preferences: z.object({
    cuisines: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    avoidIngredients: z.array(z.string()).optional(),
  }).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type MealPlan = z.infer<typeof mealPlanSchema>;

// Meal plan creation input
export const createMealPlanInputSchema = mealPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateMealPlanInput = z.infer<typeof createMealPlanInputSchema>;

// Meal plan update input
export const updateMealPlanInputSchema = mealPlanSchema.partial();

export type UpdateMealPlanInput = z.infer<typeof updateMealPlanInputSchema>;

// Meal plan filter
export const mealPlanFilterSchema = z.object({
  userId: z.string().uuid(),
  weekStartDate: z.string().date().optional(),
  limit: z.number().int().min(1).max(52).default(4),
});

export type MealPlanFilter = z.infer<typeof mealPlanFilterSchema>;
