'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  fetchAdminDashboard,
  moderateBusinessPlace,
  moderateFeedPost,
  verifyAdminSecret,
  type AdminDashboard,
} from '@/lib/api';

const ADMIN_SESSION_KEY = 'citipilot-admin-secret';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [inputSecret, setInputSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [actionStatus, setActionStatus] = useState('');

  const loadDashboard = useCallback(async (adminSecret: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminDashboard(adminSecret);
      setDashboard(data);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (saved) {
      setSecret(saved);
      void loadDashboard(saved);
    }
  }, [loadDashboard]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await verifyAdminSecret(inputSecret);
    if (!ok) {
      setError('Invalid admin secret');
      setLoading(false);
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, inputSecret);
    setSecret(inputSecret);
    await loadDashboard(inputSecret);
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setSecret('');
    setInputSecret('');
    setAuthenticated(false);
    setDashboard(null);
  }

  async function handleModerate(placeId: string, action: 'approve' | 'reject') {
    if (!secret) return;
    setActionStatus('');
    try {
      await moderateBusinessPlace(secret, placeId, action);
      setActionStatus(`${action === 'approve' ? 'Approved' : 'Rejected'} place ${placeId}`);
      await loadDashboard(secret);
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async function handleModerateFeed(postId: string, action: 'approve' | 'reject') {
    if (!secret) return;
    setActionStatus('');
    try {
      await moderateFeedPost(secret, postId, action);
      setActionStatus(`${action === 'approve' ? 'Approved' : 'Rejected'} feed post`);
      await loadDashboard(secret);
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : 'Action failed');
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F7F4EE]">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Citipilot</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#14121A]">
            Admin
          </h1>
          <p className="mt-2 text-sm text-[#5A5560]">
            Enter your admin secret to moderate business listings, feed posts, and view stats.
          </p>
          <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-[#14121A]">Admin secret</span>
              <input
                type="password"
                required
                value={inputSecret}
                onChange={(e) => setInputSecret(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#DED8D0] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#C44B2F]"
                placeholder="ADMIN_SECRET"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1B1724] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#2A2433] disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            {error ? <p className="text-sm font-semibold text-[#9E3A24]">{error}</p> : null}
          </form>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <div className="border-b border-[#DED8D0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Citipilot</p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#14121A]">
              Admin dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadDashboard(secret)}
              disabled={loading}
              className="rounded-full border border-[#DED8D0] px-4 py-2 text-sm font-bold text-[#14121A] transition hover:border-[#14121A]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[#1B1724] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2A2433]"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {actionStatus ? <p className="text-sm font-semibold text-[#2F6B52]">{actionStatus}</p> : null}
        {error ? <p className="text-sm font-semibold text-[#9E3A24]">{error}</p> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: 'Total places', value: stats?.totalPlaces ?? 0 },
            { label: 'Active listings', value: stats?.activePlaces ?? 0 },
            { label: 'Pending places', value: stats?.pendingPlaces ?? 0 },
            { label: 'Published events', value: stats?.eventCount ?? 0 },
            { label: 'Pending feed posts', value: stats?.pendingFeedPosts ?? 0 },
            { label: 'Approved feed posts', value: stats?.approvedFeedPosts ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#DED8D0] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A8490]">{item.label}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#14121A]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#DED8D0] bg-white p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">
            Feed posts pending
          </h2>
          <p className="mt-1 text-sm text-[#5A5560]">Community posts awaiting moderation.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#DED8D0] text-xs font-bold uppercase tracking-[0.12em] text-[#8A8490]">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Caption</th>
                  <th className="py-3 pr-4">Neighborhood</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.pendingFeed ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[#5A5560]">
                      No pending feed posts.
                    </td>
                  </tr>
                ) : (
                  dashboard?.pendingFeed.map((post) => (
                    <tr key={post.id} className="border-b border-[#EFEAE3]">
                      <td className="py-3 pr-4 font-semibold text-[#14121A]">
                        {post.user_name}
                        <span className="block text-xs font-normal text-[#8A8490]">@{post.user_handle}</span>
                      </td>
                      <td className="max-w-xs py-3 pr-4 text-[#5A5560]">
                        <span className="line-clamp-2">{post.caption}</span>
                        {post.place_name ? (
                          <span className="mt-1 block text-xs text-[#8A8490]">📍 {post.place_name}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-[#5A5560]">{post.neighborhood}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">{formatDate(post.created_at)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleModerateFeed(post.id, 'approve')}
                            className="rounded-md bg-[#2F6B52] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleModerateFeed(post.id, 'reject')}
                            className="rounded-md bg-[#9E3A24] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DED8D0] bg-white p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">
            Pending business listings
          </h2>
          <p className="mt-1 text-sm text-[#5A5560]">Paid listings awaiting moderation (if auto-approve is off).</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#DED8D0] text-xs font-bold uppercase tracking-[0.12em] text-[#8A8490]">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Neighborhood</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.pending ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[#5A5560]">
                      No pending listings.
                    </td>
                  </tr>
                ) : (
                  dashboard?.pending.map((place) => (
                    <tr key={place.id} className="border-b border-[#EFEAE3]">
                      <td className="py-3 pr-4 font-semibold text-[#14121A]">{place.name}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">{place.email}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">{place.neighborhood}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">{formatDate(place.created_at)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleModerate(place.id, 'approve')}
                            className="rounded-md bg-[#2F6B52] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleModerate(place.id, 'reject')}
                            className="rounded-md bg-[#9E3A24] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DED8D0] bg-white p-5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">
            Active business listings
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#DED8D0] text-xs font-bold uppercase tracking-[0.12em] text-[#8A8490]">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Neighborhood</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.active ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-[#5A5560]">
                      No active listings yet.
                    </td>
                  </tr>
                ) : (
                  dashboard?.active.map((place) => (
                    <tr key={place.id} className="border-b border-[#EFEAE3]">
                      <td className="py-3 pr-4 font-semibold text-[#14121A]">{place.name}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">{place.email}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">{place.neighborhood}</td>
                      <td className="py-3 pr-4 text-[#5A5560]">
                        {place.subcategory || place.category}
                      </td>
                      <td className="py-3 text-[#5A5560]">{formatDate(place.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
