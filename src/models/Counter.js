import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { collection: 'counters', timestamps: false });

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
export default Counter;
export { Counter };
