import { useEffect } from "react";
import { Form, useNavigation } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ThemeSelector } from "~/components/theme-selector";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/settings";

// Define Zod schema for name validation
const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { properties, headers } = await requireSession(request);

  return { 
    user: { email: properties.email, name: properties.name || properties.email },
    headers
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { properties, headers } = await requireSession(request);
  const user = { email: properties.email, name: properties.name || properties.email };

  const formData = await request.formData();
  const result = settingsSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      errors: result.error.issues.reduce(
        (acc, issue) => {
          acc[issue.path[0]] = issue.message;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };
  }

  const { name } = result.data;

  try {
    // TODO: go through API
    // await User.update(subject.properties.email, { name });
    return { success: true, message: "Settings saved!" };
  } catch (error) {
    console.error("Error updating user name:", error);
    return {
      errors: {
        form: "An unexpected error occurred. Please try again.",
      },
    };
  }
};

export default function Settings({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user } = loaderData;
  const navigation = useNavigation();
  const isDisabled =
    navigation.state === "submitting" || navigation.state === "loading";
  const errors = actionData?.errors;

  useEffect(() => {
    if (actionData?.success && actionData.message) {
      toast.success(actionData.message);
    }
  }, [actionData]);

  return (
    <>
      <Form method="post" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
            <CardDescription>
              Manage your name and view your account email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors?.form && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                {errors.form}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={user?.name}
                aria-describedby={errors?.name ? "name-error" : undefined}
              />
              {errors?.name && (
                <p className="text-sm text-destructive" id="name-error">
                  {errors.name}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div />
            <Button type="submit" disabled={isDisabled}>
              {isDisabled ? "Saving..." : "Save settings"}
            </Button>
          </CardFooter>
        </Card>
      </Form>

      <ThemeSelector />
    </>
  );
}
