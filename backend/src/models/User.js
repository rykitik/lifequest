import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Создаем схему
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  xp: { 
    type: Number, 
    default: 0 
  },
  level: { 
    type: Number, 
    default: 1 
  }
}, { 
  timestamps: true 
});

// Хук для хеширования пароля перед сохранением
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Создаем и экспортируем модель
const User = mongoose.model('User', UserSchema);
export default User;