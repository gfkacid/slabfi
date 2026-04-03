import { ReactNode } from "react";

interface TransactionButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}

const VARIANTS = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

export function TransactionButton({
  onClick,
  isLoading = false,
  disabled = false,
  children,
  variant = "primary",
  className = "",
}: TransactionButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const variantClass = VARIANTS[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${variantClass} ${className}`}
    >
      {isLoading ? (
        <>
          <svg
            className="-ml-1 mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing…
        </>
      ) : (
        children
      )}
    </button>
  );
}
