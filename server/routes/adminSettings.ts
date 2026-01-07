import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateSettings,
} from '../controllers/adminSettingsController';

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.get('/', getAllSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', updateSetting);
router.put('/', updateSettings);

export default router;

