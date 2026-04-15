import crypto from "crypto";
import axios from "axios";

export const sendWebhook = async (
  url: string,
  payload: {
    jobId: string;
    status: string;
    extractionId?: string;
    sessionId?: string;
    error?: string
  },
) => {
  const secret = process.env.WEBHOOK_SECRET || "dev-secret";

  const signature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  await axios.post(url, payload, {
    headers: {
      "X-Signature": signature,
      "Content-Type": "application/json",
    },
    timeout: 5000,
  });
};
