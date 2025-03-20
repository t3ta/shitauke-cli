import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config.js';
import { CostEntry, ModelProvider } from '../models/types.js';

// Approximate cost per 1K tokens by model
const COST_PER_1K_TOKENS = {
  // OpenAI
  'gpt-4': {
    input: 0.03,
    output: 0.06
  },
  'gpt-3.5-turbo': {
    input: 0.0015,
    output: 0.002
  },
  // Anthropic
  'claude-3-haiku': {
    input: 0.00025,
    output: 0.00125
  },
  'claude-3-sonnet': {
    input: 0.003,
    output: 0.015
  },
  'claude-3-opus': {
    input: 0.015,
    output: 0.075
  },
  // Google Gemini Models
  // Gemini 2.0シリーズ
  'gemini-2.0-flash-001': {
    input: 0.0003,   // 1Kトークンあたり$0.0003 (入力)
    output: 0.001    // 1Kトークンあたり$0.001 (出力)
  },
  'gemini-2.0-flash-lite-001': {
    input: 0.00015,  // 1Kトークンあたり$0.00015 (入力)
    output: 0.0005   // 1Kトークンあたり$0.0005 (出力)
  }
};

/**
 * Calculate the cost of a request
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const modelCost = COST_PER_1K_TOKENS[model as keyof typeof COST_PER_1K_TOKENS];
  
  if (!modelCost) {
    return 0;
  }
  
  const inputCost = (promptTokens / 1000) * modelCost.input;
  const outputCost = (completionTokens / 1000) * modelCost.output;
  
  return inputCost + outputCost;
}

/**
 * Get all cost entries
 */
export async function getCosts(): Promise<CostEntry[]> {
  try {
    const config = await getConfig();
    const costsFile = config.costs_file;
    
    if (!await fs.pathExists(costsFile)) {
      await fs.writeJson(costsFile, [], { spaces: 2 });
      return [];
    }
    
    return await fs.readJson(costsFile);
  } catch (error) {
    console.error('Error reading costs:', error);
    return [];
  }
}

/**
 * Add a new cost entry
 */
export async function addCostEntry(
  model: string,
  provider: ModelProvider,
  promptTokens: number,
  completionTokens: number
): Promise<CostEntry> {
  try {
    const config = await getConfig();
    const costsFile = config.costs_file;
    
    const costs = await getCosts();
    
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(model, promptTokens, completionTokens);
    
    const newEntry: CostEntry = {
      id: uuidv4(),
      model,
      provider,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      timestamp: Date.now()
    };
    
    costs.unshift(newEntry);
    
    await fs.writeJson(costsFile, costs, { spaces: 2 });
    
    return newEntry;
  } catch (error) {
    console.error('Error adding cost entry:', error);
    throw error;
  }
}

/**
 * Get total cost by period
 */
export async function getTotalCost(
  startDate: Date = new Date(0),
  endDate: Date = new Date()
): Promise<{ totalCost: number; byModel: Record<string, number> }> {
  try {
    const costs = await getCosts();
    
    const filteredCosts = costs.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    let totalCost = 0;
    const byModel: Record<string, number> = {};
    
    filteredCosts.forEach(entry => {
      totalCost += entry.cost;
      byModel[entry.model] = (byModel[entry.model] || 0) + entry.cost;
    });
    
    return { totalCost, byModel };
  } catch (error) {
    console.error('Error calculating total cost:', error);
    return { totalCost: 0, byModel: {} };
  }
}

/**
 * Clear all cost entries
 */
export async function clearCosts(): Promise<boolean> {
  try {
    const config = await getConfig();
    const costsFile = config.costs_file;
    
    await fs.writeJson(costsFile, [], { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error clearing costs:', error);
    return false;
  }
}
