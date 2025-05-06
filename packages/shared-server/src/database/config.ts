import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import knexStringcase from 'knex-stringcase';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const connectionString = `postgres://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_ENDPOINT}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'inkverse'}`;

// Define the type and create the configuration object in one go
const config = {
  client: 'pg',
  version: '13.16',
  searchPath: ['knex', 'public'],
  useNullAsDefault: true,
  connection: {
    connectionString,
  },
  pool: { min: 0, max: 20 },
  acquireConnectionTimeout: 1800000,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    tableName: 'migrations',
  },
  ...knexStringcase.default(),
} as const;

export default config;
