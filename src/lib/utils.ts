import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Returns YYYY-MM-DD string in a timezone-safe manner
 */
export function getEventDateKey(dateVal: any): string {
  if (!dateVal) return "";
  const clean = String(dateVal).trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  try {
    const d = new Date(clean);
    if (isNaN(d.getTime())) return clean.split("T")[0];
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dt = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  } catch {
    return clean.split("T")[0];
  }
}

/**
 * Formats date consistently across SSR and client (e.g. "Aug 27, 2026")
 * Avoiding locale differences between server (Node) and browser.
 */
export function formatDisplayDate(dateVal?: string | null): string {
  if (!dateVal) return "DATE TBD";
  try {
    const clean = String(dateVal).trim();
    const match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTH_NAMES[monthIdx]} ${day}, ${year}`;
      }
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) return clean;
    return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  } catch {
    return String(dateVal);
  }
}

/**
 * Formats date with weekday consistently across SSR and client (e.g. "Thu, Aug 27, 2026")
 */
export function formatDisplayDateWithWeekday(dateVal?: string | null): string {
  if (!dateVal) return "";
  try {
    const clean = String(dateVal).trim();
    const match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        const utcDate = new Date(Date.UTC(year, monthIdx, day));
        const weekday = WEEKDAY_NAMES[utcDate.getUTCDay()];
        return `${weekday}, ${MONTH_NAMES[monthIdx]} ${day}, ${year}`;
      }
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) return clean;
    return `${WEEKDAY_NAMES[d.getUTCDay()]}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  } catch {
    return String(dateVal);
  }
}

/**
 * Generates a 6-digit numeric access code for Tatami moderators (e.g. "627472")
 */
export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

