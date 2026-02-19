import { msg } from "@lingui/core/macro";
import { i18n } from "@/src/i18n";

export function formatDayLabel(timestamp: number): string {
  let date = new Date(timestamp);
  let now = new Date();
  let diffMs = now.getTime() - date.getTime();
  let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return i18n._(msg`Today`);
  }
  if (diffDays === 1) {
    return i18n._(msg`Yesterday`);
  }
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function isSameDay(a: number, b: number): boolean {
  let dateA = new Date(a);
  let dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
