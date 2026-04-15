import { llmExecutor } from "../services/llm.service";
import { Extraction } from "../types/extraction.types";

export const buildValidationPrompt = (documents: Extraction[]) => {
  return `
You are a senior maritime compliance auditor.

You are given multiple extracted maritime documents for a single seafarer.

Your task is to perform a STRICT compliance assessment.

INPUT DOCUMENTS:
${JSON.stringify(documents, null, 2)}

Perform the following:

1. Identity Consistency:
- Check if name, DOB, passport, SIRB match across documents

2. Missing Documents:
- Identify required documents based on detected role (DECK/ENGINE)

3. Expiry Risk:
- Identify expired or expiring documents (within 90 days)

4. Medical Compliance:
- Evaluate fitness, drug test, and medical risks

5. Flag Analysis:
- Consider CRITICAL, HIGH severity flags seriously

---

Return ONLY valid JSON in this exact structure:

{
  "holderProfile": {
    "fullName": "",
    "dateOfBirth": "",
    "nationality": "",
    "detectedRole": ""
  },
  "consistencyChecks": [
    {
      "field": "",
      "status": "CONSISTENT | INCONSISTENT",
      "details": ""
    }
  ],
  "missingDocuments": [
    {
      "documentType": "",
      "reason": ""
    }
  ],
  "expiringDocuments": [
    {
      "documentType": "",
      "expiryDate": "",
      "daysRemaining": 0
    }
  ],
  "medicalFlags": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "message": ""
    }
  ],
  "overallStatus": "APPROVED | CONDITIONAL | REJECTED",
  "overallScore": 0,
  "summary": "",
  "recommendations": []
}

STRICT RULES:
- Do NOT include explanations outside JSON
- Do NOT hallucinate missing data
- If unsure, mark as UNKNOWN
`;
};

export const buildExtractionPrompt = () => `
You are an expert maritime document analyst with deep knowledge of STCW, MARINA, IMO, and international seafarer certification standards.

A document has been provided. Perform the following in a single pass:
1. IDENTIFY the document type from the taxonomy below
2. DETERMINE if this belongs to a DECK officer, ENGINE officer, BOTH, or is role-agnostic (N/A)
3. EXTRACT all fields that are meaningful for this specific document type
4. FLAG any compliance issues, anomalies, or concerns

Document type taxonomy (use these exact codes):
COC | COP_BT | COP_PSCRB | COP_AFF | COP_MEFA | COP_MECA | COP_SSO | COP_SDSD |
ECDIS_GENERIC | ECDIS_TYPE | SIRB | PASSPORT | PEME | DRUG_TEST | YELLOW_FEVER |
ERM | MARPOL | SULPHUR_CAP | BALLAST_WATER | HATCH_COVER | BRM_SSBT |
TRAIN_TRAINER | HAZMAT | FLAG_STATE | OTHER

Return ONLY a valid JSON object. No markdown. No code fences. No preamble.

{
  "detection": {
    "documentType": "SHORT_CODE",
    "documentName": "Full human-readable document name",
    "category": "IDENTITY | CERTIFICATION | STCW_ENDORSEMENT | MEDICAL | TRAINING | FLAG_STATE | OTHER",
    "applicableRole": "DECK | ENGINE | BOTH | N/A",
    "isRequired": true,
    "confidence": "HIGH | MEDIUM | LOW",
    "detectionReason": "One sentence explaining how you identified this document"
  },
  "holder": {
    "fullName": "string or null",
    "dateOfBirth": "DD/MM/YYYY or null",
    "nationality": "string or null",
    "passportNumber": "string or null",
    "sirbNumber": "string or null",
    "rank": "string or null",
    "photo": "PRESENT | ABSENT"
  },
  "fields": [
    {
      "key": "snake_case_key",
      "label": "Human-readable label",
      "value": "extracted value as string",
      "importance": "CRITICAL | HIGH | MEDIUM | LOW",
      "status": "OK | EXPIRED | WARNING | MISSING | N/A"
    }
  ],
  "validity": {
    "dateOfIssue": "string or null",
    "dateOfExpiry": "string | 'No Expiry' | 'Lifetime' | null",
    "isExpired": false,
    "daysUntilExpiry": null,
    "revalidationRequired": null
  },
  "compliance": {
    "issuingAuthority": "string",
    "regulationReference": "e.g. STCW Reg VI/1 or null",
    "imoModelCourse": "e.g. IMO 1.22 or null",
    "recognizedAuthority": true,
    "limitations": "string or null"
  },
  "medicalData": {
    "fitnessResult": "FIT | UNFIT | N/A",
    "drugTestResult": "NEGATIVE | POSITIVE | N/A",
    "restrictions": "string or null",
    "specialNotes": "string or null",
    "expiryDate": "string or null"
  },
  "flags": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "message": "Description of issue or concern"
    }
  ],
  "summary": "Two-sentence plain English summary of what this document confirms about the holder."
}
`;

export const buildRetryPrompt = (
  raw: string,
  mimeType: string,
  fileName?: string,
) => `
This extraction had LOW confidence.

File name: ${fileName}
Mime type: ${mimeType}

Retry extraction carefully.
`;

const extractJSON = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON found");
  }

  return text.slice(start, end + 1);
};

// returns any type as we are not sure what 
// type of response is generated by LLM
export const safeParse = async (raw: string) => {
  try {
    const cleaned = extractJSON(raw);
    return JSON.parse(cleaned);
  } catch {
    throw new Error("PARSE_FAILED");
  }
};

export const safeParseRawPrompt = async (raw: string) => {
  try {
    const cleaned = extractJSON(raw);
    return JSON.parse(cleaned);
  } catch {
    const repairPrompt = `
      Fix this JSON. Return ONLY valid JSON.

      ${raw}
      `;
    const repaired = await llmExecutor(repairPrompt, "text/plain");

    const cleaned = extractJSON(repaired);

    return JSON.parse(cleaned);
  }
};
