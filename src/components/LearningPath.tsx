import React from 'react';
import { motion } from 'framer-motion';
import { Book, Clock, Trophy, Lock, CheckCircle, Play } from 'lucide-react';
import { Module, User } from '../types';
import { modules } from '../data/modules';

interface LearningPathProps {
  user: User;
  onModuleSelect: (module: Module) => void;
}

export const LearningPath: React.FC<LearningPathProps> = ({ user, onModuleSelect }) => {
  const isModuleAvailable = (module: Module): boolean => {
    if (!module.prerequisite) return true;
    return user.completedModules.includes(module.prerequisite);
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    return user.completedModules.includes(moduleId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'yellow';
      case 'advanced': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-blue-200/40 blur-3xl rounded-full" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-24 w-80 h-80 bg-purple-200/40 blur-3xl rounded-full" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Learning Path</h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Master the art of debate through our structured modules — from fundamentals to advanced strategies.
          </p>
        </div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-8 mb-8 sm:mb-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Progress</h2>
              <p className="text-indigo-100 text-sm sm:text-base">
                {user.completedModules.length} of {modules.length} modules completed
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl sm:text-3xl font-extrabold">
                {Math.round((user.completedModules.length / modules.length) * 100)}%
              </div>
              <div className="text-indigo-100 text-sm">Complete</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-white/30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${(user.completedModules.length / modules.length) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Modules Grid */}
        <div className="space-y-4 sm:space-y-8">
          {modules.map((module, index) => {
            const isAvailable = isModuleAvailable(module);
            const isCompleted = isModuleCompleted(module.id);
            const difficultyColor = getDifficultyColor(module.difficulty);

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-200 ring-1 shadow-md ${isCompleted
                    ? 'ring-green-200 bg-gradient-to-br from-white to-green-50'
                    : isAvailable
                      ? 'ring-indigo-200 bg-gradient-to-br from-white to-indigo-50 hover:ring-indigo-300'
                      : 'ring-gray-200 bg-gradient-to-br from-white to-gray-50'
                  }`}
              >
                {/* Top gradient bar */}
                <div className={`h-1.5 w-full ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                    isAvailable ? 'bg-gradient-to-r from-indigo-400 to-purple-500' :
                      'bg-gradient-to-r from-gray-300 to-gray-400'
                  }`} />

                {/* Module Content */}
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0 min-w-0">
                      <div className="flex items-start mb-4">
                        <div className={`p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 flex-shrink-0 ${isCompleted
                            ? 'bg-green-100'
                            : isAvailable
                              ? 'bg-indigo-100'
                              : 'bg-gray-100'
                          }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                          ) : isAvailable ? (
                            <Book className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                          ) : (
                            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 ${isAvailable ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                            {module.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-${difficultyColor}-100 text-${difficultyColor}-800 capitalize`}>
                              {module.difficulty}
                            </span>
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">{module.estimatedTime} min</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">{module.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className={`text-sm sm:text-lg mb-4 sm:mb-6 ${isAvailable ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                        {module.description}
                      </p>

                      {module.prerequisite && (
                        <div className="mb-4">
                          <span className="text-xs sm:text-sm text-gray-600">
                            Prerequisite: {modules.find(m => m.id === module.prerequisite)?.title}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-stretch lg:items-end space-y-3 lg:ml-4">
                      {isCompleted && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-center">
                          Completed ✓
                        </div>
                      )}

                      <button
                        onClick={() => isAvailable && onModuleSelect(module)}
                        disabled={!isAvailable}
                        className={`flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${isCompleted
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : isAvailable
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {isCompleted ? (
                          <>Review Module</>
                        ) : isAvailable ? (
                          <>
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Start Module
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Locked
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 sm:mt-12 rounded-3xl p-6 sm:p-8 text-white text-center bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 shadow-xl"
        >
          <h2 className="text-xl sm:text-2xl font-extrabold mb-4">Keep Learning!</h2>
          <p className="text-purple-100 mb-4 sm:mb-6 text-sm sm:text-base">
            Complete all modules to unlock advanced practice debates and become a debate master!
          </p>
          <div className="flex justify-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-extrabold">{user.completedModules.length}</div>
              <div className="text-purple-100 text-xs sm:text-sm">Completed</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-extrabold">{modules.length - user.completedModules.length}</div>
              <div className="text-purple-100 text-xs sm:text-sm">Remaining</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};