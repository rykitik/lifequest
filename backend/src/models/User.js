import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Автоматическое удаление пробелов
    maxlength: [30, 'Имя пользователя не может превышать 30 символов']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Пожалуйста, введите корректный email']
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Пароль должен быть не менее 6 символов'],
    select: false
  },
  xp: { 
    type: Number, 
    default: 0,
    min: 0
  },
  level: { 
    type: Number, 
    default: 1,
    min: 1,
    max: 100
  },
  refreshToken: {
    type: String,
    select: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  tokenIssuedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Виртуальное поле для отображения прогресса уровня
UserSchema.virtual('progress').get(function() {
  return this.xp % 100;
});

// Хук для хеширования пароля
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    console.warn('comparePassword вызван без загруженного пароля');
    return false;
  }
  console.log("candidatePassword: ", candidatePassword, " password: ", this.password, "bcrypt",  await bcrypt.compare(candidatePassword, this.password) );
  
  return await bcrypt.compare(candidatePassword, this.password);
};

// Метод для генерации JWT токена
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { userId: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

// Метод для обновления времени последней активности
UserSchema.methods.updateLastActive = async function() {
  this.lastActive = Date.now();
  await this.save();
};

// Статический метод для поиска по email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password +refreshToken');
};

const User = mongoose.model('User', UserSchema);
export default User;