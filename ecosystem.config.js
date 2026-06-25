module.exports = {
  apps: [
    {
      name: 'services-be-main',
      script: './build/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
