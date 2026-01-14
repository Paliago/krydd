import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { MealPlanModel } from "@krydd/core/models/meal-plan-model";
import {
  createMealPlanInputSchema,
  updateMealPlanInputSchema,
  mealPlanFilterSchema,
  dayMealsSchema,
} from "@krydd/core/models/meal-plan";

const app = new Hono();

/**
 * GET /meal-plan - List meal plans for a user
 */
app.get("/", zValidator("query", mealPlanFilterSchema), async (c) => {
  const filter = c.req.valid("query");
  
  const mealPlans = await MealPlanModel.listByUser(filter.userId, filter.limit);
  
  return c.json({
    success: true,
    data: mealPlans,
    count: mealPlans.length,
  });
});

/**
 * GET /meal-plan/:weekStart - Get meal plan for a specific week
 */
app.get("/:weekStart", async (c) => {
  const weekStart = c.req.param("weekStart");
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json(
      { success: false, error: "userId query parameter is required" },
      400
    );
  }
  
  const mealPlan = await MealPlanModel.getByUserAndWeek(userId, weekStart);
  
  if (!mealPlan) {
    return c.json(
      { success: false, error: "Meal plan not found" },
      404
    );
  }
  
  return c.json({
    success: true,
    data: mealPlan,
  });
});

/**
 * POST /meal-plan - Create a new meal plan
 */
app.post("/", zValidator("json", createMealPlanInputSchema), async (c) => {
  const data = c.req.valid("json");
  
  const mealPlan = await MealPlanModel.create(data);
  
  return c.json(
    {
      success: true,
      data: mealPlan,
    },
    201
  );
});

/**
 * PUT /meal-plan/:weekStart - Update a meal plan
 */
app.put(
  "/:weekStart",
  zValidator("json", updateMealPlanInputSchema),
  async (c) => {
    const weekStart = c.req.param("weekStart");
    const data = c.req.valid("json");
    
    // First get to find the ID
    const userId = data.userId;
    const existing = await MealPlanModel.getByUserAndWeek(userId, weekStart);
    
    if (!existing) {
      return c.json(
        { success: false, error: "Meal plan not found" },
        404
      );
    }
    
    const mealPlan = await MealPlanModel.update(existing.id!, data);
    
    return c.json({
      success: true,
      data: mealPlan,
    });
  }
);

/**
 * PATCH /meal-plan/:weekStart/days - Update specific days in a meal plan
 */
app.patch(
  "/:weekStart/days",
  zValidator("json", z.object({
    days: z.record(z.string(), dayMealsSchema),
  })),
  async (c) => {
    const weekStart = c.req.param("weekStart");
    const { days } = c.req.valid("json");
    const userId = c.req.query("userId");
    
    if (!userId) {
      return c.json(
        { success: false, error: "userId query parameter is required" },
        400
      );
    }
    
    const mealPlan = await MealPlanModel.updateDays(userId, weekStart, days);
    
    if (!mealPlan) {
      return c.json(
        { success: false, error: "Meal plan not found" },
        404
      );
    }
    
    return c.json({
      success: true,
      data: mealPlan,
    });
  }
);

/**
 * DELETE /meal-plan/:id - Delete a meal plan
 */
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  
  const deleted = await MealPlanModel.remove(id);
  
  if (!deleted) {
    return c.json(
      { success: false, error: "Meal plan not found" },
      404
    );
  }
  
  return c.json({
    success: true,
    message: "Meal plan deleted successfully",
  });
});

/**
 * GET /meal-plan/week/:weekStart/list - List all meal plans for a week (for admin)
 */
app.get("/week/:weekStart", async (c) => {
  const weekStart = c.req.param("weekStart");
  
  const mealPlans = await MealPlanModel.listByWeek(weekStart);
  
  return c.json({
    success: true,
    data: mealPlans,
    count: mealPlans.length,
  });
});

export default app;
