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

    // Sub-forums this user has explicitly joined
    // Mirrors joinedForums pattern; stays small (~10-50 entries per user)
    joinedSubForums: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubForum',
    }],

    // Sub-forums this user has muted (no notifications from these)
    mutedSubForums: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubForum',
    }],

    // Tags the user is interested in (for collab thread notifications)
    interests: [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true }
);

// Index for fast "who joined sub-forum X?" queries
userSchema.index({ joinedSubForums: 1 });
userSchema.index({ mutedSubForums: 1 });

const User = mongoose.model('User', userSchema);
export default User;
