// Output format options
export type OutputFormat = 'json' | 'markdown' | 'text';

// Model provider options
export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'auto';

// Available models for each provider
export const AVAILABLE_MODELS = {
  openai: ['gpt-4', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
  gemini: ['gemini-1.0-pro', 'gemini-pro-vision', 'gemini-2.0-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
};

// Request options interface
export interface RequestOptions {
  prompt: string;
  model?: string;
  provider?: ModelProvider;
  format?: OutputFormat;
  inputFiles?: string[];
  outputFile?: string;
  overwrite?: boolean;
  temperature?: number;
  maxTokens?: number;
}

// Response interface
export interface AIResponse {
  content: string;
  model: string;
  provider: ModelProvider;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cost?: number;
  };
  timestamp: number;
}

// History entry interface
export interface HistoryEntry {
  id: string;
  prompt: string;
  response: AIResponse;
  inputFiles?: string[];
  outputFile?: string;
  timestamp: number;
}

// Template interface
export interface Template {
  name: string;
  prompt: string;
  description?: string;
}

// Cost entry interface
export interface CostEntry {
  id: string;
  model: string;
  provider: ModelProvider;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
}
