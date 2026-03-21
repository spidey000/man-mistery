const DEFAULT_DEEPGRAM_MODEL = 'aura-2-nestor-es';

export async function generateTTS(text: string, apiKey: string, model: string = DEFAULT_DEEPGRAM_MODEL) {
  if (!apiKey) {
    throw new Error('API Key de Deepgram no configurada');
  }

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
  return URL.createObjectURL(audioBlob);
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
