import { boss, queueName } from "../queue/pgBoss";
import { updateJobStatus } from "../repositories/job.repository";
import fs from "fs/promises";
import { processExtractionJob } from "../services/extract.service";
import { ExtractJobData } from "../types/extraction.types";

export const registerExtractWorker = async () => {
  await boss.work(
    queueName,
    async ([job]: { id: string; data: ExtractJobData }[]) => {
      const { jobId, filePath, mimeType, session, fileName } = job.data;

      try {
        await updateJobStatus(jobId, "PROCESSING");

        await processExtractionJob({
          jobId,
          filePath,
          mimeType,
          session,
          fileName,
        });
      } finally {
        if (filePath) {
          try {
            fs.unlink(filePath);
          } catch {
            console.warn("Cleanup failed:", filePath);
          }
        }
      }
    },
  );
};
