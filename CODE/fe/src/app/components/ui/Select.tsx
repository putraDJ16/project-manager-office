import React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({
  label,
  error,
  placeholder = "Select an option",
  value,
  onValueChange,
  children,
  disabled
}: SelectProps) {
  const triggerId = React.useId();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={triggerId} className="mb-1 block text-sm font-medium text-color-foreground">
          {label}
        </label>
      )}

      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={triggerId}
          className={cn(
            "inline-flex w-full items-center justify-between rounded-md border border-color-input bg-color-background px-3 py-2 text-sm text-color-foreground",
            "focus:outline-none focus:ring-2 focus:ring-color-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-color-destructive"
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="ml-2">
            <ChevronDown className="h-4 w-4" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 overflow-hidden rounded-md border border-color-border bg-color-popover text-color-popover-foreground shadow-md"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error && <p className="mt-1 text-xs font-medium text-color-destructive">{error}</p>}
    </div>
  );
}

export interface SelectItemProps extends RadixSelect.SelectItemProps {
  children: React.ReactNode;
}

export function SelectItem({ children, className, ...props }: SelectItemProps) {
  return (
    <RadixSelect.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded px-8 py-2 text-sm outline-none",
        "focus:bg-color-secondary focus:text-color-secondary-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}