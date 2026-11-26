import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import connectDatabase from './config/mongoose.js';
import { startAnalyticsWorker } from './workers/analyticsWorker.js';

const { PORT, NODE_ENV } = config;

const startServer = async () => {
  await connectDatabase();
  startAnalyticsWorker();

  app.listen(PORT, () => {
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
