import Anthropic from '@anthropic-ai/sdk';
import { AIService } from './ai-service.js';
import { RequestOptions, AIResponse, AVAILABLE_MODELS } from '../models/types.js';
import { getApiKey } from '../utils/config.js';
import { calculateCost } from '../utils/costs.js';
import * as logger from '../utils/logger.js';

export class AnthropicService implements AIService {
  private client: Anthropic | null = null;
  
  /**
   * Initialize the Anthropic client
   */
  private async initClient(): Promise<Anthropic> {
    if (this.client) {
      return this.client;
    }
    
    const apiKey = await getApiKey('anthropic');
    
    if (!apiKey) {
      throw new Error('Anthropic API key is not set. Please set it in your config.');
    }
    
    this.client = new Anthropic({
      apiKey
    });
    
    return this.client;
  }
  
  /**
   * Get the provider of this service
   */
  public getProvider() {
    return 'anthropic';
  }
  
  /**
   * Check if this service supports the given model
   */
  public supportsModel(model: string): boolean {
    return AVAILABLE_MODELS.anthropic.includes(model);
  }
  
  /**
   * Send a request to the Anthropic model
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
      
      // Use the specified model or default to claude-3-sonnet
      const model = options.model || 'claude-3-sonnet';
      
      logger.info(`Sending request to Anthropic (${model})...`);
      
      const maxTokens = options.maxTokens || 4000;
      
      const completion = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: options.temperature || 0.7,
        messages: [
          { role: 'user', content: inputContent }
        ]
      });
      
      const content = completion.content[0].text;
      
      // Calculate usage information
      const promptTokens = completion.usage?.input_tokens || 0;
      const completionTokens = completion.usage?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
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
      
      logger.success(`Received response from Anthropic (${model}).`);
      logger.debug(`Usage: ${promptTokens} prompt tokens, ${completionTokens} completion tokens, $${cost.toFixed(6)} cost.`);
      
      return response;
    } catch (error) {
      logger.error(`Error sending request to Anthropic: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
