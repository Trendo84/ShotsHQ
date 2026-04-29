/**
 * Loops API client. Lifecycle (welcome, low-credit, abandoned cart) +
 * transactional (receipt, render-complete) emails go through one provider.
 */

const LOOPS_API_KEY = process.env.LOOPS_API_KEY ?? "";
const ENDPOINT = "https://app.loops.so/api/v1";

async function loopsFetch(path: string, body: unknown) {
  const res = await fetch(`${ENDPOINT}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOOPS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Loops API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function loopsCreateContact(input: {
  email: string;
  userId?: string;
  firstName?: string;
}) {
  return loopsFetch("/contacts/create", input);
}

export async function loopsTrigger(eventName: string, email: string, payload: Record<string, unknown> = {}) {
  return loopsFetch("/events/send", { eventName, email, eventProperties: payload });
}

export async function loopsTransactional(transactionalId: string, email: string, dataVariables: Record<string, unknown>) {
  return loopsFetch("/transactional", { transactionalId, email, dataVariables });
}
