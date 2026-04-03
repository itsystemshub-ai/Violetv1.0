export class Logger {
  private static prefix = '[ERP ZENITH]';

  static log(message: string) {
    console.log(`\x1b[32m${this.prefix} [INFO]\x1b[0m ${message}`);
  }

  static error(message: string, error?: any) {
    console.error(`\x1b[31m${this.prefix} [ERROR]\x1b[0m ${message}`, error || '');
  }

  static warn(message: string) {
    console.warn(`\x1b[33m${this.prefix} [WARN]\x1b[0m ${message}`);
  }

  static debug(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`\x1b[36m${this.prefix} [DEBUG]\x1b[0m ${message}`);
    }
  }

  static verbose(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\x1b[90m${this.prefix} [VERBOSE]\x1b[0m ${message}`);
    }
  }
}
