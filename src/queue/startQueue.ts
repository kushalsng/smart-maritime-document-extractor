import { boss, queueName } from './pgBoss'

export const startQueue = async () => {
  await boss.start();
  await boss.createQueue(queueName);
  console.log('pg-boss started');
};