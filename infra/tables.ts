import { Table } from "sst/aws/table";

// Recipes table for storing recipes
export const recipesTable = new Table("Recipes", {
  fields: {
    PK: "string",
    SK: "string",
    GSI1PK: "string",
    GSI1SK: "string",
    GSI2PK: "string",
    GSI2SK: "string",
    // Recipe-specific fields
    id: "string",
    title: "string",
    description: "string",
    ingredients: "list",
    instructions: "list",
    prepTime: "number",
    cookTime: "number",
    servings: "number",
    difficulty: "string",
    cuisine: "string",
    dietaryTags: "list",
    imageUrl: "string",
    authorId: "string",
    embeddingId: "string",
    createdAt: "string",
    updatedAt: "string",
  },
  primaryIndex: { hashKey: "PK", rangeKey: "SK" },
  globalIndexes: {
    GSI1: { hashKey: "GSI1PK", rangeKey: "GSI1SK" }, // byAuthor
    GSI2: { hashKey: "GSI2PK", rangeKey: "GSI2SK" }, // byCuisine
  },
  stream: "new-and-old-images",
  ttl: "expireAt",
});

// Meal Plans table for storing meal plans
export const mealPlansTable = new Table("MealPlans", {
  fields: {
    PK: "string",
    SK: "string",
    GSI1PK: "string",
    GSI1SK: "string",
    // Meal plan-specific fields
    id: "string",
    userId: "string",
    weekStartDate: "string",
    days: "map",
    goals: "map",
    preferences: "map",
    createdAt: "string",
    updatedAt: "string",
  },
  primaryIndex: { hashKey: "PK", rangeKey: "SK" },
  globalIndexes: {
    GSI1: { hashKey: "GSI1PK", rangeKey: "GSI1SK" }, // by week
  },
  stream: "new-and-old-images",
  ttl: "expireAt",
});

// Export table names for use in code
export const RECIPES_TABLE_NAME = recipesTable.name;
export const MEAL_PLANS_TABLE_NAME = mealPlansTable.name;
