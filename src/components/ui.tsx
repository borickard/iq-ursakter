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
        "inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-border px-6 py-3.5 font-bold transition-[transform,box-shadow] duration-100 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand text-brand-fg shadow-raised",
        variant === "secondary" && "bg-surface text-text shadow-raised",
        variant === "ghost" && "border-transparent text-muted shadow-none hover:text-text active:translate-x-0 active:translate-y-0",
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
        "flex flex-col rounded-2xl border-2 border-border bg-surface p-5 shadow-soft",
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
        "rounded-full border-2 border-border px-4 py-2 text-sm font-semibold transition active:scale-95",
        active ? "bg-brand text-brand-fg shadow-[2px_2px_0_#0b0b0b]" : "bg-surface text-text",
        className,
      )}
      {...props}
    />
  );
}
