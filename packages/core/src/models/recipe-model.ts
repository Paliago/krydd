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

const RECIPES_TABLE = Resource.RecipesTable?.name;

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
        pk: "RECIPE",
        sk: `RECIPE#${id}`,
        gsi1pk: `AUTHOR#${data.authorId}`,
        gsi1sk: `RECIPE#${id}`,
        gsi2pk: `CUISINE#${data.cuisine || "UNKNOWN"}`,
        gsi2sk: `RECIPE#${data.createdAt}`,
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
      Key: { pk: "RECIPE", sk: `RECIPE#${id}` },
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
      Key: { pk: "RECIPE", sk: `RECIPE#${id}` },
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
      Key: { pk: "RECIPE", sk: `RECIPE#${id}` },
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
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk and begins_with(gsi1sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `AUTHOR#${authorId}`,
        ":sk": "RECIPE#",
      },
      Limit: limit + 1,
      ExclusiveStartKey: cursor
        ? { pk: "RECIPE", sk: cursor }
        : undefined,
    });

    const result = await ddb.send(command);
    const recipes = (result.Items || []).slice(0, limit).map((item) => {
      const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, ...recipe } = item;
      return recipeSchema.parse(recipe);
    });

    let nextCursor: string | undefined;
    if (result.LastEvaluatedKey && (result.Items?.length || 0) > limit) {
      nextCursor = result.LastEvaluatedKey.sk;
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
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk and begins_with(gsi2sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CUISINE#${cuisine}`,
        ":sk": "RECIPE#",
      },
      Limit: limit + 1,
      ExclusiveStartKey: cursor
        ? { pk: "RECIPE", sk: cursor }
        : undefined,
    });

    const result = await ddb.send(command);
    const recipes = (result.Items || []).slice(0, limit).map((item) => {
      const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, ...recipe } = item;
      return recipeSchema.parse(recipe);
    });

    let nextCursor: string | undefined;
    if (result.LastEvaluatedKey && (result.Items?.length || 0) > limit) {
      nextCursor = result.LastEvaluatedKey.sk;
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

    const command = new QueryCommand({
      TableName: RECIPES_TABLE,
      KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": "RECIPE",
        ":sk": "RECIPE#",
      },
      Limit: limit,
    });

    const result = await ddb.send(command);
    const recipes = (result.Items || []).map((item) => {
      const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, ...recipe } = item;
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

    const recipes = await Promise.all(
      ids.map((id) => get(id))
    );

    return recipes.filter((r): r is Recipe => r !== null);
  };
}
