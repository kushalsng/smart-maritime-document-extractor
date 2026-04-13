import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { extractController } from '../controllers/extract.controller';
import { getJobController } from '../controllers/job.controller';
import { getSessionController } from '../controllers/session.controller';
import { validateSessionController } from '../controllers/validation.controller';

const router = express.Router();
const tmpDir = path.join(process.cwd(), 'tmp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
router.post('/extract', upload.single('document'), extractController);
router.get('/jobs/:jobId', getJobController);
router.get('/sessions/:sessionId', getSessionController);
router.post('/sessions/:sessionId/validate', validateSessionController);

export default router;