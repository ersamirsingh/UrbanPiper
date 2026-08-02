import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes/api.v1.js';
import './integrations/adapters/adapter-registry.js';
import { initWorkerRegistry } from './jobs/register-workers.js';
initWorkerRegistry();
import { errorHandler } from './middlewares/error.middleware.js';
import { rateLimiter } from './middlewares/rateLimiter.middleware.js';
import { HealthController } from './modules/health/health.controller.js';


const app: Express = express();

app.use(helmet());

app.use(cors({
   credentials: true,
   origin: (origin, callback) => {
      if (!origin) {
         return callback(null, true);
      }

      if (
         origin === process.env.CLIENT_URL ||
         origin.includes('localhost') ||
         origin.includes('127.0.0.1')
      ) {
         return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
   }
}));

app.use(express.json());
app.use(cookieParser())

app.get("/health", HealthController.getPublicHealth);

app.use('/api', rateLimiter({
   windowMs: 15 * 60 * 1000,
   max: 200,
   message: 'Too many requests from this IP, please try again after 15 minutes'
}));

app.use('/api', router);

app.use(errorHandler);

export default app;
