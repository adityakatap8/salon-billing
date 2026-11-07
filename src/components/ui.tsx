"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
}) {
  return (
    <button className={twMerge(clsx("btn", variant, className))} {...props} />
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const t = useTranslations();
  return (
    <DialogPrimitive.Root open onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={`dialog ${wide ? "wide" : ""}`}
        >
          <div className="dialog-head">
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" aria-label={t("close")}>
                <X size={20} />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Stepper({
  value,
  onChange,
  max = 999,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  min?: number;
}) {
  const t = useTranslations();
  return (
    <div className="stepper">
      <button
        aria-label={`${t("remove")} ${t("quantity")}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={15} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        aria-label={`${t("addProduct")} ${t("quantity")}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <span>✧</span>
      <p>{text}</p>
    </div>
  );
}
