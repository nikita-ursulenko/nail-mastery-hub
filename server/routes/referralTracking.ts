import express from 'express';
import { trackVisit, trackRegistration } from '../controllers/referralTrackingController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Публичные роуты для отслеживания
router.post('/track-visit', asyncHandler(trackVisit));
router.post('/track-registration', asyncHandler(trackRegistration));

export default router;
