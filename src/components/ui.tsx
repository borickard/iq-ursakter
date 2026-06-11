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
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-brand text-brand-fg shadow-raised hover:brightness-105",
        variant === "secondary" &&
          "border border-border bg-surface text-text shadow-soft hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:text-brand",
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
        "flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-soft",
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
          ? "border-brand bg-brand text-brand-fg shadow-raised"
          : "border-border bg-surface text-text shadow-soft hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}
