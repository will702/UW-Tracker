import { MongoClient, Db } from 'mongodb';
import { DATABASE_NAME, MONGODB_URL } from './config';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URL as string);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(DATABASE_NAME);
  return cachedDb;
}

export async function closeDb(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

