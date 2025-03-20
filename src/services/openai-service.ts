import OpenAI from 'openai';
import { AIService } from './ai-service.js';
import { RequestOptions, AIResponse, AVAILABLE_MODELS } from '../models/types.js';
import { getApiKey } from '../utils/config.js';
import { calculateCost } from '../utils/costs.js';
import * as logger from '../utils/logger.js';

export class OpenAIService implements AIService {
  private client: OpenAI | null = null;
  
  /**
   * Initialize the OpenAI client
   */
  private async initClient(): Promise<OpenAI> {
    if (this.client) {
      return this.client;
    }
    
    const apiKey = await getApiKey('openai');
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not set. Please set it in your config.');
    }
    
    this.client = new OpenAI({
      apiKey
    });
    
    return this.client;
  }
  
  /**
   * Get the provider of this service
   */
  public getProvider() {
    return 'openai';
  }
  
  /**
   * Check if this service supports the given model
   */
  public supportsModel(model: string): boolean {
    return AVAILABLE_MODELS.openai.includes(model);
  }
  
  /**
   * Send a request to the OpenAI model
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
      
      // Use the specified model or default to gpt-4
      const model = options.model || 'gpt-4';
      
      logger.info(`Sending request to OpenAI (${model})...`);
      
      const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: inputContent }],
        model,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
      });
      
      const content = completion.choices[0].message.content || '';
      
      // Calculate usage information
      const usage = completion.usage;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;
      const totalTokens = usage?.total_tokens || 0;
      const cost = calculateCost(model, promptTokens, completionTokens);
      
      const response: AIResponse = {
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
      
      logger.success(`Received response from OpenAI (${model}).`);
      logger.debug(`Usage: ${promptTokens} prompt tokens, ${completionTokens} completion tokens, $${cost.toFixed(6)} cost.`);
      
      return response;
    } catch (error) {
      logger.error(`Error sending request to OpenAI: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
