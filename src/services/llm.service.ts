import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildExtractionPrompt } from "../util/prompt-builder";
import { timeout } from "../util/misc";

const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY!);

const model = genAI.getGenerativeModel({
  model: process.env.LLM_MODEL || "gemini-2.0-flash",
});

// ------------------------------
// MAIN CALL
// ------------------------------
export const llmExecutor = async (
  base64: string,
  mimeType: string,
  fileName?: string,
): Promise<any> => {
  const raw = await callLLMWithTimeout(base64, mimeType);

  const parsed = await safeParse(raw);

  // LOW confidence retry
  if (parsed?.detection?.confidence === "LOW") {
    const retryRaw = await retryWithHints(base64, mimeType, fileName);
    return safeParse(retryRaw);
  }

  return parsed;
};

const callLLMWithTimeout = async (
  base64: string,
  mimeType: string,
): Promise<string> => {
  return Promise.race([
    callLLM(base64, mimeType),
    timeout(30000),
  ]) as Promise<string>;
};

const callLLM = async (
  base64: string,
  mimeType: string,
): Promise<string> => {
  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType,
      },
    },
    {
      text: buildExtractionPrompt(),
    },
  ]);

  const response = await result.response;
  return response.text();
};

const safeParse = async (text: string): Promise<any> => {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = extractJSON(text);

    try {
      return JSON.parse(cleaned);
    } catch {
      return repairJSON(text);
    }
  }
};

const extractJSON = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return text.slice(start, end + 1);
};

const repairJSON = async (badText: string) => {
  const repairPrompt = `
Fix this JSON and return ONLY valid JSON:

${badText}
`;

  const result = await model.generateContent(repairPrompt);
  const response = await result.response;

  return JSON.parse(extractJSON(response.text()));
};

const retryWithHints = async (
  base64: string,
  mimeType: string,
  fileName?: string,
) => {
  const retryPrompt = `
Previous extraction had LOW confidence.

File name: ${fileName}
Mime type: ${mimeType}

Retry extraction carefully.
`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType,
      },
    },
    {
      text: retryPrompt,
    },
  ]);

  const response = await result.response;
  return response.text();
};
