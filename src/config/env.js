import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),
  DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/catalogobulk',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',


  BATCH_SIZE: Number(process.env.BATCH_SIZE || 500),
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB || 50),
  IMPORT_ERRORS_CAP: Number(process.env.IMPORT_ERRORS_CAP || 1000),
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS || 300),
};
