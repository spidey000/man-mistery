import objectsData from '../data/man_exposicion_permanente_objetos.json';
import { fetchTTSBlob } from './elevenlabs';

const CORE_CACHE = 'man-mistery-core-v1';
const TTS_CACHE = 'man-mistery-tts-v1';
const OFFLINE_DATA_KEY = '/offline/data/man_exposicion_permanente_objetos.json';
const SUCCESS_SOUND_URL = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3';
const FALLBACK_AUDIO_URL = '/audio/fallback-investogador.mp3';

interface AnswerEntry {
  type?: string;
  value: string;
}

interface AnswerConcept {
  required: string[];
  optional?: string[];
  forbidden?: string[];
}

type MissionType = 'action' | 'riddle' | 'mixed';
type AnswerStrategy = 'exact' | 'semantic' | 'concepts';

interface Mission {
  id: string;
  name: string;
  room: string;
  lore_text: string;
  action_prompt?: string;
  expected_format: string;
  possible_answers: AnswerEntry[];
  hint_ladder_template: Record<string, string>;
  image_url?: string;
  success_description: string;
  mission_type?: MissionType;
  artifact_to_find?: string;
  riddle_prompt?: string;
  question_prompt?: string;
  answer_strategy?: AnswerStrategy;
  answer_concepts?: AnswerConcept[];
}

export interface OfflineProgress {
  completed: number;
  total: number;
  percent: number;
  label: string;
}

interface DownloadOptions {
  apiKey?: string;
  childName?: string;
  onProgress?: (progress: OfflineProgress) => void;
}

const missions: Mission[] = objectsData.objects as Mission[];

function makeProgress(completed: number, total: number, label: string): OfflineProgress {
  return {
    completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
    label,
  };
}

function reportProgress(
  onProgress: DownloadOptions['onProgress'],
  completed: number,
  total: number,
  label: string,
) {
  onProgress?.(makeProgress(completed, total, label));
}

function uniqueUrls(urls: Array<string | undefined>): string[] {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

function getAppShellUrls(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const resourceUrls = performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((url) => url.startsWith(window.location.origin));

  return uniqueUrls([
    window.location.origin,
    `${window.location.origin}/`,
    window.location.href,
    ...resourceUrls,
  ]);
}

function getCoreAssetUrls(): string[] {
  return uniqueUrls([
    FALLBACK_AUDIO_URL,
    SUCCESS_SOUND_URL,
    ...missions.map((mission) => mission.image_url),
    ...getAppShellUrls(),
  ]);
}

function buildSpokenPrompt(mission: Mission, childName = ''): string {
  const greeting = childName ? `¡Atención, ${childName}! ` : '¡Atención, explorador! ';

  let prompt = `${greeting} Escucha con atención el diario del profesor Ardanza...\n"${mission.lore_text}"`;

  if (mission.riddle_prompt) {
    prompt += `\n... Aquí tienes el acertijo:\n"${mission.riddle_prompt}"`;
  }
  if (mission.artifact_to_find) {
    prompt += `\n... Lo que debes buscar:\n"${mission.artifact_to_find}"`;
  }
  if (mission.question_prompt) {
    prompt += `\n... Tu pregunta es:\n"${mission.question_prompt}"`;
  }
  if (mission.action_prompt && !mission.question_prompt) {
    prompt += `\n... Ahora, tu misión es la siguiente: ${mission.action_prompt}`;
  }

  return prompt;
}

function getTtsCacheKey(missionId: string, childName = ''): string {
  const normalizedName = childName.trim().toLowerCase() || 'explorador';
  return `/offline/audio/tts/${missionId}-${encodeURIComponent(normalizedName)}.mp3`;
}

async function storeOfflineData() {
  const cache = await caches.open(CORE_CACHE);
  await cache.put(
    OFFLINE_DATA_KEY,
    new Response(JSON.stringify(objectsData), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

async function fetchForCache(url: string): Promise<Response> {
  const isSameOrigin = typeof window !== 'undefined' && url.startsWith(window.location.origin);
  const isRelative = url.startsWith('/');
  const requestUrl = isRelative && typeof window !== 'undefined' ? new URL(url, window.location.origin).toString() : url;
  const mode = isSameOrigin || isRelative ? 'same-origin' : 'cors';

  try {
    return await fetch(requestUrl, { mode });
  } catch (error) {
    if (!isSameOrigin && !isRelative) {
      return fetch(requestUrl, { mode: 'no-cors' });
    }
    throw error;
  }
}

async function cacheUrl(url: string) {
  const cache = await caches.open(CORE_CACHE);
  const response = await fetchForCache(url);

  if (!response.ok && response.type !== 'opaque') {
    throw new Error(`No se pudo descargar ${url}`);
  }

  await cache.put(url, response.clone());
}

export async function warmCoreOfflineAssets(onProgress?: (progress: OfflineProgress) => void) {
  await storeOfflineData();

  const urls = getCoreAssetUrls();
  const total = urls.length + 1;
  let completed = 1;

  reportProgress(onProgress, completed, total, 'Guardando datos del juego');

  for (const url of urls) {
    try {
      await cacheUrl(url);
    } catch {
      // Ignore individual asset failures; the app still works with partial cache.
    }
    completed += 1;
    reportProgress(onProgress, completed, total, `Descargando recurso ${completed - 1} de ${urls.length}`);
  }
}

export async function downloadOfflineBundle(options: DownloadOptions) {
  const { apiKey, childName = '', onProgress } = options;
  const coreUrls = getCoreAssetUrls();
  const shouldGenerateTts = Boolean(apiKey);
  const total = 1 + coreUrls.length + (shouldGenerateTts ? missions.length : 0);
  let completed = 0;

  await storeOfflineData();
  completed += 1;
  reportProgress(onProgress, completed, total, 'Guardando textos y datos del juego');

  for (const url of coreUrls) {
    try {
      await cacheUrl(url);
    } catch {
      // Keep going so the rest of the bundle still downloads.
    }
    completed += 1;
    reportProgress(onProgress, completed, total, `Descargando recursos ${completed - 1}/${coreUrls.length}`);
  }

  if (shouldGenerateTts && apiKey) {
    const ttsCache = await caches.open(TTS_CACHE);

    for (const mission of missions) {
      const blob = await fetchTTSBlob(buildSpokenPrompt(mission, childName), apiKey);
      await ttsCache.put(
        getTtsCacheKey(mission.id, childName),
        new Response(blob, {
          headers: { 'Content-Type': 'audio/mpeg' },
        }),
      );

      completed += 1;
      reportProgress(onProgress, completed, total, `Generando narracion ${mission.name}`);
    }
  }

  reportProgress(onProgress, total, total, 'Descarga offline completada');
}

export async function getCachedMissionAudioUrl(missionId: string, childName = ''): Promise<string | null> {
  const cache = await caches.open(TTS_CACHE);
  const response = await cache.match(getTtsCacheKey(missionId, childName));

  if (!response) {
    return null;
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function cacheMissionAudio(missionId: string, childName: string, blob: Blob) {
  const cache = await caches.open(TTS_CACHE);
  await cache.put(
    getTtsCacheKey(missionId, childName),
    new Response(blob, {
      headers: { 'Content-Type': 'audio/mpeg' },
    }),
  );
}

export async function getSuccessSoundUrl(): Promise<string> {
  const cache = await caches.open(CORE_CACHE);
  const response = await cache.match(SUCCESS_SOUND_URL);

  if (response) {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return FALLBACK_AUDIO_URL;
  }

  return SUCCESS_SOUND_URL;
}

export function getFallbackAudioUrl(): string {
  return FALLBACK_AUDIO_URL;
}

export async function readOfflineDataStatus(childName = '') {
  const coreCache = await caches.open(CORE_CACHE);
  const ttsCache = await caches.open(TTS_CACHE);

  const coreReady = Boolean(await coreCache.match(OFFLINE_DATA_KEY));
  const hasFallbackAudio = Boolean(await coreCache.match(FALLBACK_AUDIO_URL));
  const missionAudioCount = childName
    ? (await Promise.all(missions.map((mission) => ttsCache.match(getTtsCacheKey(mission.id, childName))))).filter(Boolean).length
    : 0;

  return {
    coreReady,
    hasFallbackAudio,
    missionAudioCount,
    totalMissionAudio: missions.length,
  };
}

export function getMissionCount() {
  return missions.length;
}
