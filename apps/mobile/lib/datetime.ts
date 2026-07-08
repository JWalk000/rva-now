export function formatSubmissionDateTime(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export function defaultEventDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(19, 0, 0, 0);
  return date;
}
