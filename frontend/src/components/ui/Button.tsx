import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "ghost" | "outline" | "primary" | "accent" | "gold";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  ghost: "btn-ghost",
  outline: "btn-outline",
  primary: "btn-primary",
  accent: "btn-accent",
  gold: "btn-gold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export default function Button({ variant = "ghost", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
