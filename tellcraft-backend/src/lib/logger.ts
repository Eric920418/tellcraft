import pino from 'pino'

const rootLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 },
    },
    formatters: {
      level(label: string) {
        return { level: label }
      },
    },
  }),
})

export function createLogger(module: string) {
  return rootLogger.child({ module })
}

export type Logger = ReturnType<typeof createLogger>
