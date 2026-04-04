module.exports = {
  apps: [
    {
      name: 'tellcraft-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      node_args: '--max-old-space-size=1536 --max-semi-space-size=64',
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
      kill_timeout: 30000,    // 30s：API 進程不跑重任務，關閉較快
      wait_ready: true,
      listen_timeout: 15000,
    },
    {
      name: 'tellcraft-worker',
      script: 'dist/worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '3G',
      node_args: '--max-old-space-size=2560 --max-semi-space-size=64',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      // 日誌配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/tellcraft/worker-error.log',
      out_file: '/var/log/tellcraft/worker-out.log',
      merge_logs: true,
      // 優雅關閉（Worker 需要等 active LLM job 完成）
      kill_timeout: 90000,    // 90s
      wait_ready: true,
      listen_timeout: 30000,
    },
  ],
}
