import React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonColor = "primary" | "secondary" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  solid: "",
  outline: "border bg-transparent",
  ghost: "bg-transparent shadow-none"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-lg"
};

const colorStyles: Record<ButtonColor, Record<ButtonVariant, string>> = {
  primary: {
    solid: "bg-color-primary text-color-primary-foreground hover:opacity-90",
    outline: "border-color-primary text-color-primary hover:bg-color-primary hover:text-color-primary-foreground",
    ghost: "text-color-primary hover:bg-color-primary/10"
  },
  secondary: {
    solid: "bg-color-secondary text-color-secondary-foreground hover:brightness-95",
    outline: "border-color-border text-color-foreground hover:bg-color-secondary",
    ghost: "text-color-foreground hover:bg-color-secondary"
  },
  destructive: {
    solid: "bg-color-destructive text-color-destructive-foreground hover:opacity-90",
    outline:
      "border-color-destructive text-color-destructive hover:bg-color-destructive hover:text-color-destructive-foreground",
    ghost: "text-color-destructive hover:bg-color-destructive/10"
  }
};

export function Button({
  variant = "solid",
  size = "md",
  color = "primary",
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        colorStyles[color][variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}