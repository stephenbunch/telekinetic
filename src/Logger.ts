export enum LogLevel {
  NONE = 0,
  TRACE = 1,
}

export class Logger {
  private level: number;

  static current = new Logger(LogLevel.NONE);

  constructor(level: LogLevel) {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  trace(message: () => any[]) {
    if (this.level >= LogLevel.TRACE) {
      console.log(...message());
    }
  }
}
