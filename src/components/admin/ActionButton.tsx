"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../ui";

type Variant = "primary" | "danger" | "outline" | "subtle" | "ghost";

function Inner({ variant, children }: { variant: Variant; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      {children}
    </Button>
  );
}

export function ActionButton({
  action,
  fields,
  confirmMessage,
  children,
  variant = "danger",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  confirmMessage?: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Inner variant={variant}>{children}</Inner>
    </form>
  );
}
