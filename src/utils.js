export function fmtTime(t) {
  if (!t) return ''
  // If already has AM/PM, fix military-style like "19:00 PM"
  if (t.includes('AM') || t.includes('PM')) {
    return t.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/i, (_, h, m, ap) => {
      let hour = parseInt(h)
      const period = ap.toUpperCase()
      if (period === 'PM' && hour > 12) hour -= 12
      if (period === 'AM' && hour === 0) hour = 12
      return `${hour}:${m} ${period}`
    })
  }
  // Convert 24h to 12h
  const match = t.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return t
  let h = parseInt(match[1]), min = match[2]
  const ap = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${min} ${ap}`
}
