import { Router } from 'express';
import { COLLECTION_NAME } from '../config';
import { getDb } from '../db';
import { formatRecord } from './records';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);

    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
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

    const documents = await collection
      .find(query)
      .sort({ listingDate: -1 })
      .toArray();

    const grouped = new Map<string, ReturnType<typeof formatRecord>>();
    documents.forEach((doc) => {
      const formatted = formatRecord(doc);
      const existing = grouped.get(formatted.code);
      if (!existing) {
        grouped.set(formatted.code, formatted);
        return;
      }
      const mergedUnderwriters = new Set([
        ...(existing.underwriters || []),
        ...(formatted.underwriters || []),
      ]);
      existing.underwriters = Array.from(mergedUnderwriters);
    });

    const data = Array.from(grouped.values())
      .sort((a, b) => {
        const aDate = a.listingDate ? new Date(a.listingDate).getTime() : 0;
        const bDate = b.listingDate ? new Date(b.listingDate).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, limit);

    return res.json({
      data,
      total: grouped.size,
      count: data.length,
    });
  } catch (error: any) {
    console.error('GET /grouped-records failed', error);
    return res.status(500).json({ error: 'Failed to fetch grouped records', message: error.message });
  }
});

export default router;

