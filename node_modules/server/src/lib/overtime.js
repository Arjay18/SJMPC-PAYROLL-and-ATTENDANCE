function parseTimeToMinutes(t){
  // t: HH:MM
  if(!t) return null
  const [hh, mm] = String(t).split(':').map(Number)
  if(Number.isNaN(hh) || Number.isNaN(mm)) return null
  return hh*60 + mm
}

export function minutesDiffToHours(start, end){
  const a = parseTimeToMinutes(start)
  const b = parseTimeToMinutes(end)
  if(a == null || b == null) return 0
  const diff = b - a
  if(diff <= 0) return 0
  return diff / 60
}

export function computeOvertimeHours(rows, standardHoursPerDay = 8){
  // Simple MVP: overtime per day = max(0, workedHours - standardHoursPerDay)
  let overtime = 0
  for(const r of rows){
    if(r.status !== 'Present') continue
    const worked = minutesDiffToHours(r.check_in_time, r.check_out_time)
    const ot = Math.max(0, worked - standardHoursPerDay)
    overtime += ot
  }
  return overtime
}

