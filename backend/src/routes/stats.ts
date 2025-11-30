import { Router } from 'express';
import { COLLECTION_NAME } from '../config';
import { getDb } from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);

    const documents = await collection
      .find({}, { projection: { code: 1, underwriters: 1, uw: 1, updatedAt: 1 } })
      .toArray();

    const uniqueCodes = new Set(documents.map((doc) => doc.code).filter(Boolean));
    const underwriters = new Set<string>();

    documents.forEach((doc) => {
      (doc.underwriters || []).forEach((uw: string) => underwriters.add(uw));
      if (doc.uw) {
        underwriters.add(doc.uw);
      }
    });

    const lastUpdated = documents
      .map((doc) => doc.updatedAt)
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    return res.json({
      totalRecords: uniqueCodes.size,
      totalCompanies: uniqueCodes.size,
      totalUW: underwriters.size,
      lastUpdated,
    });
  } catch (error: any) {
    console.error('GET /stats failed', error);
    return res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

export default router;

