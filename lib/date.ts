/**
 * Calendar dates are stored as `date` columns and compared against dates the
 * person on the farm sees, so every `YYYY-MM-DD` the app produces has to be
 * derived from local time. `toISOString()` converts to UTC first, which lands
 * on tomorrow's date every evening west of Greenwich — and `pastOrTodayDate`
 * then rejects the value as being in the future.
 */
export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's calendar date in local time. */
export function todayIso() {
  return toIsoDate(new Date());
}

/** The calendar date `offset` days before today, in local time. */
export function isoDaysAgo(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return toIsoDate(date);
}

/** `YYYY-MM-DDTHH:MM` for `<input type="datetime-local">`, in local time. */
export function nowDateTimeLocal() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${toIsoDate(now)}T${hours}:${minutes}`;
}
