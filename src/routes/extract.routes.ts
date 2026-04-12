import express from 'express';
import multer from 'multer';
import { extractController } from '../controllers/extract.controller';

const router = express.Router();
const upload = multer({ dest: 'tmp/' });

router.post('/extract', upload.single('document'), extractController);

export default router;