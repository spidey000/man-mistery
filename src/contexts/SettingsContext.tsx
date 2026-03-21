import React, { createContext, useContext, useState, useEffect } from 'react';
import { downloadOfflineBundle, readOfflineDataStatus, warmCoreOfflineAssets, type OfflineProgress } from '../services/offlineCache';

export interface Settings {
  childName: string;
  childAge: string;
  elevenLabsApiKey: string;
}

export interface OfflineState {
  status: 'idle' | 'downloading' | 'ready' | 'error';
  progress: number;
  label: string;
  coreReady: boolean;
  missionAudioCount: number;
  totalMissionAudio: number;
  lastDownloadedAt: string | null;
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showHelper: boolean;
  setShowHelper: (show: boolean) => void;
  offlineState: OfflineState;
  downloadOfflineContent: (options: { apiKey?: string; childName?: string }) => Promise<void>;
  refreshOfflineState: (childName?: string) => Promise<void>;
}

const defaultSettings: Settings = {
  childName: '',
  childAge: '',
  elevenLabsApiKey: ''
};

const defaultOfflineState: OfflineState = {
  status: 'idle',
  progress: 0,
  label: 'Pendiente',
  coreReady: false,
  missionAudioCount: 0,
  totalMissionAudio: 0,
  lastDownloadedAt: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [offlineState, setOfflineState] = useState<OfflineState>(defaultOfflineState);

  useEffect(() => {
    const saved = localStorage.getItem('man_quest_settings');
    if (saved) {
      try {
        setSettingsState(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing settings", e);
      }
    }
  }, []);

  const refreshOfflineState = async (childName: string = settings.childName) => {
    try {
      const cacheStatus = await readOfflineDataStatus(childName);
      const savedTimestamp = localStorage.getItem('man_quest_offline_last_download');

      setOfflineState((current) => ({
        ...current,
        status: cacheStatus.coreReady ? 'ready' : current.status === 'downloading' ? 'downloading' : 'idle',
        coreReady: cacheStatus.coreReady,
        missionAudioCount: cacheStatus.missionAudioCount,
        totalMissionAudio: cacheStatus.totalMissionAudio,
        lastDownloadedAt: savedTimestamp,
        label: cacheStatus.coreReady
          ? 'Contenido offline disponible'
          : current.label,
      }));
    } catch (error) {
      console.error('Error refrescando estado offline', error);
    }
  };

  useEffect(() => {
    refreshOfflineState().catch(() => undefined);
    warmCoreOfflineAssets().then(() => refreshOfflineState()).catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshOfflineState(settings.childName).catch(() => undefined);
  }, [settings.childName]);

  const handleOfflineProgress = (progress: OfflineProgress) => {
    setOfflineState((current) => ({
      ...current,
      status: 'downloading',
      progress: progress.percent,
      label: progress.label,
    }));
  };

  const downloadOfflineContent = async ({ apiKey, childName }: { apiKey?: string; childName?: string }) => {
    setOfflineState((current) => ({
      ...current,
      status: 'downloading',
      progress: 0,
      label: 'Preparando descarga offline',
    }));

    try {
      await downloadOfflineBundle({
        apiKey,
        childName,
        onProgress: handleOfflineProgress,
      });

      const timestamp = new Date().toISOString();
      localStorage.setItem('man_quest_offline_last_download', timestamp);
      await refreshOfflineState(childName);
      setOfflineState((current) => ({
        ...current,
        status: 'ready',
        progress: 100,
        label: 'Descarga offline completada',
        lastDownloadedAt: timestamp,
      }));
    } catch (error) {
      console.error('Error descargando contenido offline', error);
      setOfflineState((current) => ({
        ...current,
        status: 'error',
        label: error instanceof Error ? error.message : 'No se pudo completar la descarga offline',
      }));
      throw error;
    }
  };

  const setSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    localStorage.setItem('man_quest_settings', JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      setSettings,
      showSettings,
      setShowSettings,
      showHelper,
      setShowHelper,
      offlineState,
      downloadOfflineContent,
      refreshOfflineState,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
