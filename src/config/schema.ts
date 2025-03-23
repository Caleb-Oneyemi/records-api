import * as Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid('production', 'development', 'test'),
  API_URL: Joi.string().uri().required(),
  MONGO_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
});
