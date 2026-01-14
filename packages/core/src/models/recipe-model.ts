import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst/resource";
import { ddb } from "../lib/ddb";
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeFilter,
} from "./recipe";
import { recipeSchema, createRecipeInputSchema } from "./recipe";
import { v4 as uuidv4 } from "uuid";

const RECIPES_TABLE = Resource.RecipesTable?.name || "Krydd-Recipes";
const USERS_TABLE = Resource.Table?.name || "Krydd-Users";

export namespace RecipeModel {
  /**
   * Create a new recipe
   */
  export const create = async (data: CreateRecipeInput): Promise<Recipe> => {
    const now = new Date().toISOString();
    const id = uuidv4();
    
    const recipe: Recipe = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Validate the recipe data
    const validated = recipeSchema.parse(recipe);

    const command = new PutCommand({
      TableName: RECIPES_TABLE,
      Item: {
        PK: "RECIPE",
        SK: `RECIPE#${id}`,
        GSI1PK: `AUTHOR#${data.authorId}`,
        GSI1SK: `RECIPE#${id}`,
        GSI2PK: `CUISINE#${data.cuisine || "UNKNOWN"}`,
        GSI2SK: `RECIPE#${data.createdAt}`,
        ...validated,
      },
    });

    await ddb.send(command);
    return validated;
  };

  /**
   * Get a recipe by ID
   */
  export const get = async (id: string): Promise<Recipe | null> => {
    const command = new GetCommand({
      TableName: RECIPES_TABLE,
      Key: { PK: "RECIPE", SK: `RECIPE#${id}` },
    });

    const result = await ddb.send(command);
    
    if (!result.Item) {
      return null;
    }

    try {
      return recipeSchema.parse(result.Item);
    } catch {
      return null;
    }
  };

  /**
   * Update a recipe
   */
  export const update = async (
    id: string,
    data: UpdateRecipeInput
  ): Promise<Recipe | null> => {
    const existing = await get(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated: Recipe = {
      ...existing,
      ...data,
      id,
      updatedAt: now,
    };

    const validated = recipeSchema.parse(updated);

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    const fieldsToUpdate = [
      "title", "description", "ingredients", "instructions",
      "prepTime", "cookTime", "servings", "difficulty",
      "cuisine", "dietaryTags", "imageUrl"
    ];

    for (const field of fieldsToUpdate) {
      if (field in data && data[field as keyof UpdateRecipeInput] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = updated[field as keyof Recipe];
      }
    }

    updateExpressions.push(`#updatedAt = :updatedAt`);
    expressionAttributeValues[`:updatedAt`] = now;

    const command = new UpdateCommand({
      TableName: RECIPES_TABLE,
      Key: { PK: "RECIPE", SK: `RECIPE#${id}` },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await ddb.send(command);
    return validated;
  };

  /**
   * Delete a recipe
   */
  export const remove = async (id: string): Promise<boolean> => {
    const command = new DeleteCommand({
      TableName: RECIPES_TABLE,
      Key: { PK: "RECIPE", SK: `RECIPE#${id}` },
    });

    await ddb.send(command);
    return true;
  };

  /**
   * List recipes by author
   */
  export const listByAuthor = async (
    authorId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<{ recipes: Recipe[]; nextCursor?: string }> => {
    const command = new QueryCommand({
      TableName: RECIPES_TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk and begins_with(GSI1SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `AUTHOR#${authorId}`,
        ":sk": "RECIPE#",
      },
      Limit: limit + 1, // Fetch one extra to check for more results
      ExclusiveStartKey: cursor
        ? { PK: "RECIPE", SK: cursor }
        : undefined,
    });

    const result = await ddb.send(command);
    const recipes = (result.Items || []).slice(0, limit).map((item) => {
      // Remove DynamoDB-specific keys
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...recipe } = item;
      return recipeSchema.parse(recipe);
    });

    let nextCursor: string | undefined;
    if (result.LastEvaluatedKey && (result.Items?.length || 0) > limit) {
      nextCursor = result.LastEvaluatedKey.SK;
    }

    return { recipes, nextCursor };
  };

  /**
   * List recipes by cuisine
   */
  export const listByCuisine = async (
    cuisine: string,
    limit: number = 20,
    cursor?: string
  ): Promise<{ recipes: Recipe[]; nextCursor?: string }> => {
    const command = new QueryCommand({
      TableName: RECIPES_TABLE,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk and begins_with(GSI2SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CUISINE#${cuisine}`,
        ":sk": "RECIPE#",
      },
      Limit: limit + 1,
      ExclusiveStartKey: cursor
        ? { PK: "RECIPE", SK: cursor }
        : undefined,
    });

    const result = await ddb.send(command);
    const recipes = (result.Items || []).slice(0, limit).map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...recipe } = item;
      return recipeSchema.parse(recipe);
    });

    let nextCursor: string | undefined;
    if (result.LastEvaluatedKey && (result.Items?.length || 0) > limit) {
      nextCursor = result.LastEvaluatedKey.SK;
    }

    return { recipes, nextCursor };
  };

  /**
   * List all recipes with optional filtering
   */
  export const list = async (
    filter?: RecipeFilter
  ): Promise<Recipe[]> => {
    const { authorId, cuisine, limit = 20 } = filter || {};

    if (authorId) {
      const result = await listByAuthor(authorId, limit);
      return result.recipes;
    }

    if (cuisine) {
      const result = await listByCuisine(cuisine, limit);
      return result.recipes;
    }

    // Default: scan all recipes (not efficient for large datasets)
    // In production, use a separate GSI or search index
    const command = new QueryCommand({
      TableName: RECIPES_TABLE,
      KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": "RECIPE",
        ":sk": "RECIPE#",
      },
      Limit: limit,
    });

    const result = await ddb.send(command);
    const recipes = (result.Items || []).map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...recipe } = item;
      return recipeSchema.parse(recipe);
    });

    return recipes;
  };

  /**
   * Get multiple recipes by IDs
   */
  export const batchGet = async (
    ids: string[]
  ): Promise<Recipe[]> => {
    if (ids.length === 0) {
      return [];
    }

    // For batch operations, we'd use BatchGetCommand in production
    const recipes = await Promise.all(
      ids.map((id) => get(id))
    );

    return recipes.filter((r): r is Recipe => r !== null);
  };
}
