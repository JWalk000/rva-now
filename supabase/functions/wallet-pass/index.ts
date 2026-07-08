import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function pemFromEnv(name: string): string | null {
  const raw = Deno.env.get(name);
  if (!raw) return null;
  return raw.includes('BEGIN') ? raw : atob(raw);
}

async function buildPkPass(ticket: {
  ticket_code: string;
  event_title: string;
  ticket_type_name: string;
  venue: string;
  event_day: string;
  event_time: string;
}): Promise<Uint8Array | null> {
  const passTypeId = Deno.env.get('APPLE_PASS_TYPE_ID');
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const certPem = pemFromEnv('APPLE_PASS_CERT_PEM');
  const keyPem = pemFromEnv('APPLE_PASS_KEY_PEM');

  if (!passTypeId || !teamId || !certPem || !keyPem) return null;

  try {
    const { Buffer } = await import('node:buffer');
    const { PKPass } = await import('https://esm.sh/passkit-generator@3.1.3');
    const pass = await PKPass.from(
      {
        model: {
          'pass.json': Buffer.from(
            JSON.stringify({
              formatVersion: 1,
              passTypeIdentifier: passTypeId,
              teamIdentifier: teamId,
              organizationName: 'RVA Now',
              description: ticket.event_title,
              logoText: 'RVA Now',
              foregroundColor: 'rgb(26, 26, 26)',
              backgroundColor: 'rgb(247, 244, 238)',
              labelColor: 'rgb(196, 93, 62)',
              eventTicket: {
                primaryFields: [{ key: 'event', label: 'EVENT', value: ticket.event_title }],
                secondaryFields: [
                  { key: 'type', label: 'TICKET', value: ticket.ticket_type_name },
                  { key: 'when', label: 'WHEN', value: `${ticket.event_day} ${ticket.event_time}` },
                ],
                auxiliaryFields: [{ key: 'venue', label: 'VENUE', value: ticket.venue }],
                backFields: [
                  { key: 'code', label: 'Ticket code', value: ticket.ticket_code },
                  { key: 'help', label: 'Entry', value: 'Show this pass or your email QR at the door.' },
                ],
              },
              barcodes: [
                {
                  format: 'PKBarcodeFormatQR',
                  message: ticket.ticket_code,
                  messageEncoding: 'iso-8859-1',
                },
              ],
            }),
          ),
        },
        certificates: {
          wwdr: pemFromEnv('APPLE_WWDR_PEM') ?? '',
          signerCert: certPem,
          signerKey: keyPem,
          signerKeyPassphrase: Deno.env.get('APPLE_PASS_KEY_PASSPHRASE') ?? '',
        },
      },
      { serialNumber: ticket.ticket_code },
    );

    return pass.getAsBuffer();
  } catch (error) {
    console.error('wallet pass generation failed', error);
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response(JSON.stringify({ error: 'code required' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_code', code)
      .eq('status', 'valid')
      .single();

    if (error || !ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404, headers: corsHeaders });
    }

    const pkpass = await buildPkPass(ticket);
    if (pkpass) {
      return new Response(pkpass, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="${ticket.ticket_code}.pkpass"`,
        },
      });
    }

    return new Response(
      JSON.stringify({
        wallet_configured: false,
        ticket_code: ticket.ticket_code,
        event_title: ticket.event_title,
        message: 'Apple Wallet signing is not configured yet. Use the QR code from your email or open the ticket in the RVA Now app.',
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(ticket.ticket_code)}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Wallet pass failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
