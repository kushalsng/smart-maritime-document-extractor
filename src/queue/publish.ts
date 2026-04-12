import { boss } from './pgBoss';

export const enqueueExtraction = async (data: any) => {
  await boss.send(String(process.env.QUEUE_NAME), data);
};