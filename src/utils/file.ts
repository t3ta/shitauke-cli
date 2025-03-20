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
 * @param filePath - Path to the file
 * @param content - Content to write
 * @param overwrite - Whether to overwrite existing file
 * @param format - Output format (used for post-processing)
 */
export async function writeFile(filePath: string, content: string, overwrite = false, format?: string): Promise<void> {
  try {
    const dirname = path.dirname(filePath);
    await fs.ensureDir(dirname);
    
    // Check if file exists and overwrite is false
    if (!overwrite && await fs.pathExists(filePath)) {
      throw new Error(`File already exists: ${filePath}. Use --overwrite to overwrite.`);
    }
    
    logger.debug(`Writing to file: ${filePath}`);
    
    // Post-process content based on format
    let processedContent = content;
    
    // コードブロック記法を自動的に削除
    if (format) {
      // 各フォーマットに対応するコードブロック記法のパターン
      const codeBlockPatterns = {
        'json': /^```(?:json)?\s*([\s\S]*?)\s*```$/,
        'ts': /^```(?:typescript|ts|js|javascript)?\s*([\s\S]*?)\s*```$/,
        'text': /^```(?:text|plain)?\s*([\s\S]*?)\s*```$/,
        'markdown': /^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/
      };
      
      const pattern = codeBlockPatterns[format];
      if (pattern) {
        const match = processedContent.match(pattern);
        if (match && match[1]) {
          // コードブロック内の内容を抽出
          processedContent = match[1];
          logger.debug(`Removed code block syntax for ${format} format`);
        }
      }
      
      // JSON形式の場合は追加の整形処理
      if (format === 'json') {
        try {
          const jsonData = JSON.parse(processedContent);
          processedContent = JSON.stringify(jsonData, null, 2);
          logger.debug('JSON validated and formatted successfully');
        } catch (jsonError) {
          logger.warning(`Invalid JSON detected: ${jsonError.message}`);
        }
      }
    }
    
    await fs.writeFile(filePath, processedContent);
    logger.success(`Successfully wrote to ${filePath}`);
  } catch (error) {
    logger.error(`Error writing to file: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
