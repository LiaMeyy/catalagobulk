import dotenv from 'dotenv';

dotenv.config();

const REQUIRED = [
  'PORT',
  'MONGO_URI',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'MAX_FILE_SIZE_MB',
  'BATCH_SIZE',
  'CACHE_TTL_SECONDS',
  'IMPORT_ERRORS_CAP',
];

const faltantes = REQUIRED.filter(
  (name) => process.env[name] === undefined || process.env[name] === ''
);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB),
  BATCH_SIZE: Number(process.env.BATCH_SIZE),
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS),
  IMPORT_ERRORS_CAP: Number(process.env.IMPORT_ERRORS_CAP),
};
