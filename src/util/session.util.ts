import { getSession, createSession } from '../repositories/session.repository';

export const resolveSession = async (sessionId?: string) => {
  if (sessionId) {
    const existing = await getSession(sessionId);
    if (existing) return existing;

    //create new if not found
    return createSession();
  }

  return createSession();
};