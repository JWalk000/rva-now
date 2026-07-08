import type { SourcePlatform } from '@/types/event';

export const platformLabels: Record<SourcePlatform, string> = {
  manual: 'RVA Now',
  posh: 'Posh',
  eventbrite: 'Eventbrite',
  submission: 'Submission',
};

export function getTicketLabel(platform: SourcePlatform) {
  if (platform === 'posh') return 'Get tickets on Posh';
  if (platform === 'eventbrite') return 'Get tickets on Eventbrite';
  return 'Get tickets';
}

export function getSourceLabel(platform: SourcePlatform) {
  if (platform === 'posh') return 'View on Posh';
  if (platform === 'eventbrite') return 'View on Eventbrite';
  return 'View listing';
}
