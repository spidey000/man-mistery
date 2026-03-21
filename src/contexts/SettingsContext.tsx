import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Settings {
  childName: string;
  childAge: string;
  elevenLabsApiKey: string;
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showHelper: boolean;
  setShowHelper: (show: boolean) => void;
}

const defaultSettings: Settings = {
  childName: '',
  childAge: '',
  elevenLabsApiKey: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

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
