export function subtractHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000)
}

export function toIsoString(date: Date): string {
  return date.toISOString()
}