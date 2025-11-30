import { Router } from 'express';
import { COLLECTION_NAME } from '../config';
import { getDb } from '../db';
import { UWRecord } from '../types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);

    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
    const offset = parseInt((req.query.offset as string) || '0', 10);
    const search = (req.query.search as string) || '';
    const searchType = (req.query.searchType as string) || 'underwriter';

    const query: Record<string, unknown> = {};
    if (search) {
      if (searchType === 'stock') {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ];
      } else {
        query.underwriters = { $in: [search.toUpperCase()] };
      }
    }

    const total = await collection.countDocuments(query);
    const records = await collection
      .find(query)
      .sort({ listingDate: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return res.json({
      data: records.map(formatRecord),
      total,
      count: records.length,
    });
  } catch (error: any) {
    console.error('GET /records failed', error);
    return res.status(500).json({ error: 'Failed to fetch records', message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body as Partial<UWRecord>;
    if (!payload.code || !payload.companyName || !payload.underwriters?.length) {
      return res.status(400).json({ error: 'code, companyName, and underwriters are required' });
    }

    const now = new Date();
    const document = {
      ...payload,
      underwriters: payload.underwriters.map((uw) => uw.toUpperCase()),
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);
    const result = await collection.insertOne(document);

    const inserted = await collection.findOne({ _id: result.insertedId });
    return res.status(201).json(formatRecord(inserted));
  } catch (error: any) {
    console.error('POST /records failed', error);
    return res.status(500).json({ error: 'Failed to create record', message: error.message });
  }
});

export function formatRecord(record: any): UWRecord {
  if (!record) {
    throw new Error('Record not found');
  }

  const iso = (value?: Date | string | null) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.toISOString();
  };

  return {
    _id: record._id?.toString(),
    code: record.code,
    companyName: record.companyName,
    underwriters: record.underwriters || [],
    ipoPrice: record.ipoPrice ?? null,
    listingBoard: record.listingBoard ?? null,
    listingDate: iso(record.listingDate),
    returnD1: record.returnD1 ?? null,
    returnD2: record.returnD2 ?? null,
    returnD3: record.returnD3 ?? null,
    returnD4: record.returnD4 ?? null,
    returnD5: record.returnD5 ?? null,
    returnD6: record.returnD6 ?? null,
    returnD7: record.returnD7 ?? null,
    record: record.record ?? null,
    createdAt: iso(record.createdAt) || undefined,
    updatedAt: iso(record.updatedAt) || undefined,
  };
}

export default router;

