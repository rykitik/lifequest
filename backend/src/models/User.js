import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    tokenIssuedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'suspended', 'banned'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
  },
);

userSchema.virtual('progress').get(function getProgress() {
  return this.xp % 100;
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email }).select('+password +refreshToken');
};

const User = mongoose.model('User', userSchema);

export default User;
