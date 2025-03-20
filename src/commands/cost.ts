import { Command } from 'commander';
import inquirer from 'inquirer';
import { getCosts, getTotalCost, clearCosts } from '../utils/costs.js';
import * as logger from '../utils/logger.js';

/**
 * Configure the cost command
 */
export function configureCostCommand(program: Command): void {
  const costCommand = program
    .command('cost')
    .description('Manage and track API costs');
  
  // Generate a cost report
  costCommand
    .command('report')
    .description('Generate a cost report')
    .option('-d, --days <days>', 'Number of days to include in the report', parseInt, 30)
    .option('--from <date>', 'Start date for the report (YYYY-MM-DD)')
    .option('--to <date>', 'End date for the report (YYYY-MM-DD)')
    .action(async (options) => {
      try {
        // Parse date options
        let startDate = new Date(0);
        let endDate = new Date();
        
        if (options.from) {
          startDate = new Date(options.from);
        } else if (options.days) {
          // Calculate start date based on days
          const now = new Date();
          startDate = new Date(now.getTime() - options.days * 24 * 60 * 60 * 1000);
        }
        
        if (options.to) {
          endDate = new Date(options.to);
        }
        
        // Get cost data
        const costs = await getCosts();
        const { totalCost, byModel } = await getTotalCost(startDate, endDate);
        
        if (costs.length === 0) {
          logger.info('No cost data available.');
          return;
        }
        
        // Filter costs for the specified date range
        const filteredCosts = costs.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        if (filteredCosts.length === 0) {
          logger.info('No cost data available for the specified date range.');
          return;
        }
        
        // Print report header
        console.log(`\nCost Report: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        console.log(`Total cost: $${totalCost.toFixed(6)}`);
        console.log(`Total requests: ${filteredCosts.length}`);
        console.log('\nBreakdown by model:');
        
        // Print cost breakdown by model
        for (const [model, cost] of Object.entries(byModel)) {
          const count = filteredCosts.filter(entry => entry.model === model).length;
          console.log(`${model}: $${cost.toFixed(6)} (${count} requests)`);
        }
        
        // Print monthly summary if the date range is more than a month
        if (options.days > 30 || options.from) {
          console.log('\nMonthly summary:');
          
          // Group costs by month
          const byMonth: Record<string, { cost: number; count: number }> = {};
          
          filteredCosts.forEach(entry => {
            const date = new Date(entry.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!byMonth[monthKey]) {
              byMonth[monthKey] = { cost: 0, count: 0 };
            }
            
            byMonth[monthKey].cost += entry.cost;
            byMonth[monthKey].count++;
          });
          
          // Print monthly summary
          for (const [month, data] of Object.entries(byMonth)) {
            console.log(`${month}: $${data.cost.toFixed(6)} (${data.count} requests)`);
          }
        }
        
        // Print recent costs
        console.log('\nRecent costs:');
        
        for (let i = 0; i < Math.min(5, filteredCosts.length); i++) {
          const entry = filteredCosts[i];
          const date = new Date(entry.timestamp).toLocaleString();
          console.log(`${date}: ${entry.model} - $${entry.cost.toFixed(6)}`);
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  
  // Clear cost data
  costCommand
    .command('clear')
    .description('Clear all cost data')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to clear all cost data?',
            default: false
          }
        ]);
        
        if (answers.confirm) {
          await clearCosts();
          logger.success('Cost data cleared.');
        } else {
          logger.info('Operation cancelled.');
        }
      } catch (error) {
        logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}
