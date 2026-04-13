import { boss } from "../queue/pgBoss";
import { updateJobStatus } from "../repositories/job.repository";
import { createExtraction } from "../repositories/extraction.repository";
import { llmExecutor } from "../services/llm.service";
import { ExtractJobData } from "../types/job.types";

export const registerExtractWorker = async () => {
  await boss.work(
    String(process.env.QUEUE_NAME),
    async ([job]: { id: string; data: ExtractJobData }[]) => {
      const { jobId, fileBase64, mimeType, sessionId, fileName } = job.data;

      try {
        await updateJobStatus(jobId, "PROCESSING");

        const raw = await llmExecutor(fileBase64, mimeType);

        const extraction = await createExtraction({
          sessionId,
          fileName,
          fileHash: "TODO_HASH", // pass properly
          rawResponse: raw,
        });

        await updateJobStatus(jobId, "COMPLETE", {
          extractionId: extraction?.id,
        });
      } catch (err: any) {
        await updateJobStatus(jobId, "FAILED", {
          error: err.message,
        });
      }
    },
  );
};
