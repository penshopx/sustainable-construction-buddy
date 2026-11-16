export function estimatePubReportDeadline(eventDate: string | Date, businessDays = 14): Date | null {
  const deadline = new Date(eventDate);
  if (!Number.isFinite(deadline.getTime()) || !Number.isInteger(businessDays) || businessDays < 0) return null;

  let remaining = businessDays;
  while (remaining > 0) {
    deadline.setDate(deadline.getDate() + 1);
    const day = deadline.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return deadline;
}
