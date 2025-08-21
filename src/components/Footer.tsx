import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Quote, RefreshCw, Heart, MessageCircle, Target, Zap } from 'lucide-react';

const motivationalQuotes = [
  {
    quote: "The best way to win an argument is to start by being right.",
    author: "Jill Ruckelshaus",
    category: "Strategy"
  },
  {
    quote: "It is better to debate a question without settling it than to settle a question without debating it.",
    author: "Joseph Joubert",
    category: "Philosophy"
  },
  {
    quote: "The aim of argument, or of discussion, should not be victory, but progress.",
    author: "Joseph Joubert",
    category: "Growth"
  },
  {
    quote: "In debate, the person who is learning the most is the one who is changing their mind.",
    author: "Unknown",
    category: "Learning"
  },
  {
    quote: "A good debater is not necessarily a true believer, but someone who can argue any side with conviction.",
    author: "Unknown",
    category: "Skill"
  }
];

export const Footer: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate quotes every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      rotateQuote();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const rotateQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
      setIsAnimating(false);
    }, 300);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strategy': return Target;
      case 'philosophy': return Quote;
      case 'growth': return Zap;
      case 'learning': return Trophy;
      case 'skill': return MessageCircle;
      default: return Heart;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strategy': return 'text-red-600 bg-red-100';
      case 'philosophy': return 'text-purple-600 bg-purple-100';
      case 'growth': return 'text-green-600 bg-green-100';
      case 'learning': return 'text-blue-600 bg-blue-100';
      case 'skill': return 'text-orange-600 bg-orange-100';
      default: return 'text-pink-600 bg-pink-100';
    }
  };

  const quote = motivationalQuotes[currentQuote];
  const CategoryIcon = getCategoryIcon(quote.category);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Compact Motivational Quote Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full mr-3">
                <Quote className="h-5 w-5 text-blue-300" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Daily Inspiration
              </h3>
            </div>

            <div className="max-w-3xl mx-auto">
              <motion.div
                key={currentQuote}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: isAnimating ? 0 : 1,
                  scale: isAnimating ? 0.95 : 1
                }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10"
              >
                <blockquote className="text-base sm:text-lg font-medium text-blue-100 mb-3 leading-relaxed">
                  "{quote.quote}"
                </blockquote>

                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white font-bold text-xs">
                        {quote.author.charAt(0)}
                      </span>
                    </div>
                    <span className="text-blue-200 text-sm">
                      — {quote.author}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getCategoryColor(quote.category)}`}>
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {quote.category}
                    </div>

                    <button
                      onClick={rotateQuote}
                      className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors group"
                      title="Get new quote"
                    >
                      <RefreshCw className="h-3 w-3 text-blue-300 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Compact Quote Navigation Dots */}
            <div className="flex justify-center mt-4 space-x-1">
              {motivationalQuotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => {
                      setCurrentQuote(index);
                      setIsAnimating(false);
                    }, 300);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentQuote
                      ? 'bg-blue-400 w-4'
                      : 'bg-white/30 hover:bg-white/50'
                    }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Compact Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DebateMaster
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Master the art of debate with AI-powered learning and real-time feedback.
            </p>

            {/* Compact Feature Highlights */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                AI-Powered Learning
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                Real-time Feedback
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
                Structured Curriculum
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></div>
                Achievement System
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {[
                'Learning Modules',
                'Practice Debates',
                'Achievements',
                'Progress Tracking'
              ].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-base font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2">
              {[
                'Debate Techniques',
                'Logical Fallacies',
                'Argument Structure',
                'Practice Tips'
              ].map((resource) => (
                <li key={resource}>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {resource}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compact Bottom Bar */}
        <div className="border-t border-white/10 mt-6 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm">
            <div className="text-gray-400 mb-2 sm:mb-0">
              © {currentYear} DebateMaster. Empowering debaters worldwide.
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-400">
                <Heart className="h-3 w-3 text-red-400 mr-1" />
                Made for passionate debaters
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Line */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </footer>
  );
};