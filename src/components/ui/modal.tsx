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
};

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          className="ms-modal-overlay fixed inset-0 z-[var(--ms-z-modal,100)] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={msTransition.fast}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ms-overlay backdrop-blur-md"
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
              "ms-modal-panel relative z-[1] w-full max-w-lg overflow-hidden rounded-ms-2xl border border-ms-border-strong",
              "bg-ms-surface shadow-ms-float",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ms-border px-6 py-5">
              <div className="min-w-0 space-y-1">
                <h2 id={titleId} className="ms-headline text-ms-text">
                  {title}
                </h2>
                {description ? <p className="ms-intelligence-summary text-sm">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ms-focus-ring flex size-9 shrink-0 items-center justify-center rounded-ms-md border border-ms-border text-ms-muted transition-colors hover:border-ms-border-mid hover:text-ms-text"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            {children ? <div className="ms-modal-body px-6 py-5">{children}</div> : null}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
