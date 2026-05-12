import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
}

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  isRequired = false,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-color-foreground">
          {label}
          {isRequired && <span className="ml-1 text-color-destructive">*</span>}
        </label>
      )}

      {children}

      {error && <p className="text-xs font-medium text-color-destructive">{error}</p>}
      {helperText && !error && <p className="text-xs text-color-muted-foreground">{helperText}</p>}
    </div>
  );
}