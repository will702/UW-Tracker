import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

export const API_PORT = Number(process.env.API_PORT || 3001);
export const MONGODB_URL = process.env.MONGODB_URL;
export const DATABASE_NAME = process.env.DATABASE_NAME || 'uw_tracker';
export const COLLECTION_NAME = process.env.COLLECTION_NAME || 'uw_records';

if (!MONGODB_URL) {
  throw new Error('Missing MONGODB_URL in backend/.env');
}

