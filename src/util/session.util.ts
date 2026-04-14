import { getSession, createSession } from "../repositories/session.repository";
import { Session } from "../types/extraction.types";
import { buildError, isUUID } from "./misc";

export const resolveSession = async (sessionId?: string): Promise<Session> => {
  if (sessionId) {
    if (!isUUID(sessionId)) {
      throw buildError(404, "SESSION_NOT_FOUND", "Session ID does not exist");
    }
    const existing = await getSession(sessionId);
    if (existing) return existing;

    return createSession();
  }

  return createSession();
};
