import fs from 'node:fs/promises';
import path from 'node:path';

const apiKey = process.env.ELEVENLABS_API_KEY;
const playerName = process.argv[2] || 'investogador';
const outputFile = process.argv[3] || path.join('public', 'audio', `fallback-${playerName}.mp3`);

if (!apiKey) {
  throw new Error('Falta ELEVENLABS_API_KEY');
}

const text = `Atencion, ${playerName}. Si no tienes internet en este momento, esta narracion de respaldo te acompanara en la expedicion del Museo Arqueologico Nacional. Sigue las pistas, resuelve los acertijos y protege la Llave del Tiempo.`;

const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
  method: 'POST',
  headers: {
    Accept: 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': apiKey,
  },
  body: JSON.stringify({
    text,
    model_id: 'eleven_turbo_v2_5',
    language_code: 'es',
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.8,
      style: 0.35,
      use_speaker_boost: true,
    },
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Error generando audio: ${errorText}`);
}

const audioBuffer = Buffer.from(await response.arrayBuffer());
await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, audioBuffer);

console.log(`Audio guardado en ${outputFile}`);
