const DEFAULT_DEEPGRAM_MODEL = 'aura-2-alvaro-es';
const TTS_CACHE_NAME = 'deepgram-tts-v1';
const inMemoryAudioUrls = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

async function buildCacheKey(text: string, model: string) {
  const normalizedKey = JSON.stringify({ text, model });

  if (typeof crypto?.subtle?.digest === 'function') {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizedKey));
    const hash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
    return `/api/tts/deepgram/cache/${hash}`;
  }

  return `/api/tts/deepgram/cache/${encodeURIComponent(normalizedKey)}`;
}

async function getCachedAudioUrl(cacheKey: string) {
  const cachedUrl = inMemoryAudioUrls.get(cacheKey);

  if (cachedUrl) {
    return cachedUrl;
  }

  if (typeof caches === 'undefined') {
    return null;
  }

  const cache = await caches.open(TTS_CACHE_NAME);
  const cachedResponse = await cache.match(cacheKey);

  if (!cachedResponse) {
    return null;
  }

  const audioUrl = URL.createObjectURL(await cachedResponse.blob());
  inMemoryAudioUrls.set(cacheKey, audioUrl);
  return audioUrl;
}

async function saveAudioToCache(cacheKey: string, audioBlob: Blob, audioUrl: string) {
  inMemoryAudioUrls.set(cacheKey, audioUrl);

  if (typeof caches === 'undefined') {
    return;
  }

  const cache = await caches.open(TTS_CACHE_NAME);
  await cache.put(
    cacheKey,
    new Response(audioBlob, {
      headers: {
        'Content-Type': audioBlob.type || 'audio/mpeg'
      }
    })
  );
}

export async function generateTTS(text: string, apiKey: string, model: string = DEFAULT_DEEPGRAM_MODEL) {
  if (!apiKey) {
    throw new Error('API Key de Deepgram no configurada');
  }

  const cacheKey = await buildCacheKey(text, model);
  const cachedAudioUrl = await getCachedAudioUrl(cacheKey);

  if (cachedAudioUrl) {
    return cachedAudioUrl;
  }

  const inFlightRequest = inFlightRequests.get(cacheKey);

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const requestPromise = (async () => {
    const response = await fetch('/api/tts/deepgram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        apiKey,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al generar el audio');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    await saveAudioToCache(cacheKey, audioBlob, audioUrl);
    return audioUrl;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

export async function validateDeepgramApiKey(apiKey: string) {
  if (!apiKey) {
    throw new Error('Introduce una API Key primero');
  }

  const response = await fetch('/api/tts/deepgram/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'API Key invalida o error de conexion');
  }

  return data;
}

export const deepgramDefaults = {
  model: DEFAULT_DEEPGRAM_MODEL,
  language: 'es-ES',
  accent: 'espanol de Espana peninsular',
  output: 'mp3'
};
