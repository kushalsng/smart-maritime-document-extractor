import fs from 'fs';
import crypto from 'crypto';
import { callLLM } from './llm.service';


export const extractService = async (file: Express.Multer.File | undefined) => {
  if (!file) throw new Error('No file');

  const buffer = fs.readFileSync(file.path);

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  const base64 = buffer.toString('base64');

  const raw = await callLLM(base64, file.mimetype);

  const json = safeParse(raw);

  return {
    hash,
    data: json
  };
};

function safeParse(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const cleaned = text.slice(start, end + 1);
  return JSON.parse(cleaned);
}