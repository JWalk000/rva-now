import { formatUsd } from './ticketFees.ts';

type TicketRow = {
  ticket_code: string;
  ticket_type_name: string;
  event_title: string;
  venue: string;
  event_day: string;
  event_time: string;
};

export function buildTicketEmailHtml(
  tickets: TicketRow[],
  walletBaseUrl: string,
  appBaseUrl: string,
): string {
  const ticketBlocks = tickets
    .map(
      (t) => `
      <div style="border:1px solid #e8e4dc;border-radius:12px;padding:16px;margin:16px 0;background:#fff;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b6560;text-transform:uppercase;letter-spacing:0.05em;">${t.ticket_type_name}</p>
        <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">${t.event_title}</h2>
        <p style="margin:0 0 12px;color:#4a4540;">${t.event_day} · ${t.event_time} · ${t.venue}</p>
        <p style="margin:0 0 12px;font-family:monospace;font-size:16px;color:#c45d3e;">${t.ticket_code}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(t.ticket_code)}" alt="QR code" width="180" height="180" />
        <p style="margin:12px 0 0;">
          <a href="${walletBaseUrl}?code=${encodeURIComponent(t.ticket_code)}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;margin-right:8px;">Add to Apple Wallet</a>
          <a href="${appBaseUrl}/ticket/${encodeURIComponent(t.ticket_code)}" style="display:inline-block;color:#c45d3e;font-weight:700;">View in app</a>
        </p>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f7f4ee;padding:24px;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;">
      <h1 style="font-size:24px;margin:0 0 8px;">Your RVA Now tickets</h1>
      <p style="color:#4a4540;margin:0 0 20px;">Show the QR code at the door or add tickets to Apple Wallet.</p>
      ${ticketBlocks}
      <p style="font-size:13px;color:#6b6560;">Questions? Reply to this email or contact the event organizer.</p>
    </div>
  </body></html>`;
}

export async function sendTicketEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('TICKET_FROM_EMAIL') ?? Deno.env.get('DIGEST_FROM_EMAIL') ?? 'tickets@rva-now.local';

  if (!resendKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { ok: false, error: json.message ?? `Resend error ${res.status}` };
  }

  return { ok: true };
}

export function ticketEmailSubject(eventTitle: string, count: number): string {
  return `Your ticket${count > 1 ? 's' : ''} for ${eventTitle}`;
}
