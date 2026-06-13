"use client";

import * as React from "react";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/** Stepper button (hoisted to module scope — not defined during render). */
function StepButton({
  disabled,
  onClick,
  icon: Icon,
}: {
  disabled: boolean;
  onClick: () => void;
  icon: typeof IconPlus;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={disabled}
      onClick={onClick}
      className="grid h-full w-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="size-4" />
    </button>
  );
}

export interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Allow decimal values (otherwise integers only). */
  decimals?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  /** Hide the +/- buttons (for tight spaces where the value must stay readable). */
  hideSteppers?: boolean;
  className?: string;
}

/**
 * Numeric input with stepper buttons. Avoids the quirks of `<input type=number>`
 * (scroll-to-change, "e"/"+", NaN-on-empty): it sanitizes keystrokes, clamps to
 * min/max on blur, and reports a real `number | undefined` to the caller.
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = false,
  placeholder,
  disabled,
  id,
  invalid,
  hideSteppers = false,
  className,
}: NumberInputProps) {
  const [text, setText] = React.useState(
    value === undefined || Number.isNaN(value) ? "" : String(value),
  );

  // Resync when the value changes from the outside (form reset, stepper) but not
  // mid-typing (when the parsed text already equals the value).
  React.useEffect(() => {
    const parsed = text.trim() === "" ? undefined : Number(text);
    if (parsed !== value) {
      // Intentional one-way sync of an external value into local text state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(value === undefined || Number.isNaN(value) ? "" : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const allowNeg = min === undefined || min < 0;

  const clamp = (n: number) => {
    let r = n;
    if (min !== undefined && r < min) r = min;
    if (max !== undefined && r > max) r = max;
    return r;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    const stripPattern = decimals
      ? allowNeg
        ? /[^0-9.-]/g
        : /[^0-9.]/g
      : allowNeg
        ? /[^0-9-]/g
        : /[^0-9]/g;
    raw = raw.replace(stripPattern, "");
    // Keep a single leading "-" and a single "."
    if (allowNeg) raw = raw.replace(/(?!^)-/g, "");
    if (decimals) {
      const i = raw.indexOf(".");
      if (i !== -1) raw = raw.slice(0, i + 1) + raw.slice(i + 1).replace(/\./g, "");
    }
    setText(raw);

    if (raw === "" || raw === "-" || raw === ".") {
      onChange(undefined);
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    if (text.trim() === "" || text === "-" || text === ".") {
      onChange(undefined);
      setText("");
      return;
    }
    const clamped = clamp(Number(text));
    onChange(clamped);
    setText(String(clamped));
  };

  const stepBy = (dir: 1 | -1) => {
    const base = value ?? 0;
    let next = clamp(base + dir * step);
    if (!decimals) next = Math.round(next);
    else next = Math.round(next * 100) / 100;
    onChange(next);
    setText(String(next));
  };

  const atMin = value !== undefined && min !== undefined && value <= min;
  const atMax = value !== undefined && max !== undefined && value >= max;

  return (
    <div
      className={cn(
        "flex h-10 items-center overflow-hidden rounded-lg border border-input bg-gray-50/50 shadow-xs transition-[color,box-shadow] dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
        invalid && "border-destructive focus-within:ring-destructive/20",
        disabled && "opacity-50",
        className,
      )}
    >
      {!hideSteppers && (
        <StepButton icon={IconMinus} disabled={!!disabled || atMin} onClick={() => stepBy(-1)} />
      )}
      <input
        id={id}
        type="text"
        inputMode={decimals ? "decimal" : "numeric"}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-full w-full min-w-0 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground md:text-sm",
          hideSteppers ? "text-left" : "border-x border-input text-center",
        )}
      />
      {!hideSteppers && (
        <StepButton icon={IconPlus} disabled={!!disabled || atMax} onClick={() => stepBy(1)} />
      )}
    </div>
  );
}
