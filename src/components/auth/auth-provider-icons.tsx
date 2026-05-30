import { cn } from "@/lib/utils";

type IconProps = Readonly<{ className?: string }>;

/** Official multicolor Google "G" for sign-in buttons. */
export function GoogleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5 shrink-0", className)} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function TelegramBrandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5 shrink-0", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M9.04 15.29 8.9 18.6c.23 0 .33-.1.45-.22l2.18-2.08 4.52 3.31c.83.46 1.42.22 1.63-.77l2.98-14.02h.01c.26-1.22-.44-1.7-1.24-1.4L1.18 9.37C-.04 9.82-.02 10.55 1 10.92l5.5 1.72L18.9 5.5c.56-.37 1.07-.17.65.2"
      />
    </svg>
  );
}

export function EmailAccessIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
