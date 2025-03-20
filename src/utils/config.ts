import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define config directory
const CONFIG_DIR = path.join(os.homedir(), '.shitauke');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Default configuration
const DEFAULT_CONFIG = {
  api_keys: {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || ''
  },
  default_model: process.env.DEFAULT_MODEL || 'gpt-4',
  default_format: process.env.DEFAULT_FORMAT || 'markdown',
  history_file: path.join(CONFIG_DIR, 'history.json'),
  templates_file: path.join(CONFIG_DIR, 'templates.json'),
  costs_file: path.join(CONFIG_DIR, 'costs.json')
};

/**
 * Ensure the config directory and files exist
 */
export async function ensureConfigExists(): Promise<void> {
  try {
    // Create config directory if it doesn't exist
    await fs.ensureDir(CONFIG_DIR);
    
    // Create config file if it doesn't exist
    if (!await fs.pathExists(CONFIG_FILE)) {
      await fs.writeJson(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
    }
    
    // Ensure history, templates and costs files exist
    const { history_file, templates_file, costs_file } = await getConfig();
    
    if (!await fs.pathExists(history_file)) {
      await fs.writeJson(history_file, [], { spaces: 2 });
    }
    
    if (!await fs.pathExists(templates_file)) {
      await fs.writeJson(templates_file, {}, { spaces: 2 });
    }
    
    if (!await fs.pathExists(costs_file)) {
      await fs.writeJson(costs_file, [], { spaces: 2 });
    }
  } catch (error) {
    console.error('Error ensuring config exists:', error);
    throw error;
  }
}

/**
 * Get the configuration
 */
export async function getConfig(): Promise<any> {
  try {
    if (!await fs.pathExists(CONFIG_FILE)) {
      await ensureConfigExists();
    }
    
    const config = await fs.readJson(CONFIG_FILE);
    return { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.error('Error reading config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Update the configuration
 */
export async function updateConfig(newConfig: any): Promise<void> {
  try {
    const currentConfig = await getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    await fs.writeJson(CONFIG_FILE, updatedConfig, { spaces: 2 });
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
}

/**
 * Get API key for a specific service
 */
export async function getApiKey(service: 'openai' | 'anthropic' | 'gemini'): Promise<string> {
  const config = await getConfig();
  return config.api_keys[service] || '';
}

/**
 * Get default model
 */
export async function getDefaultModel(): Promise<string> {
  const config = await getConfig();
  return config.default_model;
}

/**
 * Get default format
 */
export async function getDefaultFormat(): Promise<string> {
  const config = await getConfig();
  return config.default_format;
}
