import { Extraction, ValidationResult } from "../types/extraction.types";
import { groupBy } from "../util/misc";

export const buildReport = ({
  sessionId,
  extractions,
  validation,
}: {
  sessionId: string;
  extractions: Extraction[],
  validation: ValidationResult
}) => {
  const primary = extractions[0];

  const candidate = {
    name: primary?.holder_name ?? null,
    dateOfBirth: primary?.date_of_birth ?? null,
    sirbNumber: primary?.sirb_number ?? null,
    passportNumber: primary?.passport_number ?? null,
  };

  const documents = {
    total: extractions.length,

    byType: groupBy(extractions, 'document_type'),

    expired: extractions.filter((e) => e.is_expired),

    expiringSoon: extractions.filter((e) => {
      const expiry = e.validity_json?.dateOfExpiry;
      if (!expiry) return false;

      const days =
        (new Date(expiry).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24);

      return days < 30;
    }),
  };

  const compliance = {
    missingDocuments: validation?.missingDocuments ?? [],
    consistencyChecks: validation?.consistencyChecks ?? [],
    medicalFlags: validation?.medicalFlags ?? [],
  };

  const riskSummary = {
    highRiskFlags: (validation?.medicalFlags ?? []).filter(
      (f) => f.severity === 'HIGH'
    ),

    missingCriticalDocs: (validation?.missingDocuments ?? []).filter(
      (d) => d.importance === 'CRITICAL'
    ),

    expiredDocs: documents.expired.map((d) => d.document_type),
  };

  const decision = {
    status: validation?.overallStatus ?? 'CONDITIONAL',
    score: validation?.overallScore ?? 0,
    summary: validation?.summary ?? '',
    recommendations: validation?.recommendations ?? [],
  };

  return {
    sessionId,
    candidate,
    documents,
    compliance,
    riskSummary,
    decision,
    generatedAt: new Date().toISOString(),
  };
};