/**
 * Client HTTP minimaliste pour les routes API internes.
 * Centralise le parsing JSON et la gestion d'erreur réseau.
 */

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Requête échouée (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}
