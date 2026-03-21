export async function generateTTS(text: string, apiKey: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB') {
  if (!apiKey) {
    throw new Error('API Key de ElevenLabs no configurada');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      language_code: 'es',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.35,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.message || 'Error al generar el audio');
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}
