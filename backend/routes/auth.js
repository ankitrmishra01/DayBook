import express from 'express';
import { 
  signup, login, logout, 
  verifyOtp, resendOtp, 
  forgotPassword, resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
