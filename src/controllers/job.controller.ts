import { Request, Response } from "express";
import { getJob, getQueuePosition } from "../repositories/job.repository";
import { getExtractionById } from "../repositories/extraction.repository";
import { mapLLMToResponse } from "../util/extract.util";
import { isRetryable } from "../util/misc";
import { boss } from "../queue/pgBoss";

export const getJobController = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: "JOB_NOT_FOUND",
      message: `Job ${jobId} not found`,
    });
  }

  // QUEUED / PROCESSING
  if (job.status === "QUEUED" || job.status === "PROCESSING") {
    const queuePosition = await getQueuePosition(job.id);

    // simple estimation
    const avgProcessingMs = 3000;

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      queuePosition,
      startedAt: job.started_at ? new Date(job.started_at).toISOString() : null,
      estimatedCompleteMs:
        queuePosition !== null
          ? queuePosition * avgProcessingMs
          : avgProcessingMs,
    });
  }

  // COMPLETE
  if (job.status === "COMPLETE") {
    const extraction = await getExtractionById(job.extraction_id);

    if (!extraction) {
      return res.status(500).json({
        error: "EXTRACTION_NOT_FOUND",
        message: "Extraction result missing for completed job",
      });
    }

    const parsed = JSON.parse(extraction.raw_llm_response);

    const result = mapLLMToResponse(parsed, extraction);

    return res.status(200).json({
      jobId: job.id,
      status: "COMPLETE",
      extractionId: job.extraction_id,
      result,
      completedAt: new Date(job.completed_at!).toISOString(),
    });
  }

  if (job.status === "FAILED") {
    return res.status(200).json({
      jobId: job.id,
      status: "FAILED",
      error: job.error_code || "INTERNAL_ERROR",
      message: job.error_message || "Job failed due to an unexpected error",
      failedAt: job.completed_at
        ? new Date(job.completed_at).toISOString()
        : null,
      retryable: isRetryable(job.error_code),
    });
  }
};

export const retryJobController = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "JOB_NOT_FOUND" });
  }

  if (job.status !== "FAILED") {
    return res.status(400).json({
      error: "INVALID_STATE",
      message: "Only FAILED jobs can be retried",
    });
  }

  await boss.send(process.env.QUEUE_NAME!, {
    jobId,
    filePath: job.file_path,
    mimeType: job.mime_type,
    sessionId: job.session_id,
    fileName: job.file_name,
    webhookUrl: job.webhook_url,
  });

  return res.json({
    jobId: job.id,
    sessionId: job.sessionId,
    status: "QUEUED",
    pollUrl: `/api/jobs/${job.id}`,
    estimatedWaitMs: 6000,
  });
};
