import { GoogleGenerativeAI } from '@google/generative-ai';
import { Feedback } from '../types';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKeyValid: boolean = false;
  private callCount: number = 0;
  
  // Rate limiting and quota management
  private dailyCallCount: number = 0;
  private dailyTokenCount: number = 0;
  private lastResetDate: string = new Date().toDateString();
  private callHistory: Array<{timestamp: number, tokens: number}> = [];
  private isQuotaExceeded: boolean = false;
  
  // Free tier limits
  private readonly DAILY_CALL_LIMIT = 50;
  private readonly DAILY_TOKEN_LIMIT = 15000;
  private readonly CALLS_PER_MINUTE = 1; // Free tier: 1 call per minute

  constructor() {
    this.initializeAPI();
    this.loadDailyStats();
    this.resetDailyStatsIfNeeded();
  }

  private loadDailyStats() {
    try {
      const saved = localStorage.getItem('gemini_daily_stats');
      if (saved) {
        const stats = JSON.parse(saved);
        this.dailyCallCount = stats.callCount || 0;
        this.dailyTokenCount = stats.tokenCount || 0;
        this.lastResetDate = stats.lastResetDate || new Date().toDateString();
        this.isQuotaExceeded = stats.isQuotaExceeded || false;
      }
    } catch (error) {
      console.warn('Failed to load daily stats:', error);
    }
  }

  private saveDailyStats() {
    try {
      const stats = {
        callCount: this.dailyCallCount,
        tokenCount: this.dailyTokenCount,
        lastResetDate: this.lastResetDate,
        isQuotaExceeded: this.isQuotaExceeded
      };
      localStorage.setItem('gemini_daily_stats', JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to save daily stats:', error);
    }
  }

  private resetDailyStatsIfNeeded() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      console.log('🔄 Resetting daily API usage stats');
      this.dailyCallCount = 0;
      this.dailyTokenCount = 0;
      this.lastResetDate = today;
      this.isQuotaExceeded = false;
      this.saveDailyStats();
    }
  }

  private checkQuotaLimits(): { canMakeCall: boolean; reason?: string; waitTime?: number } {
    this.resetDailyStatsIfNeeded();
    
    // Check daily call limit
    if (this.dailyCallCount >= this.DAILY_CALL_LIMIT) {
      this.isQuotaExceeded = true;
      this.saveDailyStats();
      return { 
        canMakeCall: false, 
        reason: `Daily call limit reached (${this.DAILY_CALL_LIMIT}/day). Quota resets at 12:00 AM Pacific Time.` 
      };
    }
    
    // Check daily token limit
    if (this.dailyTokenCount >= this.DAILY_TOKEN_LIMIT) {
      this.isQuotaExceeded = true;
      this.saveDailyStats();
      return { 
        canMakeCall: false, 
        reason: `Daily token limit reached (${this.DAILY_TOKEN_LIMIT}/day). Quota resets at 12:00 AM Pacific Time.` 
      };
    }
    
    // Check rate limiting (1 call per minute on free tier)
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const recentCalls = this.callHistory.filter(call => call.timestamp > oneMinuteAgo);
    
    if (recentCalls.length >= this.CALLS_PER_MINUTE) {
      const oldestCall = Math.min(...recentCalls.map(call => call.timestamp));
      const waitTime = Math.ceil((oldestCall + (60 * 1000) - now) / 1000);
      return { 
        canMakeCall: false, 
        reason: `Rate limit: ${this.CALLS_PER_MINUTE} call per minute. Please wait ${waitTime} seconds.`,
        waitTime
      };
    }
    
    return { canMakeCall: true };
  }

  private updateQuotaUsage(tokens: number) {
    this.dailyCallCount++;
    this.dailyTokenCount += tokens;
    this.callHistory.push({ timestamp: Date.now(), tokens });
    
    // Keep only last 60 calls for rate limiting
    if (this.callHistory.length > 60) {
      this.callHistory = this.callHistory.slice(-60);
    }
    
    this.saveDailyStats();
    
    console.log(`📊 Quota Update: ${this.dailyCallCount}/${this.DAILY_CALL_LIMIT} calls, ${this.dailyTokenCount}/${this.DAILY_TOKEN_LIMIT} tokens`);
  }

  // Method to get current quota status
  public getQuotaStatus() {
    this.resetDailyStatsIfNeeded();
    return {
      dailyCallCount: this.dailyCallCount,
      dailyCallLimit: this.DAILY_CALL_LIMIT,
      dailyTokenCount: this.dailyTokenCount,
      dailyTokenLimit: this.DAILY_TOKEN_LIMIT,
      callsRemaining: Math.max(0, this.DAILY_CALL_LIMIT - this.dailyCallCount),
      tokensRemaining: Math.max(0, this.DAILY_TOKEN_LIMIT - this.dailyTokenCount),
      isQuotaExceeded: this.isQuotaExceeded,
      nextReset: this.getNextResetTime(),
      rateLimitInfo: `Maximum ${this.CALLS_PER_MINUTE} call per minute`
    };
  }

  private getNextResetTime(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilReset = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m until quota reset`;
  }

  // Method to reset quota (for testing)
  public resetQuota() {
    this.dailyCallCount = 0;
    this.dailyTokenCount = 0;
    this.isQuotaExceeded = false;
    this.callHistory = [];
    this.saveDailyStats();
    console.log('🔄 Quota manually reset');
  }

  private initializeAPI() {
    // Check both environment variable and localStorage
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.apiKeyValid = true;
        console.log('🔑 AI initialized with key:', apiKey.substring(0, 15) + '...');
        console.log('🔧 GoogleGenerativeAI instance created:', !!this.genAI);
        console.log('🤖 Model instance created:', !!this.model);
      } catch (error) {
        console.error('❌ Failed to initialize AI:', error);
        this.genAI = null;
        this.model = null;
        this.apiKeyValid = false;
      }
    } else {
      console.log('⚠️ No AI API key found - AI responses disabled');
      this.apiKeyValid = false;
    }
  }

  // Method to reinitialize after API key is added
  public reinitialize() {
    this.initializeAPI();
  }

  private isConfigured(): boolean {
    return this.genAI !== null && this.model !== null && this.apiKeyValid;
  }

  // Method to get API call statistics
  public getStats() {
    return {
      callCount: this.callCount,
      isConfigured: this.isConfigured(),
      hasGenAI: !!this.genAI,
      hasModel: !!this.model,
      apiKeyValid: this.apiKeyValid
    };
  }

  async generateDebateResponse(
    topic: string,
    userArgument: string,
    aiSide: 'pro' | 'con',
    round: number,
    conversationHistory: string[]
  ): Promise<string> {
    this.callCount++;
    const callId = `CALL-${this.callCount}-${Date.now()}`;
    
    console.log(`🚀 [${callId}] STARTING AI CALL #${this.callCount}`);
    console.log(`📊 [${callId}] API Stats:`, this.getStats());
    console.log(`📝 [${callId}] Request Details:`, { 
      topic, 
      userArgument: userArgument.substring(0, 50) + '...', 
      aiSide, 
      round,
      historyLength: conversationHistory.length,
      timestamp: new Date().toISOString()
    });
    
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable AI responses.`);
    }

    // Check quota limits before making API call
    const quotaCheck = this.checkQuotaLimits();
    if (!quotaCheck.canMakeCall) {
      throw new Error(`[${callId}] ${quotaCheck.reason}`);
    }

    try {
      const prompt = this.buildAdvancedDebatePrompt(topic, userArgument, aiSide, round, conversationHistory, callId);
      
      console.log(`📤 [${callId}] SENDING TO AI API...`);
      console.log(`📤 [${callId}] Prompt length: ${prompt.length} characters`);
      console.log(`📤 [${callId}] Model: gemini-1.5-flash`);
      console.log(`📤 [${callId}] Request timestamp: ${new Date().toISOString()}`);
      
      // ACTUAL AI API CALL
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ [${callId}] API Response time: ${responseTime}ms`);
      
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ [${callId}] AI API RESPONSE RECEIVED!`);
      console.log(`📥 [${callId}] Response length: ${text.length} characters`);
      console.log(`📥 [${callId}] Response preview: "${text.substring(0, 100)}..."`);
      
      if (!text || text.trim().length === 0) {
        throw new Error(`[${callId}] Empty response from AI API`);
      }
      
      // Clean response to remove any technical references that might have leaked through
      let cleanedText = text.trim();
      // Remove any call ID references that might appear in the response
      cleanedText = cleanedText.replace(/\(CALL-[^)]+\)/g, '').trim();
      cleanedText = cleanedText.replace(/Call ID: [^\s]+/gi, '').trim();
      cleanedText = cleanedText.replace(/\[CALL-[^\]]+\]/g, '').trim();
      
      // Estimate token usage and update quota
      const estimatedTokens = Math.ceil((prompt.length + text.length) / 4); // Rough estimate: 1 token ≈ 4 characters
      this.updateQuotaUsage(estimatedTokens);
      
      console.log(`📥 [${callId}] Full response:`, cleanedText);
      console.log(`📊 [${callId}] Total API calls made: ${this.callCount}`);
      console.log(`🎯 [${callId}] SUCCESS - AI API call completed in ${responseTime}ms`);
      console.log(`📊 [${callId}] Estimated tokens used: ${estimatedTokens}`);
      
      return cleanedText;
    } catch (error: any) {
      console.error(`❌ [${callId}] AI API ERROR:`, error);
      console.error(`❌ [${callId}] Error type:`, error.constructor.name);
      console.error(`❌ [${callId}] Error message:`, error.message);
      console.error(`❌ [${callId}] Full error:`, error);
      
      // Handle specific API errors
      if (error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
        this.apiKeyValid = false;
        this.genAI = null;
        this.model = null;
        throw new Error(`[${callId}] Invalid API key. Please check your API key and try again.`);
      }
      
      if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
        throw new Error(`[${callId}] API quota exceeded. Please check your API usage limits.`);
      }
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error(`[${callId}] Network error connecting to API. Please check your internet connection.`);
      }
      
      throw new Error(`[${callId}] AI API error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  private buildAdvancedDebatePrompt(
    topic: string,
    userArgument: string,
    aiSide: 'pro' | 'con',
    round: number,
    conversationHistory: string[],
    callId: string
  ): string {
    const sideDescription = aiSide === 'pro' ? 'FOR (supporting the topic)' : 'AGAINST (opposing the topic)';
    
    let prompt = `You are participating in a debate as the ${sideDescription} side.

DEBATE TOPIC: "${topic}"
YOUR POSITION: ${sideDescription}
CURRENT ROUND: ${round}

INSTRUCTIONS:
1. Respond naturally and authentically as a debate opponent
2. Make contextual arguments specific to their points
3. Keep responses 2-3 sentences for natural conversation flow
4. Use current examples and logical reasoning
5. Stay focused on the debate topic
6. Be respectful but firm in your position
7. Do not mention technical details, call IDs, or API references

`;

    if (conversationHistory.length > 0) {
      prompt += `CONVERSATION HISTORY (last 4 messages):
${conversationHistory.slice(-4).map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

`;
    }

    if (userArgument && userArgument.trim()) {
      prompt += `HUMAN JUST SAID: "${userArgument}"

Respond to this specific message. If they made a debate argument, counter it with your ${aiSide} position using specific reasoning. Keep your response natural and conversational.

Your response:`;
    } else {
      prompt += `Present your ${aiSide} position on "${topic}" with a strong, specific opening argument.

Your response:`;
    }

    return prompt;
  }

  async analyzeFeedback(
    userArgument: string,
    topic: string,
    userSide: 'pro' | 'con',
    round: number
  ): Promise<Feedback> {
    this.callCount++;
    const callId = `FEEDBACK-${this.callCount}-${Date.now()}`;
    
    console.log(`🔍 [${callId}] STARTING AI FEEDBACK ANALYSIS #${this.callCount}`);
    console.log(`📊 [${callId}] API Stats:`, this.getStats());
    console.log(`📝 [${callId}] Analysis Details:`, {
      argumentLength: userArgument.length,
      topic,
      userSide,
      round,
      timestamp: new Date().toISOString()
    });
    
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable AI feedback analysis.`);
    }

    // Check quota limits before making API call
    const quotaCheck = this.checkQuotaLimits();
    if (!quotaCheck.canMakeCall) {
      throw new Error(`[${callId}] ${quotaCheck.reason}`);
    }

    try {
      const timestamp = new Date().toISOString();
      const prompt = `AI FEEDBACK ANALYSIS - Call ID: ${callId}
Generated at: ${timestamp}
This is a LIVE API call to the AI service for argument analysis.

DEBATE TOPIC: "${topic}"
STUDENT'S POSITION: ${userSide === 'pro' ? 'FOR' : 'AGAINST'}
ROUND: ${round}
CALL ID: ${callId}
TIMESTAMP: ${timestamp}
STUDENT'S ARGUMENT: "${userArgument}"

CRITICAL SCORING INSTRUCTIONS:
- Analyze the argument quality, relevance, structure, and evidence
- Score based on actual content quality, not predetermined ranges
- Be fair and accurate in assessment
- Consider the argument's strength relative to the debate topic
- Don't artificially inflate or deflate scores

Provide AI analysis in this EXACT JSON format (no extra text, no markdown):
{
  "score": [ACTUAL_SCORE_BASED_ON_ANALYSIS],
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "fallaciesDetected": ["Any logical fallacies found"],
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"]
}

SCORING CRITERIA (0-100):
- Relevance to topic (0-25 points): How well does the argument address the debate topic?
- Clarity and structure (0-25 points): Is the argument well-organized and easy to follow?
- Evidence and reasoning (0-25 points): Does the argument provide solid evidence and logical reasoning?
- Debate technique (0-25 points): Does it use effective debate strategies and avoid fallacies?

SCORING GUIDELINES:
- 90-100: Exceptional argument with strong evidence, clear structure, and excellent reasoning
- 80-89: Strong argument with good evidence and clear reasoning
- 70-79: Good argument with adequate support and structure
- 60-69: Acceptable argument but lacks depth or has minor issues
- 50-59: Weak argument with significant problems in logic or evidence
- 40-49: Poor argument with major flaws
- 30-39: Very poor argument, mostly irrelevant or illogical
- 20-29: Extremely poor, barely addresses topic
- 10-19: Almost completely irrelevant or nonsensical
- 0-9: No meaningful argument content

Be specific and educational. Analyze the actual content quality. If the argument is off-topic, casual conversation, or very weak, score accordingly. If it's strong and well-reasoned, score it highly.

This is call ${callId} to AI.

RESPOND WITH ONLY THE JSON OBJECT:`;

      console.log(`📤 [${callId}] SENDING FEEDBACK REQUEST TO AI API...`);
      console.log(`📤 [${callId}] Prompt length: ${prompt.length} characters`);
      
      // ACTUAL AI API CALL FOR FEEDBACK
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ [${callId}] Feedback API Response time: ${responseTime}ms`);
      
      const response = await result.response;
      const text = response.text().trim();
      
              console.log(`✅ [${callId}] AI FEEDBACK RESPONSE RECEIVED!`);
        console.log(`📥 [${callId}] Raw feedback response:`, text);
        console.log(`📊 [${callId}] Total API calls made: ${this.callCount}`);
        
        // Estimate token usage and update quota
        const estimatedTokens = Math.ceil((prompt.length + text.length) / 4);
        this.updateQuotaUsage(estimatedTokens);
        console.log(`📊 [${callId}] Estimated tokens used: ${estimatedTokens}`);
        
        try {
        // Clean the response to extract JSON
        let jsonText = text;
        if (text.includes('```json')) {
          jsonText = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
          jsonText = text.split('```')[1].split('```')[0].trim();
        }
        
        console.log(`🔧 [${callId}] Parsing JSON:`, jsonText);
        const feedback = JSON.parse(jsonText);
        
        // Validate and sanitize the feedback - DO NOT artificially constrain scores
        const validatedFeedback: Feedback = {
          score: Math.max(0, Math.min(100, Number(feedback.score) || 0)), // Allow full 0-100 range
          strengths: Array.isArray(feedback.strengths) ? feedback.strengths.slice(0, 3) : [],
          improvements: Array.isArray(feedback.improvements) ? feedback.improvements.slice(0, 3) : [],
          fallaciesDetected: Array.isArray(feedback.fallaciesDetected) ? feedback.fallaciesDetected : [],
          suggestions: Array.isArray(feedback.suggestions) ? feedback.suggestions.slice(0, 3) : []
        };
        
        console.log(`✅ [${callId}] AI FEEDBACK PROCESSED:`, validatedFeedback);
        console.log(`🎯 [${callId}] SUCCESS - AI feedback analysis completed in ${responseTime}ms`);
        console.log(`📊 [${callId}] ACTUAL SCORE GIVEN: ${validatedFeedback.score}/100`);
        
        return validatedFeedback;
      } catch (parseError) {
        console.error(`❌ [${callId}] Error parsing AI feedback JSON:`, parseError);
        console.error(`❌ [${callId}] Raw text that failed to parse:`, text);
        throw new Error(`[${callId}] Failed to parse feedback from AI API. Please try again.`);
      }
    } catch (error: any) {
      console.error(`❌ [${callId}] AI FEEDBACK API ERROR:`, error);
      console.error(`❌ [${callId}] Error type:`, error.constructor.name);
      console.error(`❌ [${callId}] Error message:`, error.message);
      
      // Handle specific API errors
      if (error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
        this.apiKeyValid = false;
        this.genAI = null;
        this.model = null;
        throw new Error(`[${callId}] Invalid API key. Please check your API key and try again.`);
      }
      
      if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
        throw new Error(`[${callId}] API quota exceeded. Please check your API usage limits.`);
      }
      
      if (error?.message?.includes('parse') || error?.message?.includes('JSON')) {
        throw new Error(`[${callId}] Failed to parse feedback from AI API. Please try again.`);
      }
      
      throw new Error(`[${callId}] AI API feedback error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  // Method to test if API is working with detailed logging
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('🧪 Cannot test connection - API not configured');
      return false;
    }

    this.callCount++;
    const callId = `TEST-${this.callCount}-${Date.now()}`;

    try {
      console.log(`🧪 [${callId}] Testing AI API connection...`);
      console.log(`🧪 [${callId}] API Stats:`, this.getStats());
      
      const testPrompt = `This is a connection test for call ID ${callId} at ${new Date().toISOString()}. Respond with exactly: "AI WORKING - Call ${callId}"`;
      
      console.log(`🧪 [${callId}] Sending test prompt:`, testPrompt);
      
      const startTime = Date.now();
      const result = await this.model.generateContent(testPrompt);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const response = await result.response;
      const text = response.text().trim();
      
      console.log(`🧪 [${callId}] Test response received in ${responseTime}ms:`, text);
      console.log(`🧪 [${callId}] Expected to contain: "AI WORKING - Call ${callId}"`);
      
      const isWorking = text.includes('AI WORKING') && text.includes(callId);
      
      if (isWorking) {
        console.log(`✅ [${callId}] AI API connection test PASSED!`);
      } else {
        console.log(`❌ [${callId}] AI API connection test FAILED - unexpected response`);
      }
      
      return isWorking;
    } catch (error) {
      console.error(`🧪 [${callId}] AI API test failed:`, error);
      return false;
    }
  }

  // Method to clear call count (for debugging)
  public resetStats() {
    this.callCount = 0;
    console.log('📊 API call statistics reset');
  }

  // Suggest debate topics using Gemini
  async suggestDebateTopics(): Promise<string[]> {
    this.callCount++;
    const callId = `TOPICS-${this.callCount}-${Date.now()}`;
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable topic suggestions.`);
    }
    const prompt = `Suggest 10 unique, current, and age-appropriate debate topics for students aged 16 to 25.\nEnsure they are phrased clearly and cover diverse themes (e.g., tech, ethics, politics, society).\nFormat each as a question or a statement suitable for debate.\nReturn as a numbered list.`;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      return this.parseTopicList(text);
    } catch (error: any) {
      console.error(`[${callId}] Failed to fetch topics from Gemini:`, error);
      throw new Error(`[${callId}] Failed to fetch topics from Gemini: ${error.message || 'Unknown error'}`);
    }
  }

  // Validate if a topic is a valid debate topic using Gemini
  async validateDebateTopic(topic: string): Promise<{valid: boolean, reason: string}> {
    this.callCount++;
    const callId = `VALIDATE-${this.callCount}-${Date.now()}`;
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable topic validation.`);
    }
    const prompt = `Check if the following input is a valid debate topic. Consider a topic valid if it invites opposing viewpoints and can be discussed meaningfully by students aged 16–25, even if the terminology may need light clarification.\n- The topic should be phrased as a motion or a question.\n- It should be discussable from two or more sides.\n- It should be age-appropriate (16-25).\n\nReturn \"VALID\" or \"INVALID\" with a short reason.\n\nTopic: \"${topic}\"`;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      // Parse response: expect 'VALID' or 'INVALID' with reason
      const match = text.match(/^(VALID|INVALID)\s*[:-]?\s*(.*)$/i);
      if (match) {
        return { valid: match[1].toUpperCase() === 'VALID', reason: match[2] || '' };
      }
      // Fallback: treat as invalid
      return { valid: false, reason: text };
    } catch (error: any) {
      return { valid: false, reason: error.message || 'Validation failed' };
    }
  }

  // Suggest completions for a partial debate topic using Gemini
  async suggestDebateCompletions(partial: string): Promise<string[]> {
    this.callCount++;
    const callId = `COMPLETE-${this.callCount}-${Date.now()}`;
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable topic completions.`);
    }
    const prompt = `The user is typing a debate topic. Based on what they typed, suggest the most likely full debate motions or questions they might be aiming for.\n\nPartial input: \"${partial}\"\n\nReturn 5 complete debate topics starting with or based on that phrase. Format as a list.`;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      return this.parseTopicList(text);
    } catch (error: any) {
      return [];
    }
  }

  // Suggest 4 well-phrased, valid debate topics closely related to the user's input
  async getRephrasedDebateTopics(userInput: string): Promise<string[]> {
    this.callCount++;
    const callId = `REPHRASE-${this.callCount}-${Date.now()}`;
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable topic rephrasing.`);
    }
    const prompt = `The user entered a debate topic that was rejected as invalid. Suggest 4 well-phrased, valid debate topics that are closely related to: "${userInput}". Use a mix of debate styles (questions, motions, etc.) suitable for students aged 16-25. Format as a numbered list.`;
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      return this.parseTopicList(text);
    } catch (error: any) {
      return [];
    }
  }

  // Helper to parse a numbered list from Gemini's response
  private parseTopicList(response: string): string[] {
    const lines = response.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    const topics: string[] = [];
    for (const line of lines) {
      const match = line.match(/^\d+\.?\s*(.*)$/);
      if (match && match[1]) {
        topics.push(match[1].trim());
      } else if (line.length > 0) {
        topics.push(line);
      }
    }
    if (topics.length === 0 && response.length > 0) {
      topics.push(response);
    }
    return topics;
  }
}

export const geminiService = new GeminiService();

// Expose service to window for debugging
if (typeof window !== 'undefined') {
  (window as any).geminiService = geminiService;
  console.log('🔧 GeminiService exposed to window.geminiService for debugging');
}
