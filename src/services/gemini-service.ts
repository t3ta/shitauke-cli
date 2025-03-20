import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService } from './ai-service.js';
import { RequestOptions, AIResponse, AVAILABLE_MODELS } from '../models/types.js';
import { getApiKey } from '../utils/config.js';
import { calculateCost } from '../utils/costs.js';
import * as logger from '../utils/logger.js';

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI | null = null;
  
  /**
   * Initialize the Gemini client
   */
  private async initClient(): Promise<GoogleGenerativeAI> {
    if (this.client) {
      return this.client;
    }
    
    const apiKey = await getApiKey('gemini');
    
    if (!apiKey) {
      throw new Error('Gemini API key is not set. Please set it in your config.');
    }
    
    this.client = new GoogleGenerativeAI(apiKey);
    
    return this.client;
  }
  
  /**
   * Get the provider of this service
   */
  public getProvider() {
    return 'gemini';
  }
  
  /**
   * Check if this service supports the given model
   */
  public supportsModel(model: string): boolean {
    return AVAILABLE_MODELS.gemini.includes(model);
  }
  
  /**
   * Send a request to the Gemini model
   */
  public async sendRequest(options: RequestOptions): Promise<AIResponse> {
    try {
      const client = await this.initClient();
      
      let inputContent = options.prompt;
      
      // If input files are provided, read their contents and append to the prompt
      if (options.inputFiles && options.inputFiles.length > 0) {
        logger.info(`Processing ${options.inputFiles.length} input files...`);
        // Implementation for handling files would go here
      }
      
      // Format specific instructions based on the requested output format
      if (options.format) {
        switch (options.format) {
          case 'json':
            inputContent = `${inputContent}\n\nPlease provide the response in valid JSON format.`;
            break;
          case 'markdown':
            inputContent = `${inputContent}\n\nPlease provide the response in Markdown format.`;
            break;
        }
      }
      
      // Use the specified model or default to gemini-1.0-pro
      const model = options.model || 'gemini-1.0-pro';
      
      logger.info(`Sending request to Gemini (${model})...`);
      
      const geminiModel = client.getGenerativeModel({ model });
      
      const result = await geminiModel.generateContent(inputContent);
      const response = result.response;
      const content = response.text();
      
      // Gemini doesn't provide detailed token usage, so we have to estimate
      // based on the input and output length
      const promptTokens = Math.ceil(inputContent.length / 4);
      const completionTokens = Math.ceil(content.length / 4);
      const totalTokens = promptTokens + completionTokens;
      const cost = calculateCost(model, promptTokens, completionTokens);
      
      const aiResponse: AIResponse = {
        content,
        model,
        provider: this.getProvider(),
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost
        },
        timestamp: Date.now()
      };
      
      logger.success(`Received response from Gemini (${model}).`);
      logger.debug(`Estimated usage: ~${promptTokens} prompt tokens, ~${completionTokens} completion tokens, ~$${cost.toFixed(6)} cost.`);
      
      return aiResponse;
    } catch (error) {
      logger.error(`Error sending request to Gemini: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
