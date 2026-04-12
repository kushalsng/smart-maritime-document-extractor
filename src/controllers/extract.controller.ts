import { Request, Response } from 'express';
import { extractService } from '../services/extract.service';

export const extractController = async (req: Request, res: Response) => {
  try {
    const result = await extractService(req.file);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};