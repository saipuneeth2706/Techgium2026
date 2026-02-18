import { twMerge } from "tailwind-merge";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-[#E50914] text-white hover:bg-[#b00710] focus:ring-[#E50914]",
    secondary: "bg-white/10 text-white hover:bg-white/20 focus:ring-white",
    outline:
      "border border-white/50 text-white hover:bg-white/10 focus:ring-white",
    ghost: "text-white hover:bg-white/10 focus:ring-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };

  return (
    <button
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
