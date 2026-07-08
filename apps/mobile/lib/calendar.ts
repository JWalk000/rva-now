import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import type { RvaEvent } from '@/types/event';

async function getDefaultCalendarId() {
  if (Platform.OS === 'ios') {
    const defaultCal = await Calendar.getDefaultCalendarAsync();
    return defaultCal.id;
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.find((c) => c.allowsModifications)?.id ?? calendars[0]?.id;
}

export async function addEventToCalendar(event: RvaEvent) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') throw new Error('Calendar permission denied');

  const calendarId = await getDefaultCalendarId();
  if (!calendarId) throw new Error('No writable calendar found');

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  await Calendar.createEventAsync(calendarId, {
    title: event.title,
    location: `${event.venue}, ${event.neighborhood}, Richmond VA`,
    notes: event.description,
    startDate: start,
    endDate: end,
    timeZone: 'America/New_York',
    url: event.ticketUrl ?? event.sourceUrl ?? undefined,
  });
}
