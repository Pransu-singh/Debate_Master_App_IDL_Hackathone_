import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Brain, Target, Zap } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const icons = [Trophy, Brain, Target, Zap];
  const statuses = [
    'Calibrating AI coach',
    'Preparing learning modules',
    'Analyzing debate strategies',
    'Optimizing feedback engine',
    'Almost ready'
  ];

  const [statusIndex, setStatusIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.02,
            y: mousePosition.y * -0.02,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.01,
            y: mousePosition.y * 0.01,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 sm:px-6">
        <div className="w-full max-w-md sm:max-w-xl text-center">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 sm:mb-12"
          >
            <motion.div
              className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500/90 to-purple-600/90 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(59, 130, 246, 0.3)",
                  "0 0 50px rgba(147, 51, 234, 0.5)",
                  "0 0 30px rgba(59, 130, 246, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </motion.div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="text-white">Debate</span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Master</span>
            </h1>
            <p className="text-gray-300 mt-2 text-base sm:text-lg">Shaping confident communicators</p>
          </motion.div>

          {/* Floating icons */}
          <div className="flex justify-center gap-6 sm:gap-8 mb-8 sm:mb-12">
            {icons.map((Icon, index) => (
              <motion.div
                key={index}
                initial={{ y: 0, opacity: 0.8 }}
                animate={{ 
                  y: [-12, 0, -12], 
                  opacity: [0.8, 1, 0.8],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: index * 0.2, 
                  ease: 'easeInOut' 
                }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-xl border border-white/20"
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-300" />
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-6 sm:mb-8">
            <div className="h-2 rounded-full bg-white/10 backdrop-blur-sm overflow-hidden shadow-inner border border-white/20">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 shadow-lg"
                style={{
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
                }}
              />
            </div>
          </div>

          {/* Status text */}
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-white font-semibold text-lg sm:text-xl mb-2"
          >
            {statuses[statusIndex]}...
          </motion.p>

          {/* Subtext */}
          <p className="text-gray-300 text-sm sm:text-base">Loading your personalized debate experience</p>

          {/* Loading dots animation */}
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};