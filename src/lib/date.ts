export function normalizeDate(date: Date | string = new Date()) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate;
}

export function getDateRange(date: Date | string = new Date()) {
  const start = normalizeDate(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
