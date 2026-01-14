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
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  MealPlanFilter,
} from "./meal-plan";
import { mealPlanSchema } from "./meal-plan";
import { v4 as uuidv4 } from "uuid";

const MEAL_PLANS_TABLE = Resource.MealPlansTable?.name || "Krydd-MealPlans";

export namespace MealPlanModel {
  /**
   * Create a new meal plan
   */
  export const create = async (
    data: CreateMealPlanInput
  ): Promise<MealPlan> => {
    const now = new Date().toISOString();
    const id = uuidv4();
    
    const mealPlan: MealPlan = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const validated = mealPlanSchema.parse(mealPlan);

    const command = new PutCommand({
      TableName: MEAL_PLANS_TABLE,
      Item: {
        PK: `USER#${data.userId}`,
        SK: `MEALPLAN#${data.weekStartDate}`,
        GSI1PK: `MEALPLAN#${data.weekStartDate}`,
        GSI1SK: `USER#${data.userId}`,
        ...validated,
      },
    });

    await ddb.send(command);
    return validated;
  };

  /**
   * Get a meal plan by ID
   */
  export const get = async (id: string): Promise<MealPlan | null> => {
    // First, find the meal plan by scanning (or use a reverse index)
    // For simplicity, we'll query by user and week
    const command = new QueryCommand({
      TableName: MEAL_PLANS_TABLE,
      KeyConditionExpression: "SK = :sk and begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":sk": `MEALPLAN#${id}`,
        ":pk": "USER#",
      },
    });

    const result = await ddb.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    try {
      return mealPlanSchema.parse(result.Items[0]);
    } catch {
      return null;
    }
  };

  /**
   * Get meal plan by user and week
   */
  export const getByUserAndWeek = async (
    userId: string,
    weekStartDate: string
  ): Promise<MealPlan | null> => {
    const command = new GetCommand({
      TableName: MEAL_PLANS_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: `MEALPLAN#${weekStartDate}`,
      },
    });

    const result = await ddb.send(command);
    
    if (!result.Item) {
      return null;
    }

    try {
      return mealPlanSchema.parse(result.Item);
    } catch {
      return null;
    }
  };

  /**
   * Update a meal plan
   */
  export const update = async (
    id: string,
    data: UpdateMealPlanInput
  ): Promise<MealPlan | null> => {
    // First get the existing meal plan to find the PK/SK
    const existing = await get(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated: MealPlan = {
      ...existing,
      ...data,
      id,
      updatedAt: now,
    };

    const validated = mealPlanSchema.parse(updated);

    const command = new PutCommand({
      TableName: MEAL_PLANS_TABLE,
      Item: {
        PK: `USER#${updated.userId}`,
        SK: `MEALPLAN#${updated.weekStartDate}`,
        GSI1PK: `MEALPLAN#${updated.weekStartDate}`,
        GSI1SK: `USER#${updated.userId}`,
        ...validated,
      },
    });

    await ddb.send(command);
    return validated;
  };

  /**
   * Update meal plan days
   */
  export const updateDays = async (
    userId: string,
    weekStartDate: string,
    days: Record<string, unknown>
  ): Promise<MealPlan | null> => {
    const existing = await getByUserAndWeek(userId, weekStartDate);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      days: { ...existing.days, ...days },
      updatedAt: now,
    };

    const validated = mealPlanSchema.parse(updated);

    const command = new PutCommand({
      TableName: MEAL_PLANS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `MEALPLAN#${weekStartDate}`,
        GSI1PK: `MEALPLAN#${weekStartDate}`,
        GSI1SK: `USER#${userId}`,
        ...validated,
      },
    });

    await ddb.send(command);
    return validated;
  };

  /**
   * Delete a meal plan
   */
  export const remove = async (id: string): Promise<boolean> => {
    // Find and delete by scanning
    const command = new QueryCommand({
      TableName: MEAL_PLANS_TABLE,
      KeyConditionExpression: "SK = :sk and begins_with(PK, :pk)",
      ExpressionAttributeValues: {
        ":sk": `MEALPLAN#${id}`,
        ":pk": "USER#",
      },
    });

    const result = await ddb.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return false;
    }

    const item = result.Items[0];
    const deleteCommand = new DeleteCommand({
      TableName: MEAL_PLANS_TABLE,
      Key: { PK: item.PK, SK: item.SK },
    });

    await ddb.send(deleteCommand);
    return true;
  };

  /**
   * List meal plans by user
   */
  export const listByUser = async (
    userId: string,
    limit: number = 10
  ): Promise<MealPlan[]> => {
    const command = new QueryCommand({
      TableName: MEAL_PLANS_TABLE,
      KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "MEALPLAN#",
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit,
    });

    const result = await ddb.send(command);
    
    return (result.Items || []).map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, ...mealPlan } = item;
      return mealPlanSchema.parse(mealPlan);
    });
  };

  /**
   * List meal plans by week
   */
  export const listByWeek = async (
    weekStartDate: string,
    limit: number = 100
  ): Promise<MealPlan[]> => {
    const command = new QueryCommand({
      TableName: MEAL_PLANS_TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk and begins_with(GSI1SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `MEALPLAN#${weekStartDate}`,
        ":sk": "USER#",
      },
      Limit: limit,
    });

    const result = await ddb.send(command);
    
    return (result.Items || []).map((item) => {
      const { PK, SK, GSI1PK, GSI1SK, ...mealPlan } = item;
      return mealPlanSchema.parse(mealPlan);
    });
  };
}
