import chalk from 'chalk';

// Log levels
export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR
}

// Current log level
let currentLogLevel = LogLevel.INFO;

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Log a debug message (only shown if log level is DEBUG)
 */
export function debug(message: string): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(chalk.gray(`🔍 DEBUG: ${message}`));
  }
}

/**
 * Log an info message
 */
export function info(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.blue(`ℹ️ INFO: ${message}`));
  }
}

/**
 * Log a success message
 */
export function success(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.green(`✅ SUCCESS: ${message}`));
  }
}

/**
 * Log a warning message
 */
export function warning(message: string): void {
  if (currentLogLevel <= LogLevel.WARNING) {
    console.log(chalk.yellow(`⚠️ WARNING: ${message}`));
  }
}

/**
 * Log an error message
 */
export function error(message: string): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.log(chalk.red(`❌ ERROR: ${message}`));
  }
}

/**
 * Show a spinner while an async operation is in progress
 */
export function spinner(message: string): { stop: (endMessage?: string) => void } {
  process.stdout.write(`${chalk.cyan('⏳')} ${message}`);
  const interval = setInterval(() => {
    process.stdout.write('.');
  }, 500);
  
  return {
    stop: (endMessage?: string) => {
      clearInterval(interval);
      process.stdout.write('\r\x1b[K');
      if (endMessage) {
        success(endMessage);
      }
    }
  };
}
