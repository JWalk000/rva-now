import type { EventSubmission } from '@/types/event';

export function getSubmissionStatusLabel(sub: EventSubmission): string {
  if (sub.status === 'rejected') return 'Not approved';
  if (sub.publishedSlug || sub.status === 'approved') return 'Live on Discover';

  if (sub.tier === 'featured' || sub.tier === 'subscription') {
    if (sub.paymentStatus === 'pending') return 'Awaiting payment';
    if (sub.paymentStatus === 'paid') return 'Paid — publishing';
    if (sub.paymentStatus !== 'paid' && sub.paymentStatus !== 'waived') return 'Payment required';
  }

  return 'In review';
}

export function getSubmissionStatusDetail(sub: EventSubmission): string {
  const parts = [sub.neighborhood, sub.tier];
  if (sub.paymentStatus && sub.paymentStatus !== 'unpaid') {
    parts.push(`payment: ${sub.paymentStatus}`);
  }
  return parts.join(' · ');
}
