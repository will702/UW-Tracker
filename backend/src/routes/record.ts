import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { COLLECTION_NAME } from '../config';
import { getDb } from '../db';
import { formatRecord } from './records';
import type { UWRecord } from '../types';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);
    const filter = buildIdFilter(req.params.id);
    const document = await collection.findOne(filter);
    if (!document) {
      return res.status(404).json({ error: 'Record not found' });
    }
    return res.json(formatRecord(document));
  } catch (error: any) {
    console.error('GET /record/:id failed', error);
    return res.status(500).json({ error: 'Failed to fetch record', message: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const payload = req.body as Partial<UWRecord>;
    if (!payload.code || !payload.companyName || !payload.underwriters?.length) {
      return res.status(400).json({ error: 'code, companyName, and underwriters are required' });
    }

    const now = new Date();
    const document = {
      ...payload,
      underwriters: payload.underwriters.map((uw) => uw.toUpperCase()),
      listingDate: payload.listingDate ? new Date(payload.listingDate) : null,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);
    const result = await collection.insertOne(document);
    const inserted = await collection.findOne({ _id: result.insertedId });
    if (!inserted) {
      return res.status(500).json({ error: 'Failed to read inserted record' });
    }
    return res.status(201).json(formatRecord(inserted));
  } catch (error: any) {
    console.error('POST /record/create failed', error);
    return res.status(500).json({ error: 'Failed to create record', message: error.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { id, ...payload } = req.body as Partial<UWRecord> & { id?: string };
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);
    
    // Check if record exists
    const existing = await collection.findOne(buildIdFilter(id));
    if (!existing) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const updateData: any = {
      ...payload,
      updatedAt: new Date(),
    };

    // Handle underwriters array if provided
    if (payload.underwriters) {
      updateData.underwriters = payload.underwriters.map((uw) => uw.toUpperCase());
    }

    // Handle listingDate if provided
    if (payload.listingDate !== undefined) {
      updateData.listingDate = payload.listingDate ? new Date(payload.listingDate) : null;
    }

    const result = await collection.updateOne(
      buildIdFilter(id),
      { $set: updateData }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const updated = await collection.findOne(buildIdFilter(id));
    return res.json(formatRecord(updated));
  } catch (error: any) {
    console.error('POST /record/update failed', error);
    return res.status(500).json({ error: 'Failed to update record', message: error.message });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body as { id?: string };
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const db = await getDb();
    const collection = db.collection<any>(COLLECTION_NAME);
    const result = await collection.deleteOne(buildIdFilter(id));
    if (!result.deletedCount) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.json({ message: 'Record deleted' });
  } catch (error: any) {
    console.error('POST /record/delete failed', error);
    return res.status(500).json({ error: 'Failed to delete record', message: error.message });
  }
});

function buildIdFilter(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id };
}

export default router;

