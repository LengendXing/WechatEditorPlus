import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[12px] font-semibold text-fg-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-surface-tertiary border border-border-secondary rounded-[8px] px-3.5 py-2.5 text-[13px] text-fg-primary placeholder:text-fg-muted outline-none transition-colors duration-150 focus:border-accent ${error ? "border-error" : ""} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-[11px] text-error">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
