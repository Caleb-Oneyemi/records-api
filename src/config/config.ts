import { Environment } from './interface';

export const envConfig = (): Environment => ({
  port: parseInt(process.env.PORT),
  env: process.env.NODE_ENV,
  apiUrl: process.env.API_URL,
  mongoUrl: process.env.MONGO_URL,
  redisUrl: process.env.REDIS_URL,
});
