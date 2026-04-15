import { boss, queueName } from './pgBoss';
import { createJob } from '../repositories/job.repository';
import { Session } from '../types/extraction.types';

export const enqueueExtraction = async (data: {
  session: Session;
  filePath: string;
  mimeType: string;
  fileName: string;
  webhookUrl?: string;
}) => {

  const job = await createJob(data.session.id);

  await boss.send(
    queueName,
    {
      jobId: job.id,
      ...data,
    },
    {
      retryLimit: 2,
    }
  );

  return job;
};