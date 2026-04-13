import { Request, Response } from "express";
import { getJob } from "../repositories/job.repository";
import { getExtractionById } from "../repositories/extraction.repository";

export const getJobController = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const job = await getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: "JOB_NOT_FOUND",
      message: `Job ${jobId} not found`,
    });
  }

  // PROCESSING / QUEUED
  if (job.status === "QUEUED" || job.status === "PROCESSING") {
    return res.json({
      jobId: job.id,
      status: job.status,
      queuePosition: null,
      startedAt: job.started_at,
      estimatedCompleteMs: null,
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

    return res.json({
      jobId: job.id,
      status: "COMPLETE",
      extractionId: job.extraction_id,
      result: extraction,
      completedAt: job.completed_at,
    });
  }

  // FAILED
  if (job.status === "FAILED") {
    return res.json({
      jobId: job.id,
      status: "FAILED",
      error: job.error_code || "INTERNAL_ERROR",
      message: job.error_message,
      failedAt: job.completed_at,
      retryable: true,
    });
  }
};
