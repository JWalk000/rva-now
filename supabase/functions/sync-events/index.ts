import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { findDuplicate, type ExistingEvent } from '../_shared/dedupe.ts';
import { fetchEventbriteEvents } from '../_shared/eventbrite.ts';
import { fetchPoshEvents } from '../_shared/posh.ts';
import type { NormalizedIngestEvent } from '../_shared/eventbrite.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

const PROTECTED_PLATFORMS = new Set(['submission', 'manual']);

type SyncStats = {
  inserted: number;
  updated: number;
  skipped_duplicates: number;
  skipped_protected: number;
  errors: string[];
};

function isProtected(event: { source_platform: string }) {
  return PROTECTED_PLATFORMS.has(event.source_platform);
}

async function loadExistingEvents(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('events')
    .select('id, slug, title, venue, day_label, source_platform, external_id, dedupe_key, starts_at');

  if (error) throw error;
  return (data ?? []) as ExistingEvent[];
}

async function upsertWithDedupe(
  supabase: ReturnType<typeof createClient>,
  incoming: NormalizedIngestEvent[],
  existing: ExistingEvent[],
  stats: SyncStats,
) {
  for (const event of incoming) {
    try {
      const duplicate = findDuplicate(existing, event);

      if (duplicate) {
        if (isProtected(duplicate.match)) {
          stats.skipped_protected += 1;
          continue;
        }

        stats.skipped_duplicates += 1;
        await supabase.from('duplicate_events').insert({
          incoming_title: event.title,
          incoming_venue: event.venue,
          incoming_platform: event.source_platform,
          incoming_external_id: event.external_id,
          incoming_source_url: event.source_url,
          matched_event_id: duplicate.match.id,
          match_reason: duplicate.reason,
        });
        continue;
      }

      const existingBySlug = existing.find((row) => row.slug === event.slug);
      if (existingBySlug && isProtected(existingBySlug)) {
        stats.skipped_protected += 1;
        continue;
      }

      const { data, error } = await supabase
        .from('events')
        .upsert(
          {
            slug: event.slug,
            title: event.title,
            neighborhood: event.neighborhood,
            vibes: event.vibes,
            day_label: event.day_label,
            time_label: event.time_label,
            venue: event.venue,
            price: event.price,
            description: event.description,
            lat: event.lat,
            lng: event.lng,
            time_windows: event.time_windows,
            source: event.source,
            source_type: event.source_type,
            source_platform: event.source_platform,
            external_id: event.external_id,
            source_url: event.source_url,
            ticket_url: event.ticket_url,
            starts_at: event.starts_at,
            dedupe_key: event.dedupe_key,
            hidden_gem: event.hidden_gem,
            trending_score: event.trending_score,
            status: 'published',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' },
        )
        .select('id, slug, title, venue, day_label, source_platform, external_id, dedupe_key, starts_at')
        .single();

      if (error) throw error;

      const isNew = !existing.some((row) => row.slug === event.slug);
      if (isNew) {
        stats.inserted += 1;
        existing.push(data as ExistingEvent);
      } else {
        stats.updated += 1;
      }
    } catch (error) {
      stats.errors.push(`${event.slug}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const syncSecret = Deno.env.get('SYNC_SECRET');
    const providedSecret = request.headers.get('x-sync-secret');
    if (syncSecret && providedSecret !== syncSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const existing = await loadExistingEvents(supabase);
    const eventbriteStats: SyncStats = {
      inserted: 0,
      updated: 0,
      skipped_duplicates: 0,
      skipped_protected: 0,
      errors: [],
    };
    const poshStats: SyncStats = {
      inserted: 0,
      updated: 0,
      skipped_duplicates: 0,
      skipped_protected: 0,
      errors: [],
    };

    const eventbriteToken = Deno.env.get('EVENTBRITE_TOKEN');
    const eventbriteOrgIds = (Deno.env.get('EVENTBRITE_ORG_IDS') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (eventbriteToken && eventbriteOrgIds.length) {
      const eventbriteEvents = await fetchEventbriteEvents(eventbriteOrgIds, eventbriteToken);
      await upsertWithDedupe(supabase, eventbriteEvents, existing, eventbriteStats);
    } else {
      eventbriteStats.errors.push('EVENTBRITE_TOKEN or EVENTBRITE_ORG_IDS not configured');
    }

    const poshUrls = (Deno.env.get('POSH_EVENT_URLS') ?? '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    if (poshUrls.length) {
      const poshEvents = await fetchPoshEvents(poshUrls);
      await upsertWithDedupe(supabase, poshEvents, existing, poshStats);
    } else {
      poshStats.errors.push('POSH_EVENT_URLS not configured');
    }

    const summary = {
      eventbrite: eventbriteStats,
      posh: poshStats,
      total_inserted: eventbriteStats.inserted + poshStats.inserted,
      total_updated: eventbriteStats.updated + poshStats.updated,
      total_skipped_duplicates: eventbriteStats.skipped_duplicates + poshStats.skipped_duplicates,
    };

    await supabase.from('sync_runs').insert([
      {
        source_platform: 'eventbrite',
        inserted_count: eventbriteStats.inserted,
        updated_count: eventbriteStats.updated,
        skipped_duplicates: eventbriteStats.skipped_duplicates,
        error_count: eventbriteStats.errors.length,
        details: { errors: eventbriteStats.errors },
        finished_at: new Date().toISOString(),
      },
      {
        source_platform: 'posh',
        inserted_count: poshStats.inserted,
        updated_count: poshStats.updated,
        skipped_duplicates: poshStats.skipped_duplicates,
        error_count: poshStats.errors.length,
        details: { errors: poshStats.errors },
        finished_at: new Date().toISOString(),
      },
    ]);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Sync failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
