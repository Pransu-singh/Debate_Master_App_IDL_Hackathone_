import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Book, Zap } from 'lucide-react';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const stats = [
    {
      label: 'Current Level',
      value: user.level,
      icon: TrendingUp,
      color: 'pink',
      change: '+2 this week'
    },
    {
      label: 'Total XP',
      value: user.xp,
      icon: Zap,
      color: 'indigo',
      change: '+150 this week'
    },
    {
      label: 'Achievements',
      value: user.achievements.length,
      icon: Award,
      color: 'green',
      change: '+1 this week'
    },
    {
      label: 'Streak',
      value: `${user.currentStreak} days`,
      icon: Target,
      color: 'orange',
      change: 'Keep it up!'
    }
  ];

  const colorStyles: Record<string, { surface: string; soft: string; icon: string; text: string; gradient: string; ring: string; }> = {
    blue: { surface: 'bg-gradient-to-br from-white to-blue-50', soft: 'bg-blue-100', icon: 'text-blue-600', text: 'text-blue-700', gradient: 'from-blue-600 to-indigo-600', ring: 'ring-blue-200' },
    indigo: { surface: 'bg-gradient-to-br from-white to-indigo-50', soft: 'bg-indigo-100', icon: 'text-indigo-600', text: 'text-indigo-700', gradient: 'from-indigo-600 to-purple-600', ring: 'ring-indigo-200' },
    green: { surface: 'bg-gradient-to-br from-white to-green-50', soft: 'bg-green-100', icon: 'text-green-600', text: 'text-green-700', gradient: 'from-emerald-600 to-green-600', ring: 'ring-green-200' },
    orange: { surface: 'bg-gradient-to-br from-white to-orange-50', soft: 'bg-orange-100', icon: 'text-orange-600', text: 'text-orange-700', gradient: 'from-orange-500 to-amber-600', ring: 'ring-orange-200' },
    pink: { surface: 'bg-gradient-to-br from-white to-pink-50', soft: 'bg-pink-100', icon: 'text-pink-600', text: 'text-pink-700', gradient: 'from-rose-500 to-pink-600', ring: 'ring-pink-200' }
  };

  const nextLevel = user.level + 1;
  const levelUnit = 200;
  const xpIntoLevel = user.xp % levelUnit;
  const progressPct = Math.max(0, Math.min(100, (xpIntoLevel / levelUnit) * 100));
  const xpToNext = (nextLevel * levelUnit) - user.xp;

  const recentAchievements = user.achievements.slice(-3);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-blue-200/40 blur-3xl rounded-full" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-24 w-80 h-80 bg-purple-200/40 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden bg-white/90 backdrop-blur-md ring-1 ring-indigo-200 shadow-lg"
        >
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-rose-400 via-orange-500 to-indigo-900 opacity-80"></div>
          <div className="relative">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 mb-4">
                  Welcome back
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Great to see you, {user.name}!
                </h1>
                <p className="text-gray-600 mt-3 text-base sm:text-lg">
                  You're <span className="font-semibold text-indigo-700">{xpToNext} XP</span> away from Level {nextLevel}. Keep the streak alive!
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => onNavigate('learn')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors"
                  >
                    Resume Learning
                  </button>
                  <button
                    onClick={() => onNavigate('practice')}
                    className="bg-white text-indigo-700 border-2 border-indigo-200 px-5 py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    Start a Debate
                  </button>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="flex justify-center md:justify-end">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, #3b82f6 0%, #8b5cf6 ${progressPct/2}%, #06b6d4 ${progressPct}%, #e5e7eb ${progressPct}%)`
                    }}
                  />
                  <div className="absolute inset-3 sm:inset-3.5 rounded-full bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-inner flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{Math.round(progressPct)}%</div>
                      <div className="text-xs sm:text-sm text-gray-600">To Level {nextLevel}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((stat, index) => {
            const colors = colorStyles[stat.color];
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-xl p-3 sm:p-4 shadow-md ring-1 ${colors.ring} hover:shadow-lg transition-shadow ${colors.surface}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${colors.soft}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <span className={`text-xs font-medium ${colors.text}`}>{stat.change}</span>
                </div>
                <div className="mt-4">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl shadow-md p-4 sm:p-5 ring-1 ring-gray-200 bg-gradient-to-br from-white to-blue-50"
          >
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Book className="h-4 w-4 mr-2 text-blue-600" />
              Continue Learning
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 rounded-lg">
                <div className="mb-3 sm:mb-0">
                  <div className="font-medium text-gray-900 text-sm">Logical Fallacies</div>
                  <div className="text-xs text-gray-600">Next: Advanced Techniques</div>
                </div>
                <button
                  onClick={() => onNavigate('learn')}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl shadow-md p-4 sm:p-5 ring-1 ring-gray-200 bg-gradient-to-br from-white to-purple-50"
          >
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-600" />
              Practice Debate
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2 text-sm">Unlimited AI Debate Challenge</div>
                <div className="text-xs text-gray-600 mb-3">
                  Make as many arguments as you can in 5 minutes! Each argument earns bonus XP.
                </div>
                <button
                  onClick={() => onNavigate('practice')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors text-sm w-full sm:w-auto font-semibold"
                >
                  Start Unlimited Debate
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-md p-4 sm:p-5 ring-1 ring-gray-200 bg-gradient-to-br from-white to-slate-50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center mb-2 sm:mb-0">
              <Award className="h-4 w-4 mr-2 text-yellow-500" />
              Recent Achievements
            </h2>
            <button
              onClick={() => onNavigate('achievements')}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border-2 ${achievement.rarity === 'legendary' ? 'border-yellow-300 bg-yellow-50' :
                  achievement.rarity === 'epic' ? 'border-purple-300 bg-purple-50' :
                    achievement.rarity === 'rare' ? 'border-blue-300 bg-blue-50' :
                      'border-gray-300 bg-gray-50'
                  }`}
              >
                <div className="text-xl mb-1">{achievement.icon}</div>
                <div className="font-bold text-gray-900 text-sm">{achievement.title}</div>
                <div className="text-sm text-gray-600">{achievement.description}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};