"use client";

import { clsx } from "@/lib/clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  block?: boolean;
};

export function Button({
  variant = "primary",
  block = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand text-brand-fg shadow-lg shadow-brand/20",
        variant === "secondary" && "bg-surface-2 text-text",
        variant === "ghost" && "text-muted hover:text-text",
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-border bg-surface p-5",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={clsx(
        "rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95",
        active
          ? "border-brand bg-brand text-brand-fg"
          : "border-border bg-surface-2 text-text",
        className,
      )}
      {...props}
    />
  );
}
