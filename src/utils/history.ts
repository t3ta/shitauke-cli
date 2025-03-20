import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config.js';
import { HistoryEntry, RequestOptions, AIResponse } from '../models/types.js';

/**
 * Get all history entries
 */
export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const config = await getConfig();
    const historyFile = config.history_file;
    
    if (!await fs.pathExists(historyFile)) {
      await fs.writeJson(historyFile, [], { spaces: 2 });
      return [];
    }
    
    return await fs.readJson(historyFile);
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
}

/**
 * Add a new history entry
 */
export async function addHistoryEntry(
  options: RequestOptions,
  response: AIResponse
): Promise<HistoryEntry> {
  try {
    const config = await getConfig();
    const historyFile = config.history_file;
    
    const history = await getHistory();
    
    const newEntry: HistoryEntry = {
      id: uuidv4(),
      prompt: options.prompt,
      response,
      inputFiles: options.inputFiles,
      outputFile: options.outputFile,
      timestamp: Date.now()
    };
    
    history.unshift(newEntry);
    
    // Keep only the last 100 entries
    const trimmedHistory = history.slice(0, 100);
    
    await fs.writeJson(historyFile, trimmedHistory, { spaces: 2 });
    
    return newEntry;
  } catch (error) {
    console.error('Error adding history entry:', error);
    throw error;
  }
}

/**
 * Get a history entry by ID
 */
export async function getHistoryEntryById(id: string): Promise<HistoryEntry | null> {
  try {
    const history = await getHistory();
    return history.find(entry => entry.id === id) || null;
  } catch (error) {
    console.error('Error getting history entry:', error);
    return null;
  }
}

/**
 * Delete a history entry by ID
 */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
  try {
    const config = await getConfig();
    const historyFile = config.history_file;
    
    const history = await getHistory();
    const newHistory = history.filter(entry => entry.id !== id);
    
    if (history.length === newHistory.length) {
      return false; // Entry not found
    }
    
    await fs.writeJson(historyFile, newHistory, { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error deleting history entry:', error);
    return false;
  }
}

/**
 * Clear all history entries
 */
export async function clearHistory(): Promise<boolean> {
  try {
    const config = await getConfig();
    const historyFile = config.history_file;
    
    await fs.writeJson(historyFile, [], { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}
