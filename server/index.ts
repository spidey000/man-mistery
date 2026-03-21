import express from 'express';
import { requestDeepgramTTS, validateDeepgramToken } from './deepgram';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '1mb' }));

app.post('/api/tts/deepgram', async (req, res) => {
  const result = await requestDeepgramTTS(req.body ?? {});

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.send(result.audioBuffer);
});

app.post('/api/tts/deepgram/validate', async (req, res) => {
  const result = await validateDeepgramToken(req.body ?? {});

  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json(result.data);
});

app.listen(port, () => {
  console.log(`Deepgram proxy listening on http://localhost:${port}`);
});
