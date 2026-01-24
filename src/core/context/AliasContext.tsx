import React, { createContext, useContext, useEffect, useState } from 'react';

export type CustomAliasMap = Record<string, string[]>;

interface AliasContextType {
  aliases: CustomAliasMap;
  addAlias: (cityId: string, alias: string) => void;
  removeAlias: (cityId: string, alias: string) => void;
}

const AliasContext = createContext<AliasContextType>({} as AliasContextType);

export const AliasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aliases, setAliases] = useState<CustomAliasMap>(() => {
    try {
      const saved = localStorage.getItem('nl_quiz_custom_aliases');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse aliases", e);
      return {};
    }
  });

  // Persist to storage whenever state changes
  useEffect(() => {
    localStorage.setItem('nl_quiz_custom_aliases', JSON.stringify(aliases));
  }, [aliases]);

  const addAlias = (cityId: string, newAlias: string) => {
    const trimmed = newAlias.trim();
    if (!trimmed) return;

    setAliases(prev => {
      const currentList = prev[cityId] || [];
      // Prevent duplicates (case-insensitive check)
      if (currentList.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return { ...prev, [cityId]: [...currentList, trimmed] };
    });
  };

  const removeAlias = (cityId: string, aliasToRemove: string) => {
    setAliases(prev => {
      const currentList = prev[cityId] || [];
      const newList = currentList.filter(a => a !== aliasToRemove);

      // Clean up empty keys to keep JSON tidy
      if (newList.length === 0) {
        const copy = { ...prev };
        delete copy[cityId];
        return copy;
      }

      return { ...prev, [cityId]: newList };
    });
  };

  return (
    <AliasContext.Provider value={{ aliases, addAlias, removeAlias }}>
      {children}
    </AliasContext.Provider>
  );
};

export const useAliasContext = () => useContext(AliasContext);
