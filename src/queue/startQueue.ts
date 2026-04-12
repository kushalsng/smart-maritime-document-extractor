import { boss } from './pgBoss'

export const startQueue = async () => {
  await boss.start();
  await boss.createQueue(String(process.env.QUEUE_NAME));
  console.log('pg-boss started');
};