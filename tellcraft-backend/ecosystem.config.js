module.exports = {
  apps: [
    {
      name: 'tellcraft-backend',
      script: 'dist/index.js',
      instances: 1, // 單實例（BullMQ Worker 需要）
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      env_file: '.env',
      // 日誌配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/tellcraft/error.log',
      out_file: '/var/log/tellcraft/out.log',
      merge_logs: true,
      // 優雅關閉
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
