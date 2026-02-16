import type { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes, TextareaHTMLAttributes } from "react";

// ---- Badge ----
type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-primary-light text-primary border-primary-muted/40",
  success: "bg-success-light text-success border-success/20",
  warning: "bg-warning-light text-yellow-800 border-warning/20",
  danger: "bg-danger-light text-danger border-danger/20",
  outline: "bg-transparent text-muted-foreground border-border",
};

export function Badge({
  variant = "default",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${badgeVariants[variant]} ${className}`}
      {...props}
    />
  );
}

// ---- Button ----
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-warm active:scale-[0.98]",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-warm active:scale-[0.98]",
  outline: "border border-border bg-card hover:bg-muted text-foreground active:scale-[0.98]",
  ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-warm active:scale-[0.98]",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    />
  );
}

// ---- Input ----
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-11 w-full rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// ---- Textarea ----
export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`flex w-full rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 resize-none ${className}`}
      {...props}
    />
  );
}

// ---- Card ----
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-card shadow-warm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pb-2 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold text-foreground font-display ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`} {...props} />;
}

// ---- Spinner ----
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
    </div>
  );
}

// ---- Empty state ----
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <svg className="h-7 w-7 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v8.25" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-foreground font-display">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{description}</p>}
    </div>
  );
}

// ---- Flag badge ----
const flagConfig: Record<string, { variant: BadgeVariant; label: string; dot: string }> = {
  green: { variant: "success", label: "Stable", dot: "bg-success" },
  yellow: { variant: "warning", label: "Monitor", dot: "bg-warning" },
  red: { variant: "danger", label: "Alert", dot: "bg-danger" },
};

export function FlagBadge({ flag }: { flag: string | null | undefined }) {
  const f = flag ?? "green";
  const config = flagConfig[f] ?? flagConfig.green!;
  return (
    <Badge variant={config!.variant}>
      <span className={`w-1.5 h-1.5 rounded-full ${config!.dot} mr-1.5`} />
      {config!.label}
    </Badge>
  );
}

// ---- Tier badge ----
const tierConfig: Record<string, { variant: BadgeVariant; icon: string }> = {
  immediate: { variant: "danger", icon: "!!" },
  urgent: { variant: "warning", icon: "!" },
  routine: { variant: "outline", icon: "" },
};

export function TierBadge({ tier }: { tier: string }) {
  const config = tierConfig[tier] ?? tierConfig.routine!;
  return (
    <Badge variant={config!.variant}>
      {config!.icon && <span className="font-bold mr-0.5">{config!.icon}</span>}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  );
}
