import { useState, useEffect } from 'react';
import { User } from '../types';
import { achievements } from '../data/achievements';

const defaultUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  level: 3,
  xp: 450,
  achievements: achievements.slice(0, 2),
  completedModules: ['intro-to-debate'],
  currentStreak: 5,
  gradeLevel: 'high'
};

export const useUser = () => {
  const [user, setUser] = useState<User>(defaultUser);

  const updateUserProgress = (moduleId: string, xpGained: number) => {
    setUser(prev => ({
      ...prev,
      xp: prev.xp + xpGained,
      level: Math.floor((prev.xp + xpGained) / 200) + 1,
      completedModules: [...prev.completedModules, moduleId],
      currentStreak: prev.currentStreak + 1
    }));
  };

  const addAchievement = (achievement: typeof achievements[0]) => {
    setUser(prev => ({
      ...prev,
      achievements: [...prev.achievements, { ...achievement, unlockedAt: new Date() }]
    }));
  };

  return {
    user,
    updateUserProgress,
    addAchievement
  };
};