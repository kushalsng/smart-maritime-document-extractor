import fs from 'fs';
import crypto from 'crypto';
import { llmExecutor } from './llm.service';
import { safeParse } from '../util/prompt-builder';


export const extractService = async (file: Express.Multer.File | undefined) => {
  if (!file) throw new Error('No file');

  const buffer = fs.readFileSync(file.path);

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  const base64 = buffer.toString('base64');

  const raw = await llmExecutor(base64, file.mimetype);

  const json = safeParse(raw);

  return {
    hash,
    data: json
  };
};