import { Request, Response, NextFunction } from "express";

const WINDOW_SIZE_MS = 60 * 1000; // 1 min
const MAX_REQUESTS = 10;

const ipStore = new Map<string, { count: number; startTime: number }>();

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.ip) {
    return next();
  }
  const ip = req.ip;

  const now = Date.now();

  if (!ipStore.has(ip)) {
    ipStore.set(ip, { count: 1, startTime: now });
    return next();
  }

  const record = ipStore.get(ip)!;

  if (now - record.startTime > WINDOW_SIZE_MS) {
    ipStore.set(ip, { count: 1, startTime: now });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_SIZE_MS - (now - record.startTime);

    res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000));

    return res.status(429).json({
      error: "RATE_LIMITED",
      message: "Too many requests",
      retryAfterMs,
    });
  }

  record.count++;
  next();
};
