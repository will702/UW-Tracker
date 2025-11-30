import { Router } from 'express';
import { COLLECTION_NAME } from '../config';
import { getDb } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);

    const documents = await collection
      .find({}, { projection: { underwriters: 1, uw: 1 } })
      .toArray();

    const stats = new Map<string, number>();
    documents.forEach((doc) => {
      const list: string[] = Array.isArray(doc.underwriters) && doc.underwriters.length
        ? doc.underwriters
        : doc.uw
        ? [doc.uw]
        : [];
      list.forEach((uw) => {
        const code = uw.toUpperCase();
        stats.set(code, (stats.get(code) ?? 0) + 1);
      });
    });

    const search = (req.query.search as string) || '';
    const data = Array.from(stats.entries())
      .map(([code, count]) => ({
        code,
        ipoCount: count,
        totalIPOs: count,
      }))
      .filter((entry) => !search || entry.code.includes(search.toUpperCase()))
      .sort((a, b) => b.ipoCount - a.ipoCount);

    return res.json({
      data,
      total: data.length,
    });
  } catch (error: any) {
    console.error('GET /underwriters failed', error);
    return res.status(500).json({ error: 'Failed to fetch underwriters', message: error.message });
  }
});

export default router;

