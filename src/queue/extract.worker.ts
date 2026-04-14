import { boss, queueName } from "../queue/pgBoss";
import { updateJobStatus } from "../repositories/job.repository";
import { createExtraction } from "../repositories/extraction.repository";
import { llmExecutor } from "../services/llm.service";
import { ExtractJobData } from "../types/job.types";
import fs from 'fs/promises';

export const registerExtractWorker = async () => {
  await boss.work(
    queueName,
    async ([job]: { id: string; data: ExtractJobData }[]) => {
      const { jobId, filePath, mimeType, sessionId, fileName } = job.data;

      try {
        await updateJobStatus(jobId, "PROCESSING");

        const raw = await llmExecutor(fileBase64, mimeType);

        const extraction = await createExtraction({
          session_id: sessionId,
          file_name: fileName,
          file_hash: "hash",
          raw_llm_response: raw,
        });

        await updateJobStatus(jobId, "COMPLETE", {
          extractionId: extraction?.id,
        });
      } catch (err: any) {
        await updateJobStatus(jobId, "FAILED", {
          error: err.message,
        });
      } finally {
        if (filePath) {
        try {
          await fs.unlink(filePath);
        } catch {
          console.warn('Cleanup failed:', filePath);
        }
      }
      }
    },
  );
};
