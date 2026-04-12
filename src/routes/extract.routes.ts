import express from 'express';
import multer from 'multer';
import { extractController } from '../controllers/extract.controller';
import { getJobController } from '../controllers/job.controller';
import { getSessionController } from '../controllers/session.controller';

const router = express.Router();
const upload = multer({ dest: 'tmp/' });

router.post('/extract', upload.single('document'), extractController);
router.get('/jobs/:jobId', getJobController);
router.get('/sessions/:sessionId', getSessionController);

export default router;