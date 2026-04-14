import { Request, Response } from 'express';
import { getSession } from '../repositories/session.repository';
import { getExtractionsBySession } from '../repositories/extraction.repository';
import { runValidationLLM } from '../services/validation.service';
import { saveValidation } from '../repositories/validation.repository';
import { normalizeScore, normalizeStatus } from '../util/misc';

export const validateSessionController = async (
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

  if (extractions.length < 2) {
    return res.status(400).json({
      error: 'INSUFFICIENT_DOCUMENTS',
      message: 'At least 2 documents required for validation',
    });
  }

  const result = await runValidationLLM(extractions);

  await saveValidation(sessionId, result);

  const response = {
    sessionId,
    holderProfile: result?.holderProfile ?? {},
    consistencyChecks: result?.consistencyChecks ?? [],
    missingDocuments: result?.missingDocuments ?? [],
    expiringDocuments: result?.expiringDocuments ?? [],
    medicalFlags: result?.medicalFlags ?? [],
    overallStatus: normalizeStatus(result?.overallStatus),
    overallScore: normalizeScore(result?.overallScore),
    summary: result?.summary ?? '',
    recommendations: result?.recommendations ?? [],
    validatedAt: new Date().toISOString(),
  };

  return res.json(response);
};