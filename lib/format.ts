/** The boards render money in USD with thousands separators. */
export function money(amount: number, options: { compact?: boolean } = {}) {
  if (options.compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${Math.round(amount / 1_000)}k`;
    }
  }
  return `$${amount.toLocaleString("en-US")}`;
}

export function count(value: number) {
  return value.toLocaleString("en-US");
}

export function percent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`;
}

export function signedPercent(value: number, fractionDigits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(fractionDigits)}%`;
}
