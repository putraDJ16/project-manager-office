import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
}

export function Input({ label, error, helperText, leadingIcon, className, id, ...props }: InputProps) {
  const inputId = id ?? React.useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-color-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-color-muted-foreground">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-md border border-color-input bg-color-background px-3 py-2 text-sm text-color-foreground transition-colors",
            "placeholder:text-color-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-color-ring focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            leadingIcon && "pl-9",
            error && "border-color-destructive focus:ring-color-destructive",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          {...props}
        />
      </div>

      {error && <p className="mt-1 text-xs font-medium text-color-destructive">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-color-muted-foreground">{helperText}</p>}
    </div>
  );
}