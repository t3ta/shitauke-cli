import { RequestOptions, AIResponse, ModelProvider } from '../models/types.js';

/**
 * Interface for AI services
 */
export interface AIService {
  /**
   * Send a request to the AI model
   */
  sendRequest(options: RequestOptions): Promise<AIResponse>;
  
  /**
   * Get the provider of this service
   */
  getProvider(): ModelProvider;
  
  /**
   * Check if this service supports the given model
   */
  supportsModel(model: string): boolean;
}

/**
 * Factory function to get the appropriate AI service based on model or provider
 */
export async function getAIService(
  model?: string, 
  provider?: ModelProvider
): Promise<AIService> {
  // Dynamically import services
  const { OpenAIService } = await import('./openai-service.js');
  const { AnthropicService } = await import('./anthropic-service.js');
  const { GeminiService } = await import('./gemini-service.js');
  
  // If provider is specified and not 'auto', use that provider
  if (provider && provider !== 'auto') {
    switch (provider) {
      case 'openai':
        return new OpenAIService();
      case 'anthropic':
        return new AnthropicService();
      case 'gemini':
        return new GeminiService();
    }
  }
  
  // If model is specified, determine provider from model
  if (model) {
    const openAIService = new OpenAIService();
    if (openAIService.supportsModel(model)) {
      return openAIService;
    }
    
    const anthropicService = new AnthropicService();
    if (anthropicService.supportsModel(model)) {
      return anthropicService;
    }
    
    const geminiService = new GeminiService();
    if (geminiService.supportsModel(model)) {
      return geminiService;
    }
  }
  
  // Default to OpenAI
  return new OpenAIService();
}
