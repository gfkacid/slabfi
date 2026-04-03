import { useId } from "react";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  onMaxClick?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  decimals?: number;
  symbol?: string;
}

export function AmountInput({
  value,
  onChange,
  max,
  onMaxClick,
  label = "Amount",
  placeholder = "0.00",
  disabled = false,
  symbol = "USDC",
}: AmountInputProps) {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d*$/.test(v)) {
      onChange(v);
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex rounded-lg border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full rounded-l-lg border-0 py-2 pl-4 pr-2 text-gray-900 placeholder-gray-400 focus:ring-0 sm:text-sm"
        />
        <div className="flex items-center gap-1 border-l border-gray-200 pl-2 pr-3">
          {onMaxClick && max !== undefined && (
            <button
              type="button"
              onClick={onMaxClick}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              MAX
            </button>
          )}
          <span className="text-sm text-gray-500">{symbol}</span>
        </div>
      </div>
    </div>
  );
}
