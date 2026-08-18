// Date & Time arithmetic utilities for 24Library

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getCurrentTimestampString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}`;
  } catch {
    return dateStr;
  }
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(num => parseInt(num, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

export function getDaysRemaining(endDateStr: string): number {
  const today = getTodayString();
  const [ty, tm, td] = today.split('-').map(n => parseInt(n, 10));
  const [ey, em, ed] = endDateStr.split('-').map(n => parseInt(n, 10));
  
  const todayDate = new Date(ty, tm - 1, td);
  const endDate = new Date(ey, em - 1, ed);
  
  const diffTime = endDate.getTime() - todayDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateRenewalDates(currentEndDateStr: string, planDurationDays: number): { startDate: string; endDate: string } {
  const today = getTodayString();
  const daysRemaining = getDaysRemaining(currentEndDateStr);
  
  if (daysRemaining >= 0) {
    // Member is currently active or expiring soon: extend seamlessly from current expiry date
    const nextStart = addDays(currentEndDateStr, 1);
    const nextEnd = addDays(currentEndDateStr, planDurationDays);
    return { startDate: nextStart, endDate: nextEnd };
  } else {
    // Member is already expired: renewal starts effective today
    const nextStart = today;
    const nextEnd = addDays(today, planDurationDays);
    return { startDate: nextStart, endDate: nextEnd };
  }
}

export function parseMinutesFromMidnight(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

export function isTimeInShift(currentTimeStr: string, shiftStart: string, shiftEnd: string, graceMinutes = 15): boolean {
  const currentMin = parseMinutesFromMidnight(currentTimeStr);
  let startMin = parseMinutesFromMidnight(shiftStart) - graceMinutes;
  let endMin = parseMinutesFromMidnight(shiftEnd) + graceMinutes;

  // Handle overnight shift (e.g. 22:00 to 06:00)
  if (parseMinutesFromMidnight(shiftEnd) <= parseMinutesFromMidnight(shiftStart)) {
    // Overnight: active if after (start - grace) OR before (end + grace)
    if (startMin < 0) startMin += 1440;
    return currentMin >= startMin || currentMin <= endMin;
  }

  if (startMin < 0) startMin = 0;
  return currentMin >= startMin && currentMin <= endMin;
}

export function doDateRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA <= endB && endA >= startB;
}
