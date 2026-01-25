import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ProgressMap, ItemProgress } from '../types/progress';
import { DEFAULT_LEARNING_CONFIG } from '../types/progress';

interface ProgressContextType {
  progress: ProgressMap;
  updateProgress: (correctIds: string[], wrongIds: string[]) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType>({} as ProgressContextType);

const STORAGE_KEY = 'nl_quiz_progress';

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ProgressMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load progress", e);
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const updateProgress = (correctIds: string[], wrongIds: string[]) => {
    setProgress(prev => {
      const next = { ...prev };
      const now = Date.now();
      const { streakThreshold, maxLevel } = DEFAULT_LEARNING_CONFIG;

      // Handle Correct Answers
      correctIds.forEach(id => {
        const entry: ItemProgress = next[id] || {
          level: 0, streak: 0, totalCorrect: 0, totalWrong: 0, lastSeen: 0
        };

        // Prevent duplicates
        if (now - entry.lastSeen < 1000) {
          return;
        }

        entry.totalCorrect++;
        entry.lastSeen = now;

        // Logic: Increment streak. If streak hits threshold, Level Up & Reset Streak.
        if (entry.level < maxLevel) {
          entry.streak++;
          if (entry.streak >= streakThreshold || entry.level == 0) {
            entry.level++;
            entry.streak = 0; // Reset streak for the new level
          }
        }

        next[id] = entry;
      });

      // Handle Wrong Answers
      wrongIds.forEach(id => {
        const entry: ItemProgress = next[id] || {
          level: 0, streak: 0, totalCorrect: 0, totalWrong: 0, lastSeen: 0
        };

        // Prevent duplicates
        if (now - entry.lastSeen < 1000) {
          return;
        }

        entry.totalWrong++;
        entry.lastSeen = now;

        entry.streak = 0;

        next[id] = entry;
      });

      return next;
    });
  };

  const resetProgress = () => {
    if (confirm("Are you sure you want to reset all learning progress?")) {
      setProgress({});
    }
  };

  return (
    <ProgressContext.Provider value={{ progress, updateProgress, resetProgress }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => useContext(ProgressContext);
