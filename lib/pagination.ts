/** Rows per page on the register boards. */
export const PAGE_SIZE = 25;

type Params = Record<string, string | string[] | undefined>;

/** Reads a single string value out of Next's `searchParams`. */
export function param(params: Params, key: string) {
  const value = params[key];
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.trim() !== "" ? text.trim() : undefined;
}

/**
 * Reads a numeric `searchParams` value that will end up in a query — a day
 * window, a month count, a row id.
 *
 * `Number()` alone is not enough on its own: it turns anything unparseable into
 * `NaN` and `"1e309"` into `Infinity`, and both travel happily through the app
 * until Postgres refuses them and the whole board 500s. Anything that is not a
 * real number inside the expected bounds falls back instead.
 */
export function numberParam(
  params: Params,
  key: string,
  fallback: number,
  { min = 1, max = Number.MAX_SAFE_INTEGER, integer = true } = {},
) {
  const raw = param(params, key);
  if (raw === undefined) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return fallback;
  return integer ? Math.floor(value) : value;
}

/**
 * Far past the end of any real board, but low enough that `page * pageSize`
 * stays a number Postgres will accept as an OFFSET. Without the ceiling a
 * `?page=1e308` in the address bar overflows the multiplication to `Infinity`
 * and the query fails outright.
 */
const MAX_PAGE = 100_000;

export function pageParam(params: Params) {
  const page = Number(param(params, "page") ?? 1);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), MAX_PAGE);
}

/**
 * The queries are asked for one row more than fits on the page: if it comes
 * back, there is a next page. That avoids a second `count(*)` per board.
 */
export function pageWindow(params: Params, pageSize = PAGE_SIZE) {
  const page = pageParam(params);
  return {
    page,
    pageSize,
    limit: pageSize + 1,
    offset: (page - 1) * pageSize,
  };
}

export function paginate<T>(
  rows: T[],
  { page, pageSize }: { page: number; pageSize: number },
) {
  const hasNext = rows.length > pageSize;
  const visible = hasNext ? rows.slice(0, pageSize) : rows;
  const from = visible.length === 0 ? 0 : (page - 1) * pageSize + 1;

  return {
    rows: visible,
    page,
    hasNext,
    hasPrevious: page > 1,
    /** "Showing 26–50" — the totals stay with the board's own KPIs. */
    range: visible.length === 0 ? "0" : `${from}–${from + visible.length - 1}`,
  };
}

/** Slices a list the data layer returns in full. */
export function paginateAll<T>(rows: T[], params: Params, pageSize = PAGE_SIZE) {
  const page = pageParam(params);
  const start = (page - 1) * pageSize;
  return paginate(rows.slice(start, start + pageSize + 1), { page, pageSize });
}
