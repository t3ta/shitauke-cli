import { Command } from 'commander';
import inquirer from 'inquirer';
import { getTemplates, getTemplate, saveTemplate, deleteTemplate } from '../utils/templates.js';
import * as logger from '../utils/logger.js';

/**
 * Configure the template command
 */
export function configureTemplateCommand(program: Command): void {
  const templateCommand = program
    .command('template')
    .description('Manage prompt templates');
  
  // List all templates
  templateCommand
    .command('list')
    .description('List all templates')
    .action(async () => {
      try {
        const templates = await getTemplates();
        const templateNames = Object.keys(templates);
        
        if (templateNames.length === 0) {
          logger.info('No templates found.');
          return;
        }
        
        console.log(`\nFound ${templateNames.length} templates:\n`);
        
        for (const name of templateNames) {
          const template = templates[name];
          const description = template.description || 'No description';
          const promptPreview = template.prompt.length > 50
            ? template.prompt.substring(0, 50) + '...'
            : template.prompt;
          
          console.log(`Name: ${name}`);
          console.log(`Description: ${description}`);
          console.log(`Prompt: ${promptPreview}`);
          console.log('');
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Show a specific template
  templateCommand
    .command('show <name>')
    .description('Show a specific template')
    .action(async (name) => {
      try {
        const template = await getTemplate(name);
        
        if (!template) {
          logger.error(`Template not found: ${name}`);
          return;
        }
        
        console.log(`\nTemplate: ${name}`);
        
        if (template.description) {
          console.log(`Description: ${template.description}`);
        }
        
        console.log('\n--- Prompt ---');
        console.log(template.prompt);
        console.log('--- End of prompt ---\n');
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Add or update a template
  templateCommand
    .command('add <name>')
    .description('Add a new template or update an existing one')
    .option('-p, --prompt <prompt>', 'Template prompt')
    .option('-d, --description <description>', 'Template description')
    .action(async (name, options) => {
      try {
        let prompt = options.prompt;
        let description = options.description;
        
        // If no prompt is provided, open an editor
        if (!prompt) {
          const answers = await inquirer.prompt([
            {
              type: 'editor',
              name: 'prompt',
              message: 'Enter the template prompt:',
              validate: (input) => input.trim().length > 0 ? true : 'Prompt cannot be empty'
            }
          ]);
          
          prompt = answers.prompt;
        }
        
        // If no description is provided and not in options, prompt the user
        if (!description) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'description',
              message: 'Enter a description for the template (optional):',
            }
          ]);
          
          description = answers.description;
        }
        
        await saveTemplate(name, prompt, description);
        logger.success(`Template '${name}' saved.`);
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Delete a template
  templateCommand
    .command('delete <name>')
    .description('Delete a template')
    .action(async (name) => {
      try {
        const success = await deleteTemplate(name);
        
        if (success) {
          logger.success(`Template '${name}' deleted.`);
        } else {
          logger.error(`Template not found: ${name}`);
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}
