import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const partialUserSchema = userSchema.partial();

export type UserType = z.infer<typeof userSchema>;
export type PartialUser = z.infer<typeof partialUserSchema>;
