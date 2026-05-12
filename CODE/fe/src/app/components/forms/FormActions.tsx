import React from "react";
import { cn } from "@/lib/utils";

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end" | "between";
}

const alignStyles: Record<NonNullable<FormActionsProps["align"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between"
};

export function FormActions({ align = "end", className, ...props }: FormActionsProps) {
  return <div className={cn("flex flex-wrap items-center gap-2", alignStyles[align], className)} {...props} />;
}