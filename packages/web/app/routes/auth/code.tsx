import { ArrowLeftIcon, GalleryVerticalEnd, Loader2Icon } from "lucide-react";
import { useRef } from "react";
import { useNavigation, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";

export default function CodeAuthRoute() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const resend = searchParams.get("resend");
  const claims = useClaims();
  const isPending = useNavigation().state !== "idle";

  const formRef = useRef<HTMLFormElement>(null);

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
              <h1 className="text-xl font-bold">Enter verification code</h1>
              <div className="text-center text-sm text-muted-foreground">
                {resend ? "Code resent" : "Code sent"} to {claims?.email}
              </div>
            </div>

            <form
              ref={formRef}
              method="post"
              action={`${import.meta.env.VITE_AUTH_URL}/email/authorize`}
              className="flex flex-col gap-6"
            >
              {error === "invalid_code" && (
                <FormAlert message="Invalid or expired code" />
              )}
              <input type="hidden" name="action" value="verify" />
              <div className="grid gap-3">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    name="code"
                    id="code"
                    autoFocus
                    onComplete={() => {
                      if (!formRef.current) return;
                      formRef.current.submit();
                    }}
                  >
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

              {isPending && (
                <div className="flex items-center justify-center">
                  <Loader2Icon className="animate-spin size-6" />
                </div>
              )}
            </form>

            <form
              method="post"
              action={`${import.meta.env.VITE_AUTH_URL}/email/authorize`}
              className="flex flex-col gap-4"
            >
              {Object.entries(claims || {}).map(([key, value]) => (
                <input
                  key={key}
                  type="hidden"
                  name={key}
                  value={value as string}
                />
              ))}
              <input type="hidden" name="action" value="resend" />
              <div className="text-center text-sm text-muted-foreground">
                Didn't receive a code?{" "}
                <button
                  type="submit"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Resend code
                </button>
              </div>
            </form>

            <div className="flex justify-center">
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/select" className="flex items-center gap-2">
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

function useClaims() {
  const [searchParams] = useSearchParams();
  const claims = searchParams.get("claims");
  try {
    return claims ? JSON.parse(claims) : null;
  } catch {
    return null;
  }
}
