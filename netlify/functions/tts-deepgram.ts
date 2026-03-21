import { requestDeepgramTTS } from '../../server/deepgram';

export async function handler(event: { body?: string | null; httpMethod?: string }) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        Allow: 'POST'
      },
      body: JSON.stringify({ error: 'Metodo no permitido' })
    };
  }

  let payload = {};

  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'JSON invalido' })
    };
  }

  const result = await requestDeepgramTTS(payload);

  if (!result.ok) {
    return {
      statusCode: result.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: result.error })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store'
    },
    body: result.audioBuffer.toString('base64'),
    isBase64Encoded: true
  };
}
