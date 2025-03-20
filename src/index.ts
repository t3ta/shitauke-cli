#!/usr/bin/env node

import { Command } from 'commander';
import { ensureConfigExists } from './utils/config.js';
import * as logger from './utils/logger.js';
import { configureSendCommand } from './commands/send.js';
import { configureHistoryCommand } from './commands/history.js';
import { configureTemplateCommand } from './commands/template.js';
import { configureCostCommand } from './commands/cost.js';
import { configureExamplesCommand } from './commands/examples.js';

async function main() {
  // Initialize config
  try {
    await ensureConfigExists();
  } catch (error) {
    logger.error(`Error initializing config: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  
  // Setup commander
  const program = new Command();
  
  program
    .name('shitauke')
    .description('CLI tool for sending requests to various AI models')
    .version('1.0.0');
  
  // Configure commands
  configureSendCommand(program);
  configureHistoryCommand(program);
  configureTemplateCommand(program);
  configureCostCommand(program);
  configureExamplesCommand(program);
  
  // Add help text
  program.addHelpText('after', `
Examples:
  shitauke send "Write a hello world program in Python"
  shitauke send -m gpt-4 "Explain the concept of recursion"
  shitauke send -f json "Convert this text to JSON"
  shitauke send -i ./input.txt -o ./output.md
  shitauke template add "article" -d "Template for writing articles"
  shitauke template list
  shitauke history list
  shitauke cost report
  shitauke examples usage     # 使用方法の例を表示
  shitauke examples models    # 各モデルの使用例を表示
  shitauke examples prompts   # 効果的なプロンプトの例を表示
`);
  
  program.parse(process.argv);
}

main().catch(error => {
  logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
