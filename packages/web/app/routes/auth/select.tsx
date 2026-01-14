import { GalleryVerticalEnd, MailIcon } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  type SimpleIcon,
  siFacebook,
  siGithub,
  siGoogle,
  siTwitch,
  siX,
} from "simple-icons";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function AuthenticationSelect() {
  const providers = useProviders();
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
              <h1 className="text-xl font-bold">Welcome to Vision</h1>
              <div className="text-center text-sm text-muted-foreground">
                Choose your preferred sign-in method
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                {Object.entries(providers).map(([key, type]) => {
                  if (key === "email") {
                    return (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        key={key}
                      >
                        <a href="/auth/email">
                          <MailIcon className="size-4" />
                          Continue with Email
                        </a>
                      </Button>
                    );
                  }

                  const Icon = ProviderIcons[key as keyof typeof ProviderIcons];
                  const url = new URL(
                    `${key}/authorize`,
                    import.meta.env.VITE_AUTH_URL,
                  );
                  return (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                      key={key}
                    >
                      <a href={url.toString()}>
                        {Icon && <Icon className="size-4" />}
                        Continue with{" "}
                        {DISPLAY[type as keyof typeof DISPLAY] ||
                          (type as string)}
                      </a>
                    </Button>
                  );
                })}
              </div>
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

const createSimpleIconComponent = (icon: SimpleIcon) => {
  const Component = ({ className }: { className?: string }) => {
    return (
      <div
        className={cn(
          "dark:[&_path]:fill-white dark:[&_svg]:fill-white size-4",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: icon.svg }}
      />
    );
  };
  Component.displayName = `SimpleIcon(${icon.title})`;
  return Component;
};

function useProviders() {
  const [searchParams] = useSearchParams();
  const providers = searchParams.get("providers");
  if (!providers) {
    throw new Response("No providers found", { status: 400 });
  }
  const parsedProviders = parseProviders(providers);
  return parsedProviders;
}

function parseProviders(providers: string) {
  try {
    return JSON.parse(providers) as Record<string, string>;
  } catch {
    throw new Response("Invalid providers", { status: 400 });
  }
}

const DISPLAY: Record<string, string> = {
  twitch: "Twitch",
  google: "Google",
  github: "GitHub",
  x: "X",
  facebook: "Facebook",
  code: "Email",
} as const;

const ProviderIcons: Record<
  string,
  React.ComponentType<React.ComponentProps<"svg">>
> = {
  twitch: createSimpleIconComponent(siTwitch),
  google: createSimpleIconComponent(siGoogle),
  github: createSimpleIconComponent(siGithub),
  x: createSimpleIconComponent(siX),
  facebook: createSimpleIconComponent(siFacebook),
  email: MailIcon,
} as const;
