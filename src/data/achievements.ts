import { Achievement } from '../types';

export const achievements: Achievement[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first learning module',
    icon: '🎯',
    unlockedAt: new Date(),
    rarity: 'common'
  },
  {
    id: 'logic-detective',
    title: 'Logic Detective',
    description: 'Identify 10 logical fallacies correctly',
    icon: '🕵️',
    unlockedAt: new Date(),
    rarity: 'rare'
  },
  {
    id: 'debate-champion',
    title: 'Debate Champion',
    description: 'Win 5 practice debates in a row',
    icon: '🏆',
    unlockedAt: new Date(),
    rarity: 'epic'
  },
  {
    id: 'master-rhetorician',
    title: 'Master Rhetorician',
    description: 'Complete all advanced modules with perfect scores',
    icon: '👑',
    unlockedAt: new Date(),
    rarity: 'legendary'
  }
];