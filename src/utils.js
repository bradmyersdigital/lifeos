export function fmtTime(t) {
  if (!t) return ''
  if (t.includes('AM') || t.includes('PM')) {
    return t.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/i, (_, h, m, ap) => {
      let hour = parseInt(h)
      const period = ap.toUpperCase()
      if (period === 'PM' && hour > 12) hour -= 12
      if (period === 'AM' && hour === 0) hour = 12
      return `${hour}:${m} ${period}`
    })
  }
  const match = t.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return t
  let h = parseInt(match[1]), min = match[2]
  const ap = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${min} ${ap}`
}

// Check if a recurring event falls on a given date
export function eventOccursOn(event, dateStr) {
  if (!event.recurring || event.recurring === '') {
    return event.start_date === dateStr
  }
  const eventDate = new Date(event.start_date + 'T00:00:00')
  const checkDate = new Date(dateStr + 'T00:00:00')
  if (checkDate < eventDate) return false

  const diffDays = Math.round((checkDate - eventDate) / (1000 * 60 * 60 * 24))

  if (event.recurring === 'weekly') {
    // Check same day of week
    const scheduledDays = event.recurring_days ? event.recurring_days : [eventDate.getDay()]
    return scheduledDays.includes(checkDate.getDay()) && diffDays % 7 === 0 || (
      scheduledDays.includes(checkDate.getDay()) && diffDays >= 0
    )
  }
  if (event.recurring === 'biweekly') {
    return eventDate.getDay() === checkDate.getDay() && diffDays % 14 === 0
  }
  if (event.recurring === 'monthly') {
    const dayOfMonth = event.recurring_day_of_month || eventDate.getDate()
    return checkDate.getDate() === dayOfMonth
  }
  if (event.recurring === 'yearly') {
    return eventDate.getMonth() === checkDate.getMonth() && eventDate.getDate() === checkDate.getDate()
  }
  return event.start_date === dateStr
}
