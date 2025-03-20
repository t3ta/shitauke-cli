import fs from 'fs-extra';
import path from 'path';
import * as logger from './logger.js';

/**
 * Read a file and return its contents
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    logger.debug(`Reading file: ${filePath}`);
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    logger.error(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Read multiple files and return their contents
 */
export async function readFiles(filePaths: string[]): Promise<Map<string, string>> {
  const fileContents = new Map<string, string>();
  
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath);
      fileContents.set(filePath, content);
    } catch (error) {
      logger.warning(`Skipping file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return fileContents;
}

/**
 * Write content to a file
 */
export async function writeFile(filePath: string, content: string, overwrite = false): Promise<void> {
  try {
    const dirname = path.dirname(filePath);
    await fs.ensureDir(dirname);
    
    // Check if file exists and overwrite is false
    if (!overwrite && await fs.pathExists(filePath)) {
      throw new Error(`File already exists: ${filePath}. Use --overwrite to overwrite.`);
    }
    
    logger.debug(`Writing to file: ${filePath}`);
    await fs.writeFile(filePath, content);
    logger.success(`Successfully wrote to ${filePath}`);
  } catch (error) {
    logger.error(`Error writing to file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
