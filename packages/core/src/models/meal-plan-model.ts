import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst/resource";
import { ddb } from "../lib/ddb";
import type {
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
} from "./meal-plan";
import { mealPlanSchema } from "./meal-plan";
import { v4 as uuidv4 } from "uuid";

const MEAL_PLANS_TABLE = Resource.MealPlansTable?.name;

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
        pk: `USER#${data.userId}`,
        sk: `MEALPLAN#${data.weekStartDate}`,
        gsi1pk: `MEALPLAN#${data.weekStartDate}`,
        gsi1sk: `USER#${data.userId}`,
        ...validated,
      },
    });

    await ddb.send(command);
    return validated;
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
        pk: `USER#${userId}`,
        sk: `MEALPLAN#${weekStartDate}`,
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
    userId: string,
    weekStartDate: string,
    data: UpdateMealPlanInput
  ): Promise<MealPlan | null> => {
    const existing = await getByUserAndWeek(userId, weekStartDate);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated: MealPlan = {
      ...existing,
      ...data,
      updatedAt: now,
    };

    const validated = mealPlanSchema.parse(updated);

    const command = new PutCommand({
      TableName: MEAL_PLANS_TABLE,
      Item: {
        pk: `USER#${updated.userId}`,
        sk: `MEALPLAN#${updated.weekStartDate}`,
        gsi1pk: `MEALPLAN#${updated.weekStartDate}`,
        gsi1sk: `USER#${updated.userId}`,
        ...validated,
      },
    });

    await ddb.send(command);
    return validated;
  };

  /**
   * Delete a meal plan
   */
  export const remove = async (
    userId: string,
    weekStartDate: string
  ): Promise<boolean> => {
    const command = new DeleteCommand({
      TableName: MEAL_PLANS_TABLE,
      Key: {
        pk: `USER#${userId}`,
        sk: `MEALPLAN#${weekStartDate}`,
      },
    });

    await ddb.send(command);
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
      KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "MEALPLAN#",
      },
      ScanIndexForward: false,
      Limit: limit,
    });

    const result = await ddb.send(command);
    
    return (result.Items || []).map((item) => {
      const { pk, sk, gsi1pk, gsi1sk, ...mealPlan } = item;
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
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk and begins_with(gsi1sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `MEALPLAN#${weekStartDate}`,
        ":sk": "USER#",
      },
      Limit: limit,
    });

    const result = await ddb.send(command);
    
    return (result.Items || []).map((item) => {
      const { pk, sk, gsi1pk, gsi1sk, ...mealPlan } = item;
      return mealPlanSchema.parse(mealPlan);
    });
  };
}
