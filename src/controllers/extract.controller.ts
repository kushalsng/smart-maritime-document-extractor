import { Request, Response } from 'express';
import { extractService } from '../services/extract.service';
import { enqueueExtraction } from '../queue/publish';
import fs from 'fs/promises';
import { resolveSession } from '../util/session.util';


export const extractController = async (req: Request, res: Response) => {
  const file = req.file;
  const mode = (req.query.mode as string) || 'sync';
  try {

    if (!file) {
      return res.status(400).json({
        error: 'NO_FILE',
        message: 'No file uploaded',
      });
    }

    const session = await resolveSession(req.body.sessionId);

    // SYNC MODE
    if (mode === 'sync') {
      const result = await extractService(
        file,
        session
      );

      if (result.deduplicated) {
        res.setHeader('X-Deduplicated', 'true');
      }

      return res.status(200).json(result.extraction);
    }

    // ASYNC MODE
    if (mode === 'async') {
      const job = await enqueueExtraction({
        filePath: file.path,
        mimeType: file.mimetype,
        fileName: file.originalname,
        session,
      });

      return res.status(202).json({
        jobId: job.id,
        sessionId: job.sessionId,
        status: 'QUEUED',
        pollUrl: `/api/jobs/${job.id}`,
        estimatedWaitMs: 6000,
      });
    }

    return res.status(400).json({
      error: 'INVALID_MODE',
      message: 'Mode must be sync or async',
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message,
      extractionId: err.extractionId || null,
      retryAfterMs: null,
    });
  } finally {
    if (file?.path && mode === 'sync') {
      try {
        fs.unlink(file.path);
      } catch (e) {
        console.warn('Failed to delete temp file:', file.path);
      }
    }
  }
};