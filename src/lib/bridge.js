const API_BASE = 'https://jana-post-realtime.hatchable.site/api';

export async function fetchSharedTickets() {
  const response = await fetch(`${API_BASE}/state`, { method: 'GET', cache: 'no-store' });
  if (!response.ok) throw new Error(`State API returned ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.tickets) ? data.tickets : null;
}

export async function saveSharedTickets(tickets) {
  const response = await fetch(`${API_BASE}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickets })
  });
  if (!response.ok) throw new Error(`State API returned ${response.status}`);
  return response.json();
}

export function subscribeSharedTickets(onUpdate) {
  const realtime = window.hatchable?.events?.connect({
    authUrl: `${API_BASE}/events-token`
  });
  if (!realtime) {
    console.warn('Realtime client library is not available; refresh the page to load shared updates.');
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
