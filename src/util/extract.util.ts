import { Extraction, ExtractionResponse } from "../types/extraction.types";

export const mapLLMToExtraction = (response: any): Partial<Extraction> => {
    const parsed = response?.data ? response.data : response;
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

export const mapLLMToResponse = (response: any, extraction: any): ExtractionResponse => {
    const parsed = response?.data ? response.data : response;
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