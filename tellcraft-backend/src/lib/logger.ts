import pino from 'pino'

// logger 初始化很早，env 可能尚未驗證，保留 process.env fallback
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
