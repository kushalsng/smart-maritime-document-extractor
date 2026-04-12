import { Request, Response } from 'express';
import { getSession } from '../repositories/session.repository';
import { getExtractionsBySession } from '../repositories/extraction.repository';

export const getSessionController = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = await getSession(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'SESSION_NOT_FOUND',
      message: `Session ${sessionId} not found`,
    });
  }

  const extractions = await getExtractionsBySession(sessionId);

  const documents = extractions?.map((e) => ({
    id: e.id,
    fileName: e.file_name,
    documentType: e.document_type,
    applicableRole: e.applicable_role,
    holderName: e.holder_name,
    confidence: e.confidence,
    isExpired: e.is_expired,
    flagCount: e.flags_json?.length || 0,
    criticalFlagCount:
      e.flags_json?.filter((f: any) => f.severity === 'CRITICAL').length || 0,
    createdAt: e.created_at,
  }));

  // derive overall health
  const hasCritical = documents?.some((d) => d.criticalFlagCount > 0);
  const hasWarnings = documents?.some((d) => d.flagCount > 0);

  let overallHealth = 'OK';
  if (hasCritical) overallHealth = 'CRITICAL';
  else if (hasWarnings) overallHealth = 'WARN';

  return res.json({
    sessionId,
    documentCount: documents?.length || 0,
    detectedRole: 'UNKNOWN', // can enhance later
    overallHealth,
    documents,
    pendingJobs: [], // optional enhancement
  });
};