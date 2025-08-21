import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Clock, Trophy, Target, AlertCircle, Zap, Key, ArrowLeft, Mic, Volume2, Camera, Rocket, Search, BarChart3, Timer, Lightbulb, CheckCircle, X, Loader2, Eye } from 'lucide-react';
import { DebateMessage, Feedback, ConfidenceMetrics } from '../types';
import { geminiService } from '../services/geminiService';
import Waveform from './Waveform';
import WebcamDebate from './WebcamDebate';

interface PracticeDebateProps {
  onComplete: (xpGained: number) => void;
  onBack: () => void;
}

type DebateFormat = 'text-speech' | 'direct-speech' | 'webcam-speech';

// Add debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const PracticeDebate: React.FC<PracticeDebateProps> = ({ onComplete, onBack }) => {
  const [topic, setTopic] = useState('');
  const [userSide, setUserSide] = useState<'pro' | 'con'>('pro');
  const [debateStarted, setDebateStarted] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [argumentCount, setArgumentCount] = useState(0);
  const [userTurn, setUserTurn] = useState(true);
  const [debateEnded, setDebateEnded] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<Feedback | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [speechLang] = useState('en-IN');
  const [debateFormat, setDebateFormat] = useState<DebateFormat>('text-speech');
  const [directSpeechTurn, setDirectSpeechTurn] = useState<'user' | 'ai'>('user');
  const [showFirstInstruction, setShowFirstInstruction] = useState(true);
  const [isDirectRecording, setIsDirectRecording] = useState(false);
  const directRecognitionRef = useRef<any>(null);
  const [aiSpeech, setAiSpeech] = useState<string>('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiSpeechSpeed, setAiSpeechSpeed] = useState(1);
  const [aiSpeechUtter, setAiSpeechUtter] = useState<SpeechSynthesisUtterance | null>(null);

  const DEFAULT_TOPICS = [
    'School uniforms should be mandatory',
    'Social media does more harm than good',
    'Homework should be banned',
    'Video games cause violence',
    'Remote learning is better than in-person education',
    'Artificial intelligence will replace human jobs',
    'Climate change is the most pressing global issue',
    'Nuclear energy is safer than renewable energy',
    'Standardized testing should be eliminated',
    'Universal basic income should be implemented'
  ];
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [topicInput, setTopicInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [topicValidation, setTopicValidation] = useState<{ valid: boolean, reason: string } | null>(null);
  const [validatingTopic, setValidatingTopic] = useState(false);
  const [fetchingCompletions, setFetchingCompletions] = useState(false);
  const [rephrasedSuggestions, setRephrasedSuggestions] = useState<string[]>([]);
  const [fetchingRephrased, setFetchingRephrased] = useState(false);

  // Webcam debate state
  const [currentConfidenceMetrics, setCurrentConfidenceMetrics] = useState<ConfidenceMetrics>({
    speechConfidence: 0,
    facialConfidence: 0,
    eyeContact: 0,
    posture: 0,
    overallConfidence: 0,
    suggestions: []
  });
  const [isWebcamRecording, setIsWebcamRecording] = useState(false);

  // Debounced Gemini validation
  const debouncedValidate = useRef(
    debounce(async (input: string) => {
      setValidatingTopic(true);
      try {
        const result = await geminiService.validateDebateTopic(input);
        setTopicValidation(result);
      } catch (e: any) {
        setTopicValidation({ valid: false, reason: e.message || 'Validation failed' });
      } finally {
        setValidatingTopic(false);
      }
    }, 400)
  ).current;

  // Debounced Gemini completions
  const debouncedCompletions = useRef(
    debounce(async (input: string) => {
      if (!aiConfigured || input.length < 4) return;
      setFetchingCompletions(true);
      try {
        const completions = await geminiService.suggestDebateCompletions(input);
        // Merge, dedupe, and filter
        const merged = Array.from(new Set([
          ...completions,
          ...suggestedTopics,
          ...DEFAULT_TOPICS
        ])).filter(t =>
          t.toLowerCase().includes(input.toLowerCase()) && t.toLowerCase() !== input.toLowerCase()
        ).slice(0, 10);
        setSuggestedTopics(merged);
      } catch {
        // fallback: keep current suggestions
      } finally {
        setFetchingCompletions(false);
      }
    }, 400)
  ).current;

  // On topic input change
  useEffect(() => {
    if (topicInput.length > 3) {
      debouncedValidate(topicInput);
      debouncedCompletions(topicInput);
    } else {
      setTopicValidation(null);
      setSuggestedTopics(DEFAULT_TOPICS);
    }
    setTopic(topicInput);
  }, [topicInput]);

  // Show suggestions when input is focused
  const handleInputFocus = () => {
    setShowSuggestions(true);
    fetchTopics();
  };

  // Filter suggestions as user types (already filtered in completions, but keep for fallback)
  const filteredSuggestions = suggestedTopics.filter(t =>
    t.toLowerCase().includes(topicInput.toLowerCase()) && t.toLowerCase() !== topicInput.toLowerCase()
  ).slice(0, 10);

  // Only allow starting debate if Gemini says topic is valid
  const canStartDebate = topicValidation && topicValidation.valid;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    setAiConfigured(!!apiKey);
    if (apiKey) {
      geminiService.reinitialize();
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages.length]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (debateStarted && !debateEnded && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && debateStarted) {
      endDebate();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, debateStarted, debateEnded]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (directRecognitionRef.current) {
        directRecognitionRef.current.onend = null;
        directRecognitionRef.current.onerror = null;
        directRecognitionRef.current.onresult = null;
        directRecognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const startDebate = () => {
    if (!topic) return;
    if (!aiConfigured) {
      setApiError('Gemini API key required for AI debate responses. Please add your API key first.');
      return;
    }
    setDebateStarted(true);
    setMessages([]);
    setArgumentCount(0);
    setUserTurn(userSide === 'pro');
    setApiError(null);
    if (userSide === 'con') {
      setTimeout(() => {
        generateAIResponse("", 1, []);
      }, 1000);
    }
  };

  const generateAIResponse = async (userArgument: string, currentArgument: number, history: string[]) => {
    setIsAiThinking(true);
    setApiError(null);
    try {
      const aiSide = userSide === 'pro' ? 'con' : 'pro';
      const response = await geminiService.generateDebateResponse(
        topic,
        userArgument,
        aiSide,
        currentArgument,
        history
      );
      const aiFeedback: Feedback = {
        score: Math.floor(Math.random() * 10) + 90,
        strengths: ['Well-structured argument', 'Strong evidence', 'Clear reasoning'],
        improvements: ['Could expand on examples'],
        fallaciesDetected: [],
        suggestions: ['Continue with strong rebuttals']
      };
      const aiMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'ai',
        content: response,
        timestamp: new Date(),
        feedback: aiFeedback
      };
      setMessages(prev => [...prev, aiMessage]);
      setUserTurn(true);
    } catch (error: any) {
      setApiError(error.message || 'Failed to generate AI response');
      setUserTurn(true);
      const errorMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'ai',
        content: `⚠️ AI Response Error: ${error.message || 'Unable to generate response'}`,
        timestamp: new Date(),
        feedback: {
          score: 0,
          strengths: [],
          improvements: [],
          fallaciesDetected: [],
          suggestions: ['Please check your Gemini API key and try again']
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Webcam debate handlers
  const handleWebcamSpeechDetected = async (transcript: string, confidence: ConfidenceMetrics) => {
    if (!transcript.trim() || !userTurn) return;
    setUserTurn(false);
    setApiError(null);
    const newArgumentCount = argumentCount + 1;
    setArgumentCount(newArgumentCount);

    try {
      const feedback = await geminiService.analyzeFeedback(
        transcript,
        topic,
        userSide,
        newArgumentCount
      );

      // Combine AI feedback with confidence metrics
      const enhancedFeedback: Feedback = {
        ...feedback,
        suggestions: [
          ...feedback.suggestions,
          ...confidence.suggestions
        ]
      };

      const userMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        content: transcript,
        timestamp: new Date(),
        feedback: enhancedFeedback
      };

      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');

      // Generate AI response
      setTimeout(() => {
        generateAIResponse(transcript, newArgumentCount, messages.map(m => m.content));
      }, 1000);

    } catch (error: any) {
      setApiError(error.message || 'Failed to analyze speech');
      setUserTurn(true);
    }
  };

  const handleWebcamConfidenceUpdate = (metrics: ConfidenceMetrics) => {
    setCurrentConfidenceMetrics(metrics);
  };

  const handleWebcamRecordingChange = (recording: boolean) => {
    setIsWebcamRecording(recording);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !userTurn) return;
    setUserTurn(false);
    setApiError(null);
    const newArgumentCount = argumentCount + 1;
    setArgumentCount(newArgumentCount);
    try {
      const feedback = await geminiService.analyzeFeedback(
        currentMessage,
        topic,
        userSide,
        newArgumentCount
      );
      const userMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        content: currentMessage,
        timestamp: new Date(),
        feedback
      };
      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        return newMessages;
      });
      const messageHistory = [...messages.map(m => `${m.speaker}: ${m.content}`), `user: ${currentMessage}`];
      const currentUserMessage = currentMessage;
      setCurrentMessage('');
      setTimeout(() => {
        generateAIResponse(currentUserMessage, newArgumentCount, messageHistory);
      }, 1500);
    } catch (error: any) {
      setApiError(error.message || 'Failed to analyze your message');
      const userMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        content: currentMessage,
        timestamp: new Date(),
        feedback: {
          score: 0,
          strengths: [],
          improvements: [],
          fallaciesDetected: [],
          suggestions: ['Unable to analyze - please check your Gemini API key']
        }
      };
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');
      setUserTurn(true);
    }
  };

  const endDebate = async () => {
    setDebateEnded(true);
    setUserTurn(false);
    const userMessages = messages.filter(m => m.speaker === 'user');
    const avgScore = userMessages.length > 0
      ? Math.round(userMessages.reduce((sum, m) => sum + (m.feedback?.score || 0), 0) / userMessages.length)
      : 75;
    const allStrengths = userMessages.flatMap(m => m.feedback?.strengths || []);
    const allImprovements = userMessages.flatMap(m => m.feedback?.improvements || []);
    const allFallacies = userMessages.flatMap(m => m.feedback?.fallaciesDetected || []);
    const allSuggestions = userMessages.flatMap(m => m.feedback?.suggestions || []);
    const feedback: Feedback = {
      score: avgScore,
      strengths: [...new Set(allStrengths)].slice(0, 3),
      improvements: [...new Set(allImprovements)].slice(0, 3),
      fallaciesDetected: [...new Set(allFallacies)],
      suggestions: [...new Set(allSuggestions)].slice(0, 3)
    };
    setFinalFeedback(feedback);
    const baseXP = Math.floor(avgScore * 2.5);
    const argumentBonus = Math.min(userMessages.length * 10, 100);
    const totalXP = baseXP + argumentBonus;
    setTimeout(() => onComplete(totalXP), 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetDebate = () => {
    setDebateStarted(false);
    setDebateEnded(false);
    setMessages([]);
    setCurrentMessage('');
    setTimeRemaining(300);
    setArgumentCount(0);
    setUserTurn(true);
    setFinalFeedback(null);
    setIsAiThinking(false);
    setApiError(null);
    setTopic('');
    setUserSide('pro');
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setRecordingError(null);
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecordingError('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = (event: any) => {
      setRecordingError('Speech recognition error: ' + event.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSpeak = (messageId: string, text: string) => {
    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(messageId);
    const utter = new window.SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN'));
    if (preferredVoices.length > 0) {
      utter.voice = preferredVoices[0];
    }
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  };

  const handleDirectMicClick = () => {
    if (isDirectRecording) {
      stopDirectRecording();
    } else {
      startDirectRecording();
    }
  };

  const startDirectRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    setIsDirectRecording(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsDirectRecording(false);
      setShowFirstInstruction(false);
      setDirectSpeechTurn('ai');
      const aiResponse = await geminiService.generateDebateResponse(
        topic,
        transcript,
        userSide === 'pro' ? 'con' : 'pro',
        argumentCount + 1,
        []
      );
      setAiSpeech(aiResponse);
      setArgumentCount((prev) => prev + 1);
      playAiSpeech(aiResponse, aiSpeechSpeed);
    };
    recognition.onerror = (event: any) => {
      setIsDirectRecording(false);
      alert('Speech recognition error: ' + event.error);
    };
    recognition.onend = () => {
      setIsDirectRecording(false);
    };
    directRecognitionRef.current = recognition;
    recognition.start();
  };

  const stopDirectRecording = () => {
    if (directRecognitionRef.current) {
      directRecognitionRef.current.stop();
    }
    setIsDirectRecording(false);
  };

  const playAiSpeech = (text: string, speed: number) => {
    window.speechSynthesis.cancel();
    setAiSpeaking(true);
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN'));
    if (preferredVoices.length > 0) {
      utter.voice = preferredVoices[0];
    }
    utter.onend = () => {
      setAiSpeaking(false);
      setDirectSpeechTurn('user');
      setAiSpeechUtter(null);
    };
    utter.onerror = () => {
      setAiSpeaking(false);
      setDirectSpeechTurn('user');
      setAiSpeechUtter(null);
    };
    setAiSpeechUtter(utter);
    window.speechSynthesis.speak(utter);
  };

  const handleAiSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setAiSpeechSpeed(newSpeed);
    if (aiSpeaking && aiSpeechUtter) {
      window.speechSynthesis.cancel();
      playAiSpeech(aiSpeech, newSpeed);
    }
  };

  const handleAiReplay = () => {
    if (aiSpeech) {
      playAiSpeech(aiSpeech, aiSpeechSpeed);
    }
  };

  // Fetch topics from Gemini when selector opens
  const fetchTopics = async () => {
    if (!aiConfigured) {
      setSuggestedTopics(DEFAULT_TOPICS);
      return;
    }
    setFetchingTopics(true);
    try {
      const aiTopics = await geminiService.suggestDebateTopics();
      const merged = Array.from(new Set([...aiTopics, ...DEFAULT_TOPICS]));
      setSuggestedTopics(merged);
    } catch (e) {
      setSuggestedTopics(DEFAULT_TOPICS);
    } finally {
      setFetchingTopics(false);
    }
  };

  // Fetch rephrased suggestions when topic is invalid
  useEffect(() => {
    if (topicValidation && !topicValidation.valid && topicInput.length > 3) {
      setFetchingRephrased(true);
      geminiService.getRephrasedDebateTopics(topicInput)
        .then(suggestions => setRephrasedSuggestions(suggestions))
        .catch(() => setRephrasedSuggestions([]))
        .finally(() => setFetchingRephrased(false));
    } else {
      setRephrasedSuggestions([]);
      setFetchingRephrased(false);
    }
  }, [topicValidation, topicInput]);

  if (debateEnded && finalFeedback) {
    const userMessages = messages.filter(m => m.speaker === 'user');
    const argumentBonus = Math.min(userMessages.length * 10, 100);
    const baseXP = Math.floor(finalFeedback.score * 2.5);
    const totalXP = baseXP + argumentBonus;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
            {/* Header Section - Compact */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Debate Complete!
              </h2>
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-gray-700 font-medium text-sm">Topic: "{topic}"</p>
                <p className="text-gray-600 text-xs mt-1">Position: {userSide === 'pro' ? 'FOR' : 'AGAINST'}</p>
              </div>
              <p className="text-gray-600 text-sm">Performance Analysis</p>
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">{finalFeedback.score}</div>
                <div className="text-blue-800 text-xs">Overall Score</div>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{width: `${finalFeedback.score}%`}}></div>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">{userMessages.length}</div>
                <div className="text-green-800 text-xs">Arguments Made</div>
                <div className="flex items-center justify-center mt-2">
                  <BarChart3 className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600 mb-1">+{argumentBonus}</div>
                <div className="text-purple-800 text-xs">Argument Bonus XP</div>
                <div className="flex items-center justify-center mt-2">
                  <Zap className="h-3 w-3 text-purple-600" />
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">+{totalXP}</div>
                <div className="text-orange-800 text-xs">Total XP Earned</div>
                <div className="flex items-center justify-center mt-2">
                  <Trophy className="h-3 w-3 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3 flex items-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {finalFeedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {finalFeedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {finalFeedback.fallaciesDetected.length > 0 && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Logical Fallacies Detected
                </h3>
                <div className="space-y-3">
                  {finalFeedback.fallaciesDetected.map((fallacy, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-red-100">
                      <div className="text-red-800 font-medium text-sm sm:text-base mb-1">
                        • {fallacy}
                      </div>
                      <div className="text-red-600 text-xs sm:text-sm">
                        {fallacy.toLowerCase().includes('non sequitur') &&
                          "A conclusion that doesn't logically follow from the premises"
                        }
                        {fallacy.toLowerCase().includes('ad hominem') &&
                          "Attacking the person making the argument rather than the argument itself"
                        }
                        {fallacy.toLowerCase().includes('straw man') &&
                          "Misrepresenting someone's argument to make it easier to attack"
                        }
                        {fallacy.toLowerCase().includes('false dilemma') &&
                          "Presenting only two options when more alternatives exist"
                        }
                        {fallacy.toLowerCase().includes('slippery slope') &&
                          "Assuming one event will lead to a chain of negative consequences"
                        }
                        {!fallacy.toLowerCase().includes('non sequitur') &&
                          !fallacy.toLowerCase().includes('ad hominem') &&
                          !fallacy.toLowerCase().includes('straw man') &&
                          !fallacy.toLowerCase().includes('false dilemma') &&
                          !fallacy.toLowerCase().includes('slippery slope') &&
                          "A logical error that weakens the argument"
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-3 flex items-center">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Suggestions for Next Time
              </h3>
              <ul className="space-y-2">
                {finalFeedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
              <div className="flex items-center mb-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Breakdown</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Base Score XP:</span>
                  <span className="font-semibold text-blue-600 ml-2">+{baseXP}</span>
                </div>
                <div>
                  <span className="text-gray-600">Argument Bonus:</span>
                  <span className="font-semibold text-purple-600 ml-2">+{argumentBonus} ({userMessages.length} arguments)</span>
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-gray-600 flex items-center">
                <Lightbulb className="h-3 w-3 mr-1 text-yellow-500" />
                Make more arguments within the time limit to earn bonus XP!
              </div>
            </div>

            <div className="text-center space-y-3">
              <button
                onClick={resetDebate}
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base mr-4"
              >
                Practice Again
              </button>
              <button
                onClick={onBack}
                className="bg-gray-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Back to Practice Menu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!debateStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Practice
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="relative mb-3">
                <div className="flex items-center justify-center p-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full mr-3">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Unlimited AI Debate Challenge</h1>
                </div>
              </div>
              <p className="text-gray-700 mb-4 text-base font-medium">
                Make as many arguments as you can in 5 minutes! Each argument earns bonus XP.
              </p>

              {!aiConfigured && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-red-800 font-semibold text-sm sm:text-base">Gemini API Key Required</p>
                      <p className="text-red-700 text-xs sm:text-sm">
                        Real-time AI responses require a valid Gemini API key. Please add your API key using the "Setup AI" button in the header.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiConfigured && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4 max-w-lg mx-auto">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center mb-1">
                        <Bot className="h-4 w-4 text-green-600 mr-2" />
                        <p className="text-green-800 font-semibold text-sm">Real-Time AI Enabled</p>
                      </div>
                      <p className="text-green-700 text-xs">
                        Live Gemini AI responses and real-time feedback analysis are ready!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-red-800 font-medium text-sm sm:text-base">API Error</p>
                      <p className="text-red-700 text-xs sm:text-sm">{apiError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="max-w-3xl mx-auto space-y-5">
              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Choose a debate topic:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 sm:p-4 rounded-lg border-2 text-sm sm:text-base focus:outline-none focus:border-blue-500"
                    placeholder="Type or select a topic..."
                    value={topicInput}
                    onChange={e => {
                      setTopicInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={handleInputFocus}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {(fetchingTopics || fetchingCompletions) && (
                    <div className="absolute right-3 top-3 text-blue-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {filteredSuggestions.map((s, idx) => (
                        <button
                          key={s + idx}
                          type="button"
                          className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-sm sm:text-base"
                          onMouseDown={() => {
                            setTopicInput(s);
                            setShowSuggestions(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {validatingTopic && (
                  <div className="text-blue-500 text-xs mt-2">Checking topic validity...</div>
                )}
                {topicValidation && (
                  <div className={
                    topicValidation.valid
                      ? 'text-green-600 text-xs mt-2'
                      : 'text-red-500 text-xs mt-2'
                  }>
                    <div className="flex items-center">
                      {topicValidation.valid ? (
                        <><CheckCircle className="h-4 w-4 mr-1" /> Valid debate topic!</>
                      ) : (
                        <><X className="h-4 w-4 mr-1" /> {topicValidation.reason}</>
                      )}
                    </div>
                  </div>
                )}
                {/* Show rephrased suggestions if topic is invalid */}
                {(!topicValidation?.valid && rephrasedSuggestions.length > 0) && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Try one of these instead:</div>
                    <div className="flex flex-col gap-1">
                      {rephrasedSuggestions.map((s, idx) => (
                        <button
                          key={s + idx}
                          type="button"
                          className="text-left px-3 py-2 rounded bg-gray-100 hover:bg-blue-50 border border-gray-200 text-sm"
                          onClick={() => {
                            setTopicInput(s);
                            setShowSuggestions(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {fetchingRephrased && !topicValidation?.valid && (
                  <div className="text-blue-400 text-xs mt-2 flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting better topic suggestions...
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Choose your position:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserSide('pro')}
                    className={`p-3 rounded-xl border-2 transition-all ${userSide === 'pro'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="text-base font-bold text-green-700">FOR (Pro)</div>
                    <div className="text-xs text-gray-600">You support the statement</div>
                  </button>
                  <button
                    onClick={() => setUserSide('con')}
                    className={`p-3 rounded-xl border-2 transition-all ${userSide === 'con'
                      ? 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50 shadow-md'
                      : 'border-gray-200 hover:border-red-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="text-base font-bold text-red-700">AGAINST (Con)</div>
                    <div className="text-xs text-gray-600">You oppose the statement</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Choose debate format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setDebateFormat('text-speech')}
                    className={`p-4 rounded-xl border-2 transition-all ${debateFormat === 'text-speech'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="text-base font-bold text-blue-700 mb-2">Text + Speech</div>
                    <div className="text-xs text-gray-600">Type or speak your arguments</div>
                  </button>
                  <button
                    onClick={() => setDebateFormat('direct-speech')}
                    className={`p-4 rounded-xl border-2 transition-all ${debateFormat === 'direct-speech'
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="text-base font-bold text-purple-700 mb-2">Direct Speech</div>
                    <div className="text-xs text-gray-600">Voice-only debate</div>
                  </button>
                  <button
                    onClick={() => setDebateFormat('webcam-speech')}
                    className={`p-4 rounded-xl border-2 transition-all ${debateFormat === 'webcam-speech'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                      }`}
                  >
                    <div className="text-base font-bold text-green-700 flex items-center justify-center mb-2">
                      <Camera className="w-4 h-4 mr-2" />
                      Webcam Debate
                    </div>
                    <div className="text-xs text-gray-600">Video + confidence analysis</div>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                    <Rocket className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">Unlimited Debate Features:</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 mb-3">
                  <div className="flex items-center p-2 bg-white/50 rounded-lg"><Bot className="h-3 w-3 mr-2 text-blue-600 flex-shrink-0" /> <strong>Live AI responses</strong> to every argument</div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg"><Search className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" /> <strong>Real-time analysis</strong> and scoring</div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg"><BarChart3 className="h-3 w-3 mr-2 text-purple-600 flex-shrink-0" /> <strong>Instant feedback</strong> on improvements</div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg"><AlertCircle className="h-3 w-3 mr-2 text-red-600 flex-shrink-0" /> <strong>Fallacy detection</strong> as you debate</div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg"><Timer className="h-3 w-3 mr-2 text-orange-600 flex-shrink-0" /> <strong>5-minute limit</strong> unlimited arguments</div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg"><Target className="h-3 w-3 mr-2 text-indigo-600 flex-shrink-0" /> <strong>Bonus XP</strong> (+10 XP per argument)</div>
                </div>
                <div className="p-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start text-xs text-yellow-800">
                    <div className="bg-yellow-100 p-1 rounded-lg mr-2">
                      <Lightbulb className="h-3 w-3 text-yellow-600" />
                    </div>
                    <p><strong>Pro Tip:</strong> Make as many quality arguments as possible! You earn +10 bonus XP for each argument, up to +100 XP total.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startDebate}
                disabled={!topic || !aiConfigured || !canStartDebate}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-lg font-medium text-base disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              >
                {!aiConfigured ? (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    Add API Key to Start
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Start Unlimited AI Debate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (debateFormat === 'webcam-speech') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-2 sm:p-4">
        <div className="max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-green-700 mb-2">Webcam Debate</h1>
                <p className="text-gray-600">Video-based debate with real-time confidence analysis</p>
              </div>
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setDebateFormat('text-speech')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Switch to Text+Speech
              </button>
              <button
                onClick={() => setDebateFormat('direct-speech')}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
              >
                Switch to Direct Speech
              </button>
            </div>
          </div>

          {!debateStarted ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Start Webcam Debate</h2>
              <p className="text-gray-600 mb-6">
                Use your webcam and microphone for a video-based debate experience with real-time confidence scoring.
              </p>
              <button
                onClick={startDebate}
                disabled={!topic || !aiConfigured || !canStartDebate}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {!aiConfigured ? (
                  <>
                    <Key className="h-5 w-5 mr-2" />
                    Add API Key to Start
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5 mr-2" />
                    Start Webcam Debate
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Webcam Component */}
              <div className="lg:col-span-2">
                <WebcamDebate
                  onSpeechDetected={handleWebcamSpeechDetected}
                  onConfidenceUpdate={handleWebcamConfidenceUpdate}
                  isRecording={isWebcamRecording}
                  onRecordingChange={handleWebcamRecordingChange}
                  debateTopic={topic}
                  userSide={userSide}
                  onAISpeech={(aiResponse) => {
                    // Add AI response to messages
                    const newMessage: DebateMessage = {
                      id: Date.now().toString(),
                      speaker: 'ai',
                      content: aiResponse,
                      timestamp: new Date(),
                      feedback: undefined
                    };
                    setMessages(prev => [...prev, newMessage]);
                  }}
                />
              </div>

              {/* Debate Info Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Debate Info</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Topic:</span>
                      <p className="text-gray-800 mt-1">{topic}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Your Position:</span>
                      <p className="text-gray-800 mt-1 capitalize">{userSide}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Time Left:</span>
                      <p className="text-gray-800 mt-1 font-mono">{formatTime(timeRemaining)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Arguments:</span>
                      <p className="text-gray-800 mt-1">{argumentCount}</p>
                    </div>
                  </div>
                  
                  {/* Stop Debate Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={endDebate}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      End Debate Early
                    </button>
                  </div>
                </div>

                {/* Current Confidence Score */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Confidence</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {currentConfidenceMetrics.overallConfidence}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Overall confidence score
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Debate Messages</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${message.speaker === 'user'
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-gray-50 border-l-4 border-gray-500'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {message.speaker === 'user' ? 'You' : 'AI'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{message.content}</p>
                        {message.feedback && (
                          <div className="mt-2 text-xs text-gray-600">
                            Score: {message.feedback.score}/100
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (debateFormat === 'direct-speech') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4">
        <div className="max-w-7xl w-full mx-auto">
          {/* Header - Compact */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold text-purple-700 mb-1">Direct Speech Debate</h1>
                <p className="text-sm text-gray-600">Voice-only debate with turn-based conversation</p>
              </div>
              <button
                onClick={onBack}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setDebateFormat('text-speech')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center text-sm"
              >
                <Send className="h-4 w-4 mr-1" />
                Switch to Text+Speech
              </button>
              <button
                onClick={() => setDebateFormat('webcam-speech')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center text-sm"
              >
                <Camera className="h-4 w-4 mr-1" />
                Switch to Webcam
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Speech Interface - Extended Height */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full flex flex-col justify-center">
                {showFirstInstruction && (
                  <div className="mb-8 text-center text-gray-500 text-lg animate-fade-in bg-blue-50 p-6 rounded-lg">
                    <Mic className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    Press your mic button to speak when it's your turn
                  </div>
                )}
                
                <div className="flex justify-center items-center space-x-16 flex-1">
                  {/* User Mic */}
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <button
                        className={`rounded-full w-40 h-40 flex items-center justify-center border-4 transition-all shadow-xl ${directSpeechTurn === 'user' ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-purple-200 animate-pulse shadow-purple-200' : 'border-gray-300 bg-gray-100'}`}
                        disabled={directSpeechTurn !== 'user' || isDirectRecording}
                        onClick={handleDirectMicClick}
                      >
                        <Mic className={`h-20 w-20 ${directSpeechTurn === 'user' ? 'text-purple-700' : 'text-gray-400'}`} />
                      </button>
                      {directSpeechTurn === 'user' && (
                        <div className="absolute -top-3 -right-3 bg-purple-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                          Your Turn
                        </div>
                      )}
                    </div>
                    <div className={`text-xl font-bold ${directSpeechTurn === 'user' ? 'text-purple-700' : 'text-gray-500'}`}>
                      You
                    </div>
                    {directSpeechTurn === 'user' && isDirectRecording && (
                      <div className="flex flex-col items-center space-y-3">
                        <Waveform active={true} className="" />
                        <span className="text-base text-purple-600 font-medium">Recording...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* VS Indicator */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-5xl font-bold text-gray-400 mb-2">VS</div>
                    <div className="text-lg text-gray-500 font-medium">Turn-based Debate</div>
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 w-24 rounded-full"></div>
                  </div>
                  
                  {/* AI Mic */}
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <button
                        className={`rounded-full w-40 h-40 flex items-center justify-center border-4 transition-all shadow-xl ${directSpeechTurn === 'ai' ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 animate-pulse shadow-blue-200' : 'border-gray-300 bg-gray-100'}`}
                        disabled={directSpeechTurn !== 'ai'}
                        onClick={handleAiReplay}
                      >
                        <Bot className={`h-20 w-20 ${directSpeechTurn === 'ai' ? 'text-blue-700' : 'text-gray-400'}`} />
                      </button>
                      {directSpeechTurn === 'ai' && (
                        <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                          AI Turn
                        </div>
                      )}
                    </div>
                    <div className={`text-xl font-bold ${directSpeechTurn === 'ai' ? 'text-blue-700' : 'text-gray-500'}`}>
                      AI Agent
                    </div>
                    {directSpeechTurn === 'ai' && aiSpeaking && (
                      <div className="flex flex-col items-center space-y-3">
                        <Waveform active={true} className="" />
                        <span className="text-base text-blue-600 font-medium">AI Speaking...</span>
                      </div>
                    )}
                    {directSpeechTurn === 'ai' && aiSpeech && (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-xl">
                          <Volume2 className="h-6 w-6 text-blue-500" />
                          <select
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={aiSpeechSpeed}
                            onChange={handleAiSpeedChange}
                          >
                            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((speed) => (
                              <option key={speed} value={speed}>{speed}x</option>
                            ))}
                          </select>
                          <button
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center"
                            onClick={handleAiReplay}
                            disabled={directSpeechTurn !== 'ai'}
                          >
                            <Volume2 className="h-5 w-5 mr-2" />
                            Replay
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar - Compact */}
            <div className="space-y-3">
              {/* End Debate Button - Compact */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <button
                  onClick={endDebate}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  End Debate Early
                </button>
              </div>
              
              {/* Timer - Compact */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-700 text-sm">Time Left</span>
                  </div>
                  <span className="font-mono text-xl text-blue-600">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              
              {/* Debate Info - Compact */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-600" />
                  You vs AI Agent
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">Topic:</span>
                    <p className="text-gray-800 mt-1 text-xs">{topic}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">Your Position:</span>
                    <p className="text-gray-800 mt-1 capitalize font-medium text-xs">{userSide}</p>
                  </div>
                </div>
              </div>
              
              {/* XP Tracker - Compact */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                  XP & Progress
                </h3>
                
                {/* Main Stats in Grid - Compact */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{argumentCount}</div>
                    <div className="text-xs text-gray-600">Arguments Made</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600 mb-1">+{Math.min(argumentCount * 10, 100)}</div>
                    <div className="text-xs text-gray-600">Bonus XP</div>
                  </div>
                </div>
                
                {/* Progress Bar - Compact */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-700">Progress to Max Bonus</span>
                    <span className="text-xs text-gray-600">{argumentCount}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((argumentCount / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Info Box - Compact */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center">
                    <Trophy className="h-3 w-3 text-yellow-600 mr-1" />
                    <span className="text-xs text-yellow-800 font-medium">
                      Each argument = +10 XP (Max: 100 XP)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">{topic}</h2>
                    <p className="text-blue-100 text-xs sm:text-sm">You are arguing {userSide === 'pro' ? 'FOR' : 'AGAINST'}</p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm text-blue-100">Real-Time Gemini AI</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 sm:space-y-2">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="font-mono text-sm sm:text-lg">{formatTime(timeRemaining)}</span>
                    </div>
                    <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      {argumentCount} arguments
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setDebateFormat('direct-speech')}
                    className="mb-4 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    Switch to Direct Speech
                  </button>
                </div>
              </div>

              {apiError && (
                <div className="bg-red-50 border-b border-red-200 p-3 sm:p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 text-xs sm:text-sm">{apiError}</span>
                  </div>
                </div>
              )}

              <div className="h-64 sm:h-96 flex flex-col">
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl p-3 sm:p-4 rounded-lg relative flex flex-col ${message.speaker === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.content.includes('⚠️')
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                          }`}>
                          <div className="flex items-center mb-2">
                            {message.speaker === 'user' ? (
                              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            ) : (
                              <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            )}
                            <span className="text-xs sm:text-sm font-medium">
                              {message.speaker === 'user' ? 'You' : 'Gemini AI'}
                            </span>
                            <button
                              type="button"
                              className={`ml-2 p-1 rounded-full border transition-colors flex-shrink-0 ${speakingId && speakingId !== message.id ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-purple-50 text-purple-700'}`}
                              aria-label={speakingId === message.id ? 'Stop playback' : 'Play message'}
                              onClick={() => speakingId && speakingId !== message.id ? undefined : handleSpeak(message.id, message.content)}
                              disabled={!!speakingId && speakingId !== message.id}
                            >
                              <Volume2 className={`h-4 w-4 ${speakingId === message.id ? 'text-purple-600 animate-pulse' : ''}`} />
                            </button>
                            {speakingId === message.id && (
                              <Waveform active={true} className="ml-1" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm">{message.content}</p>
                          {message.feedback && message.feedback.score > 0 && (
                            <div className="mt-2 text-xs opacity-75">
                              Score: {message.feedback.score}/100
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isAiThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 text-gray-900 p-3 sm:p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            <span className="text-xs sm:text-sm font-medium">Gemini AI</span>
                          </div>
                          <div className="flex items-center">
                            <div className="animate-pulse flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">Generating real-time response...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-gray-200 p-3 sm:p-4">
                <div className="flex space-x-2 sm:space-x-3 items-center">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder={userTurn ? "Type your argument..." : isAiThinking ? "AI is generating response..." : "Waiting for AI response..."}
                    disabled={!userTurn}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={!userTurn || isAiThinking}
                    className={`p-2 sm:p-3 rounded-lg border transition-colors flex-shrink-0 ${isRecording ? 'bg-purple-100 border-purple-400' : 'bg-white border-gray-300 hover:bg-purple-50'}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <Mic className={`h-5 w-5 ${isRecording ? 'text-purple-600 animate-pulse' : 'text-gray-700'}`} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!userTurn || !currentMessage.trim()}
                    className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  {isRecording && (
                    <Waveform active={true} className="ml-2" />
                  )}
                </div>
                {recordingError && (
                  <div className="text-xs text-red-600 mt-1">{recordingError}</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Live AI Feedback
              </h3>
              {messages.length > 0 && messages[messages.length - 1].speaker === 'user' && messages[messages.length - 1].feedback && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {messages[messages.length - 1].feedback!.score}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Latest Score</div>
                  </div>

                  {messages[messages.length - 1].feedback!.strengths.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-green-700 mb-1">Strengths:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {messages[messages.length - 1].feedback!.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {messages[messages.length - 1].feedback!.fallaciesDetected.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-red-700 mb-1">Fallacies Detected:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {messages[messages.length - 1].feedback!.fallaciesDetected.map((fallacy, index) => (
                          <li key={index}>• {fallacy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                Argument Tracker
              </h3>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">{argumentCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Arguments Made</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">+{Math.min(argumentCount * 10, 100)}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Bonus XP</div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Max bonus: +100 XP (10 arguments)
                </div>
                
                {/* Stop Debate Button */}
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={endDebate}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    End Debate Early
                  </button>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 ${aiConfigured ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-2">
                <Bot className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${aiConfigured ? 'text-green-600' : 'text-red-600'}`} />
                <h3 className={`font-medium text-sm sm:text-base ${aiConfigured ? 'text-green-800' : 'text-red-800'}`}>
                  {aiConfigured ? 'Real-Time AI Active' : 'API Key Required'}
                </h3>
              </div>
              <p className={`text-xs ${aiConfigured ? 'text-green-700' : 'text-red-700'}`}>
                {aiConfigured
                  ? 'Live Gemini AI responses and real-time feedback analysis enabled'
                  : 'Add your Gemini API key to enable real-time AI responses'
                }
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                Unlimited Debate Tips
              </h3>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2">
                <li className="flex items-center"><Zap className="h-3 w-3 mr-2 text-orange-500" />Make multiple arguments quickly</li>
                <li className="flex items-center"><Trophy className="h-3 w-3 mr-2 text-yellow-500" />Each argument earns +10 bonus XP</li>
                <li className="flex items-center"><Target className="h-3 w-3 mr-2 text-blue-500" />Quality over quantity still matters</li>
                <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" />Use specific examples and evidence</li>
                <li className="flex items-center"><Bot className="h-3 w-3 mr-2 text-purple-500" />Address AI counterarguments directly</li>
                <li className="flex items-center"><Eye className="h-3 w-3 mr-2 text-indigo-500" />Stay focused on the topic</li>
                <li className="flex items-center"><AlertCircle className="h-3 w-3 mr-2 text-red-500" />Avoid logical fallacies</li>
              </ul>
            </div>

            <div className="lg:hidden">
              <button
                onClick={onBack}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
