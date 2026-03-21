import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Settings {
  childName: string;
  childAge: string;
}

const SETTINGS_STORAGE_KEY = 'man_quest_settings';
const SESSION_TTS_KEY = 'man_quest_deepgram_api_key';

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  deepgramApiKey: string;
  setDeepgramApiKey: (apiKey: string) => void;
  clearDeepgramApiKey: () => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showHelper: boolean;
  setShowHelper: (show: boolean) => void;
}

const defaultSettings: Settings = {
  childName: '',
  childAge: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [deepgramApiKey, setDeepgramApiKeyState] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const { deepgramApiKey: legacyApiKey, ...rest } = parsed;

        setSettingsState({
          ...defaultSettings,
          ...rest
        });

        if (legacyApiKey) {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
            ...defaultSettings,
            ...rest
          }));
        }
      } catch (e) {
        console.error("Error parsing settings", e);
      }
    }

    const savedSessionApiKey = sessionStorage.getItem(SESSION_TTS_KEY);
    if (savedSessionApiKey) {
      setDeepgramApiKeyState(savedSessionApiKey);
    }
  }, []);

  const setSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const setDeepgramApiKey = (apiKey: string) => {
    setDeepgramApiKeyState(apiKey);
    if (apiKey) {
      sessionStorage.setItem(SESSION_TTS_KEY, apiKey);
      return;
    }

    sessionStorage.removeItem(SESSION_TTS_KEY);
  };

  const clearDeepgramApiKey = () => {
    setDeepgramApiKeyState('');
    sessionStorage.removeItem(SESSION_TTS_KEY);
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      setSettings,
      deepgramApiKey,
      setDeepgramApiKey,
      clearDeepgramApiKey,
      showSettings,
      setShowSettings,
      showHelper,
      setShowHelper
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
