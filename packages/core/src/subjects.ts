import { createSubjects } from "@openauthjs/openauth/subject";
import { userSchema } from "./user/schema";
import { z } from "zod";

const EmailAccountSchema = userSchema.extend({
  type: z.literal("email"),
});

const OAuthAccountSchema = z.object({
  type: z.literal("oauth"),
  id: z.string(),
  email: z.string(),
  imageUrl: z.string().optional(),
  name: z.string().optional(),
  provider: z.string(),
});

export type EmailAccount = z.infer<typeof EmailAccountSchema>;
export type OAuthAccount = z.infer<typeof OAuthAccountSchema>;

const AccountSchema = z.discriminatedUnion("type", [
  EmailAccountSchema,
  OAuthAccountSchema,
]);

export type Account = EmailAccount | OAuthAccount;

export const subjects = createSubjects({
  account: AccountSchema,
});
