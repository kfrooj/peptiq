type FrequencyType = 'daily' | 'every_n_days' | 'weekly'

export type InjectionPlan = {
  id: string
  user_id: string
  peptide_name?: string | null
  dose?: string | null
  is_active: boolean
  reminders_enabled: boolean
  reminder_offset_hours: number
  start_date: string
  end_date?: string | null
  frequency_type: FrequencyType
  frequency_interval?: number | null
  days_of_week?: number[] | null
  time_of_day: string // "09:00:00"
}

function combineDateAndTime(date: Date, timeOfDay: string): Date {
  const [hours, minutes, seconds] = timeOfDay.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hours || 0, minutes || 0, seconds || 0, 0)
  return d
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime()
}

function sameOrAfter(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime()
}

export function generateOccurrences(
  plan: InjectionPlan,
  windowStart: Date,
  windowEnd: Date
): Date[] {
  if (!plan.is_active || !plan.reminders_enabled) return []

  const planStart = startOfDay(new Date(plan.start_date))
  const planEnd = plan.end_date ? startOfDay(new Date(plan.end_date)) : null

  const effectiveStart = sameOrAfter(windowStart, planStart) ? windowStart : planStart
  const occurrences: Date[] = []

  if (planEnd && planEnd.getTime() < windowStart.getTime()) {
    return []
  }

  if (plan.frequency_type === 'daily') {
    let cursor = startOfDay(effectiveStart)

    while (sameOrBefore(cursor, windowEnd)) {
      const occurrence = combineDateAndTime(cursor, plan.time_of_day)

      if (
        sameOrAfter(occurrence, windowStart) &&
        sameOrBefore(occurrence, windowEnd) &&
        sameOrAfter(startOfDay(occurrence), planStart) &&
        (!planEnd || sameOrBefore(startOfDay(occurrence), planEnd))
      ) {
        occurrences.push(occurrence)
      }

      cursor = addDays(cursor, 1)
    }
  }

  if (plan.frequency_type === 'every_n_days') {
    const interval = Math.max(1, plan.frequency_interval || 1)
    let cursor = planStart

    while (sameOrBefore(cursor, windowEnd)) {
      const occurrence = combineDateAndTime(cursor, plan.time_of_day)

      if (
        sameOrAfter(occurrence, windowStart) &&
        sameOrBefore(occurrence, windowEnd) &&
        (!planEnd || sameOrBefore(startOfDay(occurrence), planEnd))
      ) {
        occurrences.push(occurrence)
      }

      cursor = addDays(cursor, interval)
    }
  }

  if (plan.frequency_type === 'weekly') {
    const allowedDays = new Set(plan.days_of_week || [])
    if (allowedDays.size === 0) return []

    let cursor = startOfDay(effectiveStart)

    while (sameOrBefore(cursor, windowEnd)) {
      const day = cursor.getDay()

      if (allowedDays.has(day)) {
        const occurrence = combineDateAndTime(cursor, plan.time_of_day)

        if (
          sameOrAfter(occurrence, windowStart) &&
          sameOrBefore(occurrence, windowEnd) &&
          sameOrAfter(startOfDay(occurrence), planStart) &&
          (!planEnd || sameOrBefore(startOfDay(occurrence), planEnd))
        ) {
          occurrences.push(occurrence)
        }
      }

      cursor = addDays(cursor, 1)
    }
  }

  return occurrences
}