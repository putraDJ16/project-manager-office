import React from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "primary" | "success" | "warning" | "destructive" | "secondary";
type BadgeVariant = "solid" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  variant?: BadgeVariant;
}

const colorStyles: Record<BadgeColor, Record<BadgeVariant, string>> = {
  primary: {
    solid: "bg-color-primary/15 text-color-primary",
    outline: "border border-color-primary/40 text-color-primary"
  },
  success: {
    solid: "bg-color-status-success-surface text-color-status-success",
    outline: "border border-color-status-success-border text-color-status-success"
  },
  warning: {
    solid: "bg-color-status-warning-surface text-color-status-warning",
    outline: "border border-color-status-warning-border text-color-status-warning"
  },
  destructive: {
    solid: "bg-color-destructive/15 text-color-destructive",
    outline: "border border-color-destructive/40 text-color-destructive"
  },
  secondary: {
    solid: "bg-color-secondary text-color-secondary-foreground",
    outline: "border border-color-border text-color-foreground"
  }
};

export function Badge({ color = "primary", variant = "solid", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        colorStyles[color][variant],
        className
      )}
      {...props}
    />
  );
}
