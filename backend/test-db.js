import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'ankitrmishra01@gmail.com' });
  console.log('User exists?', !!user);
  process.exit(0);
}
run();
