import { Request, Response } from 'express';
import { getSession } from '../repositories/session.repository';
import { getExtractionsBySession } from '../repositories/extraction.repository';
import { getLatestValidation } from '../repositories/validation.repository';
import { buildReport } from '../services/report.service';

export const getSessionReportController = async (
  req: Request,
  res: Response
) => {
  const { sessionId } = req.params;

  const session = await getSession(sessionId);
  if (!session) {
    return res.status(404).json({
      error: 'SESSION_NOT_FOUND',
      message: `Session ${sessionId} not found`,
    });
  }

  const extractions = await getExtractionsBySession(sessionId);
  const validation = await getLatestValidation(sessionId);

  const report = buildReport({
    sessionId,
    extractions,
    validation,
  });

  return res.status(200).json(report);
};