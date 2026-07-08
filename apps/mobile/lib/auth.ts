import { getAuthRedirectUrl } from '@/lib/authRedirect';
import { getSupabase } from '@/lib/supabase';
import type { UserPrefs } from '@/types/event';

export async function signInWithEmail(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: getAuthRedirectUrl() },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchProfile(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

export async function upsertProfile(
  userId: string,
  email: string,
  prefs: UserPrefs,
  onboardingComplete: boolean,
  displayName?: string | null,
) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('profiles').upsert({
    id: userId,
    email,
    display_name: displayName ?? undefined,
    neighborhoods: prefs.neighborhoods,
    vibes: prefs.vibes,
    onboarding_complete: onboardingComplete,
    updated_at: new Date().toISOString(),
  });
}

export async function updateDisplayName(userId: string, displayName: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}
