import { findExtractionByHashAndSession } from "../repositories/extraction.repository";
import { createExtraction } from "../repositories/extraction.repository";
import { llmExecutor } from "./llm.service";
import { safeParse } from "../util/prompt-builder";
import { readFileAndHash } from "../util/file.util";
import { mapLLMToExtraction, mapLLMToResponse } from "../util/extract.util";
import { buildError } from "../util/misc";
import { updateJobStatus } from "../repositories/job.repository";
import { Session } from "../types/extraction.types";

export const extractService = async (
  file: Express.Multer.File,
  session: Session,
) => {
  if (!file) throw buildError(400, "NO_FILE", "No file uploaded");

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (!allowedTypes.includes(file.mimetype)) {
    throw buildError(400, "UNSUPPORTED_FORMAT", "Unsupported file type");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw buildError(413, "FILE_TOO_LARGE", "File exceeds 10MB");
  }

  const { base64, hash } = readFileAndHash(file.path);

  const existing = await findExtractionByHashAndSession(hash, session.id);

  if (existing) {
    const parsed = JSON.parse(existing.raw_llm_response);
    return {
      deduplicated: true,
      extraction: mapLLMToResponse(parsed, existing),
      sessionId: session.id,
    };
  }

  let parsed;
  let raw;

  try {
    raw = await llmExecutor(base64, file.mimetype);
    parsed = await safeParse(raw);
  } catch (err) {
    const failed = await createExtraction({
      session_id: session.id,
      file_name: file.originalname,
      file_hash: hash,
      raw_llm_response: raw || "",
      status: "FAILED",
    });

    throw buildError(
      422,
      "LLM_JSON_PARSE_FAIL",
      "Document extraction failed after retry",
      failed.id,
    );
  }

  const extraction = await createExtraction({
    session_id: session.id,
    file_name: file.originalname,
    file_hash: hash,
    raw_llm_response: JSON.stringify(parsed),
    status: "COMPLETE",
    ...mapLLMToExtraction(parsed),
  });

  return {
    extraction: mapLLMToResponse(parsed, extraction),
    sessionId: session.id,
    deduplicated: false,
  };
};

export const processExtractionJob = async ({
  jobId,
  filePath,
  mimeType,
  session,
  fileName,
}: {
  jobId: string;
  filePath: string;
  mimeType: string;
  session: Session;
  fileName: string;
}) => {
  try {
    const { base64, hash } = readFileAndHash(filePath);

    const existing = await findExtractionByHashAndSession(hash, session.id);

    if (existing) {
      await updateJobStatus(jobId, "COMPLETE", {
        extractionId: existing.id,
      });
      return;
    }

    let parsed;
    let raw;

    try {
      raw = await llmExecutor(base64, mimeType);
      parsed = await safeParse(raw);
    } catch (err: any) {
      const failed = await createExtraction({
        session_id: session.id,
        file_name: fileName,
        file_hash: hash,
        raw_llm_response: raw || "",
        status: "FAILED",
      });

      await updateJobStatus(jobId, "FAILED", {
        extractionId: failed.id,
        error: err?.message,
      });
    }

    const extraction = await createExtraction({
      session_id: session.id,
      file_name: fileName,
      file_hash: hash,
      raw_llm_response: JSON.stringify(parsed),
      status: "COMPLETE",
      ...mapLLMToExtraction(parsed),
    });

    await updateJobStatus(jobId, "COMPLETE", {
      extractionId: extraction.id,
    });
  } catch (err: any) {
    await updateJobStatus(jobId, "FAILED", {
      error: err?.message,
    });
  }
};
