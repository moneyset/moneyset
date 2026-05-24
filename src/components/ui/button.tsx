import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ms-md text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-cognition/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-ms-border bg-ms-surface text-ms-text hover:border-ms-border-mid hover:bg-ms-elevated",
        ghost: "text-ms-muted hover:bg-ms-elevated/80 hover:text-ms-text",
        cognition:
          "border border-ms-cognition/40 bg-ms-cognition-dim text-ms-cognition hover:border-ms-cognition/55",
        flow: "border border-ms-flow/40 bg-ms-flow-dim text-ms-flow hover:border-ms-flow/55",
        danger: "border border-ms-danger/40 bg-ms-danger-dim text-ms-danger hover:border-ms-danger/55",
        consensus:
          "border border-ms-consensus/40 bg-ms-consensus-dim text-ms-consensus hover:border-ms-consensus/55",
        outline:
          "border border-ms-border-strong bg-transparent text-ms-text hover:bg-ms-elevated/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-ms-md px-3 text-xs",
        lg: "h-10 rounded-ms-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
