module.exports = {
  apps: [
    {
      name: 'sistema-asistencia',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ngrok',
      script: 'C:/Users/jpazo/AppData/Local/Microsoft/WindowsApps/ngrok.exe',
      args: 'http --url=civil-seahorse-rightly.ngrok-free.app 5678',
      interpreter: 'none',
      autorestart: true,
      watch: false
    }
  ]
}; 