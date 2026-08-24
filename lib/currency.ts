/**
 * The farm trades in Ghana cedis. Symbol and locale live here so a change of
 * currency is one edit rather than a hunt through every board, chart axis,
 * form prefix and CSV column.
 */

/** U+20B5. Written plain rather than as `GH₵` — in-country there is no other cedi to confuse it with. */
export const CURRENCY_SYMBOL = "₵";

/** Ghana groups and points exactly as en-US does; the locale is named for correctness. */
export const CURRENCY_LOCALE = "en-GH";

/** How the currency is named on the Settings board. */
export const CURRENCY_LABEL = "GHS (₵)";

/**
 * Clears the currency out of a typed amount, so "₵1,240.50", "GH₵ 1,240.50"
 * and "GHS 1240.50" all reach the parser as digits. Tolerant of the older
 * `GHC` spelling, and of `$` because that is what the older records were
 * entered with. A fresh regex each call — a shared one carrying the `g` flag
 * keeps `lastIndex` between callers.
 */
export function stripCurrency(value: string) {
  return value.replace(/GH[₵SC]|GHS|[₵$,\s]/gi, "");
}
