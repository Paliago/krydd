import { Table } from "sst/aws/table";

// Recipes table for storing recipes
export const recipesTable = new Table("Recipes", {
  fields: {
    pk: "string",
    sk: "string",
    gsi1pk: "string",
    gsi1sk: "string",
    gsi2pk: "string",
    gsi2sk: "string",
  },
  primaryIndex: { hashKey: "pk", rangeKey: "sk" },
  globalIndexes: {
    gsi1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
    gsi2: { hashKey: "gsi2pk", rangeKey: "gsi2sk" },
  },
  stream: "new-and-old-images",
  ttl: "expireAt",
});

// Meal Plans table for storing meal plans
export const mealPlansTable = new Table("MealPlans", {
  fields: {
    pk: "string",
    sk: "string",
    gsi1pk: "string",
    gsi1sk: "string",
  },
  primaryIndex: { hashKey: "pk", rangeKey: "sk" },
  globalIndexes: {
    gsi1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
  },
  stream: "new-and-old-images",
  ttl: "expireAt",
});
