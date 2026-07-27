import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  timezone: { type: String, required: true, default: 'UTC' },
  dailyCapacityMinutes: { type: String, required: true, default: '480' },
  dailyDigestEnabled: { type: Boolean, default: false },
  themePreference: { type: String, enum: ['dark', 'light'], default: 'dark' },
  verified: { type: Boolean, default: false },
  otpExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
