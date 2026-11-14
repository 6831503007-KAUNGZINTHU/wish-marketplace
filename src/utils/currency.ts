export const CURRENCY_SYMBOL = '฿';
export const CURRENCY_CODE = 'THB';
export const CURRENCY_LABEL = 'Thai Baht (฿)';

/**
 * Formats a numerical amount into Thai Baht representation.
 * Automatically adds commas (e.g., ฿26,500) and displays decimals if present or requested.
 */
export function formatBaht(
  amount: number | string | undefined | null,
  options?: { showDecimals?: boolean; includeSymbol?: boolean }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return options?.includeSymbol === false ? '0' : '฿0';

  const showDecimals = options?.showDecimals ?? (num % 1 !== 0);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return options?.includeSymbol === false ? formatted : `฿${formatted}`;
}
