import express from 'express';
import { getMe, updateMe } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/me')
  .get(protect, getMe)
  .patch(protect, updateMe);

export default router;
