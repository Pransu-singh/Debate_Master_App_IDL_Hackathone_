import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Eye, Target, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ConfidenceMetrics {
    speechConfidence: number; // 0-100
    facialConfidence: number; // 0-100
    eyeContact: number; // 0-100
    posture: number; // 0-100
    overallConfidence: number; // 0-100
    suggestions: string[];
}

interface WebcamDebateProps {
    onSpeechDetected: (transcript: string, confidence: ConfidenceMetrics) => void;
    onConfidenceUpdate: (metrics: ConfidenceMetrics) => void;
    isRecording: boolean;
    onRecordingChange: (recording: boolean) => void;
    debateTopic: string;
    userSide: 'pro' | 'con';
    onAISpeech?: (aiResponse: string) => void;
}

export const WebcamDebate: React.FC<WebcamDebateProps> = ({
    onSpeechDetected,
    onConfidenceUpdate,
    isRecording,
    onRecordingChange,
    debateTopic,
    userSide,
    onAISpeech
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [confidenceMetrics, setConfidenceMetrics] = useState<ConfidenceMetrics>({
        speechConfidence: 0,
        facialConfidence: 0,
        eyeContact: 0,
        posture: 0,
        overallConfidence: 0,
        suggestions: []
    });
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [debateHistory, setDebateHistory] = useState<Array<{ speaker: 'user' | 'ai', text: string, timestamp: Date }>>([]);
    const [lastUserSpeech, setLastUserSpeech] = useState('');
    const [waitingForAIResponse, setWaitingForAIResponse] = useState(false);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initialize webcam
    const startWebcam = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: true
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsWebcamActive(true);
                setError(null);
            }
        } catch (err) {
            setError('Failed to access webcam. Please check permissions.');
            console.error('Webcam error:', err);
        }
    }, []);

    // Stop webcam
    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsWebcamActive(false);
    }, []);

    // Initialize speech recognition
    const startSpeechRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setError(null);
                console.log('🎤 Speech recognition started');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Always update current transcript for real-time feedback
                const currentText = finalTranscript || interimTranscript;
                setCurrentTranscript(currentText);

                if (finalTranscript && finalTranscript.trim().length > 0) {
                    console.log('🎤 Final transcript:', finalTranscript);
                    
                    // Calculate updated confidence metrics with the new speech
                    const updatedMetrics = {
                        ...confidenceMetrics,
                        speechConfidence: Math.min(100, Math.max(0, 
                            Math.min(100, finalTranscript.length * 2 + (finalTranscript.split(' ').length * 3))
                        ))
                    };
                    
                    // Update overall confidence
                    updatedMetrics.overallConfidence = Math.round(
                        (updatedMetrics.facialConfidence + updatedMetrics.eyeContact + 
                         updatedMetrics.posture + updatedMetrics.speechConfidence) / 4
                    );
                    
                    setConfidenceMetrics(updatedMetrics);
                    onSpeechDetected(finalTranscript, updatedMetrics);
                    onConfidenceUpdate(updatedMetrics);
                    
                    // Add to debate history
                    setDebateHistory(prev => [...prev, { speaker: 'user', text: finalTranscript, timestamp: new Date() }]);

                    // Store last user speech for AI response
                    setLastUserSpeech(finalTranscript);
                    setWaitingForAIResponse(true);

                    // Clear current transcript after adding to history
                    setTimeout(() => setCurrentTranscript(''), 100);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'network') {
                    setError('Network error. Please check your internet connection.');
                } else if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone permissions.');
                } else if (event.error === 'no-speech') {
                    console.log('No speech detected, continuing...');
                    // Don't show error for no-speech, just continue
                } else {
                    setError(`Speech recognition error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                console.log('🎤 Speech recognition ended');
                if (isRecording && !isAISpeaking) {
                    // Automatically restart if we're still supposed to be recording
                    console.log('🔄 Auto-restarting speech recognition');
                    setTimeout(() => {
                        if (isRecording && !isAISpeaking) {
                            try {
                                recognition.start();
                            } catch (err) {
                                console.error('Failed to restart recognition:', err);
                            }
                        }
                    }, 100);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setError('Failed to start speech recognition. Please try again.');
        }
    }, [onSpeechDetected, confidenceMetrics, isRecording, isAISpeaking]);

    // Stop speech recognition
    const stopSpeechRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    }, []);

    // Generate AI response
    const generateAIResponse = useCallback(async (userSpeech: string) => {
        try {
            console.log('🤖 Generating AI response to:', userSpeech);

            // Create a more dynamic debate response based on the user's speech and position
            const aiSide = userSide === 'pro' ? 'con' : 'pro';
            
            // Generate different responses based on speech content
            let response = '';
            const speechLower = userSpeech.toLowerCase();
            
            if (speechLower.includes('benefit') || speechLower.includes('advantage') || speechLower.includes('good')) {
                response = `As the ${aiSide} side, I appreciate your perspective on the benefits of ${debateTopic}. However, I must present the potential drawbacks and risks that you may not have considered. The evidence suggests there are significant concerns that outweigh these benefits.`;
            } else if (speechLower.includes('problem') || speechLower.includes('issue') || speechLower.includes('bad')) {
                response = `I understand your concerns about ${debateTopic}, but as the ${aiSide} advocate, I believe you're overlooking the substantial positive impacts. Let me share some compelling evidence that challenges your position.`;
            } else if (speechLower.includes('research') || speechLower.includes('study') || speechLower.includes('evidence')) {
                response = `While you mention research supporting your view on ${debateTopic}, I have access to equally compelling studies that contradict your findings. Let me present alternative evidence that supports the ${aiSide} position.`;
            } else {
                response = `Thank you for sharing your thoughts on ${debateTopic}. As the ${aiSide} side, I respectfully disagree with your analysis. Let me offer a different perspective that challenges the core assumptions of your argument.`;
            }

            setDebateHistory(prev => [...prev, { speaker: 'ai', text: response, timestamp: new Date() }]);

            // Speak the response
            speakAIResponse(response);

            if (onAISpeech) {
                onAISpeech(response);
            }
        } catch (err) {
            console.error('Error generating AI response:', err);
            setError('Failed to generate AI response');
        }
    }, [debateTopic, userSide, onAISpeech]);

    // Speak AI response using speech synthesis
    const speakAIResponse = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) {
            setError('Speech synthesis not supported in this browser.');
            return;
        }

        // Stop any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        // Try to use a male voice for AI opponent
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(voice => voice.name.includes('Male') || voice.name.includes('David') || voice.name.includes('James'));
        if (maleVoice) {
            utterance.voice = maleVoice;
        }

        utterance.onstart = () => {
            setIsAISpeaking(true);
            console.log('🗣️ AI started speaking');
            // Stop user's speech recognition while AI is speaking
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };

        utterance.onend = () => {
            setIsAISpeaking(false);
            console.log('🗣️ AI finished speaking');
            // Don't automatically restart - let user control when to speak
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            setIsAISpeaking(false);
        };

        speechSynthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isRecording]);

    useEffect(() => {
        if (waitingForAIResponse && lastUserSpeech && !isAISpeaking) {
            // Auto-generate AI response after a short delay
            const timer = setTimeout(() => {
                if (waitingForAIResponse && lastUserSpeech) {
                    generateAIResponse(lastUserSpeech);
                    setWaitingForAIResponse(false);
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [waitingForAIResponse, lastUserSpeech, isAISpeaking, generateAIResponse]);

    // Analyze facial expressions and confidence
    const analyzeConfidence = useCallback(() => {
        if (!canvasRef.current || !videoRef.current || !isWebcamActive) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple confidence analysis based on brightness and color distribution
        // In a real implementation, you would use ML models for facial analysis
        let brightness = 0;
        let skinTonePixels = 0;
        let totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            brightness += (r + g + b) / 3;

            // Simple skin tone detection (very basic)
            if (r > 95 && g > 40 && b > 20 &&
                Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                Math.abs(r - g) > 15 && r > g && r > b) {
                skinTonePixels++;
            }
        }

        brightness = brightness / totalPixels;
        const skinToneRatio = skinTonePixels / totalPixels;

        // Calculate confidence metrics (simplified)
        const facialConfidence = Math.min(100, Math.max(0,
            (brightness / 255) * 40 + (skinToneRatio * 60)
        ));

        const eyeContact = Math.min(100, Math.max(0,
            (brightness / 255) * 50 + (skinToneRatio * 50)
        ));

        const posture = Math.min(100, Math.max(0,
            (skinToneRatio * 80) + (brightness / 255) * 20
        ));

        // Speech confidence based on transcript length and clarity
        const speechConfidence = Math.min(100, Math.max(0,
            currentTranscript.length > 0 ?
                Math.min(100, currentTranscript.length * 2 +
                    (currentTranscript.split(' ').length * 3)) : 0
        ));

        const overallConfidence = Math.round(
            (facialConfidence + eyeContact + posture + speechConfidence) / 4
        );

        // Generate suggestions
        const suggestions: string[] = [];
        if (facialConfidence < 50) suggestions.push('Try to face the camera more directly');
        if (eyeContact < 50) suggestions.push('Maintain better eye contact with the camera');
        if (posture < 50) suggestions.push('Sit up straight and maintain good posture');
        if (speechConfidence < 50) suggestions.push('Speak more clearly and confidently');
        if (overallConfidence < 60) suggestions.push('Take a deep breath and relax');

        const newMetrics: ConfidenceMetrics = {
            speechConfidence: Math.round(speechConfidence),
            facialConfidence: Math.round(facialConfidence),
            eyeContact: Math.round(eyeContact),
            posture: Math.round(posture),
            overallConfidence,
            suggestions
        };

        setConfidenceMetrics(newMetrics);
        onConfidenceUpdate(newMetrics);

        // Continue analysis
        animationFrameRef.current = requestAnimationFrame(analyzeConfidence);
    }, [isWebcamActive, currentTranscript, onConfidenceUpdate]);

    // Start/stop recording
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            console.log('⏹️ Stopping recording');
            stopSpeechRecognition();
            // Stop AI speech if it's speaking
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsAISpeaking(false);
            }
            onRecordingChange(false);
        } else {
            console.log('▶️ Starting recording');
            if (!isWebcamActive) {
                startWebcam();
            }
            startSpeechRecognition();
            onRecordingChange(true);
        }
    }, [isRecording, isWebcamActive, startWebcam, startSpeechRecognition, stopSpeechRecognition, onRecordingChange]);

    // Toggle webcam
    const toggleWebcam = useCallback(() => {
        if (isWebcamActive) {
            stopWebcam();
        } else {
            startWebcam();
        }
    }, [isWebcamActive, startWebcam, stopWebcam]);

    // Start confidence analysis when webcam is active
    useEffect(() => {
        if (isWebcamActive && isRecording) {
            analyzeConfidence();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isWebcamActive, isRecording, analyzeConfidence]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam();
            stopSpeechRecognition();
            // Stop any ongoing speech synthesis
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [stopWebcam, stopSpeechRecognition]);

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Webcam Section */}
                <div className="space-y-4">
                    <div className="bg-gray-900 rounded-lg overflow-hidden relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover"
                        />
                        <canvas
                            ref={canvasRef}
                            className="hidden"
                        />

                        {/* Overlay for confidence indicators */}
                        <div className="absolute top-4 left-4 space-y-2">
                            <AnimatePresence>
                                {isRecording && !isAISpeaking && !waitingForAIResponse && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        Recording
                                    </motion.div>
                                )}
                                {waitingForAIResponse && !isAISpeaking && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center space-x-2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        Waiting for AI Response
                                    </motion.div>
                                )}
                                {isAISpeaking && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center space-x-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                                    >
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        AI Speaking
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Confidence score overlay */}
                        <div className="absolute top-4 right-4">
                            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
                                <div className="text-sm font-medium">Confidence</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {confidenceMetrics.overallConfidence}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={toggleWebcam}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${isWebcamActive
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                            >
                                {isWebcamActive ? <VideoOff size={20} /> : <Video size={20} />}
                                <span>{isWebcamActive ? 'Stop Camera' : 'Start Camera'}</span>
                            </button>

                            <button
                                onClick={toggleRecording}
                                disabled={!isWebcamActive || isAISpeaking}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${isAISpeaking
                                    ? 'bg-blue-500 text-white cursor-not-allowed'
                                    : isRecording
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
                                    }`}
                            >
                                {isAISpeaking ? (
                                    <>
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span>AI Speaking...</span>
                                    </>
                                ) : (
                                    <>
                                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                                        <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* AI Response Controls */}
                        {waitingForAIResponse && !isAISpeaking && (
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => {
                                        if (lastUserSpeech) {
                                            generateAIResponse(lastUserSpeech);
                                            setWaitingForAIResponse(false);
                                        }
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>AI Respond</span>
                                </button>

                                <button
                                    onClick={() => setWaitingForAIResponse(false)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    <XCircle size={16} />
                                    <span>Skip AI</span>
                                </button>
                            </div>
                        )}

                        {/* Manual Restart Button */}
                        {isRecording && !isAISpeaking && !waitingForAIResponse && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => {
                                        console.log('🔄 Manually restarting speech recognition');
                                        if (recognitionRef.current) {
                                            recognitionRef.current.stop();
                                            setTimeout(() => {
                                                if (recognitionRef.current) {
                                                    recognitionRef.current.start();
                                                }
                                            }, 500);
                                        }
                                    }}
                                    className="flex items-center space-x-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Restart Mic</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Confidence Metrics Section */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                            <Target size={20} />
                            <span>Confidence Analysis</span>
                        </h3>

                        {/* Overall Confidence */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Overall Confidence</span>
                                <span className="text-lg font-bold text-green-600">
                                    {confidenceMetrics.overallConfidence}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <motion.div
                                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidenceMetrics.overallConfidence}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Individual Metrics */}
                        <div className="space-y-4">
                            <ConfidenceMetric
                                label="Speech Confidence"
                                value={confidenceMetrics.speechConfidence}
                                icon={<Mic size={16} />}
                            />
                            <ConfidenceMetric
                                label="Facial Confidence"
                                value={confidenceMetrics.facialConfidence}
                                icon={<Eye size={16} />}
                            />
                            <ConfidenceMetric
                                label="Eye Contact"
                                value={confidenceMetrics.eyeContact}
                                icon={<Eye size={16} />}
                            />
                            <ConfidenceMetric
                                label="Posture"
                                value={confidenceMetrics.posture}
                                icon={<TrendingUp size={16} />}
                            />
                        </div>

                        {/* Suggestions */}
                        {confidenceMetrics.suggestions.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-600 mb-2">Suggestions</h4>
                                <div className="space-y-2">
                                    {confidenceMetrics.suggestions.map((suggestion, index) => (
                                        <div key={index} className="flex items-start space-x-2 text-sm">
                                            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{suggestion}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Debate History */}
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">Debate Conversation</h3>
                        <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3">
                            {debateHistory.length === 0 ? (
                                <p className="text-gray-500 text-center">Start speaking to begin the debate...</p>
                            ) : (
                                debateHistory.map((entry, index) => (
                                    <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg ${entry.speaker === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                            }`}>
                                            <div className="text-xs opacity-75 mb-1">
                                                {entry.speaker === 'user' ? 'You' : 'AI Opponent'}
                                            </div>
                                            <p className="text-sm">{entry.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* AI Speaking Indicator */}
                            {isAISpeaking && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 text-gray-800 max-w-[80%] p-3 rounded-lg">
                                        <div className="text-xs opacity-75 mb-1">AI Opponent</div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-sm">AI is speaking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Transcript */}
                    {currentTranscript && (
                        <div className="bg-white rounded-lg p-6 shadow-lg">
                            <h3 className="text-lg font-semibold mb-4">Current Speech</h3>
                            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                                <p className="text-gray-800">{currentTranscript}</p>
                            </div>
                        </div>
                    )}

                    {/* Debate Info */}
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">Debate Information</h3>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Topic:</span>
                                <p className="text-gray-800 mt-1">{debateTopic}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Your Position:</span>
                                <p className="text-gray-800 mt-1 capitalize">{userSide}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Confidence Metric Component
interface ConfidenceMetricProps {
    label: string;
    value: number;
    icon: React.ReactNode;
}

const ConfidenceMetric: React.FC<ConfidenceMetricProps> = ({ label, value, icon }) => {
    const getColor = (value: number) => {
        if (value >= 80) return 'text-green-600';
        if (value >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getBarColor = (value: number) => {
        if (value >= 80) return 'bg-green-500';
        if (value >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    {icon}
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                </div>
                <span className={`text-sm font-bold ${getColor(value)}`}>
                    {value}%
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                    className={`h-2 rounded-full ${getBarColor(value)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
    );
};

export default WebcamDebate;
