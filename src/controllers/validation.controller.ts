import { Request, Response } from 'express';
import { getSession } from '../repositories/session.repository';
import { getExtractionsBySession } from '../repositories/extraction.repository';
import { runValidationLLM } from '../services/validation.service';
import { saveValidation } from '../repositories/validation.repository';

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