import { Share } from 'react-native';

import type { RvaEvent } from '@/types/event';

export function eventDeepLink(eventId: string) {
  return `rvanow://event/${eventId}`;
}

export async function shareEvent(event: RvaEvent) {
  const deepLink = eventDeepLink(event.id);
  const ticketLink = event.ticketUrl ?? event.sourceUrl;
  const message = [
    `${event.title}`,
    `${event.day} · ${event.time} · ${event.neighborhood}`,
    `${event.venue} · ${event.price}`,
    '',
    event.description,
    `\nOpen in RVA Now: ${deepLink}`,
    ticketLink ? `Tickets: ${ticketLink}` : '',
  ].join('\n');

  await Share.share({ message, title: event.title, url: deepLink });
}
