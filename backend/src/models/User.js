import mongoose from 'mongoose';

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

export default mongoose.model('User', UserSchema);