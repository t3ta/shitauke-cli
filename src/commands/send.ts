import { Command } from 'commander';
import inquirer from 'inquirer';
import { getAIService } from '../services/ai-service.js';
import { RequestOptions, ModelProvider, OutputFormat } from '../models/types.js';
import { getTemplate } from '../utils/templates.js';
import { addHistoryEntry } from '../utils/history.js';
import { addCostEntry } from '../utils/costs.js';
import { readFiles, writeFile } from '../utils/file.js';
import * as logger from '../utils/logger.js';
import { getDefaultModel, getDefaultFormat } from '../utils/config.js';

/**
 * Configure the send command
 */
export function configureSendCommand(program: Command): void {
  program
    .command('send [prompt]')
    .description('Send a prompt to an AI model')
    .option('-m, --model <model>', 'Specify the AI model to use')
    .option('-p, --provider <provider>', 'Specify the AI provider (openai, anthropic, gemini, auto)')
    .option('-f, --format <format>', 'Specify the output format (json, markdown, text)')
    .option('-i, --input <files...>', 'Input files to include with the prompt')
    .option('-o, --output <file>', 'Output file to write the response to')
    .option('--overwrite', 'Overwrite the output file if it exists')
    .option('-t, --template <name>', 'Use a saved template')
    .option('--stream', 'Enable streaming output for supported models')
    .option('--temperature <value>', 'Set the temperature (randomness) of the model', parseFloat)
    .option('--max-tokens <value>', 'Set the maximum tokens for the response', parseInt)
    .action(async (promptArg, options) => {
      try {
        let finalPrompt = promptArg;
        
        // If template is specified, use it
        if (options.template) {
          const template = await getTemplate(options.template);
          
          if (!template) {
            logger.error(`Template not found: ${options.template}`);
            return;
          }
          
          logger.info(`Using template: ${options.template}`);
          
          if (finalPrompt) {
            // If prompt is provided, append it to the template
            finalPrompt = `${template.prompt}\n\n${finalPrompt}`;
          } else {
            // If no prompt is provided, use the template as is
            finalPrompt = template.prompt;
          }
        }
        
        // If no prompt is provided and no template is specified, prompt the user
        if (!finalPrompt) {
          // Try to read from stdin if available
          if (!process.stdin.isTTY && process.stdin.readable) {
            // Read from stdin
            let stdinData = '';
            process.stdin.setEncoding('utf8');
            
            const stdinPromise = new Promise<string>((resolve) => {
              process.stdin.on('data', (chunk) => {
                stdinData += chunk;
              });
              
              process.stdin.on('end', () => {
                resolve(stdinData.trim());
              });
            });
            
            try {
              finalPrompt = await stdinPromise;
            } catch (error) {
              logger.error(`Error reading from stdin: ${error}`);
            }
          }
          
          // If stdin was not available or empty, prompt interactively
          if (!finalPrompt) {
            const answers = await inquirer.prompt([
              {
                type: 'editor',
                name: 'prompt',
                message: 'Enter your prompt:',
                validate: (input) => input.trim().length > 0 ? true : 'Prompt cannot be empty'
              }
            ]);
            
            finalPrompt = answers.prompt;
          }
        }
        
        // Get default model and format if not specified
        const model = options.model || await getDefaultModel();
        const format = (options.format || await getDefaultFormat()) as OutputFormat;
        const provider = options.provider as ModelProvider || 'auto';
        
        // Prepare request options
        const requestOptions: RequestOptions = {
          prompt: finalPrompt,
          model,
          provider,
          format,
          inputFiles: options.input,
          outputFile: options.output,
          overwrite: options.overwrite,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          stream: options.stream
        };
        
        // Read input files if provided
        if (requestOptions.inputFiles && requestOptions.inputFiles.length > 0) {
          logger.info(`Reading ${requestOptions.inputFiles.length} input files...`);
          const fileContents = await readFiles(requestOptions.inputFiles);
          
          // Append file contents to prompt
          for (const [filePath, content] of fileContents.entries()) {
            const fileName = filePath.split('/').pop() || filePath;
            finalPrompt += `\n\n--- File: ${fileName} ---\n${content}\n--- End of file ---`;
          }
          
          requestOptions.prompt = finalPrompt;
        }
        
        // Get the appropriate AI service
        const aiService = await getAIService(model, provider);
        
        // Send the request
        const response = await aiService.sendRequest(requestOptions);
        
        // Add to history
        await addHistoryEntry(requestOptions, response);
        
        // Add to cost tracking
        if (response.usage) {
          await addCostEntry(
            response.model,
            response.provider,
            response.usage.promptTokens || 0,
            response.usage.completionTokens || 0
          );
        }
        
        // Write to output file if specified
        if (requestOptions.outputFile) {
          await writeFile(
            requestOptions.outputFile,
            response.content,
            requestOptions.overwrite || false
          );
        } else {
          // Print the response
          console.log('\n--- Response ---');
          console.log(response.content);
          console.log('--- End of response ---\n');
          
          // Print usage information
          if (response.usage) {
            const { promptTokens, completionTokens, totalTokens, cost } = response.usage;
            console.log(`Model: ${response.model} (${response.provider})`);
            console.log(`Tokens: ${promptTokens} prompt + ${completionTokens} completion = ${totalTokens} total`);
            console.log(`Estimated cost: $${cost?.toFixed(6)}`);
          }
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}
