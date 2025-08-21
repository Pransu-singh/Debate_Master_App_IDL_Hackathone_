import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Lock, Calendar } from 'lucide-react';
import { User, Achievement } from '../types';
import { achievements as allAchievements } from '../data/achievements';

interface AchievementsProps {
  user: User;
}

export const Achievements: React.FC<AchievementsProps> = ({ user }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'gray';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'yellow';
      default: return 'gray';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-yellow-500/50';
      case 'epic': return 'shadow-purple-500/50';
      case 'rare': return 'shadow-blue-500/50';
      default: return '';
    }
  };

  const unlockedIds = user.achievements.map(a => a.id);
  const lockedAchievements = allAchievements.filter(a => !unlockedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-4 sm:p-8 text-white mb-6 sm:mb-8"
          >
            <Trophy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Achievements</h1>
            <p className="text-lg sm:text-xl opacity-90">
              Track your progress and celebrate your debate mastery!
            </p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-3 sm:p-6"
            >
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{user.achievements.length}</div>
              <div className="text-gray-600 text-xs sm:text-sm">Total Earned</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-3 sm:p-6"
            >
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {Math.round((user.achievements.length / allAchievements.length) * 100)}%
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Complete</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-3 sm:p-6"
            >
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {user.achievements.filter(a => a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary').length}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Rare+</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-3 sm:p-6"
            >
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {user.achievements.filter(a => a.rarity === 'legendary').length}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">Legendary</div>
            </motion.div>
          </div>
        </div>

        {/* Unlocked Achievements */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-500" />
            Unlocked Achievements
          </h2>
          
          {user.achievements.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
              <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">No achievements yet. Start learning to earn your first achievement!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {user.achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-${getRarityColor(achievement.rarity)}-200 ${getRarityGlow(achievement.rarity)} ${
                    achievement.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-50 to-orange-50' :
                    achievement.rarity === 'epic' ? 'bg-gradient-to-br from-purple-50 to-pink-50' :
                    achievement.rarity === 'rare' ? 'bg-gradient-to-br from-blue-50 to-cyan-50' :
                    ''
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-3">{achievement.icon}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{achievement.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">{achievement.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-${getRarityColor(achievement.rarity)}-100 text-${getRarityColor(achievement.rarity)}-800`}>
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </span>
                      <div className="flex items-center text-xs text-gray-500 justify-center sm:justify-start">
                        <Calendar className="h-3 w-3 mr-1" />
                        {achievement.unlockedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Locked Achievements */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Lock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-gray-500" />
            Locked Achievements
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {lockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-200 opacity-75"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-3 grayscale">🔒</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-600 mb-2">{achievement.title}</h3>
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">{achievement.description}</p>
                  
                  <div className="flex items-center justify-center">
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                      {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Progress Encouragement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 sm:mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-4 sm:p-8 text-white text-center"
        >
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Keep Going!</h3>
          <p className="text-purple-100 mb-4 text-sm sm:text-base">
            You're doing great! Complete more modules and practice debates to unlock new achievements.
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
            <div className="text-xl sm:text-2xl font-bold">{allAchievements.length - user.achievements.length}</div>
            <div className="text-purple-100 text-sm">More to unlock</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};