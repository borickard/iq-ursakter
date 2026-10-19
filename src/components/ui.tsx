"use client";

import { clsx } from "@/lib/clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  block?: boolean;
};

/**
 * IQ-knapp: raka hörn, 1px svart kontur, ingen skugga. Primär är fylld gul,
 * sekundär är transparent kontur. Båda inverteras till vit bakgrund vid hover
 * (IQ:s grepp). Kort tryckeffekt (transform, 0.1s). Fokus via global :focus-visible.
 */
export function Button({
  variant = "primary",
  block = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-none border border-border px-7 py-3.5 font-medium transition duration-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand text-brand-fg hover:bg-white hover:text-black",
        variant === "secondary" && "bg-transparent text-text hover:bg-white hover:text-black",
        variant === "ghost" &&
          "border-transparent text-muted underline-offset-4 hover:text-text hover:underline active:translate-y-0",
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
        "flex flex-col rounded-none border border-border bg-surface p-5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * IQ-tagg: pillerform (det enda stället rundning tillåts förutom telefonen),
 * 1px kontur. Valt chip är fyllt gult. Ingen skugga.
 */
export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={clsx(
        "rounded-full border border-border px-4 py-2 text-sm font-medium transition active:scale-95",
        active ? "bg-brand text-brand-fg" : "bg-transparent text-text hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}
