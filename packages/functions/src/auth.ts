import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { issuer } from "@openauthjs/openauth";
import { UnknownStateError } from "@openauthjs/openauth/error";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { subjects } from "@vision/core/subjects";
import { handle } from "hono/aws-lambda";
import { Resource } from "sst/resource";

const storage = DynamoStorage({
  table: "Auth",
  pk: "pk",
  sk: "sk",
});

const client = new SESv2Client();

const app = issuer({
  subjects,
  allow: async () => true,
  select: async (providers) => {
    const redirectUrl = new URL(`${process.env.AUTH_FRONTEND_URL}/auth/select`);
    redirectUrl.searchParams.set("providers", JSON.stringify(providers));
    return Response.redirect(redirectUrl.toString(), 302);
  },
  providers: {
    email: CodeProvider({
      length: 6,
      sendCode: async (email, code) => {
        console.log("send code: ", email, code);

        await client.send(
          new SendEmailCommand({
            FromEmailAddress: Resource.Email.sender,
            Destination: {
              ToAddresses: [typeof email === "string" ? email : email.email],
            },
            Content: {
              Simple: {
                Subject: {
                  Data: `Vision - Verification Code - ${code}`,
                },
                Body: {
                  Text: {
                    Data: `Here is the verification code for logging in to Vision: ${code}`,
                  },
                },
              },
            },
          }),
        );
      },
      async request(_req, state, _form, error) {
        const params = new URLSearchParams();

        // we pass the error to the frontend with a query param
        if (error) {
          params.set("error", error.type);
        }

        if (state.type === "start") {
          return Response.redirect(
            `${process.env.AUTH_FRONTEND_URL}/auth/email?${params.toString()}`,
            302,
          );
        }

        if (state.type === "code") {
          params.set("claims", JSON.stringify(state.claims));

          if (state.resend) {
            params.set("resend", "true");
          }

          return Response.redirect(
            `${process.env.AUTH_FRONTEND_URL}/auth/code?${params.toString()}`,
            302,
          );
        }

        // OpenAuth throws a UnknownStateError here, so we just mimic it
        throw new UnknownStateError();
      },
    }),
    // TODO: add real provider this is just a placeholder
    github: GithubProvider({
      clientID: Resource.GITHUB_CLIENT_ID.value,
      clientSecret: Resource.GITHUB_CLIENT_SECRET.value,
      scopes: ["read:user", "user:email"],
    }),
  },
  success: async (ctx, value) => {
    if (value.provider === "email") {
      const email = value.claims.email;
      if (!email) {
        throw new Error("No email found");
      }

      return ctx.subject(
        "account",
        { type: "email", email },
        { subject: email },
      );
    }

    // TODO: add real provider this is just a placeholder
    if (value.provider === "github") {
      const access = value.tokenset.access;

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${access}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      const user = (await userResponse.json()) as GitHubUser;

      if (!user) {
        throw new Error("No user found");
      }

      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${access}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      const emails = (await emailResponse.json()) as GitHubEmail[];
      const primary = emails.find((email) => email.primary);

      if (!primary?.verified) {
        throw new Error("Email not verified");
      }

      return ctx.subject(
        "account",
        {
          type: "oauth",
          id: typeof user.id === "number" ? user.id.toString() : user.id,
          email: primary.email,
          name: user.name,
          imageUrl: user.avatar_url,
          provider: "github",
        },
        { subject: primary.email },
      );
    }

    throw new Error("Invalid provider");
  },
  storage,
});

export const handler = handle(app);

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

interface GitHubUser {
  login: string;
  id: string | number;
  name: string | undefined;
  avatar_url: string | undefined;
}
