import app from './app';
import { env } from './config/env';
import { startBackgroundJobs } from './jobs/cleanup.job';

app.listen(env.PORT, () => {
  console.log(`[server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);

  // Start background jobs after the server is listening
  startBackgroundJobs();
});
