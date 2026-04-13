import { v4 as uuidv4 } from 'uuid';
import { boss, queueName } from './pgBoss';
import { createJob } from '../repositories/job.repository';

export const enqueueExtraction = async (data: {
  sessionId: string;
  filePath: string;
  mimeType: string;
  fileName: string;
}) => {
  const jobId = uuidv4();

  await createJob(data.sessionId);

  await boss.send(
    queueName,
    {
      jobId,
      ...data,
    },
    {
      retryLimit: 2,
    }
  );

  return {
    id: jobId,
    sessionId: data.sessionId,
    status: 'QUEUED',
  };
};