import mongoose from 'mongoose';

const { Schema } = mongoose;

const QuestSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['daily', 'habit', 'challenge', 'gate', 'social'], 
    required: true 
  },
  xp: { type: Number, default: 10 },
  completed: { type: Boolean, default: false },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quest', QuestSchema);