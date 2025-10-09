/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple Next.js logger utility

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success'

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.isDev && level === 'debug') return

    const timestamp = new Date().toISOString()
    const prefix = this.getPrefix(level)

    const logMethod =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

    logMethod(`${prefix} [${timestamp}] ${message}`, ...args)
  }

  private getPrefix(level: LogLevel): string {
    switch (level) {
      case 'info':
        return '🔵 INFO'
      case 'warn':
        return '🟡 WARN'
      case 'error':
        return '🔴 ERROR'
      case 'debug':
        return '🔍 DEBUG'
      case 'success':
        return '✅ SUCCESS'
      default:
        return '📝 LOG'
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args)
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }

  success(message: string, ...args: any[]) {
    this.log('success', message, ...args)
  }

  // API-specific logging methods
  apiRequest(method: string, path: string, userId?: string) {
    this.info(`${method} ${path}`, userId ? { userId } : {})
  }

  apiError(method: string, path: string, error: any, userId?: string) {
    this.error(`${method} ${path} failed`, {
      error: error.message || error,
      userId,
    })
  }

  apiSuccess(method: string, path: string, duration?: number, userId?: string) {
    this.success(`${method} ${path} completed`, {
      duration: duration ? `${duration}ms` : undefined,
      userId,
    })
  }
}

export const logger = new Logger()
