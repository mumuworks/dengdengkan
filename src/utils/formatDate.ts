/**
 * Formats a stored ISO 8601 date for display, following the user's browser
 * Locale/Time Zone (Developer Handoff §4: "所有日期使用絕對時間儲存；顯示時依使用者
 * Locale／Time Zone 格式化"). No locale is hard-coded here.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}
