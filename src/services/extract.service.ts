import fs from "fs";
import crypto from "crypto";

import { findExtractionByHashAndSession } from "../repositories/extraction.repository";
import { createExtraction } from "../repositories/extraction.repository";
import { createSession, getSession } from "../repositories/session.repository";
import { llmExecutor } from "./llm.service";
import { safeParse } from "../util/prompt-builder";

export const extractService = async (
  file: Express.Multer.File,
  sessionId?: string,
) => {
  if (!file) throw buildError(400, "NO_FILE", "No file uploaded");

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (!allowedTypes.includes(file.mimetype)) {
    throw buildError(400, "UNSUPPORTED_FORMAT", "Unsupported file type");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw buildError(413, "FILE_TOO_LARGE", "File exceeds 10MB");
  }

  let session;

  if (sessionId) {
    session = await getSession(sessionId);
    if (!session) {
      throw buildError(404, "SESSION_NOT_FOUND", "Session not found");
    }
  } else {
    session = await createSession();
  }

  const buffer = fs.readFileSync(file.path);

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  const existing = await findExtractionByHashAndSession(hash, session.id);

  if (existing) {
    const parsed = JSON.parse(existing.raw_llm_response);
    return {
      deduplicated: true,
      extraction: mapLLMToResponse(parsed?.data, existing),
      sessionId: session.id,
    };
  }

  const base64 = buffer.toString("base64");

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
    ...mapLLMToDB(parsed?.data),
  });

  return {
    extraction: mapLLMToResponse(parsed?.data, extraction),
    sessionId: session.id,
    deduplicated: false,
  };
};

const buildError = (
  status: number,
  code: string,
  message: string,
  extractionId?: string,
) => {
  const err: any = new Error(message);
  err.status = status;
  err.code = code;
  err.extractionId = extractionId;
  return err;
};

const mapLLMToDB = (parsed: any) => {
  return {
    document_type: parsed?.detection?.documentType || null,
    applicable_role: parsed?.detection?.applicableRole || null,

    holder_name: parsed?.holder?.fullName || null,
    date_of_birth: parsed?.holder?.dateOfBirth ?? null,
    sirb_number: parsed?.holder?.sirbNumber ?? null,
    passport_number: parsed?.holder?.passportNumber ?? null,

    confidence: parsed?.detection?.confidence || null,

    fields_json: parsed?.fields || [],

    validity_json: parsed?.validity || {},

    medical_data_json: parsed?.medicalData || {},

    flags_json: parsed?.flags || [],

    is_expired: parsed?.validity?.isExpired || parsed?.isExpired || false,

    summary: parsed?.summary || null,
  };
};

const mapLLMToResponse = (parsed: any, extraction: any) => {
  return {
    id: extraction.id,
    sessionId: extraction.session_id,
    fileName: extraction.file_name,

    documentType: parsed?.detection?.documentType || null,
    documentName: parsed?.detection?.documentName || null,
    applicableRole: parsed?.detection?.applicableRole || null,
    category: parsed?.detection?.category || null,
    confidence: parsed?.detection?.confidence || null,

    holderName: parsed?.holder?.fullName || null,
    dateOfBirth: parsed?.holder?.dateOfBirth || null,
    sirbNumber: parsed?.holder?.sirbNumber || null,
    passportNumber: parsed?.holder?.passportNumber || null,

    fields: parsed?.fields || [],

    validity: {
      dateOfIssue: parsed?.validity?.dateOfIssue || null,
      dateOfExpiry: parsed?.validity?.dateOfExpiry || null,
      isExpired: parsed?.validity?.isExpired || false,
      daysUntilExpiry: parsed?.validity?.daysUntilExpiry || null,
      revalidationRequired: parsed?.validity?.revalidationRequired || false,
    },

    compliance: parsed?.compliance || {},

    medicalData: {
      fitnessResult: parsed?.medicalData?.fitnessResult || null,
      drugTestResult: parsed?.medicalData?.drugTestResult || null,
      restrictions: parsed?.medicalData?.restrictions || null,
      specialNotes: parsed?.medicalData?.specialNotes || null,
      expiryDate: parsed?.medicalData?.expiryDate || null,
    },

    flags: parsed?.flags || [],

    isExpired: parsed?.validity?.isExpired || parsed?.isExpired || false,

    processingTimeMs: extraction.processing_time_ms,

    summary: parsed?.summary || null,

    createdAt: extraction.created_at,
  };
};
