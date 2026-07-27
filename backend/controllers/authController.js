import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  timezone: z.string()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
};

export const signup = async (req, res) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      if (!existingUser.verified) {
        return res.status(400).json({ error: 'User exists but is not verified. Please verify your email or resend code.' });
      }
      return res.status(400).json({ error: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      timezone: validatedData.timezone,
      verified: true
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyCapacityMinutes: user.dailyCapacityMinutes,
      dailyDigestEnabled: user.dailyDigestEnabled
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    if (user.verified) {
      return res.status(400).json({ error: 'User is already verified' });
    }
    if (!user.otp || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.verified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Verification successful, log them in
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyCapacityMinutes: user.dailyCapacityMinutes,
      dailyDigestEnabled: user.dailyDigestEnabled
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't leak user existence directly if possible, but here it's fine for signup flow
      return res.status(400).json({ error: 'User not found' });
    }
    if (user.verified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    // Rate limiting: check if OTP was sent very recently (e.g., within 30s)
    if (user.otpExpiry && (new Date(user.otpExpiry).getTime() - Date.now() > 9.5 * 60 * 1000)) {
      return res.status(429).json({ error: 'Please wait before requesting a new code' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Verify your email</h2>
        <p>Your new Daybook verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 2px; color: #FF6B47;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail({ to: user.email, subject: 'Daybook Verification Code', html });
    res.json({ message: 'OTP resent' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validatedData.email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Execute rollover logic upon login
    const today = dayjs().tz(user.timezone || 'UTC').startOf('day');
    
    const overdueTasks = await Task.find({
      userId: user._id,
      completed: false,
      dueDate: { $lt: today.format('YYYY-MM-DD') }
    });

    if (overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        task.dueDate = today.format('YYYY-MM-DD');
        task.rolloverCount += 1;
        await task.save();
      }
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyCapacityMinutes: user.dailyCapacityMinutes,
      dailyDigestEnabled: user.dailyDigestEnabled
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
};

// Forgot Password / Reset Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      user.resetPasswordToken = hash;
      user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Reset your password</h2>
          <p>You requested a password reset. Click the button below to choose a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #FF6B47; color: #0D0E12; padding: 12px 24px; text-decoration: none; border-radius: 14px; font-weight: bold; margin-top: 16px;">Reset Password</a>
          <p style="margin-top: 24px; font-size: 12px; color: #98999E;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `;

      await sendEmail({ to: user.email, subject: 'Daybook Password Reset', html });
    }

    // Always return generic success
    res.json({ message: 'If an account exists, a reset link was sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    
    // Also mark them verified if they somehow forgot password before verifying
    if (!user.verified) {
      user.verified = true;
    }

    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
