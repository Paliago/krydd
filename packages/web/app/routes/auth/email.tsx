import { ArrowLeftIcon, GalleryVerticalEnd } from "lucide-react";
import { useNavigation, useSearchParams } from "react-router";
import { StatusButton } from "~/components/status-button";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Label } from "~/components/ui/label";

export default function EmailAuthRoute() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const isPending = useNavigation().state !== "idle";

  const isVerifying = code === "true";

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a
                href="#"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <div className="flex size-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <span className="sr-only">Vision</span>
              </a>
              <h1 className="text-xl font-bold">
                {isVerifying ? "Enter verification code" : "Sign in with email"}
              </h1>
              <div className="text-center text-sm text-muted-foreground">
                {isVerifying
                  ? "We've sent a 6-digit code to your email address"
                  : "We'll send you a secure code to your email address"}
              </div>
            </div>

            {!isVerifying ? (
              <form
                method="post"
                className="flex flex-col gap-6"
                action={`${import.meta.env.VITE_AUTH_URL}/email/authorize`}
              >
                {error === "invalid_claim" && (
                  <FormAlert message="Invalid email address" />
                )}
                <input type="hidden" name="action" value="request" />
                <div className="grid gap-3">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    autoFocus
                    autoComplete="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <StatusButton
                  type="submit"
                  className="w-full"
                  status={isPending ? "pending" : error ? "error" : "idle"}
                >
                  Continue with Email
                </StatusButton>
              </form>
            ) : (
              <form
                method="post"
                className="flex flex-col gap-6"
                action={`${import.meta.env.VITE_AUTH_URL}/email/authorize`}
              >
                {error && <FormAlert message="Invalid or expired code" />}
                <input type="hidden" name="action" value="verify" />
                <div className="grid gap-3">
                  <Label htmlFor="code">Verification code</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} name="code" id="code" autoFocus>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <StatusButton
                  type="submit"
                  className="w-full"
                  status={isPending ? "pending" : error ? "error" : "idle"}
                >
                  Verify Code
                </StatusButton>
              </form>
            )}

            <div className="flex justify-center">
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/login" className="flex items-center gap-2">
                  <ArrowLeftIcon className="size-4" />
                  Back to sign in
                </a>
              </Button>
            </div>
          </div>
          <div className="text-muted-foreground text-center text-xs text-balance">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

function FormAlert({ message }: { message: string }) {
  return (
    <div className="bg-destructive/15 text-destructive border border-destructive/20 rounded-lg p-3 text-sm">
      {message}
    </div>
  );
}
