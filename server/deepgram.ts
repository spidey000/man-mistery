const DEFAULT_DEEPGRAM_MODEL = 'aura-2-nestor-es';

export interface DeepgramSpeakRequest {
  text?: string;
  apiKey?: string;
  model?: string;
}

export interface DeepgramValidationRequest {
  apiKey?: string;
}

export function getDeepgramSpeakUrl(model: string = DEFAULT_DEEPGRAM_MODEL) {
  return `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3&bit_rate=32000`;
}

export async function parseDeepgramError(response: Response) {
  const errorText = await response.text();
  let errorMessage = 'Error al contactar con Deepgram';

  try {
    const parsed = JSON.parse(errorText);
    errorMessage = parsed.err_msg || parsed.message || parsed.category || errorMessage;
  } catch {
    if (errorText) {
      errorMessage = errorText;
    }
  }

  return errorMessage;
}

export async function requestDeepgramTTS({ text, apiKey, model = DEFAULT_DEEPGRAM_MODEL }: DeepgramSpeakRequest) {
  if (!text || !apiKey) {
    return {
      ok: false as const,
      status: 400,
      error: 'Faltan datos para generar el audio'
    };
  }

  try {
    const response = await fetch(getDeepgramSpeakUrl(model), {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        error: await parseDeepgramError(response)
      };
    }

    return {
      ok: true as const,
      status: 200,
      audioBuffer: Buffer.from(await response.arrayBuffer())
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 500,
      error: error instanceof Error ? error.message : 'Error inesperado al contactar con Deepgram'
    };
  }
}

export async function validateDeepgramToken({ apiKey }: DeepgramValidationRequest) {
  if (!apiKey) {
    return {
      ok: false as const,
      status: 400,
      error: 'Introduce una API Key primero'
    };
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/auth/token', {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        error: data.err_msg || data.message || 'API Key invalida o error de conexion'
      };
    }

    return {
      ok: true as const,
      status: 200,
      data: {
        projectId: data.project_id || null,
        scopes: Array.isArray(data.scopes) ? data.scopes : []
      }
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 500,
      error: error instanceof Error ? error.message : 'No se pudo validar la API Key'
    };
  }
}

export { DEFAULT_DEEPGRAM_MODEL };
