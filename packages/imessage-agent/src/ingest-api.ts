/**
 * Forward iMessage history to the Second Brain Express API (same pipeline as /connect).
 * Set SECOND_BRAIN_API_URL + SECOND_BRAIN_USER_ID in packages/imessage-agent/.env
 */

export async function ingestTranscriptToSecondBrain(
  lines: string[],
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const base = process.env.SECOND_BRAIN_API_URL?.replace(/\/$/, '');
  const userId = process.env.SECOND_BRAIN_USER_ID;
  if (!base || !userId) {
    return { ok: true, skipped: true };
  }

  const content = lines.join('\n').trim();
  if (!content) return { ok: true };

  try {
    const res = await fetch(`${base}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'photon_ingest',
        content,
        source_type: 'chat_export',
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, error: j.error ?? String(res.status) };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
