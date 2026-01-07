import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as contactsController from '../controllers/contactsController';

const router = Router();

// Защищенные роуты для админки
router.use(authenticateToken);
router.get('/', contactsController.getAllContacts);
router.get('/:id', contactsController.getContactById);
router.post('/', contactsController.createContact);
router.put('/:id', contactsController.updateContact);
router.delete('/:id', contactsController.deleteContact);

export default router;

