import fs from 'fs';
import crypto from 'crypto';

export const readFileAndHash = (filePath: string) => {
  const buffer = fs.readFileSync(filePath);

  const hash = crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');

  const base64 = buffer.toString('base64');

  return { buffer, hash, base64 };
};