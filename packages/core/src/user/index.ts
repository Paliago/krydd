import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst/resource";
import { ddb } from "../lib/ddb";
import { type PartialUser, type UserType, userSchema } from "./schema";

export namespace User {
  export const create = async (userData: UserType) => {
    const user = userSchema.parse(userData);
    try {
      const command = new PutCommand({
        TableName: Resource.Table.name,
        Item: {
          pk: "USER",
          sk: `USER#${user.email}`,
          ...user,
        },
      });

      await ddb.send(command);
      return user;
    } catch (error) {
      console.error("Error creating user", error);
      throw error;
    }
  };

  export const get = async (email: string) => {
    const command = new GetCommand({
      TableName: Resource.Table.name,
      Key: { pk: "USER", sk: `USER#${email}` },
    });

    const result = await ddb.send(command);

    if (!result.Item) {
      return null;
    }

    return userSchema.parse(result.Item);
  };

  export const update = async (email: string, user: PartialUser) => {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(user)) {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    }

    if (updateExpressions.length === 0) {
      return;
    }

    const command = new UpdateCommand({
      TableName: Resource.Table.name,
      Key: { pk: "USER", sk: `USER#${email}` },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const result = await ddb.send(command);
    return result;
  };

  export const remove = async (email: string) => {
    const command = new DeleteCommand({
      TableName: Resource.Table.name,
      Key: { pk: "USER", sk: `USER#${email}` },
    });

    const result = await ddb.send(command);
    return result;
  };

  export const list = async () => {
    const command = new QueryCommand({
      TableName: Resource.Table.name,
      KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": "USER",
        ":sk": "USER#",
      },
    });

    const result = await ddb.send(command);
    const users = result.Items?.map((item) => userSchema.parse(item));

    return users;
  };
}
