"use client";

import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { msFadeScale, msTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "premium";
  wordmark?: string;
  panelClassName?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "default",
  wordmark = "MONEYSET",
  panelClassName,
}: ModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const premium = variant === "premium";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("ms-modal-open");
    return () => {
      root.classList.remove("ms-modal-open");
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          className={cn(
            "ms-modal-overlay fixed inset-0 z-[var(--ms-z-modal,100)] flex items-end justify-center p-4 sm:items-center",
            premium && "ms-modal-overlay--premium",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={msTransition.fast}
        >
          <button
            type="button"
            className={cn(
              "absolute inset-0 bg-ms-overlay backdrop-blur-md",
              premium && "backdrop-blur-[14px] saturate-[1.15]",
            )}
            aria-label="Close dialog"
            onClick={onClose}
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={msFadeScale.initial}
            animate={msFadeScale.animate}
            exit={msFadeScale.exit}
            transition={msTransition.medium}
            className={cn(
              "ms-modal-panel relative z-[1] flex w-full max-w-lg flex-col overflow-hidden rounded-ms-2xl border border-ms-border-strong",
              premium
                ? "ms-modal-panel--premium bg-transparent shadow-none"
                : "bg-ms-surface shadow-ms-float",
              panelClassName,
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-start justify-between gap-4 border-b border-ms-border",
                premium ? "ms-modal-header--premium px-0 py-0" : "px-6 py-5",
              )}
            >
              <div className="min-w-0 space-y-1">
                {premium ? <p className="ms-modal-wordmark">{wordmark}</p> : null}
                <h2
                  id={titleId}
                  className={cn(premium ? "ms-modal-title--premium" : "ms-headline text-ms-text")}
                >
                  {title}
                </h2>
                {description ? (
                  <p
                    className={cn(
                      premium ? "ms-modal-desc--premium" : "ms-intelligence-summary text-sm",
                    )}
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "ms-focus-ring flex size-9 shrink-0 items-center justify-center rounded-ms-md border border-ms-border text-ms-muted transition-colors hover:border-ms-border-mid hover:text-ms-text",
                  premium && "ms-modal-close--premium",
                )}
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            {children ? (
              <div className={cn(premium ? "ms-modal-body--premium" : "ms-modal-body px-6 py-5")}>
                {children}
              </div>
            ) : null}
            {footer ? (
              <div className={cn(premium ? "ms-modal-footer--premium" : "ms-modal-footer px-6 py-4")}>
                <div className="ms-modal-footer__actions">{footer}</div>
              </div>
            ) : null}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
