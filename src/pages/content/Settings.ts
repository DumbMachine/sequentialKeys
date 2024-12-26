import { useState, useEffect, useCallback } from "react";

export interface GlobalSettings {
  DebugMode: boolean;
  Enabled: boolean;
  Theme: "dark" | "light";
}

interface booleanSettings {
  [key: string]: boolean;
}

export interface WebsiteSettings extends booleanSettings {
  Enabled: boolean;
  PropagateAll: boolean;
  PropagateAllExceptHints: boolean;
}

const GLOBAL_KEY = "settings";

const getStorageKey = (host?: string) => {
  if (host) {
    return `website_${host}_${GLOBAL_KEY}`;
  } else {
    return `global_${GLOBAL_KEY}`;
  }
};

const defaultGlobalSettings: GlobalSettings = {
  DebugMode: false,
  Enabled: true,
  Theme: "dark",
};

const defaultWebsiteSettings: WebsiteSettings = {
  Enabled: true,
  PropagateAll: false,
  PropagateAllExceptHints: true,
};

export const useStorage = <T>(host?: string) => {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    const storageKey = getStorageKey(host);

    const fetchData = () => {
      chrome.storage.local.get([storageKey], (result) => {
        if (result[storageKey] !== undefined) {
          setValue(result[storageKey]);
        } else {
          const defaultValue = host
            ? defaultWebsiteSettings
            : defaultGlobalSettings;
          chrome.storage.local.set({ [storageKey]: defaultValue }, () => {
            setValue(defaultValue as T);
          });
        }
      });
    };

    fetchData();

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes[storageKey]) {
        setValue(changes[storageKey].newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [host]);

  const setStoredValue = useCallback(
    (newValue: T) => {
      const storageKey = getStorageKey(host);
      chrome.storage.local.set({ [storageKey]: newValue }, () => {
        setValue(newValue);
      });
    },
    [host]
  );

  return [value, setStoredValue] as const;
};
