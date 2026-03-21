import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '1mb' }));

app.post('/api/tts/deepgram', async (req, res) => {
  const { text, apiKey, model = 'aura-2-nestor-es' } = req.body ?? {};

  if (!text || !apiKey) {
    res.status(400).json({ error: 'Faltan datos para generar el audio' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3&container=mp3&bit_rate=32000`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Error al generar el audio en Deepgram';

      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed.err_msg || parsed.message || parsed.category || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      res.status(response.status).json({ error: errorMessage });
      return;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(audioBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al contactar con Deepgram';
    res.status(500).json({ error: message });
  }
});

app.post('/api/tts/deepgram/validate', async (req, res) => {
  const { apiKey } = req.body ?? {};

  if (!apiKey) {
    res.status(400).json({ error: 'Introduce una API Key primero' });
    return;
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/auth/token', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      res.status(response.status).json({ error: data.err_msg || data.message || 'API Key invalida o error de conexion' });
      return;
    }

    res.json({
      projectId: data.project_id || null,
      scopes: Array.isArray(data.scopes) ? data.scopes : []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo validar la API Key';
    res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Deepgram proxy listening on http://localhost:${port}`);
});
