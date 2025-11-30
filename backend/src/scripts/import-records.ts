import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { COLLECTION_NAME } from '../config';
import { getDb, closeDb } from '../db';
import { UWRecord } from '../types';

async function run() {
  const [, , inputPathArg] = process.argv;
  const inputPath = resolve(process.cwd(), inputPathArg || 'data/sample-records.json');

  console.log(`📦 Importing records from ${inputPath}`);

  const fileContents = await readFile(inputPath, 'utf-8');
  const records = JSON.parse(fileContents) as UWRecord[];

  if (!Array.isArray(records) || records.length === 0) {
    console.error('No records to import. Provide a JSON array of records.');
    process.exit(1);
  }

  const db = await getDb();
  const collection = db.collection<any>(COLLECTION_NAME);

  const normalized = records.map((record) => ({
    ...record,
    underwriters: (record.underwriters || []).map((uw) => uw.toUpperCase()),
    listingDate: record.listingDate ? new Date(record.listingDate) : null,
    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
    updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
  }));

  const result = await collection.insertMany(normalized);
  console.log(`✅ Imported ${result.insertedCount} records`);
}

run()
  .catch((error) => {
    console.error('❌ Import failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });

