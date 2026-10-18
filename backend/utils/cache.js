// In-memory TTL cache for high-frequency aggregated read payloads
const store = new Map();

function get(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

function set(key, value, ttlMs) {
  store.set(key, { value, expires: Date.now() + ttlMs });
  if (store.size > 1000) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
}

async function remember(key, ttlMs, loader) {
  const cached = get(key);
  if (cached !== undefined) return cached;
  const value = await loader();
  set(key, value, ttlMs);
  return value;
}

function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

module.exports = { get, set, remember, invalidate };
