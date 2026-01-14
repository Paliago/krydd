import { User } from "@vision/core/user";
import { zValidator } from "@hono/zod-validator";
import { userSchema, partialUserSchema } from "@vision/core/user/schema";
import { Hono } from "hono";

const app = new Hono();

/**
 * Get user info
 */
app.get("/:email", async (c) => {
  const email = c.req.param("email");

  const user = await User.get(email);

  return c.json(user);
});

/**
 * Create a user
 */
app.post("/", zValidator("json", userSchema), async (c) => {
  const validated = c.req.valid("json");

  const existingUser = await User.get(validated.email);

  if (existingUser) {
    return c.json({ error: "User already exists" }, 400);
  }

  const user = await User.create(validated);
  return c.json(user);
});

/**
 * Update a user
 */
app.put("/:email", zValidator("json", partialUserSchema), async (c) => {
  const email = c.req.param("email");
  const validated = c.req.valid("json");

  const user = await User.update(email, validated);
  return c.json(user);
});

/**
 * Remove a user
 */
app.delete("/:email", async (c) => {
  const email = c.req.param("email");

  const user = await User.remove(email);
  return c.json(user);
});

/**
 * List all users
 */
app.get("/", async (c) => {
  const users = await User.list();

  return c.json(users);
});

export default app;
