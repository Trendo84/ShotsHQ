import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

export function posthogServer(): PostHog | null {
  if (_client) return _client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  _client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 5_000,
  });
  return _client;
}

export async function track(event: string, distinctId: string, properties: Record<string, unknown> = {}) {
  const client = posthogServer();
  if (!client) return;
  client.capture({ event, distinctId, properties });
  await client.shutdown().catch(() => {});
}
