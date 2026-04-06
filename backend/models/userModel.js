import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^[A-Z0-9._%+-]+@iitdh\.ac\.in$/i, 'Only iitdh.ac.in emails are allowed'],
    },
    name: { type: String, required: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['student', 'alumni', 'admin'],
      default: 'student',
    },
    graduationYear: { type: Number },
    branch: { type: String },
    company: { type: String },
    designation: { type: String },
    bio: { type: String, maxlength: 500 },
    linkedin: { type: String },
    github: { type: String },
    isVerified: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    joinedForums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Forum',
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
