const API_BASE = 'https://jana-post-realtime.hatchable.site/api';
const LOCAL_KEY = 'jana-unified-prototype-v2';

function readLocal() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY));
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export async function fetchSharedTickets() {
  try {
    const response = await fetch(`${API_BASE}/state`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error(`State API returned ${response.status}`);
    const data = await response.json();
    return Array.isArray(data.tickets) ? data.tickets : null;
  } catch (error) {
    console.warn('Shared API unavailable; using this browser local data.', error);
    return readLocal();
  }
}

export async function saveSharedTickets(tickets) {
  try {
    const response = await fetch(`${API_BASE}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickets })
    });
    if (!response.ok) throw new Error(`State API returned ${response.status}`);
    return response.json();
  } catch (error) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets));
    console.warn('Shared API unavailable; saved locally in this browser.', error);
    return { ok: true, mode: 'local' };
  }
}

export function subscribeSharedTickets(onUpdate) {
  const realtime = window.hatchable?.events?.connect({
    authUrl: `${API_BASE}/events-token`
  });
  if (!realtime) {
    console.warn('Realtime client is not available. Local demo mode remains active.');
    return () => {};
  }
  const channel = realtime.channel('jana-post');
  channel.on('updated', onUpdate);
  channel.on('$reset', onUpdate);
  return () => {
    if (typeof channel.unsubscribe === 'function') channel.unsubscribe();
    if (typeof realtime.disconnect === 'function') realtime.disconnect();
  };
}
