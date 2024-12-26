import React, { createContext, useContext, useState, useEffect } from "react";

interface Settings {
  [key: string]: any;
}

interface SettingsContextProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider: React.FC = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    const hostname = window.location.hostname;
    const storedSettings = localStorage.getItem(`settings_${hostname}`);
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const updateSettings = (newSettings: Settings) => {
    const hostname = window.location.hostname;
    setSettings(newSettings);
    localStorage.setItem(`settings_${hostname}`, JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings: updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};