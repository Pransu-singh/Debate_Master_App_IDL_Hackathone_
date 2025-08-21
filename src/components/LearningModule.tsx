import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, XCircle, Book, Clock, Trophy } from 'lucide-react';
import { Module, QuizQuestion } from '../types';

interface LearningModuleProps {
  module: Module;
  onComplete: (moduleId: string, xpGained: number) => void;
  onBack: () => void;
}

export const LearningModule: React.FC<LearningModuleProps> = ({ module, onComplete, onBack }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleSectionNext = () => {
    if (currentSection < module.content.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handleSectionPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowFeedback(true);
    
    if (answerIndex === module.content.quiz.questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleQuizNext = () => {
    if (currentQuestion < module.content.quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizCompleted(true);
      const finalScore = score + (selectedAnswer === module.content.quiz.questions[currentQuestion].correctAnswer ? 1 : 0);
      const xpGained = Math.floor((finalScore / module.content.quiz.questions.length) * module.xpReward);
      setTimeout(() => onComplete(module.id, xpGained), 2000);
    }
  };

  if (quizCompleted) {
    const finalScore = score + (selectedAnswer === module.content.quiz.questions[currentQuestion].correctAnswer ? 1 : 0);
    const percentage = Math.floor((finalScore / module.content.quiz.questions.length) * 100);
    const xpGained = Math.floor((finalScore / module.content.quiz.questions.length) * module.xpReward);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center p-8"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Module Complete!</h2>
          <p className="text-gray-600 mb-6">Congratulations on completing {module.title}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">+{xpGained}</div>
              <div className="text-sm text-gray-600">XP Gained</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{finalScore}/{module.content.quiz.questions.length}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      </motion.div>
    );
  }

  if (showQuiz) {
    const question = module.content.quiz.questions[currentQuestion];
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Time!</h2>
            <div className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {module.content.quiz.questions.length}
            </div>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / module.content.quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-6">{question.question}</h3>
            
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !showFeedback && handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    showFeedback
                      ? index === question.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : index === selectedAnswer
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                      : selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showFeedback && (
                      <div>
                        {index === question.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : index === selectedAnswer ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                <p className="text-blue-800">{question.explanation}</p>
                {question.fallacyType && (
                  <div className="mt-2 text-sm text-blue-700">
                    <strong>Fallacy Type:</strong> {question.fallacyType}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Modules
            </button>
            
            {showFeedback && (
              <button
                onClick={handleQuizNext}
                className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentQuestion < module.content.quiz.questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const section = module.content.sections[currentSection];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{module.title}</h1>
              <p className="text-blue-100">{module.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{module.estimatedTime} min</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                <span className="text-sm">{module.xpReward} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Section {currentSection + 1} of {module.content.sections.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentSection + 1) / (module.content.sections.length + 1)) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / (module.content.sections.length + 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Book className="h-6 w-6 mr-2 text-blue-600" />
              {section.title}
            </h2>
            
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 text-lg leading-relaxed">{section.content}</p>
            </div>

            {section.examples.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Examples:</h3>
                <div className="space-y-3">
                  {section.examples.map((example, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-800">{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.keyPoints.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Points:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-center bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-800">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={currentSection === 0 ? onBack : handleSectionPrev}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentSection === 0 ? 'Back to Modules' : 'Previous'}
          </button>
          
          <button
            onClick={handleSectionNext}
            className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentSection === module.content.sections.length - 1 ? 'Take Quiz' : 'Next Section'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};