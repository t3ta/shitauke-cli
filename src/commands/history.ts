import { Command } from 'commander';
import inquirer from 'inquirer';
import { getHistory, getHistoryEntryById, deleteHistoryEntry, clearHistory } from '../utils/history.js';
import { writeFile } from '../utils/file.js';
import * as logger from '../utils/logger.js';

/**
 * Configure the history command
 */
export function configureHistoryCommand(program: Command): void {
  const historyCommand = program
    .command('history')
    .description('Manage request history');
  
  // List history
  historyCommand
    .command('list')
    .description('List request history')
    .option('-n, --limit <limit>', 'Limit the number of entries to show', parseInt, 10)
    .action(async (options) => {
      try {
        const history = await getHistory();
        const limit = Math.min(options.limit, history.length);
        
        if (history.length === 0) {
          logger.info('No history entries found.');
          return;
        }
        
        console.log(`\nShowing ${limit} of ${history.length} history entries:\n`);
        
        for (let i = 0; i < limit; i++) {
          const entry = history[i];
          const date = new Date(entry.timestamp).toLocaleString();
          const model = entry.response.model;
          const provider = entry.response.provider;
          
          // Truncate prompt and response for display
          const promptPreview = entry.prompt.length > 50
            ? entry.prompt.substring(0, 50) + '...'
            : entry.prompt;
          
          console.log(`[${i + 1}] ID: ${entry.id}`);
          console.log(`    Date: ${date}`);
          console.log(`    Model: ${model} (${provider})`);
          console.log(`    Prompt: ${promptPreview}`);
          console.log(`    Output: ${entry.outputFile || 'console'}`);
          
          if (entry.response.usage) {
            console.log(`    Cost: $${entry.response.usage.cost?.toFixed(6) || 'unknown'}`);
          }
          
          console.log('');
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // View a specific history entry
  historyCommand
    .command('show <id>')
    .description('Show details of a specific history entry')
    .action(async (id) => {
      try {
        const entry = await getHistoryEntryById(id);
        
        if (!entry) {
          logger.error(`Entry with ID ${id} not found.`);
          return;
        }
        
        const date = new Date(entry.timestamp).toLocaleString();
        
        console.log(`\nHistory Entry: ${entry.id}`);
        console.log(`Date: ${date}`);
        console.log(`Model: ${entry.response.model} (${entry.response.provider})`);
        
        if (entry.inputFiles && entry.inputFiles.length > 0) {
          console.log(`Input Files: ${entry.inputFiles.join(', ')}`);
        }
        
        if (entry.outputFile) {
          console.log(`Output File: ${entry.outputFile}`);
        }
        
        if (entry.response.usage) {
          const { promptTokens, completionTokens, totalTokens, cost } = entry.response.usage;
          console.log(`Tokens: ${promptTokens} prompt + ${completionTokens} completion = ${totalTokens} total`);
          console.log(`Cost: $${cost?.toFixed(6) || 'unknown'}`);
        }
        
        console.log('\n--- Prompt ---');
        console.log(entry.prompt);
        console.log('--- End of prompt ---\n');
        
        console.log('--- Response ---');
        console.log(entry.response.content);
        console.log('--- End of response ---\n');
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Export a history entry to a file
  historyCommand
    .command('export <id>')
    .description('Export a history entry to a file')
    .option('-o, --output <file>', 'Output file path')
    .option('--overwrite', 'Overwrite the output file if it exists')
    .action(async (id, options) => {
      try {
        const entry = await getHistoryEntryById(id);
        
        if (!entry) {
          logger.error(`Entry with ID ${id} not found.`);
          return;
        }
        
        if (!options.output) {
          logger.error('Output file path is required.');
          return;
        }
        
        // Export the response content
        await writeFile(
          options.output,
          entry.response.content,
          options.overwrite || false
        );
        
        logger.success(`Exported to ${options.output}`);
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Delete a history entry
  historyCommand
    .command('delete <id>')
    .description('Delete a history entry')
    .action(async (id) => {
      try {
        const success = await deleteHistoryEntry(id);
        
        if (success) {
          logger.success(`Deleted entry with ID ${id}.`);
        } else {
          logger.error(`Entry with ID ${id} not found.`);
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Clear all history
  historyCommand
    .command('clear')
    .description('Clear all history entries')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to clear all history entries?',
            default: false
          }
        ]);
        
        if (answers.confirm) {
          await clearHistory();
          logger.success('History cleared.');
        } else {
          logger.info('Operation cancelled.');
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}
